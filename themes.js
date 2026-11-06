function applyShopTheme(theme) {
    const selected = theme === 'Samedy' ? 'Samedy' : 'TL';
    document.documentElement.dataset.shopTheme = selected;
    if (window.Telegram?.WebApp) {
        const color = selected === 'Samedy' ? '#101010' : '#ffffff';
        const app = window.Telegram.WebApp;
        for (const method of ['setHeaderColor', 'setBackgroundColor', 'setBottomBarColor']) {
            try {
                app[method]?.(color);
            } catch (error) {
                console.warn('Не удалось обновить цвет Telegram WebApp.');
            }
        }
        for (const button of [app.MainButton, app.SecondaryButton]) {
            try {
                button?.setParams({
                    color: selected === 'Samedy' ? '#ffd52a' : '#750dc5',
                    text_color: selected === 'Samedy' ? '#080808' : '#ffffff'
                });
            } catch (error) {
                console.warn('Не удалось обновить цвет кнопки Telegram WebApp.');
            }
        }
    }
    document.dispatchEvent(new CustomEvent('shop-theme-changed', { detail: { theme: selected } }));
}

// Fixed controls must follow the visible viewport, including the software keyboard.
function updateShopViewport() {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const app = window.Telegram?.WebApp;
    const heights = [viewport?.height, app?.viewportHeight, window.innerHeight]
        .filter(value => Number.isFinite(value) && value > 0);
    const height = Math.min(...heights);
    const top = viewport?.offsetTop || 0;
    root.style.setProperty('--shop-viewport-height', `${height}px`);
    root.style.setProperty('--shop-viewport-top', `${top}px`);
    root.style.setProperty('--shop-viewport-bottom', `${Math.max(0, window.innerHeight - top - height)}px`);
    root.style.setProperty('--shop-safe-bottom', `${Math.max(0, app?.safeAreaInset?.bottom || 0)}px`);
}

window.addEventListener('resize', updateShopViewport);
window.visualViewport?.addEventListener('resize', updateShopViewport);
window.visualViewport?.addEventListener('scroll', updateShopViewport);
window.Telegram?.WebApp?.onEvent?.('viewportChanged', updateShopViewport);
window.Telegram?.WebApp?.onEvent?.('safeAreaChanged', updateShopViewport);
updateShopViewport();
