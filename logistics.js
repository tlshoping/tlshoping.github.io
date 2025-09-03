

function hideAll() {
    mainPage.classList.add('hide');
    mapPage.classList.add('hide');
    searchMap.classList.add('hide');
    catalogPage.classList.add('hide');
    basketPage.classList.add('hide');
    profilePage.classList.add('hide');
    mainPageBut.classList.remove('active');
    basketBut.classList.remove('active');
    profileBut.classList.remove('active');
    adminBut.classList.remove('active');
    if (document.getElementsByClassName('loading_cart')[0]) {
        document.getElementsByClassName('loading_cart')[0].classList.add('hide');
    }
    for (let i = 0; i < document.getElementsByClassName('loading_cart_change').length; i++) {
        document.getElementsByClassName('loading_cart_change')[i].classList.add('hide');
    };
    for (let i = 0; i < document.getElementsByClassName('cart_category').length; i++) {
        document.getElementsByClassName('cart_category')[i].classList.add('hide');
    };
    cart.classList.add('hide');
    basketEmpty.classList.add('hide');
    basketFull.classList.add('hide');
    basketPath.classList.add('hide');
    formPath.classList.add('hide');
    form.classList.add('hide');
    formContainer.classList.add('hide');
    ordersBody.classList.add('hide');
    ordersPath.classList.add('hide');
    profilePath.classList.add('hide');
    profileBody.classList.add('hide');
    helpPath.classList.add('hide');
    helpBody.classList.add('hide');
    rulesPath.classList.add('hide');
    rulesBody.classList.add('hide');
};

basketEmptyCatalogeBut.addEventListener('click', () => {
    hideAll();
    mainPageBut.classList.add('active');
    mainPage.classList.remove('hide');
});

mainPageBut.addEventListener('click', () => {
    hideAll();
    mainPageBut.classList.add('active');
    mainPage.classList.remove('hide');
});

basketBut.addEventListener('click', () => {
    hideAll();
    basketBut.classList.add('active');
    basketPage.classList.remove('hide');
    basketPath.classList.remove('hide');
    console.log(basketMainList);
    if (basketMainList.items.length > 0) {
        basketFull.classList.remove('hide');
    } else {
        basketEmpty.classList.remove('hide');
        basketAdress.innerHTML = '';
    };
});

profileBut.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    profilePath.classList.remove('hide');
    profileBody.classList.remove('hide');
});

adminBut.addEventListener('click', () => {
    hideAll();
    adminBut.classList.add('active');
    adminPage.classList.remove('hide');
});

function openPickupPointCatalog(pickupPointsList) {
    let pickupElementsList = document.getElementsByClassName('pickup');
    for (let i = 0; i < pickupElementsList.length; i++) {
        const newElement = pickupElementsList[i].cloneNode(true);
        pickupElementsList[i].parentNode.replaceChild(newElement, pickupElementsList[i]);
        newElement.addEventListener('click', async () => {
            try {

                loading.classList.remove('hide');
                let category_list = document.getElementsByClassName('category_list')[0];
                let cart_category = document.getElementsByClassName('cart_category');
                let cart_product = document.getElementsByClassName('cart_product');
                let add_cart = document.getElementsByClassName('add_cart');
                let path = document.getElementsByClassName('path')[0];
                let mainPath = document.getElementById('mainPath');
                if (path) {
                    path.remove();
                };
                if (mainPath) {
                    mainPath.remove();
                };
                if (category_list) {
                    category_list.remove();
                }
                for (let i = 0; i < cart_category.length;) {
                    cart_category[0].remove();
                };
                for (let i = 0; i < cart_product.length;) {
                    cart_product[0].remove();
                };
                for (let i = 0; i < add_cart.length;) {
                    add_cart[0].remove();
                };

                const catalogJson = await getCatalog(pickupPointsList[i]);
                create_categories(await catalogJson, 0, '', '', pickupPointsList[i]);

                hideAll();
                catalogPage.classList.remove('hide');
                mainPageBut.classList.add('active');
            }
            catch (error) {
                console.log(error);
            }
        });
    };
}

