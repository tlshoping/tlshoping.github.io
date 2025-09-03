function adminConsole() { // Отправить в консоль список товаров
    console.log(common_json_data);
    let product_list = '';
    let product_list_price = 0;
    let product_list_local_price;
    for (let i = 0; i < common_json_data.length; i++) {
        if (common_json_data[i]['is_view'] == true) {
            product_list = product_list + '➖' + common_json_data[i]['title'] + '➖' + '\n';
            for (let j = 0; j < common_json_data[i]['children'].length; j++) {
                if (common_json_data[i]['children'][j]['is_view'] == true) {
                    if (parseInt((common_json_data[i]['children'][j]['price'])) > 0) {
                        product_list_price += parseInt((common_json_data[i]['children'][j]['price'])) * parseFloat(common_json_data[i]['children'][j]['count']);
                        product_list_local_price = parseInt((common_json_data[i]['children'][j]['price'])) * parseFloat(common_json_data[i]['children'][j]['count']);
                        product_list = product_list + '    ' + common_json_data[i]['children'][j]['title'] + ' ' + product_list_local_price;
                    } else {
                        product_list = product_list + '  ➖' + common_json_data[i]['children'][j]['title'] + '➖' + '\n';
                    }
                    for (let k = 0; k < common_json_data[i]['children'][j]['children'].length; k++) {
                        if (common_json_data[i]['children'][j]['children'][k]['is_view'] == true) {
                            product_list_local_price = parseInt((common_json_data[i]['children'][j]['children'][k]['price'])) * parseFloat(common_json_data[i]['children'][j]['children'][k]['count']);;
                            product_list_price += parseInt((common_json_data[i]['children'][j]['children'][k]['price'])) * parseFloat(common_json_data[i]['children'][j]['children'][k]['count']);
                            product_list = product_list + '    ' + common_json_data[i]['children'][j]['children'][k]['title'] + ' ' + product_list_local_price + '\n';
                        };
                    };
                    product_list = product_list + '\n';
                };
            };
            product_list = product_list + '\n';
        };
    };
    console.log(product_list);
    console.log(product_list_price);
};

// function adm_add_category(pickupPointData) { //Управление добавлением новой категории/товара

//     let catalog = document.getElementsByClassName('catalog')[0];
//     let add_category_plus = document.getElementsByClassName('add_category_plus')[0];
//     let cart = document.getElementsByClassName('cart ')[0];
//     let add_cart = document.getElementsByClassName('add_cart')[0];
//     let cart_path = document.getElementsByClassName('cart_adm_path')[0];
//     let cart_adm_img = document.getElementsByClassName('cart_adm_img')[0];
//     let cart_img_none = document.getElementsByClassName('cart_img_none')[0];
//     const fileInput = document.getElementById('fileInput');
//     let type_category = document.getElementsByClassName('type_category')[0];
//     let type_product = document.getElementsByClassName('type_product')[0];
//     let cart_name_input = document.getElementsByClassName('cart_name_input')[0];
//     let cart_discript_input = document.getElementsByClassName('cart_discript_input')[0];
//     let cart_count_input = document.getElementsByClassName('cart_count_input')[0];
//     let cart_price_input = document.getElementsByClassName('cart_price_input')[0];
//     let save_category = document.getElementsByClassName('save_category')[0];
//     let category_list = document.getElementsByClassName('category_list')[0];


//     function add_cart_cheker() { //Чекер валидности данных
//         if (type_category.classList.contains('choiced')) {
//             if (cart_name_input.value != 0) {
//                 save_category.classList.remove('disactive_but');
//                 return true;
//             } else {
//                 save_category.classList.add('disactive_but');
//                 return false;
//             };
//         } else if (type_product.classList.contains('choiced')) {
//             if (cart_name_input.value != 0 && cart_count_input.value != 0 && cart_price_input.value != 0) {
//                 save_category.classList.remove('disactive_but');
//                 return true;
//             } else {
//                 save_category.classList.add('disactive_but');
//                 return false;
//             };
//         };
//     };

