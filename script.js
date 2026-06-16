// ============================================================
// 1. КАЛЕНДАРИ
// ============================================================
const CAL = {
    kurdoz:  { name:'Курдозский', offset:0,  months:16, era:'Курдозская эра', color:'#6b5a4a' },
    blomsiv: { name:'Бломсивский', offset:25, months:12, era:'Бломсивская эра', color:'#5a6b6b' },
    rudichin:{ name:'Рудичинский', offset:6,  months:6,  era:'Рудичинская эра', color:'#7a5a3a' },
    abner:   { name:'Абнерский', offset:51, months:12, era:'Абнерская эра', color:'#5a4a3a' },
};

// ============================================================
// 2. СОБЫТИЯ (демо)
// ============================================================
const EVENTS = [
    { year:-20, title:'Первые общины в Зукрии', region:'Зукрия', color:'#6b5a4a', desc:'...' },
    { year:-10, title:'Миграция на восток', region:'Зукрия', color:'#6b5a4a', desc:'...' },
    { year:0,   title:'Битва за Агилон', region:'Рэздрум', color:'#8b6b53', desc:'...' },
    { year:13,  title:'Основание Рэздрума', region:'Рэздрум', color:'#8b6b53', desc:'...' },
    { year:25,  title:'Эшфордский Пакт', region:'Кулидия', color:'#5a6b6b', desc:'...' },
    { year:40,  title:'Экспедиция Шеффилда', region:'Кулидия', color:'#5a6b6b', desc:'...' },
    { year:51,  title:'Образование Борэйского союза', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:54,  title:'Открытие магии', region:'Рэздрум', color:'#8b6b53', desc:'...' },
    { year:78,  title:'Коронация Августа', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:99,  title:'Смерть Августа', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:108, title:'Война 81 дня', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:109, title:'Ночь лишений', region:'Рэздрум', color:'#8b6b53', desc:'...' },
    { year:116, title:'Основание БРРФ', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:126, title:'Бореаннское Содружество', region:'Бореанния', color:'#5a4a3a', desc:'...' },
    { year:133, title:'Вторжение Кулидии', region:'Кулидия', color:'#5a6b6b', desc:'...' },
    { year:135, title:'Уничтожение Пендрагона', region:'Бореанния', color:'#5a4a3a', desc:'...' },
];

// ============================================================
// 3. СОСТОЯНИЕ
// ============================================================
let calId = 'kurdoz';
let zoom = 200;
let currentYear = 0;
let isPlaying = false;
let playTimer = null;
let speed = 5;

