async function getCatalog(pickupPointData) {

    const postData = {
        bot_id: 0,
        pickup_point_id: pickupPointData.id,
        secret_key: user_data.data.secret_key
    };
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const data = await fetch('https://tl-shop.click/api/V2/get-category', {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(postData)
    });

    let json_data = await data.json()
    json_data = await json_data['data'];
    common_json_data = await json_data;

    catalog_loading.classList.add('hide');
    search_manage(pickupPointData);
    console.log(json_data);
    return json_data;
}


function create_categories(json_data, category_id, type, searchRequest, pickupPointData) { //создание категорий
    if (category_id == 0 && type != 'search') {
        let path = document.createElement('section');
        path.classList.add('main_path');
        path.id = 'mainPath';
        catalogPage.append(path);
        let category_back = document.createElement('svg');
        path.append(category_back);
        category_back.outerHTML =
            `<svg class="category_back" width="10" height="19" viewBox="0 0 10 19" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1.5L1.72591 8.41039C1.32515 8.79111 1.30929 9.42476 1.69052 9.82504L9 17.5"
                    stroke="#0C0C0C" stroke-width="2" stroke-linecap="round" />
            </svg>`;
        let category_name = document.createElement('p');
        path.append(category_name);
        category_name.outerHTML = `<p class="category_name">${pickupPointData.title}</p>`;
        backToMainPage();
    } else {
        let path = document.createElement('section');
        path.classList.add('path');
        catalogPage.append(path);
        let category_back = document.createElement('svg');
        path.append(category_back);
        category_back.outerHTML = `<svg class="category_back" width="10" height="19" viewBox="0 0 10 19" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 1.5L1.72591 8.41039C1.32515 8.79111 1.30929 9.42476 1.69052 9.82504L9 17.5"
                            stroke="#0C0C0C" stroke-width="2" stroke-linecap="round" />
                    </svg>`;
        let category_name = document.createElement('p');
        path.append(category_name);
        if (type == 'search') {
            category_name.outerHTML = `<p class="category_name">Поиск по запросу: ${searchRequest}</p>`;
        } else {
            category_name.outerHTML = `<p class="category_name">${json_data['title']}</p>`;
            json_data = json_data['children'];
        }
        back_to_category(pickupPointData);
    };

    let category_list = document.createElement('section');
    category_list.classList.add('category_list');
    category_list.id = category_id;
    catalogPage.append(category_list);

    console.log(json_data);

    for (let i = 0; i < json_data.length; i++) { //цикл основных категорий
        let hide = true;
        let view = '';
        let hide_eye = 'hide';
        let show_eye = '';
        let adminHide = 'hide';
        let managerHide = '';
        let userHide = '';
        if (user_data.data.status == 'admin' || user_data.data.status == 'owner') {
            hide = false;
            adminHide = '';
            userHide = 'hide';
            if (json_data[i]['is_view'] == false) {
                view = `<div class="not_view"></div>`;
                show_eye = 'hide';
                hide_eye = '';
            }
        } else if (user_data.data.status === 'manager') {

            hide = false;
            adminHide = '';
            managerHide = 'hide';

        } else if (json_data[i]['is_view'] == true && availabilityCheck(json_data[i])) {
            hide = false;
        };
        if (!hide) { //если не скрыт
            let discript = json_data[i]['description'].split('\r\n').join('<br>').split('\n').join('<br>');
            if (json_data[i]['type'] == '0') { //если категория
                let category = document.createElement('article');
                category_list.append(category);
                category.outerHTML = `
                    <article class="category" id="${json_data[i]['id']}">
                        <div class="container">
                            <img src="${url + json_data[i]['image200']}" class="img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                        </div>
                        <div class="info">
                            <p class="name">${json_data[i]['title']}</p>
                            <p class="discript">${discript}</p>
                            <div class="manage_category ${adminHide} ${managerHide}">
                                <svg class="remove_category_svg" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.9375 28C8.21563 28 7.59744 27.7387 7.08294 27.216C6.56844 26.6933 6.31163 26.0658 6.3125 25.3333V8H6C5.44772 8 5 7.55228 5 7C5 6.44772 5.44772 6 6 6H11.5625V5C11.5625 4.44772 12.0102 4 12.5625 4H18.4375C18.9898 4 19.4375 4.44772 19.4375 5V6H25C25.5523 6 26 6.44772 26 7C26 7.55228 25.5523 8 25 8H24.6875V25.3333C24.6875 26.0667 24.4303 26.6947 23.9158 27.2173C23.4013 27.74 22.7835 28.0009 22.0625 28H8.9375ZM22.7158 8H8.5V26L22.7158 26V8ZM12 21.6667C12 22.219 12.4477 22.6667 13 22.6667C13.5523 22.6667 14 22.219 14 21.6667V11.6667C14 11.1144 13.5523 10.6667 13 10.6667C12.4477 10.6667 12 11.1144 12 11.6667V21.6667ZM17 21.6667C17 22.219 17.4477 22.6667 18 22.6667C18.5523 22.6667 19 22.219 19 21.6667V11.6667C19 11.1144 18.5523 10.6667 18 10.6667C17.4477 10.6667 17 11.1144 17 11.6667V21.6667Z"></path>
                                </svg>
                                <svg class="show_category_svg ${show_eye}" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.0009 16C20.0009 18.2092 18.2101 20 16.0009 20C13.7919 20 12.001 18.2092 12.001 16C12.001 13.7908 13.7919 12 16.0009 12C18.2101 12 20.0009 13.7908 20.0009 16Z" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16.0016 6.66663C10.0314 6.66663 4.97773 10.5905 3.27869 16C4.9777 21.4094 10.0314 25.3333 16.0016 25.3333C21.9718 25.3333 27.0255 21.4094 28.7246 16C27.0255 10.5905 21.9718 6.66663 16.0016 6.66663Z" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <svg class="hide_category_svg ${hide_eye}" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.99865 4L27.9986 28M13.1244 13.2182C12.4275 13.9381 11.9987 14.9189 11.9987 16C11.9987 18.2092 13.7896 20 15.9986 20C17.0953 20 18.0889 19.5587 18.8114 18.844M8.66532 8.86287C6.13292 10.5338 4.20403 13.0453 3.276 16C4.975 21.4095 10.0287 25.3333 15.9989 25.3333C18.6508 25.3333 21.1218 24.5592 23.1984 23.2245M14.6653 6.73252C15.104 6.68897 15.5489 6.66667 15.9989 6.66667C21.9692 6.66667 27.0229 10.5905 28.7218 16C28.3476 17.192 27.8102 18.3117 27.1362 19.3333" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <svg class="duplicate_category_svg" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M25.12 8.53565V23.963C25.1191 24.169 25.0368 24.3662 24.891 24.5116C24.7452 24.6571 24.5478 24.739 24.3419 24.7394H21.856V27.227C21.8556 27.4333 21.7734 27.6309 21.6276 27.7767C21.4818 27.9226 21.2841 28.0047 21.0779 28.0051H7.65811C7.45188 28.0047 7.25422 27.9226 7.1084 27.7767C6.96257 27.6309 6.88045 27.4333 6.88 27.227V8.3807C6.88045 8.17447 6.96257 7.97682 7.1084 7.83099C7.25422 7.68516 7.45188 7.60304 7.65811 7.6026H10.144V5.11502C10.1444 4.90879 10.2266 4.71113 10.3724 4.56531C10.5182 4.41948 10.7159 4.33736 10.9221 4.33691H20.9213L25.12 8.53565ZM19.9899 13.2615H17.0577C16.8226 13.2607 16.5973 13.1669 16.4311 13.0006C16.2648 12.8343 16.171 12.6091 16.1701 12.374V9.4687H8.74611V26.1373H19.9916L19.9899 13.2615ZM12.0118 6.2047V7.6026H17.6573L19.5015 9.44681C19.4569 9.3401 19.434 9.2256 19.4341 9.10997V6.2047H12.0118ZM21.856 11.8013V22.8733H23.2539V9.99755H20.3234C20.2077 9.99768 20.0932 9.97478 19.9865 9.93018L21.856 11.8013Z" fill="black"/>
                                </svg>
                            </div>
                        </div>
                        ${view}
                    </article>
                    `;
                let img_flag = 'hide';
                let svg_flag = '';
                if (json_data[i]['image1000']) {
                    img_flag = '';
                    svg_flag = 'hide';
                }
                let cart_category = document.createElement('article');
                cart.append(cart_category);
                cart_category.outerHTML = `
                    <article class="cart_category hide" id="cart_${json_data[i]['id']}">
                        <div class="cart_path">
                            <svg class="cart_back" width="10" height="19" viewBox="0 0 10 19" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 1.5L1.72591 8.41039C1.32515 8.79111 1.30929 9.42476 1.69052 9.82504L9 17.5"
                                    stroke="#0C0C0C" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <p class="cart_path_name">Карточка категории</p>
                        </div>
                        <div class="cart_info ${userHide}">
                            <img src="${url + json_data[i]['image1000']}" class="cart_img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                            <p class="cart_name">${json_data[i]['title']}</p>
                            <p class="cart_discript">${discript}</p>
                        </div>
                        <div class="cart_info_change ${adminHide} ${managerHide}" id="category_${json_data[i]['id']}">
                            <div class="cart_container">
                                <svg class="cart_img_none_change ${svg_flag}" width="1629" height="1629" viewBox="0 0 1629 1629" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M773.667 0.466655C742.067 2.73332 726.867 4.19999 709.4 6.46666C531.133 29.4 366.467 110.467 238.467 238.467C118.467 358.467 38.5999 512.733 11.1333 677.667C2.73328 728.333 0.466614 757.8 0.466614 814.333C0.466614 860.467 1.39995 878.733 5.79995 914.333C28.0666 1094.73 109.267 1261.13 238.467 1390.2C362.867 1514.6 523.267 1595.4 695.133 1620.33C740.867 1626.87 761 1628.2 814.333 1628.2C867.667 1628.2 887.8 1626.87 933.533 1620.33C1149 1589.13 1344.6 1470.33 1474.33 1291.67C1547.53 1191 1597.27 1072.47 1617.53 951C1625.93 900.333 1628.2 870.867 1628.2 814.333C1628.2 768.2 1627.27 749.933 1622.87 714.333C1600.6 533.933 1519.4 367.533 1390.2 238.467C1264.73 112.867 1103.4 32.2 929 7.66666C891.667 2.46666 868.867 0.866655 824.333 0.466655C800.2 0.199988 777.4 0.199988 773.667 0.466655ZM878.333 116.333C1043.13 131.8 1193 202.2 1309.67 319C1461 470.2 1534.47 679.8 1510.87 892.333C1495.27 1033 1437 1166.07 1343.8 1273.4L1332.33 1286.6L1327 1280.73C1324.07 1277.53 1197.67 1142.07 1046.2 979.667C894.733 817.267 682.867 589.933 575.267 474.6L379.667 264.733L386.733 259.133C407.267 242.6 445.267 217.667 476.333 200.333C567.933 149.267 677.4 118.467 785 113.8C805 113 857 114.333 878.333 116.333ZM482.333 541.667C578.067 644.333 789.667 871.267 952.6 1046.07L1249 1363.93L1241.93 1369.53C1211.67 1393.93 1156.73 1427.93 1117 1446.73C1040.33 1483 963.667 1504.07 877 1512.47C828.867 1517.13 761 1515.13 710.333 1507.53C561 1484.87 425.933 1416.6 319 1309.67C167.667 1158.47 94.2 948.867 117.8 736.333C133.4 595.667 191.667 462.6 284.867 355.267L296.333 342.067L302.333 348.6C305.667 352.2 386.6 439.133 482.333 541.667Z" fill="#505050"/>
                                </svg>
                                <img src="${url + json_data[i]['image1000']}" class="cart_img_change ${img_flag}" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                                <label for="fileInput_${json_data[i]['id']}" class="upload_img_change" type="button">
                                    <svg class="add_category_svg" width="28" height="28" viewBox="0 0 14 14" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                        <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                                    </svg>
                                    <input type="file" class="fileInput_change" id="fileInput_${json_data[i]['id']}" accept="image/*">
                                </label>
                            </div>
                            <input class="cart_name_input_change" type="text" value="${json_data[i]['title']}" placeholder="Название" />
                            <textarea class="cart_discript_input_change" type="text" placeholder="Описание" rows="4">${json_data[i]['description']}</textarea>
                            <input class="cart_count_input_change hide" type="text" value="${json_data[i]['count']}" placeholder="Количество" />
                            <input class="cart_price_input_change hide" type="text" value="${json_data[i]['price']}" placeholder="Цена" />
                        </div>
                        <div class="save_category_change disactive_but ${adminHide} ${managerHide}" type="button">
                            <p class="save_category_text">Сохранить</p>
                        </div>
                    </article>
                    `;
            } else { //если товар
                let disactive_flag = '';
                let hide_flag = 'hide';
                let hide_none_flag = '';
                let product_count = 0;
                if (basket_products_list[json_data[i]['id']]) {
                    product_count = basket_products_list[json_data[i]['id']];
                    hide_flag = '';
                    hide_none_flag = 'hide';
                    if (product_count == json_data[i]['count']) {
                        disactive_flag = 'disactive';
                    };
                };
                let parentTitleOuter = '';
                if (type == 'search') {
                    let parentTitle = findById(common_json_data, json_data[i].category_id).title
                    parentTitleOuter = `<div class="discript">< ${parentTitle}</div>`;
                }

                let product = document.createElement('product');
                category_list.append(product);
                product.outerHTML = `
                <article class="product" id="${json_data[i]['id']}">
                    <div class="container">
                        <img src="${url + json_data[i]['image200']}" class="img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                    </div>
                    <div class="info">
                        ${parentTitleOuter}
                        <p class="name">${json_data[i]['title']}</p>

                        <div class="discript">${discript}</div>
                        <div class="price_info">
                            <p class="count">В наличии: ${json_data[i]['count']} шт.</p>
                            <p class="price">${json_data[i]['price']}</p>
                        </div>
                        <div class="manage_product ${adminHide}">
                            <svg class="remove_category_svg" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.9375 28C8.21563 28 7.59744 27.7387 7.08294 27.216C6.56844 26.6933 6.31163 26.0658 6.3125 25.3333V8H6C5.44772 8 5 7.55228 5 7C5 6.44772 5.44772 6 6 6H11.5625V5C11.5625 4.44772 12.0102 4 12.5625 4H18.4375C18.9898 4 19.4375 4.44772 19.4375 5V6H25C25.5523 6 26 6.44772 26 7C26 7.55228 25.5523 8 25 8H24.6875V25.3333C24.6875 26.0667 24.4303 26.6947 23.9158 27.2173C23.4013 27.74 22.7835 28.0009 22.0625 28H8.9375ZM22.7158 8H8.5V26L22.7158 26V8ZM12 21.6667C12 22.219 12.4477 22.6667 13 22.6667C13.5523 22.6667 14 22.219 14 21.6667V11.6667C14 11.1144 13.5523 10.6667 13 10.6667C12.4477 10.6667 12 11.1144 12 11.6667V21.6667ZM17 21.6667C17 22.219 17.4477 22.6667 18 22.6667C18.5523 22.6667 19 22.219 19 21.6667V11.6667C19 11.1144 18.5523 10.6667 18 10.6667C17.4477 10.6667 17 11.1144 17 11.6667V21.6667Z"></path>
                            </svg>
                            <svg class="show_category_svg ${show_eye}" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.0009 16C20.0009 18.2092 18.2101 20 16.0009 20C13.7919 20 12.001 18.2092 12.001 16C12.001 13.7908 13.7919 12 16.0009 12C18.2101 12 20.0009 13.7908 20.0009 16Z" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M16.0016 6.66663C10.0314 6.66663 4.97773 10.5905 3.27869 16C4.9777 21.4094 10.0314 25.3333 16.0016 25.3333C21.9718 25.3333 27.0255 21.4094 28.7246 16C27.0255 10.5905 21.9718 6.66663 16.0016 6.66663Z" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <svg class="hide_category_svg ${hide_eye}" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.99865 4L27.9986 28M13.1244 13.2182C12.4275 13.9381 11.9987 14.9189 11.9987 16C11.9987 18.2092 13.7896 20 15.9986 20C17.0953 20 18.0889 19.5587 18.8114 18.844M8.66532 8.86287C6.13292 10.5338 4.20403 13.0453 3.276 16C4.975 21.4095 10.0287 25.3333 15.9989 25.3333C18.6508 25.3333 21.1218 24.5592 23.1984 23.2245M14.6653 6.73252C15.104 6.68897 15.5489 6.66667 15.9989 6.66667C21.9692 6.66667 27.0229 10.5905 28.7218 16C28.3476 17.192 27.8102 18.3117 27.1362 19.3333" stroke="black" stroke-width="2.66667" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <svg class="duplicate_category_svg" width="25" height="25" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M25.12 8.53565V23.963C25.1191 24.169 25.0368 24.3662 24.891 24.5116C24.7452 24.6571 24.5478 24.739 24.3419 24.7394H21.856V27.227C21.8556 27.4333 21.7734 27.6309 21.6276 27.7767C21.4818 27.9226 21.2841 28.0047 21.0779 28.0051H7.65811C7.45188 28.0047 7.25422 27.9226 7.1084 27.7767C6.96257 27.6309 6.88045 27.4333 6.88 27.227V8.3807C6.88045 8.17447 6.96257 7.97682 7.1084 7.83099C7.25422 7.68516 7.45188 7.60304 7.65811 7.6026H10.144V5.11502C10.1444 4.90879 10.2266 4.71113 10.3724 4.56531C10.5182 4.41948 10.7159 4.33736 10.9221 4.33691H20.9213L25.12 8.53565ZM19.9899 13.2615H17.0577C16.8226 13.2607 16.5973 13.1669 16.4311 13.0006C16.2648 12.8343 16.171 12.6091 16.1701 12.374V9.4687H8.74611V26.1373H19.9916L19.9899 13.2615ZM12.0118 6.2047V7.6026H17.6573L19.5015 9.44681C19.4569 9.3401 19.434 9.2256 19.4341 9.10997V6.2047H12.0118ZM21.856 11.8013V22.8733H23.2539V9.99755H20.3234C20.2077 9.99768 20.0932 9.97478 19.9865 9.93018L21.856 11.8013Z" fill="black"/>
                            </svg>
                        </div>
                        <div class="add">
                            <p class="add_none_text ${hide_none_flag}">В КОРЗИНУ</p>
                            <svg class="minus ${hide_flag}" width="14" height="2" viewBox="0 0 14 2" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1H13" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <p class="add_text ${hide_flag}">${product_count}</p>
                            <svg class="plus ${hide_flag} ${disactive_flag}" width="14" height="14" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </div>
                    </div>
                    ${view}
                </article>`

                let img_flag = 'hide';
                let svg_flag = '';
                if (json_data[i]['image1000']) {
                    img_flag = '';
                    svg_flag = 'hide';
                }

                let cart_product = document.createElement('article');
                cart.append(cart_product);
                cart_product.outerHTML = `
                <article class="cart_product hide" id="cart_${json_data[i]['id']}">
                    <div class="cart_path">
                        <svg class="cart_back" width="10" height="19" viewBox="0 0 10 19" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 1.5L1.72591 8.41039C1.32515 8.79111 1.30929 9.42476 1.69052 9.82504L9 17.5"
                                stroke="#0C0C0C" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <p class="cart_path_name">Карточка товара</p>
                    </div>
                    <div class="cart_info ${userHide}">
                        <img src="${url + json_data[i]['image1000']}" class="cart_img" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                        <p class="cart_name">${json_data[i]['title']}</p>
                        <p class="cart_discript">${discript}</p>
                        <div class="cart_price_info ${managerHide}">
                            <p class="cart_count">В наличии: ${json_data[i]['count']} шт.</p>
                        </div>
                    </div>

                    <div class="cart_info_change ${adminHide}" id="product_${json_data[i]['id']}">
                        <div class="cart_container ${managerHide}">
                            <svg class="cart_img_none_change ${svg_flag}" width="1629" height="1629" viewBox="0 0 1629 1629" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M773.667 0.466655C742.067 2.73332 726.867 4.19999 709.4 6.46666C531.133 29.4 366.467 110.467 238.467 238.467C118.467 358.467 38.5999 512.733 11.1333 677.667C2.73328 728.333 0.466614 757.8 0.466614 814.333C0.466614 860.467 1.39995 878.733 5.79995 914.333C28.0666 1094.73 109.267 1261.13 238.467 1390.2C362.867 1514.6 523.267 1595.4 695.133 1620.33C740.867 1626.87 761 1628.2 814.333 1628.2C867.667 1628.2 887.8 1626.87 933.533 1620.33C1149 1589.13 1344.6 1470.33 1474.33 1291.67C1547.53 1191 1597.27 1072.47 1617.53 951C1625.93 900.333 1628.2 870.867 1628.2 814.333C1628.2 768.2 1627.27 749.933 1622.87 714.333C1600.6 533.933 1519.4 367.533 1390.2 238.467C1264.73 112.867 1103.4 32.2 929 7.66666C891.667 2.46666 868.867 0.866655 824.333 0.466655C800.2 0.199988 777.4 0.199988 773.667 0.466655ZM878.333 116.333C1043.13 131.8 1193 202.2 1309.67 319C1461 470.2 1534.47 679.8 1510.87 892.333C1495.27 1033 1437 1166.07 1343.8 1273.4L1332.33 1286.6L1327 1280.73C1324.07 1277.53 1197.67 1142.07 1046.2 979.667C894.733 817.267 682.867 589.933 575.267 474.6L379.667 264.733L386.733 259.133C407.267 242.6 445.267 217.667 476.333 200.333C567.933 149.267 677.4 118.467 785 113.8C805 113 857 114.333 878.333 116.333ZM482.333 541.667C578.067 644.333 789.667 871.267 952.6 1046.07L1249 1363.93L1241.93 1369.53C1211.67 1393.93 1156.73 1427.93 1117 1446.73C1040.33 1483 963.667 1504.07 877 1512.47C828.867 1517.13 761 1515.13 710.333 1507.53C561 1484.87 425.933 1416.6 319 1309.67C167.667 1158.47 94.2 948.867 117.8 736.333C133.4 595.667 191.667 462.6 284.867 355.267L296.333 342.067L302.333 348.6C305.667 352.2 386.6 439.133 482.333 541.667Z" fill="#505050"/>
                            </svg>
                            <img src="${url + json_data[i]['image1000']}" class="cart_img_change ${img_flag}" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                            <label for="fileInput_${json_data[i]['id']}" class="upload_img_change" type="button">
                                <svg class="add_category_svg" width="28" height="28" viewBox="0 0 14 14" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                    <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                <input type="file" class="fileInput_change" id="fileInput_${json_data[i]['id']}" accept="image/*">
                            </label>
                        </div>
                        <input class="cart_name_input_change ${managerHide}" type="text" value="${json_data[i]['title']}" placeholder="Название" />
                        <textarea class="cart_discript_input_change ${managerHide}" type="text" placeholder="Описание" rows="4">${json_data[i]['description']}</textarea>
                        <input class="cart_count_input_change" type="text" value="${json_data[i]['count']}" placeholder="Количество" />
                        <input class="cart_price_input_change ${managerHide}" type="text" value="${json_data[i]['price']}" placeholder="Цена" />
                    </div>
                    <div class="save_category_change disactive_but ${adminHide}" type="button">
                        <p class="save_category_text">Сохранить</p>
                    </div>

                    <div class="cart_price_menu">
                        <p class="cart_price">${json_data[i]['price']}</p>
                        <div class="cart_add">
                            <p class="cart_add_none_text ${hide_none_flag}">В КОРЗИНУ</p>
                            <svg class="cart_minus ${hide_flag}" width="14" height="2" viewBox="0 0 14 2" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1H13" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <p class="cart_add_text ${hide_flag}">${product_count}</p>
                            <svg class="cart_plus ${hide_flag} ${disactive_flag}" width="14" height="14" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </div>
                    </div>
                </article>`
            };
        };
    };
    if (user_data.data.status == 'admin' || user_data.data.status == 'owner') {
        let add_category = document.createElement('article');
        category_list.append(add_category);
        add_category.outerHTML = `<article class="add_category">
                        <div class="add_category_plus" id="addCategoryPlus">
                            <svg class="add_category_svg" width="28" height="28" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </div>
                    </article>`;
        let add_cart = document.createElement('article');
        cart.append(add_cart)
        add_cart.outerHTML = `
                <article class="add_cart hide" id="addCart">
                    <div class="cart_adm_path" id="cartAdmPath">
                        <svg class="cart_back" width="10" height="19" viewBox="0 0 10 19" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 1.5L1.72591 8.41039C1.32515 8.79111 1.30929 9.42476 1.69052 9.82504L9 17.5"
                                stroke="#0C0C0C" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <p class="cart_path_name">Карточка продукта</p>
                    </div>
                    <div class="cart_info">
                        <div class="cart_container">
                            <svg class="cart_img_none" width="1629" height="1629" viewBox="0 0 1629 1629" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M773.667 0.466655C742.067 2.73332 726.867 4.19999 709.4 6.46666C531.133 29.4 366.467 110.467 238.467 238.467C118.467 358.467 38.5999 512.733 11.1333 677.667C2.73328 728.333 0.466614 757.8 0.466614 814.333C0.466614 860.467 1.39995 878.733 5.79995 914.333C28.0666 1094.73 109.267 1261.13 238.467 1390.2C362.867 1514.6 523.267 1595.4 695.133 1620.33C740.867 1626.87 761 1628.2 814.333 1628.2C867.667 1628.2 887.8 1626.87 933.533 1620.33C1149 1589.13 1344.6 1470.33 1474.33 1291.67C1547.53 1191 1597.27 1072.47 1617.53 951C1625.93 900.333 1628.2 870.867 1628.2 814.333C1628.2 768.2 1627.27 749.933 1622.87 714.333C1600.6 533.933 1519.4 367.533 1390.2 238.467C1264.73 112.867 1103.4 32.2 929 7.66666C891.667 2.46666 868.867 0.866655 824.333 0.466655C800.2 0.199988 777.4 0.199988 773.667 0.466655ZM878.333 116.333C1043.13 131.8 1193 202.2 1309.67 319C1461 470.2 1534.47 679.8 1510.87 892.333C1495.27 1033 1437 1166.07 1343.8 1273.4L1332.33 1286.6L1327 1280.73C1324.07 1277.53 1197.67 1142.07 1046.2 979.667C894.733 817.267 682.867 589.933 575.267 474.6L379.667 264.733L386.733 259.133C407.267 242.6 445.267 217.667 476.333 200.333C567.933 149.267 677.4 118.467 785 113.8C805 113 857 114.333 878.333 116.333ZM482.333 541.667C578.067 644.333 789.667 871.267 952.6 1046.07L1249 1363.93L1241.93 1369.53C1211.67 1393.93 1156.73 1427.93 1117 1446.73C1040.33 1483 963.667 1504.07 877 1512.47C828.867 1517.13 761 1515.13 710.333 1507.53C561 1484.87 425.933 1416.6 319 1309.67C167.667 1158.47 94.2 948.867 117.8 736.333C133.4 595.667 191.667 462.6 284.867 355.267L296.333 342.067L302.333 348.6C305.667 352.2 386.6 439.133 482.333 541.667Z" fill="#505050"/>
                            </svg>
                            <img class="cart_adm_img hide" loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false" style="object-fit: contain; object-position: 50% 50%;"></img>
                            <label for="fileInput" class="upload_img">
                                <svg class="add_category_svg" width="28" height="28" viewBox="0 0 14 14" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 1V13" stroke-width="2" stroke-linecap="round" />
                                    <path d="M1 7H13" stroke-width="2" stroke-linecap="round" />
                                </svg>
                                <input type="file" id="fileInput" accept="image/*">
                            </label>
                        </div>
                        <div class="type_toggle">
                            <div class="type_category choiced">Категория</div>
                            <div class="type_product">Товар</div>
                        </div>
                        <input class="cart_name_input" type="text" placeholder="Название *" />
                        <textarea class="cart_discript_input" type="text" placeholder="Описание" rows="4"></textarea>
                        <input class="cart_count_input hide" type="text" placeholder="Количество *" />
                        <input class="cart_price_input hide" type="text" placeholder="Цена *" />
                    </div>
                    <div class="save_category disactive_but">
                        <p class="save_category_text">Сохранить</p>
                    </div>
                </article>`
        admAddCategory(pickupPointData);
        admChangeCategory(pickupPointData);
        admManageCategory(pickupPointData);
    }
    if (user_data.data.status == 'manager') {
        admChangeCategory(pickupPointData);
    }
    show_cart();
    cartManagement(pickupPointData, json_data);
    open_categories(pickupPointData);
    editProductCount(basketMainList, pickupPointData)

    searchMenu.scrollIntoView({
        behavior: 'smooth', // плавная прокрутка
        block: 'start'      // выравнивание по верхней границе
    });

    loading.classList.add('hide');
};


