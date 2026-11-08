const shopErrorReports = new Map();
const shopReportTimes = new Map();
let shopReportTimer;
let shopNoticeTimer;
let shopReportsInWindow = 0;
let shopReportWindow = Date.now();

function sanitizeShopError(value) {
    return String(value ?? '').replace(/([?&](?:secret_key|secretKey|user_secret_key|token|api_?key|user_id)=)[^&#\s]+/gi, '$1[redacted]')
        .replace(/\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi, '[redacted]')
        .replace(/\b\d{5,}:[A-Za-z0-9_-]{20,}\b/g, '[redacted]').slice(0, 6000);
}

function showShopNotice(message, retry, persistent = false) {
    let notice = document.getElementById('shopStatus');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'shopStatus';
        notice.className = 'shop-status';
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');
        notice.innerHTML = '<p></p><div><button type="button" class="shop-retry">Повторить</button><button type="button" class="shop-dismiss" aria-label="Закрыть уведомление">Закрыть</button></div>';
        document.body.append(notice);
    }
    clearTimeout(shopNoticeTimer);
    notice.hidden = false;
    notice.querySelector('p').textContent = message;
    const button = notice.querySelector('.shop-retry');
    button.hidden = !retry;
    button.disabled = false;
    button.onclick = async () => {
        button.disabled = true;
        notice.hidden = true;
        try {
            await retry();
        } catch (error) { showShopFailure(error, retry); }
        finally { button.disabled = false; }
    };
    notice.querySelector('.shop-dismiss').onclick = () => { notice.hidden = true; };
    if (!retry && !persistent) shopNoticeTimer = setTimeout(() => { notice.hidden = true; }, 6000);
}

function reportShopError(error) {
    if (error?.name === 'AbortError') return;
    const item = {
        type: error.type || error.name || 'JavaScript Error',
        message: sanitizeShopError(error.message || error),
        stack: sanitizeShopError(error.stack), filename: sanitizeShopError(error.filename),
        endpoint: sanitizeShopError(error.endpoint), lineno: error.lineno, colno: error.colno,
        url: sanitizeShopError(location.href), userAgent: navigator.userAgent, count: 1
    };
    const key = `${item.type}|${item.message}|${item.endpoint}|${item.filename}|${item.lineno}`;
    const existing = shopErrorReports.get(key);
    if (existing) existing.count++;
    else if (shopErrorReports.size < 20) shopErrorReports.set(key, item);
    if (!shopReportTimer) shopReportTimer = setTimeout(flushShopErrorReports, 5000);
}

async function flushShopErrorReports() {
    shopReportTimer = null;
    if (navigator.onLine === false) return;
    if (Date.now() - shopReportWindow >= 60000) { shopReportWindow = Date.now(); shopReportsInWindow = 0; }
    for (const [key, item] of shopErrorReports) {
        if (shopReportsInWindow >= 5) break;
        if (shopReportTimes.has(key) && Date.now() - shopReportTimes.get(key) < 60000) continue;
        shopErrorReports.delete(key);
        if (shopReportTimes.size >= 50) shopReportTimes.delete(shopReportTimes.keys().next().value);
        shopReportTimes.set(key, Date.now());
        shopReportsInWindow++;
        try {
            await shopApi('adm-notifications', { notificationData: item }, { timeout: 4000, retries: 0 });
        } catch (_) { /* Reporting must never trigger another error report. */ }
    }
    if (shopErrorReports.size && !shopReportTimer) shopReportTimer = setTimeout(flushShopErrorReports, 60000);
}

function showShopFailure(error, retry, message) {
    if (error?.name === 'AbortError') return;
    reportShopError(error);
    const network = ['NETWORK', 'TIMEOUT'].includes(error?.code) || /Failed to fetch|Load failed|NetworkError/i.test(error?.message || '');
    showShopNotice(message || (network ? 'Нет связи с сервером. Последние данные сохранены на экране.'
        : 'Не удалось выполнить действие. Остальные разделы доступны.'), retry);
}

function sendErrorNotification(error) { showShopFailure(error); }
window.addEventListener('error', event => {
    if (!event.message && !event.error) return;
    showShopFailure({ type: 'JavaScript Error', message: event.error?.message || event.message,
        stack: event.error?.stack, filename: event.filename, lineno: event.lineno, colno: event.colno });
});
window.addEventListener('unhandledrejection', event => showShopFailure(event.reason || new Error('Unhandled promise rejection')));
window.addEventListener('offline', () => showShopNotice('Нет подключения к интернету. Последние данные остаются на экране.', null, true));
window.addEventListener('online', () => {
    document.getElementById('shopStatus')?.setAttribute('hidden', '');
    if (shopErrorReports.size && !shopReportTimer) shopReportTimer = setTimeout(flushShopErrorReports, 5000);
});
