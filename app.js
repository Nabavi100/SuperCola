/* ════════════════════════════════════════════
   SUPER COLA — Enterprise Ordering System
   Production-Grade Application Logic
   ════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   DATA
────────────────────────────────────────── */
const PRODUCTS = [
  { id: 'sc-250',   name: 'سوپر کولا ۲۵۰',        cat: 'کولا' },
  { id: 'sc-330',   name: 'سوپر کولا ۳۳۰',        cat: 'کولا' },
  { id: 'sc-500',   name: 'سوپر کولا ۵۰۰',        cat: 'کولا' },
  { id: 'sc-1l',    name: 'سوپر کولا ۱ لیتر',     cat: 'کولا' },
  { id: 'sc-fam',   name: 'سوپر کولا خانواده',    cat: 'کولا' },
  { id: 'or-250',   name: 'پرتقالی ۲۵۰',          cat: 'پرتقالی' },
  { id: 'or-330',   name: 'پرتقالی ۳۳۰',          cat: 'پرتقالی' },
  { id: 'or-fam',   name: 'پرتقالی خانواده',      cat: 'پرتقالی' },
  { id: 'lm-250',   name: 'لیمویی ۲۵۰',           cat: 'لیمویی' },
  { id: 'lm-330',   name: 'لیمویی ۳۳۰',           cat: 'لیمویی' },
  { id: 'lm-fam',   name: 'لیمویی خانواده',       cat: 'لیمویی' },
  { id: 'en-cls',   name: 'انرژی‌زا کلاسیک',      cat: 'انرژی‌زا' },
  { id: 'en-sf',    name: 'انرژی‌زا بدون شکر',    cat: 'انرژی‌زا' },
  { id: 'wr-sm',    name: 'آب معدنی کوچک',        cat: 'آب معدنی' },
  { id: 'wr-lg',    name: 'آب معدنی بزرگ',        cat: 'آب معدنی' },
];

// Voice command name aliases
const VOICE_ALIASES = {
  'دوصد و پنجاه': 'سوپر کولا ۲۵۰',
  'سه صد و سی': 'سوپر کولا ۳۳۰',
  'پنج صد': 'سوپر کولا ۵۰۰',
  'یک لیتر': 'سوپر کولا ۱ لیتر',
  'خانواده': 'سوپر کولا خانواده',
  'آب معدنی': 'آب معدنی کلان',
  'آب خورد': 'آب معدنی خورد',
  'آب کلان': 'آب معدنی کلان',
  'انرژی زا': 'انرژی‌زا کلاسیک',
  'انرژی': 'انرژی‌زا کلاسیک',
  'پرتقال': 'پرتقالی ۳۳۰',
  'لیمو': 'لیمویی ۳۳۰',
};

// Persian number words
const PERSIAN_NUMS = {
  'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5,
  'شش': 6, 'هفت': 7, 'هشت': 8, 'نه': 9, 'ده': 10,
  'پانزده': 15, 'بیست': 20, 'سی': 30, 'چهل': 40,
  'پنجاه': 50, 'شصت': 60, 'هفتاد': 70, 'هشتاد': 80, 'نود': 90, 'صد': 100,
};

/* ──────────────────────────────────────────
   STATE
────────────────────────────────────────── */
const state = {
  customer: { name: '', store: '', cat: 'retail' },
  order: [],           // [{ productId, name, qty }]
  selectedProduct: null,
  lastModified: null,
  status: 'پیش‌نویس',
};

/* ──────────────────────────────────────────
   STORAGE
────────────────────────────────────────── */
const STORAGE_KEY = 'supercola_v2';

function saveToStorage() {
  const data = {
    customer: state.customer,
    order: state.order,
    lastModified: state.lastModified,
    status: state.status,
    previousOrder: JSON.parse(localStorage.getItem('supercola_prev') || 'null'),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.customer) state.customer = data.customer;
    if (data.order) state.order = data.order;
    if (data.lastModified) state.lastModified = data.lastModified;
    if (data.status) state.status = data.status;
  } catch (e) { console.warn('Storage load error', e); }
}

function savePreviousOrder() {
  if (state.order.length > 0) {
    localStorage.setItem('supercola_prev', JSON.stringify(state.order));
  }
}

function loadPreviousOrder() {
  try {
    return JSON.parse(localStorage.getItem('supercola_prev') || 'null');
  } catch { return null; }
}

/* ──────────────────────────────────────────
   JALALI DATE
────────────────────────────────────────── */
function toJalali(gy, gm, gd) {
  let jy, jm, jd;
  const g_d_no = [31,28+((gy%4===0&&gy%100!==0)||gy%400===0?1:0),31,30,31,30,31,31,30,31,30,31];
  const j_d_no = [31,31,31,31,31,31,30,30,30,30,30,29];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365*gy + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400);
  for (let i = 0; i < gm - 1; i++) days += g_d_no[i];
  days += gd;
  jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  jd = days < 186 ? 1 + days % 31 : 1 + (days - 186) % 30;
  return [jy, jm, jd];
}

function getJalaliDate(date = new Date()) {
  const [jy, jm, jd] = toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const jdStr = String(jd).padStart(2,'0');
  const jmStr = String(jm).padStart(2,'0');
  return `${toPersianNum(jy)}/${toPersianNum(jmStr)}/${toPersianNum(jdStr)}`;
}

function toPersianNum(n) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function getTimeStr(date = new Date()) {
  const h = String(date.getHours()).padStart(2,'0');
  const m = String(date.getMinutes()).padStart(2,'0');
  return `${toPersianNum(h)}:${toPersianNum(m)}`;
}

/* ──────────────────────────────────────────
   RENDER
────────────────────────────────────────── */
function renderHeader() {
  const { name, store, cat } = state.customer;
  document.getElementById('display-customer').textContent = name || '—';
  document.getElementById('display-store').textContent = store || '—';
  const catBadge = document.getElementById('display-cat');
  const catLabels = { retail: 'خرده‌فروشی', wholesale: 'عمده‌فروشی', vip: 'VIP' };
  catBadge.textContent = catLabels[cat] || '—';
  catBadge.className = 'field-val badge cat-' + (cat || 'retail');
  document.getElementById('display-date').textContent = getJalaliDate();
  const prev = loadPreviousOrder();
  document.getElementById('display-last-order').textContent = prev ? 'موجود' : 'ندارد';
}

