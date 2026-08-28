/* ==========================================================================
   math-canvas.js — 教材頁共用的 Canvas 算式繪圖引擎

   由 1-3-3「應用問題」的 canvas.js 抽出（原第 2 節 Helper functions），
   供各教材頁的 canvas.js 共用；請在教材頁的 canvas.js 之前載入：

     <script src="../math-canvas.js"></script>
     <script src="canvas.js"></script>

   本檔只放「跟課程主題無關」的通用工具：
     - 算式元件與排版：T／IT／VF／FR／PW／GRP／SEQ、measure／drawIt／drawExpr
     - 基本繪圖：roundRect／drawPanel／drawChip／drawTitle／drawNote／drawArrow
     - 數值與字串：gcd／clamp／reduce／texFrac／numStr／coefTex／signed
     - 互動與版面：canvasPos／bindPickGroup／wrapText／wrapFeedback／typeset

   各節的**主題配色**（C_BRASS、C_TEAL 之類）與主題繪圖（軟木板、天平…）
   留在該節自己的 canvas.js，不要放進本檔。
   ========================================================================== */

const FONT = '"Outfit", "Noto Sans TC", sans-serif';

const OK_COLOR = '#34d399';
const NO_COLOR = '#fb7185';
const MUTED = '#94a3b8';
const INK = '#cbd5e1';
const DIM = '#64748b';

// canvas 上自己畫的指數要留的字距（agents.md 開發約束 11）
const POW_KERN = 0.17;

function f(weight, size) {
  return `${weight} ${size}px ${FONT}`;
}

// 數學變數要斜體，才跟頁面上的 MathJax 一致
function fi(weight, size) {
  return `italic ${weight} ${size}px ${FONT}`;
}

function wrapFeedback(html) {
  return `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">${html}</div>`;
}

function typeset(nodes) {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise(nodes).catch(err => console.log(err));
  }
}

// 圓角矩形（部分舊版瀏覽器沒有 ctx.roundRect）
function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = a % b; a = b; b = t; }
  return a || 1;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 化成最簡分數，負號固定放到分子上
function reduce(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
}

// 產生 MathJax 用的分數字串；分母為 1 時直接寫整數
function texFrac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return String(n);
  if (n < 0) return `-\\frac{${-n}}{${d}}`;
  return `\\frac{${n}}{${d}}`;
}

/* --------------------------------------------------------------------------
   Canvas 上的算式排版：三種基本元件遞迴組合
     T(s)              一段文字
     VF(top, bot)      直式分數（上下兩個元件加一條橫線）
     PW(base, exp, p)  乘方（base 加右上角的指數，p 為 true 時加括號）
   FR(n, d) 是 VF(T(n), T(d)) 的簡寫。
   -------------------------------------------------------------------------- */
const T = (s, color) => ({ t: 'txt', s: String(s), color });
const VF = (top, bot, color) => ({ t: 'vfrac', top, bot, color });
const FR = (n, d, color) => VF(T(n), T(d), color);
const PW = (base, exp, paren, color) => ({ t: 'pow', base, exp: String(exp), paren, color });
// GRP：把一整串元件包在會跟著長高的括號裡（'()' 或 '[]'）
const GRP = (items, kind, color) => ({ t: 'grp', items, kind: kind || '()', color });
// IT：斜體的數學變數（x、y）；SEQ：緊貼排列、不加括號的一串元件
const IT = (s, color) => ({ t: 'txt', s: String(s), color, it: true });
const SEQ = (items, color, gap) => ({ t: 'seq', items, color, gap });

function measure(ctx, it, size) {
  if (it.t === 'seq') {
    const sg = (it.gap == null) ? 6 : it.gap;
    let iw = 0, ih = size * 1.12;
    it.items.forEach((sub, i) => {
      const ms = measure(ctx, sub, size);
      if (i) iw += sg;
      iw += ms.w;
      ih = Math.max(ih, ms.h);
    });
    return { w: iw, h: ih };
  }
  if (it.t === 'vfrac') {
    const cs = size * 0.88;
    const mt = measure(ctx, it.top, cs);
    const mb = measure(ctx, it.bot, cs);
    return {
      w: Math.max(mt.w, mb.w) + 14,
      h: mt.h + mb.h + 12,
      top: mt, bot: mb, cs
    };
  }
  if (it.t === 'grp') {
    let iw = 0, ih = size * 1.12;
    it.items.forEach((sub, i) => {
      const ms = measure(ctx, sub, size);
      if (i) iw += 8;
      iw += ms.w;
      ih = Math.max(ih, ms.h);
    });
    const pw = Math.max(size * 0.34, ih * 0.18);
    return { w: iw + pw * 2 + 6, h: ih, innerW: iw, parenW: pw };
  }
  if (it.t === 'pow') {
    const mb = measure(ctx, it.base, size);
    const pw = it.paren ? Math.max(size * 0.30, mb.h * 0.17) : 0;
    ctx.font = f(800, size * 0.64);
    const ew = ctx.measureText(it.exp).width;
    return {
      w: mb.w + pw * 2 + size * POW_KERN + ew,
      h: mb.h + size * 0.42,
      base: mb, parenW: pw, expW: ew
    };
  }
  ctx.font = it.it ? fi(700, size) : f(700, size);
  return { w: ctx.measureText(it.s).width, h: size * 1.12 };
}