//     add_category_plus.addEventListener('click', () => {
//         catalog.classList.add('hide')
//         cart.classList.remove('hide')
//         add_cart.classList.remove('hide')
//         add_cart_cheker();
//         if (category_list.id == 0) {
//             type_product.classList.add('hide');
//         };
//     });
//     cart_path.addEventListener('click', () => {
//         catalog.classList.remove('hide')
//         cart.classList.add('hide')
//         add_cart.classList.add('hide')
//     });
//     let img_base64;
//     fileInput.addEventListener('change', function (e) {
//         e.preventDefault();
//         const file = e.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = function (event) {
//                 img_base64 = event.target.result;
//                 cart_adm_img.src = event.target.result;
//             };
//             cart_adm_img.classList.remove('hide');
//             cart_img_none.classList.add('hide');
//             reader.readAsDataURL(file);
//         };
//     });
//     type_category.addEventListener('click', () => {
//         type_category.classList.add('choiced');
//         type_product.classList.remove('choiced');
//         cart_count_input.classList.add('hide');
//         cart_price_input.classList.add('hide');
//         add_cart_cheker();
//     });
//     type_product.addEventListener('click', () => {
//         type_product.classList.add('choiced');
//         type_category.classList.remove('choiced');
//         cart_count_input.classList.remove('hide');
//         cart_price_input.classList.remove('hide');
//         add_cart_cheker();
//     });
//     cart_name_input.addEventListener('input', () => {
//         add_cart_cheker();
//     });
//     cart_count_input.addEventListener('input', () => {
//         add_cart_cheker();
//     });
//     cart_price_input.addEventListener('input', () => {
//         add_cart_cheker();
//     });
//     save_category.addEventListener('click', (event) => {
//         console.log(event);
//         event.preventDefault();
//         if (add_cart_cheker()) {
//             let loading_cart = document.getElementsByClassName('loading_cart')[0];
//             loading_cart.classList.remove('hide');
//             if (type_category.classList.contains('choiced')) {
//                 create_category(pickupPointData, 0, 0, cart_name_input.value, category_list.id, cart_discript_input.value, img_base64);
//             } else if (type_product.classList.contains('choiced')) {
//                 create_category(pickupPointData, 0, 7, cart_name_input.value, category_list.id, cart_discript_input.value, img_base64, cart_count_input.value, cart_price_input.value);
//             };
//         };
//     });
// };

// function adm_change_category(pickupPointData) {
//     let cart_info = document.getElementsByClassName('cart_info_change');
//     for (let i = 0; i < cart_info.length; i++) {
//         let cart_adm_img = document.getElementsByClassName('cart_img_change')[i];
//         let cart_img_none = document.getElementsByClassName('cart_img_none_change')[i];
//         let fileInput = document.getElementById('fileInput_' + cart_info[i].id.split('_')[1]);
//         let cart_name_input = document.getElementsByClassName('cart_name_input_change')[i];
//         let cart_discript_input = document.getElementsByClassName('cart_discript_input_change')[i];
//         let cart_count_input = document.getElementsByClassName('cart_count_input_change')[i];
//         let cart_price_input = document.getElementsByClassName('cart_price_input_change')[i];
//         let save_category = document.getElementsByClassName('save_category_change')[i];
//         let category_list = document.getElementsByClassName('category_list')[0];

//         function add_cart_cheker() {
//             if (cart_info[i].id.split('_')[0] == 'category') {
//                 if (cart_name_input.value != null) {
//                     save_category.classList.remove('disactive_but');
//                     return true;
//                 } else {
//                     save_category.classList.add('disactive_but');
//                     return false;
//                 };
//             } else if (cart_info[i].id.split('_')[0] == 'product') {
//                 if (cart_name_input.value != null && cart_count_input.value != null && cart_price_input.value != null) {
//                     save_category.classList.remove('disactive_but');
//                     return true;
//                 } else {
//                     save_category.classList.add('disactive_but');
//                     return false;
//                 };
//             };
//         };
//         let img_base64;
//         fileInput.addEventListener('change', function (e) {
//             e.preventDefault();
//             const file = e.target.files[0];
//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = function (event) {
//                     img_base64 = event.target.result;
//                     cart_adm_img.src = event.target.result;
//                 };
//                 cart_adm_img.classList.remove('hide');
//                 cart_img_none.classList.add('hide');
//                 reader.readAsDataURL(file);
//             };
//             add_cart_cheker();
//         });
//         cart_name_input.addEventListener('input', () => {
//             add_cart_cheker();
//         });
//         cart_discript_input.addEventListener('input', () => {
//             add_cart_cheker();
//         });
//         cart_count_input.addEventListener('input', () => {
//             add_cart_cheker();
//         });
//         cart_price_input.addEventListener('input', () => {
//             add_cart_cheker();
//         });

//         save_category.addEventListener('click', (event) => {
//             console.log(event);
//             event.preventDefault();
//             if (add_cart_cheker()) {
//                 let loading_cart_change = document.getElementsByClassName('loading_cart_change')[i];
//                 loading_cart_change.classList.remove('hide');
//                 if (cart_info[i].id.split('_')[0] == 'category') {
//                     create_category(pickupPointData, cart_info[i].id.split('_')[1], 0, cart_name_input.value, category_list.id, cart_discript_input.value, img_base64);
//                 } else if (cart_info[i].id.split('_')[0] == 'product') {
//                     create_category(pickupPointData, cart_info[i].id.split('_')[1], 7, cart_name_input.value, category_list.id, cart_discript_input.value, img_base64, cart_count_input.value, cart_price_input.value);
//                 };
//             };
//         });
//     };
// };