function renderOrderTable() {
  const tbody = document.getElementById('order-tbody');
  const empty = document.getElementById('order-empty');
  const tableWrap = document.getElementById('table-wrap');

  if (state.order.length === 0) {
    empty.style.display = '';
    tableWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  tableWrap.style.display = '';

  tbody.innerHTML = '';
  state.order.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    tr.innerHTML = `
      <td class="col-num">${toPersianNum(idx + 1)}</td>
      <td class="col-product">${escHtml(item.name)}</td>
      <td class="col-qty">
        <div class="qty-cell">
          <button class="qty-cell-btn" data-action="dec" data-idx="${idx}" aria-label="کاهش">−</button>
          <span class="qty-cell-val">${toPersianNum(item.qty)}</span>
          <button class="qty-cell-btn" data-action="inc" data-idx="${idx}" aria-label="افزایش">+</button>
        </div>
      </td>
      <td class="col-actions">
        <div class="action-btns">
          <button class="action-btn action-btn-del" data-action="del" data-idx="${idx}" aria-label="حذف">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderSummary() {
  const lines = state.order.length;
  const cartons = state.order.reduce((s, i) => s + i.qty, 0);
  document.getElementById('stat-lines').textContent = toPersianNum(lines);
  document.getElementById('stat-cartons').textContent = toPersianNum(cartons);
  const sb = document.getElementById('stat-status');
  sb.textContent = state.status;
  sb.className = 'stat-val status-badge' + (state.status === 'ذخیره شد' ? ' saved' : state.status === 'ارسال شد' ? ' sent' : '');
  document.getElementById('stat-time').textContent = state.lastModified ? getTimeStr(new Date(state.lastModified)) : '—';
}

function renderAll() {
  renderHeader();
  renderOrderTable();
  renderSummary();
}

/* ──────────────────────────────────────────
   ORDER LOGIC
────────────────────────────────────────── */
function addOrUpdateProduct(productId, qty) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = state.order.findIndex(i => i.productId === productId);
  if (existing >= 0) {
    state.order[existing].qty += qty;
    showToast(`${product.name} به‌روز شد`, 'success');
  } else {
    state.order.push({ productId, name: product.name, qty });
    // Flash new row
    setTimeout(() => {
      const rows = document.querySelectorAll('#order-tbody tr');
      if (rows.length) rows[rows.length - 1].classList.add('row-new');
    }, 50);
    showToast(`${product.name} اضافه شد`, 'success');
  }
  state.lastModified = Date.now();
  state.status = 'پیش‌نویس';
  renderOrderTable();
  renderSummary();
  saveToStorage();
}

function changeQty(idx, delta) {
  if (!state.order[idx]) return;
  const newQty = state.order[idx].qty + delta;
  if (newQty <= 0) {
    removeItem(idx);
    return;
  }
  state.order[idx].qty = newQty;
  state.lastModified = Date.now();
  renderOrderTable();
  renderSummary();
  saveToStorage();
}

function removeItem(idx) {
  state.order.splice(idx, 1);
  state.lastModified = Date.now();
  renderOrderTable();
  renderSummary();
  saveToStorage();
}

function clearOrder() {
  if (state.order.length === 0) { showToast('سفارش خالی است'); return; }
  savePreviousOrder();
  state.order = [];
  state.lastModified = Date.now();
  state.status = 'پیش‌نویس';
  renderAll();
  saveToStorage();
  showToast('سفارش پاک شد', 'warning');
}

/* ──────────────────────────────────────────
   SEARCH
────────────────────────────────────────── */
let searchTimeout = null;
let focusedResult = -1;

function searchProducts(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toLowerCase();
  return PRODUCTS.filter(p =>
    p.name.includes(q) || p.cat.includes(q) ||
    normalizeSearch(p.name).includes(normalizeSearch(q))
  ).slice(0, 8);
}

function normalizeSearch(str) {
  return str
    .replace(/ی/g, 'ي').replace(/ک/g, 'ك')
    .replace(/۰/g,'0').replace(/۱/g,'1').replace(/۲/g,'2').replace(/۳/g,'3')
    .replace(/۴/g,'4').replace(/۵/g,'5').replace(/۶/g,'6').replace(/۷/g,'7')
    .replace(/۸/g,'8').replace(/۹/g,'9');
}

function highlightMatch(text, query) {
  const q = query.trim();
  if (!q) return escHtml(text);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return escHtml(text);
  return escHtml(text.slice(0, idx)) + '<mark>' + escHtml(text.slice(idx, idx + q.length)) + '</mark>' + escHtml(text.slice(idx + q.length));
}

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  const results = searchProducts(query);
  focusedResult = -1;

  if (!query.trim()) { container.style.display = 'none'; return; }

  if (results.length === 0) {
    container.innerHTML = '<div class="result-empty">محصولی یافت نشد</div>';
    container.style.display = '';
    return;
  }

  container.innerHTML = results.map((p, i) =>
    `<div class="result-item" data-id="${p.id}" data-idx="${i}" tabindex="-1">
      <span class="result-name">${highlightMatch(p.name, query)}</span>
      <span class="result-cat">${p.cat}</span>
    </div>`
  ).join('');
  container.style.display = '';
}

function selectProduct(product) {
  state.selectedProduct = product;
  document.getElementById('entry-product-name').textContent = product.name;
  document.getElementById('qty-input').value = 1;
  document.getElementById('entry-panel').style.display = '';
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('product-search').value = '';
  document.getElementById('search-clear').style.display = 'none';
  document.getElementById('qty-input').focus();
}

/* ──────────────────────────────────────────
   VOICE ORDER
────────────────────────────────────────── */
let recognition = null;
let voiceActive = false;

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast('مرورگر شما از سفارش صوتی پشتیبانی نمی‌کند', 'error'); return; }

  recognition = new SpeechRecognition();
  recognition.lang = 'fa-IR';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  document.getElementById('voice-panel').style.display = '';
  document.getElementById('btn-voice').classList.add('qa-btn--voice-active');
  voiceActive = true;

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript).join('');
    document.getElementById('voice-transcript').textContent = transcript;
    if (e.results[0].isFinal) {
      processVoiceCommand(transcript);
      stopVoice();
    }
  };

  recognition.onerror = (e) => {
    showToast('خطا در تشخیص صدا: ' + e.error, 'error');
    stopVoice();
  };

  recognition.onend = () => { if (voiceActive) stopVoice(); };
  recognition.start();
}

function stopVoice() {
  voiceActive = false;
  if (recognition) { try { recognition.stop(); } catch(e) {} recognition = null; }
  document.getElementById('voice-panel').style.display = 'none';
  document.getElementById('btn-voice').classList.remove('qa-btn--voice-active');
}

function processVoiceCommand(text) {
  // Pattern: "[N] بسته [product]" or "بسته [N] [product]"
  const patterns = [
    /(\S+)\s+بسته\s+(.+)/,
    /بسته\s+(\S+)\s+(.+)/,
    /(\S+)\s+تا\s+(.+)/,
  ];

  let qty = 1;
  let productText = text;

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const numStr = m[1].trim();
      const parsed = parseInt(numStr) || PERSIAN_NUMS[numStr];
      if (parsed) {
        qty = parsed;
        productText = m[2].trim();
        break;
      }
    }
  }

  // Also try Arabic/Persian digits
  const digitMatch = text.match(/([۰-۹\d]+)\s*بسته\s*(.+)/);
  if (digitMatch) {
    qty = parseInt(digitMatch[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    productText = digitMatch[2].trim();
  }

  // Find product
  let found = null;

  // Check aliases first
  for (const [alias, canonical] of Object.entries(VOICE_ALIASES)) {
    if (productText.includes(alias)) {
      found = PRODUCTS.find(p => p.name === canonical);
      if (found) break;
    }
  }

  // Direct name match
  if (!found) {
    found = PRODUCTS.find(p =>
      productText.includes(p.name) ||
      p.name.split(' ').every(w => productText.includes(w))
    );
  }

  // Fuzzy match
  if (!found) {
    const words = productText.split(' ');
    let best = null, bestScore = 0;
    PRODUCTS.forEach(p => {
      const score = words.filter(w => p.name.includes(w)).length;
      if (score > bestScore) { bestScore = score; best = p; }
    });
    if (bestScore >= 1) found = best;
  }

  if (found) {
    addOrUpdateProduct(found.id, qty || 1);
    showToast(`🎤 ${found.name} — ${toPersianNum(qty)} بسته اضافه شد`, 'success');
  } else {
    showToast(`محصولی برای "${productText}" یافت نشد`, 'error');
  }
}

/* ──────────────────────────────────────────
   EXPORT — PNG  (Premium Card Layout)
────────────────────────────────────────── */
function exportPNG() {
  if (state.order.length === 0) { showToast('سفارش خالی است'); return; }

  const scale   = 3;          // retina-quality
  const W       = 680;
  const PAD     = 32;
  const ROW_H   = 48;
  const HDR_H   = 180;        // header + gold bar + meta
  const TBL_HDR = 44;
  const TOTAL_H = 60;
  const FTR_H   = 48;
  const H = HDR_H + TBL_HDR + state.order.length * ROW_H + TOTAL_H + FTR_H;

  const canvas = document.createElement('canvas');
  canvas.width  = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // ── helpers ──
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Page background ──
  ctx.fillStyle = '#F0F2F6';
  ctx.fillRect(0, 0, W, H);

  // ── White card shadow ──
  ctx.shadowColor = 'rgba(0,0,0,0.14)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  roundRect(PAD - 8, PAD - 8, W - (PAD - 8)*2, H - (PAD - 8)*2, 16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const CX = PAD;           // card x
  const CW = W - PAD * 2;  // card width

  // ── Header gradient ──
  const hGrad = ctx.createLinearGradient(CX, 0, CX + CW, 0);
  hGrad.addColorStop(0, '#5C0000');
  hGrad.addColorStop(0.5, '#8B0000');
  hGrad.addColorStop(1, '#B01010');
  roundRect(CX, PAD, CW, 100, 16);
  ctx.fillStyle = hGrad;
  ctx.fill();

  // ── Header: brand name ──
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Tahoma, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('شرکت سوپر کولا', W / 2, PAD + 46);

  // ── Header: subtitle ──
  ctx.font = '13px Tahoma, Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText('فاکتور پیش‌نویس سفارش', W / 2, PAD + 68);

  // ── Header: order number pill ──
  const orderNum = toPersianNum(Date.now()).slice(-6);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(W / 2 - 60, PAD + 76, 120, 22, 11);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '11px Tahoma, Arial';
  ctx.fillText(`شماره: ${orderNum}`, W / 2, PAD + 91);

  // ── Gold accent bar ──
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(CX, PAD + 100, CW, 4);

  // ── Meta strip ──
  const metaY = PAD + 104;
  const metaH = 64;
  ctx.fillStyle = '#FAFBFC';
  ctx.fillRect(CX, metaY, CW, metaH);

  const catLabels = { retail: 'خرده‌فروشی', wholesale: 'عمده‌فروشی', vip: 'VIP' };
  const metas = [
    { label: 'مشتری', val: state.customer.name || '—' },
    { label: 'فروشگاه', val: state.customer.store || '—' },
    { label: 'دسته‌بندی', val: catLabels[state.customer.cat] || '—' },
    { label: 'تاریخ', val: getJalaliDate() },
  ];
  const mW = CW / metas.length;
  metas.forEach((m, i) => {
    const mx = CX + CW - i * mW - mW / 2;
    // divider
    if (i < metas.length - 1) {
      ctx.strokeStyle = '#E2E6EA';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CX + CW - (i + 1) * mW, metaY + 10);
      ctx.lineTo(CX + CW - (i + 1) * mW, metaY + metaH - 10);
      ctx.stroke();
    }
    ctx.fillStyle = '#9AA5B4';
    ctx.font = '10px Tahoma, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, mx, metaY + 22);
    ctx.fillStyle = '#1A1D23';
    ctx.font = 'bold 13px Tahoma, Arial';
    ctx.fillText(m.val, mx, metaY + 44);
  });

  // ── Table header bar ──
  const tblTop = PAD + 104 + metaH;
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(CX, tblTop, CW, TBL_HDR);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Tahoma, Arial';
  ctx.textAlign = 'right';
  ctx.fillText('ردیف', CX + CW - 16, tblTop + 27);
  ctx.textAlign = 'center';
  ctx.fillText('نام محصول', CX + CW / 2 + 30, tblTop + 27);
  ctx.textAlign = 'left';
  ctx.fillText('تعداد بسته', CX + 16, tblTop + 27);

  // ── Table rows ──
  state.order.forEach((item, i) => {
    const ry = tblTop + TBL_HDR + i * ROW_H;
    // alternating row bg
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#F8F9FB';
    ctx.fillRect(CX, ry, CW, ROW_H);

    // row number circle
    ctx.fillStyle = i % 2 === 0 ? '#F0F2F6' : '#E8EBF0';
    ctx.beginPath();
    ctx.arc(CX + CW - 24, ry + ROW_H / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8A94A6';
    ctx.font = 'bold 11px Tahoma, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(toPersianNum(i + 1), CX + CW - 24, ry + ROW_H / 2 + 4);

    // product name
    ctx.fillStyle = '#1A1D23';
    ctx.font = 'bold 14px Tahoma, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, CX + CW / 2 + 20, ry + ROW_H / 2 + 5);

    // qty pill
    const qx = CX + 18;
    const qw = 72; const qh = 28;
    ctx.fillStyle = 'rgba(139,0,0,0.09)';
    roundRect(qx, ry + (ROW_H - qh) / 2, qw, qh, 14);
    ctx.fill();
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 14px Tahoma, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(toPersianNum(item.qty), qx + qw / 2, ry + ROW_H / 2 + 5);

    // row separator
    ctx.strokeStyle = '#EAECEF';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(CX + 12, ry + ROW_H - 0.5);
    ctx.lineTo(CX + CW - 12, ry + ROW_H - 0.5);
    ctx.stroke();
  });

  // ── Total bar ──
  const totalY = tblTop + TBL_HDR + state.order.length * ROW_H;
  const totalC = state.order.reduce((s, i) => s + i.qty, 0);

  // gold-left border accent
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(CX, totalY, 4, TOTAL_H);

  ctx.fillStyle = '#F5F7FA';
  ctx.fillRect(CX + 4, totalY, CW - 4, TOTAL_H);

  // total label
  ctx.fillStyle = '#5A6475';
  ctx.font = '12px Tahoma, Arial';
  ctx.textAlign = 'right';
  ctx.fillText('جمع کل سفارش:', CX + CW - 16, totalY + 24);
  ctx.fillStyle = '#8A94A6';
  ctx.font = '11px Tahoma, Arial';
  ctx.fillText(`${toPersianNum(state.order.length)} قلم`, CX + CW - 16, totalY + 44);

  // total value
  ctx.fillStyle = '#8B0000';
  ctx.font = 'bold 26px Tahoma, Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`${toPersianNum(totalC)}`, CX + 20, totalY + 30);
  ctx.fillStyle = '#5A6475';
  ctx.font = '12px Tahoma, Arial';
  ctx.fillText('بسته', CX + 20, totalY + 47);

  // ── Footer ──
  const ftrY = totalY + TOTAL_H;
  // thin gold line
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(CX, ftrY, CW, 1);

  ctx.fillStyle = '#B8C0CC';
  ctx.font = '11px Tahoma, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`واحد سفارش‌گیری شرکت سوپر کولا  •  ${getJalaliDate()}  •  ${getTimeStr()}`, W / 2, ftrY + 28);

  // ── Download ──
  const link = document.createElement('a');
  link.download = `سفارش-سوپر-کولا-${getJalaliDate().replace(/\//g,'-')}.png`;
  link.href = canvas.toDataURL('image/png', 1);
  link.click();
  showToast('تصویر سفارش دانلود شد', 'success');
}

/* ──────────────────────────────────────────
   PDF PREVIEW MODAL  (in-page, no iframe)
   Flow: preview → print/save PDF  OR  share
────────────────────────────────────────── */
function exportPDF() {
  if (state.order.length === 0) { showToast('سفارش خالی است'); return; }

  const old = document.getElementById('pdf-preview-modal');
  if (old) old.remove();

  const totalC    = state.order.reduce((s, i) => s + i.qty, 0);
  const catLabels = { retail: 'خرده‌فروشی', wholesale: 'عمده‌فروشی', vip: 'VIP' };
  const shareText = buildShareText();
  const enc       = encodeURIComponent(shareText);

  // ── build rows HTML ──
  const rowsHTML = state.order.map((item, i) => `
    <tr class="pv-row">
      <td class="pv-td pv-num">${toPersianNum(i + 1)}</td>
      <td class="pv-td pv-name">${escHtml(item.name)}</td>
      <td class="pv-td pv-qty"><span class="pv-badge">${toPersianNum(item.qty)}</span></td>
    </tr>`).join('');

  // ── overlay ──
  const overlay = document.createElement('div');
  overlay.id = 'pdf-preview-modal';
  overlay.innerHTML = `
    <div class="pvm-backdrop"></div>
    <div class="pvm-shell">

      <!-- TOOLBAR -->
      <div class="pvm-toolbar">
        <div class="pvm-toolbar-brand">
          <span class="pvm-toolbar-icon">📄</span>
          <span class="pvm-toolbar-title">پیش‌نمایش فاکتور</span>
        </div>
        <div class="pvm-toolbar-actions">
          <button class="pvm-btn pvm-btn-print" id="pvb-print">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
            چاپ / ذخیره PDF
          </button>
          <button class="pvm-btn pvm-btn-wa" id="pvb-wa">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
            واتساپ
          </button>
          <button class="pvm-btn pvm-btn-wab" id="pvb-wab">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>
            بیزینس
          </button>
          <button class="pvm-btn pvm-btn-share" id="pvb-share" style="display:none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            اشتراک‌گذاری
          </button>
          <button class="pvm-btn pvm-btn-close" id="pvb-close">✕ بستن</button>
        </div>
      </div>

      <!-- PREVIEW CARD -->
      <div class="pvm-scroll">
        <div class="pvm-card" id="pvm-card">

          <!-- Card header -->
          <div class="pvmc-header">
            <div class="pvmc-logo">🍾</div>
            <div class="pvmc-hdr-text">
              <div class="pvmc-brand">شرکت سوپر کولا</div>
              <div class="pvmc-sub">واحد سفارش‌گیری حرفه‌ای توزیع نوشیدنی</div>
              <div class="pvmc-tag">فاکتور پیش‌نویس سفارش</div>
            </div>
            <div class="pvmc-hdr-num">
              <div class="pvmc-hdr-num-label">شماره سفارش</div>
              <div class="pvmc-hdr-num-val">SC-${toPersianNum(Date.now()).slice(-6)}</div>
            </div>
          </div>

          <!-- Gold stripe -->
          <div class="pvmc-gold"></div>

          <!-- Meta grid -->
          <div class="pvmc-meta">
            <div class="pvmc-meta-item">
              <span class="pvmc-meta-label">نام مشتری</span>
              <span class="pvmc-meta-val">${escHtml(state.customer.name || '—')}</span>
            </div>
            <div class="pvmc-meta-item">
              <span class="pvmc-meta-label">نام فروشگاه</span>
              <span class="pvmc-meta-val">${escHtml(state.customer.store || '—')}</span>
            </div>
            <div class="pvmc-meta-item">
              <span class="pvmc-meta-label">دسته‌بندی</span>
              <span class="pvmc-meta-val pvmc-cat">${catLabels[state.customer.cat] || '—'}</span>
            </div>
            <div class="pvmc-meta-item">
              <span class="pvmc-meta-label">تاریخ صدور</span>
              <span class="pvmc-meta-val">${getJalaliDate()}</span>
            </div>
          </div>

          <!-- Table -->
          <table class="pvmc-table">
            <thead>
              <tr>
                <th class="pvmc-th" style="width:48px;text-align:center">#</th>
                <th class="pvmc-th">نام محصول</th>
                <th class="pvmc-th" style="text-align:center;width:120px">تعداد بسته</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
          </table>

          <!-- Total -->
          <div class="pvmc-total">
            <div class="pvmc-total-label">
              جمع کل بسته‌ها
              <span class="pvmc-total-sub">(${toPersianNum(state.order.length)} قلم)</span>
            </div>
            <div class="pvmc-total-val">
              ${toPersianNum(totalC)}<small> بسته</small>
            </div>
          </div>

          <!-- Footer -->
          <div class="pvmc-footer">
            واحد سفارش‌گیری شرکت سوپر کولا &nbsp;•&nbsp; ${getJalaliDate()} &nbsp;•&nbsp; ${getTimeStr()} &nbsp;•&nbsp; صادرشده توسط: نماینده فروش
          </div>

        </div>
      </div>

    </div>`;

  document.body.appendChild(overlay);

  // ── wire buttons ──
  document.getElementById('pvb-close').onclick  = () => overlay.remove();
  document.getElementById('pvb-wa').onclick     = () => window.open(`https://wa.me/?text=${enc}`, '_blank');
  document.getElementById('pvb-wab').onclick    = () => window.open(`https://api.whatsapp.com/send?text=${enc}`, '_blank');
  overlay.querySelector('.pvm-backdrop').onclick = () => overlay.remove();

  // Print: clone card into a fresh print window
  document.getElementById('pvb-print').onclick = () => {
    const printWin = window.open('', '_blank', 'width=900,height=720');
    const cardHTML = document.getElementById('pvm-card').outerHTML;
    printWin.document.write(`<!DOCTYPE html><html lang="fa" dir="rtl"><head>
      <meta charset="UTF-8"/><title>فاکتور سفارش — شرکت سوپر کولا</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Vazirmatn',Tahoma,sans-serif;direction:rtl;background:#fff;padding:20px}
        ${getPrintCSS()}
      </style></head><body>
      ${cardHTML}
      <script>window.addEventListener('load',function(){window.print();})<\/script>
      </body></html>`);
    printWin.document.close();
  };

  // Native share
  if (navigator.share) {
    const sb = document.getElementById('pvb-share');
    sb.style.display = 'flex';
    sb.onclick = () => navigator.share({ title: 'سفارش شرکت سوپر کولا', text: shareText }).catch(() => {});
  }

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('pvm-visible'));
}

/* Returns CSS string for the card used both in modal and print window */
function getPrintCSS() {
  return `
    .pvm-card{background:#fff;max-width:720px;margin:0 auto;border-radius:0;box-shadow:none;overflow:hidden;font-family:'Vazirmatn',Tahoma,sans-serif;direction:rtl}
    .pvmc-header{background:linear-gradient(135deg,#5C0000 0%,#8B0000 55%,#B01010 100%);padding:28px 32px 24px;display:flex;align-items:center;gap:18px}
    .pvmc-logo{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(212,175,55,.55);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0}
    .pvmc-hdr-text{flex:1}
    .pvmc-brand{font-size:24px;font-weight:800;color:#fff;letter-spacing:-.5px;line-height:1.2}
    .pvmc-sub{font-size:12px;color:rgba(255,255,255,.65);margin-top:3px}
    .pvmc-tag{display:inline-block;margin-top:8px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.45);color:#F5D060;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px}
    .pvmc-hdr-num{text-align:left;flex-shrink:0}
    .pvmc-hdr-num-label{font-size:10px;color:rgba(255,255,255,.5);margin-bottom:3px}
    .pvmc-hdr-num-val{font-size:18px;font-weight:800;color:#F5D060;letter-spacing:1px}
    .pvmc-gold{height:4px;background:linear-gradient(90deg,#D4AF37,#F5D060,#D4AF37)}
    .pvmc-meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e8eaed}
    .pvmc-meta-item{padding:14px 16px;border-left:1px solid #e8eaed;display:flex;flex-direction:column;gap:4px}
    .pvmc-meta-item:last-child{border-left:none}
    .pvmc-meta-label{font-size:10px;font-weight:700;color:#9AA5B4;letter-spacing:.4px;text-transform:uppercase}
    .pvmc-meta-val{font-size:13px;font-weight:700;color:#1a1d23}
    .pvmc-cat{display:inline-block;background:rgba(139,0,0,.08);color:#8B0000;padding:2px 10px;border-radius:20px;font-size:11px}
    .pvmc-table{width:100%;border-collapse:collapse}
    .pvmc-th{background:#8B0000;padding:11px 16px;color:#fff;font-size:12px;font-weight:700;text-align:right;letter-spacing:.3px}
    .pv-row:nth-child(even) .pv-td{background:#FAFBFC}
    .pv-td{padding:12px 16px;border-bottom:1px solid #F0F2F5;vertical-align:middle;font-size:13px}
    .pv-num{width:48px;font-size:11px;color:#9AA5B4;font-weight:600;text-align:center}
    .pv-name{font-weight:600;color:#1a1d23}
    .pv-qty{width:110px;text-align:center}
    .pv-badge{display:inline-block;background:rgba(139,0,0,.08);color:#8B0000;font-size:14px;font-weight:800;padding:3px 14px;border-radius:20px;min-width:52px;text-align:center}
    .pvmc-total{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#F8F9FB;border-top:2px solid #D4AF37}
    .pvmc-total-label{font-size:13px;font-weight:700;color:#5A6475}
    .pvmc-total-sub{font-size:11px;color:#9AA5B4;margin-right:6px}
    .pvmc-total-val{font-size:24px;font-weight:800;color:#8B0000}
    .pvmc-total-val small{font-size:12px;font-weight:600;color:#5A6475;margin-right:3px}
    .pvmc-footer{text-align:center;padding:12px 20px;background:#fff;border-top:1px solid #F0F2F5;font-size:11px;color:#B0BAC8}
    @media print{@page{size:A4;margin:12mm}.pvm-card{max-width:100%}}
  `;
}

/* ──────────────────────────────────────────
   PDF HTML CONTENT BUILDER (shared)  [kept for legacy]
────────────────────────────────────────── */
function buildPDFHTML(forPrint = false) {
  const totalC = state.order.reduce((s, i) => s + i.qty, 0);
  const catLabels = { retail: 'خرده‌فروشی', wholesale: 'عمده‌فروشی', vip: 'VIP' };
  const rows = state.order.map((item, i) => `
    <tr>
      <td class="td-num">${toPersianNum(i + 1)}</td>
      <td class="td-name">${escHtml(item.name)}</td>
      <td class="td-qty"><span class="qty-badge">${toPersianNum(item.qty)}</span></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>فاکتور سفارش — شرکت سوپر کولا</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'Vazirmatn',Tahoma,sans-serif;
    direction:rtl;
    background:${forPrint ? '#fff' : '#E8EBF0'};
    color:#1a1d23;
    ${forPrint ? 'padding:0' : 'padding:32px 20px 60px'}
  }
  /* ── Card ── */
  .card{
    background:#fff;
    ${forPrint ? '' : 'max-width:720px;margin:0 auto;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.14);overflow:hidden;'}
  }
  /* ── Header ── */
  .hdr{
    background:linear-gradient(135deg,#5C0000 0%,#8B0000 55%,#B01010 100%);
    padding:32px 36px 28px;
    display:flex;align-items:center;gap:20px;
  }
  .hdr-logo{
    width:64px;height:64px;border-radius:50%;
    background:rgba(255,255,255,.12);
    border:2px solid rgba(212,175,55,.6);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
  }
  .hdr-logo span{font-size:26px;line-height:1}
  .hdr-text{flex:1}
  .hdr-title{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;line-height:1.1}
  .hdr-sub{font-size:13px;color:rgba(255,255,255,.65);margin-top:4px}
  .hdr-badge{
    background:rgba(212,175,55,.2);
    border:1px solid rgba(212,175,55,.5);
    color:#F5D060;
    font-size:11px;font-weight:700;
    padding:4px 14px;border-radius:20px;
    margin-top:8px;display:inline-block;
  }
  .hdr-num{
    text-align:left;
    flex-shrink:0;
  }
  .hdr-num-val{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:2px}
  .hdr-num-code{font-size:18px;font-weight:800;color:#F5D060;letter-spacing:1px}
  /* ── Gold stripe ── */
  .gold-stripe{height:4px;background:linear-gradient(90deg,#D4AF37,#F5D060,#D4AF37)}
  /* ── Meta grid ── */
  .meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #e8eaed}
  .meta-item{
    padding:16px 18px;
    border-left:1px solid #e8eaed;
    display:flex;flex-direction:column;gap:4px;
  }
  .meta-item:last-child{border-left:none}
  .meta-label{font-size:10px;font-weight:700;color:#9AA5B4;text-transform:uppercase;letter-spacing:.5px}
  .meta-val{font-size:14px;font-weight:700;color:#1a1d23}
  .meta-val.cat-pill{
    display:inline-block;
    background:rgba(139,0,0,.08);
    color:#8B0000;
    padding:2px 10px;border-radius:20px;
    font-size:12px;
  }
  /* ── Table ── */
  .tbl-wrap{padding:0}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#8B0000}
  thead th{
    padding:12px 18px;
    color:#fff;font-size:12px;font-weight:700;
    text-align:right;letter-spacing:.3px;
  }
  thead th:last-child{text-align:center}
  tbody tr:nth-child(even) td{background:#FAFBFC}
  tbody tr:hover td{background:#FFF5F5}
  td{padding:13px 18px;border-bottom:1px solid #F0F2F5;vertical-align:middle}
  .td-num{width:48px;font-size:12px;color:#9AA5B4;font-weight:600;text-align:center}
  .td-name{font-size:14px;font-weight:600;color:#1a1d23}
  .td-qty{width:100px;text-align:center}
  .qty-badge{
    display:inline-block;
    background:rgba(139,0,0,.08);
    color:#8B0000;
    font-size:15px;font-weight:800;
    padding:4px 16px;border-radius:20px;
    min-width:56px;text-align:center;
  }
  /* ── Total ── */
  .total{
    display:flex;align-items:center;justify-content:space-between;
    padding:18px 24px;
    background:#F8F9FB;
    border-top:2px solid #D4AF37;
  }
  .total-label{font-size:13px;color:#5A6475;font-weight:600}
  .total-label span{font-size:12px;color:#9AA5B4;margin-right:8px}
  .total-val{font-size:24px;font-weight:800;color:#8B0000}
  .total-val small{font-size:13px;font-weight:600;color:#5A6475;margin-right:4px}
  /* ── Footer ── */
  .ftr{
    text-align:center;padding:14px 20px;
    background:#fff;
    border-top:1px solid #F0F2F5;
    font-size:11px;color:#B0BAC8;
  }
  /* ── Action bar (screen only) ── */
  .action-bar{
    display:${forPrint ? 'none' : 'flex'};
    gap:10px;padding:20px 24px;
    background:#fff;
    border-top:1px solid #F0F2F5;
    flex-wrap:wrap;
  }
  .ab-btn{
    display:flex;align-items:center;gap:8px;
    padding:12px 22px;border-radius:10px;
    font-family:inherit;font-size:.88rem;font-weight:700;
    cursor:pointer;border:none;transition:all .15s ease;
    flex:1;justify-content:center;min-width:130px;
  }
  .ab-btn-print{background:#8B0000;color:#fff;box-shadow:0 4px 14px rgba(139,0,0,.3)}
  .ab-btn-print:hover{background:#A01010;transform:translateY(-1px)}
  .ab-btn-wa{background:#25D366;color:#fff;box-shadow:0 4px 14px rgba(37,211,102,.3)}
  .ab-btn-wa:hover{background:#20BA5A;transform:translateY(-1px)}
  .ab-btn-wab{background:#075E54;color:#fff;box-shadow:0 4px 14px rgba(7,94,84,.3)}
  .ab-btn-wab:hover{background:#064D45;transform:translateY(-1px)}
  .ab-btn-share{background:#3B82F6;color:#fff;box-shadow:0 4px 14px rgba(59,130,246,.3)}
  .ab-btn-share:hover{background:#2563EB;transform:translateY(-1px)}
  .ab-btn-close{background:#F0F2F5;color:#5A6475;border:1px solid #E2E6EA}
  .ab-btn-close:hover{background:#E2E6EA}
  @media print{
    body{background:#fff!important;padding:0!important}
    .card{border-radius:0!important;box-shadow:none!important}
    .action-bar{display:none!important}
    @page{size:A4;margin:12mm}
  }
</style>
</head>
<body>
<div class="card">

  <div class="hdr">
    <div class="hdr-logo"><span>🍾</span></div>
    <div class="hdr-text">
      <div class="hdr-title">شرکت سوپر کولا</div>
      <div class="hdr-sub">واحد سفارش‌گیری حرفه‌ای توزیع نوشیدنی</div>
      <div class="hdr-badge">فاکتور پیش‌نویس سفارش</div>
    </div>
    <div class="hdr-num">
      <div class="hdr-num-val">شماره سفارش</div>
      <div class="hdr-num-code">SC-${toPersianNum(Date.now()).slice(-6)}</div>
    </div>
  </div>

  <div class="gold-stripe"></div>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">نام مشتری</span>
      <span class="meta-val">${escHtml(state.customer.name || '—')}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">نام فروشگاه</span>
      <span class="meta-val">${escHtml(state.customer.store || '—')}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">دسته‌بندی</span>
      <span class="meta-val cat-pill">${catLabels[state.customer.cat] || '—'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">تاریخ صدور</span>
      <span class="meta-val">${getJalaliDate()}</span>
    </div>
  </div>

  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:48px;text-align:center">#</th>
          <th>نام محصول</th>
          <th style="text-align:center;width:110px">تعداد بسته</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="total">
    <div class="total-label">
      جمع کل بسته ها
      <span>(${toPersianNum(state.order.length)} قلم)</span>
    </div>
    <div class="total-val">
      ${toPersianNum(totalC)}
      <small>بسته</small>
    </div>
  </div>

  <div class="action-bar" id="ab">
    <button class="ab-btn ab-btn-print" onclick="window.print()">🖨️ چاپ / ذخیره PDF</button>
    <button class="ab-btn ab-btn-wa"  id="ab-wa">💬 واتساپ</button>
    <button class="ab-btn ab-btn-wab" id="ab-wab">🏢 واتساپ بیزینس</button>
    <button class="ab-btn ab-btn-share" id="ab-share" style="display:none">📤 اشتراک‌گذاری</button>
    <button class="ab-btn ab-btn-close" onclick="window.close()">✕ بستن</button>
  </div>

  <div class="ftr">
    واحد سفارش‌گیری شرکت سوپر کولا &nbsp;•&nbsp; ${getJalaliDate()} &nbsp;•&nbsp; ${getTimeStr()} &nbsp;•&nbsp; صادرشده توسط: نماینده فروش
  </div>

</div>
<script>
  (function(){
    var shareText = ${JSON.stringify(buildShareText())};
    var enc = encodeURIComponent(shareText);

    document.getElementById('ab-wa').onclick = function(){
      window.open('https://wa.me/?text=' + enc, '_blank');
    };
    document.getElementById('ab-wab').onclick = function(){
      window.open('https://api.whatsapp.com/send?text=' + enc, '_blank');
    };

    var shareBtn = document.getElementById('ab-share');
    if (navigator.share) {
      shareBtn.style.display = '';
      shareBtn.onclick = function(){
        navigator.share({ title: 'سفارش شرکت سوپر کولا', text: shareText })
          .catch(function(){});
      };
    }
  })();
<\/script>
</body>
</html>`;
}

/* ──────────────────────────────────────────
   SHARE TEXT
────────────────────────────────────────── */
function buildShareText() {
  const lines = [
    '🍾 *شرکت سوپر کولا*',
    `👤 مشتری: ${state.customer.name || '—'}`,
    `🏪 فروشگاه: ${state.customer.store || '—'}`,
    `📅 تاریخ: ${getJalaliDate()}`,
    '─────────────────',
    ...state.order.map(i => `▪️ ${i.name}: *${toPersianNum(i.qty)} بسته*`),
    '─────────────────',
    `📦 جمع: ${toPersianNum(state.order.reduce((s,i)=>s+i.qty,0))} بسته`,
  ];
  return lines.join('\n');
}

function shareWhatsApp() {
  if (state.order.length === 0) { showToast('سفارش خالی است'); return; }
  showWhatsAppModal();
}

function showWhatsAppModal() {
  // Remove previous if any
  const old = document.getElementById('wa-modal');
  if (old) old.remove();

  const text = encodeURIComponent(buildShareText());
  const waUrl  = `https://wa.me/?text=${text}`;
  const wabUrl = `https://api.whatsapp.com/send?text=${text}`;

  const modal = document.createElement('div');
  modal.id = 'wa-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:300;
    background:rgba(0,0,0,0.48);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:20px;
    animation:fade-in .18s ease;
  `;
  modal.innerHTML = `
    <div style="
      background:#fff;border-radius:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.2);
      width:100%;max-width:360px;overflow:hidden;
      animation:modal-in .22s cubic-bezier(.34,1.56,.64,1);
    ">
      <div style="
        background:linear-gradient(135deg,#075E54,#128C7E);
        padding:18px 20px;
        display:flex;align-items:center;gap:10px;
      ">
        <span style="font-size:1.5rem">📲</span>
        <div>
          <div style="color:#fff;font-weight:700;font-size:.95rem;font-family:Vazirmatn,Tahoma,sans-serif">ارسال از طریق واتساپ</div>
          <div style="color:rgba(255,255,255,.7);font-size:.72rem;font-family:Vazirmatn,Tahoma,sans-serif">نسخه مورد نظر را انتخاب کنید</div>
        </div>
        <button id="wa-modal-close" style="margin-right:auto;width:28px;height:28px;background:rgba(255,255,255,.15);border:none;border-radius:50%;color:#fff;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:10px;font-family:Vazirmatn,Tahoma,sans-serif">
        <a href="${waUrl}" target="_blank" id="wa-normal" style="
          display:flex;align-items:center;gap:14px;
          padding:16px 18px;background:#F0FDF4;
          border:1.5px solid #BBF7D0;border-radius:12px;
          text-decoration:none;color:#14532D;
          font-weight:700;font-size:.9rem;
          transition:all .15s ease;
        ">
          <span style="font-size:1.8rem">💬</span>
          <div>
            <div style="font-size:.9rem;font-weight:700;color:#14532D">واتساپ معمولی</div>
            <div style="font-size:.72rem;color:#4ADE80;font-weight:500">WhatsApp</div>
          </div>
          <span style="margin-right:auto;font-size:.8rem;opacity:.5">←</span>
        </a>
        <a href="${wabUrl}" target="_blank" id="wa-business" style="
          display:flex;align-items:center;gap:14px;
          padding:16px 18px;background:#F0F9FF;
          border:1.5px solid #BAE6FD;border-radius:12px;
          text-decoration:none;color:#0C4A6E;
          font-weight:700;font-size:.9rem;
          transition:all .15s ease;
        ">
          <span style="font-size:1.8rem">🏢</span>
          <div>
            <div style="font-size:.9rem;font-weight:700;color:#0C4A6E">واتساپ بیزینس</div>
            <div style="font-size:.72rem;color:#38BDF8;font-weight:500">WhatsApp Business</div>
          </div>
          <span style="margin-right:auto;font-size:.8rem;opacity:.5">←</span>
        </a>
        <p style="font-size:.72rem;color:#9AA5B4;text-align:center;margin-top:4px;direction:rtl">
          مرورگر به‌صورت خودکار نسخه نصب‌شده را باز می‌کند
        </p>
      </div>
    </div>`;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById('wa-modal-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  // Close after opening link
  ['wa-normal','wa-business'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => setTimeout(close, 300));
  });
}

/* ──────────────────────────────────────────
   TELEGRAM — Bot API  (sendPhoto + caption)
────────────────────────────────────────── */

function getTgConfig() {
  return {
    token: "8920729880:AAFL1tMR9_RDm0YZNKr6Hxfe7x8tTNtgCyY",
    chatId: "@SuperColaOrder",
    note: ""
  };
}
function saveTgConfig(cfg) {
  localStorage.setItem('supercola_tg', JSON.stringify(cfg));
}

/* Entry-point called by toolbar button */
function shareTelegram() {
  if (state.order.length === 0) { showToast('سفارش خالی است'); return; }
  const cfg = getTgConfig();
  if (!cfg || !cfg.token || !cfg.chatId) {
    openTgSetupModal(() => openTgSendModal());
  } else {
    openTgSendModal();
  }
}

/* ── SETUP MODAL ── */
function openTgSetupModal(onSaved) {
  const old = document.getElementById('tg-setup-modal');
  if (old) old.remove();
  const cfg = getTgConfig() || {};

  const m = document.createElement('div');
  m.id = 'tg-setup-modal';
  m.className = 'tg-modal-overlay';
  m.innerHTML = `
    <div class="tg-modal-box">
      <div class="tg-modal-hdr tg-hdr-blue">
        <div class="tg-modal-hdr-inner">
          <span class="tg-hdr-icon">⚙️</span>
          <div>
            <div class="tg-modal-title">تنظیمات ربات تلگرام</div>
            <div class="tg-modal-sub">یک‌بار تنظیم کنید، همیشه استفاده کنید</div>
          </div>
        </div>
        <button class="tg-close-btn" id="tg-setup-close">✕</button>
      </div>
      <div class="tg-modal-body">

        <div class="tg-info-box">
          <div class="tg-info-title">📋 راهنمای سریع</div>
          <ol class="tg-info-steps">
            <li>در تلگرام <strong>@BotFather</strong> را جستجو کنید</li>
            <li>دستور <code>/newbot</code> را ارسال کنید و ربات بسازید</li>
            <li><strong>Token</strong> دریافتی را در کادر زیر وارد کنید</li>
            <li>ربات را به کانال/گروه Add کنید و Chat ID را بگیرید</li>
          </ol>
        </div>

        <div class="tg-form-group">
          <label class="tg-label">🔑 Bot Token</label>
          <input id="tg-token" type="text" class="tg-input" dir="ltr"
            placeholder="8920729880:AAFL1tMR9_RDm0YZNKr6Hxfe7x8tTNtgCyY"
            value="${escHtml(cfg.token || '')}" />
          <span class="tg-hint">از @BotFather دریافت می‌شود</span>
        </div>

        <div class="tg-form-group">
          <label class="tg-label">💬 Chat ID (ربات یا کانال)</label>
          <input id="tg-chatid" type="text" class="tg-input" dir="ltr"
            placeholder="@SuperColaOrder"
            value="${escHtml(cfg.chatId || '')}" />
          <span class="tg-hint">برای کانال عمومی: <code>@نام_کانال</code> &nbsp;|&nbsp; برای گروه/کانال خصوصی: عدد منفی</span>
        </div>

        <div class="tg-form-group">
          <label class="tg-label">📝 پیام اضافی (اختیاری)</label>
          <input id="tg-note" type="text" class="tg-input"
            placeholder="مثال: لطفاً فوری پردازش شود"
            value="${escHtml(cfg.note || '')}" />
        </div>

      </div>
      <div class="tg-modal-footer">
        <button class="tg-btn tg-btn-secondary" id="tg-setup-cancel">انصراف</button>
        <button class="tg-btn tg-btn-test" id="tg-setup-test">🔍 تست اتصال</button>
        <button class="tg-btn tg-btn-primary" id="tg-setup-save">ذخیره و ادامه ←</button>
      </div>
    </div>`;

  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('tg-visible'));

  const close = () => { m.classList.remove('tg-visible'); setTimeout(() => m.remove(), 220); };
  document.getElementById('tg-setup-close').onclick  = close;
  document.getElementById('tg-setup-cancel').onclick = close;
  m.addEventListener('click', e => { if (e.target === m) close(); });

  document.getElementById('tg-setup-test').onclick = async () => {
    const token  = document.getElementById('tg-token').value.trim();
    const chatId = document.getElementById('tg-chatid').value.trim();
    if (!token || !chatId) { showToast('ابتدا Token و Chat ID را وارد کنید', 'warning'); return; }
    const btn = document.getElementById('tg-setup-test');
    btn.textContent = '⏳ در حال بررسی...'; btn.disabled = true;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '✅ اتصال سوپر کولا برقرار است. ربات آماده دریافت سفارش است.' })
      });
      const d = await r.json();
      if (d.ok) { showToast('✅ اتصال موفق! پیام تست ارسال شد', 'success'); btn.textContent = '✅ موفق'; }
      else       { showToast('خطا: ' + (d.description || 'نامشخص'), 'error');  btn.textContent = '❌ خطا'; }
    } catch(e) { showToast('خطای شبکه: ' + e.message, 'error'); btn.textContent = '❌ خطا'; }
    setTimeout(() => { btn.textContent = '🔍 تست اتصال'; btn.disabled = false; }, 2500);
  };

  document.getElementById('tg-setup-save').onclick = () => {
    const token  = document.getElementById('tg-token').value.trim();
    const chatId = document.getElementById('tg-chatid').value.trim();
    const note   = document.getElementById('tg-note').value.trim();
    if (!token)  { showToast('Bot Token الزامی است', 'warning'); return; }
    if (!chatId) { showToast('Chat ID الزامی است', 'warning'); return; }
    saveTgConfig({ token, chatId, note });
    showToast('تنظیمات تلگرام ذخیره شد', 'success');
    close();
    if (onSaved) setTimeout(onSaved, 280);
  };
}

/* ── SEND MODAL ── */
function openTgSendModal() {
  const old = document.getElementById('tg-send-modal');
  if (old) old.remove();
  const cfg = getTgConfig();
  const totalC = state.order.reduce((s, i) => s + i.qty, 0);
  const catLabel = { retail:'خرده‌فروشی', wholesale:'عمده‌فروشی', vip:'VIP' }[state.customer.cat] || '—';

  // build preview rows for the modal
  const previewRows = state.order.map((item, i) => `
    <div class="tg-prev-row ${i % 2 === 0 ? '' : 'tg-prev-row-alt'}">
      <span class="tg-prev-num">${toPersianNum(i + 1)}</span>
      <span class="tg-prev-name">${escHtml(item.name)}</span>
      <span class="tg-prev-qty">${toPersianNum(item.qty)} بسته</span>
    </div>`).join('');

  const m = document.createElement('div');
  m.id = 'tg-send-modal';
  m.className = 'tg-modal-overlay';
  m.innerHTML = `
    <div class="tg-modal-box tg-modal-box-wide">
      <div class="tg-modal-hdr tg-hdr-teal">
        <div class="tg-modal-hdr-inner">
          <span class="tg-hdr-icon">✈️</span>
          <div>
            <div class="tg-modal-title">ارسال فاکتور به تلگرام</div>
            <div class="tg-modal-sub">${escHtml(cfg.chatId)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="tg-icon-btn" id="tg-send-settings" title="تنظیمات">⚙️</button>
          <button class="tg-close-btn" id="tg-send-close">✕</button>
        </div>
      </div>

      <div class="tg-modal-body">

        <!-- Preview card -->
        <div class="tg-preview-card">
          <div class="tg-preview-hdr">
            <div class="tg-preview-brand">🍾 شرکت سوپر کولا</div>
            <div class="tg-preview-meta">
              <span>👤 ${escHtml(state.customer.name || '—')}</span>
              <span>🏪 ${escHtml(state.customer.store || '—')}</span>
              <span>🗓 ${getJalaliDate()}</span>
              <span class="tg-cat-pill">${catLabel}</span>
            </div>
          </div>
          <div class="tg-preview-rows">${previewRows}</div>
          <div class="tg-preview-total">
            <span>جمع کل:</span>
            <strong>${toPersianNum(totalC)} بسته &nbsp;|&nbsp; ${toPersianNum(state.order.length)} قلم</strong>
          </div>
          ${cfg.note ? `<div class="tg-preview-note">📝 ${escHtml(cfg.note)}</div>` : ''}
        </div>

        <!-- Send options -->
        <div class="tg-send-options">
          <label class="tg-opt-label">نوع ارسال:</label>
          <div class="tg-opts">
            <label class="tg-opt-item">
              <input type="radio" name="tg-send-type" value="photo" checked />
              <span>📸 تصویر فاکتور (برای چاپ)</span>
            </label>
            <label class="tg-opt-item">
              <input type="radio" name="tg-send-type" value="text" />
              <span>📝 متن فرمت‌شده</span>
            </label>
            <label class="tg-opt-item">
              <input type="radio" name="tg-send-type" value="both" />
              <span>📸 + 📝 هر دو</span>
            </label>
          </div>
        </div>

      </div>

      <!-- Status bar (hidden initially) -->
      <div class="tg-status-bar" id="tg-status-bar" style="display:none">
        <div class="tg-status-inner" id="tg-status-inner"></div>
      </div>

      <div class="tg-modal-footer">
        <button class="tg-btn tg-btn-secondary" id="tg-send-cancel">انصراف</button>
        <button class="tg-btn tg-btn-send" id="tg-send-go">
          <span id="tg-send-label">ارسال به تلگرام ✈️</span>
        </button>
      </div>
    </div>`;

  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('tg-visible'));

  const close = () => { m.classList.remove('tg-visible'); setTimeout(() => m.remove(), 220); };
  document.getElementById('tg-send-close').onclick  = close;
  document.getElementById('tg-send-cancel').onclick = close;
  m.addEventListener('click', e => { if (e.target === m) close(); });

  document.getElementById('tg-send-settings').onclick = () => {
    close();
    setTimeout(() => openTgSetupModal(() => openTgSendModal()), 260);
  };

  document.getElementById('tg-send-go').onclick = async () => {
    const sendType = document.querySelector('input[name="tg-send-type"]:checked').value;
    const btn      = document.getElementById('tg-send-go');
    const lbl      = document.getElementById('tg-send-label');
    const statusBar = document.getElementById('tg-status-bar');
    const statusInner = document.getElementById('tg-status-inner');

    btn.disabled = true;
    lbl.textContent = '⏳ در حال ارسال...';
    statusBar.style.display = '';

    const setStatus = (html, type = '') => {
      statusInner.innerHTML = html;
      statusBar.className = 'tg-status-bar' + (type ? ' tg-status-' + type : '');
    };

    try {
      const caption = buildTelegramCaption();

      if (sendType === 'text' || sendType === 'both') {
        setStatus('📝 در حال ارسال متن...', 'progress');
        await sendTelegramText(cfg.token, cfg.chatId, caption);
      }

      if (sendType === 'photo' || sendType === 'both') {
        setStatus('🖼 در حال ساخت تصویر فاکتور...', 'progress');
        const blob = await buildOrderImageBlob();
        setStatus('📤 در حال آپلود تصویر به تلگرام...', 'progress');
        await sendTelegramPhoto(cfg.token, cfg.chatId, blob, sendType === 'photo' ? caption : '');
      }

      setStatus('✅ فاکتور با موفقیت ارسال شد!', 'success');
      lbl.textContent = '✅ ارسال شد';
      state.status = 'ارسال شد';
      renderSummary();
      saveToStorage();
      showToast('✅ فاکتور به تلگرام ارسال شد', 'success');
      setTimeout(close, 1800);

    } catch (err) {
      setStatus('❌ خطا: ' + err.message, 'error');
      lbl.textContent = 'ارسال به تلگرام ✈️';
      btn.disabled = false;
      showToast('خطا در ارسال: ' + err.message, 'error');
    }
  };
}

/* ── BUILD TELEGRAM CAPTION (MarkdownV2) ── */
function buildTelegramCaption() {
  const catLabel = { retail:'خرده‌فروشی', wholesale:'عمده‌فروشی', vip:'VIP' }[state.customer.cat] || '—';
  const totalC   = state.order.reduce((s, i) => s + i.qty, 0);
  const cfg      = getTgConfig() || {};

  const lines = [
    '🍾 *شرکت سوپر کولا*',
    '━━━━━━━━━━━━━━━━━━━━',
    `👤 مشتری: *${state.customer.name || '—'}*`,
    `🏪 فروشگاه: *${state.customer.store || '—'}*`,
    `🏷 دسته: ${catLabel}`,
    `🗓 تاریخ: ${getJalaliDate()}`,
    `🕐 ساعت: ${getTimeStr()}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '*اقلام سفارش:*',
    ...state.order.map((item, i) =>
      `  ${toPersianNum(i + 1)}\\. ${item.name}  ➜  *${toPersianNum(item.qty)} بسته*`
    ),
    '━━━━━━━━━━━━━━━━━━━━',
    `📦 جمع کل: *${toPersianNum(totalC)} بسته*  |  ${toPersianNum(state.order.length)} قلم`,
  ];
  if (cfg.note) lines.push(`📝 یادداشت: _${cfg.note}_`);
  lines.push('', '_ارسال‌شده از واحد سفارش‌گیری شرکت سوپر کولا_');
  return lines.join('\n');
}

/* ── SEND TEXT MESSAGE ── */
async function sendTelegramText(token, chatId, text) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    })
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.description || 'خطای API تلگرام');
}

