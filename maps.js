centerCords = [];

let map;
let mapInitPromise;
const pickupPointMarkers = [];
let nearestPointRevision = 0;
const ROUTE_REQUEST_TIMEOUT_MS = 10000;

const MAP_SELECT_ADDRESS_LOADING_TEXT = 'Определяем адрес...';
const MAP_SELECT_ADDRESS_READY_TEXT = 'Я здесь';
const MAP_SELECT_ADDRESS_FALLBACK_TEXT = 'Выбрать эту точку';
let samedyPickupIconLayout;

function pickupPointMarkerOptions(point) {
    const options = {
        iconLayout: 'default#image',
        iconImageHref: url + point.icon,
        iconImageSize: [40, 45],
        iconImageOffset: [-19, -44]
    };
    if (document.documentElement.dataset.shopTheme === 'Samedy' && ymaps.templateLayoutFactory) {
        samedyPickupIconLayout ||= ymaps.templateLayoutFactory.createClass(
            // Yandex strips the "icon" prefix from options exposed to the icon layout.
            '<div class="samedy-pickup-marker"><img src="$[options.imageHref]" alt=""></div>'
        );
        options.iconLayout = samedyPickupIconLayout;
        options.iconShape = { type: 'Rectangle', coordinates: [[-19, -44], [21, 1]] };
    }
    return options;
}

document.addEventListener('shop-theme-changed', () => {
    for (const { marker, point } of pickupPointMarkers) {
        for (const option of ['iconLayout', 'iconImageHref', 'iconImageSize', 'iconImageOffset', 'iconShape']) {
            marker.options.unset(option);
        }
        marker.options.set(pickupPointMarkerOptions(point));
    }
});

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
            pickupPointMarkerOptions(pickupPointsData[i])
        );

        pickupPointMarkers.push({ marker: placamark, point: pickupPointsData[i] });
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

    readyMap.setCenter([latitude, longitude]); // Яндекс.Карты используют порядок [широта, долгота].
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
            centerCords = (response.GeoObjectCollection.featureMember[i].GeoObject.Point.pos).split(' ').map(Number).reverse();

            setMapCenter(centerCords[0], centerCords[1]);
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

function normalizeMapCoordinates(first, second) {
    // Keep the legacy API order: these arguments are [latitude, longitude].
    if (!['number', 'string'].includes(typeof first) || String(first).trim() === ''
        || !['number', 'string'].includes(typeof second) || String(second).trim() === '') return null;
    const latitude = Number(first);
    const longitude = Number(second);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
        || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return [latitude, longitude];
}

function distanceBetweenMapCoordinates(from, to) {
    const radians = value => value * Math.PI / 180;
    const deltaLatitude = radians(to[0] - from[0]);
    const deltaLongitude = radians(to[1] - from[1]);
    const h = Math.sin(deltaLatitude / 2) ** 2
        + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(deltaLongitude / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

function setRouter(fromLongitude, fromLatitude, toLongitude, toLatitude) {
    const from = normalizeMapCoordinates(fromLongitude, fromLatitude);
    const to = normalizeMapCoordinates(toLongitude, toLatitude);
    if (!from || !to) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
        let route;
        let settled = false;
        const finish = (value, error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (route) {
                // Each request owns its route, so simultaneous requests cannot read each other's result.
                try {
                    route.model.events.remove('requestsuccess', onSuccess);
                    route.model.events.remove('requestfail', onFailure);
                    if (typeof route.destroy === 'function') route.destroy();
                } catch (_) {}
            }
            if (error) reject(error);
            else resolve(value);
        };
        const onSuccess = () => {
            try {
                const activeRoute = route.getActiveRoute() || route.getRoutes().get(0);
                const raw = activeRoute?.properties.get('duration')?.value;
                const value = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
                finish(Number.isFinite(value) && value >= 0 ? value : null);
            } catch (error) {
                finish(null, error);
            }
        };
        const onFailure = () => finish(null, new Error('Сервис маршрутизации Яндекс.Карт отклонил запрос'));
        const timeout = setTimeout(() => finish(null, new Error('Истекло время ожидания маршрута Яндекс.Карт')), ROUTE_REQUEST_TIMEOUT_MS);
        // The timeout also covers loading the Maps SDK.
        ensureMapInitialized().then(() => {
            if (settled) return;
            route = new ymaps.multiRouter.MultiRoute({
                referencePoints: [from, to],
                params: { routingMode: 'auto' }
            }, { boundsAutoApply: false });
            route.model.events.add('requestsuccess', onSuccess);
            route.model.events.add('requestfail', onFailure);
        }).catch(error => {
            finish(null, error);
        });
    });
}

