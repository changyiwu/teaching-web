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

// canvas 上自己畫的指數要留的字距（AGENTS.md 開發約束 11）
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

// 把一整條算式在每個「頂層關係／加減運算子」前斷開，接成多段 \( \)，
// 中間用零寬的 <wbr>（AGENTS.md 開發約束 24）。mjx-container 是不折行的
// inline-block，整條包成一段時窄螢幕會直接溢出互動卡；斷成多段才換得了行。
//   - 後段以 {} 開頭，運算子才維持二元運算子的字距
//   - 接合用 <wbr> 而不是空白，寬螢幕的排版與整條包成一段時逐像素相同
//   - 斷點是深度 0 的 =、+、-。深度同時算 {}、()、[]，所以 a^{m-n}、
//     \frac{}{}、2[3x-(5x-4)] 裡面的運算子都不算——沒有等號的算式
//     （例：11x - 2[3x-(5x-4)]）也因此有了斷點
//   - 只斷「二元」運算子：前一個非空白字元若是運算子或開括號，那個 +/-
//     是正負號不是運算子（例：-2(3x-5) 開頭的負號、= -6 的負號）
//   - 反斜線後面那個字元直接跳過，\{ \} 才不會被算成括號層次
function wbrEq(tex) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === '\\') { i++; continue; }
    if (ch === '{' || ch === '(' || ch === '[') depth++;
    else if (ch === '}' || ch === ')' || ch === ']') depth--;
    else if (depth === 0 && i > start && (ch === '=' || ch === '+' || ch === '-')) {
      const prev = tex.slice(start, i).replace(/\s+$/, '').slice(-1);
      if (prev && '=+-*/([{,'.indexOf(prev) === -1) {
        parts.push(tex.slice(start, i));
        start = i;
      }
    }
  }
  parts.push(tex.slice(start));
  return parts
    .map((p, i) => `\\( ${i === 0 ? '' : '{}'}${p.trim()} \\)`)
    .join('<wbr>');
}

/* ==========================================================================
   由 2-1-1／2-1-2／2-1-3 三頁抽出的共用工具（原本三份逐字相同的複本）

   drawTicket／drawBrace 是票券與大括號的形狀，drawStepRows 是開發約束 22
   要求的「左欄步驟名、右側算式」固定分欄，其餘是 ax + by = c 這類標準式的
   字串與元件工具。這些都跟課程主題無關，任何節都用得到。

   ⚠️ 各節的**主題配色**（C_INK、C_PAPER…）不在這裡：那是每一節自己的調色盤，
   而且 1-3-1～1-3-3 也各自宣告了 C_SKY／C_EMBER，搬進來會變成重複宣告。
   需要顏色的一律由呼叫端傳入（drawStepRows 的 opts.color 即是）。
   ========================================================================== */

// 一張復古票根：圓角矩形加一條虛線撕線
function drawTicket(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = o.bg || 'rgba(148, 163, 184, 0.14)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 1.8;
  ctx.stroke();
  if (o.perf !== false) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.74, y + 4);
    ctx.lineTo(x + w * 0.74, y + h - 4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// 聯立方程式的大括號（左半邊）
function drawBrace(ctx, x, yTop, yBot, color) {
  const h = yBot - yTop, mid = (yTop + yBot) / 2, w = 15;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w, yTop);
  ctx.quadraticCurveTo(x + w * 0.35, yTop, x + w * 0.35, yTop + h * 0.24);
  ctx.quadraticCurveTo(x + w * 0.35, mid - 3, x, mid);
  ctx.quadraticCurveTo(x + w * 0.35, mid + 3, x + w * 0.35, yBot - h * 0.24);
  ctx.quadraticCurveTo(x + w * 0.35, yBot, x + w, yBot);
  ctx.stroke();
  ctx.restore();
}

