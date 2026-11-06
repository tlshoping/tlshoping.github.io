function applyShopTheme(theme) {
    const selected = theme === 'Samedy' ? 'Samedy' : 'TL';
    document.documentElement.dataset.shopTheme = selected;
    updateTelegramShopColors(selected);
    document.dispatchEvent(new CustomEvent('shop-theme-changed', { detail: { theme: selected } }));
}

function updateTelegramShopColors(selected) {
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
}

// Fixed controls must follow the visible viewport, including the software keyboard.
function updateShopViewport() {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    const app = window.Telegram?.WebApp;
    // Telegram can briefly retain its old height after expanding the native sheet.
    const height = [viewport?.height, app?.viewportHeight, window.innerHeight]
        .find(value => Number.isFinite(value) && value > 0);
    const top = viewport?.offsetTop || 0;
    const values = {
        '--shop-viewport-height': height,
        '--shop-viewport-top': top,
        '--shop-viewport-bottom': Math.max(0, window.innerHeight - top - height),
        '--shop-safe-bottom': Math.max(0, app?.safeAreaInset?.bottom || 0, app?.contentSafeAreaInset?.bottom || 0)
    };
    for (const [property, value] of Object.entries(values)) {
        if (root.style.getPropertyValue(property) !== `${value}px`) {
            root.style.setProperty(property, `${value}px`);
        }
    }
}

let shopViewportFrame = null;
function scheduleShopViewportUpdate() {
    if (!window.requestAnimationFrame) return updateShopViewport();
    if (shopViewportFrame !== null) return;
    shopViewportFrame = window.requestAnimationFrame(() => {
        shopViewportFrame = null;
        updateShopViewport();
    });
}

function resumeShopAppearance() {
    scheduleShopViewportUpdate();
    const selected = document.documentElement.dataset.shopTheme;
    if (selected) updateTelegramShopColors(selected);
}

window.addEventListener('resize', scheduleShopViewportUpdate);
window.addEventListener('pageshow', resumeShopAppearance);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeShopAppearance();
});
window.visualViewport?.addEventListener('resize', scheduleShopViewportUpdate);
window.visualViewport?.addEventListener('scroll', scheduleShopViewportUpdate);
for (const event of ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged']) {
    window.Telegram?.WebApp?.onEvent?.(event, scheduleShopViewportUpdate);
}
for (const event of ['activated', 'themeChanged']) {
    window.Telegram?.WebApp?.onEvent?.(event, resumeShopAppearance);
}
updateShopViewport();
