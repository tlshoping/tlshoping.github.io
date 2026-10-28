const giftStaffRoles = ['owner', 'admin', 'manager', 'logistician'];

async function giftApi(name, point, data = {}) {
    const response = await fetch(`https://${apiUrl}/api/V2/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id, secret_key: user_data.data.secret_key, pickup_point_id: point.id, ...data })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Не удалось сохранить подарки');
    return payload.data;
}

function mountGiftManagement(point) {
    if (!giftStaffRoles.includes(user_data?.data?.status)) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'gift-toolbar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gift-button';
    button.textContent = 'Подарки и акции';
    button.addEventListener('click', () => openGiftManagement(point));
    toolbar.append(button);
    document.getElementById('mainPath')?.append(toolbar);
    if (!document.getElementById('mainPath')) document.querySelector('.path')?.append(toolbar);
    if (['owner', 'admin'].includes(user_data.data.status)) {
        for (const card of document.querySelectorAll('.cart_category')) {
            const categoryButton = document.createElement('button');
            categoryButton.className = 'gift-button gift-category-button';
            categoryButton.type = 'button';
            categoryButton.textContent = 'Назначить подарок за товары категории';
            categoryButton.addEventListener('click', () => openGiftManagement(point, Number(card.id.slice(5))));
            card.append(categoryButton);
        }
    }
}

async function openGiftManagement(point, selectedCategoryId) {
    document.getElementById('giftManager')?.remove();
    const overlay = document.createElement('section');
    overlay.id = 'giftManager';
    overlay.className = 'gift-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Подарки и акции');
    overlay.innerHTML = `
        <div class="gift-panel">
            <header class="gift-header"><h2>Подарки и акции</h2>
                <button type="button" class="gift-button gift-close">Закрыть</button></header>
            <p class="gift-point"></p>
            <p class="gift-status" role="status">Загрузка...</p>
            <div class="gift-content"></div>
        </div>`;
    document.body.append(overlay);
    const status = overlay.querySelector('.gift-status');
    const content = overlay.querySelector('.gift-content');
    overlay.querySelector('.gift-point').textContent = `${point.title} (${point.public_address || `#${point.id}`})`;
    const previousFocus = document.activeElement;
    const close = () => { overlay.remove(); previousFocus?.focus(); };
    overlay.querySelector('.gift-close').onclick = close;
    overlay.querySelector('.gift-close').focus();
    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
        if (event.key !== 'Tab') return;
        const focusable = [...overlay.querySelectorAll('button, input, select, textarea')].filter(el => !el.disabled);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    let settings;
    let selectedGiftId = '';
    const run = async (button, operation) => {
        if (button.disabled) return;
        button.disabled = true;
        status.textContent = 'Сохраняю...';
        status.classList.remove('gift-error');
        try {
            await operation();
            status.textContent = 'Сохранено';
            await get_basket();
        } catch (error) {
            status.textContent = error.message;
            status.classList.add('gift-error');
        } finally {
            button.disabled = false;
        }
    };
    const load = async () => {
        settings = await giftApi('gift-settings', point);
        if (overlay.isConnected) render();
    };
    const addOption = (select, value, text) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.append(option);
    };
    function render() {
        content.replaceChildren();
        if (settings.canEdit) {
            const section = document.createElement('section');
            section.className = 'gift-section';
            section.innerHTML = `
                <h3>Подарок за покупку</h3>
                <p class="gift-hint">Одна единица товара = один подарок. Действует и во вложенных категориях.
                    Если у вложенной категории свой подарок, используется он.
                    Если подарков недостаточно для корзины, они не добавляются и покупатель не видит акцию.</p>
                <label>Категория<select class="gift-category-select"></select></label>
                <label>Найти подарок<input class="gift-search" type="search" placeholder="Название или ID товара"></label>
                <label>Товар в подарок<select class="gift-product-select"></select></label>
                <p class="gift-current"></p>
                <div class="gift-actions">
                    <button type="button" class="gift-button gift-assign">Назначить подарок</button>
                    <button type="button" class="gift-button gift-detach">Убрать назначение</button>
                </div>`;
            content.append(section);
            const categorySelect = section.querySelector('.gift-category-select');
            const productSelect = section.querySelector('.gift-product-select');
            const byId = new Map(settings.categories.map(row => [Number(row.id), row]));
            for (const category of settings.categories) {
                const names = [category.title];
                const visited = new Set([Number(category.id)]);
                let parent = byId.get(Number(category.category_id));
                while (parent && !visited.has(Number(parent.id))) {
                    visited.add(Number(parent.id));
                    names.unshift(parent.title);
                    parent = byId.get(Number(parent.category_id));
                }
                addOption(categorySelect, category.id, `${names.join(' / ')} (#${category.id})`);
            }
            if (selectedCategoryId) categorySelect.value = String(selectedCategoryId);
            const fillProducts = query => {
                const previous = productSelect.value || selectedGiftId;
                productSelect.replaceChildren();
                addOption(productSelect, '', 'Выберите товар');
                for (const product of settings.products) {
                    if (query && !`${product.title} ${product.id}`.toLowerCase().includes(query)) continue;
                    addOption(productSelect, product.id, `${product.title} (#${product.id}, остаток: ${product.count})`);
                }
                productSelect.value = previous;
            };
            fillProducts('');
            section.querySelector('.gift-search').oninput = event => fillProducts(event.target.value.trim().toLowerCase());
            const updateCurrent = () => {
                selectedCategoryId = Number(categorySelect.value);
                const direct = settings.promotions.find(row => Number(row.category_id) === selectedCategoryId);
                let promotion = direct;
                let category = byId.get(selectedCategoryId);
                const visited = new Set();
                while (!promotion && category && !visited.has(Number(category.id))) {
                    visited.add(Number(category.id));
                    category = byId.get(Number(category.category_id));
                    promotion = category && settings.promotions.find(row => Number(row.category_id) === Number(category.id));
                }
                const product = settings.products.find(row => Number(row.id) === Number(promotion?.gift_catalog_id));
                section.querySelector('.gift-current').textContent = product ?
                    `${direct ? 'Назначен' : 'Унаследован из родительской категории'}: ${product.title}` : 'Подарок не назначен';
                section.querySelector('.gift-detach').disabled = !direct;
                if (!selectedGiftId) productSelect.value = direct ? String(direct.gift_catalog_id) : '';
            };
            categorySelect.onchange = () => { selectedGiftId = ''; updateCurrent(); };
            productSelect.onchange = () => { selectedGiftId = productSelect.value; };
            updateCurrent();
            const assign = section.querySelector('.gift-assign');
            assign.onclick = () => run(assign, async () => {
                if (!categorySelect.value || !productSelect.value) throw new Error('Выберите категорию и подарок');
                await giftApi('gift-promotion-save', point, { category_id: Number(categorySelect.value), gift_catalog_id: Number(productSelect.value) });
                selectedGiftId = productSelect.value;
                await load();
            });
            const detach = section.querySelector('.gift-detach');
            detach.onclick = () => {
                if (!confirm('Убрать назначение подарка? При наличии акции в родительской категории она продолжит действовать.')) return;
                run(detach, async () => {
                    await giftApi('gift-promotion-save', point, { category_id: Number(categorySelect.value), gift_catalog_id: null });
                    selectedGiftId = '';
                    await load();
                });
            };
        }
        const stocks = document.createElement('section');
        stocks.className = 'gift-section';
        stocks.innerHTML = '<h3>Подарочные товары и остатки</h3><p class="gift-hint">Остатки доступны только сотрудникам. У обычного товара, выбранного подарком, остаток общий с продажами.</p>';
        content.append(stocks);
        const configured = new Set(settings.promotions.map(row => Number(row.gift_catalog_id)));
        const giftProducts = settings.products.filter(row => row.gift_only || configured.has(Number(row.id)));
        if (!giftProducts.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Подарков пока нет. Создайте подарок или назначьте существующий товар категории.';
            stocks.append(empty);
        }
        for (const product of giftProducts) {
            const row = document.createElement('div');
            row.className = 'gift-stock-row';
            const title = document.createElement('p');
            title.textContent = `${product.title} (#${product.id})`;
            row.append(title);
            const input = document.createElement('input');
            input.type = 'number'; input.min = '0'; input.step = '1'; input.value = product.count;
            input.setAttribute('aria-label', `Остаток ${product.title}`);
            row.append(input);
            const save = document.createElement('button');
            save.className = 'gift-button'; save.type = 'button'; save.textContent = 'Сохранить остаток';
            save.onclick = () => run(save, async () => {
                if (!input.value || !Number.isInteger(Number(input.value)) || Number(input.value) < 0) throw new Error('Введите целый неотрицательный остаток');
                await giftApi('gift-stock-save', point, { id: product.id, count: Number(input.value) });
                await load();
            });
            row.append(save);
            if (settings.canEdit && product.gift_only) {
                const edit = document.createElement('button');
                edit.type = 'button'; edit.className = 'gift-button'; edit.textContent = 'Редактировать';
                edit.onclick = () => fillForm(product);
                row.append(edit);
            }
            stocks.append(row);
        }
        if (!settings.canEdit) return;
        const form = document.createElement('form');
        form.className = 'gift-section gift-product-form';
        form.innerHTML = `
            <h3 class="gift-form-title">Создать подарочный товар</h3>
            <p class="gift-hint">Отдельный подарочный товар не продаётся в каталоге. Цена подарка всегда 0 ₽.</p>
            <label>Название<input name="title" maxlength="255" required></label>
            <label>Описание<textarea name="description" maxlength="4000" rows="3"></textarea></label>
            <label>Остаток на этой точке<input name="count" type="number" min="0" step="1" value="0" required></label>
            <label>Изображение<input name="image" type="file" accept="image/*"></label>
            <div class="gift-actions"><button class="gift-button" type="submit">Создать подарок</button>
                <button class="gift-button gift-new" type="button">Новый подарок</button></div>`;
        content.append(form);
        let editingId = 0;
        function fillForm(product) {
            editingId = product.id;
            form.elements.title.value = product.title;
            form.elements.description.value = product.description || '';
            form.elements.count.value = product.count;
            form.elements.image.value = '';
            form.querySelector('.gift-form-title').textContent = `Редактировать подарок #${product.id}`;
            form.querySelector('[type="submit"]').textContent = 'Сохранить подарок';
            form.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        form.querySelector('.gift-new').onclick = () => {
            editingId = 0; form.reset();
            form.querySelector('.gift-form-title').textContent = 'Создать подарочный товар';
            form.querySelector('[type="submit"]').textContent = 'Создать подарок';
        };
        form.onsubmit = event => {
            event.preventDefault();
            const button = form.querySelector('[type="submit"]');
            run(button, async () => {
                const file = form.elements.image.files[0];
                let image;
                if (file) {
                    if (file.size > 10 * 1024 * 1024) throw new Error('Изображение должно быть не больше 10 МБ');
                    image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error('Не удалось прочитать изображение'));
                        reader.readAsDataURL(file);
                    });
                }
                const result = await giftApi('gift-product-save', point, {
                    id: editingId, title: form.elements.title.value, description: form.elements.description.value,
                    count: Number(form.elements.count.value), img_file: image
                });
                selectedGiftId = String(result.id);
                await load();
            });
        };
    }
    try {
        await load();
        status.textContent = '';
    } catch (error) {
        status.textContent = error.message;
        status.classList.add('gift-error');
    }
}