// 逐行推導的固定分欄：左欄步驟名與說明（自動折行），右側算式
//   rows: [{ name, hint, items }]
function drawStepRows(ctx, rows, shown, opts) {
  const o = opts || {};
  // 列色的預設值由呼叫端給（各節調色盤不進共用檔）
  const base = o.color || INK;
  // 步驟列數不固定，列距由畫布高度自動配，最後一列才不會掉出畫面
  const top = o.top == null ? 56 : o.top;
  const gap = o.gap == null
    ? Math.min(46, (ctx.canvas.height - top - 24) / Math.max(1, rows.length - 1))
    : o.gap;
  const labX = o.labX == null ? 22 : o.labX;
  const eqX = o.eqX == null ? 186 : o.eqX;
  const maxW = o.maxW == null ? ctx.canvas.width - eqX - 20 : o.maxW;
  rows.forEach((r, i) => {
    if (i >= shown) return;
    const cy = top + i * gap;
    const active = (i === shown - 1);
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.62;
    if (active) drawPanel(ctx, 14, cy - gap / 2 + 3, ctx.canvas.width - 28, gap - 6, r.color || base, 0.09);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labW = eqX - labX - 12;
    ctx.fillStyle = r.color || base;
    ctx.font = f(800, 13);
    const hintLines = r.hint ? fitLines(ctx, r.hint, labW, f(600, 11.5)).slice(0, 2) : [];
    ctx.font = f(800, 13);
    ctx.fillText(r.name, labX, hintLines.length === 2 ? cy - 14 : (hintLines.length === 1 ? cy - 9 : cy));
    if (hintLines.length) {
      ctx.fillStyle = MUTED;
      ctx.font = f(600, 11.5);
      const y0 = hintLines.length === 2 ? cy + 1 : cy + 9;
      hintLines.forEach((ln, k) => ctx.fillText(ln, labX, y0 + k * 13));
    }
    drawExpr(ctx, r.items, 0, cy, o.size || 20, r.color || INK, { left: eqX, maxW: maxW, gap: 6 });
    ctx.restore();
  });
}