/* ── SEND PHOTO ── */
async function sendTelegramPhoto(token, chatId, blob, caption) {
  const fd = new FormData();
  fd.append('chat_id', chatId);
  fd.append('photo', blob, 'super-cola-order.png');
  if (caption) { fd.append('caption', caption); fd.append('parse_mode', 'Markdown'); }

  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: fd,
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.description || 'خطای آپلود تصویر');
}

/* ── BUILD PNG BLOB (same premium design as exportPNG) ── */
function buildOrderImageBlob() {
  return new Promise((resolve, reject) => {
    try {
      const scale   = 3;
      const W       = 680, PAD = 32;
      const ROW_H   = 48, HDR_H = 180, TBL_HDR = 44, TOTAL_H = 60, FTR_H = 48;
      const H = HDR_H + TBL_HDR + state.order.length * ROW_H + TOTAL_H + FTR_H;

      const canvas = document.createElement('canvas');
      canvas.width = W * scale; canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
        ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
        ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
        ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
      }

      // BG
      ctx.fillStyle = '#F0F2F6'; ctx.fillRect(0,0,W,H);
      // Card shadow
      ctx.shadowColor='rgba(0,0,0,0.14)'; ctx.shadowBlur=24; ctx.shadowOffsetY=6;
      roundRect(PAD-8,PAD-8,W-(PAD-8)*2,H-(PAD-8)*2,16);
      ctx.fillStyle='#ffffff'; ctx.fill();
      ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;

      const CX=PAD, CW=W-PAD*2;

      // Header gradient
      const hGrad=ctx.createLinearGradient(CX,0,CX+CW,0);
      hGrad.addColorStop(0,'#5C0000'); hGrad.addColorStop(.5,'#8B0000'); hGrad.addColorStop(1,'#B01010');
      roundRect(CX,PAD,CW,100,16); ctx.fillStyle=hGrad; ctx.fill();

      ctx.fillStyle='#ffffff'; ctx.font='bold 30px Tahoma,Arial'; ctx.textAlign='center';
      ctx.fillText('شرکت سوپر کولا',W/2,PAD+46);
      ctx.font='13px Tahoma,Arial'; ctx.fillStyle='rgba(255,255,255,0.72)';
      ctx.fillText('فاکتور پیش‌نویس سفارش',W/2,PAD+68);

      // Gold bar
      ctx.fillStyle='#D4AF37'; ctx.fillRect(CX,PAD+100,CW,4);

      // Meta strip
      const metaY=PAD+104, metaH=64;
      ctx.fillStyle='#FAFBFC'; ctx.fillRect(CX,metaY,CW,metaH);
      const catLabels={retail:'خرده‌فروشی',wholesale:'عمده‌فروشی',vip:'VIP'};
      const metas=[
        {label:'مشتری',val:state.customer.name||'—'},
        {label:'فروشگاه',val:state.customer.store||'—'},
        {label:'دسته',val:catLabels[state.customer.cat]||'—'},
        {label:'تاریخ',val:getJalaliDate()},
      ];
      const mW=CW/metas.length;
      metas.forEach((mt,i)=>{
        const mx=CX+CW-i*mW-mW/2;
        if(i<metas.length-1){
          ctx.strokeStyle='#E2E6EA'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(CX+CW-(i+1)*mW,metaY+10); ctx.lineTo(CX+CW-(i+1)*mW,metaY+metaH-10); ctx.stroke();
        }
        ctx.fillStyle='#9AA5B4'; ctx.font='10px Tahoma,Arial'; ctx.textAlign='center';
        ctx.fillText(mt.label,mx,metaY+22);
        ctx.fillStyle='#1A1D23'; ctx.font='bold 13px Tahoma,Arial';
        ctx.fillText(mt.val,mx,metaY+44);
      });

      // Table header
      const tblTop=PAD+104+metaH;
      ctx.fillStyle='#8B0000'; ctx.fillRect(CX,tblTop,CW,TBL_HDR);
      ctx.fillStyle='#ffffff'; ctx.font='bold 12px Tahoma,Arial';
      ctx.textAlign='right';  ctx.fillText('ردیف',CX+CW-16,tblTop+27);
      ctx.textAlign='center'; ctx.fillText('نام محصول',CX+CW/2+30,tblTop+27);
      ctx.textAlign='left';   ctx.fillText('تعداد بسته',CX+16,tblTop+27);

      // Rows
      state.order.forEach((item,i)=>{
        const ry=tblTop+TBL_HDR+i*ROW_H;
        ctx.fillStyle=i%2===0?'#ffffff':'#F8F9FB'; ctx.fillRect(CX,ry,CW,ROW_H);
        ctx.fillStyle=i%2===0?'#F0F2F6':'#E8EBF0';
        ctx.beginPath(); ctx.arc(CX+CW-24,ry+ROW_H/2,13,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#8A94A6'; ctx.font='bold 11px Tahoma,Arial'; ctx.textAlign='center';
        ctx.fillText(toPersianNum(i+1),CX+CW-24,ry+ROW_H/2+4);
        ctx.fillStyle='#1A1D23'; ctx.font='bold 14px Tahoma,Arial'; ctx.textAlign='center';
        ctx.fillText(item.name,CX+CW/2+20,ry+ROW_H/2+5);
        const qx=CX+18,qw=80,qh=28;
        ctx.fillStyle='rgba(139,0,0,0.09)';
        roundRect(qx,ry+(ROW_H-qh)/2,qw,qh,14); ctx.fill();
        ctx.fillStyle='#8B0000'; ctx.font='bold 14px Tahoma,Arial'; ctx.textAlign='center';
        ctx.fillText(toPersianNum(item.qty)+' بسته',qx+qw/2,ry+ROW_H/2+5);
        ctx.strokeStyle='#EAECEF'; ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(CX+12,ry+ROW_H-0.5); ctx.lineTo(CX+CW-12,ry+ROW_H-0.5); ctx.stroke();
      });

      // Total bar
      const totalY=tblTop+TBL_HDR+state.order.length*ROW_H;
      const totalC=state.order.reduce((s,i)=>s+i.qty,0);
      ctx.fillStyle='#D4AF37'; ctx.fillRect(CX,totalY,4,TOTAL_H);
      ctx.fillStyle='#F5F7FA'; ctx.fillRect(CX+4,totalY,CW-4,TOTAL_H);
      ctx.fillStyle='#5A6475'; ctx.font='12px Tahoma,Arial'; ctx.textAlign='right';
      ctx.fillText('جمع کل سفارش:',CX+CW-16,totalY+24);
      ctx.fillStyle='#9AA5B4'; ctx.font='11px Tahoma,Arial';
      ctx.fillText(toPersianNum(state.order.length)+' قلم',CX+CW-16,totalY+44);
      ctx.fillStyle='#8B0000'; ctx.font='bold 26px Tahoma,Arial'; ctx.textAlign='left';
      ctx.fillText(toPersianNum(totalC),CX+20,totalY+30);
      ctx.fillStyle='#5A6475'; ctx.font='12px Tahoma,Arial';
      ctx.fillText('بسته',CX+20,totalY+47);

      // Footer
      const ftrY=totalY+TOTAL_H;
      ctx.fillStyle='#D4AF37'; ctx.fillRect(CX,ftrY,CW,1);
      ctx.fillStyle='#B8C0CC'; ctx.font='11px Tahoma,Arial'; ctx.textAlign='center';
      ctx.fillText(`واحد سفارش‌گیری شرکت سوپر کولا  •  ${getJalaliDate()}  •  ${getTimeStr()}`,W/2,ftrY+28);

      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('خطا در ساخت تصویر'));
      }, 'image/png', 1);

    } catch(e) { reject(e); }
  });
}