function open_categories(pickupPointData) { //открытие категории
    let path = document.getElementsByClassName('path')[0];
    let category_list = document.getElementsByClassName('category_list')[0];
    let category = document.getElementsByClassName('category');
    let cart_category = document.getElementsByClassName('cart_category');
    let cart_product = document.getElementsByClassName('cart_product');
    let add_cart = document.getElementsByClassName('add_cart');

    for (let i = 0; i < category.length; i++) {
        let open = category[i];
        open.addEventListener('click', () => {
            let category_id = category[i].id;
            let json_data_new = findById(common_json_data, parseInt(category_id));

            if (path) {
                path.remove();
            } else {
                mainPath.remove();
            }
            category_list.remove();
            for (let i = 0; i < cart_category.length;) {
                cart_category[0].remove();
            };
            for (let i = 0; i < cart_product.length;) {
                cart_product[0].remove();
            };
            for (let i = 0; i < add_cart.length;) {
                add_cart[0].remove();
            };
            create_categories(json_data_new, parseInt(category_id), '', '', pickupPointData);
        });
    };
};


function back_to_category(pickupPointData) { //Назад в категорию
    let path = document.getElementsByClassName('path')[0];
    path.addEventListener('click', () => {
        let category_list = document.getElementsByClassName('category_list')[0];
        let cart_category = document.getElementsByClassName('cart_category');
        let cart_product = document.getElementsByClassName('cart_product');
        let category_name = document.getElementsByClassName('category_name')[0];
        let add_cart = document.getElementsByClassName('add_cart');
        if (category_name.innerText != 'Главная') {
            let category_id = category_list.id;
            let json_data_new;
            let category_father_id;
            if (category_id == 0) {
                json_data_new = common_json_data;
                category_father_id = 0;
            } else {
                category_father_id = findCategoryById(common_json_data, parseInt(category_id));
                if (category_father_id == 0) {
                    json_data_new = common_json_data;
                } else {
                    json_data_new = findById(common_json_data, parseInt(category_father_id));
                };
            }
            path.remove();
            category_list.remove();
            for (let i = 0; i < cart_category.length;) {
                cart_category[0].remove();
            };
            for (let i = 0; i < cart_product.length;) {
                cart_product[0].remove();
            };
            for (let i = 0; i < add_cart.length;) {
                add_cart[0].remove();
            };
            create_categories(json_data_new, category_father_id, '', '', pickupPointData);
        }
    });
};

