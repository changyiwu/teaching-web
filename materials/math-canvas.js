/* ==========================================================================
   math-canvas.js — 教材頁共用的 Canvas 算式繪圖引擎

   由 1-3-3「應用問題」的 canvas.js 抽出（原第 2 節 Helper functions），
   供各教材頁的 canvas.js 共用；請在教材頁的 canvas.js 之前載入：

     <script src="../math-canvas.js"></script>
     <script src="canvas.js"></script>

   本檔只放「跟課程主題無關」的通用工具：
     - 算式元件與排版：T／IT／VF／FR／PW／GRP／SEQ／RT／SB、measure／drawIt／drawExpr
     - 算式字串解析：parseExpr／exprSeq／exprItems（含 _ 下標、^ 指數、@ 插槽）、subLabel
     - 有理數：qOf／qAdd／qSub／qMul／qDiv／qPow、qTex／qTexP／qTexM、qIt／qOpIt／qPowIt
     - 基本繪圖：roundRect／drawPanel／drawChip／drawTitle／drawNote／drawArrow
     - 數值與字串：gcd／clamp／reduce／texFrac／numStr／coefTex／signed
     - 互動與版面：canvasPos／bindPickGroup／wrapText／wrapFeedback／typeset／drawWithFonts
     - 平面幾何與尺規作圖：hb*（數學方向角）、cg*（canvas 座標、圓規直尺播放引擎）
     - 相似形：dk*（數學座標 y 朝上的取景 dkView／dkView2、作三角形、dkRich 混排字與標籤）

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

// 先畫一次，之後每當有網頁字型下載完成就重畫。canvas 用到的字重（fi(800, 18)
// 這類）與 Noto Sans TC 的中文字段，要等第一次被畫到才開始下載，
// document.fonts.ready 不會等它們；只畫一次的話，字型晚到時初次畫面會停在
// 替代字型，直到使用者動了控制項才換過來。draw 必須只依目前狀態重畫
// （多畫幾次結果相同）——各頁的 draw 本來就會在每次操作時被重複呼叫。
function drawWithFonts(draw) {
  draw();
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => draw());
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
// RT：根號，inner 是任一元件（3-2-1 起用；長橫線會蓋過整個被開方數）
const RT = (inner, color) => ({ t: 'sqrt', inner, color });
// SB：下標（4-1-2 起；數列的 a₁、Sₙ）。字級 0.68 倍、往下沉 0.3 倍字級，
// 含小寫字母時用斜體。寫 a 下標 n 是 SEQ([IT('a'), SB('n')], color, 0)，
// 或用 parseExpr('a_n')。Unicode 下標字（₁ₙ）在投影下太小，不要用
const SB = (s, color) => ({ t: 'sub', s: String(s), color });

function sbFont(it, size) {
  return /[a-z]/.test(it.s) ? fi(700, size * 0.68) : f(700, size * 0.68);
}

function measure(ctx, it, size) {
  if (it.t === 'sub') {
    ctx.font = sbFont(it, size);
    return { w: ctx.measureText(it.s.replace(/-/g, '−')).width + size * 0.06, h: size * 1.12 };
  }
  if (it.t === 'sqrt') {
    const mi = measure(ctx, it.inner, size);
    const sw = size * 0.62;
    return { w: sw + mi.w + size * 0.16, h: Math.max(mi.h, size * 1.12) + size * 0.24, inner: mi, sw };
  }
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

  if (it.t === 'sub') {
    ctx.font = sbFont(it, size);
    ctx.fillText(it.s.replace(/-/g, '−'), x + size * 0.04, cy + size * 0.3);
    return m.w;
  }

  if (it.t === 'sqrt') {
    const top = cy - m.h / 2 + 1;
    const bot = cy + m.h / 2 - 1;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.8, size / 13);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + m.sw * 0.06, cy + m.h * 0.10);
    ctx.lineTo(x + m.sw * 0.26, cy + m.h * 0.01);
    ctx.lineTo(x + m.sw * 0.54, bot);
    ctx.lineTo(x + m.sw * 0.94, top);
    ctx.lineTo(x + m.w, top);
    ctx.stroke();
    ctx.restore();
    drawIt(ctx, it.inner, x + m.sw + size * 0.06, cy + size * 0.06, size, color);
    return m.w;
  }

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

/* --------------------------------------------------------------------------
   有理數（4-1-1～4-1-3 抽出）：一律以化成最簡的 [分子, 分母] 表示，分母為正。
   四則運算的第二個運算元可以直接給整數。名稱一律 q 開頭——各節早期頁面
   各自宣告過 rq／rIt／rTex／fTex，共用檔不可以再用那些名字。
   -------------------------------------------------------------------------- */
function qOf(n, d) {
  return reduce(n, d == null ? 1 : d);
}

function qPair(b) {
  return Array.isArray(b) ? b : [b, 1];
}

