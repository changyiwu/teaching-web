/* ==========================================================================
   5-1-1（第五冊 1-1）連比例 — 互動 Canvas 與隨堂評量
   畫風：昭和復古照相館・暗房（小影、阿光），第 1 章四節共用。

   共用工具在 ../math-canvas.js（f／fi／drawTitle／drawExpr／drawStepRows／
   parseExpr／exprItems／q*（有理數）／wrapFeedback／wbrRel／typeset／
   bindPickGroup／drawWithFonts…）。

   本檔分三層：
     0. 本節色票（DK_ 前綴；共用檔沒有這個前綴）；
     1. 本節工具（lb 前綴）：連比的化簡、兩個比對齊、直式表格、量杯與長條；
     2. 10 個互動與評量系統。

   連比一律以整數陣列運算（gcd／lcm），分數走共用檔的 q*（化成最簡），
   不用浮點數判斷相等。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMeanCanvas();
  initSimpCanvas();
  initAlignCanvas();
  initRelCanvas();
  initSetrCanvas();
  initSolveCanvas();
  initEqualCanvas();
  initSubCanvas();
  initShareCanvas();
  initChainCanvas();
});

/* ==========================================================================
   0. 本節色票（暗房：棕褐相紙、安全燈紅、顯影藍、圍裙綠、芥末黃、相紙白）
   ========================================================================== */

const DK_PAPER = '#2a211b';
const DK_SEPIA = '#d9b38c';
const DK_RED = '#e05a47';
const DK_BLUE = '#5aa9e6';
const DK_GREEN = '#5fbf8f';
const DK_MUSTARD = '#e6b84c';
const DK_IVORY = '#f3ead8';
const DK_OK = '#86efac';
const DK_NO = '#fb7185';
const DK_FAINT = 'rgba(243, 234, 216, 0.3)';

// 三個量（A 液／x、B 液／y、清水／z）固定用這三色，全頁一致
const DK_QA = '#f2917e';   // 安全燈紅的亮版
const DK_QB = '#7cc0f0';   // 顯影藍的亮版
const DK_QC = '#e6c35c';   // 芥末黃
const DK_Q = [DK_QA, DK_QB, DK_QC];

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const DK_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264'];

/* ==========================================================================
   1. 本節工具
   ========================================================================== */

function lbGcdArr(arr) {
  return arr.reduce((g, v) => gcd(g, v));
}

function lbLcm(a, b) {
  return a / gcd(a, b) * b;
}

function lbLcmArr(arr) {
  return arr.reduce((l, v) => lbLcm(l, v));
}

// 同除以各項的最大公因數（保留正負號）
function lbSimp(arr) {
  const g = lbGcdArr(arr.map(v => Math.abs(v)));
  return arr.map(v => v / g);
}

// canvas 上的負號用真正的減號
function lbNum(v) {
  return String(v).replace(/-/g, '−');
}

// 連比的 LaTeX：第二項以後的負數加括號
function lbRTex(arr) {
  return arr.map((v, i) => (i > 0 && v < 0) ? `(${v})` : String(v)).join(' : ');
}

// 連比的 canvas 元件
function lbRItems(arr, colors) {
  const out = [];
  arr.forEach((v, i) => {
    if (i) out.push(T(':', INK));
    const col = Array.isArray(colors) ? colors[i] : (colors || INK);
    const it = T(lbNum(v), col);
    out.push(i > 0 && v < 0 ? GRP([it], '()', col) : it);
  });
  return out;
}

// 係數 1 不寫
function lbCoef(n) {
  return n === 1 ? '' : String(n);
}

// 「係數 + 變數」的 canvas 元件
function lbTerm(n, v, color) {
  return n === 1 ? IT(v, color) : SEQ([T(String(n), color), IT(v, color)], color, 1);
}

// r 的倍數：1r 寫成 r、-1r 寫成 -r
function lbR(n) {
  if (n === 0) return '0';
  if (n === 1) return 'r';
  if (n === -1) return '-r';
  return n + 'r';
}

// 小數（以「十分之幾」的整數表示）
function lbDec(n) {
  return n % 10 === 0 ? String(n / 10) : Math.floor(n / 10) + '.' + (n % 10);
}

/**
 * 兩個比對齊共同項。
 *   p1、p2：{ cols: [i, j], vals: [u, v] }，cols 是三欄中的欄位（0、1、2）
 *   common：共同項的欄位
 * 回傳每一列的放大倍數、對齊後的三項、最簡整數比。
 */
function lbAlign(p1, p2, common) {
  const v1 = p1.vals[p1.cols.indexOf(common)];
  const v2 = p2.vals[p2.cols.indexOf(common)];
  const L = lbLcm(v1, v2);
  const m1 = L / v1, m2 = L / v2;
  const merged = [0, 0, 0];
  p1.cols.forEach((c, k) => { merged[c] = p1.vals[k] * m1; });
  p2.cols.forEach((c, k) => { merged[c] = p2.vals[k] * m2; });
  const G = lbGcdArr(merged);
  return { v1, v2, L, m1, m2, merged, G, simp: merged.map(v => v / G) };
}

// 把一個比放進三欄的列（沒有的欄位是 null）
function lbCells(pair, mult) {
  const cells = [null, null, null];
  pair.cols.forEach((c, k) => { cells[c] = pair.vals[k] * (mult || 1); });
  return cells;
}

/**
 * 直式表格（課本「由兩個比求連比」的寫法）：三欄對齊，同一列相鄰的數之間畫冒號。
 *   o.colX：三欄的中心；o.heads：欄名元件；o.top：表頭的 y；o.rowH：列高
 *   o.rows：[{ cells, tag, note, color, strong }]
 *   o.hiCol：要框起來的欄（共同項）；o.divider：在第幾列之前畫分隔線
 */
function lbTable(ctx, o) {
  const size = o.size || 20;
  const n = o.rows.length;
  const yOf = i => o.top + o.rowH * (i + 1);
  // 共同項那一欄的框
  if (o.hiCol != null && o.hiCol >= 0) {
    const hx = o.colX[o.hiCol];
    const yTop = o.top + o.rowH * 0.5;
    const yBot = yOf((o.hiTo == null ? n : o.hiTo) - 1) + o.rowH * 0.5;
    ctx.save();
    ctx.fillStyle = o.hiColor || DK_MUSTARD;
    ctx.globalAlpha = 0.12;
    roundRect(ctx, hx - 34, yTop, 68, yBot - yTop, 10);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = o.hiColor || DK_MUSTARD;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }
  // 表頭
  o.heads.forEach((h, k) => {
    const w = measure(ctx, h, size).w;
    drawIt(ctx, h, o.colX[k] - w / 2, o.top, size, INK);
  });
  ctx.save();
  ctx.strokeStyle = DK_FAINT;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(o.colX[0] - 40, o.top + o.rowH * 0.5);
  ctx.lineTo(o.colX[2] + 40, o.top + o.rowH * 0.5);
  ctx.stroke();
  ctx.restore();

  o.rows.forEach((r, i) => {
    const y = yOf(i);
    const col = r.color || INK;
    if (o.divider === i) {
      ctx.save();
      ctx.strokeStyle = DK_IVORY;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(o.colX[0] - 40, y - o.rowH * 0.5);
      ctx.lineTo(o.colX[2] + 40, y - o.rowH * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    if (r.tag) textLeft(ctx, r.tag, o.labX == null ? 20 : o.labX, y, r.strong ? col : MUTED, f(r.strong ? 800 : 700, 13.5));
    const filled = [];
    r.cells.forEach((v, k) => {
      if (v == null) return;
      filled.push(k);
      textCenter(ctx, lbNum(v), o.colX[k], y, col, f(r.strong ? 800 : 700, size));
    });
    for (let k = 1; k < filled.length; k++) {
      const mx = (o.colX[filled[k - 1]] + o.colX[filled[k]]) / 2;
      textCenter(ctx, ':', mx, y - 1, col, f(800, size));
    }
    if (r.note) textLeft(ctx, r.note, o.colX[2] + 44, y, r.noteColor || DK_MUSTARD, f(800, 14));
  });
  return yOf(n - 1);
}

// 線段名稱（字母上面加一條橫線）
function lbOver(ctx, text, cx, cy, color, font) {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(text).width;
  textCenter(ctx, text, cx, cy, color, font);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - 12);
  ctx.lineTo(cx + w / 2, cy - 12);
  ctx.stroke();
  ctx.restore();
}

// 置中的一行字，其中 [AB] 這種寫法畫成上面加橫線的線段名稱（斜體）
function lbSegText(ctx, str, cx, cy, color, size) {
  const parts = String(str).split(/(\[[A-Z]{2}\])/).filter(x => x);
  ctx.save();
  const pieces = parts.map(t => {
    const seg = /^\[[A-Z]{2}\]$/.test(t);
    const txt = seg ? t.slice(1, 3) : t;
    const font = seg ? fi(800, size) : f(800, size);
    ctx.font = font;
    return { txt, seg, font, w: ctx.measureText(txt).width };
  });
  let x = cx - pieces.reduce((a, q) => a + q.w, 0) / 2;
  pieces.forEach(q => {
    textLeft(ctx, q.txt, x, cy, color, q.font);
    if (q.seg) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 1, cy - size * 0.68);
      ctx.lineTo(x + q.w + 1, cy - size * 0.68);
      ctx.stroke();
    }
    x += q.w;
  });
  ctx.restore();
}