function editProductCount(cartData, pickupPointData) {    //Редактирование количества относительно корзины
    let productsList = document.getElementsByClassName('product');
    let cartProductList = document.getElementsByClassName('cart_product');
    for (let i = 0; i < productsList.length; i++) {
        productsList[i].getElementsByClassName('add_none_text')[0].classList.remove('hide');
        productsList[i].getElementsByClassName('minus')[0].classList.add('hide');
        productsList[i].getElementsByClassName('add_text')[0].classList.add('hide');
        productsList[i].getElementsByClassName('plus')[0].classList.add('hide');
        cartProductList[i].getElementsByClassName('cart_add_none_text')[0].classList.remove('hide');
        cartProductList[i].getElementsByClassName('cart_minus')[0].classList.add('hide');
        cartProductList[i].getElementsByClassName('cart_add_text')[0].classList.add('hide');
        cartProductList[i].getElementsByClassName('cart_plus')[0].classList.add('hide');
        for (let j = 0; j < cartData.items.length; j++) {
            if (productsList[i].id == cartData.items[j].catalog_id && cartData.items[j].pickup_point_id == pickupPointData.id) {

                productsList[i].getElementsByClassName('add_none_text')[0].classList.add('hide');
                productsList[i].getElementsByClassName('minus')[0].classList.remove('hide');
                productsList[i].getElementsByClassName('add_text')[0].classList.remove('hide');
                productsList[i].getElementsByClassName('add_text')[0].textContent = cartData.items[j].count;
                productsList[i].getElementsByClassName('plus')[0].classList.remove('hide');
                productsList[i].getElementsByClassName('plus')[0].classList.remove('disactive');
                cartProductList[i].getElementsByClassName('cart_add_none_text')[0].classList.add('hide');
                cartProductList[i].getElementsByClassName('cart_minus')[0].classList.remove('hide');
                cartProductList[i].getElementsByClassName('cart_add_text')[0].classList.remove('hide');
                cartProductList[i].getElementsByClassName('cart_add_text')[0].textContent = cartData.items[j].count;
                cartProductList[i].getElementsByClassName('cart_plus')[0].classList.remove('hide');
                cartProductList[i].getElementsByClassName('cart_plus')[0].classList.remove('disactive');
                if (cartData.items[j].count == cartData.items[j].available_count) {
                    productsList[i].getElementsByClassName('plus')[0].classList.add('disactive');
                    cartProductList[i].getElementsByClassName('cart_plus')[0].classList.add('disactive');
                }
            }
        };
    };
};


