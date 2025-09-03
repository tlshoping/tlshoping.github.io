function profile_manag() {
    let user_name = document.getElementsByClassName('user_name')[0];
    let user_url = document.getElementsByClassName('user_url')[0];
    let balance = document.getElementsByClassName('balance')[0];
    user_name.innerText = user_data['data']['first_name'];
    user_url.innerText = user_data['data']['nickname'];
    balance.innerText = parseFloat(user_data.data.balance) + ' ₽';
    promocode_manag();
}

async function createOrdersList(page, limit) {
    try {

        let orders = ordersList.getElementsByClassName('order');
        for (let i = 0; i < orders.length;) {
            orders[0].remove();
        }

        const orderRecords = await getOrderRecords(page, limit, user_data.data.secret_key);

        console.log(orderRecords);

        for (let i = 0; i < orderRecords.records.length; i++) {

            let order = document.createElement('div');
            ordersList.append(order);
            order.outerHTML = `
            <div class="order">
                <div class="order_system_info">
                    <p class="order_num">${orderRecords.records[i].id}</p>
                    <p class="order_time">${new Date(orderRecords.records[i].order_time).toLocaleString()}</p>
                </div>
                <div class="order_products">
                </div>
                <div class="order_status">
                    <p class="order_status_text">${orderRecords.records[i].status === 'new' ? 'Новый' : orderRecords.records[i].status === 'collected' ? 'Собран' : orderRecords.records[i].status === 'on_the_way' ? 'В пути' : orderRecords.records[i].status === 'completed' ? 'Завершён' : ''}</p>
                    <p class="order_full_price">${orderRecords.records[i].sum} ₽</p>
                </div>
            </div>
            `

            for (let j = 0; j < orderRecords.records[i].items.length; j++) {

                let product = document.createElement('div');
                ordersList.getElementsByClassName('order_products')[i].append(product);
                product.outerHTML = `
                    <div class="order_product">
                        <div class="order_product_info">
                            <div class="order_container">
                                <img class="order_img" src="${url + '/' + orderRecords.records[i].items[j].img}" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false">
                            </div>
                            <div class="order_product_ident">
                                <p class="order_product_category">${orderRecords.records[i].items[j].parent_title}</p>
                                <p class="order_product_name">${orderRecords.records[i].items[j].title}</p>
                            </div>
                        </div>
                        <p class="order_product_price">X ${orderRecords.records[i].items[j].count}</p>
                    </div>
                `

            };

        }

        loading.classList.add('hide');

    } catch (error) {
        console.error('Ошибка при создании списка заказов:', error);
        loading.classList.add('hide');
    }
};

async function getOrderRecords(page, limit, secretKey) {
    try {

        const postData = {
            botId: 0,
            secretKey: secretKey,
            page: page,
            limit: limit
        };
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        const data = await fetch('https://tl-shop.click/api/V2/get-order', {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(postData)
        });

        let jsonData = await data.json()
        const result = await jsonData.data;

        return result;

    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function promocode_manag() {
    let promocode_input = document.getElementsByClassName('promocode_input')[0];
    let check_promocode = document.getElementsByClassName('check_promocode')[0];

    promocode_input.addEventListener('input', () => {
        if (promocode_input.value) {
            check_promocode.classList.remove('disactive_but');
        } else {
            check_promocode.classList.add('disactive_but');
        }
    });

    check_promocode.addEventListener('click', async () => { // Добавляем async
        if (!check_promocode.classList.contains('disactive_but')) {
            try {
                const result = await promocode_activate('https://api.bot-t.com/v1/shoppublic/coupon/activated', promocode_input.value); // Ждём ответа
                if (result && result.result) { // Проверяем result на существование
                    promocode_input.classList.add('succes_input'); // Добавляем класс (было remove)
                    setTimeout(() => {
                        promocode_input.classList.remove('succes_input');
                    }, 1000);
                } else {
                    promocode_input.classList.add('incorrect'); // Добавляем класс (было remove)
                    setTimeout(() => {
                        promocode_input.classList.remove('incorrect');
                    }, 1000);
                }
            } catch (error) {
                console.error('Ошибка при активации промокода:', error);
                promocode_input.classList.add('incorrect');
                setTimeout(() => {
                    promocode_input.classList.remove('incorrect');
                }, 1000);
            }
        } else {
            promocode_input.classList.add('incorrect');
            setTimeout(() => {
                promocode_input.classList.remove('incorrect');
            }, 1000);
        }
    });
}

function promocode_activate(url, value) {
    const post_promocodeData = {
        bot_id: bot_id,
        code: value,
        secret_user_key: user_key,
        user_id: user_id
    };
    let my_promocodeHeaders = new Headers();
    my_promocodeHeaders.append('Content-Type', 'application/json');

    // Возвращаем промис с данными
    return fetch(url, {
        method: 'POST',
        headers: my_promocodeHeaders,
        body: JSON.stringify(post_promocodeData),
    })
        .then((promocode_data) => promocode_data.json())
        .then((json_promocode_data) => {
            return json_promocode_data; // Возвращаем данные
        })
        .catch((error) => {
            console.error('Ошибка при запросе:', error);
            return { result: false }; // Возвращаем объект с result: false в случае ошибки
        });
}

function promocode_activate(url, value) {
    const post_promocodeData = {
        bot_id: bot_id,
        code: value,
        secret_user_key: user_key,
        user_id: user_id
    };
    let my_promocodeHeaders = new Headers();
    my_promocodeHeaders.append('Content-Type', 'application/json');

    // Возвращаем промис с данными
    return fetch(url, {
        method: 'POST',
        headers: my_promocodeHeaders,
        body: JSON.stringify(post_promocodeData),
    })
        .then((promocode_data) => promocode_data.json())
        .then((json_promocode_data) => {
            return json_promocode_data; // Возвращаем данные
        })
        .catch((error) => {
            console.error('Ошибка при запросе:', error);
            return { result: false }; // Возвращаем объект с result: false в случае ошибки
        });
}

function block_manag() {
    let block_input = document.getElementsByClassName('block_input')[0];
    let check_block = document.getElementsByClassName('check_block')[0];

    block_input.addEventListener('input', () => {
        if (block_input.value) {
            check_block.classList.remove('disactive_but');
        } else {
            check_block.classList.add('disactive_but');
        }
    });

    check_block.addEventListener('click', async () => { // Добавляем async
        if (!check_block.classList.contains('disactive_but')) {
            try {
                const result = await admin_activate('https://tl-shop.click/api/user_ban', block_input.value); // Ждём ответа
                if (result && result.data.result) { // Проверяем result на существование
                    block_input.classList.add('succes_input'); // Добавляем класс (было remove)
                    setTimeout(() => {
                        block_input.classList.remove('succes_input');
                    }, 1000);
                } else {
                    block_input.classList.add('incorrect'); // Добавляем класс (было remove)
                    setTimeout(() => {
                        block_input.classList.remove('incorrect');
                    }, 1000);
                }
            } catch (error) {
                console.error('Ошибка при активации промокода:', error);
                block_input.classList.add('incorrect');
                setTimeout(() => {
                    block_input.classList.remove('incorrect');
                }, 1000);
            }
        } else {
            block_input.classList.add('incorrect');
            setTimeout(() => {
                block_input.classList.remove('incorrect');
            }, 1000);
        }
    });
};