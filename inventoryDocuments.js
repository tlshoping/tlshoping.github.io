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
            for (const el of view.root.querySelectorAll('input,select,textarea,button')) {
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
            message(s,ok?(name==='inventory-document-complete'?'Поступление завершено. Остатки обновлены.':
                name==='inventory-receipt-prices'?'Закупочные цены сохранены. Связанная себестоимость пересчитана; количество товара не изменено.':
                    'Изменения сохранены в черновике. Остатки ещё не изменены.'):
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
    function receiptTotals(items,kind=null) {
        const totals={quantity:0,cost:0,retail:0,unknownCost:0,unknownRetail:0};
        for (const item of items) {
            if (!['receive','writeoff'].includes(item.kind) || (kind && item.kind!==kind)) continue;
            const quantity=Number(item.quantity);
            if (!Number.isSafeInteger(quantity) || quantity<=0) continue;
            totals.quantity+=quantity;
            for (const [field,total,unknown] of [
                ['unit_cost','cost','unknownCost'],['retail_price','retail','unknownRetail']
            ]) {
                const value=item[field],price=Number(value);
                if (value==null || value==='' || !Number.isFinite(price) || price<0) totals[unknown]+=quantity;
                else totals[total]+=Math.round(price*100)*quantity;
            }
        }
        return totals;
    }
    function totalMoney(cents,unknown,quantity) {
        if (unknown && unknown===quantity) return `неизвестна (${unknown} ед.)`;
        return `${money(cents/100)}${unknown?` + неизвестна для ${unknown} ед.`:''}`;
    }
    function receiptValues(totals) {
        return `Закупочная: ${totalMoney(totals.cost,totals.unknownCost,totals.quantity)} · `+
            `Розничная (текущие цены): ${totalMoney(totals.retail,totals.unknownRetail,totals.quantity)}`;
    }
    function history(s,container,data,productId=null) {
        const expanded=new Set([...container.querySelectorAll('details[open]')].map(el=>el.dataset.id));
        const fragment=document.createDocumentFragment();
        for (const receipt of data.receipts) {
            const items=productId==null?(receipt.items || []):(receipt.items || []).filter(item=>Number(item.catalog_id)===productId);
            if (productId!=null && !items.length) continue;
            const detail=node('details',null,'inventory-document');
            detail.dataset.id=String(receipt.id);detail.open=expanded.has(String(receipt.id));
            const status=receipt.cancelled_at?'завершена · отменена':receipt.status==='draft'?'не завершена':'завершена';
            const totals=receiptTotals(items);
            detail.append(node('summary',`${receipt.name || receipt.supplier || 'Поступление'} #${receipt.id} · ${status} · `+
                `Позиций: ${items.length} · ${receiptValues(totals)}`));
            const expand=event=>{
                if ((event && !detail.isConnected) || !detail.open || detail.dataset.loaded) return;
                detail.dataset.loaded='true';
                detail.append(node('p',new Date(receipt.created_at).toLocaleString('ru-RU'),'gift-hint'));
                if (receipt.note) detail.append(node('p',receipt.note));
                if (receipt.is_initial) detail.append(node('p','Оценка существующих остатков и истории не увеличивает количество товаров.','gift-hint'));
                else {
                    const incoming=receiptTotals(items,'receive'),outgoing=receiptTotals(items,'writeoff');
                    detail.append(node('p',`Пополнение: ${incoming.quantity} ед. · ${receiptValues(incoming)}\n`+
                        `Списание: ${outgoing.quantity} ед. · ${receiptValues(outgoing)}\n`+
                        `Изменение остатка: ${incoming.quantity-outgoing.quantity} ед.`));
                }
                detail.append(entries(s,receipt,items,productId==null && receipt.status==='draft'));
                if (productId==null && !receipt.cancelled_at && items.some(item=>
                    item.kind==='receive' || (receipt.status==='draft' && item.kind==='cost'))) {
                    detail.append(button('Редактировать закупочные цены',()=>openInitial(s,null,false,receipt)));
                }
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
    function trap(overlay,close) {
        overlay.onkeydown=event=>{
            if (event.key==='Escape') close.click();
            if (event.key==='Tab') {
                const controls=[...overlay.querySelectorAll('button,input,select,textarea')].filter(el=>
                    !el.disabled && !el.hidden && !el.closest('[hidden]') && el.getClientRects().length);
                const first=controls[0],last=controls.at(-1);
                if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
                if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
            }
        };
    }
    function priceValue(value) {
        const normalized=String(value).trim().replace(/[ \u00a0\u202f]/g,'').replace(',','.');
        if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Введите неотрицательную цену с максимум двумя знаками после запятой');
        return normalized;
    }
    function openInitial(s,category,gifts=false,receipt=null) {
        const scope=()=>receipt?{receipt_id:receipt.id,expected_status:receipt.status}:
            gifts?{gift_products:true}:{category_id:category,include_subcategories:include.checked};
        document.getElementById('inventoryInitialEditor')?.remove();
        const overlay=node('section',null,'gift-overlay');overlay.id='inventoryInitialEditor';
        overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
        overlay.setAttribute('aria-label',receipt?'Закупочные цены поставки':gifts?'Начальные цены подарков':'Начальные цены категории');
        const panel=node('div',null,'gift-panel inventory-panel inventory-initial-panel'),header=node('header',null,'gift-header');
        const focus=document.activeElement,values=new Map();
        let rows=[],revision=0,loading=true,dirty=false;
        function dismiss(force=false) {
            if (!force && dirty && !confirm('Закрыть таблицу без сохранения введённых цен?')) return;
            revision++;overlay.remove();focus?.focus();
        }
        const close=button('Закрыть',()=>dismiss());close.dataset.inventoryClose='true';
        header.append(node('h2',receipt?'Закупочные цены поставки':'Начальные закупочные цены'),close);
        const include=node('input');include.type='checkbox';include.setAttribute('aria-label','Включить подкатегории');
        const includeLabel=node('label','Включить подкатегории','inventory-initial-checkbox');includeLabel.append(include);
        const notice=node('p','','gift-status');notice.setAttribute('role','status');
        const pasteLabel=node('label','Вставить столбец цен из Excel'),paste=node('textarea');
        paste.rows=3;paste.setAttribute('aria-label','Вставить столбец цен из Excel');
        paste.placeholder='100,50\n250\n0';pasteLabel.append(paste);
        const table=node('table',null,'inventory-initial-table'),head=node('thead'),heading=node('tr'),body=node('tbody');
        for (const title of receipt?['Товар / строка','Количество','Остаток','Закупочная цена, ₽']:
            ['Товар','Остаток','Продано без закупочной цены','Закупочная цена, ₽']) {
            const th=node('th',title);th.scope='col';heading.append(th);
        }
        head.append(heading);table.append(head,body);
        function applyColumn(raw,start=0) {
            try {
                if (loading || s.busy || s.pending) return;
                const lines=String(raw).replace(/\r\n?/g,'\n').split('\n');
                if (lines.at(-1)==='') lines.pop();
                if (!lines.length || lines.every(line=>!line.trim())) throw new Error('Вставьте столбец закупочных цен');
                if (lines.length>rows.length-start) throw new Error('Вставлено больше цен, чем строк товаров. Изменения не внесены');
                if (lines.some(line=>line.includes('\t'))) throw new Error('Вставьте только один столбец цен, без названий товаров');
                const parsed=lines.map(line=>line.trim()?priceValue(line):null);
                parsed.forEach((value,index)=>{
                    if (value==null) return;
                    const row=rows[start+index];row.input.value=value;values.set(row.product.id,value);
                });
                dirty=true;notice.textContent='Цены перенесены в таблицу. Сверьте соответствие строк перед сохранением.';
            } catch (error) { notice.textContent=error.message; }
        }
        const insert=button('Перенести цены в таблицу',()=>applyColumn(paste.value));
        function saved(result) {
            if (result?.id && overlay.isConnected) {dirty=false;dismiss(true);open(s,result.id);}
        }
        const save=button(receipt?'Сохранить закупочные цены':'Добавить цены в «Начальное»',async()=>{
            if (loading || s.busy || s.pending) return;
            try {
                const items=[];
                for (const row of rows) {
                    if (!row.input.value.trim()) continue;
                    try {
                        const price=priceValue(row.input.value);
                        if (receipt) {
                            if (row.product.unit_cost!=null && Number(price)===Number(row.product.unit_cost)) continue;
                            items.push({id:row.product.id,unit_cost:price,expected_unit_cost:row.product.unit_cost});
                        } else items.push({catalog_id:row.product.id,unit_cost:price});
                    }
                    catch (error) { row.input.focus();throw new Error(`${row.product.title}: ${error.message}`); }
                }
                if (!items.length) throw new Error(receipt?'Нет изменённых закупочных цен':'Введите хотя бы одну закупочную цену');
                if (items.length>1000) throw new Error('За один раз можно добавить не более 1000 цен');
                notice.textContent='';
                if (receipt && !confirm(receipt.status==='completed'?
                    'Изменить цены завершённой поставки? Пересчитаются связанные продажи, подарки и списания, прибыль и резерв. Количество товара не изменится.':
                    'Сохранить новые цены в черновике поставки? Они применятся после его завершения.')) return;
                const result=await run(s,receipt?'inventory-receipt-prices':'inventory-initial-prices',
                    {...scope(),items,request_key:crypto.randomUUID()});
                saved(result);
            } catch (error) {notice.textContent=error.message;}
        });
        async function loadRows() {
            const current=++revision;loading=true;save.disabled=true;insert.disabled=true;
            notice.textContent=receipt?'Загружаю строки поставки...':gifts?'Загружаю подарочные товары...':'Загружаю товары категории...';
            try {
                const products=(await api(s,receipt?'inventory-receipt-price-products':'inventory-initial-products',scope())).data;
                if (!overlay.isConnected || current!==revision) return;
                if (!Array.isArray(products)) throw new Error('Не удалось прочитать товары категории');
                rows=products.map((product,index)=>{
                    const tr=node('tr'),title=node('th',receipt?`${product.title} · строка #${product.id}`:product.title);
                    title.scope='row';tr.append(title);
                    for (const [label,value] of receipt?[['Количество',product.quantity],['Остаток',product.remaining]]:
                        [['Остаток',product.count],['Продано без закупочной цены',product.unknown_sold_count]]) {
                        const td=node('td',String(value || 0));td.dataset.label=label;tr.append(td);
                    }
                    const td=node('td'),input=node('input');
                    td.dataset.label='Закупочная цена, ₽';input.type='text';input.inputMode='decimal';input.autocomplete='off';
                    input.dataset.catalogId=String(product.id);input.setAttribute('aria-label',`Закупочная цена ${product.title}`);
                    input.value=values.has(product.id)?values.get(product.id):(receipt?product.unit_cost:product.pending_cost) ?? '';
                    input.placeholder='Не менять';
                    input.oninput=()=>{values.set(product.id,input.value);dirty=true;};
                    input.onpaste=event=>{
                        const raw=event.clipboardData?.getData('text');
                        if (raw && /[\r\n\t]/.test(raw)) {event.preventDefault();applyColumn(raw,index);}
                    };
                    input.onkeydown=event=>{
                        if (event.key==='Enter' && !event.isComposing) {event.preventDefault();rows[index+1]?.input.focus();}
                    };
                    td.append(input);tr.append(td);return {product,input,tr};
                });
                body.replaceChildren(...rows.map(row=>row.tr));
                notice.textContent=rows.length?`Позиций для назначения цены: ${rows.length}`:
                    (receipt?'Нет редактируемых строк поставки.':'Нет неизвестных цен или новых товаров без остатка.'+(gifts?'':' Можно включить подкатегории.'));
                loading=false;save.disabled=!rows.length;insert.disabled=!rows.length;
            } catch (error) {
                if (overlay.isConnected && current===revision) notice.textContent=error.message;
            }
        }
        include.onchange=loadRows;
        panel.append(header,node('p',`${s.point.title} · ${receipt?`${receipt.name} #${receipt.id}`:gifts?'подарочные товары':'неизвестные цены категории и новые товары без остатка'}`,'gift-point'),
            node('p',receipt?'Каждая строка поставки имеет свою цену, даже если товар повторяется. Пустое поле — не менять; 0 — явно нулевая стоимость. Для завершённых поставок изменение пересчитает связанные FIFO-продажи, подарки и списания. Остаток и количество не изменяются.':
                'Каждому товару назначается своя цена. Пустое поле — не менять, в том числе уже сохранённую строку черновика. 0 — явно нулевая стоимость. Известные цены не меняются. Цены старых продаж и остатка применятся только после завершения «Начального».','gift-hint'),
            ...(!gifts && !receipt?[includeLabel]:[]),notice,button('Обновить товары',()=>!s.busy && !s.pending && loadRows()),
            pasteLabel,insert,node('p','Порядок цен из Excel должен совпадать с порядком товаров в таблице. Пустые строки пропускаются. Между полями можно переходить Tab или Enter.','gift-hint'),
            table,save);
        overlay.append(panel);document.body.append(overlay);
        const v=view(s,panel,()=>{});
        v.retry.onclick=async()=>{
            if (!s.pending) return;
            const pending=s.pending,result=await run(s,pending.name,pending.payload,true);
            if (['inventory-initial-prices','inventory-receipt-prices'].includes(pending.name)) saved(result);
        };
        trap(overlay,close);close.focus();loadRows();
    }
    window.mountInventoryProduct=(point,card,id)=>{
        if (!allowed()) return;
        const s=state(point);mountProduct(s,card,id);load(s);
    };
    window.openGiftInitialPrices=point=>{
        if (!allowed()) return;
        openInitial(state(point),null,true);
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
                }),button('Назначить начальные цены',()=>openInitial(s,id)));
            card.append(root);view(s,root,()=>{});
        }
        load(s);
    };
    function open(s,receiptId=null) {
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
        const v=view(s,panel,data=>{
            history(s,list,{...data,receipts:data.receipts.filter(r=>filter.control.value==='all' || r.status===filter.control.value)});
            if (receiptId!=null) {
                const detail=[...list.querySelectorAll('details')].find(el=>el.dataset.id===String(receiptId));
                if (detail) detail.open=true;
            }
        });
        filter.control.onchange=()=>s.data && v.render(s.data);
        trap(overlay,close);
        close.focus();load(s);
    }
})();