async function reload(pickupPointData, categoryId) {
    try {
        let path = document.getElementsByClassName('path')[0];
        let category_list = document.getElementsByClassName('category_list')[0];
        let cart_category = document.getElementsByClassName('cart_category');
        let cart_product = document.getElementsByClassName('cart_product');
        let add_cart = document.getElementsByClassName('add_cart');
        if (path) {
            path.remove();
        } else {
            mainPath.remove();
        }
        category_list.remove();
        for (let i = 0; i < cart_category.length;) {
            cart_category[0].remove();
        };
        for (let i = 0; i < cart_product.length;) {
            cart_product[0].remove();
        };
        for (let i = 0; i < add_cart.length;) {
            add_cart[0].remove();
        };

        const newCatalogData = await getCatalog(pickupPointData);
        if (categoryId == 0) {
            create_categories(await newCatalogData, parseInt(categoryId), '', '', pickupPointData);
        } else {
            let json_data_new = findById(await newCatalogData, parseInt(categoryId));
            create_categories(json_data_new, parseInt(categoryId), '', '', pickupPointData);
        };
    } catch (error) {
        console.error(error);
    }
};


function findById(data, id) {
    // Проверяем, является ли текущий элемент объектом
    if (typeof data === 'object' && data !== null) {
        // Если у текущего элемента есть свойство 'id' и оно равно искомому, возвращаем элемент
        if (data.id === id) {
            return data;
        }

        // Рекурсивно обходим все свойства объекта
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const result = findById(data[key], id);
                if (result) {
                    return result;
                }
            }
        }
    }

    // Если элемент не найден, возвращаем null
    return null;
}

