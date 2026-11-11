(() => {
    const loaded = new Map();
    function load(name) {
        if (!loaded.has(name)) loaded.set(name, new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${name}?v=20261111-initial-prices`;
            script.onerror = () => {
                script.remove();
                loaded.delete(name);
                reject(new Error('Не удалось загрузить инструменты сотрудников'));
            };
            script.onload = resolve;
            document.head.append(script);
        }));
        // A slow script may still execute after a timeout; retain its shared load to avoid duplicate declarations.
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Инструменты сотрудников загружаются слишком долго')), 15000);
            loaded.get(name).then(value => { clearTimeout(timer); resolve(value); },
                error => { clearTimeout(timer); reject(error); });
        });
    }
    window.ShopModules = {
        async staff(role) {
            if (!['owner', 'admin', 'manager', 'logistician'].includes(role)) return;
            await load('admin.js');
            await Promise.all([load('gifts.js'), ...(['owner', 'admin'].includes(role)
                ? [load('pointBranding.js'), load('inventoryDocuments.js')] : [])]);
        },
        gifts: () => load('gifts.js')
    };
})();
