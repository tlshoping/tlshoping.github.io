async function correctSpelling(botId, pickupPointId, text) {
    try {
        const postData = {
            botId: 0,
            pickupPointId: pickupPointId,
            text: text
        };
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        const response = await fetch('https://tl-shop.click/api/V2/search', {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(postData),
        });

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Не удалось получить данные:', error);
    }
}

function getAllProducts(jsonData) {
    let products = [];
    function searchProducts(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }

        // Проверяем текущий объект на соответствие условиям
        if (obj.is_view === true && obj.type == 7) {
            products.push(obj);
        }

        // Рекурсивно обходим все свойства объекта
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach(item => searchProducts(item));
            } else if (typeof obj[key] === 'object') {
                searchProducts(obj[key]);
            }
        }
    }

    searchProducts(jsonData);

    return products;
};

function searchGenerator(searchPath, searchRequest, pickupPointData) {

    const pathList = searchPath.split('_');
    let SearchCatalog = [];
    let SearchCatalogCategoryList = [];
    for (let i = 0; i < pathList.length; i++) {
        const products = findById(common_json_data, parseInt(pathList[i]));

        if (products.type != 7) {
            SearchCatalogCategoryList.push(...getAllProducts(products));
        } else {
            SearchCatalog.push(products);
        }
    };

    SearchCatalog.push(...SearchCatalogCategoryList);
    const SearchCatalogArrays = Array.from(
        new Set(SearchCatalog.map(JSON.stringify))
    ).map(JSON.parse);

    let path = document.getElementsByClassName('path')[0];
    let category_list = document.getElementsByClassName('category_list')[0];
    let cart = document.getElementsByClassName('cart')[0];
    let cart_category = document.getElementsByClassName('cart_category');
    let cart_product = document.getElementsByClassName('cart_product');
    let add_cart = document.getElementsByClassName('add_cart');
    let catalog = document.getElementsByClassName('catalog')[0];

    catalog.classList.remove('hide');
    if (path) {
        path.remove();
    } else {
        mainPath.remove();
    };
    cart.classList.add('hide');
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

    create_categories(SearchCatalogArrays, 0, 'search', searchRequest, pickupPointData);
};

function search_hints(pickupPointData) {
    new Promise((resolve) => {
        search_loading.classList.remove('hide');
        not_found.classList.add('hide');
        const search = document.querySelector('.search');
        const searchBar = document.querySelector('.search_bar');
        let searchAnswersList = document.getElementsByClassName('search_answer');
        for (; searchAnswersList.length;) {
            searchAnswersList[0].remove();
        };
        if (search.value == '') {

            new Promise((innerResolve) => {

                for (let i = 0; i < common_json_data.length; i++) { //цикл основных категорий
                    if (common_json_data[i]['is_view'] == true) {
                        let searchAnswer = document.createElement('div');
                        searchBar.append(searchAnswer);
                        searchAnswer.outerHTML = `<div class="search_answer" id="${common_json_data[i].id}">
                            <p class="search_part">Все товары</p>
                            <p class="search_category_part">- ${common_json_data[i].title}</p>
                        </div>`;
                    };
                };
                innerResolve();
            }).then(() => {
                search_loading.classList.add('hide');
                resolve();
            });

        } else if (!/^\s*$/.test(search.value)) {
            correctSpelling(0, pickupPointData.id, search.value.toLowerCase()).then(searchResponseList => {

                if (searchResponseList.length > 0) {
                    let directSearchList = [];
                    for (let i = 0; i < searchResponseList.length; i++) {
                        let searchAnswer = document.createElement('div');
                        searchBar.append(searchAnswer);
                        searchAnswer.outerHTML = `<div class="search_answer" id="${searchResponseList[i].ids.join('_')}">
                            <p class="search_part">${searchResponseList[i].word}</p>
                        </div>`;
                        for (let j = 0; j < searchResponseList[i].ids.length; j++) {
                            const searchResponse = findById(common_json_data, searchResponseList[i].ids[j]);
                            if (searchResponse.children.length > 0) {
                                if (searchResponse.category_id != 0) {
                                    const searchParentResponse = findById(common_json_data, searchResponse.category_id);
                                    let searchAnswer = document.createElement('div');
                                    searchBar.append(searchAnswer);
                                    searchAnswer.outerHTML = `<div class="search_answer" id="${searchResponse.id}">
                                    <p class="search_part">${searchResponse.title}</p>
                                    <p class="search_category_part">- ${searchParentResponse.title}</p>
                                </div>`;
                                } else {
                                    let searchAnswer = document.createElement('div');
                                    searchBar.append(searchAnswer);
                                    searchAnswer.outerHTML = `<div class="search_answer" id="${searchResponse.id}">
                                    <p class="search_part">${searchResponse.title}</p>
                                </div>`;
                                }

                            } else {
                                let flag = true;
                                let directSearchListId;
                                for (let k = 0; k < directSearchList.length; k++) {
                                    if (directSearchList[k].parent == searchResponse.category_id) {
                                        flag = false;
                                        directSearchListId = k;
                                    };
                                };

                                if (flag) {
                                    directSearchList.push(
                                        {
                                            word: searchResponseList[i].word,
                                            parent: searchResponse.category_id,
                                            response: [searchResponse.id]
                                        }
                                    );
                                } else {
                                    directSearchList[directSearchListId].response.push(searchResponse.id);
                                };

                            };
                        };
                    };
                    for (let i = 0; i < directSearchList.length; i++) {
                        const searchParentResponse = findById(common_json_data, directSearchList[i].parent);
                        let searchAnswer = document.createElement('div');
                        searchBar.append(searchAnswer);
                        searchAnswer.outerHTML = `<div class="search_answer" id="${directSearchList[i].response.join('_')}">
                            <p class="search_part">${directSearchList[i].word}</p>
                            <p class="search_category_part">- ${searchParentResponse.title}</p>
                        </div>`;
                    }
                } else {
                    not_found.classList.remove('hide');
                }
            }).then(() => {
                search_loading.classList.add('hide');
                resolve();
            });
        } else {
            resolve();
        };
    }).then(() => {
        let searchAnswersList = document.querySelectorAll('.search_answer');
        for (let i = 0; i < searchAnswersList.length; i++) {
            searchAnswersList[i].addEventListener('click', () => {
                searchGenerator(searchAnswersList[i].id, searchAnswersList[i].innerText, pickupPointData);
            });
        };
    });
};

