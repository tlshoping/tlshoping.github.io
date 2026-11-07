function mountPointBranding(point) {
    if (!['owner', 'admin'].includes(user_data?.data?.status)) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'gift-toolbar';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gift-button';
    button.textContent = 'Оформление точки';
    button.onclick = () => openPointBranding(point);
    toolbar.append(button);
    (document.getElementById('mainPath') || document.querySelector('.path'))?.append(toolbar);
}

function applyPointBranding(point, changes) {
    Object.assign(point, changes);
    for (const list of [pickupPointsData, pickupPointsDataSort]) {
        for (const item of list || []) {
            if (String(item.id) === String(point.id)) Object.assign(item, changes);
        }
    }
    if (changes.logo) {
        for (const card of document.querySelectorAll('.pickup[data-pickup-point-id]')) {
            if (card.dataset.pickupPointId === String(point.id)) card.querySelector('.pickup_icon').src = url + changes.logo;
        }
    }
    for (const entry of pickupPointMarkers) {
        if (String(entry.point.id) !== String(point.id)) continue;
        Object.assign(entry.point, changes);
        entry.marker.options.set(pickupPointMarkerOptions(entry.point));
    }
}

function openPointBranding(point) {
    if (!['owner', 'admin'].includes(user_data?.data?.status)) return;
    document.getElementById('pointBranding')?.remove();
    const overlay = document.createElement('section');
    overlay.id = 'pointBranding';
    overlay.className = 'gift-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Оформление точки');
    overlay.innerHTML = `<div class="gift-panel">
        <header class="gift-header"><h2>Оформление точки</h2><button type="button" class="gift-button branding-close">Закрыть</button></header>
        <p class="gift-point"></p><p class="gift-hint">Изменения действуют только в текущем боте. Выберите исходный файл с устройства, без отправки в Telegram. До 10 МБ.</p>
        <p class="gift-status" role="status"></p><div class="branding-content"></div></div>`;
    overlay.querySelector('.gift-point').textContent = point.title;
    const previousFocus = document.activeElement;
    const close = () => { overlay.remove(); previousFocus?.focus(); };
    overlay.querySelector('.branding-close').onclick = close;
    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
        if (event.key !== 'Tab') return;
        const controls = [...overlay.querySelectorAll('button, input')].filter(el => !el.disabled);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    const status = overlay.querySelector('.gift-status');
    let busy = false;
    for (const field of ['logo', 'icon']) {
        const row = document.createElement('div');
        row.className = 'gift-section branding-section';
        row.innerHTML = `<h3>${field === 'logo' ? 'Логотип' : 'Иконка на карте'}</h3>
            <p class="gift-hint">${field === 'logo' ? 'PNG, WebP или JPEG. Прозрачность сохраняется.' : 'PNG или WebP с прозрачным фоном. Рекомендуется квадратное изображение.'}</p>
            <div class="branding-preview"><img alt="Предпросмотр" hidden><p>Картинки пока нет</p></div>
            <label>Выбрать файл<input type="file" accept="${field === 'logo' ? 'image/png,image/webp,image/jpeg' : 'image/png,image/webp'}"></label>
            <button type="button" class="gift-button gift-primary" disabled>Сохранить</button>`;
        const preview = row.querySelector('img');
        const empty = row.querySelector('.branding-preview p');
        const input = row.querySelector('input');
        const save = row.querySelector('button');
        let selected = null;
        let revision = 0;
        const show = source => {
            preview.hidden = !source;
            empty.hidden = Boolean(source);
            if (source) preview.src = source;
        };
        show(point[field] ? url + point[field] : null);
        preview.onerror = () => { preview.hidden = true; empty.hidden = false; };
        input.onchange = () => {
            const current = ++revision;
            selected = null;
            save.disabled = true;
            status.textContent = '';
            status.classList.remove('gift-error');
            show(point[field] ? url + point[field] : null);
            const file = input.files[0];
            if (!file) return;
            const types = field === 'logo' ? ['image/png', 'image/webp', 'image/jpeg'] : ['image/png', 'image/webp'];
            if (!types.includes(file.type) || file.size > 10 * 1024 * 1024) {
                status.textContent = 'Неверный формат или размер файла (максимум 10 МБ)';
                status.classList.add('gift-error');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (current !== revision) return;
                selected = reader.result;
                show(selected);
                save.disabled = busy;
            };
            reader.onerror = () => {
                if (current !== revision) return;
                status.textContent = 'Не удалось прочитать файл';
                status.classList.add('gift-error');
            };
            reader.readAsDataURL(file);
        };
        save.onclick = async () => {
            if (!selected || busy) return;
            busy = true;
            const controls = [...overlay.querySelectorAll('.branding-section input, .branding-section button')];
            const disabled = controls.map(control => control.disabled);
            controls.forEach(control => { control.disabled = true; });
            status.textContent = 'Сохраняю...';
            status.classList.remove('gift-error');
            try {
                const response = await fetch(`https://${apiUrl}/api/V2/point-branding-save`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bot_id, secret_key: user_data.data.secret_key,
                        pickup_point_id: point.id, field, image: selected })
                });
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error || 'Не удалось сохранить');
                applyPointBranding(point, payload.data);
                selected = null;
                input.value = '';
                show(url + point[field]);
                status.textContent = 'Сохранено';
            } catch (error) {
                status.textContent = error.message;
                status.classList.add('gift-error');
            } finally {
                busy = false;
                controls.forEach((control, index) => { control.disabled = disabled[index]; });
                save.disabled = !selected;
            }
        };
        overlay.querySelector('.branding-content').append(row);
    }
    document.body.append(overlay);
    overlay.querySelector('.branding-close').focus();
}
