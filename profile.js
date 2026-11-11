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
        const orderRecords = await getOrderRecords(page, limit, user_data.data.secret_key);
        const fragment = document.createDocumentFragment();
        const records = orderRecords.records.filter(record => record && typeof record === 'object');
        for (const record of records) {
            const order = document.createElement('div');
            order.className = 'order';
            order.innerHTML = `
                <div class="order_system_info">
                    <p class="order_num"></p>
                    <p class="order_time"></p>
                </div>
                <div class="order_products">
                </div>
                <div class="order_status">
                    <p class="order_status_text"></p>
                    <p class="order_full_price"></p>
                </div>
            `;
            order.querySelector('.order_num').textContent = record.id ?? '';
            order.querySelector('.order_time').textContent = new Date(record.order_time).toLocaleString();
            order.querySelector('.order_status_text').textContent = {
                new: 'Новый', collected: 'Собран', on_the_way: 'В пути', completed: 'Завершён'
            }[record.status] || '';
            order.querySelector('.order_full_price').textContent = `${record.sum ?? 0} ₽`;
            const items = Array.isArray(record.items)
                ? record.items.filter(item => item && typeof item === 'object') : [];
            const products = order.querySelector('.order_products');
            if (!items.length) {
                const empty = document.createElement('p');
                empty.className = 'order_product_name';
                empty.textContent = 'Состав заказа недоступен';
                products.append(empty);
            }
            for (const item of items) {
                const product = document.createElement('div');
                product.className = 'order_product';
                product.innerHTML = `
                        <div class="order_product_info">
                            <div class="order_container">
                                <img class="order_img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false">
                            </div>
                            <div class="order_product_ident">
                                <p class="order_product_category"></p>
                                <p class="order_product_name"></p>
                            </div>
                        </div>
                        <p class="order_product_price"></p>
                `;
                product.querySelector('.order_product_category').textContent = item.parent_title || '';
                product.querySelector('.order_product_name').textContent =
                    `${item.title || 'Товар удалён'}${item.is_gift ? ' · Подарок (0 ₽)' : ''}`;
                product.querySelector('.order_product_price').textContent = `X ${item.count ?? 0}`;
                const image = product.querySelector('.order_img');
                if (typeof item.img === 'string' && item.img.trim()) {
                    image.src = `${url}/${item.img}?t=${Date.now()}`;
                } else {
                    image.remove();
                    const container = product.querySelector('.order_container');
                    container.textContent = '?';
                    container.setAttribute('aria-label', 'Картинки пока нет');
                }
                products.append(product);
            }
            fragment.append(order);
        }
        // Commit only after the entire new list renders successfully.
        for (const order of [...ordersList.getElementsByClassName('order')]) order.remove();
        ordersList.append(fragment);
        loading.classList.add('hide');

    } catch (error) {
        showShopFailure(error, () => createOrdersList(page, limit), 'Не удалось обновить историю заказов. Предыдущий список сохранён.');
        loading.classList.add('hide');
    }
};

async function getOrderRecords(page, limit, secretKey) {
    const postData = {
            botId: bot_id,
            secretKey: secretKey,
            page: page,
            limit: limit
    };
    const payload = await shopApi('get-order', postData, { validate: value => Array.isArray(value.data?.records) });
    return payload.data;
}

function promocode_manag() {
    if (document.querySelector('.check_promocode').dataset.bound) return;
    document.querySelector('.check_promocode').dataset.bound = 'true';
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
                const result = await admin_activate(`https://${apiUrl}/api/user_ban`, block_input.value); // Ждём ответа
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
