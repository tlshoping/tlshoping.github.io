// Название магазина и ссылки на ресурсы проекта (чат, новости, менеджер)
// приходят из telegram_bots по bot_id, поэтому один и тот же сайт обслуживает
// и TL Shop, и Plug Shop без правок в разметке.

const SHOP_INFO_DEFAULTS = {
    display_name: 'Магазин',
    bot_username: null,
    chat_url: null,
    news_url: null,
    manager_url: null,
    chat_handle: null,
    news_handle: null,
    manager_handle: null
};

let shopInfo = { ...SHOP_INFO_DEFAULTS };

function shopInfoStorageKey(botId) {
    return `shopInfo_${botId}`;
}

function shopInfoBotId() {
    const fromUrl = new URLSearchParams(window.location.search).get('bot_id');

    return fromUrl || (typeof bot_id !== 'undefined' ? bot_id : '251807');
}

function readCachedShopInfo(botId) {
    try {
        const cached = localStorage.getItem(shopInfoStorageKey(botId));

        return cached ? { ...SHOP_INFO_DEFAULTS, ...JSON.parse(cached) } : null;
    } catch (error) {
        return null;
    }
}

async function loadShopInfo() {
    const botId = shopInfoBotId();

    try {
        const response = await fetch(`https://${apiUrl}/api/V2/get-bot-settings`, {
            method: 'POST',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ bot_id: botId }),
        });

        const json = await response.json();

        if (!json.data) {
            throw new Error(json.error || 'Пустой ответ get-bot-settings');
        }

        shopInfo = { ...SHOP_INFO_DEFAULTS, ...json.data };
        localStorage.setItem(shopInfoStorageKey(botId), JSON.stringify(shopInfo));
    } catch (error) {
        // Сеть недоступна — показываем последние известные контакты вместо пустых.
        console.error('Не удалось загрузить настройки магазина:', error);

        shopInfo = readCachedShopInfo(botId) || shopInfo;
    }

    return shopInfo;
}

function shopLink(url, text) {
    return url ? `<a href="${url}">${text}</a>` : text;
}

function renderShopContacts(shop) {
    const contacts = [];

    if (shop.chat_url) {
        contacts.push(`<a href="${shop.chat_url}">Чат с отзывами</a>`);
    }

    if (shop.news_url) {
        contacts.push(`<a href="${shop.news_url}">Новости проекта</a>`);
    }

    if (shop.manager_url) {
        contacts.push(`<a href="${shop.manager_url}">Менеджер</a>`);
    }

    return contacts.length ? contacts.join('\n') : 'Контакты уточняются.';
}