const dom = {
    calSelect: document.getElementById('calSelect'),
    zoomSelect: document.getElementById('zoomSelect'),
    eraName: document.getElementById('eraName'),
    calOffset: document.getElementById('calOffset'),
    rangeDisplay: document.getElementById('rangeDisplay'),
    yearSlider: document.getElementById('yearSlider'),
    yearLabel: document.getElementById('yearLabel'),
    playBtn: document.getElementById('playBtn'),
    speedSlider: document.getElementById('speedSlider'),
    speedVal: document.getElementById('speedVal'),
    eventsStrip: document.getElementById('eventsStrip'),
    timelineWrap: document.getElementById('timelineWrap'),
    svg: document.getElementById('timelineSvg'),
    footerYear: document.getElementById('footerYear'),
    modal: document.getElementById('modal'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalClose'),
};

// ============================================================
// 4. ВСПОМОГАТЕЛЬНЫЕ
// ============================================================
function convertYear(y) { return y - CAL[calId].offset; }
function getRange() {
    const half = zoom / 2;
    return { start: Math.round(currentYear - half), end: Math.round(currentYear + half) };
}
function eventsAtYear(y) { return EVENTS.filter(e => e.year === y); }

// ============================================================
// 5. ОТРИСОВКА
// ============================================================
function render() {
    const cal = CAL[calId];
    const range = getRange();
    const { start, end } = range;
    const total = end - start;
    if (total === 0) return;

    // ---- инфо ----
    dom.eraName.textContent = cal.era;
    const calYear = convertYear(currentYear);
    // Если текущий год = 0, показываем символ, иначе подпись
    let yearLabelText;
    if (calYear === 0) {
        yearLabelText = '⚔️ Битва за Агилон';
    } else if (calYear > 0) {
        yearLabelText = `${calYear} г. п.Б.з.А.`;
    } else {
        yearLabelText = `${Math.abs(calYear)} г. д.Б.з.А.`;
    }
    dom.yearLabel.textContent = yearLabelText;
    dom.yearSlider.value = currentYear;
    dom.footerYear.textContent = calYear === 0 ? '⚔️' : calYear;
    dom.calOffset.textContent = cal.offset;
    // Диапазон: если начало или конец равны 0, заменяем на символ
    let rangeStart = convertYear(start);
    let rangeEnd = convertYear(end);
    let rangeStr = '';
    if (rangeStart === 0) rangeStr += '⚔️';
    else rangeStr += rangeStart;
    rangeStr += ' … ';
    if (rangeEnd === 0) rangeStr += '⚔️';
    else rangeStr += rangeEnd;
    dom.rangeDisplay.textContent = rangeStr;

    // ---- SVG ----
    const w = 1000, h = 160, margin = 60, pw = w - margin * 2, px = pw / total;
    let html = '';

    // --- сетка годов (без нулевого года) ---
    let yearStep = 1;
    if (total > 50) yearStep = 5;
    if (total > 200) yearStep = 10;
    if (total > 500) yearStep = 50;

    for (let y = Math.floor(start / yearStep) * yearStep; y <= end; y += yearStep) {
        const x = margin + (y - start) * px;
        const isZero = y === 0;
        const col = isZero ? '#7a5a3a' : '#2a221a';
        const wd = isZero ? 2 : 0.6;
        html += `<line x1="${x}" y1="16" x2="${x}" y2="${h - 16}" stroke="${col}" stroke-width="${wd}" opacity="${isZero ? 0.8 : 0.35}" />`;
        // подпись: если год = 0, не выводим текст
        if (!isZero) {
            const labelYear = convertYear(y);
            let label;
            if (labelYear > 0) label = `${labelYear}`;
            else label = `${Math.abs(labelYear)}`;
            html += `<text x="${x}" y="${h/2 + 28}" text-anchor="middle" fill="#5f4f3f" font-size="9" opacity="0.8">${label}</text>`;
        } else {
            // для нулевого года рисуем небольшой маркер (звезда)
            html += `<text x="${x}" y="${h/2 - 10}" text-anchor="middle" fill="#ab8b76" font-size="12" opacity="0.9">★</text>`;
        }
    }

    // --- МАРКЕР ТЕКУЩЕГО ГОДА (всегда виден) ---
    const cx = margin + (currentYear - start) * px;
    if (cx >= margin && cx <= w - margin) {
        html += `<line x1="${cx}" y1="16" x2="${cx}" y2="${h - 16}" stroke="#ab8b76" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6" />`;
        html += `<circle cx="${cx}" cy="${h/2}" r="7" fill="#ab8b76" stroke="#fff" stroke-width="1.5" />`;
        html += `<circle cx="${cx}" cy="${h/2}" r="3" fill="#fff" opacity="0.5" />`;
    }

    // --- деления месяцев (при масштабе <= 200) ---
    if (zoom <= 200) {
        const months = cal.months;
        for (let y = Math.floor(start); y <= end; y++) {
            const xBase = margin + (y - start) * px;
            for (let m = 1; m < months; m++) {
                const x = xBase + (m / months) * px;
                html += `<line x1="${x}" y1="${h/2 - 6}" x2="${x}" y2="${h/2 + 6}" stroke="#2a221a" stroke-width="0.6" opacity="0.3" />`;
            }
        }
    }

    // ось
    html += `<line x1="${margin}" y1="${h/2}" x2="${w - margin}" y2="${h/2}" stroke="#3d2c20" stroke-width="1.5" />`;

    // отметка 0 (звезда) на оси
    const zx = margin + (0 - start) * px;
    if (zx > margin + 2 && zx < w - margin - 2) {
        html += `<circle cx="${zx}" cy="${h/2}" r="5" fill="#8b6b53" stroke="#4d3728" stroke-width="1.5" />`;
        html += `<text x="${zx}" y="${h/2 + 44}" text-anchor="middle" fill="#ab8b76" font-size="8" font-weight="300" letter-spacing="1">⚔️</text>`;
    }

    // название календаря
    html += `<text x="${margin + 6}" y="18" fill="#6b5a4a" font-size="10" font-weight="300" letter-spacing="1" opacity="0.7">${cal.name}</text>`;

    // эпохи (полосы внизу)
    const eras = [
        { s: -1000, e: -1, color: '#1a1512' },
        { s: 0, e: 50, color: '#2a1f17' },
        { s: 50, e: 100, color: '#2f2318' },
        { s: 100, e: 140, color: '#2f1f1a' },
    ];
    const eraY = h - 8, eraH = 6;
    for (const e of eras) {
        const x1 = margin + (e.s - start) * px;
        const x2 = margin + (e.e - start) * px;
        if (x2 < margin || x1 > w - margin) continue;
        const cx1 = Math.max(margin, x1);
        const cx2 = Math.min(w - margin, x2);
        if (cx2 > cx1) html += `<rect x="${cx1}" y="${eraY}" width="${cx2 - cx1}" height="${eraH}" fill="${e.color}" opacity="0.6" />`;
    }
    html += `<text x="${w/2}" y="${h + 12}" text-anchor="middle" fill="#3d2c20" font-size="7" letter-spacing="1" opacity="0.3">ЭПОХИ</text>`;

    dom.svg.innerHTML = html;

    // ---- события (малый формат) ----
    const evs = eventsAtYear(currentYear);
    dom.eventsStrip.innerHTML = '';
    if (evs.length === 0) {
        dom.eventsStrip.innerHTML = '<span class="placeholder">нет событий в этом году</span>';
    } else {
        evs.forEach(e => {
            const tag = document.createElement('span');
            tag.className = 'event-tag';
            tag.style.borderLeftColor = e.color || '#6b5a4a';
            tag.innerHTML = `<span class="ev-year">${e.year}</span> ${e.title}`;
            tag.addEventListener('click', () => openEventCard(e));
            dom.eventsStrip.appendChild(tag);
        });
    }

    // ---- центрирование ----
    const currentX = margin + (currentYear - start) * px;
    const wrapW = dom.timelineWrap.clientWidth;
    const scrollTo = currentX - wrapW / 2;
    dom.timelineWrap.scrollLeft = scrollTo > 0 ? scrollTo : 0;

    // ---- ширина SVG ----
    const totalPx = total * px;
    if (totalPx > pw) {
        dom.svg.style.width = (totalPx + margin * 2) + 'px';
        dom.svg.setAttribute('viewBox', `0 0 ${totalPx + margin * 2} ${h}`);
    } else {
        dom.svg.style.width = '100%';
        dom.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
}

// ============================================================
// 6. МОДАЛЬНЫЕ ОКНА (без изменений)
// ============================================================
function openEventCard(event) {
    const cal = CAL[calId];
    const calYear = convertYear(event.year);
    dom.modalContent.innerHTML = `
        <div class="card">
            <div class="thumb">[обложка]</div>
            <div class="title">${event.title}</div>
            <div class="meta">
                <span>📅 ${event.year} г. п.Б.з.А.</span>
                <span>📍 ${event.region || 'неизвестен'}</span>
                <span>🗓️ ${cal.name}: ${calYear}</span>
            </div>
            <div class="desc">${event.desc || 'Описание отсутствует.'}</div>
        </div>
    `;
    dom.modal.classList.add('active');
}

function openYearPanel(year) {
    const evs = eventsAtYear(year);
    if (evs.length === 0) return;
    const cal = CAL[calId];
    let html = `<div class="year-head">События ${year} года</div>`;
    evs.forEach(e => {
        const calYear = convertYear(e.year);
        html += `
            <div class="card" style="cursor:pointer;" onclick="openEventCard(EVENTS.find(ev => ev.title === '${e.title}'))">
                <div class="thumb" style="height:60px;">[обложка]</div>
                <div class="title">${e.title}</div>
                <div class="meta">
                    <span>📅 ${e.year} г. п.Б.з.А.</span>
                    <span>📍 ${e.region || 'неизвестен'}</span>
                    <span>🗓️ ${cal.name}: ${calYear}</span>
                </div>
                <div class="desc">${e.desc || ''}</div>
            </div>
        `;
    });
    dom.modalContent.innerHTML = html;
    dom.modal.classList.add('active');
}

dom.modalClose.addEventListener('click', () => dom.modal.classList.remove('active'));
dom.modal.addEventListener('click', (e) => { if (e.target === dom.modal) dom.modal.classList.remove('active'); });

// ============================================================
// 7. КЛИК ПО ГОДУ НА ШКАЛЕ
// ============================================================
dom.svg.addEventListener('click', (e) => {
    const rect = dom.svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const range = getRange();
    const total = range.end - range.start;
    if (total === 0) return;
    const w = 1000, margin = 60, pw = w - margin * 2, px = pw / total;
    const year = Math.round(range.start + (x - margin) / px);
    if (year >= range.start && year <= range.end && eventsAtYear(year).length > 0) {
        openYearPanel(year);
    }
});

// ============================================================
// 8. ПРОКРУТКА
// ============================================================
dom.yearSlider.addEventListener('input', () => {
    currentYear = parseInt(dom.yearSlider.value, 10);
    if (isPlaying) stopPlayback();
    render();
});

dom.playBtn.addEventListener('click', () => {
    isPlaying ? stopPlayback() : startPlayback();
});

dom.speedSlider.addEventListener('input', () => {
    speed = parseInt(dom.speedSlider.value, 10);
    dom.speedVal.textContent = speed;
    if (isPlaying) { stopPlayback(); startPlayback(); }
});

function startPlayback() {
    isPlaying = true;
    dom.playBtn.textContent = '⏸';
    const interval = Math.max(100, 2000 - speed * 90);
    playTimer = setInterval(() => {
        currentYear += 1;
        dom.yearSlider.value = currentYear;
        render();
    }, interval);
}
function stopPlayback() {
    isPlaying = false;
    dom.playBtn.textContent = '▶';
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
}

// ============================================================
// 9. ПЕРЕКЛЮЧЕНИЕ
// ============================================================
dom.calSelect.addEventListener('change', () => {
    calId = dom.calSelect.value;
    if (isPlaying) stopPlayback();
    render();
});
dom.zoomSelect.addEventListener('change', () => {
    zoom = parseInt(dom.zoomSelect.value, 10);
    if (isPlaying) stopPlayback();
    render();
});

// ============================================================
// 10. ИНИЦИАЛИЗАЦИЯ
// ============================================================
window.addEventListener('resize', () => { render(); });
dom.calSelect.value = calId;
dom.zoomSelect.value = String(zoom);
dom.speedSlider.value = String(speed);
dom.speedVal.textContent = speed;
render();

console.log('⏳ Хронология Агилона загружена.');