function admAddCategory(pickupPointData) {
    addCategoryPlus.addEventListener('click', () => {
        hideAll();
        cart.classList.remove('hide');
        addCart.classList.remove('hide');
        mainPageBut.classList.add('active');
    });
    cartAdmPath.addEventListener('click', () => {
        hideAll();
        addCart.classList.add('hide');
        catalogPage.classList.remove('hide');
        mainPageBut.classList.add('active');
    })

    let fileInput = document.getElementById('fileInput');
    let cartImgNone = document.getElementsByClassName('cart_img_none')[0];
    let cartAdmImg = document.getElementsByClassName('cart_adm_img')[0];
    let typeCategory = document.getElementsByClassName('type_category')[0];
    let typeProduct = document.getElementsByClassName('type_product')[0];
    let cartNameInput = document.getElementsByClassName('cart_name_input')[0];
    let cartCountInput = document.getElementsByClassName('cart_count_input')[0];
    let cartPriceInput = document.getElementsByClassName('cart_price_input')[0];
    let cartDiscriptInput = document.getElementsByClassName('cart_discript_input')[0];
    let saveCategory = document.getElementsByClassName('save_category')[0];
    let imgBase64;

    function addCartCheker() {
        if (typeCategory.classList.contains('choiced')) {
            if (cartNameInput.value != '') {
                saveCategory.classList.remove('disactive_but');
            } else {
                saveCategory.classList.add('disactive_but');
            };
        } else if (typeProduct.classList.contains('choiced')) {
            if (cartNameInput.value != '' && cartCountInput.value != '' && cartPriceInput.value != '') {
                saveCategory.classList.remove('disactive_but');
            } else {
                saveCategory.classList.add('disactive_but');
            };
        };
    };

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imgBase64 = event.target.result;
                cartAdmImg.src = imgBase64;
                cartAdmImg.classList.remove('hide');
                cartImgNone.classList.add('hide');
            };
            reader.readAsDataURL(file);
        };
        addCartCheker();
    });

    typeCategory.addEventListener('click', () => {
        typeCategory.classList.add('choiced');
        typeProduct.classList.remove('choiced');
        cartCountInput.classList.add('hide');
        cartPriceInput.classList.add('hide');
        addCartCheker();
    })

    typeProduct.addEventListener('click', () => {
        typeProduct.classList.add('choiced');
        typeCategory.classList.remove('choiced');
        cartCountInput.classList.remove('hide');
        cartPriceInput.classList.remove('hide');
        addCartCheker();
    })

    cartNameInput.addEventListener('input', () => {
        addCartCheker();
    })

    cartDiscriptInput.addEventListener('input', () => {
        addCartCheker();
    })

    cartCountInput.addEventListener('input', () => {
        addCartCheker();
    })

    cartPriceInput.addEventListener('input', () => {
        addCartCheker();
    })

    saveCategory.addEventListener('click', () => {
        categoryList = document.getElementsByClassName('category_list')[0];
        if (!saveCategory.classList.contains('disactive_but')) {
            if (typeCategory.classList.contains('choiced')) {
                create_category(pickupPointData, 0, 0, cartNameInput.value, categoryList.id, cartDiscriptInput.value, imgBase64);
            } else if (typeProduct.classList.contains('choiced')) {
                create_category(pickupPointData, 0, 7, cartNameInput.value, categoryList.id, cartDiscriptInput.value, imgBase64, cartCountInput.value, cartPriceInput.value);
            };
        }
    });
};