// 中文沒有空白可斷，逐字量寬度折成幾行
function fitLines(ctx, text, maxW, font) {
  const prev = ctx.font;
  if (font) ctx.font = font;
  const lines = [];
  let cur = '';
  for (const ch of String(text)) {
    const t = cur + ch;
    if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = ch; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  ctx.font = prev;
  return lines;
}

// 把一段算式字串轉成 canvas 元件：x、y 走斜體，其餘照原樣
function inkItems(s, color) {
  const parts = [];
  let buf = '';
  for (const ch of String(s)) {
    if (ch === 'x' || ch === 'y') {
      if (buf) { parts.push(T(buf, color)); buf = ''; }
      parts.push(IT(ch, color));
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(T(buf, color));
  return SEQ(parts, color, 1);
}

// 把 ax + by + c 這種項的陣列排成 canvas 算式元件
//   terms: [{ c: 係數, v: 'x' | 'y' | null }]
function termItems(terms, colorOf) {
  const out = [];
  terms.forEach(t => {
    if (t.c === 0 && t.v) return;
    const col = colorOf ? colorOf(t) : INK;
    const a = Math.abs(t.c);
    let body;
    if (!t.v) body = T(numStr(a), col);
    else if (a === 1) body = IT(t.v, col);
    else body = SEQ([T(numStr(a), col), IT(t.v, col)], col, 1);
    if (out.length) {
      out.push(T(t.c < 0 ? '-' : '+', INK));
      out.push(body);
    } else {
      // 首項的負號要貼著項，不然 drawExpr 的字距會把它推成「- 2x」
      out.push(t.c < 0 ? SEQ([T('-', col), body], col, 1) : body);
    }
  });
  if (!out.length) out.push(T('0', INK));
  return out;
}

// 同一組項的字串版本（也給 LaTeX 用）
function termTex(terms) {
  let s = '';
  terms.forEach(t => {
    if (t.c === 0 && t.v) return;
    const a = Math.abs(t.c);
    const body = !t.v ? numStr(a) : (a === 1 ? t.v : numStr(a) + t.v);
    if (!s) s = (t.c < 0 ? '-' : '') + body;
    else s += (t.c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

// 一條標準式 ax + by = c 的字串
function eqTex(a, b, c) {
  return termTex([{ c: a, v: 'x' }, { c: b, v: 'y' }]) + ' = ' + numStr(c);
}

// 代入時的數字寫法：負數要加括號
function sub(v) {
  return v < 0 ? `(${v})` : String(v);
}

// 兩式並列的 LaTeX cases 環境（不要餵給 wbrEq，它會把 cases 拆壞）
function casesTex(l1, l2) {
  return `\\(\\begin{cases} ${l1} \\\\ ${l2} \\end{cases}\\)`;
}

/* ==========================================================================
   由 2-2-1／2-2-2 兩頁抽出的共用工具：直角坐標平面

   兩節都要在畫布上鋪一個坐標平面、描點、插旗，這些形狀跟課程主題無關。

   ⚠️ 顏色一律由呼叫端傳入（各節的調色盤不進共用檔）。預設值取共用檔既有的
   INK 與 MUTED——INK 的值 #cbd5e1 剛好等於兩節原本寫死的 CH_SLATE，所以
   換過來是逐像素相同的。
   ========================================================================== */

/**
 * 鋪出一個坐標平面：格線、兩軸、刻度與軸名，並回傳座標換算器。
 * cfg：{ cx, top, unit, min, max, labelEvery, axisColor, tickFont, tickColor }
 *   cx 可省略（取畫布中線），其餘位置參數必填。
 *   tickFont 是刻度數字的字型字串（畫布在兩欄版面下只顯示約 0.66 倍，
 *   各節依自己的格寬決定字級）。
 * 回傳 { px(u), py(v), unit, min, max, ox, oy, left, right, top, bottom }
 *
 * ⚠️ 依〈開發約束 34〉，坐標軸只在**正向那一端**畫箭頭：
 *    x 軸只有右端有箭頭、左端平切；y 軸只有上端有箭頭、下端平切。
 */
function drawPlane(ctx, cfg) {
  const c = cfg || {};
  const min = c.min, max = c.max, unit = c.unit;
  const span = (max - min) * unit;
  const left = (c.cx == null ? ctx.canvas.width / 2 : c.cx) - span / 2;
  const top = c.top;
  const px = u => left + (u - min) * unit;
  const py = v => top + (max - v) * unit;
  const ox = px(0), oy = py(0);
  const labelEvery = c.labelEvery || 1;
  const axisColor = c.axisColor || INK;

  ctx.save();
  // 格線
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.13)';
  ctx.lineWidth = 1;
  for (let u = min; u <= max; u++) {
    ctx.beginPath();
    ctx.moveTo(px(u), py(min));
    ctx.lineTo(px(u), py(max));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px(min), py(u));
    ctx.lineTo(px(max), py(u));
    ctx.stroke();
  }

  // 兩條坐標軸（左端／下端平切，右端／上端加箭頭）
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px(min), oy);
  ctx.lineTo(px(max) + 8, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, py(min));
  ctx.lineTo(ox, py(max) - 8);
  ctx.stroke();
  axisArrow(ctx, px(max) + 4, oy, 'right', axisColor);
  axisArrow(ctx, ox, py(max) - 4, 'up', axisColor);

  // 刻度與數字
  ctx.fillStyle = c.tickColor || MUTED;
  ctx.font = c.tickFont || f(600, 11.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let u = min; u <= max; u++) {
    if (u === 0 || u % labelEvery !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(px(u), oy - 3);
    ctx.lineTo(px(u), oy + 3);
    ctx.strokeStyle = axisColor;
    ctx.stroke();
    ctx.fillText(String(u), px(u), oy + 6);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = min; v <= max; v++) {
    if (v === 0 || v % labelEvery !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(ox - 3, py(v));
    ctx.lineTo(ox + 3, py(v));
    ctx.strokeStyle = axisColor;
    ctx.stroke();
    ctx.fillText(String(v), ox - 7, py(v));
  }

  // 軸名與原點
  ctx.fillStyle = axisColor;
  ctx.font = fi(700, 14);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('x', px(max) + 26, oy);
  ctx.fillText('y', ox + 12, py(max) + 2);
  ctx.font = fi(700, 13);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('O', ox - 6, oy + 5);
  ctx.restore();

  return { px, py, unit, min, max, ox, oy, left, right: px(max), top, bottom: py(min) };
}

// 坐標軸的正向箭頭：實心三角形，比 drawArrow 的箭頭大得多。
// 這個箭頭是〈開發約束 34〉用來標示正向的唯一記號，投影 0.7 倍下必須讀得出來。
function axisArrow(ctx, x, y, dir, color) {
  const L = 13, W = 5.5;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(x + L, y);
    ctx.lineTo(x, y - W);
    ctx.lineTo(x, y + W);
  } else {
    ctx.moveTo(x, y - L);
    ctx.lineTo(x - W, y);
    ctx.lineTo(x + W, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 一個發光的點（帶一小塊反光高光）
function drawDot(ctx, x, y, color, r) {
  const rr = r || 6;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 一支小旗子（旗桿底端就是那個點）
function drawFlag(ctx, x, y, color, poleColor) {
  // 太靠近畫布頂端時旗桿改成向下掛，否則會插進標題那一列
  const d = (y > 80) ? -1 : 1;
  ctx.save();
  ctx.strokeStyle = poleColor || INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + d * 26);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + d * 26);
  ctx.lineTo(x + 18, y + d * 21);
  ctx.lineTo(x + 1, y + d * 15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawDot(ctx, x, y, color, 5);
}

// 虛線
function dashLine(ctx, x1, y1, x2, y2, color, dash) {
  ctx.save();
  ctx.setLineDash(dash || [5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 象限編號 → 中文；0 代表在坐標軸上
function quadName(q) {
  return ['不屬於任何象限', '第一象限', '第二象限', '第三象限', '第四象限'][q];
}

// 由兩個坐標判象限（在軸上回傳 0）
function quadOf(x, y) {
  if (x === 0 || y === 0) return 0;
  if (x > 0 && y > 0) return 1;
  if (x < 0 && y > 0) return 2;
  if (x < 0 && y < 0) return 3;
  return 4;
}

/* ==========================================================================
   由 2-4-1／2-4-2 兩頁抽出的共用工具：不等式與數線

   wbrRel 是 wbrEq 的不等式版；numLine 系列是在數線上畫解的形狀（端點、
   射線、線段），textCenter／textLeft 是單行文字。都跟課程主題無關。
   ⚠️ 顏色一律由呼叫端傳入（各節的調色盤不進共用檔）。
   ========================================================================== */

/**
 * 不等式版的 wbrEq：在頂層的 \le、\ge、\lt、\gt、\ne、= 前面斷開，接成多段 \( \)。
 * wbrEq() 只認 =、+、-，連寫的不等式（-2 \lt x \le 3）會整條包成一段、
 * 在窄螢幕的數值列裡溢出（開發約束 24）。
 * \left( 的 \le 後面接的是字母 f，不會被誤認成 \le。
 * 吃的是裸 LaTeX，不要自己先包 \( \)。
 */
function wbrRel(tex) {
  const REL = ['le', 'ge', 'lt', 'gt', 'ne'];
  const parts = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < tex.length) {
    const ch = tex[i];
    if (ch === '\\') {
      let j = i + 1;
      while (j < tex.length && /[a-zA-Z]/.test(tex[j])) j++;
      if (j === i + 1) j++;              // \{ \} 這類單一符號
      const cmd = tex.slice(i + 1, j);
      if (depth === 0 && i > start && REL.indexOf(cmd) >= 0) {
        parts.push(tex.slice(start, i));
        start = i;
      }
      i = j;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') depth++;
    else if (ch === '}' || ch === ')' || ch === ']') depth--;
    else if (ch === '=' && depth === 0 && i > start) {
      parts.push(tex.slice(start, i));
      start = i;
    }
    i++;
  }
  parts.push(tex.slice(start));
  return parts
    .map((p, k) => `\\( ${k === 0 ? '' : '{}'}${p.trim()} \\)`)
    .join('<wbr>');
}

// 置中的一行字
function textCenter(ctx, text, cx, cy, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// 靠左的一行字
function textLeft(ctx, text, x, cy, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, cy);
  ctx.restore();
}

const NUMLINE_FOLD = 34;   // 折線畫法抬高的高度

/**
 * 一條數線：刻度與數字，只有右端（正向）有箭頭，左端平切（開發約束 34）。
 * cfg：{ x0, x1, y, min, max, tick, labelEvery, color, font }
 *   x0／x1 是 min／max 的像素位置；tick 是刻度間隔（預設 1）
 * 回傳 { px(v), left, right }：left／right 是解的線段往兩端延伸時的終點
 */
function numLine(ctx, cfg) {
  const c = cfg;
  const color = c.color || INK;
  const tick = c.tick || 1;
  const every = c.labelEvery || tick;
  const unit = (c.x1 - c.x0) / (c.max - c.min);
  const px = v => c.x0 + (v - c.min) * unit;
  const left = c.x0 - 18;
  const right = c.x1 + 16;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, c.y);
  ctx.lineTo(right, c.y);
  ctx.stroke();
  axisArrow(ctx, right, c.y, 'right', color);
  ctx.fillStyle = MUTED;
  ctx.font = c.font || f(700, 14);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let v = c.min; v <= c.max; v += tick) {
    ctx.beginPath();
    ctx.moveTo(px(v), c.y - 5);
    ctx.lineTo(px(v), c.y + 5);
    ctx.stroke();
    if (v % every === 0) ctx.fillText(String(v), px(v), c.y + 9);
  }
  ctx.restore();
  return { px, left, right };
}

// 端點：含等號畫實心圓點；不含等號畫空心圓圈（連同底下的數線一起挖空）
function numLineEnd(ctx, x, y, filled, color) {
  const r = 7.5;
  ctx.save();
  if (filled) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 單一不等號的解：從端點往一邊畫到數線盡頭。style 'fold' 是抬高的折線畫法
function numLineRay(ctx, L, y, xa, toRight, color, style) {
  const xe = toRight ? L.right - 2 : L.left;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  if (style === 'fold') {
    ctx.lineWidth = 3.5;
    ctx.moveTo(xa, y);
    ctx.lineTo(xa, y - NUMLINE_FOLD);
    ctx.lineTo(xe, y - NUMLINE_FOLD);
  } else {
    ctx.lineWidth = 6;
    ctx.moveTo(xa, y);
    ctx.lineTo(xe, y);
  }
  ctx.stroke();
  ctx.restore();
}

// 兩個不等號的解：兩端點之間的一段。style 'fold' 畫成ㄇ字形
function numLineSeg(ctx, y, xa, xb, color, style) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  if (style === 'fold') {
    ctx.lineWidth = 3.5;
    ctx.moveTo(xa, y);
    ctx.lineTo(xa, y - NUMLINE_FOLD);
    ctx.lineTo(xb, y - NUMLINE_FOLD);
    ctx.lineTo(xb, y);
  } else {
    ctx.lineWidth = 6;
    ctx.moveTo(xa, y);
    ctx.lineTo(xb, y);
  }
  ctx.stroke();
  ctx.restore();
}