/* ──────────────────────────────────────────
   SAVE DRAFT — also persists as "previous order" for repeat
────────────────────────────────────────── */
function saveDraft() {
  if (state.order.length === 0) { showToast('سفارش خالی است — چیزی برای ذخیره وجود ندارد', 'warning'); return; }
  state.status = 'ذخیره شد';
  state.lastModified = Date.now();
  // Save as previous order so "repeat" works
  savePreviousOrder();
  saveToStorage();
  renderSummary();
  renderHeader();
  showToast(`✅ ${toPersianNum(state.order.length)} قلم سفارش ذخیره شد — دکمه «تکرار سفارش» فعال است`, 'success');
}

/* ──────────────────────────────────────────
   REPEAT PREVIOUS ORDER
────────────────────────────────────────── */
function repeatPreviousOrder() {
  const prev = loadPreviousOrder();
  if (!prev || prev.length === 0) { showToast('سفارش قبلی وجود ندارد', 'warning'); return; }
  state.order = prev.map(i => ({ ...i }));
  state.lastModified = Date.now();
  state.status = 'پیش‌نویس';
  renderAll();
  saveToStorage();
  showToast(`🔄 ${toPersianNum(prev.length)} قلم از سفارش قبلی بارگذاری شد`, 'success');
}

/* ──────────────────────────────────────────
   SETUP MODAL
────────────────────────────────────────── */
function openSetup() {
  document.getElementById('input-customer').value = state.customer.name;
  document.getElementById('input-store').value = state.customer.store;
  const cats = document.querySelectorAll('input[name="cat"]');
  cats.forEach(r => { r.checked = (r.value === state.customer.cat); });
  document.getElementById('setup-modal').style.display = '';
  setTimeout(() => document.getElementById('input-customer').focus(), 100);
}