function qAdd(a, b) { b = qPair(b); return reduce(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
function qSub(a, b) { b = qPair(b); return reduce(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); }
function qMul(a, b) { b = qPair(b); return reduce(a[0] * b[0], a[1] * b[1]); }
function qDiv(a, b) { b = qPair(b); return reduce(a[0] * b[1], a[1] * b[0]); }
function qEq(a, b) { return a[0] === b[0] && a[1] === b[1]; }
function qVal(a) { return a[0] / a[1]; }

function qPow(a, k) {
  if (k < 0) return qPow(qDiv([1, 1], a), -k);
  let r = [1, 1];
  for (let i = 0; i < k; i++) r = qMul(r, a);
  return r;
}

// 當底數或乘數時要不要加括號：負數、分數
function qNeedP(a) {
  return a[0] < 0 || a[1] !== 1;
}

// LaTeX：先化簡再輸出（texFrac 本身不化簡）。qTex([n, d]) 或 qTex(n, d) 皆可
function qTex(a, d) {
  const r = Array.isArray(a) ? reduce(a[0], a[1]) : reduce(a, d == null ? 1 : d);
  return texFrac(r[0], r[1]);
}

// 次方的底數：分數加 \left( \right)，負整數加括號
function qTexP(a) {
  if (a[1] !== 1) return `\\left(${qTex(a)}\\right)`;
  return a[0] < 0 ? `(${a[0]})` : String(a[0]);
}

// × 或 ÷ 後面的數：負數加括號，正分數不加
function qTexM(a) {
  return a[0] < 0 ? qTexP(a) : qTex(a);
}

// canvas 元件：分數或整數，負號提到分數前面
function qIt(a, color) {
  const [n, d] = reduce(a[0], a[1]);
  if (d === 1) return T(String(n).replace(/-/g, '−'), color);
  if (n < 0) return SEQ([T('−', color), FR(-n, d, color)], color, 2);
  return FR(n, d, color);
}

// × 或 ÷ 後面的數：負數加括號
function qOpIt(a, color) {
  return a[0] < 0 ? GRP([qIt(a, color)], '()', color) : qIt(a, color);
}

// 次方；指數是 1 時不寫指數
function qPowIt(a, e, color) {
  if (e === 1) return qOpIt(a, color);
  return PW(qIt(a, color), String(e).replace(/-/g, '−'), qNeedP(a), color);
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（4-1-2 的 asParse 與 4-1-3 的 gx 合併；3-4-3 的
   ocParse 是它的前身）。字串用 ASCII 寫，中文可以直接混在裡面：
     「a_{12} = a_1 + 11d」 _ 下標：單一字元、連續數字，或 {…}
     「r^{n-1}」「(x + 3)^2」 ^ 指數：連續數字或 {…}（裡面的 - 換成 −）
     「(…)」「[…]」          會跟著長高的括號
     「@0」「@1」            換成 slots 裡對應的元件（分數、次方這類）
   英文字母一律畫成斜體變數。
   -------------------------------------------------------------------------- */
function parseExpr(str, color, slots) {
  const out = [];
  let buf = '';
  const flush = () => {
    if (buf) { out.push(T(buf.replace(/-/g, '−'), color)); buf = ''; }
  };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '@') {
      flush();
      out.push(slots[parseInt(str[++i], 10)]);
      continue;
    }
    if (ch === '(' || ch === '[') {
      let dep = 1, j = i + 1;
      while (j < str.length) {
        if (str[j] === '(' || str[j] === '[') dep++;
        else if (str[j] === ')' || str[j] === ']') { dep--; if (dep === 0) break; }
        j++;
      }
      flush();
      out.push(GRP([SEQ(parseExpr(str.slice(i + 1, j), color, slots), color, 1)], ch === '[' ? '[]' : '()', color));
      i = j;
      continue;
    }
    if (ch === '_') {
      let s = '';
      if (str[i + 1] === '{') {
        let j = i + 2;
        while (j < str.length && str[j] !== '}') s += str[j++];
        i = j;
      } else {
        s = str[++i];
        if (/[0-9]/.test(s)) while (i + 1 < str.length && /[0-9]/.test(str[i + 1])) s += str[++i];
      }
      flush();
      out.push(SB(s, color));
      continue;
    }
    if (ch === '^') {
      let e = '';
      if (str[i + 1] === '{') {
        let j = i + 2;
        while (j < str.length && str[j] !== '}') e += str[j++];
        i = j;
      } else {
        while (i + 1 < str.length && /[0-9]/.test(str[i + 1])) e += str[++i];
      }
      e = e.replace(/-/g, '−');
      const m = buf.match(/[0-9.]+$/);
      if (m) {
        buf = buf.slice(0, buf.length - m[0].length);
        flush();
        out.push(PW(T(m[0], color), e, false, color));
      } else {
        flush();
        const last = out.pop();
        if (last && last.t === 'grp') out.push(PW(last.items[0], e, true, color));
        else out.push(PW(last, e, false, color));
      }
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      flush();
      out.push(IT(ch, color));
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

// 整條字串包成一個緊貼的 SEQ；exprItems 再包成 drawExpr／drawStepRows 吃的陣列
function exprSeq(str, color, slots) {
  return SEQ(parseExpr(String(str), color, slots || []), color, 1);
}

function exprItems(str, color, slots) {
  return [exprSeq(str, color, slots)];
}

// 以 (cx, cy) 為中心畫「base 下標 idx」的小標籤（號碼牌底下的 a₃ 之類）
function subLabel(ctx, base, idx, cx, cy, color, size) {
  const s = size || 15;
  const it = SEQ([IT(base, color), SB(idx, color)], color, 0);
  ctx.save();
  const w = measure(ctx, it, s).w;
  drawIt(ctx, it, cx - w / 2, cy, s, color);
  ctx.restore();
}

/* ==========================================================================
   由 4-3-1～4-3-5 五頁抽出的共用工具：平面幾何與尺規作圖

   hb* 用數學方向角（度、逆時針為正、y 軸朝上）：角記號、頂點外推、由角度作
   三角形、度數的 LaTeX；原本 4-3-1、4-3-4、4-3-5 各有一份逐字相同的複本。
   cg* 用 canvas 座標（弧度、y 向下）：圓與圓／直線與圓／直線與直線求交、
   弧、角記號、直角記號，以及圓規、無刻度直尺與逐步播放引擎；原本 4-3-2～
   4-3-5 各有一份逐字相同的複本。兩組座標慣例不同，所以兩套都留著。

   ⚠️ 顏色一律由呼叫端傳入（各節的調色盤不進共用檔）；播放引擎的配色見
   cgUsePalette()。
   ========================================================================== */

const HB_RAD = Math.PI / 180;

function hbEl(id) {
  return document.getElementById(id);
}

function hbIv(el) {
  return parseInt(el.value, 10);
}

function hbV(x, y) {
  return { x, y };
}

// 數學方向角（度；逆時針為正、y 軸朝上）走 len 的點
function hbAt(P, deg, len) {
  return hbV(P.x + Math.cos(deg * HB_RAD) * len, P.y - Math.sin(deg * HB_RAD) * len);
}

// 由 V 看 P 的數學方向角（0～360）
function hbHead(V, P) {
  let a = Math.atan2(-(P.y - V.y), P.x - V.x) / HB_RAD;
  if (a < 0) a += 360;
  return a;
}

function hbDist(P, Q) {
  return Math.hypot(P.x - Q.x, P.y - Q.y);
}

// 從 P 往 Q 的方向，延長到 Q 之外 len
function hbBeyond(P, Q, len) {
  const d = hbDist(P, Q) || 1;
  return hbV(Q.x + (Q.x - P.x) / d * len, Q.y + (Q.y - P.y) / d * len);
}

function hbCentroid(pts) {
  const s = pts.reduce((a, p) => hbV(a.x + p.x, a.y + p.y), hbV(0, 0));
  return hbV(s.x / pts.length, s.y / pts.length);
}

function hbSeg(ctx, P, Q, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.4;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(P.x, P.y);
  ctx.lineTo(Q.x, Q.y);
  ctx.stroke();
  ctx.restore();
}

function hbPoly(ctx, pts, color, alpha, width) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function hbDot(ctx, P, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(P.x, P.y, r || 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 扇形角記號：從數學角 a0 起、逆時針掃 sweep 度（sweep 可到 360）
//   o.alpha 填色透明度、o.label 標籤（畫在角平分線上 o.lr 處）、o.right 直角記號
function hbSector(ctx, V, a0, sweep, r, color, o) {
  const opt = o || {};
  ctx.save();
  if (opt.right && Math.abs(sweep - 90) < 1e-9) {
    const s = Math.min(r * 0.55, 16);
    const P1 = hbAt(V, a0, s), P3 = hbAt(V, a0 + 90, s), P2 = hbAt(P1, a0 + 90, s);
    ctx.beginPath();
    ctx.moveTo(V.x, V.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y); ctx.closePath();
    ctx.globalAlpha = opt.alpha == null ? 0.28 : opt.alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const s = -a0 * HB_RAD, e = -(a0 + sweep) * HB_RAD;
    ctx.beginPath();
    ctx.moveTo(V.x, V.y);
    ctx.arc(V.x, V.y, r, s, e, sweep > 0);
    ctx.closePath();
    ctx.globalAlpha = opt.alpha == null ? 0.28 : opt.alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(V.x, V.y, r, s, e, sweep > 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = opt.lw || 2.2;
    if (opt.dash) ctx.setLineDash(opt.dash);
    ctx.stroke();
  }
  ctx.restore();
  if (opt.label) {
    const P = hbAt(V, a0 + sweep / 2, opt.lr || r + 17);
    textCenter(ctx, opt.label, P.x, P.y, opt.lc || color, opt.font || f(800, 15));
  }
}

// ∠PVQ（取小於 180° 的那一側）
function hbAngle(ctx, V, P, Q, r, color, o) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = ((b - a) % 360 + 360) % 360;
  if (d > 180) hbSector(ctx, V, b, 360 - d, r, color, o);
  else hbSector(ctx, V, a, d, r, color, o);
}

// ∠PVQ 的度數（數值，驗收用）
function hbAngleDeg(V, P, Q) {
  const d = ((hbHead(V, Q) - hbHead(V, P)) % 360 + 360) % 360;
  return d > 180 ? 360 - d : d;
}

// 頂點字母畫在圖形外側（開發約束 18）：由 ref（通常是重心）往 V 的方向推出去
//   color 必填（各節的調色盤不進共用檔）
function hbVLabel(ctx, V, ref, text, color, dist) {
  const d = hbDist(V, ref) || 1;
  const k = dist || 18;
  const P = hbV(V.x + (V.x - ref.x) / d * k, V.y + (V.y - ref.y) / d * k);
  textCenter(ctx, text, P.x, P.y, color, fi(800, 18));
}

// 把一組點等比例縮放、置中到 box 裡（保持形狀）
function hbFit(pts, box) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(box.w / Math.max(x1 - x0, 1e-6), box.h / Math.max(y1 - y0, 1e-6));
  const ox = box.x + (box.w - (x1 - x0) * k) / 2, oy = box.y + (box.h - (y1 - y0) * k) / 2;
  return pts.map(p => hbV(ox + (p.x - x0) * k, oy + (p.y - y0) * k));
}

// 由兩個內角作三角形：BC 水平，B 在左、C 在右、A 在上
function hbTriangle(A, B, box) {
  const C = 180 - A - B;
  const Bp = hbV(0, 0), Cp = hbV(1, 0);
  const ab = Math.sin(C * HB_RAD) / Math.sin(A * HB_RAD);
  const Ap = hbAt(Bp, B, ab);
  const fit = hbFit([Ap, Bp, Cp], box);
  return { A: fit[0], B: fit[1], C: fit[2] };
}

// 兩條直線 P + t·u、Q + s·v 的交點
function hbCross(P, u, Q, v) {
  const det = u.x * (-v.y) - u.y * (-v.x);
  const t = ((Q.x - P.x) * (-v.y) - (Q.y - P.y) * (-v.x)) / det;
  return hbV(P.x + u.x * t, P.y + u.y * t);
}

function hbUnit(deg) {
  return hbV(Math.cos(deg * HB_RAD), -Math.sin(deg * HB_RAD));
}

// 沿線段畫一個行進方向的箭頭（實心三角形，投影下才看得見）
function hbArrowHead(ctx, P, Q, color) {
  const ang = Math.atan2(Q.y - P.y, Q.x - P.x);
  const M = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(M.x + Math.cos(ang) * 9, M.y + Math.sin(ang) * 9);
  ctx.lineTo(M.x - Math.cos(ang) * 6 - Math.sin(ang) * 7, M.y - Math.sin(ang) * 6 + Math.cos(ang) * 7);
  ctx.lineTo(M.x - Math.cos(ang) * 6 + Math.sin(ang) * 7, M.y - Math.sin(ang) * 6 - Math.cos(ang) * 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 度數的 LaTeX
function hbDg(v) {
  return `${v}^\\circ`;
}

// 依數值把滑桿夾回範圍，回傳夾過的值
function hbClampSlider(s, lo, hi) {
  s.min = lo;
  s.max = hi;
  let v = hbIv(s);
  if (v > hi) v = hi;
  if (v < lo) v = lo;
  s.value = v;
  return v;
}

// 有理數的 canvas 元件後面接度數：900/7 → 分數 + °
function hbDegItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(`${r[0]}°`, color);
  return SEQ([FR(String(r[0]), String(r[1]), color), T('°', color)], color, 2);
}

function hbDegTex(n, d) {
  const r = reduce(n, d);
  if (r[1] === 1) return hbDg(r[0]);
  return `\\frac{${r[0]}}{${r[1]}}^\\circ`;
}

// 長度與多邊形的小工具（4-3-5、4-4-2、4-4-3 原本各自一份，逐字相同或只差參數，抽出來共用）。
// hbRoot(n)：√n 化成最簡根式。回傳 { n, k, r, val, exact, txt, tex, dec }，√n = k√r。
function hbRoot(n) {
  let k = 1, r = n;
  for (let d = 2; d * d <= r; d++) {
    while (r % (d * d) === 0) { r /= d * d; k *= d; }
  }
  const val = Math.sqrt(n);
  const exact = (r === 1);
  const txt = exact ? String(k) : (k > 1 ? `${k}√${r}` : `√${r}`);
  const tex = exact ? String(k) : (k > 1 ? `${k}\\sqrt{${r}}` : `\\sqrt{${r}}`);
  const dec = exact ? k : Math.round(val * 100) / 100;
  return { n, k, r, val, exact, txt, tex, dec };
}

// 鞋帶公式求多邊形面積（頂點依序排列，順逆時針皆可）。
function hbPolyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

// 邊長標籤：放在線段 PQ 中點、朝遠離 G（圖形內部一點）的那一側外推 off px（〈開發約束 18〉）。
function hbSideLabel(ctx, P, Q, G, text, color, off, font) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  cgLabel(ctx, m, text, color, nx * k, ny * k, font || f(800, 15));
}

// 等長記號：在 PQ 上比例 t（預設 0.5，即中點）的位置畫 n 條垂直短刻痕。
function hbTick(ctx, P, Q, n, color, t) {
  const tt = t == null ? 0.5 : t;
  const m = hbV(P.x + (Q.x - P.x) * tt, P.y + (Q.y - P.y) * tt);
  const d = hbDist(P, Q) || 1;
  const ux = (Q.x - P.x) / d, uy = (Q.y - P.y) / d;
  const nx = -uy, ny = ux;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const s = (i - (n - 1) / 2) * 6;
    const c = hbV(m.x + ux * s, m.y + uy * s);
    ctx.beginPath();
    ctx.moveTo(c.x - nx * 8, c.y - ny * 8);
    ctx.lineTo(c.x + nx * 8, c.y + ny * 8);
    ctx.stroke();
  }
  ctx.restore();
}

// 置中的一行說明字：寬度超過畫布（左右各留 12px）就以 0.5px 為一級縮字，最小 12.5px。
function hbFitLine(ctx, text, y, color, size) {
  const W = ctx.canvas.width;
  let s = size || 16;
  ctx.save();
  ctx.font = f(800, s);
  while (ctx.measureText(text).width > W - 24 && s > 12.5) {
    s -= 0.5;
    ctx.font = f(800, s);
  }
  ctx.restore();
  textCenter(ctx, text, W / 2, y, color, f(800, s));
}

// 尺規播放引擎（cgCompass／cgBand／cgRender）的配色：由頁面在 canvas.js 開頭
// 呼叫一次 cgUsePalette() 登記，共用檔不放主題色。欄位：
//   ink（點與點名的預設色）、honey（圓規的半徑虛線與標籤）、brass／brassDk（圓規本體）、
//   tools：{ compass, ruler, look, warn }（步驟列各工具的顏色）
let CG_PAL = null;

function cgUsePalette(p) {
  CG_PAL = p;
}

// 角度：四捨五入到 0.01 度（33.75° 這種再平分的角要看得到兩位），尾巴的 0 不留
function cgDeg(v) {
  const r = Math.round(v * 100) / 100;
  return String(r);
}

function cgP(x, y) { return { x, y }; }

function cgDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function cgAng(c, p) { return Math.atan2(p.y - c.y, p.x - c.x); }

function cgPolar(c, r, ang) { return cgP(c.x + r * Math.cos(ang), c.y + r * Math.sin(ang)); }

function cgMid(a, b) { return cgP((a.x + b.x) / 2, (a.y + b.y) / 2); }

function cgRad(deg) { return deg * Math.PI / 180; }

// 兩圓交點：0、1（相切）或 2 個
function cgCC(c1, r1, c2, r2) {
  const d = cgDist(c1, c2);
  const eps = 1e-6;
  if (d < eps) return [];
  if (d > r1 + r2 + eps || d < Math.abs(r1 - r2) - eps) return [];
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h2 = r1 * r1 - a * a;
  const ux = (c2.x - c1.x) / d, uy = (c2.y - c1.y) / d;
  const mx = c1.x + a * ux, my = c1.y + a * uy;
  if (h2 <= eps * Math.max(1, r1 * r1) || Math.abs(d - r1 - r2) < eps || Math.abs(d - Math.abs(r1 - r2)) < eps) {
    return [cgP(mx, my)];
  }
  const h = Math.sqrt(h2);
  return [cgP(mx - h * uy, my + h * ux), cgP(mx + h * uy, my - h * ux)];
}

// 直線 ab 與圓的交點（依沿 a→b 的方向排序）
function cgLC(a, b, c, r) {
  const d = cgDist(a, b);
  const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
  const fx = a.x - c.x, fy = a.y - c.y;
  const B = fx * ux + fy * uy;
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - C;
  if (disc < -1e-6) return [];
  if (Math.abs(disc) <= 1e-6) return [cgP(a.x - B * ux, a.y - B * uy)];
  const s = Math.sqrt(disc);
  return [-B - s, -B + s].map(t => cgP(a.x + t * ux, a.y + t * uy));
}

// 兩直線 ab、cd 的交點
function cgLL(a, b, c, d) {
  const x1 = b.x - a.x, y1 = b.y - a.y, x2 = d.x - c.x, y2 = d.y - c.y;
  const den = x1 * y2 - y1 * x2;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * y2 - (c.y - a.y) * x2) / den;
  return cgP(a.x + t * x1, a.y + t * y1);
}

// 以 v 為頂點、兩邊通過 p、q 的角（度）
function cgAngDeg(v, p, q) {
  const ax = p.x - v.x, ay = p.y - v.y, bx = q.x - v.x, by = q.y - v.y;
  const c = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
  return Math.acos(clamp(c, -1, 1)) * 180 / Math.PI;
}

// 點 p 在直線 ab 的哪一側（正負號）
function cgSide(a, b, p) {
  return Math.sign((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
}

function cgUpper(pts) { return pts.slice().sort((u, v) => u.y - v.y)[0]; }

function cgLower(pts) { return pts.slice().sort((u, v) => v.y - u.y)[0]; }

function cgSeg(ctx, a, b, color, w, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2.4;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function cgArc(ctx, c, r, a0, a1, color, w) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2.2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, a0, a1, false);
  ctx.stroke();
  ctx.restore();
}

// 圓心 c、半徑 r 的弧，涵蓋通往 pts 各點的方向，兩端再多 spread 弧度
function cgArcAt(ctx, c, r, pts, spread, color, w) {
  const base = cgAng(c, pts[0]);
  let lo = 0, hi = 0;
  pts.forEach(p => {
    let d = cgAng(c, p) - base;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  });
  cgArc(ctx, c, r, base + lo - spread, base + hi + spread, color, w);
}

// 圍繞某個方向的弧
function cgArcDir(ctx, c, r, ang, spread, color, w) {
  cgArc(ctx, c, r, ang - spread, ang + spread, color, w);
}

function cgDot(ctx, p, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 點名或邊長標籤：深色描邊讓它壓在線上也讀得到
function cgLabel(ctx, p, text, color, dx, dy, font) {
  ctx.save();
  ctx.font = font || fi(700, 18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeText(text, p.x + dx, p.y + dy);
  ctx.fillStyle = color;
  ctx.fillText(text, p.x + dx, p.y + dy);
  ctx.restore();
}

// 角的記號：從方向 a0 轉到 a1（走較短的那一邊）
function cgAngMark(ctx, v, a0, a1, r, color, w) {
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  // 平角：一律畫在上方（canvas 的負角度）
  if (Math.abs(Math.abs(d) - Math.PI) < 1e-6) d = -Math.PI;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 2;
  ctx.beginPath();
  ctx.arc(v.x, v.y, r, a0, a0 + d, d < 0);
  ctx.stroke();
  ctx.restore();
}

// 直角記號：u、w 是兩條線的單位方向
function cgRight(ctx, v, u, w, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(v.x + u.x * s, v.y + u.y * s);
  ctx.lineTo(v.x + u.x * s + w.x * s, v.y + u.y * s + w.y * s);
  ctx.lineTo(v.x + w.x * s, v.y + w.y * s);
  ctx.stroke();
  ctx.restore();
}

function cgUnit(a, b) {
  const d = cgDist(a, b);
  return cgP((b.x - a.x) / d, (b.y - a.y) / d);
}

/* --------------------------------------------------------------------------
   圓規：針腳在圓心 c，筆尖在 c 往 ang 方向 r 的位置。
   兩腳一樣長、在鉸鏈處相接，張開的大小（針腳到筆尖）就是半徑——
   畫面上的圓規真的畫得出那段弧（開發約束 28）。
   -------------------------------------------------------------------------- */
function cgCompass(ctx, c, r, ang, label) {
  const t = cgPolar(c, r, ang);
  const m = cgMid(c, t);
  let nx = -(t.y - c.y) / r, ny = (t.x - c.x) / r;
  if (ny > 0 || (Math.abs(ny) < 1e-6 && nx < 0)) { nx = -nx; ny = -ny; }
  const L = Math.max(96, r / 2 + 36);
  const h = Math.sqrt(L * L - r * r / 4);
  const hinge = cgP(m.x + nx * h, m.y + ny * h);

  ctx.save();
  // 半徑（針腳到筆尖的距離）
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = CG_PAL.honey;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';

  [[c, 'needle'], [t, 'pencil']].forEach(([tip, kind]) => {
    const dd = cgDist(hinge, tip);
    const ux = (tip.x - hinge.x) / dd, uy = (tip.y - hinge.y) / dd;
    const end = cgP(tip.x - ux * 13, tip.y - uy * 13);
    ctx.strokeStyle = CG_PAL.brassDk;
    ctx.lineWidth = 7.5;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.strokeStyle = CG_PAL.brass;
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    if (kind === 'needle') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    } else {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(tip.x - ux * 4, tip.y - uy * 4); ctx.stroke();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tip.x - ux * 4, tip.y - uy * 4); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    }
  });

  // 握柄與鉸鏈
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hinge.x, hinge.y);
  ctx.lineTo(hinge.x + nx * 18, hinge.y + ny * 18);
  ctx.stroke();
  ctx.fillStyle = CG_PAL.brass;
  ctx.strokeStyle = CG_PAL.brassDk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hinge.x, hinge.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (label) cgLabel(ctx, m, label, CG_PAL.honey, -nx * 15, -ny * 15, f(700, 13));
}

/* --------------------------------------------------------------------------
   直尺：沒有刻度的木條，一邊貼著要畫的那條線
   -------------------------------------------------------------------------- */
function cgRuler(ctx, a, b) {
  const u = cgUnit(a, b);
  let nx = -u.y, ny = u.x;
  if (ny < 0 || (Math.abs(ny) < 1e-6 && nx < 0)) { nx = -nx; ny = -ny; }
  const ext = 26, wd = 18, off = 5;
  const p0 = cgP(a.x - u.x * ext + nx * off, a.y - u.y * ext + ny * off);
  const p1 = cgP(b.x + u.x * ext + nx * off, b.y + u.y * ext + ny * off);
  ctx.save();
  ctx.fillStyle = 'rgba(234, 205, 140, 0.10)';
  ctx.strokeStyle = 'rgba(234, 205, 140, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p1.x + nx * wd, p1.y + ny * wd);
  ctx.lineTo(p0.x + nx * wd, p0.y + ny * wd);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  let ang = Math.atan2(u.y, u.x);
  if (ang > Math.PI / 2) ang -= Math.PI;
  if (ang < -Math.PI / 2) ang += Math.PI;
  const cx = (p0.x + p1.x) / 2 + nx * wd / 2, cy = (p0.y + p1.y) / 2 + ny * wd / 2;
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(254, 243, 199, 0.6)';
  ctx.font = f(600, 11);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('直尺（沒有刻度）', 0, 0);
  ctx.restore();
}

const CG_TOOL_NAME = { compass: '圓規', ruler: '直尺', look: '觀察', warn: '注意' };

function cgBand(ctx, k, n, tool, text) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const y = H - 84, h = 76;
  const name = CG_TOOL_NAME[tool], col = CG_PAL.tools[tool];
  drawPanel(ctx, 12, y, W - 24, h, col, 0.1);
  textCenter(ctx, `步驟 ${k}/${n}`, 62, y + 22, '#f8fafc', f(800, 14));
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = col;
  roundRect(ctx, 30, y + 38, 64, 26, 8);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  roundRect(ctx, 30, y + 38, 64, 26, 8);
  ctx.stroke();
  ctx.restore();
  textCenter(ctx, name, 62, y + 51, col, f(800, 14));
  const lines = fitLines(ctx, text, W - 24 - 104 - 14, f(600, 15)).slice(0, 3);
  const lh = 20;
  const y0 = y + h / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, i) => textLeft(ctx, ln, 116, y0 + i * lh, '#f1f5f9', f(600, 15)));
}

