/* ==========================================================================
   3-3-2（第三冊 3-2）利用十字交乘法做因式分解 — 互動 Canvas 與隨堂評量
   畫風：蒙德里安色塊拼板工作室（小格、阿方），沿用 3-3-1。粗框線分割的
   紅、藍、黃色塊就是代數磚：紅色大方塊是 x²，藍色長條是 x，黃色小方塊是 1。
   十字交乘的直式也照這個配色：左欄（x 項）紅、右欄（常數）黃、交叉相乘
   湊出來的中間項藍。玫瑰 MD_ROSE 是不合，翡翠綠 MD_JADE 是合。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／measure／drawExpr／
   drawPanel／drawTitle／wbrEq／textCenter／textLeft／bindPickGroup…），
   本檔只放本節的色票、多項式小工具、十字交乘直式與 11 個互動。

   ⚠️ 多項式字串工具（mdParse／py*／linStr／par…）由 3-3-1 搬來（各頁各自
   載入，不會撞名）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initExpandCanvas();
  initSameCanvas();
  initMixedCanvas();
  initCannotCanvas();
  initLeadCanvas();
  initSwapCanvas();
  initNegCanvas();
  initPullCanvas();
  initSharedCanvas();
  initReverseCanvas();
  initTilesCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（MD_ = Mondrian；共用檔沒有這個前綴）
   ========================================================================== */