addressNotificationSelect.addEventListener('click', () => {
    hideAll();
    addressNotification.classList.remove('show');
    mapPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

addressQuestionNo.addEventListener('click', () => {
    hideAll();
    addressQuestion.classList.remove('show');
    mapPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

addressHeader.addEventListener('click', () => {
    hideAll();
    mapPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

formAdressEdit.addEventListener('click', () => {
    hideAll();
    mapPage.classList.remove('hide');
    mainPageBut.classList.add('active');
    formUserAdress.classList.remove('incorrect_text');
    formAdressEdit.classList.remove('incorrect_svg');
});

addressNotificationLater.addEventListener('click', () => {
    addressNotification.classList.remove('show');
});

addressQuestionYes.addEventListener('click', () => {
    addressQuestion.classList.remove('show');
});

closeMapBut.addEventListener('click', () => {
    hideAll();
    mainPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

searchMapBut.addEventListener('click', () => {
    hideAll();
    searchMap.classList.remove('hide');
    mainPageBut.classList.add('active');
});

mapSelectAdress.addEventListener('click', () => {
    hideAll();
    mainPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

closeSearchMapBut.addEventListener('click', () => {
    hideAll();
    mapPage.classList.remove('hide');
    mainPageBut.classList.add('active');
});

function backToMainPage() { //Назад в категорию
    mainPath.addEventListener('click', () => {
        let category_list = document.getElementsByClassName('category_list')[0];
        let cart_category = document.getElementsByClassName('cart_category');
        let cart_product = document.getElementsByClassName('cart_product');
        let add_cart = document.getElementsByClassName('add_cart');
        mainPath.remove();
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
        hideAll();
        mainPage.classList.remove('hide');
        mainPageBut.classList.add('active');
    });
};

resultBut.addEventListener('click', () => {
    hideAll();
    formPath.classList.remove('hide');
    form.classList.remove('hide');
    basketBut.classList.add('active');
    formContainer.classList.remove('hide');
});

formPath.addEventListener('click', () => {
    hideAll();
    basketPage.classList.remove('hide');
    basketPath.classList.remove('hide');
    basketFull.classList.remove('hide');
    basketBut.classList.add('active');
});

function changeMethodToDelivery() {
    methodDelivery.classList.add('method_selected');
    methodPickup.classList.remove('method_selected');
    formAdressDiscription.classList.add('hide');
    formAdressEdit.classList.remove('hide');
    fullAdressForm.classList.remove('hide');
    formComment.classList.remove('hide');
    formUserAdress.classList.remove('hide');
    formShopAdress.classList.add('hide');
    dateDeliveryForm.classList.remove('hide');
    datePickupForm.classList.add('hide');
    hoursDelivery.classList.remove('hide');
    hoursPickup.classList.add('hide');
    formData.method = 'delivery';
    formNoDelivery.classList.remove('hide_no_delivery');
    deliveryPriceContainer.classList.remove('hide');
    createPrice();
    orderChecker();
}

methodDelivery.addEventListener('click', () => {
    changeMethodToDelivery();
})

function changeMethodToPickup() {
    methodDelivery.classList.remove('method_selected');
    methodPickup.classList.add('method_selected');
    formAdressDiscription.classList.remove('hide');
    formAdressEdit.classList.add('hide');
    fullAdressForm.classList.add('hide');
    formComment.classList.add('hide');
    formUserAdress.classList.add('hide');
    formShopAdress.classList.remove('hide');
    dateDeliveryForm.classList.add('hide');
    datePickupForm.classList.remove('hide');
    hoursDelivery.classList.add('hide');
    hoursPickup.classList.remove('hide');
    formData.method = 'pickup';
    formNoDelivery.classList.add('hide_no_delivery');
    createPrice();
    orderChecker();
    deliveryPriceContainer.classList.add('hide');
}

methodPickup.addEventListener('click', () => {
    changeMethodToPickup();
})

inputApartment.addEventListener('focus', updateApartment);
inputApartment.addEventListener('blur', updateApartment);
inputApartment.addEventListener('input', updateApartment);

function updateApartment() {
    if (inputApartment.value || document.activeElement === inputApartment) {
        labelApartment.classList.add('text_active');
        inputApartment.classList.add('input_active');
    } else {
        labelApartment.classList.remove('text_active');
        inputApartment.classList.remove('input_active');
    }
    if (document.activeElement === inputApartment) {
        inputApartment.classList.add('input_active');
    } else {
        inputApartment.classList.remove('input_active');
    }
    formData.apartment = inputApartment.value;
}

inputEntrance.addEventListener('focus', updateEntrance);
inputEntrance.addEventListener('blur', updateEntrance);
inputEntrance.addEventListener('input', updateEntrance);

function updateEntrance() {
    if (inputEntrance.value || document.activeElement === inputEntrance) {
        labelEntrance.classList.add('text_active');
    } else {
        labelEntrance.classList.remove('text_active');
    }
    if (document.activeElement === inputEntrance) {
        inputEntrance.classList.add('input_active');
    } else {
        inputEntrance.classList.remove('input_active');
    }
    formData.entrance = inputEntrance.value;
}

inputFloor.addEventListener('focus', updateFloor);
inputFloor.addEventListener('blur', updateFloor);
inputFloor.addEventListener('input', updateFloor);

function updateFloor() {
    if (inputFloor.value || document.activeElement === inputFloor) {
        labelFloor.classList.add('text_active');
    } else {
        labelFloor.classList.remove('text_active');
    }
    if (document.activeElement === inputFloor) {
        inputFloor.classList.add('input_active');
    } else {
        inputFloor.classList.remove('input_active');
    }
    formData.floor = inputFloor.value;
}

inputDoorphone.addEventListener('focus', updateDoorphone);
inputDoorphone.addEventListener('blur', updateDoorphone);
inputDoorphone.addEventListener('input', updateDoorphone);

function updateDoorphone() {
    if (inputDoorphone.value || document.activeElement === inputDoorphone) {
        labelDoorphone.classList.add('text_active');
    } else {
        labelDoorphone.classList.remove('text_active');
    }
    if (document.activeElement === inputDoorphone) {
        inputDoorphone.classList.add('input_active');
    } else {
        inputDoorphone.classList.remove('input_active');
    }
    formData.doorphone = inputDoorphone.value;
}

textareaComment.addEventListener('focus', updateComment);
textareaComment.addEventListener('blur', updateComment);
textareaComment.addEventListener('input', updateComment);

function updateComment() {
    if (textareaComment.value || document.activeElement === textareaComment) {
        labelComment.classList.add('text_active');
    } else {
        labelComment.classList.remove('text_active');
    }
    if (document.activeElement === textareaComment) {
        textareaComment.classList.add('input_active');
    } else {
        textareaComment.classList.remove('input_active');
    }
    formData.comment = textareaComment.value;
}

inputPhone.addEventListener('focus', updatePhone);
inputPhone.addEventListener('blur', updatePhone);
inputPhone.addEventListener('input', updatePhone);

function updatePhone() {
    if (inputPhone.value || document.activeElement === inputPhone) {
        labelPhone.classList.add('text_active');
    } else {
        labelPhone.classList.remove('text_active');
    }
    if (document.activeElement === inputPhone) {
        inputPhone.classList.add('input_active');
    } else {
        inputPhone.classList.remove('input_active');
    }
}

// Добавляем +7 при фокусе
inputPhone.addEventListener('focus', () => {
    if (!inputPhone.value.startsWith('+7')) {
        inputPhone.value = '+7' + inputPhone.value;
    }
});

// Запрещаем удаление +7
inputPhone.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && inputPhone.selectionStart <= 2) {
        e.preventDefault();
    }
});

// Валидация ввода
inputPhone.addEventListener('input', (e) => {
    // Удаляем все нецифровые символы
    let value = e.target.value.replace(/\D/g, '');

    // Оставляем только цифры после +7
    if (value.startsWith('7')) {
        value = value.substring(1);
    }
    value = value.substring(0, 10);

    // Форматируем номер
    let formattedValue = '+7';
    if (value.length > 0) {
        formattedValue += ' (' + value.substring(0, 3);
    }
    if (value.length > 3) {
        formattedValue += ') ' + value.substring(3, 6);
    }
    if (value.length > 6) {
        formattedValue += '-' + value.substring(6, 8);
    }
    if (value.length > 8) {
        formattedValue += '-' + value.substring(8, 10);
    }

    e.target.value = formattedValue;

    // Проверяем валидность
    if (value.length < 10) {
        e.target.classList.add('input_incorrect');
    } else {
        e.target.classList.remove('input_incorrect');
    }
    formData.phone = inputPhone.value;
    orderChecker();
});

// Запрещаем вставку невалидных данных
inputPhone.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    const numbers = text.replace(/\D/g, '');
    if (numbers.length > 0) {
        inputPhone.value = '+7' + numbers.substring(0, 10);
    }
});

inputTelegram.addEventListener('focus', updateTelegram);
inputTelegram.addEventListener('blur', updateTelegram);
inputTelegram.addEventListener('input', updateTelegram);

function updateTelegram() {
    if (inputTelegram.value || document.activeElement === inputTelegram) {
        labelTelegram.classList.add('text_active');
    } else {
        labelTelegram.classList.remove('text_active');
    }
    if (document.activeElement === inputTelegram) {
        inputTelegram.classList.add('input_active');
    } else {
        inputTelegram.classList.remove('input_active');
    }
    formData.telegram = inputTelegram.value;
}

dateDeliveryForm.addEventListener('click', () => {
    dateSelectionDelivery.classList.remove('hide');
})

datePickupForm.addEventListener('click', () => {
    dateSelectionPickup.classList.remove('hide');
})

dateSelectionDelivery.addEventListener('click', function (event) {
    if (dateSelectionContainerDelivery.contains(event.target)) {
        return; // Игнорируем клик внутри контейнера
    }

    dateSelectionDelivery.classList.add('hide');
});

dateSelectionPickup.addEventListener('click', function (event) {
    if (dateSelectionContainerPickup.contains(event.target)) {
        return; // Игнорируем клик внутри контейнера
    }

    dateSelectionPickup.classList.add('hide');
});

closeDateSelectionDelivery.addEventListener('click', () => {
    dateSelectionDelivery.classList.add('hide');
})

closeDateSelectionPickup.addEventListener('click', () => {
    dateSelectionPickup.classList.add('hide');
})

bonusesContainer.addEventListener('click', () => {
    if (bonusesOff.classList.contains('hide')) {
        bonusesOff.classList.remove('hide');
        bonusesOn.classList.add('hide');
        discountContainer.classList.add('hide');
        formData.bonuses = false;
    } else if (bonusesOn.classList.contains('hide')) {
        bonusesOff.classList.add('hide');
        bonusesOn.classList.remove('hide');
        discountContainer.classList.remove('hide');
        formData.bonuses = true;
    }
    createPrice();
    if (methodPickup.classList.contains('method_selected')) {
        deliveryPriceContainer.classList.add('hide');
    }
})

async function choiceTime(intervals, pickupPointId, reservationInterval) {
    const hoursHtml = document.getElementsByClassName('hour');

    for (let i = 0; i < hoursHtml.length; i++) {
        hoursHtml[i].addEventListener('click', () => {
            if (hoursHtml[i].id.split('_')[1] === 'delivery') {
                formData.icoDateDelivery = hoursHtml[i].id.split('_')[2];

                createHours(intervals, new Date, formData.icoDateDelivery, 'delivery', pickupPointId, reservationInterval);

            } else if (hoursHtml[i].id.split('_')[1] === 'pickup') {
                formData.icoDatePickup = hoursHtml[i].id.split('_')[2];

                createHours(intervals, new Date, formData.icoDatePickup, 'pickup', pickupPointId, reservationInterval);
            }
        })
    }
};

transfer.addEventListener('click', () => {
    cash.classList.remove('hour_active');
    transfer.classList.add('hour_active');
    formData.payment = 'transfer';
})

cash.addEventListener('click', () => {
    cash.classList.add('hour_active');
    transfer.classList.remove('hour_active');
    formData.payment = 'cash';
})

payBut.addEventListener('click', () => {
    console.log(formData);
    if (orderChecker()) {
        createOrder();
        loading.classList.remove('hide');
    } else {
        if ((!userAddress || !formNoDelivery.classList.contains('hide')) && formData.method == 'delivery') {
            formPath.scrollIntoView({
                behavior: 'smooth', // плавная прокрутка
                block: 'start'      // выравнивание по верхней границе
            });
            formUserAdress.classList.add('incorrect_text');
            formAdressEdit.classList.add('incorrect_svg');
            return;
        }
        if (!(formData.phone && formData.phone.split('').length == 18)) {
            contactForm.scrollIntoView({
                behavior: 'smooth', // плавная прокрутка
                block: 'start'      // выравнивание по верхней границе
            });
            inputPhone.focus({
                preventScroll: false
            });
            return;
        }
    }
})



function choiceDate() {
    const dateDeliveryHtml = dateSelectionListDelivery.getElementsByClassName('date_selection_item');

    for (let i = 0; i < dateDeliveryHtml.length; i++) {
        dateDeliveryHtml[i].addEventListener('click', () => {
            for (let j = 0; j < datePickupHtml.length; j++) {
                dateDeliveryHtml[j].getElementsByClassName('date_selection_item_circle')[0].classList.remove('selected_circle');
            };
            dateDeliveryHtml[i].getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        })
    }

    const datePickupHtml = dateSelectionListPickup.getElementsByClassName('date_selection_item');

    for (let i = 0; i < datePickupHtml.length; i++) {
        datePickupHtml[i].addEventListener('click', () => {
            for (let j = 0; j < datePickupHtml.length; j++) {
                datePickupHtml[j].getElementsByClassName('date_selection_item_circle')[0].classList.remove('selected_circle');
            };
            datePickupHtml[i].getElementsByClassName('date_selection_item_circle')[0].classList.add('selected_circle');
        })
    }
};

choiceDateDelivery.addEventListener('click', () => {
    const dateDeliveryHtml = dateSelectionListDelivery.getElementsByClassName('date_selection_item');
    dateSelectionDelivery.classList.add('hide');
    for (let i = 0; i < dateDeliveryHtml.length; i++) {
        if (dateDeliveryHtml[i].getElementsByClassName('date_selection_item_circle')[0].classList.contains('selected_circle')) {
            formData.icoDateDelivery = null;
            createHours(
                basketMainList.deliveryHours,
                new Date(basketMainList.mskTime),
                dateDeliveryHtml[i].id.split('_')[2],
                'delivery',
                basketMainList.pickupPointId,
                basketMainList.reservationInterval
            );
        }
    }
})

choiceDatePickup.addEventListener('click', () => {
    const datePickupHtml = dateSelectionListPickup.getElementsByClassName('date_selection_item');
    dateSelectionPickup.classList.add('hide');
    for (let i = 0; i < datePickupHtml.length; i++) {
        if (datePickupHtml[i].getElementsByClassName('date_selection_item_circle')[0].classList.contains('selected_circle')) {
            formData.icoDatePickup = null;
            createHours(
                basketMainList.workingHours,
                new Date(basketMainList.mskTime),
                datePickupHtml[i].id.split('_')[2],
                'pickup',
                basketMainList.pickupPointId,
                basketMainList.reservationInterval
            );
        }
    }
})

ordersBut.addEventListener('click', () => {
    loading.classList.remove('hide');
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    ordersBody.classList.remove('hide');
    ordersPath.classList.remove('hide');
    createOrdersList(1, 10);
})

ordersPath.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    profilePath.classList.remove('hide');
    profileBody.classList.remove('hide');
});

helpBut.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    helpPath.classList.remove('hide');
    helpBody.classList.remove('hide');
});

helpPath.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    profilePath.classList.remove('hide');
    profileBody.classList.remove('hide');
});