// 括號：用二次貝茲曲線描，才框得住高度不一的分數
function drawParen(ctx, cx, cy, h, open, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, h * 0.045);
  ctx.lineCap = 'round';
  const w = h * 0.20;
  const s = open ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx + s * w / 2, cy - h / 2);
  ctx.quadraticCurveTo(cx - s * w * 0.9, cy, cx + s * w / 2, cy + h / 2);
  ctx.stroke();
  ctx.restore();
}

// 方括號：直線加上下勾
function drawBracket(ctx, cx, cy, h, open, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, h * 0.045);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const w = h * 0.16;
  const s = open ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cx + s * w / 2, cy - h / 2);
  ctx.lineTo(cx - s * w / 2, cy - h / 2);
  ctx.lineTo(cx - s * w / 2, cy + h / 2);
  ctx.lineTo(cx + s * w / 2, cy + h / 2);
  ctx.stroke();
  ctx.restore();
}

// 以 (x, cy) 為左側中線畫出一個元件，回傳寬度
function drawIt(ctx, it, x, cy, size, fallback) {
  const m = measure(ctx, it, size);
  const color = it.color || fallback;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (it.t === 'seq') {
    const sg = (it.gap == null) ? 6 : it.gap;
    let ix = x;
    it.items.forEach((sub, i) => {
      if (i) ix += sg;
      ix += drawIt(ctx, sub, ix, cy, size, color);
    });
    return ix - x;
  }

  if (it.t === 'vfrac') {
    const cx = x + m.w / 2;
    drawIt(ctx, it.top, cx - m.top.w / 2, cy - m.top.h / 2 - 6, m.cs, color);
    drawIt(ctx, it.bot, cx - m.bot.w / 2, cy + m.bot.h / 2 + 6, m.cs, color);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size / 13);
    ctx.beginPath();
    ctx.moveTo(x + 3, cy);
    ctx.lineTo(x + m.w - 3, cy);
    ctx.stroke();
    return m.w;
  }

  if (it.t === 'grp') {
    const bh = Math.max(m.h * 1.08, size * 1.3);
    const drawB = it.kind === '[]' ? drawBracket : drawParen;
    drawB(ctx, x + m.parenW / 2, cy, bh, true, color);
    let ix = x + m.parenW + 3;
    it.items.forEach((sub, i) => {
      if (i) ix += 8;
      ix += drawIt(ctx, sub, ix, cy, size, color);
    });
    drawB(ctx, ix + 3 + m.parenW / 2, cy, bh, false, color);
    return m.w;
  }

  if (it.t === 'pow') {
    const bh = Math.max(m.base.h * 1.06, size * 1.25);
    let bx = x;
    if (it.paren) {
      drawParen(ctx, x + m.parenW / 2, cy, bh, true, color);
      bx = x + m.parenW;
    }
    drawIt(ctx, it.base, bx, cy, size, color);
    let ex = bx + m.base.w;
    if (it.paren) {
      drawParen(ctx, ex + m.parenW / 2, cy, bh, false, color);
      ex += m.parenW;
    }
    ctx.font = f(800, size * 0.64);
    ctx.fillStyle = it.expColor || color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(it.exp, ex + size * POW_KERN, cy - bh * 0.30);
    ctx.textBaseline = 'middle';
    return m.w;
  }

  ctx.font = it.it ? fi(700, size) : f(700, size);
  ctx.fillText(it.s, x, cy);
  return m.w;
}

function exprWidth(ctx, items, size, gap) {
  let w = 0;
  items.forEach((it, i) => {
    if (i) w += gap;
    w += measure(ctx, it, size).w;
  });
  return w;
}

