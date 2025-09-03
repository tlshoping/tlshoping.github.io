function get_user(UserPickupPointsData) {

    ymaps.ready(init);

    const post_user_keyData = {
        bot_id: 0,
        secret_key: secretKey
    };
    let my_user_keyHeaders = new Headers();
    my_user_keyHeaders.append('Content-Type', 'application/json');
    fetch('https://tl-shop.click/api/V2/get-user', {
        method: 'POST',
        headers: my_user_keyHeaders,
        body: JSON.stringify(post_user_keyData),
    }).then((user_key_data) => {
        return user_key_data.json();
    }).then((json_user_key_data) => {
        user_data = json_user_key_data;
        userId = user_data.data.id;
        if (!user_data.data.address) {
            addressNotification.classList.add('show');
            requestGeolocation();
        } else {
            editAddressHeader(user_data.data.address, user_data.data.adress_description);
            setMapCenter(user_data.data.longitude, user_data.data.latitude);
            getNearestPoint(user_data.data.longitude, user_data.data.latitude);
            userCoords = `${user_data.data.latitude} ${user_data.data.longitude}`;
        };
    }).then(() => {
        profile_manag();
        pickupPointsManage(UserPickupPointsData);
    });
};

function updateUser(adressDescription, address, coords, phoneNumber) {
    const postData = {
        bot_id: 0,
        secret_key: user_data.data.secret_key,
        adress_description: adressDescription,
        address: address,
        coords: coords,
        phone_number: phoneNumber
    }
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    fetch('https://tl-shop.click/api/V2/update-user', {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(postData),
    }).then((data) => {
        return data.json();
    }).then((json_data) => {
    });
}