rulesBut.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    rulesPath.classList.remove('hide');
    rulesBody.classList.remove('hide');
});

rulesPath.addEventListener('click', () => {
    hideAll();
    profileBut.classList.add('active');
    profilePage.classList.remove('hide');
    profilePath.classList.remove('hide');
    profileBody.classList.remove('hide');
});

// orders_but.addEventListener('click', () => {
//     profile_path.classList.add('hide');
//     profile_body.classList.add('hide');
//     orders_path.classList.remove('hide');
//     orders_body.classList.remove('hide');
//     create_orders_list();
// });
// help_but.addEventListener('click', () => {
//     profile_path.classList.add('hide');
//     profile_body.classList.add('hide');
//     help_path.classList.remove('hide');
//     help_body.classList.remove('hide');
// });
// rules_but.addEventListener('click', () => {
//     profile_path.classList.add('hide');
//     profile_body.classList.add('hide');
//     rules_path.classList.remove('hide');
//     rules_body.classList.remove('hide');
// });
// orders_path.addEventListener('click', () => {
//     orders_loading.classList.remove('hide');
//     profile_path.classList.remove('hide');
//     profile_body.classList.remove('hide');
//     orders_path.classList.add('hide');
//     orders_body.classList.add('hide');
//     let order = document.getElementsByClassName('order');
//     while (order[0]) {
//         order[0].remove();
//     }
// });
// help_path.addEventListener('click', () => {
//     profile_path.classList.remove('hide');
//     profile_body.classList.remove('hide');
//     help_path.classList.add('hide');
//     help_body.classList.add('hide');
// });
// rules_path.addEventListener('click', () => {
//     profile_path.classList.remove('hide');
//     profile_body.classList.remove('hide');
//     rules_path.classList.add('hide');
//     rules_body.classList.add('hide');
// });
// result_but.addEventListener('click', () => {
//     basket_path.classList.add('hide');
//     basket_full.classList.add('hide');
//     form_path.classList.remove('hide');
//     form.classList.remove('hide');
//     form_manag();
// });
// form_back.addEventListener('click', () => {
//     basket_path.classList.remove('hide');
//     basket_full.classList.remove('hide');
//     form_path.classList.add('hide');
//     form.classList.add('hide');
// });