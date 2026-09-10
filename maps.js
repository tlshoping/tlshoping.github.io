centerCords = [];

let map;
let router;
let mapInitPromise;

const MAP_SELECT_ADDRESS_LOADING_TEXT = 'Определяем адрес...';
const MAP_SELECT_ADDRESS_READY_TEXT = 'Я здесь';
const MAP_SELECT_ADDRESS_FALLBACK_TEXT = 'Выбрать эту точку';

function setMapSelectAddressState(text = MAP_SELECT_ADDRESS_LOADING_TEXT, isReady = false) {
    mapSelectAdress.classList.remove('hide');
    mapSelectAdress.style.display = 'flex';
    mapSelectAdress.style.visibility = 'visible';
    mapSelectAdress.style.pointerEvents = isReady ? 'auto' : 'none';
    mapSelectAdress.style.opacity = isReady ? '1' : '0.85';
    mapSelectAdress.style.cursor = isReady ? 'pointer' : 'default';
    mapSelectAdress.querySelector('.map_select_adress_text').textContent = text;
}

function init() {
    if (map) {
        return map;
    }

    if (centerCords.length == 0) {
        centerCords = [68.95352822824434, 33.08080770254042]
    }

    map = new ymaps.Map('map', {
        center: centerCords,
        zoom: 11.5
    });

    for (let i = 0; i < pickupPointsData.length; i++) {
        const placamark = new ymaps.Placemark(
            [pickupPointsData[i].longitude, pickupPointsData[i].latitude],
            {
                balloonContentHeader: pickupPointsData[i].title,
                balloonContentBody: pickupPointsData[i].public_address,
                balloonContentFooter: pickupPointsData[i].working_hours,
            },
            {
                iconLayout: 'default#image',
                iconImageHref: url + pickupPointsData[i].icon,
                iconImageSize: [40, 45],
                iconImageOffset: [-19, -44]
            }
        );

        map.geoObjects.add(placamark);
    };

    setMapSelectAddressState();

    let center = map.getCenter();
    getAddressByCoordsForMap(center[1], center[0]);

    map.events.add('boundschange', function (e) {
        center = map.getCenter();
        getAddressByCoordsForMap(center[1], center[0]);
    });

    map.controls.remove('geolocationControl'); // удаляем геолокацию
    map.controls.remove('searchControl'); // удаляем поиск
    map.controls.remove('trafficControl'); // удаляем контроль трафика
    map.controls.remove('typeSelector'); // удаляем тип
    map.controls.remove('fullscreenControl'); // удаляем кнопку перехода в полноэкранный режим
    map.controls.remove('zoomControl'); // удаляем контрол зуммирования
    map.controls.remove('rulerControl'); // удаляем контрол правил

    return map;
};