// 線段名稱當表頭用的元件（measure／drawIt 認得的形狀不含橫線，所以另外畫）
function lbOverHeads(ctx, names, colX, y, color) {
  names.forEach((s, k) => lbOver(ctx, s, colX[k], y, color, fi(800, 18)));
}

// 一只玻璃量杯（中心 cx、cy，寬 28、高 38），裝 7 分滿
function lbBeaker(ctx, cx, cy, color) {
  const w = 26, h = 36, x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  roundRect(ctx, x + 2, y + h * 0.32, w - 4, h * 0.68 - 2, 5);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = DK_IVORY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x, y + 3);
  ctx.lineTo(x, y + h - 6);
  ctx.quadraticCurveTo(x, y + h, x + 6, y + h);
  ctx.lineTo(x + w - 6, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - 6);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

// 一條長條（圓角，可加文字）
function lbBar(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha == null ? 0.75 : alpha;
  roundRect(ctx, x, y, Math.max(w, 2), h, Math.min(6, h / 2));
  ctx.fill();
  ctx.restore();
}

/* ==========================================================================
   評量系統
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第五冊 1-1 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '511-1': 'B',    // A 液 : 清水 = 6 : 9 = 2 : 3
    '511-2': 'D',    // 14 : 21 : 35 = 2 : 3 : 5 = 16 : 24 : 40，連比不是實際個數
    '511-3': 'A',    // 2.2 : 0.8 : 3 = 22 : 8 : 30 = 11 : 4 : 15
    '511-4': 'C',    // 同乘 12：8 : 9 : 10
    '511-5': 'D',    // z 化成 20：55 : 6 : 20
    '511-6': 'C',    // 小張不變：8 : 9 : 6 對 6 : 8 : 6，大張少 2 份、中張少 1 份
    '511-7': 'A',    // x : y = 4 : 11、y : z = 8 : 3 ⇒ 32 : 88 : 33
    '511-8': 'B',    // 2 : 3 : 10 ⇒ 24°、36°、120°（鈍角）
    '511-9': 'C',    // r = 2，x + z = 22 + 6 = 28
    '511-10': 'A',   // x/3 = y/8 = z/5
    '511-11': 'B',   // x : 21 : y = 4 : 3 : 11 ⇒ x = 28、y = 77
    '511-12': 'D',   // 15 : 10 : 6 = x : 4 : y ⇒ x = 6、y = 12/5
    '511-13': 'C',   // 1/8 : 1/6 : 1/9 = 9 : 12 : 8
    '511-14': 'A',   // 28x = 8y = 7z（都是 56r）
    '511-15': 'B',   // (6r − 7r + 4r) : (2r + 7r − 4r) = 3 : 5
    '511-16': 'D',   // 5 : 12 : 9 ⇒ 10 : 12 : 27
    '511-17': 'B',   // 3·2r + 2·3r = 96，r = 8，小張 80
    '511-18': 'A',   // 一份 70，(11 − 3) × 70 = 560
    '511-19': 'D',   // 11 : 2 : 6，一份 10，BD = 80
    '511-20': 'C'    // 7 : 2 : 12，一份 5，BD = 70 比 AC = 45 長
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
   重點 1：連比的意義——配方量杯台
   ========================================================================== */