function search_manage(pickupPointData) { // Управление логистикой поиска

    // Отменяем предыдущие обработчики
    if (searchController) {
        searchController.abort();
    }

    const controller = new AbortController();
    searchController = controller;
    const { signal } = controller;

    const searchInput = document.querySelector('.search');
    const searchBut = document.querySelector('.search_but');
    const searchSvg = document.querySelector('.search_svg');
    const searchBar = document.querySelector('.search_bar');
    const searchLine = document.querySelector('.search_line');
    const searchContainer = document.querySelector('.search_container');

    searchInput.addEventListener('focus', function () {
        searchBar.classList.add('show');
        searchLine.classList.add('show');
        searchInput.classList.add('show');
        searchBut.classList.add('show');
        searchSvg.classList.add('show');
        search_hints(pickupPointData);
    }, { signal });

    searchBut.addEventListener('click', function () {
        searchBar.classList.remove('show');
        searchLine.classList.remove('show');
        searchInput.classList.remove('show');
        searchBut.classList.remove('show');
        searchSvg.classList.remove('show');
        searchInput.value = '';
    }, { signal });

    document.addEventListener('click', function (event) {
        if (!searchContainer.contains(event.target) && event.target !== searchBut) {
            searchBar.classList.remove('show');
            searchLine.classList.remove('show');
            searchInput.classList.remove('show');
            searchBut.classList.remove('show');
            searchSvg.classList.remove('show');
        }
    }, { signal });

    searchInput.addEventListener('input', debounce(() => {
        search_hints(pickupPointData);
    }, 1000, { signal }));

    searchBar.addEventListener('click', function () {
        searchBar.classList.remove('show');
        searchLine.classList.remove('show');
        searchInput.classList.remove('show');
        searchBut.classList.remove('show');
        searchSvg.classList.remove('show');
        searchInput.blur();
    }, { signal });

    searchInput.addEventListener('search', () => {
        searchBar.classList.remove('show');
        searchLine.classList.remove('show');
        searchInput.classList.remove('show');
        searchBut.classList.remove('show');
        searchSvg.classList.remove('show');
        searchInput.blur();
        const searchAnswersList = document.querySelectorAll('.search_answer')[0];
        searchGenerator(searchAnswersList.id, searchAnswersList.innerText);
    }, { signal });
};