async function ensureMapInitialized() {
    if (map) {
        return map;
    }

    if (!mapInitPromise) {
        mapInitPromise = (async () => {
            await ensureYandexMapsLoaded();

            await new Promise((resolve, reject) => {
                ymaps.ready(() => {
                    try {
                        init();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            return map;
        })().catch((error) => {
            mapInitPromise = null;
            throw error;
        });
    }

    return mapInitPromise;
}

function createAddressByCoordsResponse(response) {
    const geoObject = response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

    if (!geoObject) {
        mapGeocode.textContent = '';
        mapSelectAdress.onclick = null;
        setMapSelectAddressState(MAP_SELECT_ADDRESS_FALLBACK_TEXT, false);
        return;
    }

    mapGeocode.textContent = geoObject.name;
    setMapSelectAddressState(MAP_SELECT_ADDRESS_READY_TEXT, true);

    mapSelectAdress.onclick = () => {
        editAddressHeader(geoObject.name,
            geoObject.description,
            geoObject.Point.pos
        );
        updateUser(geoObject.description,
            geoObject.name,
            geoObject.Point.pos);
        const [toLatitude, toLongitude] = geoObject.Point.pos.split(' ');
        getNearestPoint(toLongitude, toLatitude);
    };
};

async function getAddressByCoordsForMap(longitude, latitude) {
    try {
        setMapSelectAddressState();
        const json_data = await fetchYandexGeocode(`${longitude},${latitude}`);
        createAddressByCoordsResponse(json_data.response);
    } catch (error) {
        mapSelectAdress.onclick = null;
        setMapSelectAddressState(MAP_SELECT_ADDRESS_FALLBACK_TEXT, false);
        console.error('Ошибка получения адреса для карты:', error);
    }
};

async function setMapCenter(latitude, longitude) {
    const readyMap = await ensureMapInitialized();

    readyMap.setCenter([latitude, longitude]); // Яндекс.Карты используют порядок [долгота, широта]
    readyMap.setZoom(17); // Увеличиваем масштаб для лучшего обзора

}

function createAddressSearchResponse(response) {
    let addressSearchResponses = document.getElementsByClassName('address_search_response');
    for (let i = 0; i < addressSearchResponses.length;) {
        addressSearchResponses[0].remove();
    };
    notFoundAddress.classList.add('hide');

    for (let i = 0; i < response.GeoObjectCollection.featureMember.length; i++) {
        let addressSearchResponse = document.createElement('li');
        addressSearchResponsesList.append(addressSearchResponse);
        addressSearchResponse.outerHTML =
            `
        <li class="address_search_response">
            <p class="address_search_response_name">${response.GeoObjectCollection.featureMember[i].GeoObject.name}</p>
            <p class="address_search_response_discript">${response.GeoObjectCollection.featureMember[i].GeoObject.description}</p>
        </li>
        `;
    };
    if (response.GeoObjectCollection.featureMember.length == 0) {
        notFoundAddress.classList.remove('hide');
    };

    for (let i = 0; i < addressSearchResponses.length; i++) {
        addressSearchResponses[i].addEventListener('click', () => {
            hideAll();
            mapPage.classList.remove('hide');
            centerCords = (response.GeoObjectCollection.featureMember[i].GeoObject.Point.pos).split(' ').map(parseFloat);

            setMapCenter(centerCords[1], centerCords[0]);
        });
    };

};

async function addressSearch(request) {
    try {
        const json_data = await fetchYandexGeocode(request);
        createAddressSearchResponse(json_data.response);
    } catch (error) {
        console.error('Ошибка поиска адреса:', error);
    }
};

// Обновленный обработчик ввода с debounce (задержка 1000 мс)
searchMapInput.addEventListener('input', debounce(() => {
    if (searchMapInput.value.trim() !== '') {
        addressSearch(searchMapInput.value);
    };
}, 1000)); // Задержка 1 секунда (1000 мс)

searchMapInput.addEventListener('input', () => {
    if (searchMapInput.value != '') {
        searchMapContanerClose.classList.add('show')
    } else {
        searchMapContanerClose.classList.remove('show');
    }
});

document.addEventListener('click', function (event) {
    if (!searchMapContaner.contains(event.target) && searchMapInput.value == '') {
        searchMapContanerClose.classList.remove('show');
    }
});

searchMapContanerClose.addEventListener('click', () => {
    searchMapContanerClose.classList.remove('show');
    searchMapInput.value = '';
    let addressSearchResponses = document.getElementsByClassName('address_search_response');
    for (let i = 0; i < addressSearchResponses.length;) {
        addressSearchResponses[0].remove();
    };
    notFoundAddress.classList.add('hide');
});

function editAddressHeader(name, description, coords) {
    userAddress = `${description}, ${name}`;
    addressHeaderText.textContent = name;
    addressHeaderDescription.textContent = description;
    if (coords) {
        userCoords = coords;
    };
}

async function getAddressByCoords(longitude, latitude) {
    try {
        const json_data = await fetchYandexGeocode(`${longitude},${latitude}`);
        console.log(json_data.response);
        addressQuestion.classList.remove('hide');
        addressNotification.classList.add('hide');
        addressQuestionDiscript.textContent = json_data.response.GeoObjectCollection.featureMember[0].GeoObject.name;
        editAddressHeader(json_data.response.GeoObjectCollection.featureMember[0].GeoObject.name,
            json_data.response.GeoObjectCollection.featureMember[0].GeoObject.description,
            json_data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos);
        addressQuestionYes.addEventListener('click', () => {
            updateUser(json_data.response.GeoObjectCollection.featureMember[0].GeoObject.description,
                json_data.response.GeoObjectCollection.featureMember[0].GeoObject.name,
                json_data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos);
            const [toLatitude, toLongitude] = json_data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
            getNearestPoint(toLongitude, toLatitude);
        });
    } catch (error) {
        console.error('Ошибка получения адреса по координатам:', error);
    }
};

function requestGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                await getAddressByCoords(position.coords.longitude, position.coords.latitude);
                await setMapCenter(position.coords.latitude, position.coords.longitude)
            },
            (error) => {
                console.error("Ошибка получения геолокации:", error.message);
            }
        );
    } else {
        console.log("Геолокация не поддерживается браузером");
    }
}

async function setRouter(fromLongitude, fromLatitude, toLongitude, toLatitude) {
    const readyMap = await ensureMapInitialized();

    return new Promise((resolve, reject) => {
        // Удаляем предыдущий маршрут, если он есть
        if (router) {
            readyMap.geoObjects.remove(router);
        }

        router = new ymaps.multiRouter.MultiRoute({
            referencePoints: [
                [fromLongitude, fromLatitude],
                [toLongitude, toLatitude]
            ],
            params: {
                routingMode: 'masstransit'
            }
        }, {
            boundsAutoApply: false
        });

        // Обработчик успешного построения маршрута
        router.model.events.add('requestsuccess', function () {
            const routes = router.getRoutes();

            if (routes.getLength() > 0) {
                const firstRoute = routes.get(0);
                const value = firstRoute.properties.get('duration').value;
                resolve(value); // Возвращаем время в пути
            } else {
                console.log("Маршрут не найден.");
                resolve(null);
            }
        });

        // Обработчик ошибки
        router.model.events.add('requestfail', function () {
            console.log("Ошибка при построении маршрута");
            reject(new Error("Ошибка при построении маршрута"));
        });
    });
}

async function getNearestPoint(toLongitude, toLatitude) {
    try {

        await ensureMapInitialized();

        noDelivery.classList.add('hide');
        formNoDelivery.classList.add('hide');

        pickupPointsDataSort = JSON.parse(JSON.stringify(pickupPointsData));

        if (await isPointInPolygon(toLatitude, toLongitude, polygon)) {
            // Перебираем все точки и строим маршруты последовательно
            for (let i = 0; i < pickupPointsData.length; i++) {
                const time = await setRouter(
                    pickupPointsDataSort[i].longitude,
                    pickupPointsDataSort[i].latitude,
                    toLongitude,
                    toLatitude
                );

                pickupPointsDataSort[i].time = await time;
            }

            // Находим ближайшую точку (с минимальным временем)
            pickupPointsDataSort = await pickupPointsDataSort.sort((a, b) => a.time - b.time);

            pickupPointsManage(pickupPointsDataSort, 'sort')
        } else {
            noDelivery.classList.remove('hide');
            formNoDelivery.classList.remove('hide');
            pickupPointsManage(pickupPointsData);
        };

    } catch (error) {
        console.error("Ошибка в getNearestPoint:", error);
    }
}

function pickupPointsManage(pickupPointsList, type) { // Генерация точек самовывоза

    if (basketUpdateInterval) {
        clearInterval(basketUpdateInterval);
        basketUpdateInterval = null;
    }

    let pickupList = document.getElementsByClassName('pickup_list')[0];
    let pickupElementsList = document.getElementsByClassName('pickup');
    for (let i = 0; i < pickupElementsList.length;) {
        pickupElementsList[0].remove();
    }
    for (let i = 0; i < pickupPointsList.length; i++) {

        if (!pickupPointsList[i].is_active) {
            continue;
        }

        let deliveryPriceView = 'hide';
        console.log(pickupPointsDataSort);
        let deliveryPrice = 0;
        if (type == 'sort') {
            console.log(pickupPointsDataSort);
            deliveryPriceView = ''
            pickupPointsDataSort[i].delivery_price = parseFloat(pickupPointsDataSort[i].delivery_full_price);
            deliveryPrice = parseFloat(pickupPointsDataSort[i].delivery_full_price) - parseFloat(pickupPointsDataSort[i].delivery_discounted_price);
            if (i == 0) {
                pickupPointsDataSort[i].delivery_price = parseFloat(pickupPointsDataSort[i].delivery_discounted_price);
                deliveryPrice = parseFloat(pickupPointsDataSort[i].delivery_full_price) - parseFloat(pickupPointsDataSort[i].delivery_discounted_price) - parseFloat(pickupPointsDataSort[i].discount_sum);
            }
        }
        
        let pickup = document.createElement('li');
        pickupList.append(pickup);
        pickup.outerHTML =
            `
        <li class="pickup">
            <p class="delivery_price ${deliveryPriceView}">Доставка ${deliveryPrice}₽</p>
            <div class="pickup_container" style="background-color: ${pickupPointsList[i].background_color || 'rgb(237, 14, 0)'}">
                <div class="icon_container">
                    <img src="${url + pickupPointsList[i].logo}?t=${Date.now()}" class="pickup_icon"
                        loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false"
                        style="object-fit: contain; object-position: 50% 50%;"></img>
                </div>
            </div>
            <p class="pickup_list_address">${pickupPointsList[i].public_address}</p>
        </li>
        `
        if (type == 'sort') {
            openPickupPointCatalog(pickupPointsDataSort);
        } else {
            openPickupPointCatalog(pickupPointsData);
        };


    };

    get_basket();

    // Устанавливаем новый интервал для обновления корзины
    basketUpdateInterval = setInterval(get_basket, 60000); // 60 секунд
};

function isPointInPolygon(latitude, longitude, polygon) {

    const x = latitude;
    const y = longitude;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

function getPickupPointDataById(id) {
    if (pickupPointsDataSort === undefined) {
        for (let i = 0; i < pickupPointsData.length; i++) {
            if (pickupPointsData[i].id == id) {
                return pickupPointsData[i];
            }
        }
    } else {
        for (let i = 0; i < pickupPointsDataSort.length; i++) {
            if (pickupPointsDataSort[i].id == id) {
                return pickupPointsDataSort[i];
            }
        }
    }
}