// 置中畫出一整條算式；太寬時自動縮小字級，確保不會超出畫布
function drawExpr(ctx, items, cx, cy, size, fallback, opts) {
  const o = opts || {};
  const gap = o.gap == null ? 8 : o.gap;
  const maxW = o.maxW == null ? ctx.canvas.width - 24 : o.maxW;
  let s = size;
  let total = exprWidth(ctx, items, s, gap);
  while (total > maxW && s > 9) {
    s -= 1;
    total = exprWidth(ctx, items, s, gap);
  }
  let x = (o.left != null) ? o.left : cx - total / 2;
  items.forEach((it, i) => {
    if (i) x += gap;
    x += drawIt(ctx, it, x, cy, s, fallback);
  });
  return { w: total, size: s };
}

// 判定用的小徽章
function drawChip(ctx, x, y, w, h, label, color, bg) {
  ctx.fillStyle = bg || 'rgba(255,255,255,0.05)';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = f(800, 15);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, text, color) {
  ctx.fillStyle = color;
  ctx.font = f(800, 17);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ctx.canvas.width / 2, 26);
  ctx.textAlign = 'left';
}

function drawNote(ctx, text, y, color, size) {
  ctx.fillStyle = color || MUTED;
  ctx.font = f(600, size || 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ctx.canvas.width / 2, y);
  ctx.textAlign = 'left';
}

// 帶箭頭的直線
function drawArrow(ctx, x1, y1, x2, y2, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width || 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hs = 7;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.4), y2 - hs * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.4), y2 - hs * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 連乘字串：n 個 s 用 × 串起來，太長時省略中間
function repeatStr(s, n) {
  if (n <= 4) return Array(n).fill(s).join('×');
  return `${s}×${s}×…×${s}`;
}

// 整數次方，回傳精確整數（本頁的指數都很小，不會超出安全範圍）
function ipow(base, e) {
  let r = 1;
  for (let i = 0; i < e; i++) r *= base;
  return r;
}


// 置中的多行說明文字（中文逐字換行）
function wrapText(ctx, text, cx, y, maxW, lineH, color, size) {
  ctx.save();
  ctx.fillStyle = color || MUTED;
  ctx.font = f(600, size || 13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = [];
  let cur = '';
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  const startY = y - (lines.length - 1) * lineH / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * lineH));
  ctx.restore();
  ctx.textAlign = 'left';
}

// 靠左的小標籤
function drawNote2(ctx, text, x, y, color, size) {
  ctx.save();
  ctx.fillStyle = color || MUTED;
  ctx.font = f(600, size || 13);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}


// 取得滑鼠／觸控在 canvas 內的座標（含 CSS 縮放比率）
function canvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const t = (e.touches && e.touches.length > 0) ? e.touches[0]
    : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
  return {
    x: (t.clientX - rect.left) * (canvas.width / rect.width),
    y: (t.clientY - rect.top) * (canvas.height / rect.height)
  };
}

// 半透明底板，讓算式在背景上更清楚
function drawPanel(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha == null ? 0.08 : alpha;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// 一組互斥按鈕：回傳目前選中的 data 值
function bindPickGroup(groupEl, attr, onPick) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      groupEl.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onPick(btn.getAttribute(attr));
    });
  });
}

// 把小數印得乾淨：整數不留小數點，其餘最多一位
function numStr(v) {
  if (Number.isInteger(v)) return String(v);
  return String(Math.round(v * 100) / 100);
}

// 係數 1 與 -1 一律不寫出 1（重點 2 的簡記規則）
function coefTex(n) {
  if (n === 1) return '';
  if (n === -1) return '-';
  return String(n);
}

// canvas 上的 x 項：係數 ±1 時只畫 x 或 -x
function xItems(n, color) {
  const c = coefTex(n);
  return (c === '') ? IT('x', color) : SEQ([T(c, color), IT('x', color)], color, 1);
}

// 帶正負號的項，供連寫的算式使用（第一項不加正號）
function signed(v, first) {
  if (first) return numStr(v);
  return v < 0 ? `- ${numStr(-v)}` : `+ ${numStr(v)}`;
}

// 一條算式在畫布上的標準底板 + 置中排版
function drawEqPanel(ctx, items, cy, color, opts) {
  const o = opts || {};
  const w = ctx.canvas.width;
  drawPanel(ctx, 18, cy - (o.h || 30), w - 36, (o.h || 30) * 2, color, o.alpha == null ? 0.07 : o.alpha);
  return drawExpr(ctx, items, w / 2, cy, o.size || 24, color, { maxW: w - 60, gap: o.gap == null ? 7 : o.gap });
}

// 等號兩側的算式：left = right
function eqLine(leftItems, rightItems, color) {
  return leftItems.concat([T('=', color)], rightItems);
}
