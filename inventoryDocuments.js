(() => {
    const states = new Map();
    const allowed = () => ['owner','admin'].includes(user_data?.data?.status);
    const money = n => n == null ? 'неизвестна' : `${Number(n).toFixed(2)} ₽`;
    const labels = {receive:'Пополнение',writeoff:'Списание',cost:'Назначение неизвестной стоимости'};
    const node = (tag,text,cls) => {
        const el=document.createElement(tag);
        if (text!=null) el.textContent=text;
        if (cls) el.className=cls;
        return el;
    };
    function button(text,action) {
        const el=node('button',text,'gift-button'); el.type='button'; el.onclick=action; return el;
    }
    function field(text,type='text') {
        const label=node('label',text),control=node('input');
        control.type=type;
        if (type==='number') { control.min='0';control.step='.01'; }
        label.append(control); return {label,control};
    }
    function select(text) {
        const label=node('label',text),control=node('select');
        control.setAttribute('aria-label',text);label.append(control);return {label,control};
    }
    function options(select,rows) {
        const previous=select.value;
        select.replaceChildren(...rows.map(row=>{
            const option=node('option',row.text);option.value=String(row.id);return option;
        }));
        for (let i=0;i<rows.length;i++) select.options[i].disabled=Boolean(rows[i].disabled);
        if (rows.some(row=>String(row.id)===previous && !row.disabled)) select.value=previous;
        else select.value=String(rows.find(row=>!row.disabled)?.id || '');
        select.disabled=!rows.length;
    }
    function state(point) {
        if (!states.has(String(point.id))) states.set(String(point.id),{point,data:null,busy:false,pending:null,views:new Set()});
        return states.get(String(point.id));
    }
    function message(s,text,error=false) {
        s.message=text;s.error=error;
        for (const view of s.views) if (view.root.isConnected) {
            view.status.textContent=text;view.status.classList.toggle('gift-error',error);
            view.retry.hidden=!s.pending; view.retry.disabled=s.busy;
        }
    }
    function api(s,name,data={}) {
        return shopApi(name,{bot_id,secret_key:user_data.data.secret_key,pickup_point_id:s.point.id,...data},{force:true,timeout:45000});
    }
    function refreshViews(s) {
        for (const view of s.views) {
            if (!view.root.isConnected) { s.views.delete(view);continue; }
            if (s.data) view.render(s.data);
        }
    }
    async function load(s) {
        if (s.loading) return s.loading;
        s.loading=(async()=>{
            try {
                const data=(await api(s,'inventory-settings')).data;
                if (!Array.isArray(data?.receipts) || !Array.isArray(data?.products)) throw new Error('Не удалось прочитать поступления');
                s.data=data;refreshViews(s);return true;
            } catch (error) {message(s,error.message,true);return false;}
            finally {s.loading=null;}
        })();
        return s.loading;
    }
    function lock(s,value) {
        for (const view of s.views) if (view.root.isConnected) {
            for (const el of view.root.querySelectorAll('input,select,button')) {
                if (el.dataset.inventoryClose) continue;
                if (value) { if (el.dataset.wasDisabled==null) el.dataset.wasDisabled=String(el.disabled);el.disabled=true; }
                else if (el.dataset.wasDisabled!=null) { el.disabled=el.dataset.wasDisabled==='true';delete el.dataset.wasDisabled; }
            }
        }
    }
    async function run(s,name,payload,retry=false) {
        if (s.busy || (s.pending && !retry)) return;
        s.busy=true;lock(s,true);s.pending={name,payload};message(s,'Сохраняю черновик...');
        try {
            const result=await api(s,name,payload);
            s.pending=null;
            lock(s,false);
            const ok=await load(s);
            message(s,ok?(name==='inventory-document-complete'?'Поступление завершено. Остатки обновлены.':'Изменения сохранены в черновике. Остатки ещё не изменены.'):
                'Операция сохранена. Обновить список не удалось, нажмите «Обновить».',!ok);
            if (name==='inventory-document-complete' && typeof reload==='function') {
                // Preserve the receipt screen while refreshing underlying catalog stock.
                await reload(s.point,0);
            }
            return result?.data;
        } catch (error) {
            if (!(error.uncertain || ['NETWORK','TIMEOUT','INVALID_RESPONSE'].includes(error.code) || error.status>=500)) s.pending=null;
            message(s,s.pending?'Ответ не получен. Нажмите «Проверить операцию», не добавляйте строку заново.':error.message,true);
        } finally {
            s.busy=false;lock(s,false);
            if (s.pending) lock(s,true);
            message(s,s.message,s.error);
            for (const view of s.views) { view.retry.disabled=false; }
        }
    }
    function view(s,root,render) {
        const status=node('p','','gift-status'),retry=button('Проверить операцию',()=>{
            if (s.pending) run(s,s.pending.name,s.pending.payload,true);
        });
        status.setAttribute('role','status');retry.hidden=true;root.append(status,retry);
        const v={root,status,retry,render};s.views.add(v);
        if (s.data) render(s.data);
        if (s.message) message(s,s.message,s.error);
        return v;
    }
    function entries(s,receipt,items=receipt.items || [],canRemove=false) {
        const list=node('div');
        for (const item of items) {
            const row=node('div',null,'inventory-row');
            const source=item.source_lot_id?` · из партии #${item.source_lot_id}`:'';
            row.append(node('p',`${receipt.is_initial && item.kind==='receive'?'Начальный остаток / история':labels[item.kind] || item.kind}: ${item.title}\n`+
                (item.kind==='cost'?`Неизвестные цены остатков и продаж → ${money(item.unit_cost)}`:
                    `${item.quantity} × ${money(item.unit_cost)}${source}${item.kind==='receive' && receipt.status==='completed'?` · осталось ${item.remaining}`:''}`)));
            if (item.note) row.append(node('p',item.note,'gift-hint'));
            if (canRemove) row.append(button('Убрать строку',()=>{
                if (confirm('Убрать строку из незавершённого поступления?')) run(s,'inventory-document-remove',{receipt_id:receipt.id,id:item.id});
            }));
            list.append(row);
        }
        if (!items.length) list.append(node('p','Изменений пока нет','gift-hint'));
        return list;
    }
    function history(s,container,data,productId=null) {
        const expanded=new Set([...container.querySelectorAll('details[open]')].map(el=>el.dataset.id));
        const fragment=document.createDocumentFragment();
        for (const receipt of data.receipts) {
            const items=productId==null?receipt.items:(receipt.items || []).filter(item=>Number(item.catalog_id)===productId);
            if (productId!=null && !items.length) continue;
            const detail=node('details',null,'inventory-document');
            detail.dataset.id=String(receipt.id);detail.open=expanded.has(String(receipt.id));
            const status=receipt.cancelled_at?'завершена · отменена':receipt.status==='draft'?'не завершена':'завершена';
            detail.append(node('summary',`${receipt.name || receipt.supplier || 'Поступление'} #${receipt.id} · ${status}`));
            const expand=()=>{
                if (!detail.open || detail.dataset.loaded) return;
                detail.dataset.loaded='true';
                detail.append(node('p',new Date(receipt.created_at).toLocaleString('ru-RU'),'gift-hint'));
                if (receipt.note) detail.append(node('p',receipt.note));
                if (receipt.is_initial) detail.append(node('p','Оценка существующих остатков и истории не увеличивает количество товаров.','gift-hint'));
                else {
                    const incoming=items.filter(e=>e.kind==='receive').reduce((n,e)=>n+Number(e.quantity),0);
                    const outgoing=items.filter(e=>e.kind==='writeoff').reduce((n,e)=>n+Number(e.quantity),0);
                    detail.append(node('p',`Пополнение: ${incoming} ед. · Списание: ${outgoing} ед. · Изменение остатка: ${incoming-outgoing} ед.`));
                }
                detail.append(entries(s,receipt,items,productId==null && receipt.status==='draft'));
                if (productId==null && receipt.status==='draft') detail.append(button('Завершить поступление',()=>{
                    if (confirm(`Завершить «${receipt.name}»? Все показанные изменения применятся к остаткам и себестоимости.`)) {
                        run(s,'inventory-document-complete',{id:receipt.id});
                    }
                }));
            };
            detail.ontoggle=expand;expand();
            fragment.append(detail);
        }
        container.replaceChildren(fragment);
        if (!container.children.length) container.append(node('p','Поступлений пока нет','gift-hint'));
    }
    function mountProduct(s,card,id) {
        if (card.querySelector('.inventory-card')) return;
        const root=node('section',null,'inventory-card inventory-bulk');
        root.append(node('h3','Поступления товара'));
        const doc=select('Незавершённое поступление'),kind=select('Изменение');
        options(kind.control,[{id:'receive',text:'Пополнить'},{id:'writeoff',text:'Списать'}]);
        const qty=field('Количество','number'),price=field('Закупочная цена за единицу, ₽','number'),source=select('Из поступления / партии');
        qty.control.min='1';qty.control.step='1';qty.control.value='1';
        const sourcePrice=node('p','','gift-hint'),note=field('Комментарий'),list=node('div');
        const add=button('Добавить в поступление',()=>{
            if (!doc.control.value) return;
            run(s,'inventory-document-add',{receipt_id:doc.control.value,kind:kind.control.value,catalog_id:id,
                quantity:qty.control.value,unit_cost:price.control.value,source_lot_id:source.control.value,
                note:note.control.value,request_key:crypto.randomUUID()});
        });
        function mode() {
            const loss=kind.control.value==='writeoff';
            price.label.hidden=loss;source.label.hidden=!loss;sourcePrice.hidden=!loss;
            const selected=source.control.selectedOptions[0];
            sourcePrice.textContent=loss?(selected?.textContent || 'Нет поступлений с доступным остатком'):'';
            add.disabled=!doc.control.value || (loss && !source.control.value);
        }
        kind.control.onchange=mode;source.control.onchange=mode;doc.control.onchange=mode;
        root.append(doc.label,kind.label,qty.label,price.label,source.label,sourcePrice,note.label,add,
            node('p','Остаток изменится только после завершения поступления.','gift-hint'),list);
        card.append(root);
        view(s,root,data=>{
            options(doc.control,data.receipts.filter(r=>r.status==='draft' && !r.is_initial && !r.cancelled_at)
                .map(r=>({id:r.id,text:`${r.name} #${r.id}`})));
            const batches=data.receipts.filter(r=>r.status==='completed' && !r.cancelled_at)
                .flatMap(r=>(r.items || []).filter(e=>e.kind==='receive' && e.lot_id && Number(e.catalog_id)===id)
                    .map(e=>({id:e.lot_id,disabled:Number(e.remaining)<=0,text:`${r.name} #${r.id} · ${money(e.unit_cost)} · остаток ${e.remaining} · партия #${e.lot_id}`})));
            options(source.control,batches);
            const product=data.products.find(p=>Number(p.id)===id);
            if (!price.control.value && product?.last_cost!=null) price.control.value=product.last_cost;
            mode();history(s,list,data,id);
        });
    }
    window.mountInventoryProduct=(point,card,id)=>{
        if (!allowed()) return;
        const s=state(point);mountProduct(s,card,id);load(s);
    };
    window.mountInventoryManagement=point=>{
        if (!allowed()) return;
        const s=state(point),path=document.getElementById('mainPath') || document.querySelector('.path');
        if (path && !path.querySelector('[data-inventory-documents]')) {
            const toolbar=node('div',null,'gift-toolbar');toolbar.dataset.inventoryDocuments='true';
            toolbar.onclick=event=>event.stopPropagation();
            toolbar.append(button('Поставки и FIFO',()=>open(s)));path.append(toolbar);
        }
        for (const card of document.querySelectorAll('.cart_product')) {
            const id=Number(card.id.replace('cart_',''));
            if (id) mountProduct(s,card,id);
        }
        for (const card of document.querySelectorAll('.cart_category')) {
            const id=Number(card.id.replace('cart_',''));
            if (!id || card.querySelector('.inventory-bulk')) continue;
            const root=node('section',null,'inventory-bulk'),price=field('Новая закупочная цена за единицу, ₽','number');
            root.append(node('h3','Массовое назначение закупочной стоимости'),
                node('p','Неизвестные цены остатков и старых продаж этой категории и подкатегорий будут записаны в «Начальное». Новым товарам без остатка назначится цена по умолчанию. Уже известные цены не меняются. Завершите «Начальное» для применения.','gift-hint'),
                price.label,button('Добавить в «Начальное»',()=>{
                    if (price.control.value==='') return;
                    run(s,'inventory-category-cost',{category_id:id,unit_cost:price.control.value,request_key:crypto.randomUUID()});
                }));
            card.append(root);view(s,root,()=>{});
        }
        load(s);
    };
    function open(s) {
        document.getElementById('inventoryEditor')?.remove();
        const overlay=node('section',null,'gift-overlay');overlay.id='inventoryEditor';
        overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Поставки и FIFO');
        const panel=node('div',null,'gift-panel inventory-panel'),header=node('header',null,'gift-header'),focus=document.activeElement;
        const close=button('Закрыть',()=>{overlay.remove();focus?.focus();});close.dataset.inventoryClose='true';
        header.append(node('h2','Поставки и FIFO'),close);
        const name=field('Название нового поступления'),note=field('Комментарий'),list=node('div'),filter=select('Показать поступления');
        options(filter.control,[{id:'all',text:'Все'},{id:'draft',text:'Не завершённые'},{id:'completed',text:'Завершённые'}]);
        const create=button('Создать поступление',()=>run(s,'inventory-document-create',{
            name:name.control.value,note:note.control.value,request_key:crypto.randomUUID()
        }));
        panel.append(header,node('p',s.point.title,'gift-point'),name.label,note.label,create,
            node('p','Добавляйте пополнения и списания через карточки товаров. Перед завершением сверяйте список изменений.','gift-hint'),
            button('Обновить',()=>!s.busy && load(s)),filter.label,list);
        overlay.append(panel);document.body.append(overlay);
        const v=view(s,panel,data=>history(s,list,{...data,receipts:data.receipts.filter(r=>filter.control.value==='all' || r.status===filter.control.value)}));
        filter.control.onchange=()=>s.data && v.render(s.data);
        overlay.onkeydown=event=>{
            if (event.key==='Escape') close.click();
            if (event.key==='Tab') {
                const controls=[...overlay.querySelectorAll('button,input,select')].filter(el=>!el.disabled && !el.hidden && !el.closest('[hidden]') && el.getClientRects().length);
                const first=controls[0],last=controls.at(-1);
                if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
                if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
            }
        };
        close.focus();load(s);
    }
})();
