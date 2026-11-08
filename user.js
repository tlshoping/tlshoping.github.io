async function get_user(UserPickupPointsData) {
    try {
        const json_user_key_data = await shopApi('get-user', { bot_id, secret_key: secretKey }, {
            validate: value => Boolean(value.data?.id && value.data?.secret_key)
        });
        user_data = json_user_key_data;
        userId = user_data.data.id;
        const hasSavedAddress = Boolean(user_data?.data?.address);
        if (hasSavedAddress) {
            editAddressHeader(user_data.data.address, user_data.data.adress_description);
            userCoords = `${user_data.data.latitude} ${user_data.data.longitude}`;
            centerCords = [Number(user_data.data.longitude), Number(user_data.data.latitude)];
        }
        profile_manag();
        pickupPointsManage(UserPickupPointsData);
        loading.classList.add('hide');
        await get_basket();
        if (!hasSavedAddress) {
            addressNotification.classList.add('show');
            requestGeolocation();
        } else {
            // Show shops and profile first; route refinement is not on the startup critical path.
            const savedCoords = userCoords;
            const refine = () => {
                if (document.hidden || userCoords !== savedCoords) return;
                getNearestPoint(user_data.data.longitude, user_data.data.latitude);
            };
            if (window.requestIdleCallback) window.requestIdleCallback(refine, { timeout: 2500 });
            else setTimeout(refine, 1200);
        };
    } catch (error) {
        showShopFailure(error, () => get_user(UserPickupPointsData),
            error.status === 401 || error.status === 403 || error.status === 404
                ? 'Не удалось подтвердить доступ. Откройте магазин заново через своего бота.'
                : 'Не удалось загрузить профиль. Проверьте связь и повторите загрузку.');
    } finally {
        loading.classList.add('hide');
    }
};

let userUpdateQueue = Promise.resolve();
function updateUser(adressDescription, address, coords, phoneNumber) {
    const postData = {
        bot_id: bot_id,
        secret_key: user_data.data.secret_key,
        adress_description: adressDescription,
        address: address,
        coords: coords,
        phone_number: phoneNumber
    }
    userUpdateQueue = userUpdateQueue.then(async () => {
        try {
            await shopApi('update-user', postData);
            if (address) user_data.data.address = address;
            if (phoneNumber) user_data.data.phone_number = phoneNumber;
        } catch (error) {
            showShopFailure(error, null, 'Не удалось подтвердить сохранение данных. Проверьте их перед оформлением.');
        }
    });
    return userUpdateQueue;
}

