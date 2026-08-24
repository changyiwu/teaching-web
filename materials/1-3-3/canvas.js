document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initStepsCanvas();
  initTranslateCanvas();
  initAllocCanvas();
  initDiscountCanvas();
  initFigureCanvas();
  initAgeCanvas();
  initVerdictCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 3-3 (14 Quizzes)
  const answers = {
    '3-3-1-1': 'B', // 3x×0.8 - x = 42 → x = 30
    '3-3-1-2': 'C', // 解得出來不代表符合情境
    '3-3-2-1': 'A', // x-12 = 5x+4 → x = -4
    '3-3-2-2': 'B', // 3(x-25)+2x = 275 → x = 70
    '3-3-3-1': 'C', // 8x+5 = 9x-7 → x = 12
    '3-3-3-2': 'B', // 7x+3 = 6(x+2) → x = 9
    '3-3-4-1': 'B', // 0.7x = x-450 → x = 1500
    '3-3-4-2': 'B', // 0.8x = 0.5x+90 → x = 300
    '3-3-5-1': 'C', // 梯形下底 10 公分
    '3-3-5-2': 'B', // 長方形寬 8 公分
    '3-3-6-1': 'B', // x+16 = 3(x+2) → x = 5
    '3-3-6-2': 'B', // 66-x = 3(x+6) → x = 12
    '3-3-7-1': 'B', // x/80 = (x-100)/60 → x = 400
    '3-3-7-2': 'C'  // 45x = 112，杯數不是正整數，不合理
  };

  quizCards.forEach(card => {
    const quizId = card.getAttribute('data-quiz');
    const radios = card.querySelectorAll('input[type="radio"]');
    const btn = card.querySelector('.btn-check-ans');
    const explanation = card.querySelector('.explanation-box');
    const expTitle = card.querySelector('.explanation-title');
    const optionLabels = card.querySelectorAll('.option-label');

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        btn.removeAttribute('disabled');
        optionLabels.forEach(lbl => lbl.classList.remove('selected'));
        radio.closest('.option-label').classList.add('selected');
      });
    });

    btn.addEventListener('click', () => {
      const selectedRadio = card.querySelector('input[type="radio"]:checked');
      if (!selectedRadio) return;

      const userAns = selectedRadio.value;
      const correctAns = answers[quizId];
      const isCorrect = userAns === correctAns;

      radios.forEach(r => r.setAttribute('disabled', true));
      btn.setAttribute('disabled', true);
      btn.textContent = '已完成作答';

      optionLabels.forEach(lbl => {
        const rad = lbl.querySelector('input[type="radio"]');
        if (rad.value === correctAns) {
          lbl.classList.add('correct');
        } else if (rad.checked) {
          lbl.classList.add('incorrect');
        }
      });

      explanation.style.display = 'block';
      if (isCorrect) {
        explanation.className = 'explanation-box correct-feedback';
        expTitle.innerHTML = `<i class="fa-solid fa-circle-check"></i> 回答正確！`;
      } else {
        explanation.className = 'explanation-box incorrect-feedback';
        expTitle.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> 回答錯誤！正確答案是 (${correctAns})`;
      }
      typeset([explanation]);
    });
  });
}


/* ==========================================================================
   2. Helper functions
   ========================================================================== */
const FONT = '"Outfit", "Noto Sans TC", sans-serif';

// 復古偵探事務所配色：檔案琥珀、天青、翠綠、紫水晶、警示橙、玫瑰銅
const C_BRASS = '#fcd34d';
const C_SKY = '#7dd3fc';
const C_JADE = '#6ee7b7';
const C_AMETHYST = '#e9d5ff';
const C_EMBER = '#fdba74';
const C_ROSE = '#f9a8d4';

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

/* ==========================================================================
   3. 本節專屬繪圖：軟木線索板、卷宗與印章
   ========================================================================== */

// 復古偵探事務所配色（與 style.css 的七個重點一致）
const C_TEAL = '#5eead4';
const C_VIOLET = '#d8b4fe';
const C_COPPER = '#fda4af';

// 軟木板底色
const CORK = 'rgba(120, 78, 42, 0.30)';
const CORK_LINE = 'rgba(180, 130, 80, 0.35)';
const STRING = '#f87171';

// 一段自動縮到指定寬度以內的置中文字
function drawFitText(ctx, text, cx, y, maxW, size, color, weight, align) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  let s = size;
  ctx.font = f(weight || 700, s);
  while (ctx.measureText(text).width > maxW && s > 9) {
    s -= 1;
    ctx.font = f(weight || 700, s);
  }
  ctx.fillText(text, cx, y);
  ctx.restore();
  ctx.textAlign = 'left';
  return s;
}

// 軟木板背景：底色加上細微的木屑點
function drawCork(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = CORK;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = CORK_LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = 'rgba(215, 170, 120, 0.13)';
  // 固定的偽隨機點，每次重畫位置一樣
  let seed = 7;
  for (let i = 0; i < 70; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const px = x + (seed % 1000) / 1000 * w;
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const py = y + (seed % 1000) / 1000 * h;
    ctx.beginPath();
    ctx.arc(px, py, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 一顆紅色圖釘
function drawPin(ctx, cx, cy, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.arc(cx + 1, cy + 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color || STRING;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 一張釘在板上的證物卡
function drawCard(ctx, x, y, w, h, color, active) {
  ctx.save();
  ctx.fillStyle = active ? 'rgba(248, 245, 235, 0.10)' : 'rgba(148, 163, 184, 0.05)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = active ? color : 'rgba(148, 163, 184, 0.30)';
  ctx.lineWidth = active ? 2 : 1.5;
  if (!active) ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.restore();
}

// 兩點之間的紅線（略帶下垂）
function drawString(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = STRING;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2 - 10, (y1 + y2) / 2 + 8, x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 一條水平長條（長度與數值成正比，開發約束 17）
function drawBar(ctx, x, y, len, h, color, label, valueText) {
  ctx.save();
  const L = Math.max(0, len);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.28;
  roundRect(ctx, x, y, L, h, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, L, h, 6);
  ctx.stroke();
  if (label) {
    ctx.fillStyle = INK;
    ctx.font = f(700, 14);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x - 8, y + h / 2);
  }
  if (valueText) {
    ctx.fillStyle = color;
    ctx.font = f(800, 15);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(valueText, x + L + 8, y + h / 2);
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

/* ==========================================================================
   重點 1：辦案流程線索板
   一樁案件、四張卡片（設、列、解、答），按下一步依序釘上並用紅線串起。
   ========================================================================== */
function initStepsCanvas() {
  const canvas = document.getElementById('canvas-steps');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('st-feedback');
  const group = document.getElementById('st-case-group');
  const btnNext = document.getElementById('st-next');
  const btnPrev = document.getElementById('st-prev');
  const btnReset = document.getElementById('st-reset');
  const C = C_BRASS;

  const STEP_NAMES = ['1 設未知數', '2 列方程式', '3 解方程式', '4 寫答案'];

  const CASES = [
    {
      name: '汽水促銷案',
      clue: '買 2 瓶打 9 折，只比買 1 瓶多 16 元',
      ask: '求：一瓶汽水的原價是多少元？',
      cards: [
        '設每瓶汽水的原價為 x 元',
        '2x × 0.9 − x = 16',
        '1.8x − x = 16，0.8x = 16，x = 20',
        '一瓶汽水的原價為 20 元'
      ],
      notes: [
        '不知道的東西先給它一個代號，<strong>連單位一起寫</strong>：設每瓶原價 \\(x\\) 元。',
        '找出相等關係：買 \\(2\\) 瓶的九折價 \\(2x \\times 0.9\\) 比買 \\(1\\) 瓶的 \\(x\\) 多 \\(16\\) 元，所以 \\(2x \\times 0.9 - x = 16\\)。',
        '先算 \\(2 \\times 0.9 = 1.8\\)，合併同類項得 \\(0.8x = 16\\)，兩邊同除以 \\(0.8\\) 得 \\(x = 20\\)。',
        '題目問的是「一瓶原價多少」，答案就是 \\(20\\) 元。<strong>價錢是正數，合理</strong>，可以結案。'
      ]
    },
    {
      name: '甲數之謎',
      clue: '甲數的 3 倍加 1，等於甲數加 9',
      ask: '求：甲數是多少？',
      cards: [
        '設甲數為 x',
        '3x + 1 = x + 9',
        '3x − x = 9 − 1，2x = 8，x = 4',
        '甲數為 4'
      ],
      notes: [
        '題目問甲數，就<strong>直接設甲數為 \\(x\\)</strong>。',
        '照句子順序翻譯：「甲數的 \\(3\\) 倍」是 \\(3x\\)、「加 \\(1\\)」是 \\(+1\\)、「等於」是 \\(=\\)、「甲數加 \\(9\\)」是 \\(x+9\\)。',
        '含 \\(x\\) 的移到左邊、常數移到右邊：\\(3x-x=9-1\\)，得 \\(2x=8\\)，\\(x=4\\)。',
        '代回檢驗：\\(3 \\times 4+1=13\\)，\\(4+9=13\\)，兩邊相等，甲數為 \\(4\\)。'
      ]
    },
    {
      name: '超市帳單案',
      clue: '1 盒蛋比 1 盒豆腐貴 60 元，1 盒蛋和 4 盒豆腐共付 210 元',
      ask: '求：1 盒蛋和 1 盒豆腐各多少元？',
      cards: [
        '設 1 盒豆腐 x 元，則 1 盒蛋 (x + 60) 元',
        '(x + 60) + 4x = 210',
        '5x + 60 = 210，5x = 150，x = 30',
        '豆腐 30 元，蛋 30 + 60 = 90 元'
      ],
      notes: [
        '<strong>設比較基準（比較便宜的豆腐）為 \\(x\\)</strong>，蛋就寫成 \\(x+60\\)，式子裡只會出現加法。',
        '相等關係是總金額：\\(1\\) 盒蛋 \\((x+60)\\) 加上 \\(4\\) 盒豆腐 \\(4x\\)，等於 \\(210\\) 元。',
        '去括號後合併：\\(5x+60=210\\)，兩邊同減 \\(60\\) 得 \\(5x=150\\)，同除以 \\(5\\) 得 \\(x=30\\)。',
        '題目問<strong>兩個</strong>價錢，只寫 \\(x=30\\) 只答了一半，蛋還要再算 \\(30+60=90\\) 元。'
      ]
    }
  ];

  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawCork(ctx, 10, 10, w - 20, canvas.height - 20);
    drawTitle(ctx, c.name, C);

    // 案件線索紙條：上排是已知條件，下排是這樁案子要問的東西
    drawPanel(ctx, 32, 42, w - 64, 54, C, 0.10);
    drawFitText(ctx, c.clue, w / 2, 60, w - 96, 15, '#e2e8f0', 700);
    drawFitText(ctx, c.ask, w / 2, 82, w - 96, 14, C, 800);

    // 四張步驟卡
    const cardX = 44, cardW = w - 88, cardH = 68, gap = 8, top = 104;
    const pinXs = [];
    for (let i = 0; i < 4; i++) {
      const y = top + i * (cardH + gap);
      const on = i <= step;
      drawCard(ctx, cardX, y, cardW, cardH, C, on);
      const pinX = cardX + 22, pinY = y + 16;
      pinXs.push({ x: pinX, y: pinY });
      if (on) {
        drawPin(ctx, pinX, pinY, STRING);
        ctx.fillStyle = C;
        ctx.font = f(800, 14);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(STEP_NAMES[i], pinX + 16, pinY);
        drawFitText(ctx, c.cards[i], cardX + cardW / 2, y + 46, cardW - 36, 18, '#f1f5f9', 750);
      } else {
        drawPin(ctx, pinX, pinY, 'rgba(148, 163, 184, 0.45)');
        ctx.fillStyle = DIM;
        ctx.font = f(800, 14);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(STEP_NAMES[i], pinX + 16, pinY);
        drawFitText(ctx, '？', cardX + cardW / 2, y + 46, cardW - 36, 20, DIM, 800);
      }
      ctx.textAlign = 'left';
    }

    // 紅線把已釘上的卡片串起來
    for (let i = 0; i < step; i++) {
      drawString(ctx, pinXs[i].x, pinXs[i].y, pinXs[i + 1].x, pinXs[i + 1].y);
      drawPin(ctx, pinXs[i].x, pinXs[i].y, STRING);
      drawPin(ctx, pinXs[i + 1].x, pinXs[i + 1].y, STRING);
    }

    if (fb) {
      const done = step === 3;
      fb.innerHTML = wrapFeedback(
        `<span style="color:${done ? OK_COLOR : C}"><strong>${STEP_NAMES[step]}</strong></span>：${c.notes[step]}` +
        (done ? '' : '<br>按<strong>下一步</strong>釘上下一張卡片。')
      );
      typeset([fb]);
    }
    if (btnPrev) btnPrev.disabled = (step === 0);
    if (btnNext) btnNext.disabled = (step === 3);
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < 3) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：敘述翻譯線索卡
   中文句子逐段揭露，右側同步拼出對應的算式片段，最後組成整條式子。
   ========================================================================== */
function initTranslateCanvas() {
  const canvas = document.getElementById('canvas-translate');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('tr-feedback');
  const group = document.getElementById('tr-sent-group');
  const btnNext = document.getElementById('tr-next');
  const btnReset = document.getElementById('tr-reset');
  const C = C_TEAL;

  const SENTS = [
    {
      full: '甲數的 3 倍加 1，等於甲數加 9',
      segs: [['設甲數為', 'x'], ['甲數的 3 倍', '3x'], ['加 1', '+ 1'], ['等於', '='], ['甲數加 9', 'x + 9']],
      result: '3x + 1 = x + 9',
      tip: '「的 \\(3\\) 倍」變成 \\(\\times 3\\)、「加」變成 \\(+\\)、「等於」變成 \\(=\\)。<strong>一個詞換一個符號</strong>。'
    },
    {
      full: '乙數減 16，等於乙數的 4 倍少 1',
      segs: [['設乙數為', 'x'], ['乙數減 16', 'x − 16'], ['等於', '='], ['乙數的 4 倍', '4x'], ['少 1', '− 1']],
      result: 'x − 16 = 4x − 1',
      tip: '「少 \\(1\\)」和「減 \\(1\\)」是同一件事，都翻成 \\(-1\\)。解出來 \\(x=-5\\)，<strong>數字問題的答案可以是負數</strong>。'
    },
    {
      full: '1 盒蛋比 1 盒豆腐貴 60 元',
      segs: [['設 1 盒豆腐', 'x 元'], ['蛋比豆腐貴 60', 'x + 60'], ['所以 1 盒蛋', '(x + 60) 元']],
      result: '蛋的價錢 = x + 60',
      tip: '「\\(A\\) 比 \\(B\\) 貴 \\(60\\)」代表 \\(A\\) 比較大，所以 \\(A=B+60\\)。<strong>設比較基準（便宜的那個）為 \\(x\\)</strong> 最省事。'
    },
    {
      full: '1 盒蛋比豆腐貴 60 元；1 盒蛋和 4 盒豆腐共付 210 元',
      segs: [['設 1 盒豆腐為', 'x 元'], ['1 盒蛋（貴 60）', '(x + 60)'],
             ['和 4 盒豆腐', '+ 4x'], ['共付 210 元', '= 210']],
      result: '(x + 60) + 4x = 210',
      tip: '費用問題的相等關係就是<strong>總金額</strong>：每一項的單價乘數量加起來，等於實付的錢。'
    },
    {
      full: '全票每張比學生票貴 150 元',
      segs: [['設 1 張學生票', 'x 元'], ['全票比學生票貴 150', 'x + 150'], ['所以 1 張全票', '(x + 150) 元']],
      result: '全票 = x + 150',
      tip: '跟上面的蛋與豆腐是<strong>同一個句型</strong>：先設便宜的那個，貴的寫成 \\(x\\ +\\) 差額。'
    },
    {
      full: '全票比學生票貴 150 元；買 2 張全票與 3 張學生票共付 3550 元',
      segs: [['設 1 張學生票為', 'x 元'], ['2 張全票（貴 150）', '2(x + 150)'],
             ['3 張學生票', '+ 3x'], ['共付 3550 元', '= 3550']],
      result: '2(x + 150) + 3x = 3550',
      tip: '\\(2\\) 張全票要寫成 \\(2(x+150)\\)——<strong>括號不能省</strong>，否則只有 \\(x\\) 被乘到 \\(2\\)。解得 \\(x=650\\)。'
    }
  ];

  let idx = 0, shown = 1;

  function draw() {
    const s = SENTS[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawCork(ctx, 10, 10, w - 20, canvas.height - 20);
    drawTitle(ctx, '敘述翻譯線索卡', C);

    // 原句
    drawPanel(ctx, 30, 44, w - 60, 42, C, 0.10);
    drawFitText(ctx, s.full, w / 2, 65, w - 92, 16, '#e2e8f0', 750);

    // 逐段對照
    const rowH = 42, gap = 6, top = 100;
    const lw = 218, rw = 168, lx = 42, rx = w - 42 - rw;
    for (let i = 0; i < s.segs.length; i++) {
      const y = top + i * (rowH + gap);
      const on = i < shown;
      drawCard(ctx, lx, y, lw, rowH, C, on);
      drawCard(ctx, rx, y, rw, rowH, C, on);
      if (on) {
        drawFitText(ctx, s.segs[i][0], lx + lw / 2, y + rowH / 2, lw - 18, 15, '#e2e8f0', 700);
        drawArrow(ctx, lx + lw + 10, y + rowH / 2, rx - 10, y + rowH / 2, STRING, 2);
        drawFitText(ctx, s.segs[i][1], rx + rw / 2, y + rowH / 2, rw - 18, 19, C, 800);
      } else {
        drawFitText(ctx, '？', lx + lw / 2, y + rowH / 2, lw - 18, 17, DIM, 800);
        drawFitText(ctx, '？', rx + rw / 2, y + rowH / 2, rw - 18, 17, DIM, 800);
      }
    }

    // 組合出來的完整算式
    const done = shown >= s.segs.length;
    const resY = top + s.segs.length * (rowH + gap) + 22;
    if (done) {
      drawPanel(ctx, 30, resY - 22, w - 60, 44, OK_COLOR, 0.12);
      drawFitText(ctx, s.result, w / 2, resY, w - 84, 22, OK_COLOR, 800);
    } else {
      drawFitText(ctx, '把每一段翻完，整條式子就出來了', w / 2, resY, w - 84, 14, MUTED, 600);
    }

    if (fb) {
      fb.innerHTML = wrapFeedback(done
        ? `翻譯完成：<strong style="color:${OK_COLOR}">${s.result}</strong>。${s.tip}`
        : `目前翻到第 <strong>${shown}</strong> 段（共 ${s.segs.length} 段）。按<strong>下一段</strong>繼續。`);
      typeset([fb]);
    }
    if (btnNext) btnNext.disabled = done;
  }

  bindPickGroup(group, 'data-s', v => { idx = parseInt(v, 10); shown = 1; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => {
    if (shown < SENTS[idx].segs.length) { shown++; draw(); }
  });
  if (btnReset) btnReset.addEventListener('click', () => { shown = 1; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：兩種分法盤點台
   同一個總數用兩種分法各算一次，長條長度與數值成正比，相等時發光。
   ========================================================================== */
function initAllocCanvas() {
  const canvas = document.getElementById('canvas-alloc');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('al-feedback');
  const group = document.getElementById('al-case-group');
  const slider = document.getElementById('al-x-slider');
  const valOut = document.getElementById('al-x-val');
  const xLabel = document.getElementById('al-x-label');
  const C = C_SKY;

  const CASES = [
    {
      name: '新生編班案', unitName: '班級數', unit: '班', totalName: '新生人數',
      clue: '每班 25 人會多出 10 人；每班 27 人則不足 20 人',
      a: 25, m: 10, b: 27, n: -20, sol: 15, min: 5, max: 25,
      t1: '每班 25 人，多出 10 人', t2: '每班 27 人，不足 20 人',
      e1: '25x + 10', e2: '27x − 20',
      tex: '25x + 10 = 27x - 20'
    },
    {
      name: '糖果平分案', unitName: '學生數', unit: '位', totalName: '原有糖果數',
      clue: '每人 7 顆會多出 4 顆；再加 44 顆後每人 9 顆恰好分完',
      a: 7, m: 4, b: 9, n: -44, sol: 24, min: 15, max: 35,
      t1: '每人 7 顆，多出 4 顆', t2: '每人 9 顆（其中 44 顆是後來加的）',
      e1: '7x + 4', e2: '9x − 44',
      tex: '7x + 4 = 9x - 44'
    },
    {
      name: '餅乾分裝案', unitName: '袋數', unit: '袋', totalName: '餅乾片數',
      clue: '每袋 8 片會多出 5 片；每袋 9 片則不足 7 片',
      a: 8, m: 5, b: 9, n: -7, sol: 12, min: 5, max: 20,
      t1: '每袋 8 片，多出 5 片', t2: '每袋 9 片，不足 7 片',
      e1: '8x + 5', e2: '9x − 7',
      tex: '8x + 5 = 9x - 7'
    }
  ];

  let idx = 0, xv = CASES[0].sol - 5;

  function syncSlider() {
    const c = CASES[idx];
    slider.min = c.min;
    slider.max = c.max;
    xv = clamp(xv, c.min, c.max);
    slider.value = xv;
    if (valOut) valOut.textContent = xv;
    if (xLabel) xLabel.textContent = c.unitName;
  }

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    const v1 = c.a * xv + c.m;
    const v2 = c.b * xv + c.n;
    const equal = v1 === v2;
    const maxV = Math.max(c.a * c.max + c.m, c.b * c.max + c.n, 1);
    const barX = 128, barMaxW = w - barX - 68;
    const scale = barMaxW / maxV;

    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, c.name, C);
    wrapText(ctx, c.clue, w / 2, 56, w - 70, 19, MUTED, 14);

    // 兩種分法各算一次
    drawNote2(ctx, c.t1, 24, 100, C, 13);
    drawBar(ctx, barX, 112, v1 * scale, 34, C, c.e1, String(v1));
    drawNote2(ctx, c.t2, 24, 168, C_VIOLET, 13);
    drawBar(ctx, barX, 180, v2 * scale, 34, C_VIOLET, c.e2, String(v2));

    // 兩條的差
    ctx.save();
    ctx.strokeStyle = equal ? OK_COLOR : NO_COLOR;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(barX + v1 * scale, 112);
    ctx.lineTo(barX + v1 * scale, 232);
    ctx.moveTo(barX + v2 * scale, 180);
    ctx.lineTo(barX + v2 * scale, 232);
    ctx.stroke();
    ctx.restore();
    drawFitText(ctx,
      equal ? '兩種分法算出來的總數一樣' : `兩種分法差了 ${Math.abs(v1 - v2)}`,
      w / 2, 246, w - 60, 14, equal ? OK_COLOR : MUTED, 700);

    // 判定
    const chipW = 300;
    drawChip(ctx, w / 2 - chipW / 2, 268, chipW, 38,
      equal ? `${c.unitName} = ${xv} ${c.unit}，正是答案` : `${c.unitName} = ${xv} ${c.unit}，還不對`,
      equal ? OK_COLOR : NO_COLOR,
      equal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    // 方程式
    drawPanel(ctx, 30, 322, w - 60, 46, C, 0.09);
    drawFitText(ctx, `${c.e1} = ${c.e2}`, w / 2, 345, w - 84, 22, C, 800);

    if (fb) {
      fb.innerHTML = wrapFeedback(equal
        ? `\\(${c.tex}\\) 在 \\(x = ${xv}\\) 時兩邊都是 <strong>${v1}</strong>，${c.totalName}對得上，所以${c.unitName}是 <strong>${xv} ${c.unit}</strong>。`
        : `\\(x = ${xv}\\) 時，一邊算出 <strong>${v1}</strong>、另一邊算出 <strong>${v2}</strong>，同一批東西不可能有兩個總數，所以還不是答案。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => {
    idx = parseInt(v, 10);
    xv = Math.max(CASES[idx].min, CASES[idx].sol - 5);
    syncSlider();
    draw();
  });
  slider.addEventListener('input', () => {
    xv = parseInt(slider.value, 10);
    if (valOut) valOut.textContent = xv;
    draw();
  });
  syncSlider();
  draw();
}

/* ==========================================================================
   重點 4：價目吊牌推演器
   假設一個預算，看原售價與折後價怎麼跟著跑，折後價落在目標線上就是答案。
   ========================================================================== */
function initDiscountCanvas() {
  const canvas = document.getElementById('canvas-discount');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('di-feedback');
  const group = document.getElementById('di-case-group');
  const slider = document.getElementById('di-x-slider');
  const valOut = document.getElementById('di-x-val');
  const C = C_VIOLET;

  const CASES = [
    {
      name: '限量籃球鞋案', over: 1500, rate: 0.8, rateText: '8 折', under: 200, sol: 7000,
      clue: '原售價比預算多 1500 元；打 8 折後比預算少 200 元',
      tex: '(x + 1500) \\times 0.8 = x - 200'
    },
    {
      name: '遊戲機促銷案', over: 2000, rate: 0.75, rateText: '75 折', under: 100, sol: 6400,
      clue: '原售價比預算多 2000 元；打 75 折後比預算少 100 元',
      tex: '(x + 2000) \\times 0.75 = x - 100'
    }
  ];

  let idx = 0, xv = 4000;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    const listPrice = xv + c.over;
    const salePrice = listPrice * c.rate;
    const target = xv - c.under;
    const equal = Math.abs(salePrice - target) < 1e-6;

    const barX = 108, barMaxW = w - barX - 92;
    const maxMoney = 10000 + c.over;
    const scale = barMaxW / maxMoney;

    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, c.name, C);
    wrapText(ctx, c.clue, w / 2, 56, w - 70, 19, MUTED, 14);

    drawBar(ctx, barX, 96, xv * scale, 30, C_BRASS, '預算 x', String(xv));
    drawBar(ctx, barX, 146, listPrice * scale, 30, C, `原售價 x+${c.over}`, String(listPrice));
    drawBar(ctx, barX, 196, salePrice * scale, 30, equal ? OK_COLOR : NO_COLOR,
      `${c.rateText}後`, numStr(salePrice));

    // 目標線：預算 − 差額
    const tx = barX + target * scale;
    ctx.save();
    ctx.strokeStyle = OK_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(tx, 88);
    ctx.lineTo(tx, 244);
    ctx.stroke();
    ctx.restore();
    drawFitText(ctx, `目標：預算 − ${c.under} = ${numStr(target)}`, w / 2, 258, w - 60, 14, OK_COLOR, 700);

    const chipW = 320;
    drawChip(ctx, w / 2 - chipW / 2, 278, chipW, 38,
      equal ? `預算 = ${xv} 元，折後價正好落在目標線上` : `折後價還差目標 ${numStr(Math.abs(salePrice - target))} 元`,
      equal ? OK_COLOR : NO_COLOR,
      equal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    drawPanel(ctx, 30, 332, w - 60, 46, C, 0.09);
    drawFitText(ctx, `(x + ${c.over}) × ${c.rate} = x − ${c.under}`, w / 2, 355, w - 84, 21, C, 800);

    if (fb) {
      fb.innerHTML = wrapFeedback(equal
        ? `\\(${c.tex}\\) 在 \\(x = ${xv}\\) 時成立：原售價 <strong>${listPrice}</strong> 元，打${c.rateText}後是 <strong>${numStr(salePrice)}</strong> 元，正好比預算少 \\(${c.under}\\) 元。<strong>預算就是 ${xv} 元</strong>。`
        : `假設預算 \\(${xv}\\) 元：原售價 <strong>${listPrice}</strong> 元，打${c.rateText}後是 <strong>${numStr(salePrice)}</strong> 元，但目標是 <strong>${numStr(target)}</strong> 元，${salePrice > target ? '折後價太高' : '折後價太低'}，繼續調整。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  slider.addEventListener('input', () => {
    xv = parseInt(slider.value, 10);
    if (valOut) valOut.textContent = xv;
    draw();
  });
  draw();
}

/* ==========================================================================
   重點 5：藍圖面積比對台
   長方形 ACEF 的面積，整體算一次、拆成四塊三角形算一次，相等時就找到 x。
   ========================================================================== */
function initFigureCanvas() {
  const canvas = document.getElementById('canvas-figure');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('fg-feedback');
  const slider = document.getElementById('fg-x-slider');
  const valOut = document.getElementById('fg-x-val');
  const C = C_JADE;

  // 固定的已知邊長：AF = 8、AB = 5、CD = 4、DE = 4、△BDF = 18
  const AF = 8, AB = 5, CD = 4, DE = 4, BDF = 18;
  let xv = 1;

  function draw() {
    const w = canvas.width;
    const AC = AB + xv;
    const whole = AF * AC;
    const t1 = 0.5 * AB * AF;          // △ABF
    const t2 = 0.5 * xv * CD;          // △BCD
    const t3 = 0.5 * DE * AC;          // △DEF
    const parts = t1 + t2 + t3 + BDF;
    const equal = Math.abs(whole - parts) < 1e-9;

    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '藍圖面積比對台', C);

    // 長方形 ACEF：A 左上、C 右上、E 右下、F 左下
    // unit 固定，x 取最大值 6 時右緣仍在 288px 以內，右側標示與圖例都放得下。
    // oy 留 86px：頂邊上方要疊兩排字（oy-13 是頂點 A/B/C、oy-30 是邊長 5 與 x），
    // 而且 oy-30 要離標題夠遠，否則 x 會看起來像標題的副標。
    const unit = 22;
    const ox = 46, oy = 86;
    const rw = AC * unit, rh = AF * unit;
    const A = { x: ox, y: oy };
    const Cp = { x: ox + rw, y: oy };
    const E = { x: ox + rw, y: oy + rh };
    const F = { x: ox, y: oy + rh };
    const B = { x: ox + AB * unit, y: oy };
    const D = { x: ox + rw, y: oy + CD * unit };

    function tri(p1, p2, p3, color, alpha) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    tri(A, B, F, C_BRASS, 0.22);
    tri(B, Cp, D, C_SKY, 0.22);
    tri(D, E, F, C_VIOLET, 0.22);
    tri(B, D, F, C, 0.30);

    // 長方形外框
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, rw, rh);
    ctx.restore();

    // 頂點標籤：一律在長方形外側
    ctx.fillStyle = '#f1f5f9';
    ctx.font = f(800, 14);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('A', A.x - 14, A.y - 13);
    ctx.fillText('B', B.x, B.y - 13);
    ctx.fillText('C', Cp.x + 13, Cp.y - 13);
    ctx.fillText('E', E.x + 13, E.y + 13);
    ctx.fillText('F', F.x - 14, F.y + 13);

    // 邊長標示也全部放外側：放進框內會浮在色塊上，被誤讀成三角形的標記。
    // 頂邊的 5 與 x 再往上疊一排（頂點字在 oy-13、邊長在 oy-30），
    // 這樣 x 很小、B 與 C 靠得很近時，邊長字也不會壓到頂點字。
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 13);
    ctx.fillText('5', (A.x + B.x) / 2, A.y - 30);
    ctx.fillStyle = C;
    ctx.font = fi(800, 15);
    ctx.fillText('x', (B.x + Cp.x) / 2, B.y - 30);

    // 右緣由上而下依序是 C、4、D、4、E，同一直行且彼此錯開
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 13);
    ctx.fillText('4', Cp.x + 9, (Cp.y + D.y) / 2);
    ctx.fillText('4', D.x + 9, (D.y + E.y) / 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = f(800, 14);
    ctx.fillText('D', D.x + 9, D.y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = f(700, 13);
    ctx.fillText('8', A.x - 9, (A.y + F.y) / 2);
    ctx.textAlign = 'left';

    // 右側圖例：四塊的面積（固定位置，不隨長方形寬度飄移）
    const lx = 336;
    const rows = [
      ['△ABF', numStr(t1), C_BRASS],
      ['△BCD', numStr(t2), C_SKY],
      ['△DEF', numStr(t3), C_VIOLET],
      ['△BDF', String(BDF), C]
    ];
    ctx.font = f(700, 14);
    ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      const y = oy + 16 + i * 34;
      ctx.fillStyle = r[2];
      ctx.globalAlpha = 0.3;
      roundRect(ctx, lx, y - 9, 16, 18, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = r[2];
      ctx.lineWidth = 1.4;
      roundRect(ctx, lx, y - 9, 16, 18, 4);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = f(700, 14);
      ctx.fillText(r[0], lx + 24, y);
      ctx.fillStyle = r[2];
      ctx.font = f(800, 15);
      ctx.fillText(r[1], lx + 82, y);
    });
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 12);
    ctx.fillText('（△BDF 為題目已知）', lx - 2, oy + 16 + 4 * 34 + 4);

    // 兩種算法的比較
    drawPanel(ctx, 26, 288, (w - 66) / 2, 56, '#e2e8f0', 0.06);
    drawPanel(ctx, w / 2 + 7, 288, (w - 66) / 2, 56, '#e2e8f0', 0.06);
    drawFitText(ctx, '整塊長方形', 26 + (w - 66) / 4, 304, 150, 13, MUTED, 700);
    drawFitText(ctx, `8 × (5 + ${numStr(xv)}) = ${numStr(whole)}`, 26 + (w - 66) / 4, 328, (w - 66) / 2 - 16, 17, '#f1f5f9', 800);
    drawFitText(ctx, '四塊相加', w / 2 + 7 + (w - 66) / 4, 304, 150, 13, MUTED, 700);
    drawFitText(ctx, `${numStr(t1)} + ${numStr(t2)} + ${numStr(t3)} + 18 = ${numStr(parts)}`,
      w / 2 + 7 + (w - 66) / 4, 328, (w - 66) / 2 - 16, 17, '#f1f5f9', 800);

    const chipW = 300;
    drawChip(ctx, w / 2 - chipW / 2, 356, chipW, 38,
      equal ? `x = ${numStr(xv)}，兩種算法都是 ${numStr(whole)}` : `兩種算法差了 ${numStr(Math.abs(whole - parts))}`,
      equal ? OK_COLOR : NO_COLOR,
      equal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    drawNote(ctx, '同一塊面積，整體算一次、拆開算一次，兩個結果必須相等', 410, MUTED, 13);

    if (fb) {
      fb.innerHTML = wrapFeedback(equal
        ? `\\(\\overline{BC}=${numStr(xv)}\\) 時，整塊長方形是 \\(8 \\times (5+${numStr(xv)})=${numStr(whole)}\\)，四塊相加也是 \\(${numStr(parts)}\\)，<strong>兩種算法一致</strong>，所以 \\(\\overline{BC}\\) 的長度是 \\(${numStr(xv)}\\)。`
        : `\\(\\overline{BC}=${numStr(xv)}\\) 時，整塊是 \\(${numStr(whole)}\\)、四塊相加是 \\(${numStr(parts)}\\)，${whole > parts ? '整塊比較大' : '四塊比較大'}，還不是答案。列成方程式就是 \\(8(5+x)=48+4x\\)。`);
      typeset([fb]);
    }
  }

  slider.addEventListener('input', () => {
    xv = parseFloat(slider.value);
    if (valOut) valOut.textContent = numStr(xv);
    draw();
  });
  draw();
}

/* ==========================================================================
   重點 6：年齡時間軸
   今年與 n 年後（前）各一欄，兩人的年齡棒一起前進，條件成立時發光。
   ========================================================================== */
function initAgeCanvas() {
  const canvas = document.getElementById('canvas-age');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('ag-feedback');
  const group = document.getElementById('ag-case-group');
  const slider = document.getElementById('ag-x-slider');
  const valOut = document.getElementById('ag-x-val');
  const xLabel = document.getElementById('ag-x-label');
  const C = C_COPPER;

  const CASES = [
    {
      name: '年齡和 56 案',
      clue: '今年小妍與媽媽的年齡和是 56 歲；7 年後媽媽的年齡是小妍的 2 倍多 10 歲',
      kid: '小妍', adult: '媽媽', shift: 7, shiftText: '7 年後',
      adultNow: x => 56 - x,
      target: k => k * 2 + 10,
      targetText: '小妍 × 2 + 10',
      sol: 13, min: 5, max: 25,
      eq: '(56 − x) + 7 = 2(x + 7) + 10',
      tex: '(56-x)+7=2(x+7)+10',
      done: '小妍今年 13 歲、媽媽 43 歲，<strong>兩人相差 30 歲</strong>（題目問的是相差幾歲，不是 \\(x\\)）。'
    },
    {
      name: '相差 35 歲案',
      clue: '小翔與爸爸的年齡相差 35 歲；5 年前爸爸的年齡恰好是小翔的 8 倍',
      kid: '小翔', adult: '爸爸', shift: -5, shiftText: '5 年前',
      adultNow: x => x + 35,
      target: k => k * 8,
      targetText: '小翔 × 8',
      sol: 10, min: 6, max: 20,
      eq: '(x + 35) − 5 = 8(x − 5)',
      tex: '(x+35)-5=8(x-5)',
      done: '小翔今年 <strong>10 歲</strong>、爸爸 45 歲。5 年前小翔 5 歲、爸爸 40 歲，正好是 8 倍。'
    }
  ];

  let idx = 0, xv = 8;

  function syncSlider() {
    const c = CASES[idx];
    slider.min = c.min;
    slider.max = c.max;
    xv = clamp(xv, c.min, c.max);
    slider.value = xv;
    if (valOut) valOut.textContent = xv;
    if (xLabel) xLabel.textContent = c.kid + '今年';
  }

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    const kidNow = xv, adNow = c.adultNow(xv);
    const kidThen = kidNow + c.shift, adThen = adNow + c.shift;
    const want = c.target(kidThen);
    const equal = adThen === want;

    const barX = 116, barMaxW = w - barX - 76;
    const scale = barMaxW / 70;

    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, c.name, C);
    wrapText(ctx, c.clue, w / 2, 56, w - 70, 19, MUTED, 14);

    drawNote2(ctx, '今年', 26, 100, C_BRASS, 15);
    drawBar(ctx, barX, 90, kidNow * scale, 26, C_BRASS, c.kid, kidNow + ' 歲');
    drawBar(ctx, barX, 124, adNow * scale, 26, C_BRASS, c.adult, adNow + ' 歲');

    drawNote2(ctx, c.shiftText, 26, 186, C, 15);
    drawBar(ctx, barX, 176, kidThen * scale, 26, C, c.kid, kidThen + ' 歲');
    drawBar(ctx, barX, 210, adThen * scale, 26, equal ? OK_COLOR : NO_COLOR, c.adult, adThen + ' 歲');

    // 目標線：條件要求的大人年齡
    const tx = barX + want * scale;
    ctx.save();
    ctx.strokeStyle = OK_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(tx, 170);
    ctx.lineTo(tx, 250);
    ctx.stroke();
    ctx.restore();
    drawFitText(ctx, `條件要求：${c.targetText} = ${want} 歲`, w / 2, 264, w - 60, 14, OK_COLOR, 700);

    const chipW = 320;
    drawChip(ctx, w / 2 - chipW / 2, 284, chipW, 38,
      equal ? `${c.kid}今年 ${xv} 歲，條件成立` : `${c.adult}是 ${adThen} 歲，還差目標 ${Math.abs(adThen - want)} 歲`,
      equal ? OK_COLOR : NO_COLOR,
      equal ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    drawPanel(ctx, 26, 336, w - 52, 46, C, 0.09);
    drawFitText(ctx, c.eq, w / 2, 359, w - 76, 20, C, 800);

    if (fb) {
      fb.innerHTML = wrapFeedback(equal
        ? `\\(${c.tex}\\) 在 \\(x = ${xv}\\) 時成立。${c.done}`
        : `假設${c.kid}今年 \\(${xv}\\) 歲，${c.adult}就是 \\(${adNow}\\) 歲。${c.shiftText}<strong>兩個人都變動 ${Math.abs(c.shift)} 歲</strong>：${c.kid} \\(${kidThen}\\) 歲、${c.adult} \\(${adThen}\\) 歲；但條件要求${c.adult}是 \\(${want}\\) 歲，還不吻合。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => {
    idx = parseInt(v, 10);
    xv = CASES[idx].min;
    syncSlider();
    draw();
  });
  slider.addEventListener('input', () => {
    xv = parseInt(slider.value, 10);
    if (valOut) valOut.textContent = xv;
    draw();
  });
  syncSlider();
  draw();
}

/* ==========================================================================
   重點 7：結案審查台
   每樁案件都已經算完而且沒算錯，要判斷那個解在現實裡站不站得住。
   ========================================================================== */
function initVerdictCanvas() {
  const canvas = document.getElementById('canvas-verdict');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fb = document.getElementById('vd-feedback');
  const group = document.getElementById('vd-case-group');
  const btnOk = document.getElementById('vd-ok');
  const btnNo = document.getElementById('vd-no');
  const btnReset = document.getElementById('vd-reset');
  const C = C_EMBER;

  const CASES = [
    {
      name: '游泳池票案',
      clue: '買 4 張全票（每張 120 元）和若干張優待票（每張 80 元），付了 780 元',
      eq: '120 × 4 + 80x = 780',
      sol: 'x = 3.75',
      asks: 'x 代表優待票的張數',
      ok: false,
      why: '<strong>票的張數一定是正整數</strong>，世界上沒有 \\(3.75\\) 張票。計算完全正確，但與事實不符，所以<strong>付費 \\(780\\) 元不合理</strong>。'
    },
    {
      name: '環島路跑案',
      clue: '小翊時速 10 公里、小妍時速 8 公里，小翊回到終點時小妍還離終點 7.4 公里',
      eq: 'x/10 = (x − 7.4)/8',
      sol: 'x = 37',
      asks: 'x 代表環島公路的全長（公里）',
      ok: true,
      why: '長度是 \\(37\\) 公里，<strong>正數而且沒有整數的限制</strong>，完全合理，可以直接結案。'
    },
    {
      name: '水族館帳單案',
      clue: '買 1 個魚缸（110 元）和數隻孔雀魚（每隻 20 元），店家收了 280 元',
      eq: '110 + 20x = 280',
      sol: 'x = 8.5',
      asks: 'x 代表孔雀魚的隻數',
      ok: false,
      why: '<strong>魚的隻數一定是正整數</strong>，\\(8.5\\) 隻不存在。雖然計算無誤但與事實不符，<strong>收費 \\(280\\) 元不合理</strong>。'
    },
    {
      name: '上山下山案',
      clue: '沿同一條路上山、下山共 2 小時，上山時速 3 公里、下山時速 4 公里',
      eq: 'x/3 + x/4 = 2',
      sol: 'x = 24/7',
      asks: 'x 代表這條山路的長度（公里）',
      ok: true,
      why: '\\(\\frac{24}{7} \\approx 3.43\\) 公里。<strong>長度可以是分數</strong>，不需要是整數，所以這個答案合理。'
    },
    {
      name: '撲滿硬幣案',
      clue: '10 元硬幣有 7 枚，5 元和 1 元硬幣共 18 枚，算出總金額為 105 元',
      eq: '70 + 5x + (18 − x) = 105',
      sol: 'x = 17/4',
      asks: 'x 代表 5 元硬幣的枚數',
      ok: false,
      why: '<strong>硬幣的枚數一定是正整數</strong>，\\(\\frac{17}{4}\\) 枚不存在，所以<strong>總金額 \\(105\\) 元不合理</strong>。'
    }
  ];

  // 係數乘 x：中間只留 1px，才不會看起來像「80 x」兩個東西
  const CX = n => SEQ([T(String(n)), IT('x')], null, 1);

  // 每樁案件的方程式與解都用算式元件畫，分數才畫得成分數
  const EQ = [
    () => [T('120 × 4 +'), CX(80), T('='), T('780')],
    () => [VF(IT('x'), T('10')), T('='), VF(SEQ([IT('x'), T('-'), T('7.4')]), T('8'))],
    () => [T('110 +'), CX(20), T('='), T('280')],
    () => [VF(IT('x'), T('3')), T('+'), VF(IT('x'), T('4')), T('='), T('2')],
    () => [T('70 +'), CX(5), T('+'), GRP([T('18'), T('-'), IT('x')]), T('='), T('105')]
  ];
  const SOL = [
    () => [IT('x'), T('='), T('3.75')],
    () => [IT('x'), T('='), T('37')],
    () => [IT('x'), T('='), T('8.5')],
    () => [IT('x'), T('='), FR(24, 7)],
    () => [IT('x'), T('='), FR(17, 4)]
  ];

  let idx = 0, verdict = null;

  // 綠色「結案」圓章
  function drawOkStamp(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.14);
    ctx.strokeStyle = OK_COLOR;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 37, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = OK_COLOR;
    ctx.font = f(900, 24);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('結案', 0, -2);
    ctx.font = f(700, 11);
    ctx.fillText('CLOSED', 0, 20);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // 紅色「不合理」大叉
  function drawNoStamp(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.12);
    ctx.strokeStyle = NO_COLOR;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(22, 22);
    ctx.moveTo(22, -22);
    ctx.lineTo(-22, 22);
    ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawCork(ctx, 10, 10, w - 20, canvas.height - 20);
    drawTitle(ctx, c.name, C);

    // 卷宗
    const fx = 30, fy = 44, fw = w - 60, fh = 252;
    ctx.save();
    ctx.fillStyle = 'rgba(248, 245, 235, 0.09)';
    roundRect(ctx, fx, fy, fw, fh, 12);
    ctx.fill();
    ctx.strokeStyle = C;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    drawPin(ctx, fx + 22, fy + 16, STRING);

    ctx.fillStyle = C;
    ctx.font = f(800, 14);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('案情', fx + 40, fy + 16);
    ctx.textAlign = 'left';

    // 字級與可用寬度都放寬一點，否則「公里」這種詞會被斷成單字孤行
    wrapText(ctx, c.clue, w / 2, fy + 50, fw - 26, 20, '#e2e8f0', 14);

    drawPanel(ctx, fx + 18, fy + 82, fw - 36, 58, C, 0.10);
    drawExpr(ctx, EQ[idx](), w / 2, fy + 111, 19, '#f1f5f9', { maxW: fw - 60 });

    drawExpr(ctx, [T('解出來：', MUTED)].concat(SOL[idx]()), w / 2, fy + 176, 19, C,
             { maxW: fw - 60 });
    drawFitText(ctx, c.asks, w / 2, fy + 218, fw - 60, 14, MUTED, 600);
    drawFitText(ctx, '計算過程已確認無誤', w / 2, fy + 240, fw - 60, 13, DIM, 600);

    // 印章
    if (verdict === null) {
      drawFitText(ctx, '這個解在現實裡站得住嗎？選一個章蓋下去', w / 2, 344, w - 80, 15, MUTED, 700);
    } else {
      if (verdict === 'ok') drawOkStamp(w / 2, 340); else drawNoStamp(w / 2, 340);
      const right = (verdict === 'ok') === c.ok;
      const chipW = 300;
      drawChip(ctx, w / 2 - chipW / 2, 394, chipW, 32,
        right ? '判斷正確' : '再想想：這個章蓋錯了',
        right ? OK_COLOR : NO_COLOR,
        right ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');
    }

    if (fb) {
      if (verdict === null) {
        fb.innerHTML = wrapFeedback(`方程式 <strong>${c.eq}</strong> 已經解完，得到 <strong>${c.sol}</strong>。${c.asks}——<strong>這個答案合理嗎</strong>？`);
      } else {
        const right = (verdict === 'ok') === c.ok;
        fb.innerHTML = wrapFeedback(
          `<span style="color:${right ? OK_COLOR : NO_COLOR}"><strong>${right ? '判斷正確' : '判斷錯誤'}</strong></span>：${c.why}`);
      }
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); verdict = null; draw(); });
  if (btnOk) btnOk.addEventListener('click', () => { verdict = 'ok'; draw(); });
  if (btnNo) btnNo.addEventListener('click', () => { verdict = 'no'; draw(); });
  if (btnReset) btnReset.addEventListener('click', () => { verdict = null; draw(); });
  draw();
}