const MD_RED = '#fca5a5';     // x² 的紅色大方塊；十字交乘左欄
const MD_BLUE = '#93c5fd';    // x 的藍色長條；交叉相乘湊出的中間項
const MD_YELLOW = '#fde047';  // 1 的黃色小方塊；十字交乘右欄（常數）
const MD_FRAME = '#e2e8f0';   // 蒙德里安的粗框線（深色底上改用淺色）
const MD_ROSE = '#fb7185';    // 不合、錯誤
const MD_JADE = '#6ee7b7';    // 合、成立
const MD_CREAM = '#fef3c7';   // 深色底板上的算式字色

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const MD_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function mn(s) {
  return String(s).replace(/-/g, '−');
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（3-3-1 的 mdParse）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」「-(x + 2)(x - 7)」。
   -------------------------------------------------------------------------- */
function mdParse(str, color) {
  const out = [];
  let buf = '';
  const flush = () => {
    if (buf) { out.push(T(buf.replace(/-/g, '−').replace(/·/g, ' × '), color)); buf = ''; }
  };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[') {
      let d = 1, j = i + 1;
      while (j < str.length) {
        if (str[j] === '(' || str[j] === '[') d++;
        else if (str[j] === ')' || str[j] === ']') { d--; if (d === 0) break; }
        j++;
      }
      flush();
      out.push(GRP([SEQ(mdParse(str.slice(i + 1, j), color), color, 1)], ch === '[' ? '[]' : '()', color));
      i = j;
      continue;
    }
    if (ch === '^') {
      let e = '';
      while (i + 1 < str.length && /[0-9]/.test(str[i + 1])) e += str[++i];
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
    if (/[a-z]/.test(ch)) {
      flush();
      out.push(IT(ch, color));
      continue;
    }
    buf += ch;
  }
  flush();
  return out;
}

function mdInk(s, color) {
  return SEQ(mdParse(String(s), color), color, 1);
}

// 一塊蒙德里安色塊：半透明填色、淺色粗框
function mdBlock(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.28 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = o.frameAlpha == null ? 0.9 : o.frameAlpha;
  ctx.strokeStyle = o.frame || MD_FRAME;
  ctx.lineWidth = o.lw || 3;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function mdLine(ctx, x1, y1, x2, y2, color, width, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width || 2;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// 置中的一行算式（中文字與算式元件混排）
function exLine(ctx, items, y, size, color) {
  return drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 17, color || INK, { maxW: ctx.canvas.width - 60, gap: 6 });
}

// 直立的標籤（長方形左邊的寬）
function vLabel(ctx, items, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawExpr(ctx, items, 0, 0, size, color, { maxW: 400, gap: 4 });
  ctx.restore();
}

/* --------------------------------------------------------------------------
   整數係數多項式：以係數陣列表示，索引就是次數。[4, -5, 3] 代表 3x² − 5x + 4。
   字串一律是 ASCII（x^2），同一條字串可以直接當 LaTeX，也可以給 mdInk。
   -------------------------------------------------------------------------- */

// 係數的絕對值 a 與次數 d → 「3x^2」「x」「5」（係數 1 不寫）
function pyBody(a, d) {
  if (d === 0) return numStr(a);
  const k = (a === 1) ? '' : numStr(a);
  return d === 1 ? k + 'x' : k + 'x^' + d;
}

// [[係數, 次數], ...] 照給定順序排成一條式子；係數 0 的略過
function pyJoin(list) {
  let s = '';
  list.forEach(([c, d]) => {
    if (c === 0) return;
    const body = pyBody(Math.abs(c), d);
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

function pyStr(p) {
  const list = [];
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) list.push([p[d], d]);
  return pyJoin(list);
}

function pyMono(c, d) {
  return pyJoin([[c, d]]);
}

// 二次式 ax² + bx + c
function quad(a, b, c) {
  return pyStr([c, b, a]);
}

// 一次式 px + q
function linStr(p, q) {
  return pyStr([q, p]);
}

// 當成加數寫在 + 後面時，負數要加括號
function par(v) {
  const t = String(v);
  return t.charAt(0) === '-' ? '(' + t + ')' : t;
}

// (a1x + c1)(a2x + c2)；兩個因式一樣時寫成平方
function fac(a1, c1, a2, c2) {
  const s1 = linStr(a1, c1), s2 = linStr(a2, c2);
  if (s1 === s2) return `(${s1})^2`;
  // 其中一個是單項式（常數為 0）時寫在前面、不加括號：x(x + 3)
  if (c1 === 0 && c2 !== 0) return `${s1}(${s2})`;
  if (c2 === 0 && c1 !== 0) return `${s2}(${s1})`;
  return `(${s1})(${s2})`;
}

// 正因數對 [m, n]，m ≤ n
function pairsPos(n) {
  const out = [];
  for (let d = 1; d * d <= n; d++) if (n % d === 0) out.push([d, n / d]);
  return out;
}

// 正因數的「有序」對 [d, n/d]，d 由小到大（右欄上下對調算不同的排法）
function pairsOrdered(n) {
  const out = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push([d, n / d]);
  return out;
}

// 二次項係數 a 的拆法：a1 ≤ a2（左欄對調等於上下兩列對調，不必重試）
function leadPairs(a) {
  return pairsPos(a);
}

// 常數項 q 的所有整數因數對（不分順序）：q > 0 同號兩組，q < 0 一正一負
function allPairs(q) {
  const out = [];
  const P = pairsPos(Math.abs(q));
  if (q > 0) {
    P.forEach(([m, n]) => out.push([m, n]));
    P.forEach(([m, n]) => out.push([-m, -n]));
  } else {
    P.forEach(([m, n]) => {
      out.push([-m, n]);
      if (m !== n) out.push([m, -n]);
    });
  }
  return out;
}

// 十字交乘的中間項：左下乘右上 + 左上乘右下（課本的寫法順序）
function crossMid(a1, c1, a2, c2) {
  return a2 * c1 + a1 * c2;
}

// 右欄常數在 canvas 上一律帶正負號
function cTerm(c) {
  return (c < 0 ? '− ' : '+ ') + Math.abs(c);
}

// 「3x + 4x = 7x」：交叉相乘的兩項相加
function crossSumStr(a1, c1, a2, c2) {
  const p1 = a2 * c1, p2 = a1 * c2;
  return `${pyMono(p1, 1)} ${p2 < 0 ? '-' : '+'} ${pyBody(Math.abs(p2), 1)} = ${pyMono(p1 + p2, 1)}`;
}

/**
 * 畫一個十字交乘的直式：
 *     a1x │ c1
 *          ╳
 *     a2x │ c2
 *   a2c1x + a1c2x = (中間項)
 * opts：{ size, dx, dy, bwL, bwR, ends（上方標出兩端的乘積）, target（要湊的中間項）,
 *         sum（false 時不畫下面那一行）, sumSize, sumW }
 * 回傳中間項係數。
 */
function drawCross(ctx, cx, cy, a1, c1, a2, c2, opts) {
  const o = opts || {};
  const size = o.size || 22;
  const dx = o.dx || 52, dy = o.dy || 34;
  const bwL = o.bwL || 72, bwR = o.bwR || 64, bh = o.bh || 46;
  const xl = cx - dx, xr = cx + dx;
  const y1 = cy - dy, y2 = cy + dy;
  const lx = xl + bwL / 2 + 4, rx = xr - bwR / 2 - 4;
  mdLine(ctx, lx, y1 + 6, rx, y2 - 6, INK, 2.4);
  mdLine(ctx, lx, y2 - 6, rx, y1 + 6, INK, 2.4);
  [[a1, y1], [a2, y2]].forEach(([a, y]) => {
    mdBlock(ctx, xl - bwL / 2, y - bh / 2, bwL, bh, MD_RED, { alpha: 0.18, lw: 2.5 });
    drawExpr(ctx, [mdInk(pyMono(a, 1), MD_RED)], xl, y, size, MD_RED, { maxW: bwL - 8 });
  });
  [[c1, y1], [c2, y2]].forEach(([c, y]) => {
    mdBlock(ctx, xr - bwR / 2, y - bh / 2, bwR, bh, MD_YELLOW, { alpha: 0.18, lw: 2.5 });
    drawExpr(ctx, [T(cTerm(c), MD_YELLOW)], xr, y, size, MD_YELLOW, { maxW: bwR - 6 });
  });
  if (o.ends) {
    const ey = y1 - bh / 2 - 15;
    drawExpr(ctx, [T('相乘', MUTED), mdInk(pyMono(a1 * a2, 2), MD_RED)], xl, ey, 14, MUTED, { maxW: 2 * dx - 8, gap: 4 });
    drawExpr(ctx, [T('相乘', MUTED), T(mn(c1 * c2), MD_YELLOW)], xr, ey, 14, MUTED, { maxW: 2 * dx - 8, gap: 4 });
  }
  const mid = crossMid(a1, c1, a2, c2);
  if (o.sum !== false) {
    const items = [mdInk(crossSumStr(a1, c1, a2, c2), MD_BLUE)];
    if (o.target != null) items.push(T(mid === o.target ? '✓' : '✗', mid === o.target ? MD_JADE : MD_ROSE));
    drawExpr(ctx, items, cx, y2 + bh / 2 + 24, o.sumSize || 19, MD_BLUE, { maxW: o.sumW || 300, gap: 8 });
  }
  return mid;
}

/**
 * 代數磚拼成的長方形 (a1x + c1)(a2x + c2)：
 * 直欄先 a1 條寬 X、再 c1 條寬 U；橫列先 a2 列高 X、再 c2 列高 U。
 * X×X 是紅色 x²，X×U 是藍色 x，U×U 是黃色 1。
 */
function drawTiles(ctx, x0, y0, a1, c1, a2, c2, X, U) {
  const cols = [], rows = [];
  for (let i = 0; i < a1; i++) cols.push(X);
  for (let i = 0; i < c1; i++) cols.push(U);
  for (let i = 0; i < a2; i++) rows.push(X);
  for (let i = 0; i < c2; i++) rows.push(U);
  let y = y0;
  rows.forEach((h, r) => {
    let x = x0;
    cols.forEach((w, c) => {
      const big = (c < a1 ? 1 : 0) + (r < a2 ? 1 : 0);
      const col = big === 2 ? MD_RED : (big === 1 ? MD_BLUE : MD_YELLOW);
      mdBlock(ctx, x, y, w, h, col, { alpha: 0.32, lw: big ? 2.6 : 1.6 });
      x += w;
    });
    y += h;
  });
  return { w: cols.reduce((s, v) => s + v, 0), h: rows.reduce((s, v) => s + v, 0) };
}

// 步驟按鈕：上一步／下一步／全部顯示（沒有的按鈕略過）
function bindSteps(prefix, getN, state, draw) {
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  if (prev) prev.addEventListener('click', () => { state.step -= 1; draw(); });
  if (next) next.addEventListener('click', () => { state.step += 1; draw(); });
  if (all) all.addEventListener('click', () => { state.step = getN(); draw(); });
}

function syncSteps(prefix, step, n) {
  const prev = elById(prefix + '-prev'), next = elById(prefix + '-next'), all = elById(prefix + '-all');
  const counter = elById(prefix + '-step');
  if (counter) counter.textContent = `${step} / ${n}`;
  if (prev) prev.disabled = (step <= 1);
  if (next) next.disabled = (step >= n);
  if (all) all.disabled = (step >= n);
}

// 一顆因數對的小徽章；state：'now'（正在試）、'hit'、'miss'、'skip'（不必試）、'todo'
// sub 有值時分兩行：上面是兩數，下面是它們的和
function pairChip(ctx, x, y, w, h, label, state, color, sub) {
  const col = { now: color, hit: MD_JADE, miss: MD_ROSE, skip: DIM, todo: MUTED }[state];
  ctx.save();
  ctx.fillStyle = state === 'now' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = state === 'now' ? 2.6 : 1.5;
  if (state === 'skip') ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.restore();
  if (sub) {
    textCenter(ctx, label, x + w / 2, y + h * 0.32, col, f(state === 'now' ? 800 : 700, 14));
    textCenter(ctx, sub, x + w / 2, y + h * 0.72, col, f(600, 12));
  } else {
    textCenter(ctx, label, x + w / 2, y + h / 2, col, f(state === 'now' ? 800 : 700, 14));
  }
  if (state === 'skip') mdLine(ctx, x + 10, y + h / 2, x + w - 10, y + h / 2, DIM, 1.5);
}

// 由左而右、由上而下排一格一格的徽章，回傳每格的位置
function chipGrid(n, perRow, x0, x1, y0, h, gap) {
  const cols = Math.min(perRow, n);
  const w = (x1 - x0 - gap * (cols - 1)) / cols;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow), c = i % perRow;
    const inRow = Math.min(perRow, n - r * perRow);
    const rowW = inRow * w + (inRow - 1) * gap;
    const xs = (x0 + x1) / 2 - rowW / 2;
    out.push({ x: xs + c * (w + gap), y: y0 + r * (h + gap), w, h });
  }
  return out;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 3-2 的 22 題正解
  // 正解字母分布：A 5 題、B 6 題、C 6 題、D 5 題（開發約束 36）
  const answers = {
    '3-2-1': 'A',    // x² − 2x − 35：a + b = −2、ab = −35
    '3-2-2': 'B',    // x² + 11x + 24：a + b = 11、ab = 24
    '3-2-3': 'C',    // x² − 14x + 45 = (x − 5)(x − 9)
    '3-2-4': 'D',    // x² − 11x + 18 = (x − 2)(x − 9)
    '3-2-5': 'B',    // x² + 6x − 27 = (x − 3)(x + 9)
    '3-2-6': 'D',    // x² − 8x − 33 = (x + 3)(x − 11)
    '3-2-7': 'C',    // x² + 10x + 30 不能分解
    '3-2-8': 'D',    // x² − 36 = x² + 0x − 36 = (x + 6)(x − 6)
    '3-2-9': 'B',    // 3x² + 17x + 10 = (x + 5)(3x + 2)
    '3-2-10': 'A',   // 6x² − 19x + 10 = (2x − 5)(3x − 2)
    '3-2-11': 'C',   // 2x² + x − 15 = (x + 3)(2x − 5)
    '3-2-12': 'B',   // 3x² + 7x − 6：差一個號，對調得 (x + 3)(3x − 2)
    '3-2-13': 'C',   // −x² + 4x + 45 = −(x − 9)(x + 5)
    '3-2-14': 'A',   // 20 − 3x − 2x² = −(2x − 5)(x + 4)
    '3-2-15': 'C',   // 2x² + 10x − 72 = 2(x + 9)(x − 4)
    '3-2-16': 'D',   // 3x² + 6x − 72 = (3x − 12)(x + 6) 還要提出 3
    '3-2-17': 'C',   // x² + 3x − 28 與 2x² − 5x − 12 的公因式 x − 4
    '3-2-18': 'D',   // x² − 2x − 24 與 3x² + 13x + 4 的公因式 x + 4
    '3-2-19': 'B',   // 8x² − 2x − 15 = (2x − 3)(4x + 5)，a + b + c = 6
    '3-2-20': 'A',   // x² + kx − 39 = (x − 3)(x + 13)，k = 10
    '3-2-21': 'A',   // 4x² + 13x + 9 = (x + 1)(4x + 9)
    '3-2-22': 'B'    // 3x² + bx + 10：b 可為 11、13、17、31，再拿 2 張
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
   重點 1：十字交乘的由來——(x + a)(x + b) = x² + (a + b)x + ab
   ========================================================================== */
function initExpandCanvas() {
  const cv = elById('canvas-exp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('xp-a'), sb = elById('xp-b');
  const va = elById('xp-va'), vb = elById('xp-vb');
  const out = elById('xp-formula');
  const fb = elById('xp-feedback');
  const C = MD_TONE[0];

  function draw() {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    const p = a + b, q = a * b;
    const X = 100, U = 20, x0 = 84, y0 = 84;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '色塊拼成長方形，再寫成十字交乘', C);
    const R = drawTiles(ctx, x0, y0, 1, a, 1, b, X, U);
    drawExpr(ctx, [mdInk(linStr(1, a), MD_CREAM)], x0 + R.w / 2, y0 - 16, 18, MD_CREAM);
    vLabel(ctx, [mdInk(linStr(1, b), MD_CREAM)], x0 - 20, y0 + R.h / 2, 18, MD_CREAM);

    drawCross(ctx, 410, 176, 1, a, 1, b, { ends: true, target: p, sumW: 220 });

    const y = 306;
    drawPanel(ctx, 18, y, cv.width - 36, 140, C, 0.06);
    exLine(ctx, [mdInk(`${fac(1, a, 1, b)} = ${quad(1, p, q)}`, MD_CREAM)], y + 28, 20);
    exLine(ctx, [T('紅 1 塊 →', MD_RED), mdInk('x^2', MD_RED), T(`　藍 ${p} 條 →`, MD_BLUE), mdInk(pyMono(p, 1), MD_BLUE),
      T(`　黃 ${q} 塊 →`, MD_YELLOW), T(String(q), MD_YELLOW)], y + 70, 17);
    exLine(ctx, [T(`看兩端：x² 和 ${q}；湊中間：${a} + ${b} = ${p}`, MUTED)], y + 110, 16);

    out.innerHTML = wbrEq(`${fac(1, a, 1, b)} = ${quad(1, p, q)}`);
    fb.innerHTML = wrapFeedback(`藍色長條有 \\(${a} + ${b} = ${p}\\) 條，就是 \\(x\\) 項係數；黃色方塊有 \\(${a} \\times ${b} = ${q}\\) 塊，就是常數項。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：x² 係數為 1、常數項為正——兩數同號，跟著 x 項係數的號
   ========================================================================== */
const SS_SETS = {
  s1: { p: 13, q: 36 },    // (x + 4)(x + 9)
  s2: { p: -13, q: 30 },   // (x − 3)(x − 10)
  s3: { p: -12, q: 32 },   // (x − 4)(x − 8)
  s4: { p: 14, q: 24 }     // (x + 2)(x + 12)
};

function initSameCanvas() {
  const cv = elById('canvas-same');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kG = elById('ss-prob-group'), mG = elById('ss-mode-group');
  const out = elById('ss-formula');
  const fb = elById('ss-feedback');
  const C = MD_TONE[1];
  const st = { step: 1 };
  let key = 's1', mode = 'all', list = [];

  function draw() {
    const S = SS_SETS[key];
    const p = S.p, q = S.q;
    const every = allPairs(q);
    list = mode === 'all' ? every : every.filter(([m]) => Math.sign(m) === Math.sign(p));
    st.step = clamp(st.step, 1, list.length);
    syncSteps('ss', st.step, list.length);
    const [m, n] = list[st.step - 1];
    const mid = m + n, hit = (mid === p);
    const poly = quad(1, p, q);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '一組一組試：相乘是常數項、相加是 x 項係數', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 58, C, 0.06);
    exLine(ctx, [mdInk(poly, MD_CREAM)], 62, 20);
    exLine(ctx, [T(`找兩數：相乘 = ${mn(q)}、相加 = ${mn(p)}`, MUTED)], 88, 15);

    drawCross(ctx, cv.width / 2, 178, 1, m, 1, n, { target: p });

    const cells = chipGrid(every.length, 5, 24, cv.width - 24, 280, 44, 8);
    every.forEach(([a, b], i) => {
      const idx = list.findIndex(([u, v]) => u === a && v === b);
      let s = 'todo';
      if (idx < 0) s = 'skip';
      else if (idx === st.step - 1) s = 'now';
      else if (idx < st.step - 1) s = (a + b === p) ? 'hit' : 'miss';
      const c = cells[i];
      pairChip(ctx, c.x, c.y, c.w, c.h, `${mn(a)}, ${mn(b)}`, s, C, `和 ${mn(a + b)}`);
    });

    const y = 388;
    drawPanel(ctx, 18, y, cv.width - 36, 74, hit ? MD_JADE : MD_ROSE, 0.08);
    if (hit) {
      exLine(ctx, [T('找到了：', MD_JADE), mdInk(`${poly} = ${fac(1, m, 1, n)}`, INK)], y + 26, 18);
      exLine(ctx, [T('有一組合就停，後面的不必再試', MUTED)], y + 56, 15);
    } else {
      exLine(ctx, [T(`${mn(m)} + ${mn(par(n))} = ${mn(mid)}，不是 ${mn(p)}`, MD_ROSE)], y + 26, 18);
      exLine(ctx, [T(mode === 'all' ? '按「下一組」繼續試' : `${p > 0 ? '中間是正的：只試兩個正數' : '中間是負的：只試兩個負數'}`, MUTED)], y + 56, 15);
    }

    out.innerHTML = wbrEq(`${fac(1, m, 1, n)} = ${quad(1, mid, q)}`);
    fb.innerHTML = wrapFeedback(hit
      ? `\\(${m}\\) 和 \\(${n}\\) 相乘 \\(${q}\\)、相加 \\(${p}\\)：${wbrEq(`${poly} = ${fac(1, m, 1, n)}`)}。`
      : (mode === 'all'
        ? `\\(${m} + ${par(n)} = ${mid}\\)，不等於 \\(${p}\\)。常數項是正的，兩數一定同號；看看正確的那一組是同正還是同負。`
        : `常數項 \\(${q}\\) 是正的 → 兩數同號；\\(x\\) 項係數 \\(${p}\\) 是${p > 0 ? '正' : '負'}的 → 兩數都${p > 0 ? '正' : '負'}，另一半（虛線）不必試。`));
    typeset([out, fb]);
  }

  bindPickGroup(kG, 'data-ss-prob', v => { key = v; st.step = 1; draw(); });
  bindPickGroup(mG, 'data-ss-mode', v => { mode = v; st.step = 1; draw(); });
  bindSteps('ss', () => list.length, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：x² 係數為 1、常數項為負——一正一負，絕對值大的跟 x 項係數同號
   ========================================================================== */
const SM_SETS = {
  m1: { p: 4, q: -32 },    // (x − 4)(x + 8)
  m2: { p: -7, q: -30 },   // (x + 3)(x − 10)
  m3: { p: 9, q: -22 },    // (x − 2)(x + 11)
  m4: { p: -2, q: -48 }    // (x + 6)(x − 8)
};

function initMixedCanvas() {
  const cv = elById('canvas-mixed');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('sm-k'), vk = elById('sm-vk');
  const kG = elById('sm-prob-group'), gG = elById('sm-sign-group');
  const out = elById('sm-formula');
  const fb = elById('sm-feedback');
  const C = MD_TONE[2];
  let key = 'm1', sign = 'pos';

  function draw() {
    const S = SM_SETS[key];
    const p = S.p, q = S.q;
    const P = pairsPos(-q);
    sk.max = P.length - 1;
    const k = clamp(iv(sk), 0, P.length - 1);
    const [m, n] = P[k];
    vk.textContent = `${m} 和 ${n}`;
    const c1 = sign === 'pos' ? -m : m, c2 = sign === 'pos' ? n : -n;
    const mid = c1 + c2, hit = (mid === p), flip = (mid === -p);
    const poly = quad(1, p, q);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '一正一負：先找「差」，再決定誰取正', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 58, C, 0.06);
    exLine(ctx, [mdInk(poly, MD_CREAM)], 62, 20);
    exLine(ctx, [T(`找兩數：相乘 = ${mn(q)}（一正一負）、相加 = ${mn(p)}`, MUTED)], 88, 15);

    // 左邊：|q| 的因數對與差
    textCenter(ctx, `${-q} 的因數對`, 84, 126, MUTED, f(800, 14));
    textCenter(ctx, '差', 196, 126, MUTED, f(800, 14));
    P.forEach(([u, v], i) => {
      const y = 158 + i * 30;
      const now = (i === k), good = (v - u === Math.abs(p));
      if (now) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, 24, y - 13, 212, 26, 6);
        ctx.fill();
        ctx.restore();
      }
      const col = good ? MD_JADE : (now ? C : INK);
      textCenter(ctx, `${u} 和 ${v}`, 84, y, col, f(now ? 800 : 700, 15));
      textCenter(ctx, String(v - u), 196, y, col, f(now ? 800 : 700, 15));
    });
    mdLine(ctx, 250, 116, 250, 300, 'rgba(226,232,240,0.25)', 2);

    drawCross(ctx, 395, 186, 1, c1, 1, c2, { target: p, sumW: 260, dx: 50 });

    const y = 318;
    drawPanel(ctx, 18, y, cv.width - 36, 132, hit ? MD_JADE : MD_ROSE, 0.08);
    if (hit) {
      exLine(ctx, [T('合：', MD_JADE), mdInk(`${poly} = ${fac(1, c1, 1, c2)}`, INK)], y + 30, 19);
      exLine(ctx, [T(`差是 ${n - m}，大的 ${n} 取${p > 0 ? '正' : '負'}，因為 x 項係數是${p > 0 ? '正' : '負'}的`, MUTED)], y + 70, 15);
      exLine(ctx, [T(`驗算：${mn(c1)} × ${mn(par(c2))} = ${mn(q)}、${mn(c1)} + ${mn(par(c2))} = ${mn(p)}`, MUTED)], y + 102, 15);
    } else if (flip) {
      exLine(ctx, [T('差對了，但符號放反：中間變成', MD_ROSE), mdInk(pyMono(mid, 1), MD_ROSE)], y + 30, 18);
      exLine(ctx, [T(`x 項係數是${p > 0 ? '正' : '負'}的 → 大的 ${n} 要取${p > 0 ? '正' : '負'}`, INK)], y + 70, 16);
      exLine(ctx, [T(`按「大的取${p > 0 ? '正' : '負'}」`, MUTED)], y + 102, 15);
    } else {
      exLine(ctx, [T(`${m} 和 ${n} 的差是 ${n - m}，不是 ${Math.abs(p)}`, MD_ROSE)], y + 30, 18);
      exLine(ctx, [T(`一正一負相加，結果的大小就是兩數的差`, INK)], y + 70, 16);
      exLine(ctx, [T('拉滑桿換一對，找差是 ' + Math.abs(p) + ' 的那一對', MUTED)], y + 102, 15);
    }

    out.innerHTML = wbrEq(`${fac(1, c1, 1, c2)} = ${quad(1, mid, q)}`);
    fb.innerHTML = wrapFeedback(hit
      ? `差是 \\(${n} - ${m} = ${n - m}\\)；\\(x\\) 項係數是${p > 0 ? '正' : '負'}的，絕對值大的 \\(${n}\\) 就取${p > 0 ? '正' : '負'}：${wbrEq(`${poly} = ${fac(1, c1, 1, c2)}`)}。`
      : (flip
        ? `\\(${c1} + ${par(c2)} = ${mid}\\)，跟 \\(${p}\\) 只差一個正負號：兩個數的正負對調就對了。`
        : `\\(${c1} + ${par(c2)} = ${mid}\\)，不是 \\(${p}\\)。一正一負時先看<b>差</b>：要找差是 \\(${Math.abs(p)}\\) 的那一對。`));
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(kG, 'data-sm-prob', v => { key = v; sk.value = 0; draw(); });
  bindPickGroup(gG, 'data-sm-sign', v => { sign = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：試遍所有因數對都不合，就不能用十字交乘法分解（缺 x 項當 0）
   ========================================================================== */
function initCannotCanvas() {
  const cv = elById('canvas-cannot');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('cn-p'), sq = elById('cn-q');
  const vp = elById('cn-vp'), vq = elById('cn-vq');
  const out = elById('cn-formula');
  const fb = elById('cn-feedback');
  const C = MD_TONE[3];
  let lastQ = iv(sq) || 1;

  sq.addEventListener('input', () => {
    let v = iv(sq);
    if (v === 0) { v = lastQ > 0 ? -1 : 1; sq.value = v; }
    lastQ = v;
  });

  function draw() {
    const p = iv(sp), q = iv(sq);
    vp.textContent = p; vq.textContent = q;
    const poly = quad(1, p, q);
    const every = allPairs(q);
    const hitPair = every.find(([a, b]) => a + b === p);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '把所有因數對都列出來，有沒有一組合？', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 58, C, 0.06);
    exLine(ctx, [mdInk(p === 0 ? `x^2 + 0x ${q < 0 ? '-' : '+'} ${Math.abs(q)}` : poly, MD_CREAM)], 62, 20);
    exLine(ctx, [T(`找兩數：相乘 = ${mn(q)}、相加 = ${mn(p)}`, MUTED)], 88, 15);

    textCenter(ctx, `${mn(q)} 的所有整數因數對 → 兩數的和`, cv.width / 2, 122, MUTED, f(700, 14));
    const cells = chipGrid(every.length, 3, 30, cv.width - 30, 138, 36, 10);
    every.forEach(([a, b], i) => {
      const c = cells[i];
      pairChip(ctx, c.x, c.y, c.w, c.h, `${mn(a)}, ${mn(b)} → ${mn(a + b)}`, (a + b === p) ? 'hit' : 'miss', C);
    });

    const y0 = 232;
    if (hitPair) {
      const [a, b] = hitPair;
      drawCross(ctx, cv.width / 2, y0 + 70, 1, a, 1, b, { target: p });
      drawPanel(ctx, 18, y0 + 162, cv.width - 36, p === 0 ? 74 : 46, MD_JADE, 0.08);
      exLine(ctx, [T('可以分解：', MD_JADE), mdInk(`${poly} = ${fac(1, a, 1, b)}`, INK)], y0 + 185, 18);
      if (p === 0) exLine(ctx, [T('缺 x 項就找「和為 0」的兩數，結果和平方差公式一樣', MUTED)], y0 + 216, 15);
    } else {
      drawPanel(ctx, 18, y0, cv.width - 36, 200, MD_ROSE, 0.08);
      exLine(ctx, [T(`每一組的和都不是 ${mn(p)}`, MD_ROSE)], y0 + 36, 19);
      exLine(ctx, [mdInk(poly, INK), T('不能用十字交乘法分解', MD_ROSE)], y0 + 80, 18);
      exLine(ctx, [T('（寫不成兩個整係數一次式的乘積）', MUTED)], y0 + 116, 15);
      exLine(ctx, [T(p === 0 && q > 0
        ? '缺 x 項、常數項是正的：兩數同號，相加不可能是 0'
        : '只要列完所有因數對都不合，就可以下結論', MUTED)], y0 + 160, 15);
    }

    out.innerHTML = hitPair
      ? wbrEq(`${poly} = ${fac(1, hitPair[0], 1, hitPair[1])}`)
      : `\\(${poly}\\)：不能用十字交乘法分解`;
    fb.innerHTML = wrapFeedback(hitPair
      ? (p === 0
        ? `缺 \\(x\\) 項當成 \\(0x\\)：找相乘 \\(${q}\\)、相加 \\(0\\) 的兩數，是 \\(${hitPair[0]}\\) 和 \\(${hitPair[1]}\\)。`
        : `列出 \\(${q}\\) 的 ${every.length} 組因數對，其中 \\(${hitPair[0]}\\)、\\(${hitPair[1]}\\) 的和是 \\(${p}\\)。`)
      : `\\(${q}\\) 的 ${every.length} 組因數對，和都不是 \\(${p}\\)：\\(${poly}\\) 不能用十字交乘法分解。`);
    typeset([out, fb]);
  }

  [sp, sq].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：x² 係數不為 1、常數項為正——左欄拆 x² 係數，右欄上下對調要分開試
   ========================================================================== */
const LD_SETS = {
  l1: [2, 11, 15],    // (x + 3)(2x + 5)
  l2: [3, -14, 8],    // (x − 4)(3x − 2)
  l3: [4, 13, 3],     // (x + 3)(4x + 1)
  l4: [6, -17, 5]     // (2x − 5)(3x − 1)
};

function initLeadCanvas() {
  const cv = elById('canvas-lead');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ld-a'), sc = elById('ld-c');
  const va = elById('ld-va'), vc = elById('ld-vc');
  const kG = elById('ld-prob-group'), gG = elById('ld-sign-group');
  const out = elById('ld-formula');
  const fb = elById('ld-feedback');
  const C = MD_TONE[4];
  let key = 'l1', sign = 1;

  function draw() {
    const [a, b, c] = LD_SETS[key];
    const AP = leadPairs(a), CP = pairsOrdered(c);
    sa.max = AP.length - 1; sc.max = CP.length - 1;
    sa.disabled = AP.length === 1;
    const [a1, a2] = AP[clamp(iv(sa), 0, AP.length - 1)];
    const [u, v] = CP[clamp(iv(sc), 0, CP.length - 1)];
    const c1 = sign * u, c2 = sign * v;
    va.textContent = `${pyMono(a1, 1)} 和 ${pyMono(a2, 1)}`;
    vc.textContent = `上 ${mn(c1)}、下 ${mn(c2)}`;
    const mid = crossMid(a1, c1, a2, c2), hit = (mid === b);
    const swapHit = crossMid(a1, c2, a2, c1) === b;
    const signHit = crossMid(a1, -c1, a2, -c2) === b;
    const poly = quad(a, b, c);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, 'x² 係數不是 1：左欄也要拆', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 58, C, 0.06);
    exLine(ctx, [mdInk(poly, MD_CREAM)], 62, 20);
    exLine(ctx, [T(`x² 係數 ${a} 有 ${AP.length} 種拆法、常數 ${c} 有 ${CP.length} 種上下排法`, MUTED)], 88, 15);

    drawCross(ctx, cv.width / 2, 196, a1, c1, a2, c2, { ends: true, target: b, dx: 60, bwL: 78 });

    const y = 300;
    drawPanel(ctx, 18, y, cv.width - 36, 150, hit ? MD_JADE : MD_ROSE, 0.08);
    if (hit) {
      exLine(ctx, [T('合：', MD_JADE), mdInk(`${poly} = ${fac(a1, c1, a2, c2)}`, INK)], y + 34, 19);
      exLine(ctx, [T('兩端：', MUTED), mdInk(`${pyMono(a1, 1)} · ${pyMono(a2, 1)} = ${pyMono(a, 2)}`, MD_RED),
        T('、', MUTED), T(`${mn(c1)} × ${mn(par(c2))} = ${c}`, MD_YELLOW)], y + 76, 16);
      exLine(ctx, [T('中間：', MUTED), mdInk(crossSumStr(a1, c1, a2, c2), MD_BLUE)], y + 114, 16);
    } else {
      exLine(ctx, [T('中間是', MD_ROSE), mdInk(pyMono(mid, 1), MD_ROSE), T('，要的是', INK), mdInk(pyMono(b, 1), INK)], y + 34, 19);
      let hint = '換一種拆法再試';
      if (signHit) hint = `中間是${b > 0 ? '正' : '負'}的：常數兩個都要取${b > 0 ? '正' : '負'}`;
      else if (swapHit) hint = '同一對數字，右欄上下對調試試看';
      exLine(ctx, [T(hint, MD_CREAM)], y + 76, 17);
      exLine(ctx, [T('右欄上下對調，交叉相乘的對象就換了，中間會不一樣', MUTED)], y + 114, 15);
    }

    out.innerHTML = wbrEq(`${fac(a1, c1, a2, c2)} = ${quad(a, mid, c)}`);
    const crossTex = `${pyMono(a2, 1)} \\cdot ${par(c1)} + ${pyMono(a1, 1)} \\cdot ${par(c2)} = ${pyMono(mid, 1)}`;
    fb.innerHTML = wrapFeedback(hit
      ? `${wbrEq(crossTex)}，合：${wbrEq(`${poly} = ${fac(a1, c1, a2, c2)}`)}。`
      : `交叉相乘：${wbrEq(crossTex)}，不是 \\(${pyMono(b, 1)}\\)。`);
    typeset([out, fb]);
  }

  [sa, sc].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(kG, 'data-ld-prob', v => { key = v; sa.value = 0; sc.value = 0; draw(); });
  bindPickGroup(gG, 'data-ld-sign', v => { sign = parseInt(v, 10); draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：x² 係數不為 1、常數項為負——差一個號，就把兩個常數的正負對調
   ========================================================================== */
const SW_SETS = {
  w1: [2, 5, -12],    // (x + 4)(2x − 3)
  w2: [3, -10, -8],   // (x − 4)(3x + 2)
  w3: [5, 7, -6],     // (x + 2)(5x − 3)
  w4: [4, -4, -15]    // (2x + 3)(2x − 5)
};

// c 的有號因數 c1（c2 = c / c1），依 1, −1, 2, −2… 排
function signedDivs(c) {
  const out = [];
  pairsOrdered(Math.abs(c)).forEach(([d]) => { out.push(d); out.push(-d); });
  return out;
}

function initSwapCanvas() {
  const cv = elById('canvas-swap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sw-a'), sc = elById('sw-c');
  const va = elById('sw-va'), vc = elById('sw-vc');
  const flipBtn = elById('sw-flip');
  const kG = elById('sw-prob-group');
  const out = elById('sw-formula');
  const fb = elById('sw-feedback');
  const C = MD_TONE[5];
  let key = 'w1';

  function draw() {
    const [a, b, c] = SW_SETS[key];
    const AP = leadPairs(a), DV = signedDivs(c);
    sa.max = AP.length - 1; sc.max = DV.length - 1;
    sa.disabled = AP.length === 1;
    const [a1, a2] = AP[clamp(iv(sa), 0, AP.length - 1)];
    const c1 = DV[clamp(iv(sc), 0, DV.length - 1)], c2 = c / c1;
    va.textContent = `${pyMono(a1, 1)} 和 ${pyMono(a2, 1)}`;
    vc.textContent = `上 ${mn(c1)}、下 ${mn(c2)}`;
    const mid = crossMid(a1, c1, a2, c2), hit = (mid === b), near = (mid === -b);
    const poly = quad(a, b, c);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '常數項是負的：一正一負，差一個號就對調', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 58, C, 0.06);
    exLine(ctx, [mdInk(poly, MD_CREAM)], 62, 20);
    exLine(ctx, [T(`要湊的中間項：`, MUTED), mdInk(pyMono(b, 1), MD_BLUE)], 88, 15);

    drawCross(ctx, cv.width / 2, 196, a1, c1, a2, c2, { ends: true, target: b, dx: 60, bwL: 78 });

    const y = 300;
    const col = hit ? MD_JADE : (near ? MD_YELLOW : MD_ROSE);
    drawPanel(ctx, 18, y, cv.width - 36, 150, col, 0.08);
    if (hit) {
      exLine(ctx, [T('合：', MD_JADE), mdInk(`${poly} = ${fac(a1, c1, a2, c2)}`, INK)], y + 34, 19);
      exLine(ctx, [T('驗算常數項：', MUTED), T(`${mn(c1)} × ${mn(par(c2))} = ${mn(c)}`, MD_YELLOW)], y + 78, 16);
      exLine(ctx, [T('一正一負乘起來才會是負的常數項', MUTED)], y + 116, 15);
    } else if (near) {
      exLine(ctx, [T('只差一個正負號：得到', MD_YELLOW), mdInk(pyMono(mid, 1), MD_YELLOW), T('，要的是', INK), mdInk(pyMono(b, 1), INK)], y + 34, 18);
      exLine(ctx, [T('兩個常數的正負號對調，交叉相乘的兩項都變號', INK)], y + 78, 16);
      exLine(ctx, [T('按「對調常數的正負號」，不必重試別的組合', MUTED)], y + 116, 15);
    } else {
      exLine(ctx, [T('中間是', MD_ROSE), mdInk(pyMono(mid, 1), MD_ROSE), T('，要的是', INK), mdInk(pyMono(b, 1), INK)], y + 34, 19);
      exLine(ctx, [T('連絕對值都不對：換一組數字', INK)], y + 78, 16);
      exLine(ctx, [T('只有「差一個號」時才用對調，其他情形要換組合', MUTED)], y + 116, 15);
    }

    out.innerHTML = wbrEq(`${fac(a1, c1, a2, c2)} = ${quad(a, mid, c)}`);
    fb.innerHTML = wrapFeedback(hit
      ? `合：${wbrEq(`${poly} = ${fac(a1, c1, a2, c2)}`)}。`
      : (near
        ? `交叉相乘得 \\(${pyMono(mid, 1)}\\)，剛好是 \\(${pyMono(b, 1)}\\) 的相反數：把 \\(${c1}\\)、\\(${c2}\\) 改成 \\(${-c1}\\)、\\(${-c2}\\) 就對了。`
        : `交叉相乘得 \\(${pyMono(mid, 1)}\\)，連絕對值都不是 \\(${Math.abs(b)}\\)，要換一組數字。`));
    typeset([out, fb]);
  }

  [sa, sc].forEach(s => s.addEventListener('input', draw));
  if (flipBtn) flipBtn.addEventListener('click', () => {
    const DV = signedDivs(SW_SETS[key][2]);
    const c1 = DV[clamp(iv(sc), 0, DV.length - 1)];
    sc.value = DV.indexOf(-c1);
    draw();
  });
  bindPickGroup(kG, 'data-sw-prob', v => { key = v; sa.value = 0; sc.value = 0; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：x² 係數為負——先提出 −1，再十字交乘
   ========================================================================== */
const NG_SETS = {
  n1: { raw: '-x^2 + 5x + 14', a: -1, b: 5, c: 14, f: [1, 2, 1, -7] },      // −(x + 2)(x − 7)
  n2: { raw: '-2x^2 - 7x + 15', a: -2, b: -7, c: 15, f: [2, -3, 1, 5] },    // −(2x − 3)(x + 5)
  n3: { raw: '12 + x - x^2', a: -1, b: 1, c: 12, f: [1, 3, 1, -4] },       // −(x + 3)(x − 4)
  n4: { raw: '-3x^2 + 10x - 8', a: -3, b: 10, c: -8, f: [3, -4, 1, -2] }    // −(3x − 4)(x − 2)
};

function initNegCanvas() {
  const cv = elById('canvas-neg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kG = elById('ng-prob-group'), pG = elById('ng-put-group');
  const out = elById('ng-formula');
  const fb = elById('ng-feedback');
  const C = MD_TONE[6];
  const st = { step: 1 };
  let key = 'n1', put = 'front';

  function draw() {
    const S = NG_SETS[key];
    const [a1, c1, a2, c2] = S.f;
    const N = 4;
    st.step = clamp(st.step, 1, N);
    syncSteps('ng', st.step, N);
    const desc = quad(S.a, S.b, S.c);
    const inner = quad(-S.a, -S.b, -S.c);
    const fr = fac(a1, c1, a2, c2);
    const finals = {
      front: '-' + fr,
      first: `(${linStr(-a1, -c1)})(${linStr(a2, c2)})`,
      second: `(${linStr(a1, c1)})(${linStr(-a2, -c2)})`
    };

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, 'x² 係數是負的：先把負號提出來', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 42, C, 0.06);
    exLine(ctx, [T('原式：', MUTED), mdInk(S.raw, MD_CREAM)], 65, 20);

    const rows = [
      ['① 降冪排列', S.raw === desc ? '已經是降冪' : 'x² 項排最前面', desc],
      ['② 提出 −1', '括號內每一項都變號', `-(${inner})`],
      ['③ 括號內十字交乘', '首項係數變成正的了', `${inner} = ${fr}`],
      ['④ 寫出答案', put === 'front' ? '負號放最前面' : (put === 'first' ? '負號併進第一個因式' : '負號併進第二個因式'), finals[put]]
    ];
    rows.forEach((r, i) => {
      const y = 116 + i * 46;
      const on = (i < st.step);
      const now = (i === st.step - 1);
      if (now) drawPanel(ctx, 14, y - 21, cv.width - 28, 42, C, 0.08);
      textLeft(ctx, r[0], 24, y - 8, on ? C : DIM, f(800, 14));
      textLeft(ctx, r[1], 24, y + 11, on ? MUTED : DIM, f(600, 12));
      if (on) drawExpr(ctx, [mdInk(r[2], i === 3 ? MD_JADE : INK)], 0, y, 19, INK, { left: 190, maxW: cv.width - 204 });
    });

    if (st.step >= 3) {
      drawCross(ctx, cv.width / 2, 362, a1, c1, a2, c2, { target: -S.b, size: 20, bh: 40, dy: 30, sumSize: 17 });
    } else {
      textCenter(ctx, st.step === 1 ? '按「下一步」把 −1 提出來' : 'x² 係數是正的了，下一步就能十字交乘', cv.width / 2, 380, MUTED, f(700, 15));
    }

    out.innerHTML = wbrEq(`${S.raw} = ${st.step >= 4 ? finals[put] : (st.step >= 2 ? `-(${inner})` : desc)}`);
    fb.innerHTML = wrapFeedback(st.step < 2
      ? `先把式子排成降冪，看清楚 \\(x^2\\) 項的係數是 \\(${S.a}\\)。`
      : (st.step < 4
        ? `提出 \\(-1\\) 之後，括號內是 \\(${inner}\\)，\\(x^2\\) 項係數變成正的，照平常的十字交乘做。`
        : `${wbrEq(`${S.raw} = ${finals.front}`)}；負號也可以併進任一個因式，三種寫法都對，但<b>不可以把負號弄丟</b>。`));
    typeset([out, fb]);
  }

  bindPickGroup(kG, 'data-ng-prob', v => { key = v; st.step = 1; draw(); });
  bindPickGroup(pG, 'data-ng-put', v => { put = v; draw(); });
  bindSteps('ng', () => 4, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：先提出係數的公因數，再十字交乘或用乘法公式
   ========================================================================== */
const PF_K = [-4, -3, -2, 2, 3, 4, 5];
const PF_SETS = {
  i1: [1, 2, 1, 5],     // x² + 7x + 10
  i2: [1, -3, 1, 4],    // x² + x − 12
  i3: [2, -1, 1, 3],    // 2x² + 5x − 3
  i4: [1, -3, 1, -3]    // x² − 6x + 9 = (x − 3)²
};

function initPullCanvas() {
  const cv = elById('canvas-pull');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('pf-k'), vk = elById('pf-vk');
  const iG = elById('pf-in-group'), mG = elById('pf-mode-group');
  const out = elById('pf-formula');
  const fb = elById('pf-feedback');
  const C = MD_TONE[7];
  let key = 'i1', mode = 'first';

  function draw() {
    const k = PF_K[clamp(iv(sk), 0, PF_K.length - 1)];
    vk.textContent = k;
    const [a1, c1, a2, c2] = PF_SETS[key];
    const A = a1 * a2, B = crossMid(a1, c1, a2, c2), Cc = c1 * c2;
    const inner = quad(A, B, Cc);
    const poly = quad(k * A, k * B, k * Cc);
    const fr = fac(a1, c1, a2, c2);
    const ans = `${k}${fr}`;
    const square = (a1 === a2 && c1 === c2);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'first' ? '先提公因數：括號裡的數字變小' : '不先提：數字大，最後還是要提', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 42, C, 0.06);
    exLine(ctx, [T('原式：', MUTED), mdInk(poly, MD_CREAM)], 65, 20);

    let rows, cr;
    if (mode === 'first') {
      rows = [
        ['① 找公因數', k < 0 ? '首項是負的，連 − 一起提' : '三個係數的公因數', `${mn(k * A)}、${mn(k * B)}、${mn(k * Cc)} → 提出 ${mn(k)}`],
        ['② 提出來', '每一項都除以 ' + mn(k), `${k}(${inner})`],
        ['③ 括號內分解', square ? '完全平方式，也可用乘法公式' : '十字交乘', `${inner} = ${fr}`],
        ['④ 寫出答案', `提出的 ${mn(k)} 不能漏`, ans]
      ];
      cr = [a1, c1, a2, c2];
    } else {
      rows = [
        ['① 直接拆', `x² 係數 ${mn(k * A)}、常數 ${mn(k * Cc)}`, `組合比較多`],
        ['② 十字交乘', '其中一組會合', `${poly} = (${linStr(k * a1, k * c1)})(${linStr(a2, c2)})`],
        ['③ 還沒分解完', `第一個括號還有公因數 ${mn(k)}`, `${linStr(k * a1, k * c1)} = ${k}(${linStr(a1, c1)})`],
        ['④ 寫出答案', '跟先提的結果一樣', ans]
      ];
      cr = [k * a1, k * c1, a2, c2];
    }
    rows.forEach((r, i) => {
      const y = 116 + i * 46;
      textLeft(ctx, r[0], 24, y - 8, C, f(800, 14));
      textLeft(ctx, r[1], 24, y + 11, MUTED, f(600, 12));
      drawExpr(ctx, [r[0] === '① 找公因數' || r[0] === '① 直接拆' ? T(mn(r[2]), INK) : mdInk(r[2], i === 3 ? MD_JADE : INK)], 0, y, 18, INK,
        { left: 176, maxW: cv.width - 190 });
    });

    drawCross(ctx, cv.width / 2, 362, cr[0], cr[1], cr[2], cr[3],
      { target: mode === 'first' ? B : k * B, size: 20, bh: 40, dy: 30, sumSize: 17, bwL: 80, bwR: 70, dx: 62 });

    out.innerHTML = wbrEq(`${poly} = ${k}(${inner}) = ${ans}`);
    fb.innerHTML = wrapFeedback(mode === 'first'
      ? `先提出 \\(${k}\\)，括號內只剩 \\(${inner}\\)，${square ? '是完全平方式' : '數字小、好拆'}；最後別忘了把 \\(${k}\\) 寫在前面。`
      : `不先提也拆得出 \\((${linStr(k * a1, k * c1)})(${linStr(a2, c2)})\\)，但第一個括號還能提出 \\(${k}\\)，要寫成 \\(${ans}\\) 才算分解完。`);
    typeset([out, fb]);
  }

  sk.addEventListener('input', draw);
  bindPickGroup(iG, 'data-pf-in', v => { key = v; draw(); });
  bindPickGroup(mG, 'data-pf-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：兩個多項式的公因式——各自分解，再找相同的一次式
   ========================================================================== */
const SH_SETS = {
  h1: { M: [1, 4, 1, -3], N: [1, -3, 1, -6] },   // (x + 4)(x − 3)、(x − 3)(x − 6)
  h2: { M: [2, 1, 1, 2], N: [2, 1, 1, -4] },     // (2x + 1)(x + 2)、(2x + 1)(x − 4)
  h3: { M: [3, 1, 1, -2], N: [3, 1, 2, -1] },    // (3x + 1)(x − 2)、(3x + 1)(2x − 1)
  h4: { M: [1, -2, 1, -2], N: [1, 3, 1, -2] }    // (x − 2)²、(x + 3)(x − 2)
};

function initSharedCanvas() {
  const cv = elById('canvas-shared');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kG = elById('sh-prob-group');
  const out = elById('sh-formula');
  const fb = elById('sh-feedback');
  const C = MD_TONE[8];
  const st = { step: 1 };
  let key = 'h1';

  function polyOf(F) {
    const [a1, c1, a2, c2] = F;
    return quad(a1 * a2, crossMid(a1, c1, a2, c2), c1 * c2);
  }

  function draw() {
    const S = SH_SETS[key];
    st.step = clamp(st.step, 1, 3);
    syncSteps('sh', st.step, 3);
    const M = polyOf(S.M), N = polyOf(S.N);
    const fM = [linStr(S.M[0], S.M[1]), linStr(S.M[2], S.M[3])];
    const fN = [linStr(S.N[0], S.N[1]), linStr(S.N[2], S.N[3])];
    // 配對：M 的每個因式去 N 找一個一樣、還沒用過的
    const usedN = [false, false];
    const pairs = [];
    fM.forEach((s, i) => {
      const j = fN.findIndex((t, k) => !usedN[k] && t === s);
      if (j >= 0) { usedN[j] = true; pairs.push([i, j]); }
    });
    const common = pairs.map(([i]) => fM[i]);
    const g = common.length === 2 ? `(${common[0]})(${common[1]})` : common[0];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '兩個式子各自分解，再找一樣的因式', C);
    drawExpr(ctx, [T('M =', INK), mdInk(M, MD_CREAM)], 140, 60, 18, INK, { maxW: 250 });
    drawExpr(ctx, [T('N =', INK), mdInk(N, MD_CREAM)], 400, 60, 18, INK, { maxW: 250 });
    mdLine(ctx, 270, 44, 270, 300, 'rgba(226,232,240,0.25)', 2);

    const crossOpts = { dx: 44, bwL: 62, bwR: 54, size: 19, bh: 40, dy: 30, sumSize: 15, sumW: 236 };
    drawCross(ctx, 140, 160, S.M[0], S.M[1], S.M[2], S.M[3], Object.assign({ target: crossMid(...S.M) }, crossOpts));
    if (st.step >= 2) drawCross(ctx, 400, 160, S.N[0], S.N[1], S.N[2], S.N[3], Object.assign({ target: crossMid(...S.N) }, crossOpts));
    else textCenter(ctx, '下一步：分解 N', 400, 160, DIM, f(700, 15));

    // 因式積木
    const chipY = 262, cw = 100, ch = 40;
    const xsM = [140 - cw - 6, 146], xsN = [400 - cw - 6, 406];
    const hitM = [0, 1].map(i => st.step >= 3 && pairs.some(p => p[0] === i));
    const hitN = [0, 1].map(j => st.step >= 3 && pairs.some(p => p[1] === j));
    if (st.step >= 3) {
      pairs.forEach(([i, j]) => {
        const xa = xsM[i] + cw / 2, xb = xsN[j] + cw / 2;
        ctx.save();
        ctx.strokeStyle = MD_JADE;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(xa, chipY + ch);
        ctx.quadraticCurveTo((xa + xb) / 2, chipY + ch + 50 + i * 14, xb, chipY + ch);
        ctx.stroke();
        ctx.restore();
      });
    }
    [[fM, xsM, hitM, true], [fN, xsN, hitN, st.step >= 2]].forEach(([fs, xs, hit, show]) => {
      if (!show) return;
      fs.forEach((s, i) => {
        mdBlock(ctx, xs[i], chipY, cw, ch, MD_BLUE, { alpha: hit[i] ? 0.36 : 0.14, frame: hit[i] ? MD_JADE : MD_FRAME, lw: hit[i] ? 4 : 2.5, frameAlpha: hit[i] ? 1 : 0.6 });
        drawExpr(ctx, [mdInk(s, hit[i] ? MD_JADE : MD_BLUE)], xs[i] + cw / 2, chipY + ch / 2, 18, MD_BLUE, { maxW: cw - 8 });
      });
    });

    const y = 372;
    drawPanel(ctx, 18, y, cv.width - 36, 78, st.step >= 3 ? MD_JADE : C, 0.07);
    if (st.step === 1) {
      exLine(ctx, [T('M =', INK), mdInk(`${fac(...S.M)}`, INK)], y + 26, 18);
      exLine(ctx, [T('先把 M 分解成兩個一次式', MUTED)], y + 56, 15);
    } else if (st.step === 2) {
      exLine(ctx, [T('N =', INK), mdInk(`${fac(...S.N)}`, INK)], y + 26, 18);
      exLine(ctx, [T('再把 N 也分解，下一步比對', MUTED)], y + 56, 15);
    } else {
      exLine(ctx, [T('兩邊都有：', MD_JADE), mdInk(g, MD_JADE), T('是 M 和 N 的公因式', INK)], y + 26, 18);
      exLine(ctx, [T('只出現在一邊的因式不是公因式', MUTED)], y + 56, 15);
    }

    out.innerHTML = `\\(M = ${fac(...S.M)}\\)` + (st.step >= 2 ? `，<wbr>\\(N = ${fac(...S.N)}\\)` : '');
    fb.innerHTML = wrapFeedback(st.step < 3
      ? `找公因式之前，兩個式子都要先分解成乘積，才看得出共同有哪些因式。`
      : `\\(${g}\\) 同時出現在 \\(M\\) 和 \\(N\\) 的分解式裡，它是 \\(M\\) 和 \\(N\\) 的公因式。`);
    typeset([out, fb]);
  }

  bindPickGroup(kG, 'data-sh-prob', v => { key = v; st.step = 1; draw(); });
  bindSteps('sh', () => 3, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：已知分解的形式，反求係數——兩端定未知數，中間算係數
   ========================================================================== */
// known：已知的因式 [p, q] 即 px + q；pb：含 m 的因式 pb·x + m；unkFirst：題目把含 m 的寫在前面
const RV_SETS = {
  r1: { A: 1, C: -18, known: [1, 3], pb: 1, unkFirst: false },   // (x + 3)(x − 6)，k = −3
  r2: { A: 2, C: 12, known: [1, 4], pb: 2, unkFirst: false },    // (x + 4)(2x + 3)，k = 11
  r3: { A: 3, C: -10, known: [3, -2], pb: 1, unkFirst: false },  // (3x − 2)(x + 5)，k = 13
  r4: { A: 6, C: -4, known: [2, 1], pb: 3, unkFirst: true }      // (3x − 4)(2x + 1)，k = −5
};

function initReverseCanvas() {
  const cv = elById('canvas-rev');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = elById('rv-m'), vm = elById('rv-vm');
  const kG = elById('rv-prob-group');
  const out = elById('rv-formula');
  const fb = elById('rv-feedback');
  const C = MD_TONE[9];
  let key = 'r1';

  function draw() {
    const S = RV_SETS[key];
    const g = iv(sm);
    vm.textContent = g;
    const [p, q] = S.known;
    const mTrue = S.C / q;
    const kTrue = p * mTrue + S.pb * q;
    const kG2 = p * g + S.pb * q;
    const constOk = (q * g === S.C);
    const kS = S.A === 1 ? 'x^2' : `${S.A}x^2`;
    const lhs = `${kS} + kx ${S.C < 0 ? '-' : '+'} ${Math.abs(S.C)}`;
    const unk = `${S.pb === 1 ? '' : S.pb}x + m`;
    const rhs = S.unkFirst ? `(${unk})(${linStr(p, q)})` : `(${linStr(p, q)})(${unk})`;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '看兩端定出 m，再湊中間算出 k', C);
    drawPanel(ctx, 18, 44, cv.width - 36, 48, C, 0.06);
    exLine(ctx, [mdInk(`${lhs} = ${rhs}`, MD_CREAM)], 68, 20);

    // 係數對照表
    const cols = [176, 300, 430], tx0 = 30, tx1 = 510, top = 112;
    const rowsY = [top + 22, top + 68, top + 114];
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(tx0, top, tx1 - tx0, 138);
    [top + 44, top + 92].forEach(y => mdLine(ctx, tx0, y, tx1, y, 'rgba(226, 232, 240, 0.4)', 2));
    [120, 236, 364].forEach(x => mdLine(ctx, x, top, x, top + 138, 'rgba(226, 232, 240, 0.4)', 2));
    ctx.restore();
    textCenter(ctx, '係數', 75, rowsY[0], MUTED, f(800, 14));
    textCenter(ctx, '左邊', 75, rowsY[1], MD_CREAM, f(800, 14));
    textCenter(ctx, `m = ${mn(g)}`, 75, rowsY[2], C, f(800, 14));
    drawExpr(ctx, [mdInk('x^2', MUTED), T('項', MUTED)], cols[0], rowsY[0], 15, MUTED, { gap: 3 });
    drawExpr(ctx, [IT('x', MUTED), T('項', MUTED)], cols[1], rowsY[0], 15, MUTED, { gap: 3 });
    textCenter(ctx, '常數項', cols[2], rowsY[0], MUTED, f(800, 15));
    textCenter(ctx, String(S.A), cols[0], rowsY[1], MD_CREAM, f(800, 19));
    drawExpr(ctx, [IT('k', MD_CREAM)], cols[1], rowsY[1], 19, MD_CREAM);
    textCenter(ctx, mn(S.C), cols[2], rowsY[1], MD_CREAM, f(800, 19));
    textCenter(ctx, `${p * S.pb} ✓`, cols[0], rowsY[2], MD_JADE, f(800, 19));
    textCenter(ctx, `${mn(q * g)} ${constOk ? '✓' : '✗'}`, cols[2], rowsY[2], constOk ? MD_JADE : MD_ROSE, f(800, 19));
    textCenter(ctx, constOk ? `k = ${mn(kG2)}` : mn(kG2), cols[1], rowsY[2], constOk ? MD_JADE : DIM, f(800, 19));

    const y = 270;
    drawPanel(ctx, 18, y, cv.width - 36, 180, constOk ? MD_JADE : MD_ROSE, 0.08);
    exLine(ctx, [T('① 看兩端：常數項', INK), mdInk(`${par(q)} · m = ${S.C}`, MD_YELLOW), T(constOk ? `→ m = ${mn(mTrue)}` : '', MD_JADE)], y + 32, 18);
    if (constOk) {
      exLine(ctx, [T('② 湊中間：', INK), mdInk(`k = ${p}·${par(g)} + ${S.pb}·${par(q)} = ${kTrue}`, MD_BLUE)], y + 76, 18);
      exLine(ctx, [mdInk(`${quad(S.A, kTrue, S.C)} = ${S.unkFirst ? fac(S.pb, mTrue, p, q) : fac(p, q, S.pb, mTrue)}`, MD_JADE)], y + 120, 19);
      exLine(ctx, [T('也可以把右邊整個乘開，三項係數一一比較', MUTED)], y + 156, 14);
    } else {
      exLine(ctx, [T(`m = ${mn(g)} 時常數項是 ${mn(q * g)}，不是 ${mn(S.C)}`, MD_ROSE)], y + 76, 17);
      exLine(ctx, [T('常數項對上了，中間的 k 才算得出來', MUTED)], y + 116, 15);
      exLine(ctx, [T('拉動滑桿改 m', MUTED)], y + 148, 14);
    }

    const rhsG = S.unkFirst ? fac(S.pb, g, p, q) : fac(p, q, S.pb, g);
    out.innerHTML = wbrEq(`${rhsG} = ${quad(p * S.pb, kG2, q * g)}`);
    fb.innerHTML = wrapFeedback(constOk
      ? `常數項 \\(${par(q)} \\cdot m = ${S.C}\\)，得 \\(m = ${mTrue}\\)；中間 \\(k = ${kTrue}\\)。`
      : `\\(m = ${g}\\) 時，右邊乘開的常數項是 \\(${q * g}\\)，不是 \\(${S.C}\\)：先讓兩端對上。`);
    typeset([out, fb]);
  }

  sm.addEventListener('input', draw);
  bindPickGroup(kG, 'data-rv-prob', v => { key = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：紙片拼長方形——要幾條藍色長條才拼得起來
   ========================================================================== */
// 紅 A 張、黃 C 張時，所有拼得出的長方形 (a1x + c1)(a2x + c2)，依藍色張數分組
function tileOptions(A, C) {
  const map = new Map();
  pairsOrdered(A).forEach(([a1, a2]) => {
    pairsOrdered(C).forEach(([c1, c2]) => {
      const b = crossMid(a1, c1, a2, c2);
      if (!map.has(b)) map.set(b, [a1, c1, a2, c2]);
    });
  });
  return map;
}

function initTilesCanvas() {
  const cv = elById('canvas-tiles');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('tl-a'), sb = elById('tl-b'), sc = elById('tl-c');
  const va = elById('tl-va'), vb = elById('tl-vb'), vc = elById('tl-vc');
  const out = elById('tl-formula');
  const fb = elById('tl-feedback');
  const C = MD_TONE[10];

  function draw() {
    const A = iv(sa), B = iv(sb), Cc = iv(sc);
    va.textContent = A; vb.textContent = B; vc.textContent = Cc;
    const opts = tileOptions(A, Cc);
    const okBs = Array.from(opts.keys()).sort((u, v) => u - v);
    const hit = opts.get(B);
    const poly = quad(A, B, Cc);
    const X = 64, U = 18;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '紅 x²、藍 x、黃 1：拼得成長方形嗎？', C);
    drawExpr(ctx, [T(`紅 ${A} 張`, MD_RED), T(`藍 ${B} 張`, MD_BLUE), T(`黃 ${Cc} 張`, MD_YELLOW), T('→ 面積', MUTED), mdInk(poly, MD_CREAM)],
      cv.width / 2, 62, 17, INK, { maxW: cv.width - 40, gap: 10 });

    if (hit) {
      // 讓長方形橫放（寬 ≥ 高）
      let [a1, c1, a2, c2] = hit;
      if (a2 * X + c2 * U > a1 * X + c1 * U) [a1, c1, a2, c2] = [a2, c2, a1, c1];
      const w = a1 * X + c1 * U, h = a2 * X + c2 * U;
      const x0 = cv.width / 2 - w / 2 + 12, y0 = 104 + (216 - h) / 2;
      drawTiles(ctx, x0, y0, a1, c1, a2, c2, X, U);
      ctx.save();
      ctx.strokeStyle = MD_JADE;
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 - 3, y0 - 3, w + 6, h + 6);
      ctx.restore();
      drawExpr(ctx, [mdInk(linStr(a1, c1), MD_CREAM)], x0 + w / 2, y0 - 16, 17, MD_CREAM);
      vLabel(ctx, [mdInk(linStr(a2, c2), MD_CREAM)], x0 - 20, y0 + h / 2, 17, MD_CREAM);
    } else {
      // 拼不成：把紙片攤在桌上
      let x = 40;
      for (let i = 0; i < A; i++) { mdBlock(ctx, x, 104, X, X, MD_RED, { alpha: 0.32, lw: 2.6 }); x += X + 8; }
      x += 14;
      for (let i = 0; i < Cc; i++) { mdBlock(ctx, x, 104 + X - U, U, U, MD_YELLOW, { alpha: 0.32, lw: 1.6 }); x += U + 6; }
      const bw = Math.min(U, (cv.width - 80 - 6 * Math.max(B - 1, 0)) / Math.max(B, 1));
      for (let i = 0; i < B; i++) mdBlock(ctx, 40 + i * (bw + 6), 196, bw, X, MD_BLUE, { alpha: 0.32, lw: 2 });
      if (B === 0) textLeft(ctx, '（沒有藍色長條）', 40, 228, DIM, f(700, 14));
    }

    const y = 332;
    drawPanel(ctx, 18, y, cv.width - 36, 120, hit ? MD_JADE : MD_ROSE, 0.08);
    const list = okBs.join('、');
    if (hit) {
      exLine(ctx, [T('拼成了：', MD_JADE), mdInk(`${poly} = ${fac(...hit)}`, INK)], y + 30, 19);
      exLine(ctx, [T('長和寬就是兩個因式', MUTED)], y + 66, 15);
      exLine(ctx, [T(`紅 ${A}、黃 ${Cc} 時，藍色可以是：${list} 張`, MUTED)], y + 98, 15);
    } else {
      const more = okBs.find(v => v > B), less = okBs.slice().reverse().find(v => v < B);
      exLine(ctx, [T('拼不成：', MD_ROSE), mdInk(poly, INK), T('不能分解', MD_ROSE)], y + 30, 19);
      exLine(ctx, [T(`紅 ${A}、黃 ${Cc} 時，藍色要是：${list} 張`, INK)], y + 66, 16);
      exLine(ctx, [T(more != null ? `再拿 ${more - B} 張就拼得成` + (less != null ? `（或退回 ${B - less} 張）` : '') : `要退回 ${B - less} 張`, MD_CREAM)], y + 98, 16);
    }

    out.innerHTML = hit ? wbrEq(`${poly} = ${fac(...hit)}`) : `\\(${poly}\\)：拼不成長方形`;
    fb.innerHTML = wrapFeedback(hit
      ? `能拼成長方形，就是能分解：${wbrEq(`${poly} = ${fac(...hit)}`)}。`
      : `把 \\(${A}\\) 和 \\(${Cc}\\) 的因數排進十字交乘，所有可能的中間項是 ${okBs.map(v => `\\(${v}\\)`).join('、')}；藍色 \\(${B}\\) 張不在裡面。`);
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
