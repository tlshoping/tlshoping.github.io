(() => {
    const nativeFetch = window.fetch.bind(window);
    const reads = new Set(['get-pickup-points', 'get-bot-settings', 'get-user', 'get-category',
        'get-cart', 'get-stop', 'courier-availability', 'get-order', 'order-shadow-status', 'search',
        'gift-settings', 'inventory-settings', 'inventory-initial-products', 'maps/key']);
    const pending = new Map();
    const cache = new Map();
    let cacheVersion = 0;
    const copy = value => JSON.parse(JSON.stringify(value));
    const abortError = () => new DOMException('Request cancelled', 'AbortError');
    function apiError(message, code, extra = {}) {
        return Object.assign(new Error(message), { name: 'ShopApiError', code, ...extra });
    }
    function wait(delay, signal) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            const cancel = () => { clearTimeout(timer); reject(abortError()); };
            const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, delay);
            signal?.addEventListener('abort', cancel, { once: true });
        });
    }
    function invalidate(keepHours = false) {
        cacheVersion++;
        if (!keepHours) cache.clear();
        else for (const key of cache.keys()) {
            if (!key.startsWith('get-stop|') && !key.startsWith('courier-availability|')) cache.delete(key);
        }
    }

    async function attempt(resource, options, name, read, settings) {
        const retries = read ? Math.min(2, settings.retries ?? 2) : 0;
        for (let index = 0; ; index++) {
            if (options.signal?.aborted) throw abortError();
            const controller = new AbortController();
            let timedOut = false;
            const cancel = () => controller.abort();
            options.signal?.addEventListener('abort', cancel, { once: true });
            const timer = setTimeout(() => { timedOut = true; controller.abort(); },
                settings.timeout ?? (name === 'create-order' ? 45000 : read ? 12000 : 30000));
            let failure;
            try {
                const response = await nativeFetch(resource, { ...options, signal: controller.signal });
                // Include reading the body in the deadline, not just receiving headers.
                const bytes = await response.arrayBuffer();
                const buffered = new Response([204, 205, 304].includes(response.status) ? null : bytes,
                    { status: response.status, statusText: response.statusText, headers: response.headers });
                if (read && [408, 429, 502, 503, 504].includes(response.status) && index < retries) {
                    const seconds = Number(response.headers.get('Retry-After'));
                    clearTimeout(timer);
                    options.signal?.removeEventListener('abort', cancel);
                    await wait(Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 3000)
                        : 350 * 2 ** index + Math.random() * 150, options.signal);
                    continue;
                }
                return buffered;
            } catch (error) {
                if (options.signal?.aborted) throw abortError();
                failure = apiError(timedOut ? 'Сервер не ответил вовремя' : 'Не удалось связаться с сервером',
                    timedOut ? 'TIMEOUT' : 'NETWORK', { endpoint: name, uncertain: !read });
            } finally {
                clearTimeout(timer);
                options.signal?.removeEventListener('abort', cancel);
            }
            if (index >= retries || navigator.onLine === false) throw failure;
            await wait(350 * 2 ** index + Math.random() * 150, options.signal);
        }
    }

    async function managedFetch(resource, options = {}) {
        const address = new URL(typeof resource === 'string' ? resource : resource.url, location.href);
        if (typeof apiUrl === 'undefined' || address.hostname !== apiUrl || !address.pathname.startsWith('/api/')) {
            return nativeFetch(resource, options);
        }
        const name = address.pathname.split('/api/V2/')[1] || address.pathname.split('/').at(-1);
        const read = reads.has(name) || ['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase());
        const { shop = {}, ...requestOptions } = options;
        const cartMutation = ['cart-add', 'cart-remove', 'remove-all-cart'].includes(name);
        const changesShopData = !read && !['adm-notifications', 'maps/report-invalid-key'].includes(name);
        if (changesShopData) invalidate(cartMutation);
        const key = `${address.href}|${requestOptions.method || 'GET'}|${requestOptions.body || ''}`;
        const deduplicate = read && !requestOptions.signal && shop.deduplicate !== false;
        if (deduplicate && pending.has(key)) return (await pending.get(key)).clone();
        const request = attempt(resource, requestOptions, name, read, shop);
        if (deduplicate) pending.set(key, request);
        try {
            const response = await request;
            if (changesShopData && response.ok) invalidate(cartMutation);
            if (!response.ok && name !== 'create-order') {
                const payload = await response.clone().json().catch(() => null);
                throw apiError(payload?.error || 'Не удалось выполнить запрос', 'HTTP',
                    { status: response.status, endpoint: name, payload, uncertain: !read && response.status >= 500 });
            }
            return response.clone();
        } finally {
            if (pending.get(key) === request) pending.delete(key);
        }
    }
    window.fetch = managedFetch;

    window.shopApi = async (name, data = {}, settings = {}) => {
        const key = `${name}|${JSON.stringify(data)}`;
        const cached = cache.get(key);
        if (!settings.force && cached && cached.until > Date.now()) return copy(cached.value);
        const version = cacheVersion;
        const response = await managedFetch(`https://${apiUrl}/api/V2/${name}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
            signal: settings.signal, shop: settings
        });
        let payload;
        try { payload = await response.json(); }
        catch (_) { throw apiError('Сервер вернул некорректный ответ', 'INVALID_RESPONSE', { endpoint: name, uncertain: !reads.has(name) }); }
        if (!response.ok) throw apiError(payload?.error || 'Не удалось выполнить запрос', 'HTTP',
            { status: response.status, endpoint: name, payload, uncertain: !reads.has(name) && response.status >= 500 });
        if (!payload || typeof payload !== 'object' || (settings.validate && !settings.validate(payload))) {
            throw apiError('Сервер вернул неполные данные', 'INVALID_RESPONSE', { endpoint: name, uncertain: !reads.has(name) });
        }
        if (settings.ttl && reads.has(name) && version === cacheVersion) {
            if (cache.size >= 40) cache.delete(cache.keys().next().value);
            cache.set(key, { value: copy(payload), until: Date.now() + Math.min(settings.ttl, 30000) });
        }
        return payload;
    };
    window.ShopNetwork = { invalidate, wait };
})();
