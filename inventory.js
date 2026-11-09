(() => {
    const unresolved = new Map();
    const origins = { receipt: 'Поставка', opening: 'Начальный остаток', adjustment: 'Корректировка', legacy_order: 'Старый заказ' };
    const auditTitles = { receipt: 'Поступление', cancel_receipt: 'Отмена поставки', opening_cost: 'Назначение стоимости', opening_split: 'Разделение начального остатка',
        writeoff: 'Списание', refund: 'Возврат заказа', category_cost: 'Закупочная стоимость категории' };
    const allowed = () => ['owner', 'admin'].includes(user_data?.data?.status);
    const money = value => value == null ? 'неизвестна' : `${Number(value).toFixed(2)} ₽`;
    const date = value => new Date(value).toLocaleString('ru-RU');
    function element(tag, content, className) {
        const node = document.createElement(tag);
        if (content != null) node.textContent = content;
        if (className) node.className = className;
        return node;
    }
    function button(label, action) {
        const node = element('button', label, 'gift-button');
        node.type = 'button'; node.onclick = action;
        return node;
    }
    function input(label, type = 'text', value = '') {
        const wrapper = element('label', label), control = element('input');
        control.type = type; control.value = value;
        if (type === 'number') { control.min = '0'; control.step = '0.01'; }
        wrapper.append(control);
        return { wrapper, control };
    }
    window.mountInventoryManagement = point => {
        if (!allowed()) return;
        const toolbar = element('div', null, 'gift-toolbar');
        toolbar.addEventListener('click', event => event.stopPropagation());
        toolbar.append(button('Поставки и FIFO', () => openInventory(point)));
        (document.getElementById('mainPath') || document.querySelector('.path'))?.append(toolbar);
        for (const card of document.querySelectorAll('.cart_product')) {
            const id = Number(card.id.replace('cart_', ''));
            if (!id || card.querySelector('[data-inventory-button]')) continue;
            const action = button('Закупки и себестоимость', () => openInventory(point, id));
            action.dataset.inventoryButton = 'true';
            const row = element('div', null, 'gift-toolbar'); row.append(action); card.append(row);
        }
        for (const card of document.querySelectorAll('.cart_category')) {
            const id = Number(card.id.replace('cart_', ''));
            if (!id || card.querySelector('.inventory-bulk')) continue;
            const section = element('section', null, 'inventory-bulk gift-section');
            const price = input('Новая закупочная цена за единицу, ₽', 'number');
            section.append(element('h3','Массово изменить закупочную стоимость'),
                element('p','На этой точке, в категории и её подкатегориях: назначить цену неизвестным остаткам и старым заказам, сохранить цену будущих поставок для товаров с остатком 0. Прибыль прошлых периодов пересчитается. Уже известные цены не изменятся.','gift-hint'),
                price.wrapper,button('Применить закупочную цену',()=>{
                    if (!price.control.value || Number(price.control.value)<0) return;
                    if (confirm(`Назначить закупочную цену ${price.control.value} ₽ в этой категории и вложенных подкатегориях на точке «${point.title}»? Неизвестные цены старых заказов и прибыль прошлых периодов пересчитаются. Известные цены не изменятся.`)) {
                        openInventory(point,null,{category_id:id,unit_cost:price.control.value,request_key:crypto.randomUUID()});
                    }
                }));
            card.append(section);
        }
    };
    async function openInventory(point, selectedId = null, categoryChange = null) {
        if (!allowed()) return;
        document.getElementById('inventoryEditor')?.remove();
        const overlay = element('section', null, 'gift-overlay');
        overlay.id = 'inventoryEditor';
        overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Поставки и FIFO');
        const panel = element('div', null, 'gift-panel inventory-panel');
        const header = element('header', null, 'gift-header'), focus = document.activeElement;
        let dirty = false;
        const updateCatalog = () => {
            if (!dirty || typeof reload !== 'function') return;
            dirty = false;
            document.querySelector('.cart')?.classList.add('hide');
            document.getElementById('catalogPage')?.classList.remove('hide');
            Promise.resolve(reload(point, 0)).catch(error => {
                if (typeof showShopFailure === 'function') showShopFailure(error);
            });
        };
        const close = () => { overlay.remove(); focus?.focus(); updateCatalog(); };
        const closeButton = button('Закрыть', close);
        header.append(element('h2', 'Поставки и FIFO'), closeButton);
        const status = element('p', '', 'gift-status'); status.setAttribute('role', 'status');
        const actions = element('div', null, 'gift-actions'), content = element('div');
        panel.append(header, element('p', point.title, 'gift-point'),
            element('p', 'Поставки увеличивают остатки. Для текущих остатков сначала назначьте закупочную стоимость. ' +
                'Массовое назначение цены категории заполняет неизвестные цены старых заказов. Обычное увеличение остатка без поставки создаёт партию с неизвестной ценой.', 'gift-hint'),
            status, actions, content);
        overlay.append(panel); document.body.append(overlay); closeButton.focus();
        overlay.addEventListener('keydown', event => {
            if (event.key === 'Escape') close();
            if (event.key === 'Tab') {
                const controls = [...overlay.querySelectorAll('button,input,select,textarea')].filter(node => !node.disabled);
                const first = controls[0], last = controls.at(-1);
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        });
        const api = (name, data = {}) => shopApi(name, {
            bot_id, secret_key: user_data.data.secret_key, pickup_point_id: point.id, ...data
        }, { force: true, timeout: 45000 });
        let busy = false, uncertain = unresolved.get(String(point.id)) || null, latest;
        const message = (value, error = false) => {
            status.textContent = value; status.classList.toggle('gift-error', error);
        };
        function lock(value) {
            content.querySelectorAll('button,input,select,textarea').forEach(node => { node.disabled = value; });
        }
        async function refresh() {
            if (busy || uncertain) return;
            busy = true; message('Загружаю...'); lock(true);
            try {
                latest = (await api('inventory-settings')).data;
                if (!overlay.isConnected) return;
                render(latest); message('Данные обновлены');
                return true;
            } catch (error) { message(error.message, true); return false; }
            finally { busy = false; lock(Boolean(uncertain)); }
        }
        async function run(name, payload) {
            if (busy) return;
            busy = true; lock(true); message('Сохраняю...');
            unresolved.set(String(point.id), { name, payload });
            try {
                await api(name, payload);
                dirty = true;
                if (!overlay.isConnected) updateCatalog();
                unresolved.delete(String(point.id));
                uncertain = null; retry.hidden = true;
                busy = false;
                const updated = await refresh();
                message(updated ? 'Операция сохранена. Остатки обновлены' : 'Операция сохранена, но обновить данные не удалось. Нажмите «Обновить».', !updated);
            } catch (error) {
                const ambiguous = error.uncertain || ['NETWORK','TIMEOUT','INVALID_RESPONSE'].includes(error.code) || error.status >= 500;
                if (ambiguous) {
                    uncertain = { name, payload }; retry.hidden = false;
                    message('Ответ не получен. Не создавайте операцию заново. Нажмите «Проверить операцию»: повтор использует тот же ключ и не создаст дубль.', true);
                } else {
                    unresolved.delete(String(point.id));
                    uncertain = null; retry.hidden = true; message(error.message, true);
                }
            } finally { busy = false; lock(Boolean(uncertain)); }
        }
        const refreshButton = button('Обновить', refresh);
        const retry = button('Проверить операцию', () => uncertain && run(uncertain.name, uncertain.payload));
        retry.hidden = !uncertain; actions.append(refreshButton, retry);
        function section(title) {
            const node = element('section', null, 'gift-section'); node.append(element('h3', title)); content.append(node); return node;
        }
        function choose(products) {
            const control = element('select');
            for (const product of products) {
                const option = element('option', `${product.title} (#${product.id}), остаток: ${product.count}`);
                option.value = product.id; control.append(option);
            }
            return control;
        }
        function render(data) {
            content.replaceChildren();
            const selected = data.products.find(product => Number(product.id) === selectedId);
            if (selected) {
                const summary = section(`Закупочная стоимость: ${selected.title}`);
                const batches = data.lots.filter(lot => Number(lot.catalog_id) === selectedId);
                summary.append(element('p', `Следующая единица по FIFO: ${batches.length ? money(batches[0].unit_cost) : 'нет остатка'}\n` +
                    `Стоимость известного остатка: ${money(batches.reduce((sum,lot) => sum + lot.remaining * Number(lot.unit_cost || 0), 0))}\n` +
                    `Единиц с неизвестной ценой: ${selected.unknown_count || 0}`));
            }
            const supply = section('Новая поставка'), rows = element('div');
            const supplier = input('Поставщик'), note = input('Комментарий');
            const received = input('Дата поступления', 'datetime-local',
                new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16));
            const total = element('p', '', 'gift-current');
            function updateTotal() {
                const sum = [...rows.children].reduce((sum, row) => sum + Number(row.querySelector('.inventory-quantity').value) *
                    Number(row.querySelector('.inventory-cost').value), 0);
                total.textContent = `Сумма поставки: ${money(sum)}`;
            }
            function addRow() {
                const row = element('div', null, 'inventory-row');
                const select = choose(data.products), quantity = input('Количество', 'number', '1'), cost = input('Цена за единицу, ₽', 'number');
                quantity.control.step = '1'; quantity.control.min = '1';
                quantity.control.className = 'inventory-quantity'; cost.control.className = 'inventory-cost';
                const totalCost = input('Или сумма за строку, ₽', 'number');
                select.setAttribute('aria-label','Товар');
                select.onchange = () => {
                    cost.control.value = data.products.find(product => String(product.id) === select.value)?.last_cost ?? '';
                    totalCost.control.value = ''; updateTotal();
                };
                totalCost.control.oninput = () => {
                    if (totalCost.control.value === '') return;
                    const amount = Number(totalCost.control.value), count = Number(quantity.control.value);
                    if (count > 0) cost.control.value = (amount/count).toFixed(2);
                    updateTotal();
                };
                quantity.control.oninput = () => {
                    if (totalCost.control.value !== '') totalCost.control.oninput();
                };
                cost.control.oninput = () => { totalCost.control.value = ''; };
                const hint = element('p','Цена за единицу округляется до копеек. Проверьте итоговую сумму перед сохранением.','gift-hint');
                row.append(select, quantity.wrapper, cost.wrapper, totalCost.wrapper, hint,
                    button('Убрать строку', () => { row.remove(); updateTotal(); }));
                rows.append(row);
                if (selected) select.value = selected.id;
                select.onchange();
                row.addEventListener('input', updateTotal);
            }
            supply.append(supplier.wrapper, received.wrapper, note.wrapper, rows, button('Добавить товар', addRow), total,
                button('Провести поставку', () => {
                    const items = [...rows.children].map(row => ({ catalog_id: row.querySelector('select').value,
                        quantity: row.querySelector('.inventory-quantity').value, unit_cost: row.querySelector('.inventory-cost').value }));
                    if (!confirm(`Провести поставку? ${total.textContent}. Остатки увеличатся.`)) return;
                    run('inventory-receive', { request_key: crypto.randomUUID(), supplier: supplier.control.value,
                        received_at: received.control.value ? new Date(received.control.value).toISOString() : null, note: note.control.value, items });
                }));
            addRow(); updateTotal();
            const stock = section('Остатки и партии FIFO');
            const filter = input('Найти товар'); stock.append(filter.wrapper);
            const lots = element('div'); stock.append(lots);
            for (const lot of data.lots) {
                const row = element('div', null, 'inventory-row');
                row.dataset.title = lot.title.toLowerCase();
                row.append(element('p', `${lot.title} (#${lot.catalog_id}) · партия #${lot.id}\n` +
                    `${date(lot.received_at)} · остаток ${lot.remaining} из ${lot.quantity} · цена ${money(lot.unit_cost)} · ${lot.supplier || origins[lot.origin] || lot.origin}`));
                if (lot.unit_cost == null) {
                    const price = input('Закупочная цена оставшихся единиц, ₽', 'number');
                    row.append(price.wrapper, button('Назначить стоимость', () => {
                        if (confirm('Назначить стоимость только оставшимся единицам? Прошлые продажи не изменятся.')) {
                            run('inventory-opening-cost', { id: lot.id, unit_cost: price.control.value });
                        }
                    }));
                    const split = element('div'); split.hidden = true;
                    const entries = element('div');
                    const add = () => {
                        const part = element('div',null,'inventory-row');
                        const quantity = input('Количество партии','number','1'), cost = input('Цена единицы, ₽','number');
                        const received = input('Дата закупки','date',
                            new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10));
                        quantity.control.min = '1'; quantity.control.step = '1';
                        part.inventoryData = { quantity, cost, received };
                        part.append(quantity.wrapper,cost.wrapper,received.wrapper,button('Убрать партию',()=>part.remove()));
                        entries.append(part);
                    };
                    split.append(element('p',`Распределите ровно ${lot.remaining} ед. между реальными закупками. Остаток не увеличится.`,'gift-hint'),
                        entries,button('Добавить партию',add),button('Сохранить начальные партии',()=>{
                            const items = [...entries.children].map(part=>({
                                quantity:part.inventoryData.quantity.control.value,
                                unit_cost:part.inventoryData.cost.control.value,
                                received_at:part.inventoryData.received.control.value
                            }));
                            if (confirm('Разделить начальный остаток на партии? Прошлые продажи не изменятся.')) {
                                run('inventory-opening-split',{id:lot.id,request_key:crypto.randomUUID(),items});
                            }
                        }));
                    row.append(button('Разделить остаток по закупкам',()=>{ split.hidden=!split.hidden; }),split);
                    add();
                }
                lots.append(row);
            }
            filter.control.oninput = () => [...lots.children].forEach(row => { row.hidden = !row.dataset.title.includes(filter.control.value.toLowerCase()); });
            if (selected) { filter.control.value = selected.title; filter.control.oninput(); }
            const receipts = section('История поставок (последние 100)');
            for (const receipt of data.receipts) {
                const row = element('div', null, 'inventory-row');
                row.append(element('p', `#${receipt.id} · ${date(receipt.received_at)} · ${receipt.supplier || 'Без поставщика'}\n${receipt.note}`));
                if (selected && !(receipt.items || []).some(item => Number(item.catalog_id) === selectedId)) continue;
                for (const item of receipt.items || []) row.append(element('p', `${item.title}: ${item.quantity} × ${money(item.unit_cost)}, осталось ${item.remaining}`));
                if (receipt.cancelled_at) row.append(element('p','Поставка отменена'));
                else row.append(button('Отменить неиспользованную поставку', () => {
                    if (!confirm('Отменить поставку и убрать её остаток? Уже использованную поставку отменить нельзя.')) return;
                    const reason = prompt('Причина отмены:');
                    if (reason) run('inventory-cancel-receipt', { id: receipt.id, reason });
                }));
                receipts.append(row);
            }
            const loss = section('Списание товара'), product = choose(data.products);
            const quantity = input('Количество списания','number','1'), reason = input('Причина списания');
            quantity.control.step = '1'; quantity.control.min = '1';
            loss.append(product,quantity.wrapper,reason.wrapper,button('Списать по FIFO', () => {
                if (confirm('Списать товар? Его закупочная стоимость уменьшит прибыль.')) run('inventory-writeoff', {
                    request_key: crypto.randomUUID(), catalog_id: product.value, quantity: quantity.control.value, reason: reason.control.value
                });
            }));
            const sales = section('Полный возврат заказа');
            sales.append(element('p','Только при фактическом возврате всех товаров и денег. Частичный возврат здесь не поддерживается. Деньги покупателю передайте отдельно.','gift-hint'));
            const order = input('Номер завершённого заказа','number'), refundReason = input('Причина возврата');
            order.control.step = '1'; order.control.min = '1';
            sales.append(order.wrapper,refundReason.wrapper,button('Учесть полный возврат', () => {
                if (confirm('Вернуть все товары в остатки и учесть возврат всей суммы заказа?')) run('inventory-refund', {
                    order_id: order.control.value, reason: refundReason.control.value
                });
            }));
            for (const sale of data.sales) sales.append(element('p', `Заказ #${sale.order_id}: ${money(sale.revenue)}, себестоимость ${money(sale.cost)}` +
                `${sale.unknown_quantity ? ` + неизвестная стоимость ${sale.unknown_quantity} ед.` : ''}${sale.refunded_at ? ' · возвращён' : ''}`));
            const history = section('Журнал действий (последние 50)');
            for (const event of data.audit) history.append(element('p', `${date(event.created_at)} · сотрудник #${event.actor_id} · ${auditTitles[event.action] || event.action} · ${JSON.stringify(event.data)}`));
            for (const event of data.adjustments) history.append(element('p', `${date(event.created_at)} · товар #${event.catalog_id} · ${event.quantity} ед. · ${event.reason} · ${money(event.cost)}`));
        }
        if (uncertain) message('Осталась неподтверждённая операция. Нажмите «Проверить операцию», чтобы проверить её без дублей.', true);
        else {
            await refresh();
            if (categoryChange) await run('inventory-category-cost',categoryChange);
        }
    }
})();