async function getNearestPoint(toLongitude, toLatitude) {
    const revision = ++nearestPointRevision;
    try {
        const destination = normalizeMapCoordinates(toLongitude, toLatitude);
        if (!destination || !isPointInPolygon(destination[1], destination[0], polygon)) {
            pickupPointsDataSort = undefined;
            noDelivery.classList.remove('hide');
            formNoDelivery.classList.remove('hide');
            pickupPointsManage(pickupPointsData);
            return;
        }

        const points = (pickupPointsData || []).filter(point => point.is_active).map(point => {
            const coordinates = normalizeMapCoordinates(point.longitude, point.latitude);
            return {
                ...point, time: null,
                distance: coordinates ? distanceBetweenMapCoordinates(coordinates, destination) : Infinity
            };
        });
        let nextIndex = 0;
        const worker = async () => {
            while (nextIndex < points.length && revision === nearestPointRevision) {
                const point = points[nextIndex++];
                try {
                    point.time = await setRouter(point.longitude, point.latitude, destination[0], destination[1]);
                } catch (_) {
                    point.time = null;
                }
            }
        };
        await Promise.all(Array.from({ length: Math.min(2, points.length) }, worker));
        if (revision !== nearestPointRevision) return;

        const routesUnavailable = points.some(point => !Number.isFinite(point.time));
        if (routesUnavailable) {
            // Do not compare seconds with metres or treat a missing route as zero seconds.
            points.sort((a, b) => a.distance - b.distance);
            console.warn('Часть маршрутов недоступна. Магазины отсортированы по расстоянию по прямой.');
        } else {
            points.sort((a, b) => a.time - b.time || a.distance - b.distance);
        }
        pickupPointsDataSort = points;
        noDelivery.classList.add('hide');
        formNoDelivery.classList.add('hide');
        pickupPointsManage(pickupPointsDataSort, 'sort');
    } catch (error) {
        if (revision !== nearestPointRevision) return;
        pickupPointsDataSort = undefined;
        pickupPointsManage(pickupPointsData);
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
    const visiblePoints = pickupPointsList.filter(point => point.is_active);
    for (let i = 0; i < visiblePoints.length; i++) {

        let deliveryPriceView = 'hide';
        console.log(pickupPointsDataSort);
        let deliveryPrice = 0;
        if (type == 'sort') {
            deliveryPriceView = ''
            visiblePoints[i].delivery_price = parseFloat(visiblePoints[i].delivery_full_price);
            deliveryPrice = parseFloat(visiblePoints[i].delivery_full_price) - parseFloat(visiblePoints[i].delivery_discounted_price);
            if (i == 0) {
                visiblePoints[i].delivery_price = parseFloat(visiblePoints[i].delivery_discounted_price);
                deliveryPrice = parseFloat(visiblePoints[i].delivery_full_price) - parseFloat(visiblePoints[i].delivery_discounted_price) - parseFloat(visiblePoints[i].discount_sum);
            }
        }
        
        let pickup = document.createElement('li');
        pickupList.append(pickup);
        pickup.outerHTML =
            `
        <li class="pickup" data-pickup-point-id="${visiblePoints[i].id}">
            <p class="delivery_price ${deliveryPriceView}">Доставка ${deliveryPrice}₽</p>
            <div class="pickup_container" style="background-color: ${visiblePoints[i].background_color || 'rgb(237, 14, 0)'}">
                <div class="icon_container">
                    <img src="${url + visiblePoints[i].logo}?t=${Date.now()}" class="pickup_icon"
                        loading="lazy" fetchpriority="auto" aria-hidden="true" draggable="false"
                        style="object-fit: contain; object-position: 50% 50%;"></img>
                </div>
            </div>
            <p class="pickup_list_address">${visiblePoints[i].public_address}</p>
        </li>
        `
    };
    openPickupPointCatalog(visiblePoints);

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
    return pickupPointsDataSort?.find(point => point.id == id)
        || pickupPointsData?.find(point => point.id == id);
}
