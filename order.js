async function pollShadowOrderApproval(orderId) {
    while (true) {
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

async function createOrder() {
    try {

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

        const response = await fetch(`https://${apiUrl}/api/V2/create-order`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postData)
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(payload?.error || 'Ошибка оформления заказа');
        }

        if (payload?.shadowMode && payload?.orderId) {
            await pollShadowOrderApproval(payload.orderId);
            return;
        }

        window.close();
        Telegram.WebApp.close();

    } catch (error) {
        console.error('Error:', error);
    }
}