function admChangeCategory(pickupPointData) {
    let cartInfo = document.getElementsByClassName('cart_info_change');
    for (let i = 0; i < cartInfo.length; i++) {
        let cartAdmImg = document.getElementsByClassName('cart_img_change')[i];
        let cartImgNone = document.getElementsByClassName('cart_img_none_change')[i];
        let fileInput = document.getElementById('fileInput_' + cartInfo[i].id.split('_')[1]);
        let cartNameInput = document.getElementsByClassName('cart_name_input_change')[i];
        let cartDiscriptInput = document.getElementsByClassName('cart_discript_input_change')[i];
        let cartCountInput = document.getElementsByClassName('cart_count_input_change')[i];
        let cartPriceInput = document.getElementsByClassName('cart_price_input_change')[i];
        let saveCategory = document.getElementsByClassName('save_category_change')[i];
        let imgBase64;

        function addCartCheker() {

            if (cartInfo[i].id.split('_')[0] == 'category') {
                if (cartNameInput.value != '') {
                    saveCategory.classList.remove('disactive_but');
                } else {
                    saveCategory.classList.add('disactive_but');
                };
            } else if (cartInfo[i].id.split('_')[0] == 'product') {

                if (cartNameInput.value != '' && cartCountInput.value != '' && cartPriceInput.value != '') {
                    saveCategory.classList.remove('disactive_but');
                } else {
                    saveCategory.classList.add('disactive_but');
                };
            }
        };

        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    imgBase64 = event.target.result;
                    cartAdmImg.src = imgBase64;
                    cartAdmImg.classList.remove('hide');
                    cartImgNone.classList.add('hide');
                };
                reader.readAsDataURL(file);
            };
            addCartCheker();
        });

        cartNameInput.addEventListener('input', () => {
            addCartCheker();
        })

        cartDiscriptInput.addEventListener('input', () => {
            addCartCheker();
        })

        cartCountInput.addEventListener('input', () => {
            addCartCheker();
        })

        cartPriceInput.addEventListener('input', () => {
            addCartCheker();
        })

        saveCategory.addEventListener('click', () => {
            categoryList = document.getElementsByClassName('category_list')[0];
            if (!saveCategory.classList.contains('disactive_but')) {
                if (cartInfo[i].id.split('_')[0] == 'category') {
                    create_category(pickupPointData, cartInfo[i].id.split('_')[1], 0, cartNameInput.value, categoryList.id, cartDiscriptInput.value, imgBase64);
                } else if (cartInfo[i].id.split('_')[0] == 'product') {
                    create_category(pickupPointData, cartInfo[i].id.split('_')[1], 7, cartNameInput.value, categoryList.id, cartDiscriptInput.value, imgBase64, cartCountInput.value, cartPriceInput.value);
                };
            }
        })
    }
}

function create_category(pickupPointData, id, type, title, category_id, description, img, count, price) {
    const postData = {
        bot_id: 0,
        id_raw: id,
        type: type,
        title: title,
        category_id: parseInt(category_id),
        description: description,
        img_file: img,
        count: count,
        price: price,
        pickup_point_id: pickupPointData.id,
        secret_key: user_data.data.secret_key
    };
    fetch('https://tl-shop.click/api/V2/catalog-edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    }).then(() => {
        catalogPage.classList.remove('hide');
        cart.classList.add('hide');
        reload(pickupPointData, category_id);
    });
};

function admManageCategory(pickupPointData) {
    let categoryList = document.getElementsByClassName('category_list')[0];
    let category = document.getElementsByClassName('category');
    let product = document.getElementsByClassName('product');
    for (let i = 0; i < category.length; i++) {
        let removeCategory = category[i].getElementsByClassName('remove_category_svg')[0];
        let showCategory = category[i].getElementsByClassName('show_category_svg')[0];
        let hideCategory = category[i].getElementsByClassName('hide_category_svg')[0];
        let duplicateCategory = category[i].getElementsByClassName('duplicate_category_svg')[0];

        removeCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(category[i].id, 'remove', pickupPointData, categoryList.id);
        })
        showCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(category[i].id, 'hide', pickupPointData, categoryList.id);
        })
        hideCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(category[i].id, 'hide', pickupPointData, categoryList.id);
        })
        duplicateCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(category[i].id, 'duplicate', pickupPointData, categoryList.id);
        })
    }
    for (let i = 0; i < product.length; i++) {
        let removeCategory = product[i].getElementsByClassName('remove_category_svg')[0];
        let showCategory = product[i].getElementsByClassName('show_category_svg')[0];
        let hideCategory = product[i].getElementsByClassName('hide_category_svg')[0];
        let duplicateCategory = product[i].getElementsByClassName('duplicate_category_svg')[0];

        removeCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(product[i].id, 'remove', pickupPointData, categoryList.id);
        })
        showCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(product[i].id, 'hide', pickupPointData, categoryList.id);
        })
        hideCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(product[i].id, 'hide', pickupPointData, categoryList.id);
        })
        duplicateCategory.addEventListener('click', (event) => {
            event.stopPropagation();
            category_manage(product[i].id, 'duplicate', pickupPointData, categoryList.id);
        })
    }
};

function category_manage(id, type, pickupPointData, categoryId) {
    const postData = {
        bot_id: 0,
        id: id,
        type: type,
        pickupPointId: pickupPointData.id,
        secret_key: user_data.data.secret_key
    };
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    fetch('https://tl-shop.click/api/V2/category_manage', {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(postData),
    }).then(() => {
        reload(pickupPointData, categoryId);
    })
};

function admin_activate(url, value) {
    const post_promocodeData = {
        bot_id: 0,
        id: value,
        user_id: value,
        is_back_cart: true
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
};