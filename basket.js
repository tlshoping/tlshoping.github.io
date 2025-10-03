async function get_basket() {
    const post_get_basketData = {
        bot_id: 0,
        user_secret_key: user_data.data.secret_key
    };
    let my_get_basketHeaders = new Headers();
    my_get_basketHeaders.append('Content-Type', 'application/json');
    try {
        const response = await fetch('https://tl-shop.click/api/V2/get-cart', {
            method: 'POST',
            headers: my_get_basketHeaders,
            body: JSON.stringify(post_get_basketData),
        })

        const jsonData = await response.json();

        basketMainList = jsonData.data;
        create_basket(jsonData.data);
        loading.classList.add('hide');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function addProduct(product_id, pickupPointId) { // добавить 1 товар в корзину
    const post_add_productData = {
        bot_id: 0,
        user_secret_key: user_data.data.secret_key,
        catalog_id: product_id,
        pickup_point_id: pickupPointId,
        count: 1
    };
    let my_add_productHeaders = new Headers();
    my_add_productHeaders.append('Content-Type', 'application/json');

    try {
        const response = await fetch('https://tl-shop.click/api/V2/cart-add', {
            method: 'POST',
            headers: my_add_productHeaders,
            body: JSON.stringify(post_add_productData),
        });

        const jsonData = await response.json();

        basketMainList = jsonData.data;
        create_basket(jsonData.data);

        return jsonData.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function removeProduct(product_id, pickupPointId) { // убрать 1 товар из корзины
    const postData = {
        bot_id: 0,
        user_secret_key: user_data.data.secret_key,
        catalog_id: product_id,
        pickup_point_id: pickupPointId,
        count: 1
    };
    let my_add_productHeaders = new Headers();
    my_add_productHeaders.append('Content-Type', 'application/json');

    try {
        const response = await fetch('https://tl-shop.click/api/V2/cart-remove', {
            method: 'POST',
            headers: my_add_productHeaders,
            body: JSON.stringify(postData),
        });

        const jsonData = await response.json();

        basketMainList = jsonData.data;
        create_basket(jsonData.data);

        return jsonData.data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

function delete_all_product() { // уброать все товары из корзины
    const post_delete_all_productData = {
        bot_id: bot_id,
        user_secret_key: user_data.data.secret_key
    };
    let my_delete_all_productHeaders = new Headers();
    my_delete_all_productHeaders.append('Content-Type', 'application/json');
    fetch('https://tl-shop.click/api/V2/remove-all-cart', {
        method: 'POST',
        headers: my_delete_all_productHeaders,
        body: JSON.stringify(post_delete_all_productData),
    }).then((data) => {
        return data.json();
    }).then((jsonData) => {
        basketMainList = jsonData.data;
        create_basket(jsonData.data);
    });
};

deleteAllProducts.addEventListener('click', () => {
    delete_all_product();
});

async function getAllStopHours(pickupPointId, method) {
    try {

        const postData = {
            bot_id: 0,
            pickupPointId: pickupPointId,
            method: method
        };
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        const response = await fetch('https://tl-shop.click/api/V2/get-stop', {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(postData),
        });
        const jsonData = await response.json();
        return jsonData.data;

    } catch (err) {
        console.error('Ошибка:', err);
    };
}

function cartManagement(pickupPointData) { //Манипуляция количеством в корзине из каталога
    let product = document.getElementsByClassName('product');
    let cartProduct = document.getElementsByClassName('cart_product');
    for (let i = 0; i < product.length; i++) {
        let addNone = product[i].getElementsByClassName('add_none_text')[0];
        let minus = product[i].getElementsByClassName('minus')[0];
        let plus = product[i].getElementsByClassName('plus')[0];
        let cartAddNone = cartProduct[i].getElementsByClassName('cart_add_none_text')[0];
        let cartMinus = cartProduct[i].getElementsByClassName('cart_minus')[0];
        let cartPlus = cartProduct[i].getElementsByClassName('cart_plus')[0];

        addNone.addEventListener('click', async () => {
            editProductCount(await addProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
        cartAddNone.addEventListener('click', async () => {
            editProductCount(await addProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
        plus.addEventListener('click', async () => {
            editProductCount(await addProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
        cartPlus.addEventListener('click', async () => {
            editProductCount(await addProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
        minus.addEventListener('click', async () => {
            editProductCount(await removeProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
        cartMinus.addEventListener('click', async () => {
            editProductCount(await removeProduct(product[i].id, pickupPointData.id), pickupPointData);
        });
    };
};

function basketCartManagement(basket_list) { //Манипуляция количеством в корзине из корзины
    let products = document.getElementsByClassName('basket_product');
    for (let i = 0; i < products.length; i++) {
        let minus = products[i].getElementsByClassName('basket_product_minus')[0];
        let plus = products[i].getElementsByClassName('basket_product_plus')[0];
        plus.addEventListener('click', async () => {
            await addProduct(products[i].id.split('_')[1], basket_list.pickupPointId);
        });
        minus.addEventListener('click', async () => {
            await removeProduct(products[i].id.split('_')[1], basket_list.pickupPointId);
        });
    };
};

function editCartProductCount(basket_list) {
    for (let i = 0; i < basket_list.items.length; i++) {
        let cartProduct = document.getElementById(`basket_${basket_list.items[i].catalog_id}`);
        if (basket_list.items[i].available_count <= basket_list.items[i].count) {
            cartProduct.getElementsByClassName('basket_product_plus')[0].classList.add('disactive');
        }
    };
};

async function create_basket(basket_list) { //Генерация корзины
    console.log('Вызов функции create_basket() выполнен!');
    let basket_product = document.getElementsByClassName('basket_product');
    for (let i = 0; i < basket_product.length;) {
        basket_product[0].remove();
    };
    let basket_empty = document.getElementsByClassName('basket_empty')[0];
    let basket_full = document.getElementsByClassName('basket_full')[0];
    let basket_product_list = document.getElementsByClassName('basket_product_list')[0];

    console.log(basket_list);

    if (basket_list['items'].length > 0) {

        selectedPickupPointData = getPickupPointDataById(basket_list.pickupPointId);

        basketCount.classList.remove('hide');
        basketCount.innerHTML = basket_list.countItems;
        basketAdress.innerHTML = basket_list.pickupPointTitle + ' - ' + basket_list.pickupPointAddress;

        basket_empty.classList.add('hide');
        basket_full.classList.remove('hide');
        for (let i = 0; i < basket_list['items'].length; i++) {
            let basket_product = document.createElement('article');
            basket_product_list.append(basket_product);
            basket_product.outerHTML = `
                    <article class="basket_product" id="basket_${parseInt(basket_list['items'][i]['catalog_id'])}">
                        <div class="container">
                            <img src="${url + basket_list['items'][i]['image200']}" class="basket_product_img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;">
                        </div>
                        <div class="basket_product_info">
                            <p class="basket_product_name">${basket_list['items'][i]['title']}</p>
                            <div class="basket_product_price_info">
                                <p class="basket_product_price">${basket_list['items'][i]['price']} ₽</p>
                            </div>
                            <svg class="basket_product_trash" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.9375 28C8.21563 28 7.59744 27.7387 7.08294 27.216C6.56844 26.6933 6.31163 26.0658 6.3125 25.3333V8H6C5.44772 8 5 7.55228 5 7C5 6.44772 5.44772 6 6 6H11.5625V5C11.5625 4.44772 12.0102 4 12.5625 4H18.4375C18.9898 4 19.4375 4.44772 19.4375 5V6H25C25.5523 6 26 6.44772 26 7C26 7.55228 25.5523 8 25 8H24.6875V25.3333C24.6875 26.0667 24.4303 26.6947 23.9158 27.2173C23.4013 27.74 22.7835 28.0009 22.0625 28H8.9375ZM22.7158 8H8.5V26L22.7158 26V8ZM12 21.6667C12 22.219 12.4477 22.6667 13 22.6667C13.5523 22.6667 14 22.219 14 21.6667V11.6667C14 11.1144 13.5523 10.6667 13 10.6667C12.4477 10.6667 12 11.1144 12 11.6667V21.6667ZM17 21.6667C17 22.219 17.4477 22.6667 18 22.6667C18.5523 22.6667 19 22.219 19 21.6667V11.6667C19 11.1144 18.5523 10.6667 18 10.6667C17.4477 10.6667 17 11.1144 17 11.6667V21.6667Z" fill="#454545"/>
                            </svg>
                            <div class="basket_product_count hide">${basket_list['items'][i]['available_count']}</div>
                            <div class="basket_product_add">
                                <svg class="basket_product_minus" width="14" height="2" viewBox="0 0 14 2"
                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1H13" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                </svg>
                                <p class="basket_product_add_text">${basket_list['items'][i]['count']}</p>
                                <svg class="basket_product_plus" width="14" height="14" viewBox="0 0 14 14" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                    <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                                </svg>
                            </div>
                        </div>
                    </article>
                    `;
        };

        if (basket_list.methodDelivery) {
            methodDelivery.classList.remove('hide');
            if (!formData.method) {
                formData.method = 'delivery';
            }
            if (!basket_list.methodPickup) {
                changeMethodToDelivery();
            }
        } else {
            methodDelivery.classList.add('hide');
            methodToggle.getElementsByClassName('method')[1].classList.add('method_selected');
            formData.method = 'pickup';
        }

        if (basket_list.methodPickup) {
            methodPickup.classList.remove('hide');
            if (!formData.method) {
                formData.method = 'pickup';
            }
            if (!basket_list.methodDelivery) {
                changeMethodToPickup();
            }
        } else {
            methodPickup.classList.add('hide');
            methodToggle.getElementsByClassName('method')[0].classList.add('method_selected');
            formData.method = 'delivery';
        };

        formUserAdress.innerHTML = userAddress ?? 'Укажите адрес';
        formShopAdress.innerHTML = basket_list.pickupPointTitle + ' - ' + basket_list.pickupPointAddress;

        function createInputs(
            addressApartment,
            addressEntrance,
            addressFloor,
            addressDoorphone,
            phoneNumber,
            telegram,
            comment,
            method,
            payment,
            bonuses,
            dayPickup,
            dayDelivery) {
            if (addressApartment) {
                inputApartment.value = addressApartment;
                formData.apartment = addressApartment;
                labelApartment.classList.add('text_active');
            };
            if (addressEntrance) {
                inputEntrance.value = addressEntrance;
                formData.entrance = addressEntrance;
                labelEntrance.classList.add('text_active');
            };
            if (addressFloor) {
                inputFloor.value = addressFloor;
                formData.floor = addressFloor;
                labelFloor.classList.add('text_active');
            };
            if (addressDoorphone) {
                inputDoorphone.value = addressDoorphone;
                formData.doorphone = addressDoorphone;
                labelDoorphone.classList.add('text_active');
            };
            if (phoneNumber) {
                inputPhone.value = phoneNumber;
                formData.phone = phoneNumber;
                labelPhone.classList.add('text_active');
            };
            if (telegram) {
                inputTelegram.value = telegram;
                formData.telegram = telegram;
                labelTelegram.classList.add('text_active');
            };
            if (comment) {
                textareaComment.value = comment;
                formData.comment = comment;
                labelComment.classList.add('text_active');
            };
            if (method) {
                if (method === 'pickup') {
                    methodPickup.classList.add('method_selected');
                    methodDelivery.classList.remove('method_selected');
                } else if (method === 'delivery') {
                    methodPickup.classList.remove('method_selected');
                    methodDelivery.classList.add('method_selected');
                };
            } else {
                methodPickup.classList.remove('method_selected');
                methodDelivery.classList.add('method_selected');
                formData.method = 'delivery';
            }
            if (payment) {
                if (method === 'pickup') {
                    online.classList.add('hide');
                    transfer.classList.remove('hide');
                    cash.classList.remove('hide');
                    if (payment === 'transfer') {
                        cash.classList.remove('hour_active');
                        transfer.classList.add('hour_active');
                        online.classList.remove('hour_active');
                    } else if (payment === 'cash') {
                        cash.classList.add('hour_active');
                        transfer.classList.remove('hour_active');
                        online.classList.remove('hour_active');
                    } else {
                        cash.classList.remove('hour_active');
                        transfer.classList.add('hour_active');
                        online.classList.remove('hour_active');
                        formData.payment = 'transfer';
                    };
                } else if (method === 'delivery') {
                    online.classList.remove('hide');
                    transfer.classList.add('hide');
                    cash.classList.add('hide');
                    cash.classList.remove('hour_active');
                    transfer.classList.remove('hour_active');
                    online.classList.add('hour_active');
                    formData.payment = 'online';
                }
            } else {
                if (method === 'pickup') {
                    cash.classList.remove('hour_active');
                    transfer.classList.add('hour_active');
                    formData.payment = 'transfer';
                } else if (method === 'delivery') {
                    cash.classList.remove('hour_active');
                    transfer.classList.remove('hour_active');
                    online.classList.add('hour_active');
                    formData.payment = 'online';
                }
            }
            if (bonuses !== null) {
                if (bonuses) {
                    bonusesOn.classList.remove('hide');
                    bonusesOff.classList.add('hide');
                } else {
                    bonusesOn.classList.add('hide');
                    bonusesOff.classList.remove('hide');
                }
            } else {
                bonusesOn.classList.add('hide');
                bonusesOff.classList.remove('hide');
                formData.bonuses = false;
            };
            if (dayPickup) {
                dateFormDayTextPickup.textContent = dayPickup;
            };
            if (dayDelivery) {
                dateFormDayTextDelivery.textContent = dayDelivery;
            };
        }

        createInputs(
            formData.apartment ?? basket_list.addressApartment ?? null,
            formData.entrance ?? basket_list.addressEntrance ?? null,
            formData.floor ?? basket_list.addressFloor ?? null,
            formData.doorphone ?? basket_list.addressDoorphone ?? null,
            formData.phone ?? basket_list.phoneNumber ?? null,
            formData.telegram ?? basket_list.inputTelegram ?? user_data.data.nickname ?? null,
            formData.comment ?? null,
            formData.method ?? null,
            formData.payment ?? null,
            formData.bonuses ?? null,
            formData.dayPickup ?? null,
            formData.dayDelivery ?? null
        );

        try {

            if (dateSelectionDelivery.classList.contains('hide')) {
                await createHours(
                    basket_list.deliveryHours,
                    new Date,
                    formData.icoDateDelivery ?? new Date,
                    'delivery',
                    basket_list.pickupPointId,
                    basket_list.reservationInterval
                );
            }
            if (dateSelectionPickup.classList.contains('hide')) {
                await createHours(
                    basket_list.workingHours,
                    new Date,
                    formData.icoDatePickup ?? new Date,
                    'pickup',
                    basket_list.pickupPointId,
                    basket_list.reservationInterval
                );
            }

        } catch (error) {
            console.log(error);
        }

        const lastDigit = basket_list.countItems % 10;
        const lastTwoDigits = basket_list.countItems % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            productPriceInfo.textContent = `${basket_list.countItems} товаров`;
        } else if (lastDigit === 1) {
            productPriceInfo.textContent = `${basket_list.countItems} товар`;
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            productPriceInfo.textContent = `${basket_list.countItems} товара`;
        } else {
            productPriceInfo.textContent = `${basket_list.countItems} товаров`;
        }
        productPrice.textContent = `${basket_list.sum} ₽`;
        if (basket_list.balance > basket_list.sum) {
            discount.textContent = `-${basket_list.sum} ₽`;
        } else {
            discount.textContent = `-${basket_list.balance} ₽`;
        }
        if (basket_list.status === 'owner') {
            workerDiscount.textContent = `-${basket_list.sum} ₽`;
            workerDiscountContainer.classList.remove('hide');
        } else if (basket_list.status === 'admin' || basket_list.status === 'manager' || basket_list.status === 'courier') {
            workerDiscount.textContent = `-${basket_list.sum - (basket_list.sum * 70 / 100)} ₽`;
            workerDiscountContainer.classList.remove('hide');
        } else {
            workerDiscountContainer.classList.add('hide');
        }

        createPrice();
        orderChecker();

    } else {
        basketCount.classList.add('hide');
        basketAdress.innerHTML = '';

        basket_empty.classList.remove('hide');
        basket_full.classList.add('hide');

        deliveryNotificationContainer.classList.add('hide');
    };
    let result_text_sum = document.getElementsByClassName('result_text_sum')[0];
    result_text_sum.textContent = basket_list['sum'] + ' ₽';
    basketCartManagement(basket_list);
    editCartProductCount(basket_list);
};

async function createHours(intervals, nowDate, date, method, pickupPointId, reservationInterval, timeZone) {

    try {

        const workingHours = intervals.split('|');

        nowDate.setMinutes(0);
        nowDate.setSeconds(0);
        nowDate.setMilliseconds(0);

        let dateWithoutTime = new Date(date);
        dateWithoutTime.setHours(0);
        dateWithoutTime.setMinutes(0);
        dateWithoutTime.setSeconds(0);
        dateWithoutTime.setMilliseconds(0);

        let nowDateWithoutTime = new Date(nowDate);
        nowDateWithoutTime.setHours(0);
        nowDateWithoutTime.setMinutes(0);
        nowDateWithoutTime.setSeconds(0);
        nowDateWithoutTime.setMilliseconds(0);

        const stopHours = await getAllStopHours(pickupPointId, method);

        let hoursHtml;
        let daysHtml;
        if (method === 'delivery') {
            hoursHtml = hoursDelivery.getElementsByClassName('hour');
            daysHtml = dateSelectionListDelivery.getElementsByClassName('date_selection_item');
        } else {
            hoursHtml = hoursPickup.getElementsByClassName('hour');
            daysHtml = dateSelectionListPickup.getElementsByClassName('date_selection_item');
        }
        for (let i = 0; i < hoursHtml.length;) {
            hoursHtml[0].remove();
        }
        for (let i = 0; i < daysHtml.length;) {
            daysHtml[0].remove();
        }

        let dateList = [];

        for (let i = 0; i <= Math.ceil(reservationInterval / 24); i++) {

            const diffDays = (new Date(nowDateWithoutTime.getTime() + 24 * 60 * 60 * 1000 * i).getTime() - nowDateWithoutTime.getTime()) / (1000 * 60 * 60 * 24);

            let dayOfWeek;

            if (diffDays === 0) dayOfWeek = 'Сегодня';
            else if (diffDays === 1) dayOfWeek = 'Завтра';
            else dayOfWeek = days[new Date(nowDateWithoutTime.getTime() + 24 * 60 * 60 * 1000 * i).getDay()];

            dateList.push(
                {
                    date: new Date(nowDateWithoutTime.getTime() + 24 * 60 * 60 * 1000 * i).toISOString(),
                    dayOfWeek: dayOfWeek,
                    dayOfMonth: `${new Date(nowDateWithoutTime.getTime() + 24 * 60 * 60 * 1000 * i).getDate()} ${months[new Date(nowDateWithoutTime.getTime() + 24 * 60 * 60 * 1000 * i).getMonth()]}`,
                    hours: []
                }
            );

            for (let j = 0; j < workingHours.length; j++) {

                const hoursNum = parseInt(workingHours[j].split('-')[1].split(':')[0]) - parseInt(workingHours[j].split('-')[0].split(':')[0]);

                for (let k = 0; k < hoursNum; k++) {

                    let inlineHour = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000 * i);
                    inlineHour.setHours(parseInt(workingHours[j].split('-')[0].split(':')[0]) + k);
                    inlineHour.setMinutes(0);
                    inlineHour.setSeconds(0);
                    inlineHour.setMilliseconds(0);

                    if (
                        parseInt(nowDate.getTime()) > parseInt(inlineHour.getTime() - (method === 'delivery' ? 60 * 60 * 1000 : 0))
                        || parseInt(inlineHour.getTime()) > parseInt(nowDate.getTime() + 60 * 60 * 1000 * reservationInterval)
                    ) continue;

                    let stopHour = false;
                    for (let l = 0; l < stopHours.length; l++) {
                        if (stopHours[l].interval === inlineHour.toISOString()) {
                            stopHour = true;
                            break;
                        }
                    }

                    if (stopHour) continue;

                    dateList[i].hours.push(inlineHour.toISOString());

                }

            }

        }

        console.log(method, dateList)

        let dataFlag = true;

        for (let i = 0; i < dateList.length; i++) {

            if (dateList[i].hours.length === 0) continue;

            let dateSelectionItem = document.createElement('li');
            if (method === 'delivery') {
                dateSelectionListDelivery.append(dateSelectionItem);
            } else if (method === 'pickup') {
                dateSelectionListPickup.append(dateSelectionItem);
            }

            dateSelectionItem.outerHTML = `
                        <li class="date_selection_item" id="day_${method}_${dateList[i].date}">
                            <div class="date_selection_item_container">
                                <p class="day_of_week">${dateList[i].dayOfWeek}</p>
                                <p class="day_of_month">${dateList[i].dayOfMonth}.</p>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_569_551)">
                                    <path class="date_selection_item_circle"
                                        d="M15 0.5C23.0081 0.5 29.5 6.99187 29.5 15C29.5 23.0081 23.0081 29.5 15 29.5C6.99187 29.5 0.5 23.0081 0.5 15C0.5 6.99187 6.99187 0.5 15 0.5Z"
                                        stroke="#1c1c1c72" />
                                    <circle cx="15" cy="15" r="6" fill="white" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_569_551">
                                        <rect width="30" height="30" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </li>
                        `

            if ((new Date(dateList[i].date).getTime() >= new Date(dateWithoutTime.toISOString()).getTime()) && dataFlag) {

                if (method === 'delivery') {
                    dateFormDayTextDelivery.textContent = dateList[i].dayOfWeek.toLowerCase();
                } else {
                    dateFormDayTextPickup.textContent = i >= 2 ? 'в ' + dateList[i].dayOfWeek.toLowerCase() : dateList[i].dayOfWeek.toLowerCase();
                }

                document.getElementById(`day_${method}_${dateList[i].date}`).getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');

                for (let j = 0; j < dateList[i].hours.length; j++) {

                    let activeFlag = '';

                    let hour = document.createElement('li');
                    if (method === 'delivery') {
                        hoursDelivery.append(hour);
                        if (!formData.icoDateDelivery) {
                            formData.icoDateDelivery = dateList[i].hours[j];
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        } else if (dateList[i].hours[j] === formData.icoDateDelivery) {
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        } else if (new Date(dateList[i].hours[j]).getTime() > new Date(formData.icoDateDelivery).getTime() && dataFlag) {
                            formData.icoDateDelivery = dateList[i].hours[j];
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        }
                    } else {
                        hoursPickup.append(hour);
                        if (!formData.icoDatePickup) {
                            formData.icoDatePickup = dateList[i].hours[j];
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        } else if (dateList[i].hours[j] === formData.icoDatePickup) {
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        } else if (new Date(dateList[i].hours[j]).getTime() > new Date(formData.icoDatePickup).getTime() && dataFlag) {
                            formData.icoDatePickup = dateList[i].hours[j];
                            activeFlag = 'hour_active';
                            dataFlag = false;
                        }
                    }

                    hour.outerHTML = `
                            <li class="hour ${activeFlag}" id="hour_${method}_${dateList[i].hours[j]}">
                                <p class="hour_date">${dateList[i].dayOfWeek}</p>
                                <p class="hour_text">${new Date(dateList[i].hours[j]).getHours() + ':00-' + (parseInt(new Date(dateList[i].hours[j]).getHours()) + 1) + ':00'}</p>
                            </li>
                            `

                }

            }

        }

        // if (method === 'delivery' && hoursDelivery.getElementsByClassName('hour').length === 0) {
        //     createHours(intervals, new Date, new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000), method, pickupPointId, reservationInterval);
        //     return;
        // } else if (method === 'delivery' && !formData.icoDateDelivery) {
        //     const selectedHour = hoursDelivery.getElementsByClassName('hour')[0];
        //     const selectedDay = document.getElementById(`day_${method}_${dateWithoutTime.toISOString()}`);
        //     console.log(selectedHour);
        //     formData.icoDateDelivery = selectedHour.id.split('_')[2];
        //     selectedHour.classList.add('hour_active');
        //     selectedDay.getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        // } else if (method === 'delivery' && formData.icoDateDelivery) {

        //     let icoDateWithoutTime = new Date(formData.icoDateDelivery);
        //     icoDateWithoutTime.setHours(0);
        //     icoDateWithoutTime.setMinutes(0);
        //     icoDateWithoutTime.setSeconds(0);
        //     icoDateWithoutTime.setMilliseconds(0);

        //     let selectedHour;
        //     let selectedDay;
        //     for (let i = 0; i < hoursDelivery.getElementsByClassName('hour').length; i++) {
        //         if (hoursDelivery.getElementsByClassName('hour')[i].id.split('_')[2] === formData.icoDateDelivery) {
        //             selectedHour = hoursDelivery.getElementsByClassName('hour')[i];
        //             break;
        //         }
        //     }
        //     for (let i = 0; i < dateSelectionListDelivery.getElementsByClassName('date_selection_item').length; i++) {
        //         if (dateSelectionListDelivery.getElementsByClassName('date_selection_item')[i].id.split('_')[2] === icoDateWithoutTime.toISOString()) {
        //             selectedDay = dateSelectionListDelivery.getElementsByClassName('date_selection_item')[i];
        //             break;
        //         }
        //     }
        //     if (selectedHour) {
        //         selectedHour.classList.add('hour_active');
        //     } else {
        //         hoursDelivery.getElementsByClassName('hour')[0].classList.add('hour_active');
        //     }
        //     selectedDay.getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        // }

        // if (method === 'pickup' && hoursPickup.getElementsByClassName('hour').length === 0) {
        //     createHours(intervals, new Date, new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000), method, pickupPointId, reservationInterval);
        //     return;
        // } else if (method === 'pickup' && !formData.icoDatePickup) {
        //     const selectedHour = hoursPickup.getElementsByClassName('hour')[0];
        //     const selectedDay = document.getElementById(`day_${method}_${dateWithoutTime.toISOString()}`);
        //     console.log(selectedHour);
        //     formData.icoDatePickup = selectedHour.id.split('_')[2];
        //     selectedHour.classList.add('hour_active');
        //     selectedDay.getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        // } else if (method === 'pickup' && formData.icoDatePickup) {

        //     let icoDateWithoutTime = new Date(formData.icoDatePickup);
        //     icoDateWithoutTime.setHours(0);
        //     icoDateWithoutTime.setMinutes(0);
        //     icoDateWithoutTime.setSeconds(0);
        //     icoDateWithoutTime.setMilliseconds(0);

        //     let selectedHour;
        //     let selectedDay;
        //     for (let i = 0; i < hoursPickup.getElementsByClassName('hour').length; i++) {
        //         if (hoursPickup.getElementsByClassName('hour')[i].id.split('_')[2] === formData.icoDatePickup) {
        //             selectedHour = hoursPickup.getElementsByClassName('hour')[i];
        //             break;
        //         }
        //     }
        //     for (let i = 0; i < dateSelectionListPickup.getElementsByClassName('date_selection_item').length; i++) {
        //         if (dateSelectionListPickup.getElementsByClassName('date_selection_item')[i].id.split('_')[2] === icoDateWithoutTime.toISOString()) {
        //             selectedDay = dateSelectionListPickup.getElementsByClassName('date_selection_item')[i];
        //             break;
        //         }
        //     }
        //     if (selectedHour) {
        //         selectedHour.classList.add('hour_active');
        //     } else {
        //         hoursPickup.getElementsByClassName('hour')[0].classList.add('hour_active');
        //     }
        //     selectedDay.getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        // }

        choiceTime(intervals, pickupPointId, reservationInterval);
        choiceDate(intervals, pickupPointId, reservationInterval);

    } catch (err) {
        console.log(err);
    }
}

function createPrice() {

    console.log(selectedPickupPointData);

    let fullDeliveryPrice = selectedPickupPointData.delivery_price;
    if (basketMainList.minDiscountSumCheck) {
        if (fullDeliveryPrice <= parseFloat(basketMainList.discountSum)) {
            fullDeliveryPrice = 0;
        } else {
            fullDeliveryPrice = fullDeliveryPrice - parseFloat(basketMainList.discountSum);
        }
    }
    if (fullDeliveryPrice === 0) {
        deliveryPrice.textContent = `Бесплатно`;
    } else {
        deliveryPrice.textContent = `${fullDeliveryPrice} ₽`;
    }
    if (formData.method === 'delivery') {
        deliveryPriceContainer.classList.remove('hide');
    } else {
        deliveryPriceContainer.classList.add('hide');
    }
    let fullPriceData = basketMainList.sum;
    if (formData.bonuses) {
        if (basketMainList.balance > fullPriceData) {
            fullPriceData = fullPriceData - fullPriceData;
        } else {
            fullPriceData = fullPriceData - basketMainList.balance;
        }
    }
    if (basketMainList.status === 'owner') {
        fullPriceData = fullPriceData - fullPriceData;
    } else if (basketMainList.status === 'admin' || basketMainList.status === 'manager' || basketMainList.status === 'courier') {
        fullPriceData = (fullPriceData * 70 / 100);
    }
    if ((formData.method === 'delivery' || formData.method === null) && selectedPickupPointData.delivery_price) {
        fullPriceData = fullPriceData + fullDeliveryPrice;
    }
    fullPrice.textContent = `${fullPriceData} ₽`;

    if (basketMainList.methodDelivery) {
        deliveryNotificationContainer.classList.remove('hide');
        if (fullDeliveryPrice === 0) {
            deliveryNotificationPrice.textContent = `Доставка бесплатно`;
            deliveryNotificationHint.classList.add('hide');
        } else if (!basketMainList.minDiscountSumCheck) {
            deliveryNotificationPrice.textContent = `Доставка ${fullDeliveryPrice} ₽`;
            deliveryNotificationHint.textContent = `Ещё ${parseFloat(basketMainList.minDiscountSum) - basketMainList.sum} ₽ и доставка будет ${fullDeliveryPrice - parseFloat(basketMainList.discountSum) <= 0 ? 'бесплатной' : fullDeliveryPrice - parseFloat(basketMainList.discountSum) + ' ₽'}`;
            deliveryNotificationHint.classList.remove('hide');
        } else if (basketMainList.minDiscountSumCheck) {
            deliveryNotificationPrice.textContent = `Доставка ${fullDeliveryPrice} ₽`;
            deliveryNotificationHint.classList.add('hide');
        }
    } else {
        deliveryNotificationContainer.classList.add('hide');
    }
}

function orderChecker() {
    if (formData.method == 'delivery' || formData.method === undefined) {
        if (userAddress !== undefined && formNoDelivery.classList.contains('hide') && (formData.phone && formData.phone.split('').length == 18)) {
            payBut.classList.remove('disactive_but');
            return true;
        } else {
            payBut.classList.add('disactive_but');
            return false;
        }
    } else if (formData.method == 'pickup') {
        if (formData.phone && formData.phone.split('').length == 18) {
            payBut.classList.remove('disactive_but');
            return true;
        } else {
            payBut.classList.add('disactive_but');
            return false;
        }
    }
};