// 步驟列上方的一行量測結果
function cgMeasure(ctx, text, color) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  textCenter(ctx, text, W / 2, H - 100, color, f(700, 15));
}

/* --------------------------------------------------------------------------
   逐步播放引擎
     o.steps: [{ tool, text, draw(ctx), compass: {c, r, ang, label}, ruler: [a, b] }]
     o.pts:   [{ p, n（名字）, s（第幾步出現；0 是已知）, c（顏色）, dx, dy }]
     o.k:     目前顯示到第幾步
   畫到第 k 步：已知圖形 → 前 k 步的痕跡（舊的淡一點）→ 點與名字 →
   這一步正在用的工具 → 量測結果 → 步驟列。
   -------------------------------------------------------------------------- */
function cgRender(ctx, o) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  drawTitle(ctx, o.title, o.color);
  const k = o.k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 40, W, H - 152);
  ctx.clip();
  if (o.given) o.given(ctx);
  const cur = o.steps[k - 1];
  // 直尺墊在痕跡底下：它只是表示「這一步用直尺」，不能蓋住畫出來的線
  if (cur.ruler) cgRuler(ctx, cur.ruler[0], cur.ruler[1]);
  for (let i = 0; i < k; i++) {
    const s = o.steps[i];
    if (!s.draw) continue;
    ctx.save();
    ctx.globalAlpha = (i === k - 1) ? 1 : 0.78;
    s.draw(ctx);
    ctx.restore();
  }
  const pts = (o.pts || []).filter(q => q && q.s <= k);
  pts.forEach(q => cgDot(ctx, q.p, q.c || CG_PAL.ink));
  pts.forEach(q => { if (q.n) cgLabel(ctx, q.p, q.n, q.c || CG_PAL.ink, q.dx || 0, q.dy == null ? -18 : q.dy); });
  if (cur.compass) cgCompass(ctx, cur.compass.c, cur.compass.r, cur.compass.ang, cur.compass.label);
  ctx.restore();
  if (o.measure) cgMeasure(ctx, o.measure[0], o.measure[1]);
  cgBand(ctx, k, o.steps.length, cur.tool, cur.text);
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示
   -------------------------------------------------------------------------- */
