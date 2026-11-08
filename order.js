async function pollShadowOrderApproval(orderId) {
    while (true) {
        if (document.hidden || navigator.onLine === false) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
        }
        try {
            const response = await fetch(`https://${apiUrl}/api/V2/order-shadow-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    botId: bot_id,
                    secretKey: secretKey,
                    orderId: orderId
                })
            });

            if (response.ok) {
                const payload = await response.json();
                if (payload?.data?.shadowStatus === 'approved' && payload?.data?.shadowMode === false) {
                    window.close();
                    Telegram.WebApp.close();
                    return;
                }
            }
        } catch (error) {
            console.error('Error while polling shadow order:', error);
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
    }
}

let orderRequestActive = false;
let orderResultUncertain = false;
async function createOrder() {
    if (orderRequestActive) return;
    if (orderResultUncertain) {
        showShopNotice('Ответ на оформление потерян. Проверьте историю заказов или сообщения бота перед повторной покупкой.');
        return;
    }
    orderRequestActive = true;
    payBut.setAttribute('aria-disabled', 'true');
    let submitted = false;
    try {
        await cartWriteQueue;
        await userUpdateQueue;
        const currentCart = await get_basket({ reconcile: true });
        if (!currentCart?.items?.length) {
            showShopNotice('Не удалось подтвердить содержимое корзины. Обновите её перед оформлением.', () => get_basket({ reconcile: true }));
            return;
        }
        const postData = {
            botId: bot_id,
            secretKey: secretKey,
            method: formData.method,
            address: userAddress || null,
            apartment: formData.apartment || null,
            entrance: formData.entrance || null,
            floor: formData.floor || null,
            doorphone: formData.doorphone || null,
            comment: formData.comment || null,
            phone: formData.phone,
            telegram: formData.telegram || null,
            payment: formData.payment,
            bonuses: formData.bonuses,
            icoDateDelivery: formData.icoDateDelivery,
            icoDatePickup: formData.icoDatePickup,
            deliveryPrice: parseFloat(selectedPickupPointData.delivery_price)
                || parseFloat(basketMainList.deliveryDiscountedPrice)
                || 0,
            coords: userCoords || null,
            source: 'bot'
        }

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        loading.classList.remove('hide');
        submitted = true;
        const response = await fetch(`https://${apiUrl}/api/V2/create-order`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postData)
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status >= 500) orderResultUncertain = true;
            if (payload?.code === 'DELIVERY_PAYMENT_CHANGED') {
                await createHours(
                    { delivery: basketMainList.deliveryHours, pickup: basketMainList.workingHours },
                    new Date(), formData.icoDateDelivery, 'delivery',
                    basketMainList.pickupPointId, basketMainList.reservationInterval
                );
            }
            throw new Error(payload?.error || 'Ошибка оформления заказа');
        }
        if (!payload?.orderId) {
            orderResultUncertain = true;
            throw new Error('Сервер не подтвердил номер заказа');
        }

        if (payload?.shadowMode && payload?.orderId) {
            await pollShadowOrderApproval(payload.orderId);
            return;
        }

        window.close();
        Telegram.WebApp.close();

    } catch (error) {
        if (submitted && ['NETWORK', 'TIMEOUT'].includes(error.code)) orderResultUncertain = true;
        showShopFailure(error, null, orderResultUncertain
            ? 'Ответ на оформление потерян. Заказ мог быть создан: проверьте историю или сообщения бота. Автоповтора не будет.'
            : error.message || 'Не удалось оформить заказ. Проверьте данные.');
    } finally {
        orderRequestActive = false;
        payBut.setAttribute('aria-disabled', String(orderResultUncertain));
        loading.classList.add('hide');
    }
}