function show_cart() { //Открытие карточки
    let product = document.getElementsByClassName('product');
    let cart_category = document.getElementsByClassName('cart_category');
    let category = document.getElementsByClassName('category');
    let cart_product = document.getElementsByClassName('cart_product');
    let catalog = document.getElementsByClassName('catalog')[0];
    let cart = document.getElementsByClassName('cart')[0];
    for (let i = 0; i < product.length; i++) {//Открытие карточки продкута
        let img = product[i].getElementsByClassName('img')[0];
        let cart_back = cart_product[i].getElementsByClassName('cart_path')[0];
        img.addEventListener('click', () => {
            catalog.classList.add('hide');
            cart.classList.remove('hide');
            for (let j = 0; j < cart_category.length; j++) {
                cart_category[j].classList.add('hide');
            }
            for (let j = 0; j < cart_product.length; j++) {
                cart_product[j].classList.add('hide');
            }
            cart_product[i].classList.remove('hide');
        });
        cart_back.addEventListener('click', () => {
            catalog.classList.remove('hide');
            cart.classList.add('hide');
            cart_product[i].classList.add('hide');
        });
    };
    if (user_data.data.status == 'admin' || user_data.data.status == 'manager' || user_data.data.status == 'owner') {
        for (let i = 0; i < category.length; i++) {//Открытие карточки продкута
            let img = category[i].getElementsByClassName('img')[0];
            let cart_back = cart_category[i].getElementsByClassName('cart_path')[0];
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                catalog.classList.add('hide');
                cart.classList.remove('hide');
                for (let j = 0; j < cart_category.length; j++) {
                    cart_category[j].classList.add('hide');
                }
                for (let j = 0; j < cart_product.length; j++) {
                    cart_product[j].classList.add('hide');
                }
                cart_category[i].classList.remove('hide');
            });
            cart_back.addEventListener('click', () => {
                catalog.classList.remove('hide');
                cart.classList.add('hide');
                cart_category[i].classList.add('hide');
            });
        };
    }
};

function availabilityCheck(data) {
    // Проверяем, является ли текущий элемент объектом
    if (typeof data === 'object' && data !== null) {
        // Если у текущего элемента есть свойство 'id' и оно равно искомому, возвращаем элемент
        if (data.count > 0) {
            return true;
        }

        // Рекурсивно обходим все свойства объекта
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const result = availabilityCheck(data[key]);
                if (result) {
                    return result;
                }
            }
        }
    }

    // Если элемент не найден, возвращаем null
    return false;
}

function findCategoryById(data, id) {
    // Проверяем, является ли текущий элемент объектом
    if (typeof data === 'object' && data !== null) {
        // Если у текущего элемента есть свойство 'id' и оно равно искомому, возвращаем его category_id
        if (data.id === id) {
            return data.category_id;
        }

        // Рекурсивно обходим все свойства объекта
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const result = findCategoryById(data[key], id);
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }

    // Если элемент не найден, возвращаем undefined
    return undefined;
}