function cgSteps(prefix, st, draw) {
  const prev = hbEl(prefix + '-prev'), next = hbEl(prefix + '-next'), all = hbEl(prefix + '-all');
  if (prev) prev.addEventListener('click', () => { st.k -= 1; draw(); });
  if (next) next.addEventListener('click', () => { st.k += 1; draw(); });
  if (all) all.addEventListener('click', () => { st.k = 99; draw(); });
}

function cgSync(prefix, st, n) {
  st.k = clamp(st.k, 1, n);
  const prev = hbEl(prefix + '-prev'), next = hbEl(prefix + '-next'), all = hbEl(prefix + '-all');
  const counter = hbEl(prefix + '-step');
  if (counter) counter.textContent = `${st.k} / ${n}`;
  if (prev) prev.disabled = (st.k <= 1);
  if (next) next.disabled = (st.k >= n);
  if (all) all.disabled = (st.k >= n);
}

/* ==========================================================================
   相似形工具（dk*）：5-1-3 寫的，5-1-4 也用，抽出來共用
     幾何一律先在「數學座標」（單位長、y 朝上）算好，再由 dkView／dkView2
     等比例放進畫布（y 翻成朝下）。dkTriSides／dkTriAngles 回傳數學座標。
     dkRich：一行混排的字，[AB] 畫成上加橫線的線段名、{n/d} 畫成直式分數、
     `…` 照原樣直立、英文字母自動斜體（AA、SAS、sin、cos、tan 等直立）。
   配色：標籤底色與點的外圈由頁面在 canvas.js 開頭呼叫一次 dkUsePalette()
   登記（共用檔不放主題色）；其餘顏色一律由呼叫端傳入。
   ========================================================================== */
