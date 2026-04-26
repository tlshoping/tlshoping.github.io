async function createOrder() {
    try {

        const postData = {
            botId: 0,
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
        }

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const response = await fetch(`https://${apiUrl}/api/V2/create-order`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postData)
        });

        console.log(response);

        window.close();
        Telegram.WebApp.close();

    } catch (error) {
        console.error('Error:', error);
    }
}