function closeSetup() {
  document.getElementById('setup-modal').style.display = 'none';
}

function saveSetup() {
  const name = document.getElementById('input-customer').value.trim();
  const store = document.getElementById('input-store').value.trim();
  const cat = document.querySelector('input[name="cat"]:checked')?.value || 'retail';
  if (!name || !store) { showToast('لطفاً نام مشتری و فروشگاه را وارد کنید', 'warning'); return; }
  state.customer = { name, store, cat };
  closeSetup();
  renderHeader();
  saveToStorage();
  showToast('اطلاعات مشتری ذخیره شد ✓', 'success');
}

/* ──────────────────────────────────────────
   TOAST
────────────────────────────────────────── */
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' ' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

/* ──────────────────────────────────────────
   UTILITY
────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ──────────────────────────────────────────
   EVENT WIRING
────────────────────────────────────────── */
function initEvents() {
  // Setup modal
  document.getElementById('btn-open-setup').addEventListener('click', openSetup);
  document.getElementById('modal-close').addEventListener('click', closeSetup);
  document.getElementById('btn-save-setup').addEventListener('click', saveSetup);
  document.getElementById('setup-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSetup();
  });

  // Search
  const searchInput = document.getElementById('product-search');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const q = e.target.value;
    searchClear.style.display = q ? '' : 'none';
    searchTimeout = setTimeout(() => renderSearchResults(q), 80);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.result-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedResult = Math.min(focusedResult + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusedResult));
      items[focusedResult]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedResult = Math.max(focusedResult - 1, 0);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusedResult));
    } else if (e.key === 'Enter' && focusedResult >= 0) {
      const id = items[focusedResult]?.dataset.id;
      if (id) selectProduct(PRODUCTS.find(p => p.id === id));
    } else if (e.key === 'Escape') {
      document.getElementById('search-results').style.display = 'none';
    }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('entry-panel').style.display = 'none';
    state.selectedProduct = null;
    searchInput.focus();
  });

  // Search result clicks
  document.getElementById('search-results').addEventListener('click', (e) => {
    const item = e.target.closest('.result-item');
    if (!item) return;
    const product = PRODUCTS.find(p => p.id === item.dataset.id);
    if (product) selectProduct(product);
  });

  // Click outside search
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      document.getElementById('search-results').style.display = 'none';
    }
  });

  // Qty controls (entry panel)
  document.getElementById('qty-dec').addEventListener('click', () => {
    const inp = document.getElementById('qty-input');
    inp.value = Math.max(1, parseInt(inp.value) - 1);
  });
  document.getElementById('qty-inc').addEventListener('click', () => {
    const inp = document.getElementById('qty-input');
    inp.value = Math.min(9999, parseInt(inp.value) + 1);
  });
  document.getElementById('qty-input').addEventListener('input', (e) => {
    if (parseInt(e.target.value) < 1) e.target.value = 1;
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('qty-input').value = parseInt(btn.dataset.val);
    });
  });

  // Add to order
  document.getElementById('btn-add-order').addEventListener('click', () => {
    if (!state.selectedProduct) return;
    const qty = Math.max(1, parseInt(document.getElementById('qty-input').value) || 1);
    addOrUpdateProduct(state.selectedProduct.id, qty);
    document.getElementById('entry-panel').style.display = 'none';
    state.selectedProduct = null;
    document.getElementById('product-search').focus();
  });

  // Order table events (delegated)
  document.getElementById('order-tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    const action = btn.dataset.action;
    if (action === 'del') removeItem(idx);
    else if (action === 'inc') changeQty(idx, 1);
    else if (action === 'dec') changeQty(idx, -1);
  });

  // Quick actions
  document.getElementById('btn-repeat').addEventListener('click', repeatPreviousOrder);
  document.getElementById('btn-voice').addEventListener('click', () => {
    if (voiceActive) stopVoice();
    else startVoice();
  });
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
  document.getElementById('btn-export-png').addEventListener('click', exportPNG);
  document.getElementById('btn-whatsapp').addEventListener('click', shareWhatsApp);
  document.getElementById('btn-telegram').addEventListener('click', shareTelegram);
  document.getElementById('btn-save').addEventListener('click', saveDraft);
  document.getElementById('btn-clear-order').addEventListener('click', clearOrder);
  document.getElementById('btn-voice-stop').addEventListener('click', stopVoice);

  // Modal keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSetup();
  });

  // Setup form enter key
  document.getElementById('input-store').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveSetup();
  });
}

/* ──────────────────────────────────────────
   PWA — SERVICE WORKER & INSTALL
────────────────────────────────────────── */
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW failed:', err));
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-banner').style.display = '';
  });

  document.getElementById('btn-install').addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById('install-banner').style.display = 'none';
    });
  });

  document.getElementById('btn-install-dismiss').addEventListener('click', () => {
    document.getElementById('install-banner').style.display = 'none';
  });
}

/* ──────────────────────────────────────────
   AUTO-SAVE INTERVAL
────────────────────────────────────────── */
function initAutoSave() {
  setInterval(() => {
    if (state.order.length > 0) {
      saveToStorage();
    }
  }, 30000); // every 30s
}

/* ──────────────────────────────────────────
   BOOT
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderAll();
  initEvents();
  initPWA();
  initAutoSave();

  // Show setup if no customer info
  if (!state.customer.name) {
    setTimeout(openSetup, 600);
  }

  // Live clock update
  setInterval(() => {
    document.getElementById('display-date').textContent = getJalaliDate();
  }, 60000);
});