let DKR_PAL = { tagBg: 'rgba(15, 23, 42, 0.88)', rim: 'rgba(15, 23, 42, 0.9)' };

function dkUsePalette(p) {
  DKR_PAL = Object.assign({}, DKR_PAL, p);
}

// 數學座標（y 朝上）的小工具
function dkDir(deg) { return hbV(Math.cos(deg * HB_RAD), Math.sin(deg * HB_RAD)); }
function dkAdd(P, v, s) { return hbV(P.x + v.x * s, P.y + v.y * s); }
function dkScale(O, P, k) { return hbV(O.x + (P.x - O.x) * k, O.y + (P.y - O.y) * k); }
function dkLen(P, Q) { return Math.hypot(P.x - Q.x, P.y - Q.y); }
function dkRot(P, C, deg) {
  const c = Math.cos(deg * HB_RAD), s = Math.sin(deg * HB_RAD);
  const x = P.x - C.x, y = P.y - C.y;
  return hbV(C.x + x * c - y * s, C.y + x * s + y * c);
}

// 把一組數學座標點等比例放進 box（y 翻成朝下），回傳 { k, P(p) }
function dkView(pts, box) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(box.w / Math.max(x1 - x0, 1e-6), box.h / Math.max(y1 - y0, 1e-6));
  const ox = box.x + (box.w - (x1 - x0) * k) / 2, oy = box.y + (box.h - (y1 - y0) * k) / 2;
  return { k, P: p => hbV(ox + (p.x - x0) * k, oy + (y1 - p.y) * k) };
}

