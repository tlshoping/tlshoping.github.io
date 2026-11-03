function applyShopTheme(theme) {
    const selected = theme === 'Samedy' ? 'Samedy' : 'TL';
    document.documentElement.dataset.shopTheme = selected;
    if (window.Telegram?.WebApp) {
        const color = selected === 'Samedy' ? '#101010' : '#ffffff';
        try {
            Telegram.WebApp.setHeaderColor(color);
            Telegram.WebApp.setBackgroundColor(color);
        } catch (error) {
            console.warn('Не удалось обновить цвет Telegram WebApp.');
        }
    }
    document.dispatchEvent(new CustomEvent('shop-theme-changed', { detail: { theme: selected } }));
}