function initMeanCanvas() {
  const cv = hbEl('canvas-mean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['mean-a', 'mean-b', 'mean-c'].map(hbEl);
  const vl = ['mean-va', 'mean-vb', 'mean-vc'].map(hbEl);
  const out = hbEl('mean-formula'), fb = hbEl('mean-feedback');
  const C0 = DK_TONE[0];
  const NAMES = ['A 液', 'B 液', '清水'];
  const PAIRS = { ab: [0, 1], bc: [1, 2], ac: [0, 2] };
  let pair = 'ac';

  function draw() {
    const W = cv.width, H = cv.height;
    const v = sl.map(s => hbClampSlider(s, 1, 8));
    v.forEach((n, k) => { vl[k].textContent = n + ' 杯'; });
    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '同一個量杯：A 液、B 液、清水各倒幾杯', C0);

    const [i, j] = PAIRS[pair];
    const rowY = [80, 142, 204];
    rowY.forEach((y, k) => {
      const on = (k === i || k === j);
      if (on) drawPanel(ctx, 12, y - 27, W - 24, 54, DK_Q[k], 0.1);
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.32;
      textLeft(ctx, NAMES[k], 24, y, DK_Q[k], f(800, 17));
      for (let n = 0; n < v[k]; n++) lbBeaker(ctx, 106 + n * 42, y + 2, DK_Q[k]);
      textLeft(ctx, v[k] + ' 杯', 456, y, DK_Q[k], f(800, 17));
      ctx.restore();
    });

    // 連比
    drawPanel(ctx, 12, 246, W - 24, 52, C0, 0.08);
    drawExpr(ctx, [T('A 液 : B 液 : 清水 =', INK)].concat(lbRItems(v, DK_Q)), W / 2, 272, 21, INK, { gap: 8 });

    // 三組比
    const keys = ['ab', 'bc', 'ac'];
    keys.forEach((key, k) => {
      const [p, q] = PAIRS[key];
      const y = 326 + k * 40;
      const on = key === pair;
      const g = gcd(v[p], v[q]);
      const items = [T(`${NAMES[p]} : ${NAMES[q]} =`, on ? DK_IVORY : MUTED)]
        .concat(lbRItems([v[p], v[q]], [DK_Q[p], DK_Q[q]]));
      if (g > 1) items.push(T('=', on ? DK_IVORY : MUTED), ...lbRItems([v[p] / g, v[q] / g], [DK_Q[p], DK_Q[q]]));
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.45;
      drawExpr(ctx, items, W / 2, y, on ? 19 : 16, INK, { gap: 7 });
      ctx.restore();
    });
    drawNote(ctx, '連比只說三樣的倍數關係：每一樣都多倒一倍，連比還是相等', 452, MUTED, 13.5);

    const [p, q] = PAIRS[pair];
    const g = gcd(v[p], v[q]);
    const simp = g > 1 ? `<wbr>\\({}= ${v[p] / g} : ${v[q] / g}\\)` : '';
    out.innerHTML = `A 液 : B 液 : 清水 \\(= ${lbRTex(v)}\\)，<wbr>${NAMES[p]} : ${NAMES[q]} \\(= ${v[p]} : ${v[q]}\\)${simp}`;
    const simpTxt = g > 1 ? `，前後項同除以 \\(${g}\\)，也就是 \\(${v[p] / g} : ${v[q] / g}\\)` : '';
    fb.innerHTML = wrapFeedback(`連比 \\(${lbRTex(v)}\\) 的第 ${p + 1} 項是${NAMES[p]}、第 ${q + 1} 項是${NAMES[q]}，所以${NAMES[p]} : ${NAMES[q]} \\(= ${v[p]} : ${v[q]}\\)${simpTxt}。<br>一個連比裡同時藏著三組比，順序不能換。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('mean-pair-group'), 'data-mean-pair', m => { pair = m; draw(); });
  sl.forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：同乘同除，化成最簡整數比——連比化簡台
   ========================================================================== */
function initSimpCanvas() {
  const cv = hbEl('canvas-simp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = hbEl('simp-p'), sq = hbEl('simp-q'), sr = hbEl('simp-r'), sg = hbEl('simp-g');
  const gRow = hbEl('simp-g-row');
  const out = hbEl('simp-formula'), fb = hbEl('simp-feedback');
  const C1 = DK_TONE[1];
  let mode = 'int';

  // 依模式算出每一步：rows 給 drawStepRows，tex 給數值列，raw／simp 給長條
  function compute(p, q, r, g) {
    const rows = [], tex = [];
    let rawVal, ints, fbTxt;
    if (mode === 'int') {
      ints = [p * g, q * g, r * g];
      rawVal = ints.slice();
      rows.push({ name: '原來的連比', items: lbRItems(ints) });
      tex.push(lbRTex(ints));
      fbTxt = `三個數 \\(${ints.join('、')}\\) 的最大公因數是 \\(${lbGcdArr(ints)}\\)，同除以它就是最簡整數比。`;
    } else if (mode === 'dec') {
      const tenths = [p * g, q * g, r * g];
      rawVal = tenths.map(n => n / 10);
      rows.push({ name: '原來的連比', items: tenths.map(lbDec).reduce((a, s, k) => (k ? a.concat([T(':', INK), T(s, INK)]) : [T(s, INK)]), []) });
      tex.push(tenths.map(lbDec).join(' : '));
      const hasDec = tenths.some(n => n % 10 !== 0);
      if (hasDec) {
        ints = tenths;
        rows.push({ name: '同乘以 10', hint: '小數點去掉', items: lbRItems(ints) });
        tex.push(lbRTex(ints));
        fbTxt = `先三項同乘以 \\(10\\) 去掉小數點，得 \\(${lbRTex(ints)}\\)；再同除以最大公因數 \\(${lbGcdArr(ints)}\\)。`;
      } else {
        ints = tenths.map(n => n / 10);
        fbTxt = '這一組剛好沒有小數，不必先乘以 \\(10\\)，直接同除以最大公因數。';
      }
    } else {
      const den = [p, q, r];
      const L = lbLcmArr(den);
      rawVal = den.map(d => 1 / d);
      const fr = den.map(d => (d === 1 ? T('1', INK) : FR(1, d, INK)));
      const items = [];
      fr.forEach((it, k) => { if (k) items.push(T(':', INK)); items.push(it); });
      rows.push({ name: '原來的連比', items });
      tex.push(den.map(d => (d === 1 ? '1' : `\\frac{1}{${d}}`)).join(' : '));
      ints = den.map(d => L / d);
      rows.push({ name: `同乘以 ${L}`, hint: '分母的最小公倍數', items: lbRItems(ints) });
      tex.push(lbRTex(ints));
      fbTxt = `分母 \\(${den.join('、')}\\) 的最小公倍數是 \\(${L}\\)，三項同乘以 \\(${L}\\) 就變成整數 \\(${lbRTex(ints)}\\)。`;
    }
    const G = lbGcdArr(ints);
    const simp = ints.map(v => v / G);
    if (G > 1) {
      rows.push({ name: `同除以 ${G}`, hint: '三數的最大公因數', items: lbRItems(simp) });
      tex.push(lbRTex(simp));
    }
    rows[rows.length - 1].name += '（最簡）';
    return { rows, tex, rawVal, simp, fbTxt, G };
  }

  function drawBars(vals, x0, y0, w, title, color) {
    textLeft(ctx, title, x0, y0, color, f(800, 14));
    const mx = Math.max.apply(null, vals);
    vals.forEach((v, k) => {
      const y = y0 + 26 + k * 34;
      const len = w * v / mx;
      lbBar(ctx, x0, y - 11, len, 22, DK_Q[k], 0.7);
    });
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const p = hbClampSlider(sp, 1, 9), q = hbClampSlider(sq, 1, 9), r = hbClampSlider(sr, 1, 9);
    const g = hbClampSlider(sg, 2, 6);
    hbEl('simp-vp').textContent = p;
    hbEl('simp-vq').textContent = q;
    hbEl('simp-vr').textContent = r;
    hbEl('simp-vg').textContent = g;
    gRow.style.display = mode === 'frac' ? 'none' : '';
    const lab = mode === 'frac' ? '分母' : '基本量';
    hbEl('simp-lp').textContent = '第一項的' + lab;
    hbEl('simp-lq').textContent = '第二項的' + lab;
    hbEl('simp-lr').textContent = '第三項的' + lab;

    ctx.clearRect(0, 0, W, H);
    const title = { int: '整數的連比：同除以最大公因數', dec: '小數的連比：先同乘以 10', frac: '分數的連比：先同乘以分母的最小公倍數' }[mode];
    drawTitle(ctx, title, C1);
    const res = compute(p, q, r, g);
    drawStepRows(ctx, res.rows, res.rows.length, { top: 74, gap: 58, color: C1, eqX: 196, size: 21 });

    // 長條：化簡前後按比例畫，長短關係完全一樣
    const yb = 262;
    drawPanel(ctx, 12, yb - 22, W - 24, 152, DK_SEPIA, 0.05);
    drawBars(res.rawVal, 34, yb, 210, '化簡前（按比例）', MUTED);
    drawBars(res.simp, 292, yb, 210, '化簡後（按比例）', C1);
    const den = [p, q, r];
    const rawLab = mode === 'int' ? res.rawVal.map(v => T(String(v)))
      : (mode === 'dec' ? res.rawVal.map(v => T(lbDec(Math.round(v * 10)))) : den.map(d => (d === 1 ? T('1') : FR(1, d))));
    [0, 1, 2].forEach(k => {
      const mxR = Math.max.apply(null, res.rawVal), mxS = Math.max.apply(null, res.simp);
      drawIt(ctx, rawLab[k], 34 + 210 * res.rawVal[k] / mxR + 8, yb + 26 + k * 34, mode === 'frac' ? 15 : 14, DK_Q[k]);
      textLeft(ctx, lbNum(res.simp[k]), 292 + 210 * res.simp[k] / mxS + 8, yb + 26 + k * 34, DK_Q[k], f(800, 14));
    });
    drawNote(ctx, '左右兩組長條的長短關係一模一樣：同乘同除不會改變連比', 410, MUTED, 14);
    drawNote(ctx, '每一項都要乘（或除）同一個數，少了一項比就變了', 440, MUTED, 13.5);

    out.innerHTML = wbrRel(res.tex.join(' = '));
    fb.innerHTML = wrapFeedback(res.fbTxt + `<br>最簡整數比是 \\(${lbRTex(res.simp)}\\)：三項都是整數，而且除了 \\(1\\) 沒有共同的因數。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('simp-mode-group'), 'data-simp-mode', m => { mode = m; draw(); });
  [sp, sq, sr, sg].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：由兩個比求連比——直式對齊台
   ========================================================================== */
const LB_VARS = ['x', 'y', 'z'];

// 三種「已知」：兩個比各自佔哪兩欄、共同項是哪一欄
const LB_ALIGN_MODES = {
  y: { c1: [0, 1], c2: [1, 2], common: 1 },
  z: { c1: [0, 2], c2: [1, 2], common: 2 },
  x: { c1: [0, 1], c2: [0, 2], common: 0 }
};

function lbPairTex(cols, vals) {
  return `${LB_VARS[cols[0]]} : ${LB_VARS[cols[1]]} = ${vals[0]} : ${vals[1]}`;
}

function initAlignCanvas() {
  const cv = hbEl('canvas-align');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['align-a', 'align-b', 'align-c', 'align-d'].map(hbEl);
  const vl = ['align-va', 'align-vb', 'align-vc', 'align-vd'].map(hbEl);
  const out = hbEl('align-formula'), fb = hbEl('align-feedback');
  const C2 = DK_TONE[2];
  let mode = 'y';

  function draw() {
    const W = cv.width, H = cv.height;
    const v = sl.map(s => hbClampSlider(s, 1, 9));
    v.forEach((n, k) => { vl[k].textContent = n; });
    const M = LB_ALIGN_MODES[mode];
    const p1 = { cols: M.c1, vals: [v[0], v[1]] };
    const p2 = { cols: M.c2, vals: [v[2], v[3]] };
    const A = lbAlign(p1, p2, M.common);
    const cname = LB_VARS[M.common];
    const same = A.v1 === A.v2;

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, `兩個比的共同項是 ${cname}：先把它對齊`, C2);

    const rows = [
      { cells: lbCells(p1), tag: '第一個比', color: DK_IVORY },
      { cells: lbCells(p2), tag: '第二個比', color: DK_SEPIA }
    ];
    if (!same) {
      if (A.m1 > 1) rows.push({ cells: lbCells(p1, A.m1), tag: `第一個比 ×${A.m1}`, color: DK_IVORY });
      if (A.m2 > 1) rows.push({ cells: lbCells(p2, A.m2), tag: `第二個比 ×${A.m2}`, color: DK_SEPIA });
    }
    const divider = rows.length;
    rows.push({ cells: A.merged, tag: '併成連比', color: C2, strong: true });
    if (A.G > 1) rows.push({ cells: A.simp, tag: `同除以 ${A.G}`, color: DK_OK, strong: true });
    lbTable(ctx, {
      colX: [262, 350, 438], heads: LB_VARS.map((s, k) => IT(s, DK_Q[k])), top: 64, rowH: 44,
      rows, hiCol: M.common, divider, labX: 22
    });

    if (same) {
      textCenter(ctx, `共同項 ${cname} 對應的數都是 ${A.v1}，可以直接併起來`, W / 2, 398, DK_OK, f(800, 15));
    } else {
      textCenter(ctx, `✗ ${cname} 一下是 ${A.v1}、一下是 ${A.v2}，不能直接併`, W / 2, 390, DK_NO, f(800, 15));
      textCenter(ctx, `✓ 把 ${cname} 化成最小公倍數 ${A.L}：第一個比 ×${A.m1}、第二個比 ×${A.m2}`, W / 2, 418, DK_OK, f(800, 14.5));
    }
    const fin = A.simp;
    textCenter(ctx, `x : y : z = ${fin.join(' : ')}`, W / 2, 448, C2, fi(800, 17));

    out.innerHTML = `\\(${lbPairTex(p1.cols, p1.vals)}\\)，<wbr>\\(${lbPairTex(p2.cols, p2.vals)}\\)<wbr>\\({}\\Rightarrow x : y : z = ${lbRTex(fin)}\\)`;
    let txt;
    if (same) {
      txt = `兩個比裡的 \\(${cname}\\) 都對應 \\(${A.v1}\\)，標準一樣，直接併成 \\(${lbRTex(A.merged)}\\)。`;
    } else {
      txt = `\\(${cname}\\) 在第一個比是 \\(${A.v1}\\)、在第二個比是 \\(${A.v2}\\)，最小公倍數 \\(${A.L}\\)：第一個比同乘 \\(${A.m1}\\)、第二個比同乘 \\(${A.m2}\\)，再併成 \\(${lbRTex(A.merged)}\\)。`;
    }
    if (A.G > 1) txt += `<br>三數還有公因數 \\(${A.G}\\)，同除以它得 \\(${lbRTex(A.simp)}\\)。`;
    fb.innerHTML = wrapFeedback(txt);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('align-mode-group'), 'data-align-mode', m => { mode = m; draw(); });
  sl.forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：由 ax = by 求比——交叉對調機
   ========================================================================== */

// 畫「a v1 = b v2」與它下面的「v1 : v2 = b : a」，並用箭頭標出係數怎麼交叉對調
function lbCrossPair(ctx, cx, y1, y2, a, v1, b, v2) {
  const NF = f(800, 22), VF_ = fi(800, 22), OF = f(700, 22);
  const pieces1 = [[String(a), NF, DK_MUSTARD, 'a'], [v1, VF_, DK_Q[LB_VARS.indexOf(v1)]], [' = ', OF, INK],
                   [String(b), NF, DK_GREEN, 'b'], [v2, VF_, DK_Q[LB_VARS.indexOf(v2)]]];
  const pieces2 = [[v1, VF_, DK_Q[LB_VARS.indexOf(v1)]], [' : ', OF, INK], [v2, VF_, DK_Q[LB_VARS.indexOf(v2)]],
                   [' = ', OF, INK], [String(b), NF, DK_GREEN, 'b'], [' : ', OF, INK], [String(a), NF, DK_MUSTARD, 'a']];
  function lay(pieces, y) {
    ctx.save();
    let w = 0;
    pieces.forEach(p => { ctx.font = p[1]; p.w = ctx.measureText(p[0]).width; w += p.w; });
    let x = cx - w / 2;
    const pos = {};
    pieces.forEach(p => {
      textLeft(ctx, p[0], x, y, p[2], p[1]);
      if (p[3]) pos[p[3]] = x + p.w / 2;
      x += p.w;
    });
    ctx.restore();
    return pos;
  }
  const P1 = lay(pieces1, y1), P2 = lay(pieces2, y2);
  // 交叉箭頭
  drawArrow(ctx, P1.a, y1 + 15, P2.a, y2 - 15, DK_MUSTARD, 2);
  drawArrow(ctx, P1.b, y1 + 15, P2.b, y2 - 15, DK_GREEN, 2);
}

function initRelCanvas() {
  const cv = hbEl('canvas-rel');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['rel-a', 'rel-b', 'rel-c', 'rel-d'].map(hbEl);
  const vl = ['rel-va', 'rel-vb', 'rel-vc', 'rel-vd'].map(hbEl);
  const out = hbEl('rel-formula'), fb = hbEl('rel-feedback');
  const C3 = DK_TONE[3];
  let mode = 'yz';

  function draw() {
    const W = cv.width, H = cv.height;
    const [a, b, c, d] = sl.map(s => hbClampSlider(s, 2, 6));
    [a, b, c, d].forEach((n, k) => { vl[k].textContent = n; });
    // 第一條：a·v1 = b·v2；第二條：c·y = d·z
    const e1 = mode === 'yz' ? ['x', 'y'] : ['x', 'z'];
    const p1 = { cols: e1.map(s => LB_VARS.indexOf(s)), vals: [b, a] };
    const p2 = { cols: [1, 2], vals: [d, c] };
    const common = mode === 'yz' ? 1 : 2;
    const A = lbAlign(p1, p2, common);
    const fin = A.simp;

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '係數交叉對調，再對齊共同項', C3);
    lbCrossPair(ctx, 140, 70, 132, a, e1[0], b, e1[1]);
    lbCrossPair(ctx, 400, 70, 132, c, 'y', d, 'z');
    textCenter(ctx, '①', 22, 70, MUTED, f(800, 15));
    textCenter(ctx, '②', 282, 70, MUTED, f(800, 15));

    const same = A.v1 === A.v2;
    const rows = [
      { cells: lbCells(p1), tag: '由 ①', color: DK_IVORY },
      { cells: lbCells(p2), tag: '由 ②', color: DK_SEPIA }
    ];
    if (!same) {
      if (A.m1 > 1) rows.push({ cells: lbCells(p1, A.m1), tag: `① ×${A.m1}`, color: DK_IVORY });
      if (A.m2 > 1) rows.push({ cells: lbCells(p2, A.m2), tag: `② ×${A.m2}`, color: DK_SEPIA });
    }
    const divider = rows.length;
    rows.push({ cells: A.merged, tag: '併成連比', color: C3, strong: true });
    if (A.G > 1) rows.push({ cells: A.simp, tag: `同除以 ${A.G}`, color: DK_OK, strong: true });
    lbTable(ctx, {
      colX: [262, 350, 438], heads: LB_VARS.map((s, k) => IT(s, DK_Q[k])), top: 172, rowH: 34,
      rows, hiCol: common, divider, labX: 40, size: 19
    });

    // 驗算：x = Xr、y = Yr、z = Zr 代回兩條關係式
    const X = fin[0], Y = fin[1], Z = fin[2];
    const val1 = e1[1] === 'y' ? Y : Z;
    const ok1 = a * X === b * val1, ok2 = c * Y === d * Z;
    textCenter(ctx, `驗算：取 x = ${X}、y = ${Y}、z = ${Z}`, W / 2, 420, MUTED, f(700, 14));
    textCenter(ctx, `① ${a} × ${X} = ${a * X}，${b} × ${val1} = ${b * val1} ${ok1 ? '✓' : '✗'}　　② ${c} × ${Y} = ${c * Y}，${d} × ${Z} = ${d * Z} ${ok2 ? '✓' : '✗'}`, W / 2, 450, ok1 && ok2 ? DK_OK : DK_NO, f(800, 14.5));

    const eq1 = `${a}x = ${b}${e1[1]}`, eq2 = `${c}y = ${d}z`;
    out.innerHTML = `\\(${eq1}\\)<wbr>\\({}\\Rightarrow ${lbPairTex(p1.cols, p1.vals)}\\)，<wbr>\\(${eq2}\\)<wbr>\\({}\\Rightarrow y : z = ${d} : ${c}\\)，<wbr>\\(x : y : z = ${lbRTex(fin)}\\)`;
    fb.innerHTML = wrapFeedback(`\\(${eq1}\\) 兩邊同除以 \\(${a * b}\\)，得 \\(\\frac{x}{${b}} = \\frac{${e1[1]}}{${a}}\\)，所以 \\(x : ${e1[1]} = ${b} : ${a}\\)——係數交叉對調。<br>再照重點 3 對齊共同項 \\(${LB_VARS[common]}\\)，得 \\(x : y : z = ${lbRTex(fin)}\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('rel-mode-group'), 'data-rel-mode', m => { mode = m; draw(); });
  sl.forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：連比例式——一份是多少
   ========================================================================== */
function initSetrCanvas() {
  const cv = hbEl('canvas-setr');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['setr-a', 'setr-b', 'setr-c'].map(hbEl);
  const vl = ['setr-va', 'setr-vb', 'setr-vc'].map(hbEl);
  const sk = hbEl('setr-k'), vk = hbEl('setr-vk');
  const out = hbEl('setr-formula'), fb = hbEl('setr-feedback');
  const C4 = DK_TONE[4];
  const NAMES = ['A 液', 'B 液', '清水'];
  let known = 2;

  function draw() {
    const W = cv.width, H = cv.height;
    const coef = sl.map(s => hbClampSlider(s, 1, 6));
    coef.forEach((n, k) => { vl[k].textContent = n; });
    const k = hbClampSlider(sk, 1, 30);
    vk.textContent = k + ' 毫升';
    const r = qOf(k, coef[known]);
    const vals = coef.map(n => qMul(r, n));

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '每一小格都是一份 r', C4);
    const top = [VF(IT('x', DK_Q[0]), T(coef[0], DK_Q[0])), T('='), VF(IT('y', DK_Q[1]), T(coef[1], DK_Q[1])), T('='),
                 VF(IT('z', DK_Q[2]), T(coef[2], DK_Q[2])), T('='), IT('r', C4), T('='), qIt(r, C4)];
    drawExpr(ctx, top, W / 2, 76, 21, INK, { gap: 8 });

    // 三條由「一份」組成的長條
    const bw = 46, x0 = 112;
    [150, 212, 274].forEach((y, i) => {
      const on = i === known;
      textLeft(ctx, NAMES[i], 18, y - 9, DK_Q[i], f(800, 15));
      drawIt(ctx, IT(LB_VARS[i], DK_Q[i]), 18, y + 12, 17, DK_Q[i]);
      for (let n = 0; n < coef[i]; n++) {
        ctx.save();
        ctx.fillStyle = DK_Q[i];
        ctx.globalAlpha = on ? 0.75 : 0.45;
        roundRect(ctx, x0 + n * bw, y - 17, bw - 4, 34, 6);
        ctx.fill();
        ctx.restore();
        textCenter(ctx, 'r', x0 + n * bw + (bw - 4) / 2, y, DK_PAPER, fi(800, 17));
      }
      const ex = x0 + 6 * bw + 8;
      if (on) {
        textLeft(ctx, `= ${k}`, ex, y, DK_IVORY, f(800, 18));
        textLeft(ctx, '已知', ex + 62, y, DK_MUSTARD, f(800, 13));
      } else {
        drawExpr(ctx, [T('='), qIt(vals[i], DK_IVORY)], 0, y, 18, DK_IVORY, { left: ex, gap: 6 });
      }
    });

    // 推導
    const kn = LB_VARS[known];
    const rows = [
      { name: `已知${NAMES[known]}`, hint: `${kn} 占 ${coef[known]} 份`, items: [lbTerm(coef[known], 'r'), T('='), T(String(k)), T('⇒', MUTED), IT('r'), T('='), qIt(r)] }
    ];
    [0, 1, 2].filter(i => i !== known).forEach(i => {
      rows.push({ name: `${NAMES[i]} ${LB_VARS[i]}`, hint: `${coef[i]} 份`, items: [IT(LB_VARS[i]), T('='), T(String(coef[i])), T('×'), qOpIt(r), T('='), qIt(vals[i], DK_Q[i])], color: DK_Q[i] });
    });
    drawStepRows(ctx, rows, rows.length, { top: 330, gap: 52, color: C4, eqX: 176, size: 19 });

    const kt = LB_VARS[known];
    const valTex = [0, 1, 2].map(i => `${LB_VARS[i]} = ${qTex(vals[i])}`).join(',\\ ');
    out.innerHTML = `\\(r = ${k} \\div ${coef[known]} = ${qTex(r)}\\)，<wbr>\\(${valTex}\\)`;
    const others = [0, 1, 2].filter(i => i !== known)
      .map(i => `${NAMES[i]}占 \\(${coef[i]}\\) 份，是 \\(${coef[i]} \\times ${qNeedP(r) ? qTexP(r) : qTex(r)} = ${qTex(vals[i])}\\) 毫升`).join('；');
    fb.innerHTML = wrapFeedback(`${NAMES[known]} \\(${kt}\\) 占 \\(${coef[known]}\\) 份、用了 \\(${k}\\) 毫升，所以一份 \\(r = ${qTex(r)}\\) 毫升。<br>${others}。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('setr-known-group'), 'data-setr-known', m => { known = LB_VARS.indexOf(m); draw(); });
  sl.concat([sk]).forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：求連比例式的未知項——拆開來解
   ========================================================================== */

// 置中排出「t0 : t1 = t2 : t3」，回傳四項的中心 x
function lbPropRow(ctx, items, cx, cy, size) {
  const seq = [];
  items.forEach((it, k) => {
    if (k === 1 || k === 3) seq.push(T(':', INK));
    if (k === 2) seq.push(T('=', INK));
    seq.push(it);
  });
  const gap = 10;
  const w = exprWidth(ctx, seq, size, gap);
  let x = cx - w / 2;
  const centers = [];
  seq.forEach((it, k) => {
    if (k) x += gap;
    const iw = drawIt(ctx, it, x, cy, size, INK);
    if (items.indexOf(it) >= 0) centers.push(x + iw / 2);
    x += iw;
  });
  return centers;
}

// 兩端點之間的弧線（上方或下方）與它的標籤
function lbArc(ctx, x1, x2, y, up, color, label) {
  const h = up ? -22 : 22;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) / 2, y + h * 1.6, x2, y);
  ctx.stroke();
  ctx.restore();
  textCenter(ctx, label, (x1 + x2) / 2, y + h * 1.25, color, f(800, 12.5));
}

function initSolveCanvas() {
  const cv = hbEl('canvas-solve');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = hbEl('solve-k');
  const sl = ['solve-a', 'solve-b', 'solve-c'].map(hbEl);
  const vl = ['solve-va', 'solve-vb', 'solve-vc'].map(hbEl);
  const out = hbEl('solve-formula'), fb = hbEl('solve-feedback');
  const C5 = DK_TONE[5];
  let pos = 0;

  function draw() {
    const W = cv.width, H = cv.height;
    const k = hbClampSlider(sk, 1, 12);
    hbEl('solve-vk').textContent = k;
    const R = sl.map(s => hbClampSlider(s, 1, 9));
    R.forEach((n, i) => { vl[i].textContent = n; });
    // 未知項依序叫 x、y
    const names = [];
    let nk = 0;
    [0, 1, 2].forEach(i => { names[i] = i === pos ? null : ['x', 'y'][nk++]; });
    const unknown = [0, 1, 2].filter(i => i !== pos);
    const sol = unknown.map(j => qOf(k * R[j], R[pos]));

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, '已知的那一項，和每個未知項配成比例式', C5);
    const leftItems = [0, 1, 2].map(i => (i === pos ? T(String(k), DK_MUSTARD) : IT(names[i], DK_QB)));
    const full = [];
    leftItems.forEach((it, i) => { if (i) full.push(T(':')); full.push(it); });
    full.push(T('='));
    R.forEach((n, i) => { if (i) full.push(T(':')); full.push(T(String(n), i === pos ? DK_MUSTARD : DK_IVORY)); });
    drawExpr(ctx, full, W / 2, 64, 23, INK, { gap: 8 });

    unknown.forEach((j, n) => {
      const y0 = 100 + n * 182;
      drawPanel(ctx, 14, y0, W - 28, 170, n ? DK_QB : DK_QA, 0.06);
      const u = names[j];
      // 依原本的先後順序寫比例式
      const first = pos < j;
      const terms = first
        ? [T(String(k), DK_MUSTARD), IT(u, DK_QB), T(String(R[pos]), DK_MUSTARD), T(String(R[j]))]
        : [IT(u, DK_QB), T(String(k), DK_MUSTARD), T(String(R[j])), T(String(R[pos]), DK_MUSTARD)];
      const cy = y0 + 48;
      const cx = lbPropRow(ctx, terms, W / 2, cy, 24);
      lbArc(ctx, cx[0], cx[3], cy - 16, true, DK_QA, '外項');
      lbArc(ctx, cx[1], cx[2], cy + 16, false, DK_QB, '內項');
      // 外項乘積＝內項乘積，整理成「R[pos]·u = k·R[j]」
      drawExpr(ctx, [lbTerm(R[pos], u, DK_QB), T('='), T(`${k} × ${R[j]}`), T('='), T(String(k * R[j]))], W / 2, y0 + 112, 20, INK, { gap: 8 });
      drawExpr(ctx, [IT(u, DK_QB), T('='), qIt(sol[n], DK_OK)], W / 2, y0 + 146, 21, INK, { gap: 8 });
    });

    const solTex = unknown.map((j, n) => `${names[j]} = ${qTex(sol[n])}`).join('，');
    out.innerHTML = unknown.map((j, n) => `\\(${names[j]} = ${qTex(sol[n])}\\)`).join('，<wbr>');
    const leftTex = [0, 1, 2].map(i => (i === pos ? String(k) : names[i])).join(' : ');
    fb.innerHTML = wrapFeedback(`\\(${leftTex} = ${R.join(' : ')}\\)：已知的 \\(${k}\\) 對應 \\(${R[pos]}\\)，分別和兩個未知項配成比例式，再用「外項乘積＝內項乘積」。<br>也可以寫成 \\(${k} : ${R[pos]} = ${names[unknown[0]]} : ${R[unknown[0]]} = ${names[unknown[1]]} : ${R[unknown[1]]}\\)，得 ${solTex.replace(/([xy]) = ([^，]+)/g, '\\($1 = $2\\)')}。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('solve-pos-group'), 'data-solve-pos', m => { pos = parseInt(m, 10); draw(); });
  [sk].concat(sl).forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：ax = by = cz 與連比——面積一樣的三張相紙
   ========================================================================== */
function lbEqTex(c) {
  return `${lbCoef(c[0])}x = ${lbCoef(c[1])}y = ${lbCoef(c[2])}z`;
}

function initEqualCanvas() {
  const cv = hbEl('canvas-equal');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['equal-a', 'equal-b', 'equal-c'].map(hbEl);
  const vl = ['equal-va', 'equal-vb', 'equal-vc'].map(hbEl);
  const out = hbEl('equal-formula'), fb = hbEl('equal-feedback');
  const C6 = DK_TONE[6];
  let mode = 'from';

  // 三張長方形：寬 = 係數、高 = 變數，面積 = 係數 × 變數
  function drawRects(coef, hts) {
    const y0 = 300, base = 440;
    const uw = 13;
    const maxH = Math.max.apply(null, hts);
    const hs = 116 / maxH;
    const xs = [60, 230, 400];
    coef.forEach((cw, i) => {
      const w = cw * uw, h = hts[i] * hs;
      const x = xs[i] + (90 - w) / 2;
      ctx.save();
      ctx.fillStyle = DK_Q[i];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, base - h, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = DK_IVORY;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x, base - h, w, h);
      ctx.restore();
      textCenter(ctx, `寬 ${cw}`, x + w / 2, base + 14, DK_Q[i], f(800, 13));
      textLeft(ctx, `${LB_VARS[i]} = ${hts[i]}`, x + w + 6, base - h / 2, DK_Q[i], fi(800, 14));
      textCenter(ctx, `面積 ${cw * hts[i]}`, x + w / 2, base - h - 12, DK_IVORY, f(800, 13));
    });
    textCenter(ctx, '（寬 = 係數，高 = 那個數，面積 = 係數 × 那個數）', 270, y0 - 14, MUTED, f(600, 12.5));
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const c = sl.map(s => hbClampSlider(s, 1, 6));
    c.forEach((n, k) => { vl[k].textContent = n; });
    const L = lbLcmArr(c);
    const inv = c.map(n => L / n);

    ctx.clearRect(0, 0, W, H);
    if (mode === 'from') {
      drawTitle(ctx, `由 ${lbEqTex(c)} 求連比`, C6);
      const rows = [
        { name: '設共同的值 k', items: exprItems(`${lbEqTex(c)} = k`) },
        { name: '各自除過去', items: [0, 1, 2].map(i => SEQ([IT(LB_VARS[i]), T('='), c[i] === 1 ? IT('k') : VF(IT('k'), T(c[i]))], INK, 6)).reduce((a, it, i) => (i ? a.concat([T('，', MUTED), it]) : [it]), []) },
        { name: '寫成連比', items: exprItems('x : y : z =').concat(c.map(n => (n === 1 ? T('1') : FR(1, n))).reduce((a, it, i) => (i ? a.concat([T(':'), it]) : [it]), [])) },
        { name: `同乘以 ${L}`, hint: '係數的最小公倍數', items: exprItems('x : y : z =').concat(lbRItems(inv, DK_Q)) }
      ];
      drawStepRows(ctx, rows, rows.length, { top: 66, gap: 50, color: C6, eqX: 176, size: 20 });
      drawRects(c, inv);
      const big = c.indexOf(Math.max.apply(null, c));
      out.innerHTML = `\\(${lbEqTex(c)}\\)<wbr>\\({}\\Rightarrow x : y : z = ${c.map(n => (n === 1 ? '1' : `\\frac{1}{${n}}`)).join(' : ')}\\)<wbr>\\({}= ${lbRTex(inv)}\\)`;
      const allSame = c[0] === c[1] && c[1] === c[2];
      const note = allSame
        ? '三個係數一樣，三個數也就一樣大。'
        : `係數最大的是 \\(${LB_VARS[big]}\\)，它對應的數反而最小：面積固定時，越寬就越矮。`;
      fb.innerHTML = wrapFeedback(`三張相紙的面積都是 \\(${L}\\)，所以 \\(${lbEqTex(c)}\\)。連比是 \\(${lbRTex(inv)}\\)，不是 \\(${c.join(' : ')}\\)。<br>${note}`);
    } else {
      drawTitle(ctx, `已知 x : y : z = ${c.join(' : ')}，${lbEqTex(c)} 成立嗎？`, C6);
      const sq = c.map(n => n * n);
      const eqAll = sq[0] === sq[1] && sq[1] === sq[2];
      const rows = [
        { name: '設 r', items: exprItems(`x = ${lbR(c[0])},  y = ${lbR(c[1])},  z = ${lbR(c[2])}`) },
        { name: `代進 ${lbEqTex(c)}`, hint: '三項各是多少', items: exprItems(`${lbR(sq[0])},  ${lbR(sq[1])},  ${lbR(sq[2])}`) },
        { name: eqAll ? '三者相等' : '三者不全相等', items: [T(eqAll ? '成立（三個係數剛好一樣）' : '不成立', eqAll ? DK_OK : DK_NO)], color: eqAll ? DK_OK : DK_NO },
        { name: '正確的寫法', hint: `各除以自己的數，再同乘 ${L}`, items: exprItems(lbEqTex(inv)), color: DK_OK }
      ];
      drawStepRows(ctx, rows, rows.length, { top: 66, gap: 50, color: C6, eqX: 186, size: 20 });
      drawRects(c, c);
      out.innerHTML = `\\(x : y : z = ${c.join(' : ')}\\)<wbr>\\({}\\Rightarrow ${lbEqTex(inv)}\\)`;
      let note;
      if (eqAll) {
        note = `三個係數一樣，\\(${lbEqTex(c)}\\) 剛好也成立；只要係數不全相同就不成立。`;
      } else {
        const pairs = [[0, 1], [1, 2], [0, 2]].filter(p => sq[p[0]] === sq[p[1]]);
        note = `代進去得到 \\(${lbR(sq[0])}\\)、\\(${lbR(sq[1])}\\)、\\(${lbR(sq[2])}\\)，`;
        note += pairs.length ? `只有 \\(${pairs.map(p => `${lbCoef(c[p[0]])}${LB_VARS[p[0]]} = ${lbCoef(c[p[1]])}${LB_VARS[p[1]]}`).join('、')}\\)，三者不全相等。` : '三者都不相等。';
      }
      fb.innerHTML = wrapFeedback(`${note}<br>正確的是 \\(\\frac{x}{${c[0]}} = \\frac{y}{${c[1]}} = \\frac{z}{${c[2]}}\\)，同乘以 \\(${L}\\) 得 \\(${lbEqTex(inv)}\\)。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('equal-mode-group'), 'data-equal-mode', m => { mode = m; draw(); });
  sl.forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：設 r 代入，求新的連比——代入整理機
   ========================================================================== */

// 每一項是 [[變數編號, 係數], …]，照題目寫的先後順序排；tex 是按鈕上的寫法
const LB_SUB_EXPR = {
  e1: { terms: [[[0, 1]], [[1, 2]], [[2, 3]]], tex: 'x : 2y : 3z' },
  e2: { terms: [[[0, 3]], [[1, 2]], [[2, 1]]], tex: '3x : 2y : z' },
  e3: { terms: [[[0, 1], [1, 1]], [[1, 1], [2, 1]], [[2, 1], [0, 1]]], tex: '(x + y) : (y + z) : (z + x)' },
  e4: { terms: [[[0, 1], [1, -1]], [[1, 1], [2, -1]], [[2, 1], [0, -1]]], tex: '(x - y) : (y - z) : (z - x)' },
  e5: { terms: [[[0, 1], [1, 1], [2, -1]], [[0, 2], [2, -1]]], tex: '(x + y - z) : (2x - z)' }
};

function lbSubVal(term, val) {
  return term.reduce((s, [i, cf]) => s + cf * val[i], 0);
}

// 把一項（係數向量）寫成代入後的字串，例如 (3r + 2r)、2×2r
function lbSubStr(term, val) {
  const parts = [];
  term.forEach(([i, cf]) => {
    const body = Math.abs(cf) === 1 ? lbR(val[i]) : `${Math.abs(cf)}×${lbR(val[i])}`;
    if (!parts.length) parts.push((cf < 0 ? '-' : '') + body);
    else parts.push((cf < 0 ? ' - ' : ' + ') + body);
  });
  const s = parts.join('');
  return parts.length > 1 ? `(${s})` : s;
}

function initSubCanvas() {
  const cv = hbEl('canvas-sub');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['sub-a', 'sub-b', 'sub-c'].map(hbEl);
  const vl = ['sub-va', 'sub-vb', 'sub-vc'].map(hbEl);
  const out = hbEl('sub-formula'), fb = hbEl('sub-feedback');
  const C7 = DK_TONE[7];
  let ex = 'e3';

  function draw() {
    const W = cv.width, H = cv.height;
    const v = sl.map(s => hbClampSlider(s, 1, 6));
    v.forEach((n, k) => { vl[k].textContent = n; });
    const E = LB_SUB_EXPR[ex];
    const vals = E.terms.map(t => lbSubVal(t, v));
    const zero = vals.some(n => n === 0);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, `x : y : z = ${v.join(' : ')}，求 ${E.tex.replace(/-/g, '−')}`, C7);
    const subLine = E.terms.map(t => lbSubStr(t, v)).join(' : ');
    const rLine = vals.map((n, i) => (i > 0 && n < 0 ? `(${lbR(n)})` : lbR(n))).join(' : ');
    const rows = [
      { name: '設 r', hint: 'r 不為 0', items: exprItems(`x = ${lbR(v[0])},  y = ${lbR(v[1])},  z = ${lbR(v[2])}`) },
      { name: '代入', items: exprItems(subLine) },
      { name: '整理', items: exprItems(rLine) }
    ];
    let simp = null;
    if (zero) {
      rows.push({ name: '出現 0', items: [T('這一組不能寫成連比', DK_NO)], color: DK_NO });
    } else {
      rows.push({ name: '約掉 r', items: lbRItems(vals) });
      simp = lbSimp(vals);
      const G = Math.abs(vals[0] / simp[0]);
      if (G > 1) rows.push({ name: `同除以 ${G}`, hint: '化成最簡', items: lbRItems(simp), color: DK_OK });
    }
    drawStepRows(ctx, rows, rows.length, { top: 72, gap: 54, color: C7, eqX: 150, size: 20 });

    if (zero) {
      textCenter(ctx, '有一項算出來是 0：連比的各項都不可以是 0', W / 2, 382, DK_NO, f(800, 15));
      textCenter(ctx, '換一組 a、b、c 試試看', W / 2, 414, MUTED, f(700, 14));
    } else {
      textCenter(ctx, '每一項都帶著 r，而 r 不為 0，所以可以整個約掉', W / 2, 392, MUTED, f(700, 14));
      if (vals.some(n => n < 0)) textCenter(ctx, '算出負數也照樣寫，第二項以後的負數加括號', W / 2, 424, MUTED, f(700, 14));
    }

    const texSub = E.terms.map(t => lbSubStr(t, v)).join(' : ');
    if (zero) {
      out.innerHTML = `\\(${E.tex}\\)<wbr>\\({}= ${rLine}\\)，<wbr>出現 \\(0\\)，不寫成連比`;
      fb.innerHTML = wrapFeedback(`設 \\(x = ${lbR(v[0])}\\)、\\(y = ${lbR(v[1])}\\)、\\(z = ${lbR(v[2])}\\) 代入，有一項是 \\(0\\)。連比的各項都不可以是 \\(0\\)，這一組 \\(a\\)、\\(b\\)、\\(c\\) 不適用，換一組試試看。`);
    } else {
      out.innerHTML = `\\(${E.tex}\\)<wbr>\\({}= ${rLine}\\)<wbr>\\({}= ${lbRTex(simp)}\\)`;
      fb.innerHTML = wrapFeedback(`設 \\(x = ${lbR(v[0])}\\)、\\(y = ${lbR(v[1])}\\)、\\(z = ${lbR(v[2])}\\) 代入：${E.terms.map((tm, i) => `\\(${i ? '{}: ' : ''}${lbSubStr(tm, v).replace(/×/g, ' \\times ')}\\)`).join('<wbr>')}，整理後每一項都有 \\(r\\)，約掉得 \\(${lbRTex(simp)}\\)。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('sub-expr-group'), 'data-sub-expr', m => { ex = m; draw(); });
  sl.forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：依連比分配總量——顯影液分裝台
   ========================================================================== */
function initShareCanvas() {
  const cv = hbEl('canvas-share');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['share-a', 'share-b', 'share-c'].map(hbEl);
  const vl = ['share-va', 'share-vb', 'share-vc'].map(hbEl);
  const st = hbEl('share-t'), vt = hbEl('share-vt');
  const out = hbEl('share-formula'), fb = hbEl('share-feedback');
  const C8 = DK_TONE[8];
  const NAMES = ['A 液', 'B 液', '清水'];
  let mode = 'r';

  // 總量一律是 a + b + c 的倍數（一份是整數毫升）：份數一變就重設滑桿的範圍
  function syncT(S) {
    const old = parseInt(st.value, 10) || 600;
    st.min = S * 5;
    st.max = S * 60;
    st.step = S;
    st.value = clamp(Math.round(old / S) * S, S * 5, S * 60);
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const v = sl.map(s => hbClampSlider(s, 1, 9));
    v.forEach((n, k) => { vl[k].textContent = n; });
    const S = v[0] + v[1] + v[2];
    if (parseInt(st.step, 10) !== S) syncT(S);
    const T0 = parseInt(st.value, 10);
    vt.textContent = T0 + ' 毫升';
    const r = T0 / S;
    const amt = v.map(n => n * r);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, `${T0} 毫升依 ${v.join(' : ')} 分給 A 液、B 液、清水`, C8);
    let rows;
    if (mode === 'r') {
      rows = [
        { name: '設', hint: '每一份是 r 毫升', items: [0, 1, 2].map(i => SEQ([T(NAMES[i] + ' ='), exprSeq(lbR(v[i]))], INK, 6)).reduce((a, it, i) => (i ? a.concat([T('，', MUTED), it]) : [it]), []) },
        { name: '列式', items: exprItems(`${lbR(v[0])} + ${lbR(v[1])} + ${lbR(v[2])} = ${T0}`) },
        { name: '解', items: exprItems(`${lbR(S)} = ${T0},  r = ${r}`) },
        { name: '答', items: [T(`A 液 ${amt[0]}、B 液 ${amt[1]}、清水 ${amt[2]}`, C8)], color: C8 }
      ];
    } else {
      rows = v.map((n, i) => {
        const fr = reduce(n, S);
        return { name: `${NAMES[i]}占`, hint: `${n} 份／共 ${S} 份`, items: [T(String(T0)), T('×'), fr[1] === 1 ? T(String(fr[0])) : FR(fr[0], fr[1]), T('='), T(String(amt[i]), DK_Q[i])], color: DK_Q[i] };
      });
      rows.push({ name: '檢查', items: [T(`${amt.join(' + ')} = ${T0}`, DK_OK)], color: DK_OK });
    }
    drawStepRows(ctx, rows, rows.length, { top: 66, gap: 50, color: C8, eqX: 150, size: 19 });

    // 長條：T 平均切成 S 份
    const x0 = 30, bw = 480, y = 312, bh = 40;
    const cell = bw / S;
    textCenter(ctx, `全部 ${T0} 毫升，切成 ${S} 份，一份 ${r} 毫升`, W / 2, y - 22, DK_IVORY, f(800, 14.5));
    let n0 = 0;
    v.forEach((n, i) => {
      for (let m = 0; m < n; m++) {
        ctx.save();
        ctx.fillStyle = DK_Q[i];
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x0 + (n0 + m) * cell + 1, y, cell - 2, bh);
        ctx.restore();
      }
      const mid = x0 + (n0 + n / 2) * cell;
      textCenter(ctx, NAMES[i], mid, y + bh + 20, DK_Q[i], f(800, 14));
      textCenter(ctx, `${n} 份 = ${amt[i]}`, mid, y + bh + 42, DK_Q[i], f(800, 13.5));
      n0 += n;
    });
    ctx.save();
    ctx.strokeStyle = DK_IVORY;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y, bw, bh);
    ctx.restore();
    drawNote(ctx, mode === 'r' ? '先求一份 r，再乘上各自的份數' : '每一樣占全部的幾分之幾，就分到總量的幾分之幾', 444, MUTED, 13.5);

    out.innerHTML = `\\(r = ${T0} \\div ${S} = ${r}\\)，<wbr>A 液 \\(${amt[0]}\\)、<wbr>B 液 \\(${amt[1]}\\)、<wbr>清水 \\(${amt[2]}\\) 毫升`;
    const t2 = mode === 'r'
      ? `設三樣是 \\(${lbR(v[0])}\\)、\\(${lbR(v[1])}\\)、\\(${lbR(v[2])}\\)，相加 \\(${lbR(S)} = ${T0}\\)，所以一份 \\(r = ${r}\\) 毫升。`
      : `一共 \\(${S}\\) 份，A 液占 \\(${qTex(v[0], S)}\\)、B 液占 \\(${qTex(v[1], S)}\\)、清水占 \\(${qTex(v[2], S)}\\)，各乘以總量 \\(${T0}\\)。`;
    fb.innerHTML = wrapFeedback(`${t2}<br>A 液 \\(${amt[0]}\\)、B 液 \\(${amt[1]}\\)、清水 \\(${amt[2]}\\) 毫升，加起來正好 \\(${T0}\\) 毫升。`);
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('share-mode-group'), 'data-share-mode', m => { mode = m; draw(); });
  sl.concat([st]).forEach(s => s.addEventListener('input', draw));
  syncT(10);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：兩根桿子重疊——三腳架的伸縮腳
   ========================================================================== */
function initChainCanvas() {
  const cv = hbEl('canvas-chain');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sl = ['chain-p', 'chain-q', 'chain-s', 'chain-t'].map(hbEl);
  const vl = ['chain-vp', 'chain-vq', 'chain-vs', 'chain-vt'].map(hbEl);
  const sL = hbEl('chain-L'), vL = hbEl('chain-vL');
  const out = hbEl('chain-formula'), fb = hbEl('chain-feedback');
  const C9 = DK_TONE[9];
  let mode = 'len';

  function syncL(S) {
    const old = parseInt(sL.value, 10) || 180;
    const hi = S * Math.max(4, Math.floor(300 / S));
    sL.min = S * 2;
    sL.max = hi;
    sL.step = S;
    sL.value = clamp(Math.round(old / S) * S, S * 2, hi);
  }

  // 兩節的示意圖：上節 AC 在上、下節 BD 在下，x0 是 A（或收起來時兩節的上端）
  function drawLeg(y, ab, bc, cd, scale, labels) {
    const x0 = 40;
    const xA = x0, xB = x0 + ab * scale, xC = x0 + (ab + bc) * scale, xD = x0 + (ab + bc + cd) * scale;
    lbBar(ctx, xA, y - 18, xC - xA, 16, DK_QA, 0.8);
    lbBar(ctx, xB, y + 2, xD - xB, 16, DK_QB, 0.8);
    // 重疊的部分
    ctx.save();
    ctx.strokeStyle = DK_MUSTARD;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(xB, y - 20, xC - xB, 40);
    ctx.restore();
    if (labels) {
      [[xA, 'A'], [xB, 'B'], [xC, 'C'], [xD, 'D']].forEach(([x, s]) => {
        ctx.save();
        ctx.strokeStyle = DK_IVORY;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y - 26);
        ctx.lineTo(x, y + 26);
        ctx.stroke();
        ctx.restore();
        textCenter(ctx, s, x, y + 40, DK_IVORY, fi(800, 16));
      });
    }
    return { xA, xB, xC, xD };
  }

  function draw() {
    const W = cv.width, H = cv.height;
    const [p, q, s, t] = sl.map(e => hbClampSlider(e, 1, 6));
    [p, q, s, t].forEach((n, k) => { vl[k].textContent = n; });
    const A = lbAlign({ cols: [0, 1], vals: [p, q] }, { cols: [1, 2], vals: [s, t] }, 1);
    const u = A.simp;
    const S = u[0] + u[1] + u[2];
    if (parseInt(sL.step, 10) !== S || !sL.dataset.synced) { syncL(S); sL.dataset.synced = '1'; }
    const L = parseInt(sL.value, 10);
    vL.textContent = L + ' 公分';
    const U = L / S;
    const ab = u[0] * U, bc = u[1] * U, cd = u[2] * U;
    const ac = ab + bc, bd = bc + cd;
    const shortest = Math.max(ac, bd);

    ctx.clearRect(0, 0, W, H);
    drawTitle(ctx, mode === 'len' ? '拉到最長：上節與下節重疊一段' : '收到最短：B 點推到 A 點，短的那一節整個縮進去', C9);
    const scale = 460 / L;
    const P = drawLeg(84, ab, bc, cd, scale, true);
    textLeft(ctx, '上節', P.xA + 4, 66 - 6, DK_QA, f(800, 12.5));
    textLeft(ctx, '下節', P.xD - 34, 112, DK_QB, f(800, 12.5));

    const rows = [
      { cells: [p, q, null], tag: '第一個比', color: DK_IVORY },
      { cells: [null, s, t], tag: '第二個比', color: DK_SEPIA }
    ];
    if (A.v1 !== A.v2) {
      if (A.m1 > 1) rows.push({ cells: [p * A.m1, q * A.m1, null], tag: `第一個比 ×${A.m1}`, color: DK_IVORY });
      if (A.m2 > 1) rows.push({ cells: [null, s * A.m2, t * A.m2], tag: `第二個比 ×${A.m2}`, color: DK_SEPIA });
    }
    const divider = rows.length;
    rows.push({ cells: A.merged, tag: '併成連比', color: C9, strong: true });
    if (A.G > 1) rows.push({ cells: A.simp, tag: `同除以 ${A.G}`, color: DK_OK, strong: true });
    const colX = [262, 350, 438];
    lbTable(ctx, { colX, heads: [T(''), T(''), T('')], top: 166, rowH: 28, rows, hiCol: 1, divider, labX: 40, size: 18 });
    lbOverHeads(ctx, ['AB', 'BC', 'CD'], colX, 168, INK);

    const yR = 376;
    textCenter(ctx, `全長 ${L} 公分，共 ${S} 份，一份 ${L} ÷ ${S} = ${U} 公分`, W / 2, yR, DK_IVORY, f(800, 14.5));
    if (mode === 'len') {
      lbSegText(ctx, `[AB] = ${ab}、[BC] = ${bc}、[CD] = ${cd}（公分）`, W / 2, yR + 34, MUTED, 14);
      lbSegText(ctx, `上節 [AC] = ${u[0]} + ${u[1]} = ${u[0] + u[1]} 份 = ${ac} 公分`, W / 2, yR + 68, DK_QA, 15);
      lbSegText(ctx, `下節 [BD] = ${u[1]} + ${u[2]} = ${u[1] + u[2]} 份 = ${bd} 公分`, W / 2, yR + 98, DK_QB, 15);
    } else {
      // 收起來：兩節上端對齊
      const x0 = 40, sc2 = 400 / L;   // 留右邊放標籤
      lbBar(ctx, x0, yR + 22, ac * sc2, 14, DK_QA, 0.8);
      lbBar(ctx, x0, yR + 40, bd * sc2, 14, DK_QB, 0.8);
      textLeft(ctx, `上節 ${ac}`, x0 + ac * sc2 + 6, yR + 29, DK_QA, f(800, 13));
      textLeft(ctx, `下節 ${bd}`, x0 + bd * sc2 + 6, yR + 47, DK_QB, f(800, 13));
      const longer = bd >= ac ? '下節 [BD]' : '上節 [AC]';
      lbSegText(ctx, `最短的長度 = 較長的那一節 = ${longer} = ${shortest} 公分`, W / 2, yR + 98, DK_OK, 15);
    }

    const seg = '\\overline{AB} : \\overline{BC} : \\overline{CD}';
    if (mode === 'len') {
      out.innerHTML = `\\(${seg} = ${lbRTex(u)}\\)，<wbr>\\(\\overline{AC} = ${ac}\\)，<wbr>\\(\\overline{BD} = ${bd}\\)`;
      fb.innerHTML = wrapFeedback(`以重疊的 \\(\\overline{BC}\\) 為共同項，併成 \\(${seg} = ${lbRTex(u)}\\)，共 \\(${S}\\) 份，一份 \\(${U}\\) 公分。<br>上節 \\(\\overline{AC} = ${ac}\\) 公分、下節 \\(\\overline{BD} = ${bd}\\) 公分；兩節都含 \\(\\overline{BC}\\)，所以兩節相加 \\(${ac + bd}\\) 比全長多了一段 \\(\\overline{BC} = ${bc}\\)。`);
    } else {
      out.innerHTML = `\\(\\overline{AC} = ${ac}\\)，<wbr>\\(\\overline{BD} = ${bd}\\)，<wbr>最短 \\(${shortest}\\) 公分`;
      const why = bd > ac
        ? `下節比較長，\\(B\\) 推到 \\(A\\) 時上節整段和下節重疊，剩下的長度就是下節 \\(\\overline{BD} = ${bd}\\) 公分。`
        : (bd === ac ? `兩節一樣長，收起來剛好完全重疊，長度是 \\(${ac}\\) 公分。` : `上節比較長，下節整段縮進上節裡，長度就是上節 \\(\\overline{AC} = ${ac}\\) 公分。`);
      fb.innerHTML = wrapFeedback(`${why}<br>比拉到最長時少了 \\(${L - shortest}\\) 公分。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(hbEl('chain-mode-group'), 'data-chain-mode', m => { mode = m; draw(); });
  sl.concat([sL]).forEach(e => e.addEventListener('input', draw));
  drawWithFonts(draw);
}