// 兩組點用同一個比例尺，各自置中在自己的 box 裡
function dkView2(ptsL, boxL, ptsR, boxR) {
  const ext = pts => {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const a = ext(ptsL), b = ext(ptsR);
  const k = Math.min(boxL.w / Math.max(a.x1 - a.x0, 1e-6), boxL.h / Math.max(a.y1 - a.y0, 1e-6),
                     boxR.w / Math.max(b.x1 - b.x0, 1e-6), boxR.h / Math.max(b.y1 - b.y0, 1e-6));
  const mk = (e, box) => {
    const ox = box.x + (box.w - (e.x1 - e.x0) * k) / 2, oy = box.y + (box.h - (e.y1 - e.y0) * k) / 2;
    return p => hbV(ox + (p.x - e.x0) * k, oy + (e.y1 - p.y) * k);
  };
  return { k, L: mk(a, boxL), R: mk(b, boxR) };
}

// 由三邊作三角形（數學座標）：BC = a、CA = b、AB = c；B 在原點、C 在右、A 在上
function dkTriSides(a, b, c) {
  const x = (c * c + a * a - b * b) / (2 * a);
  const y = Math.sqrt(Math.max(c * c - x * x, 0));
  return { A: hbV(x, y), B: hbV(0, 0), C: hbV(a, 0) };
}

// 由兩角作三角形：BC = a、∠B、∠C（度）
function dkTriAngles(a, B, C) {
  const A = 180 - B - C;
  const c = a * Math.sin(C * HB_RAD) / Math.sin(A * HB_RAD);
  return { A: dkAdd(hbV(0, 0), dkDir(B), c), B: hbV(0, 0), C: hbV(a, 0) };
}

/* --------------------------------------------------------------------------
   dkRich：一行混排的字
     [AB]     上面加一條橫線的線段名（斜體）
     {n/d}    直式分數
     `AA`     反引號裡照原樣、直立（性質名稱用）
     英文字母 自動斜體（後面的 ' 一起算）
   parts 是 [[字串, 顏色], …]；超過 maxW 會自動縮字。
   -------------------------------------------------------------------------- */
const DKR_UPRIGHT = ['AA', 'AAA', 'SAS', 'SSS', 'SSA', 'ASA', 'sin', 'cos', 'tan'];

function dkTok(str, color) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ k: 'up', s: buf, c: color }); buf = ''; } };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '[') {
      const j = str.indexOf(']', i);
      flush(); out.push({ k: 'ov', s: str.slice(i + 1, j), c: color }); i = j; continue;
    }
    if (ch === '{') {
      const j = str.indexOf('}', i);
      const p = str.slice(i + 1, j).split('/');
      flush(); out.push({ k: 'fr', n: p[0], d: p[1], c: color }); i = j; continue;
    }
    if (ch === '`') {
      const j = str.indexOf('`', i + 1);
      buf += str.slice(i + 1, j); i = j; continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      flush();
      let s = ch;
      while (i + 1 < str.length && /[A-Za-z']/.test(str[i + 1])) s += str[++i];
      // 性質名稱（AA、SAS、SSS、SSA）照原樣直立，不是變數
      if (DKR_UPRIGHT.indexOf(s) >= 0) { buf += s; continue; }
      out.push({ k: 'it', s, c: color });
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

function dkTokW(ctx, t, s) {
  if (t.k === 'fr') {
    ctx.font = f(700, s * 0.74);
    return Math.max(ctx.measureText(t.n).width, ctx.measureText(t.d).width) + 6;
  }
  ctx.font = t.k === 'up' ? f(700, s) : fi(700, s);
  return ctx.measureText(t.s).width + (t.k === 'up' ? 0 : 1.5);
}

function dkTokD(ctx, t, x, y, s) {
  ctx.fillStyle = t.c;
  ctx.textBaseline = 'middle';
  if (t.k === 'fr') {
    const w = dkTokW(ctx, t, s);
    ctx.font = f(700, s * 0.74);
    ctx.textAlign = 'center';
    ctx.fillText(t.n, x + w / 2, y - s * 0.44);
    ctx.fillText(t.d, x + w / 2, y + s * 0.5);
    ctx.fillRect(x + 1.5, y - 0.9, w - 3, 1.8);
    ctx.textAlign = 'left';
    return w;
  }
  ctx.font = t.k === 'up' ? f(700, s) : fi(700, s);
  ctx.textAlign = 'left';
  ctx.fillText(t.s, x, y);
  const w = ctx.measureText(t.s).width;
  if (t.k === 'ov') ctx.fillRect(x + 1.5, y - s * 0.72, w - 0.5, 1.7);
  return w + (t.k === 'up' ? 0 : 1.5);
}

function dkRich(ctx, parts, x, y, size, o) {
  const opt = o || {};
  const toks = [];
  parts.forEach(p => dkTok(p[0], p[1]).forEach(t => toks.push(t)));
  const maxW = opt.maxW || ctx.canvas.width - 28;
  ctx.save();
  let s = size;
  const width = () => toks.reduce((a, t) => a + dkTokW(ctx, t, s), 0);
  let w = width();
  while (w > maxW && s > 10) { s -= 0.5; w = width(); }
  let x0 = opt.align === 'left' ? x : x - w / 2;
  if (opt.bg) {
    ctx.fillStyle = DKR_PAL.tagBg;
    roundRect(ctx, x0 - 5, y - s * 0.78, w + 10, s * 1.56, 6);
    ctx.fill();
  }
  toks.forEach(t => { x0 += dkTokD(ctx, t, x0, y, s); });
  ctx.restore();
  return w;
}

// 置中的一行字（單色）
function dkRow(ctx, str, y, color, size) {
  return dkRich(ctx, [[str, color]], ctx.canvas.width / 2, y, size || 16);
}

// 圖上的小標籤：深色底、置中在 (x, y)
function dkTag(ctx, str, x, y, color, size) {
  return dkRich(ctx, [[str, color]], x, y, size || 14, { bg: true });
}

// 邊長標籤：放在 PQ 中點、往遠離 G 的那一側外推（開發約束 18）
function dkSideTag(ctx, P, Q, G, str, color, off, size) {
  const m = hbV((P.x + Q.x) / 2, (P.y + Q.y) / 2);
  const d = hbDist(P, Q) || 1;
  let nx = -(Q.y - P.y) / d, ny = (Q.x - P.x) / d;
  if ((m.x - G.x) * nx + (m.y - G.y) * ny < 0) { nx = -nx; ny = -ny; }
  const k = off || 18;
  dkTag(ctx, str, m.x + nx * k, m.y + ny * k, color, size || 14);
}

// 點名（深色描邊）
function dkName(ctx, P, text, color, dx, dy) {
  cgLabel(ctx, P, text, color, dx, dy, fi(800, 17));
}

// 實心點加深色外圈
function dkPt(ctx, P, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = DKR_PAL.rim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(P.x, P.y, r || 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 光源點（燈泡）：實心點加同色光暈。color 必填，給 '#rrggbb'
function dkLamp(ctx, P, color) {
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)).join(', ');
  ctx.save();
  const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, 22);
  g.addColorStop(0, `rgba(${rgb}, 0.55)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(P.x, P.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  dkPt(ctx, P, color, 6);
}

// ∠PVQ（取小於 180° 的那一側），90° 時畫直角記號
function dkAng(ctx, V, P, Q, r, color, o) {
  const a = hbHead(V, P), b = hbHead(V, Q);
  const d = ((b - a) % 360 + 360) % 360;
  let s0 = a, sw = d;
  if (d > 180) { s0 = b; sw = 360 - d; }
  const right = Math.abs(sw - 90) < 0.01;
  hbSector(ctx, V, s0, right ? 90 : sw, r, color, Object.assign({ right, alpha: 0.3 }, o || {}));
}

// 多邊形（畫布座標）
function dkPoly(ctx, pts, color, alpha, width, dash) {
  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2.8;
  ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}

// 頂點名一律推到圖形外側（由重心往外）
function dkNames(ctx, pts, names, color, dist) {
  const G = hbCentroid(pts);
  pts.forEach((p, i) => hbVLabel(ctx, p, G, names[i], color, dist || 17));
}

// 互動卡的滑桿列：依模式顯示或隱藏
function dkShow(ids, on) {
  ids.forEach(id => { const el = hbEl(id); if (el) el.style.display = on ? '' : 'none'; });
}

/* ==========================================================================
   圓工具（bk*）：5-2-1 寫的，5-2-2 也用，抽出來共用
     角度一律是數學方向角（度，逆時針、y 朝上），與 hb* 相同。
     bkRich 是 dkRich 的擴充版：多了 «AB»（上加一段弧的弧名）與 √12
     （根號後的數字加橫線），分數的上下位置也不同；兩者並存、不合併，
     免得改到 5-1-3／5-1-4 的畫面。點名、角記號、字寬直接用 dkName／
     dkAng／dkTokW（逐字相同）。
   配色：標籤底色與點的外圈由頁面在 canvas.js 開頭呼叫一次 bkUsePalette()
   登記（共用檔不放主題色）；其餘顏色一律由呼叫端傳入。
   ========================================================================== */
let BKR_PAL = { tagBg: 'rgba(15, 23, 42, 0.88)', rim: 'rgba(15, 23, 42, 0.9)' };

function bkUsePalette(p) {
  BKR_PAL = Object.assign({}, BKR_PAL, p);
}

// 由數學方向角（度，逆時針、y 朝上）畫圓弧：從 a0 逆時針走到 a1（a1 > a0）
function bkArc(ctx, C, R, a0, a1, color, w, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 3;
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(C.x, C.y, R, -a0 * HB_RAD, -a1 * HB_RAD, true);
  ctx.stroke();
  ctx.restore();
}

// 扇形（含圓心）或弓形（不含圓心，弦封口）的填色
function bkFill(ctx, C, R, a0, a1, color, alpha, withCenter) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (withCenter) ctx.moveTo(C.x, C.y);
  ctx.arc(C.x, C.y, R, -a0 * HB_RAD, -a1 * HB_RAD, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 整個圓（車輪的外圈）
function bkCircle(ctx, C, R, color, w, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w || 3;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(C.x, C.y, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 實心點加深色外圈
function bkPt(ctx, P, color, r) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = BKR_PAL.rim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(P.x, P.y, r || 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 隱藏或顯示一整列滑桿
function bkShow(id, on) {
  const el = hbEl(id);
  if (el) el.style.display = on ? '' : 'none';
}

// 有理數 × π 的 LaTeX 與畫布文字
function bkPiTex(q) {
  const [n, d] = reduce(q[0], q[1]);
  if (n === 0) return '0';
  if (d === 1) return (n === 1 ? '' : String(n)) + '\\pi';
  return `\\frac{${n}}{${d}}\\pi`;
}

function bkPiTxt(q) {
  const [n, d] = reduce(q[0], q[1]);
  if (n === 0) return '0';
  if (d === 1) return (n === 1 ? '' : String(n)) + 'π';
  return `{${n}/${d}}π`;
}

// 度數（有理數）的畫布文字
function bkDegTxt(q) {
  const [n, d] = reduce(q[0], q[1]);
  return d === 1 ? `${n}°` : `{${n}/${d}}°`;
}

const BKR_UPRIGHT = ['RHS', 'SAS', 'SSS'];

function bkTok(str, color) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ k: 'up', s: buf, c: color }); buf = ''; } };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '[' || ch === '«') {
      const j = str.indexOf(ch === '[' ? ']' : '»', i);
      flush(); out.push({ k: ch === '[' ? 'ov' : 'arc', s: str.slice(i + 1, j), c: color }); i = j; continue;
    }
    if (ch === '{') {
      const j = str.indexOf('}', i);
      const p = str.slice(i + 1, j).split('/');
      flush(); out.push({ k: 'fr', n: p[0], d: p[1], c: color }); i = j; continue;
    }
    if (ch === '`') {
      const j = str.indexOf('`', i + 1);
      buf += str.slice(i + 1, j); i = j; continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      flush();
      let s = ch;
      while (i + 1 < str.length && /[A-Za-z']/.test(str[i + 1])) s += str[++i];
      if (BKR_UPRIGHT.indexOf(s) >= 0) { buf += s; continue; }
      out.push({ k: 'it', s, c: color });
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

// 直立文字裡的根號：√ 後面連續的數字上加一條橫線（先畫字、再補線）
function bkVinc(ctx, s, x, y, size) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '√') continue;
    let j = i + 1;
    while (j < s.length && /[0-9]/.test(s[j])) j++;
    if (j === i + 1) continue;
    const x0 = x + ctx.measureText(s.slice(0, i + 1)).width - size * 0.06;
    const x1 = x + ctx.measureText(s.slice(0, j)).width + 1;
    ctx.fillRect(x0, y - size * 0.62, x1 - x0, Math.max(1.3, size * 0.08));
  }
}

function bkTokD(ctx, t, x, y, s) {
  ctx.fillStyle = t.c;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (t.k === 'fr') {
    const w = dkTokW(ctx, t, s);
    const fs = s * 0.74;
    ctx.font = f(700, fs);
    const wn = ctx.measureText(t.n).width, wd = ctx.measureText(t.d).width;
    const xn = x + (w - wn) / 2, xd = x + (w - wd) / 2;
    ctx.fillText(t.n, xn, y - s * 0.46);
    bkVinc(ctx, t.n, xn, y - s * 0.46, fs);
    ctx.fillText(t.d, xd, y + s * 0.52);
    bkVinc(ctx, t.d, xd, y + s * 0.52, fs);
    ctx.fillRect(x + 1.5, y - 0.9, w - 3, 1.8);
    return w;
  }
  ctx.font = t.k === 'up' ? f(700, s) : fi(700, s);
  ctx.fillText(t.s, x, y);
  const w = ctx.measureText(t.s).width;
  if (t.k === 'up') bkVinc(ctx, t.s, x, y, s);
  if (t.k === 'ov') ctx.fillRect(x + 1.5, y - s * 0.72, w - 0.5, 1.7);
  if (t.k === 'arc') {
    ctx.save();
    ctx.strokeStyle = t.c;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    const cx = x + w / 2 + 1, rr = w / 2 + 2;
    ctx.ellipse(cx, y - s * 0.62, rr, s * 0.22, 0, Math.PI, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
  return w + (t.k === 'up' ? 0 : 1.5);
}

function bkRich(ctx, parts, x, y, size, o) {
  const opt = o || {};
  const toks = [];
  parts.forEach(p => bkTok(p[0], p[1]).forEach(t => toks.push(t)));
  const maxW = opt.maxW || ctx.canvas.width - 28;
  ctx.save();
  let s = size;
  const width = () => toks.reduce((a, t) => a + dkTokW(ctx, t, s), 0);
  let w = width();
  while (w > maxW && s > 10) { s -= 0.5; w = width(); }
  let x0 = opt.align === 'left' ? x : x - w / 2;
  if (opt.bg) {
    ctx.fillStyle = BKR_PAL.tagBg;
    roundRect(ctx, x0 - 5, y - s * 0.8, w + 10, s * 1.6, 6);
    ctx.fill();
  }
  toks.forEach(t => { x0 += bkTokD(ctx, t, x0, y, s); });
  ctx.restore();
  return w;
}

// 置中的一行字（單色）
function bkRow(ctx, str, y, color, size) {
  return bkRich(ctx, [[str, color]], ctx.canvas.width / 2, y, size || 16);
}

// 圖上的小標籤：深色底、置中在 (x, y)
function bkTag(ctx, str, x, y, color, size) {
  return bkRich(ctx, [[str, color]], x, y, size || 14, { bg: true });
}