function renderShopRules(shop) {
    const name = shop.display_name;
    const managerNote = shop.manager_handle
        ? `исключительно через телеграм аккаунт менеджера(${shop.manager_handle})`
        : 'исключительно через телеграм аккаунт менеджера';

    return `Пользовательское соглашение интернет-магазина продуктов с содержанием никотина и устройств для их использования "${name}"
                
1. Термины и определения:
                
1.1. В настоящем пользовательском соглашении, если из текста прямо не вытекает иное, следующие термины будут иметь указанные ниже значения:
"Пользователь" – физическое лицо, заключившее соглашение с ${name};
"Соглашение" – настоящее пользовательское соглашение;
"${name}" – компания, предоставляющая услуги по продаже продуктов с содержанием никотина и устройств для их использования через бота авто-продаж в телеграм;
"Стороны" – ${name} и Пользователь.
                
1.2. Остальные термины и определения, встречающиеся в тексте соглашения, толкуются сторонами обычными правилами толкования соответствующих терминов.
                
2. Заключение соглашения:
                
2.1. Совершая покупку в интернет-магазине ${name}, Пользователь автоматически принимает условия настоящего Соглашения и обязуется их соблюдать.
                
3. Условия использования магазина:
                
3.1. Приобретенная в ${name} Пользователем продукция обмену и возврату не подлежат, за исключением случаев заводского брака, подтвержденного экспертизой. После совершения покупки Пользователь становится владельцем товара.
                
3.2. ${name} не несет ответственности за последствия неправильного использования продукции приобретённой в ${name} Пользователем.
                
3.3. ${name} не несет ответственности за утерю данных, взлом аккаунта или другие неправомерные действия третьих лиц.
                
3.4. Служба поддержки ${name} осуществляет общение с Пользователями ${managerNote}. ${name} не несет ответственности за общение с Пользователями через другие каналы связи.
                
4. Обязанности Пользователя:
                
4.1. Пользователь обязуется предоставлять достоверную информацию при оформлении заказа.
4.2. Пользователь обязуется использовать приобретенные продукты в соответствии с инструкцией по эксплуатации.
4.3. Пользователю запрещается:
                
4.3.1. Оскорблять сотрудников ${name}, при общении с таковыми и на официальных ресурсах ${name}.
4.3.2. Пытаться взломать бота авто-продаж или иным образом нарушать его работу.
4.3.3. Предоставлять доступ к своей учётной записи бота авто-продаж третьим лицам.
4.3.4. Перепродавать продукцию, приобретенную в ${name}, без предварительного согласования с ${name}.
4.3.5. Распространять ложную информацию о ${name} и его продукции.
                
4.4. Нарушение Пользователем любого из пунктов 4.3 может привести к блокировке Пользователя на всех ресурсах ${name}.
                
5. Персональные данные:
                
5.1. Оформляя заказ, Пользователь дает согласие на обработку своих персональных данных команде ${name}.
5.2. ${name} может использовать персональные данные Пользователя для рассылки рекламных материалов и уведомлений. Пользователь имеет право отказаться от получения таких материалов в любой момент.
                
6. Ограничение ответственности:
                
6.1. ${name} не несет ответственности за убытки Пользователя, возникшие в результате:
                
6.1.1. Неправомерных действий третьих лиц.
6.1.2. Неправильного использования продукции, приобретенной в ${name}.
6.1.3. Невозможности использования бота авто-продаж по техническим причинам.
                
6.2. ${name} не несёт ответственности за совместимость продукции, приобретенной в ${name}, с устройствами Пользователя.
                
7. Авторское право:
                
7.1. Все материалы, размещенные на на ресурсах ${name}, являются интеллектуальной собственностью ${name} и защищены законом об авторском праве.
                
8. Изменение условий соглашения:
                
8.1. ${name} вправе в одностороннем порядке изменять условия настоящего Соглашения. Изменения вступают в силу с момента их публикации на ресурсах ${name}.
                
9. Контактная информация:
${renderShopContacts(shop)}`;
}

function applyShopInfo(shop) {
    document.title = shop.display_name;

    const rulesText = document.getElementById('rulesText');

    if (rulesText) {
        rulesText.innerHTML = renderShopRules(shop);
    }

    const helpBody = document.getElementById('helpBody');

    if (helpBody) {
        helpBody.innerHTML = shop.manager_url
            ? `При возникновении трудностей или вопросов - обращайтесь к ${shopLink(shop.manager_url, 'менеджеру')}`
            : 'При возникновении трудностей или вопросов - обращайтесь в поддержку магазина';
    }

    const errorFooter = document.getElementById('errorNotificationFooter');

    if (errorFooter) {
        errorFooter.innerHTML = shop.manager_url
            ? `Обратитесь к ${shopLink(shop.manager_url, 'менеджеру')}`
            : 'Обратитесь в поддержку магазина';
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Сначала мгновенно показываем закешированные данные, потом обновляем из API.
    const cached = readCachedShopInfo(shopInfoBotId());

    if (cached) {
        shopInfo = cached;
        applyShopInfo(shopInfo);
    }

    applyShopInfo(await loadShopInfo());
});
