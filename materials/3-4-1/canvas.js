/* ==========================================================================
   3-4-1（第三冊 4-1）因式分解解一元二次方程式 — 互動 Canvas 與隨堂評量
   畫風：木刻版畫風柑橘觀光果園（小柚、阿圃），第 4 章三節共用。
   十字交乘的直式沿用 3-3-2 的分工：左欄（x 項）柑橘橘、右欄（常數）葉綠、
   交叉相乘湊出來的中間項天空藍。玫瑰 OC_ROSE 是錯、翡翠綠 OC_JADE 是對。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／FR／measure／drawExpr／
   drawPanel／drawTitle／drawStepRows／wbrEq／numLine／textCenter／textLeft／
   bindPickGroup…），本檔只放本節的色票、多項式與分數小工具、十字交乘直式
   與 12 個互動。

   ⚠️ 多項式字串工具（ocParse／py*／linStr／par／fac…）由 3-3-2 搬來改名
   （各頁各自載入，不會撞名）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initKindCanvas();
  initRootCanvas();
  initZeroCanvas();
  initCommonCanvas();
  initGroupCanvas();
  initDivideCanvas();
  initCrossCanvas();
  initDiffCanvas();
  initDoubleCanvas();
  initExpandCanvas();
  initOneRootCanvas();
  initTwoRootCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（OC_ = Orchard；共用檔沒有這個前綴）
   ========================================================================== */

const OC_ORANGE = '#fdba74';  // 柑橘：x² 項；十字交乘左欄
const OC_LEAF = '#86efac';    // 葉綠：常數項；十字交乘右欄
const OC_SKY = '#93c5fd';     // 交叉相乘湊出的中間項
const OC_CREAM = '#fef3c7';   // 深色底板上的算式字色
const OC_ROSE = '#fb7185';    // 錯誤、不合
const OC_JADE = '#6ee7b7';    // 正確、成立
const OC_FRAME = '#e2e8f0';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const OC_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
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

// ASCII 算式字串 → LaTeX：· 與 × 換成指令
function toTex(s) {
  return String(s).replace(/·/g, ' \\cdot ').replace(/×/g, ' \\times ');
}

// 滑桿跳過 0（係數、常數不能是 0 的那幾支）；要在 draw 的監聽器之前綁
function skipZero(el) {
  let last = iv(el) || 1;
  el.addEventListener('input', () => {
    let v = iv(el);
    if (v === 0) { v = last > 0 ? -1 : 1; el.value = v; }
    last = v;
  });
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（3-3-2 的 mdParse）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」「(2x - 1)^2」「2·x·3」。
   中文字（或、，）照原樣當文字；任何小寫字母都畫成斜體變數。
   -------------------------------------------------------------------------- */
function ocParse(str, color) {
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
      out.push(GRP([SEQ(ocParse(str.slice(i + 1, j), color), color, 1)], ch === '[' ? '[]' : '()', color));
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

function ocInk(s, color) {
  return SEQ(ocParse(String(s), color), color, 1);
}

// 置中的一行（中文字與算式元件混排）
function exLine(ctx, items, y, size, color) {
  return drawExpr(ctx, items, ctx.canvas.width / 2, y, size || 17, color || INK, { maxW: ctx.canvas.width - 60, gap: 6 });
}

function ocLine(ctx, x1, y1, x2, y2, color, width, dash) {
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

// 一格木框：半透明填色、淺色框
function ocBox(ctx, x, y, w, h, color, alpha, lw) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.2 : alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 2.5;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/* --------------------------------------------------------------------------
   整數係數多項式（3-3-2 搬來）：係數陣列的索引就是次數。
   字串一律是 ASCII（x^2），同一條字串可以直接當 LaTeX，也可以給 ocInk。
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

// 當成加數或乘數寫在運算子後面時，負數要加括號
function par(v) {
  const t = String(v);
  return t.charAt(0) === '-' ? '(' + t + ')' : t;
}

// 任意字母的項：[[係數, 字母], ...]；字母為 '' 時是常數項
function vJoin(list) {
  let s = '';
  list.forEach(([c, v]) => {
    if (c === 0) return;
    const a = Math.abs(c);
    const body = v ? (a === 1 ? v : a + v) : String(a);
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

// (a1x + c1)(a2x + c2)；兩個因式一樣時寫成平方
function fac(a1, c1, a2, c2) {
  const s1 = linStr(a1, c1), s2 = linStr(a2, c2);
  if (s1 === s2) return s1 === 'x' ? 'x^2' : `(${s1})^2`;
  // 其中一個是單項式（常數為 0）時寫在前面、不加括號：x(x + 3)
  if (c1 === 0 && c2 !== 0) return `${s1}(${s2})`;
  if (c2 === 0 && c1 !== 0) return `${s2}(${s1})`;
  return `(${s1})(${s2})`;
}

// 代入用：負數平方要加括號 (−3)²，負數相乘也加括號
function sqS(v) {
  return v < 0 ? `(${v})^2` : `${v}^2`;
}

function pS(v) {
  return v < 0 ? `(${v})` : String(v);
}

/* --------------------------------------------------------------------------
   有理數根：一律以化成最簡的 [分子, 分母] 表示，分母為正
   -------------------------------------------------------------------------- */

// texFrac 不化簡（AGENTS.md〈工作約定〉），本頁的分數一律先 reduce
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

function rTex(r) {
  return fTex(r[0], r[1]);
}

// px + q = 0 的根
function linRoot(p, q) {
  return reduce(-q, p);
}

function sameR(p, q) {
  return p[0] * q[1] === q[0] * p[1];
}

// px + q 在 x = r 的值
function linVal(p, q, r) {
  return reduce(p * r[0] + q * r[1], r[1]);
}

function mulR(u, v) {
  return reduce(u[0] * v[0], u[1] * v[1]);
}

// canvas 上的分數或整數（負號提到分數前面）
function rItem(n, d, color) {
  const [a, b] = reduce(n, d);
  if (b === 1) return T(mn(a), color);
  if (a < 0) return SEQ([T('−', color), FR(-a, b, color)], color, 2);
  return FR(a, b, color);
}

function rIt(r, color) {
  return rItem(r[0], r[1], color);
}

// 乘式裡的值：負數加括號
function valItem(v, color) {
  return v[0] < 0 ? GRP([rIt(v, color)], '()', color) : rIt(v, color);
}

function xIs(r, color) {
  return SEQ([IT('x', color), T('=', color), rIt(r, color)], color, 6);
}

// 「x = a 或 x = b」；兩根相同時寫重根
function solItems(r1, r2, color) {
  if (sameR(r1, r2)) return [xIs(r1, color), T('（重根）', color)];
  return [xIs(r1, color), T('或', MUTED), xIs(r2, color)];
}

// 「解為 a 和 b」的 HTML
function andTex(r1, r2) {
  if (sameR(r1, r2)) return `兩個解都是 \\(${rTex(r1)}\\)（重根）`;
  return `解為 \\(${rTex(r1)}\\) 和 \\(${rTex(r2)}\\)`;
}

function andItems(r1, r2, color) {
  if (sameR(r1, r2)) return [T('兩個解都是', color), rIt(r1, color), T('（重根）', color)];
  return [T('解為', color), rIt(r1, INK), T('和', color), rIt(r2, INK)];
}

// 一列推導：字串交給 ocInk，陣列直接當元件
function row(name, hint, s) {
  return { name, hint, items: Array.isArray(s) ? s : [ocInk(s)] };
}

/* --------------------------------------------------------------------------
   十字交乘直式（3-3-2 的 drawCross，換本節配色）
       a1x │ c1
            ╳
       a2x │ c2
     a2c1x + a1c2x = (中間項)
   -------------------------------------------------------------------------- */

function crossMid(a1, c1, a2, c2) {
  return a2 * c1 + a1 * c2;
}

function cTerm(c) {
  return (c < 0 ? '− ' : '+ ') + Math.abs(c);
}

function crossSumStr(a1, c1, a2, c2) {
  const p1 = a2 * c1, p2 = a1 * c2;
  return `${pyMono(p1, 1)} ${p2 < 0 ? '-' : '+'} ${pyBody(Math.abs(p2), 1)} = ${pyMono(p1 + p2, 1)}`;
}

function drawCross(ctx, cx, cy, a1, c1, a2, c2, opts) {
  const o = opts || {};
  const size = o.size || 22;
  const dx = o.dx || 52, dy = o.dy || 34;
  const bwL = o.bwL || 72, bwR = o.bwR || 64, bh = o.bh || 46;
  const xl = cx - dx, xr = cx + dx;
  const y1 = cy - dy, y2 = cy + dy;
  const lx = xl + bwL / 2 + 4, rx = xr - bwR / 2 - 4;
  ocLine(ctx, lx, y1 + 6, rx, y2 - 6, INK, 2.4);
  ocLine(ctx, lx, y2 - 6, rx, y1 + 6, INK, 2.4);
  [[a1, y1], [a2, y2]].forEach(([a, y]) => {
    ocBox(ctx, xl - bwL / 2, y - bh / 2, bwL, bh, OC_ORANGE, 0.16);
    drawExpr(ctx, [ocInk(pyMono(a, 1), OC_ORANGE)], xl, y, size, OC_ORANGE, { maxW: bwL - 8 });
  });
  [[c1, y1], [c2, y2]].forEach(([c, y]) => {
    ocBox(ctx, xr - bwR / 2, y - bh / 2, bwR, bh, OC_LEAF, 0.16);
    drawExpr(ctx, [T(cTerm(c), OC_LEAF)], xr, y, size, OC_LEAF, { maxW: bwR - 6 });
  });
  if (o.ends) {
    const ey = y1 - bh / 2 - 15;
    drawExpr(ctx, [T('相乘', MUTED), ocInk(pyMono(a1 * a2, 2), OC_ORANGE)], xl, ey, 14, MUTED, { maxW: 2 * dx - 8, gap: 4 });
    drawExpr(ctx, [T('相乘', MUTED), T(mn(c1 * c2), OC_LEAF)], xr, ey, 14, MUTED, { maxW: 2 * dx - 8, gap: 4 });
  }
  const mid = crossMid(a1, c1, a2, c2);
  if (o.sum !== false) {
    const items = [ocInk(crossSumStr(a1, c1, a2, c2), OC_SKY)];
    if (o.target != null) items.push(T(mid === o.target ? '✓' : '✗', mid === o.target ? OC_JADE : OC_ROSE));
    drawExpr(ctx, items, cx, y2 + bh / 2 + 24, o.sumSize || 19, OC_SKY, { maxW: o.sumW || 300, gap: 8 });
  }
  return mid;
}

function crossTex(a1, c1, a2, c2) {
  return `${pyMono(a2, 1)} \\cdot ${par(c1)} + ${pyMono(a1, 1)} \\cdot ${par(c2)} = ${pyMono(crossMid(a1, c1, a2, c2), 1)}`;
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

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 4-1 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '4-1-1': 'C',    // (x − 1)(x + 4) = 0 是一元二次方程式
    '4-1-2': 'B',    // (3x − 1)² = 9x² + 4 化簡為 −6x − 3 = 0
    '4-1-3': 'D',    // x² − 3x = 28 的解：7
    '4-1-4': 'A',    // x = −3 代入 2x² + 5x = 3
    '4-1-5': 'B',    // A × B = 0 → A = 0 或 B = 0
    '4-1-6': 'C',    // (x + 7)(3x − 2) = 0 → −7 和 2/3
    '4-1-7': 'D',    // 7x² + 9x = 0 → 0 和 −9/7
    '4-1-8': 'A',    // (1/4)x² + 5x = 0 → 0 和 −20
    '4-1-9': 'C',    // 3x(4x − 5) + 2(4x − 5) = 0 → 5/4 和 −2/3
    '4-1-10': 'D',   // (x + 4)(x − 1) − 11(x − 1) = 0 → 1 和 7
    '4-1-11': 'B',   // x(x − 8) = 5(x − 8)：同除漏掉 x = 8
    '4-1-12': 'A',   // (2x + 3)(x − 4) = (2x + 3)(3x + 2) → −3/2 和 −3
    '4-1-13': 'C',   // x² − 5x − 36 = 0 → 9 和 −4
    '4-1-14': 'B',   // −2x² + 10x = −28 → 7 和 −2
    '4-1-15': 'D',   // 49x² − 36 = 0 → ±6/7
    '4-1-16': 'A',   // 9x² = 100 → ±10/3
    '4-1-17': 'D',   // 4x² − 28x + 49 = 0 → 7/2（重根）
    '4-1-18': 'B',   // x² + 14x + 49 = 0 有重根
    '4-1-19': 'C',   // (x + 2)(x − 3) = 50 → 8 和 −7
    '4-1-20': 'A',   // (x − 5)(x + 1) = 16 不能拆成兩個 = 16
    '4-1-21': 'D',   // x² + mx − 36 = 0 一根 4：m = 5、另一根 −9
    '4-1-22': 'B',   // 2x² − 7x + k = 0 一根 3：另一根 1/2
    '4-1-23': 'C',   // 兩根 −5、8：p = −3、q = −40
    '4-1-24': 'A'    // ax² + bx − 6 = 0 兩根 3、−1/2：a = 4、b = −10
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
   重點 1：一元二次方程式的意義——先化簡，再檢查三個條件
   ========================================================================== */
const KD_SETS = {
  k1: { orig: '5x^2 = 3x', eq: true, moved: '5x^2 - 3x = 0', vars: 1, deg: 2,
        note: '\\(5x^2 = 3x\\) 移項得 \\(5x^2 - 3x = 0\\)。沒有常數項也沒關係，只要 \\(x^2\\) 的係數不是 \\(0\\)。' },
  k2: { orig: '(x + 2)(x - 5) = 3', eq: true, moved: 'x^2 - 3x - 13 = 0', vars: 1, deg: 2,
        note: '先展開 \\((x + 2)(x - 5)\\)<wbr>\\({}= x^2 - 3x - 10\\)，再把 \\(3\\) 移到左邊，得 \\(x^2 - 3x - 13 = 0\\)。' },
  k3: { orig: 'x^2 + 4x = x^2 - 6', eq: true, moved: '4x + 6 = 0', vars: 1, deg: 1,
        note: '兩邊都有 \\(x^2\\)，移項後互相抵消，只剩 \\(4x + 6 = 0\\)：一定要<b>先化簡再判斷</b>。' },
  k4: { orig: 'x(x + 3) = x^2 - 2x + 7', eq: true, moved: '5x - 7 = 0', vars: 1, deg: 1,
        note: '左邊展開是 \\(x^2 + 3x\\)，跟右邊的 \\(x^2\\) 抵消，只剩 \\(5x - 7 = 0\\)。' },
  k5: { orig: '3x^2 - 2x + 1', eq: false, moved: null, vars: 1, deg: 2,
        note: '沒有等號：它是一個<b>二次式</b>（多項式），不是方程式。' },
  k6: { orig: 'x^2 + y = 10', eq: true, moved: 'x^2 + y - 10 = 0', vars: 2, deg: 2,
        note: '出現 \\(x\\)、\\(y\\) 兩種未知數，不是「一元」。' }
};

function initKindCanvas() {
  const cv = elById('canvas-kind');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const g = elById('kd-group');
  const out = elById('kd-formula');
  const fb = elById('kd-feedback');
  const C = OC_TONE[0];
  let key = 'k1';

  function draw() {
    const S = KD_SETS[key];
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '逐一檢查：是不是一元二次方程式？', C);
    drawPanel(ctx, 18, 44, W - 36, 58, C, 0.06);
    exLine(ctx, [ocInk(S.orig, OC_CREAM)], 73, 24);

    const rowsY = [138, 196, 254, 312];
    const labels = ['① 有等號嗎？', '② 移項、化簡成「⋯ = 0」', '③ 未知數有幾種？', '④ 化簡後的最高次數'];
    labels.forEach((lab, i) => {
      const y = rowsY[i];
      textLeft(ctx, lab, 30, y, C, f(800, 15));
      if (i < 3) ocLine(ctx, 26, y + 29, W - 26, y + 29, 'rgba(226,232,240,0.12)', 1);
      const x0 = 250;
      if (i === 0) {
        textLeft(ctx, S.eq ? '✓ 有等號' : '✗ 沒有等號', x0, y, S.eq ? OC_JADE : OC_ROSE, f(800, 16));
        return;
      }
      if (!S.eq) {
        textLeft(ctx, '— 不是方程式，不必再看', x0, y, DIM, f(700, 14));
        return;
      }
      if (i === 1) {
        drawExpr(ctx, [ocInk(S.moved, OC_CREAM)], 0, y, 19, OC_CREAM, { left: x0, maxW: W - x0 - 24 });
      } else if (i === 2) {
        const ok = S.vars === 1;
        textLeft(ctx, ok ? '✓ 只有 x 一種' : '✗ x、y 兩種', x0, y, ok ? OC_JADE : OC_ROSE, f(800, 16));
      } else {
        const ok = S.deg === 2;
        textLeft(ctx, (ok ? '✓ ' : '✗ ') + S.deg + ' 次', x0, y, ok ? OC_JADE : OC_ROSE, f(800, 16));
      }
    });

    let verdict, reason, yes = false;
    if (!S.eq) { verdict = '不是方程式'; reason = '沒有等號，它是一個二次式'; }
    else if (S.vars !== 1) { verdict = '不是一元二次方程式'; reason = '有 x、y 兩種未知數，不是「一元」'; }
    else if (S.deg !== 2) { verdict = '是一元一次方程式'; reason = '化簡後 x² 項消掉了，最高只剩 1 次'; }
    else { yes = true; verdict = '是 x 的一元二次方程式'; reason = '有等號、只有 x、化簡後最高 2 次'; }

    const y = 362;
    drawPanel(ctx, 18, y, W - 36, 84, yes ? OC_JADE : OC_ROSE, 0.08);
    exLine(ctx, [T(verdict, yes ? OC_JADE : OC_ROSE)], y + 28, 20);
    exLine(ctx, [T(reason, MUTED)], y + 60, 15);

    out.innerHTML = `${wbrEq(S.orig)}，${verdict}`;
    fb.innerHTML = wrapFeedback(S.note);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-kd', v => { key = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：解的意義——代入後左右兩邊相等
   ========================================================================== */
const RT_SETS = {
  e1: { eq: 'x^2 - 2x = 15', L: x => x * x - 2 * x, R: () => 15,
        Ls: x => `${sqS(x)} - 2 × ${pS(x)}`, Rs: null },
  e2: { eq: 'x^2 + x = 12', L: x => x * x + x, R: () => 12,
        Ls: x => `${sqS(x)} + ${pS(x)}`, Rs: null },
  e3: { eq: '2x^2 - 3x = x + 6', L: x => 2 * x * x - 3 * x, R: x => x + 6,
        Ls: x => `2 × ${sqS(x)} - 3 × ${pS(x)}`, Rs: x => `${x} + 6` }
};

function initRootCanvas() {
  const cv = elById('canvas-root');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sx = elById('rt-x'), vx = elById('rt-vx');
  const g = elById('rt-group');
  const out = elById('rt-formula');
  const fb = elById('rt-feedback');
  const C = OC_TONE[1];
  const found = { e1: new Set(), e2: new Set(), e3: new Set() };
  let key = 'e1';

  function pan(x, y, val, color, label) {
    ocLine(ctx, x - 40, y + 40, x, y, MUTED, 1.5);
    ocLine(ctx, x + 40, y + 40, x, y, MUTED, 1.5);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(253,186,116,0.10)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 52, y + 40);
    ctx.quadraticCurveTo(x, y + 66, x + 52, y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, String(mn(val)), x, y + 26, color, f(800, 20));
    textCenter(ctx, label, x, y + 76, MUTED, f(700, 14));
  }

  function draw() {
    const S = RT_SETS[key];
    const x = iv(sx);
    vx.textContent = x;
    const L = S.L(x), R = S.R(x), eq = (L === R);
    if (eq) found[key].add(x);
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '代入檢驗：左右兩邊一樣，才是解', C);
    drawPanel(ctx, 18, 44, W - 36, 52, C, 0.06);
    exLine(ctx, [ocInk(S.eq, OC_CREAM), T(`　代入 x = ${mn(x)}`, MUTED)], 70, 21);

    textLeft(ctx, '左邊', 30, 124, OC_ORANGE, f(800, 15));
    drawExpr(ctx, [ocInk(`${S.Ls(x)} = ${L}`)], 0, 124, 18, INK, { left: 84, maxW: W - 110 });
    textLeft(ctx, '右邊', 30, 158, OC_LEAF, f(800, 15));
    drawExpr(ctx, [ocInk(S.Rs ? `${S.Rs(x)} = ${R}` : String(R))], 0, 158, 18, INK, { left: 84, maxW: W - 110 });

    // 天平：哪一邊的值大，哪一邊就往下沉
    const cx = W / 2, cy = 214, half = 165;
    const th = clamp((L - R) / 40, -1, 1) * 0.24;
    const lx = cx - half * Math.cos(th), ly = cy + half * Math.sin(th);
    const rx = cx + half * Math.cos(th), ry = cy - half * Math.sin(th);
    ocLine(ctx, cx, cy, cx, 330, MUTED, 4);
    ocLine(ctx, cx - 50, 332, cx + 50, 332, MUTED, 5);
    ocLine(ctx, lx, ly, rx, ry, eq ? OC_JADE : INK, 5);
    drawDot(ctx, cx, cy, C, 6);
    pan(lx, ly, L, eq ? OC_JADE : OC_ORANGE, '左邊');
    pan(rx, ry, R, eq ? OC_JADE : OC_LEAF, '右邊');

    // 已找到的解
    const list = Array.from(found[key]).sort((a, b) => a - b);
    textLeft(ctx, '找到的解：', 30, 404, C, f(800, 15));
    for (let i = 0; i < 2; i++) {
      const bx = 128 + i * 74;
      ctx.save();
      roundRect(ctx, bx, 388, 62, 32, 8);
      ctx.strokeStyle = i < list.length ? OC_JADE : DIM;
      ctx.lineWidth = 2;
      if (i >= list.length) ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, i < list.length ? mn(list[i]) : '?', bx + 31, 404, i < list.length ? OC_JADE : DIM, f(800, 16));
    }
    textLeft(ctx, list.length < 2 ? '拉滑桿找找看，共有 2 個' : '兩個都找到了！', 290, 404, MUTED, f(700, 14));

    exLine(ctx, [T(eq ? `x = ${mn(x)} 是解：兩邊都是 ${mn(L)}` : `x = ${mn(x)} 不是解：${mn(L)} ≠ ${mn(R)}`, eq ? OC_JADE : OC_ROSE)], 448, 17);

    out.innerHTML = `\\(x = ${x}\\)：左邊 \\(= ${L}\\)，右邊 \\(= ${R}\\)`;
    fb.innerHTML = wrapFeedback(eq
      ? `左右兩邊都是 \\(${L}\\)，\\(x = ${x}\\) 是 \\(${S.eq}\\) 的解。${list.length === 2 ? `兩個解 \\(${list[0]}\\)、\\(${list[1]}\\) 都找到了。` : ''}`
      : `\\(${L} \\ne ${R}\\)，所以 \\(x = ${x}\\) 不是解。${x < 0 ? '代入負數時記得加括號。' : ''}`);
    typeset([out, fb]);
  }

  sx.addEventListener('input', draw);
  bindPickGroup(g, 'data-rt', v => { key = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：若 A × B = 0，則 A = 0 或 B = 0
   ========================================================================== */
function initZeroCanvas() {
  const cv = elById('canvas-zero');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('zr-a'), sb = elById('zr-b');
  const va = elById('zr-va'), vb = elById('zr-vb');
  const out = elById('zr-formula');
  const fb = elById('zr-feedback');
  const C = OC_TONE[2];

  function draw() {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    const p = a * b;
    const W = cv.width;
    const cell = 32, gx = W / 2 - 4.5 * cell + 12, gy = 82;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '乘法表裡，乘積是 0 的格子在哪裡？', C);
    textCenter(ctx, 'B', gx + 4.5 * cell, 50, OC_LEAF, fi(800, 16));
    textCenter(ctx, 'A', gx - 42, gy + 4.5 * cell, OC_ORANGE, fi(800, 16));
    for (let j = 0; j < 9; j++) {
      const v = j - 4;
      textCenter(ctx, mn(v), gx + j * cell + cell / 2, 70, v === b ? OC_LEAF : MUTED, f(v === b ? 800 : 700, 13));
    }
    for (let i = 0; i < 9; i++) {
      const A = i - 4;
      textCenter(ctx, mn(A), gx - 16, gy + i * cell + cell / 2, A === a ? OC_ORANGE : MUTED, f(A === a ? 800 : 700, 13));
      for (let j = 0; j < 9; j++) {
        const B = j - 4, v = A * B;
        const x = gx + j * cell, y = gy + i * cell;
        ctx.save();
        ctx.fillStyle = v === 0 ? 'rgba(253,186,116,0.38)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = 'rgba(226,232,240,0.16)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cell, cell);
        ctx.restore();
        textCenter(ctx, mn(v), x + cell / 2, y + cell / 2, v === 0 ? OC_CREAM : DIM, f(v === 0 ? 800 : 600, 12));
      }
    }
    const cx = gx + (b + 4) * cell, cyy = gy + (a + 4) * cell;
    ctx.save();
    ctx.strokeStyle = p === 0 ? OC_JADE : OC_ROSE;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(cx + 1, cyy + 1, cell - 2, cell - 2);
    ctx.restore();

    let msg;
    if (a === 0 && b === 0) msg = '兩個都是 0：乘積是 0';
    else if (a === 0) msg = 'A = 0（B 不是 0）：乘積還是 0';
    else if (b === 0) msg = 'B = 0（A 不是 0）：乘積還是 0';
    else msg = '兩個都不是 0：乘積一定不是 0';
    const y = 386;
    drawPanel(ctx, 18, y, W - 36, 76, p === 0 ? OC_JADE : OC_ROSE, 0.08);
    exLine(ctx, [IT('A', OC_ORANGE), T('×', INK), IT('B', OC_LEAF), T(`= ${mn(a)} × ${mn(par(b))} = ${mn(p)}`, INK)], y + 25, 19);
    exLine(ctx, [T(msg, p === 0 ? OC_JADE : OC_ROSE)], y + 55, 16);

    out.innerHTML = wbrEq(`A \\times B = ${a} \\times ${par(b)} = ${p}`);
    fb.innerHTML = wrapFeedback(p === 0
      ? '乘積是 \\(0\\) 的格子剛好排成一個「十」字：不是在 \\(A = 0\\) 那一列，就是在 \\(B = 0\\) 那一行（或兩個都是 \\(0\\)）。'
      : `\\(A\\)、\\(B\\) 都不是 \\(0\\)，乘積 \\(${p}\\) 就不是 \\(0\\)。十字以外的格子，沒有一格是 \\(0\\)。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：提公因式 x——ax² + bx = 0，x = 0 一定是一個解
   ========================================================================== */
function initCommonCanvas() {
  const cv = elById('canvas-common');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('cm-a'), sb = elById('cm-b');
  const va = elById('cm-va'), vb = elById('cm-vb');
  const g = elById('cm-d-group');
  const out = elById('cm-formula');
  const fb = elById('cm-feedback');
  const C = OC_TONE[3];
  let d = 1;
  skipZero(sa);
  skipZero(sb);

  function draw() {
    const a = iv(sa), b = iv(sb);
    const [an, ad] = reduce(a, d);
    va.textContent = d === 1 ? a : `${a}/${d}`;
    vb.textContent = b;
    const B = ad * b;
    const r = linRoot(an, B);
    const xTail = `x^2 ${b < 0 ? '-' : '+'} ${pyBody(Math.abs(b), 1)} = 0`;
    const origItems = ad === 1
      ? [ocInk(pyJoin([[an, 2], [b, 1]]) + ' = 0')]
      : [SEQ([...(an < 0 ? [T('−')] : []), FR(Math.abs(an), ad), ocInk(xTail)], undefined, 2)];
    const origTex = ad === 1
      ? pyJoin([[an, 2], [b, 1]]) + ' = 0'
      : `${an < 0 ? '-' : ''}\\frac{${Math.abs(an)}}{${ad}}${xTail}`;
    const factor = linStr(an, B);

    const rows = [row('原式', '只有 x² 項和 x 項', origItems)];
    if (ad > 1) rows.push(row(`同乘以 ${ad}`, '係數先化成整數', pyJoin([[an, 2], [B, 1]]) + ' = 0'));
    rows.push(row('提公因式 x', '每一項都有 x', `x(${factor}) = 0`));
    rows.push(row('拆成兩個', 'A × B = 0：A = 0 或 B = 0', `x = 0 或 ${factor} = 0`));
    rows.push(row('解', '', solItems([0, 1], r)));

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '提出公因式 x，再拆成兩個一次方程式', C);
    drawStepRows(ctx, rows, rows.length, { top: 70, gap: 52, eqX: 172, color: C, size: 20 });

    const y = 326;
    drawPanel(ctx, 18, y, W - 36, 138, OC_JADE, 0.07);
    exLine(ctx, andItems([0, 1], r, OC_JADE), y + 32, 19);
    exLine(ctx, [T('若兩邊同除以', OC_ROSE), IT('x', OC_ROSE), T('，只剩', OC_ROSE), xIs(r, OC_ROSE), T('，x = 0 就不見了', OC_ROSE)], y + 84, 16);
    exLine(ctx, [T('代入 x = 0：每一項都是 0，左邊 = 0 = 右邊', MUTED)], y + 120, 14);

    out.innerHTML = `${wbrEq(origTex)}，解為 \\(0\\) 和 \\(${rTex(r)}\\)`;
    let note;
    if (ad > 1) note = `係數有分數，先同乘以 \\(${ad}\\)，變成 ${wbrEq(pyJoin([[an, 2], [B, 1]]) + ' = 0')}，再提出 \\(x\\)。`;
    else if (d > 1) note = `\\(${a} \\div ${d} = ${an}\\)，\\(x^2\\) 的係數其實是整數，不必同乘，直接提出 \\(x\\)。`;
    else note = `提出 \\(x\\) 得 \\(x(${factor}) = 0\\)：\\(x = 0\\) 一定是其中一個解，不能漏掉。`;
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-cm-d', v => { d = parseInt(v, 10); draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：提整組公因式——括號整組當成一個數提出來
   ========================================================================== */
// 前面那一項 s·x + t（t = 0 時是單項式）；t 只取正數，(x − 1)(x − 7) 這類
// 評量題的中間式就不會被調出來（開發約束 29）
const GP_FRONTS = [{ s: 2, t: 0 }, { s: 3, t: 0 }, { s: -1, t: 0 }, { s: 1, t: 3 }, { s: 1, t: 6 }];

function initGroupCanvas() {
  const cv = elById('canvas-group');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const su = elById('gp-u'), sv = elById('gp-v'), sf = elById('gp-f'), sk = elById('gp-k');
  const vu = elById('gp-vu'), vv = elById('gp-vv'), vf = elById('gp-vf'), vk = elById('gp-vk');
  const out = elById('gp-formula');
  const fb = elById('gp-feedback');
  const C = OC_TONE[4];
  skipZero(sv);
  skipZero(sk);

  function draw() {
    const u = iv(su), v = iv(sv), k = iv(sk);
    const F = GP_FRONTS[clamp(iv(sf), 0, GP_FRONTS.length - 1)];
    const G = linStr(u, v);
    const fIn = F.t === 0 ? pyMono(F.s, 1) : linStr(F.s, F.t);
    const fOut = F.t === 0 ? fIn : `(${fIn})`;
    vu.textContent = u; vv.textContent = v; vf.textContent = fIn; vk.textContent = k;
    const kAbs = Math.abs(k), kSg = k < 0 ? '-' : '+';
    const orig = `${fOut}(${G}) ${kSg} ${kAbs === 1 ? '' : kAbs}(${G}) = 0`;
    const pulled = `(${G})[${fIn} ${kSg} ${kAbs}] = 0`;
    const s2 = F.s, t2 = F.t + k;
    const simp = fac(u, v, s2, t2) + ' = 0';
    const r1 = linRoot(u, v), r2 = linRoot(s2, t2);

    const rows = [
      row('原式', `兩項都有 (${mn(G)})`, orig),
      row(`提出 (${mn(G)})`, '整組當成一個數', pulled),
      row('化簡括號', '中括號裡合併', simp),
      row('拆成兩個', '', `${G} = 0 或 ${linStr(s2, t2)} = 0`),
      row('解', '', solItems(r1, r2))
    ];

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '括號整組提出來，不必展開', C);
    drawStepRows(ctx, rows, rows.length, { top: 70, gap: 52, eqX: 172, color: C, size: 20 });

    const y = 326;
    drawPanel(ctx, 18, y, W - 36, 138, OC_JADE, 0.07);
    exLine(ctx, andItems(r1, r2, OC_JADE), y + 32, 19);
    exLine(ctx, [T(k < 0 ? `前面是減號：提出 (${mn(G)}) 後，中括號裡寫「− ${kAbs}」` : `提出 (${mn(G)}) 後，中括號裡寫「+ ${kAbs}」`, k < 0 ? OC_ROSE : INK)], y + 84, 16);
    exLine(ctx, [T('展開再整理也算得出來，但多很多步、容易算錯', MUTED)], y + 120, 14);

    out.innerHTML = `${wbrEq(orig)}，${andTex(r1, r2)}`;
    fb.innerHTML = wrapFeedback(`兩項都有 \\((${G})\\)，整組提出來：${wbrEq(simp)}，${andTex(r1, r2)}。`);
    typeset([out, fb]);
  }

  [su, sv, sf, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：兩邊有相同因式——先移項再提公因式，不可以兩邊同除
   ========================================================================== */
const DV_SETS = {
  w1: { orig: '(x - 2)(3x + 1) = (x - 2)(x + 7)', G: 'x - 2',
        right: [['移項', '右邊化成 0', '(x - 2)(3x + 1) - (x - 2)(x + 7) = 0'],
                ['提出 (x − 2)', '', '(x - 2)[(3x + 1) - (x + 7)] = 0'],
                ['化簡括號', '後面那組整組變號', '(x - 2)(2x - 6) = 0'],
                ['拆成兩個', '', 'x - 2 = 0 或 2x - 6 = 0']],
        roots: [[2, 1], [3, 1]],
        wrong: [['同除以 (x − 2)', '兩邊都除掉', '3x + 1 = x + 7'], ['移項', '', '2x = 6']],
        kept: [3, 1], lost: [2, 1] },
  w2: { orig: '(x + 5)(2x - 3) = (x + 5)(x + 1)', G: 'x + 5',
        right: [['移項', '右邊化成 0', '(x + 5)(2x - 3) - (x + 5)(x + 1) = 0'],
                ['提出 (x + 5)', '', '(x + 5)[(2x - 3) - (x + 1)] = 0'],
                ['化簡括號', '後面那組整組變號', '(x + 5)(x - 4) = 0'],
                ['拆成兩個', '', 'x + 5 = 0 或 x - 4 = 0']],
        roots: [[-5, 1], [4, 1]],
        wrong: [['同除以 (x + 5)', '兩邊都除掉', '2x - 3 = x + 1']],
        kept: [4, 1], lost: [-5, 1] },
  w3: { orig: '(2x - 1)^2 = (2x - 1)(x + 3)', G: '2x - 1',
        right: [['移項', '右邊化成 0', '(2x - 1)^2 - (2x - 1)(x + 3) = 0'],
                ['提出 (2x − 1)', '', '(2x - 1)[(2x - 1) - (x + 3)] = 0'],
                ['化簡括號', '後面那組整組變號', '(2x - 1)(x - 4) = 0'],
                ['拆成兩個', '', '2x - 1 = 0 或 x - 4 = 0']],
        roots: [[1, 2], [4, 1]],
        wrong: [['同除以 (2x − 1)', '兩邊都除掉', '2x - 1 = x + 3']],
        kept: [4, 1], lost: [1, 2] },
  w4: { orig: 'x(x + 6) = 7(x + 6)', G: 'x + 6',
        right: [['移項', '右邊化成 0', 'x(x + 6) - 7(x + 6) = 0'],
                ['提出 (x + 6)', '', '(x + 6)(x - 7) = 0'],
                ['拆成兩個', '', 'x + 6 = 0 或 x - 7 = 0']],
        roots: [[-6, 1], [7, 1]],
        wrong: [['同除以 (x + 6)', '兩邊都除掉', 'x = 7']],
        kept: [7, 1], lost: [-6, 1] }
};

function initDivideCanvas() {
  const cv = elById('canvas-divide');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('dv-prob-group'), mG = elById('dv-mode-group');
  const out = elById('dv-formula');
  const fb = elById('dv-feedback');
  const C = OC_TONE[5];
  let key = 'w1', mode = 'right';

  function draw() {
    const S = DV_SETS[key];
    const W = cv.width;
    const rows = [row('原式', '兩邊都有 (' + mn(S.G) + ')', S.orig)];
    if (mode === 'right') {
      S.right.forEach(([n, h, s]) => rows.push(row(n, h, s)));
      rows.push(row('解', '', solItems(S.roots[0], S.roots[1])));
    } else {
      S.wrong.forEach(([n, h, s]) => rows.push(row(n, h, s)));
      const last = S.wrong[S.wrong.length - 1][2];
      if (last.indexOf('x = ') !== 0) rows.push(row('只得到', '', [xIs(S.kept)]));
    }

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'right' ? '正確：先移項，再提公因式' : '錯誤：兩邊同除以相同的因式', mode === 'right' ? C : OC_ROSE);
    drawStepRows(ctx, rows, rows.length, { top: 62, gap: 44, eqX: 160, color: mode === 'right' ? C : OC_ROSE, size: 19 });

    const y = 330;
    if (mode === 'right') {
      drawPanel(ctx, 18, y, W - 36, 150, OC_JADE, 0.07);
      exLine(ctx, andItems(S.roots[0], S.roots[1], OC_JADE), y + 30, 20);
      exLine(ctx, [ocInk(`${S.G} = 0`, INK), T('時，兩邊都是 0，所以', MUTED), xIs(S.lost, INK), T('也是解', MUTED)], y + 76, 16);
      exLine(ctx, [T('後面那一組前面是減號：整組相減，每一項都要變號', MUTED)], y + 118, 14);
    } else {
      drawPanel(ctx, 18, y, W - 36, 150, OC_ROSE, 0.08);
      exLine(ctx, [T('漏掉了', OC_ROSE), xIs(S.lost, OC_ROSE)], y + 30, 20);
      exLine(ctx, [T('代入', MUTED), xIs(S.lost, INK), T('：', MUTED), ocInk(`${S.G} = 0`, INK), T('，左邊 = 0、右邊 = 0，等號成立', MUTED)], y + 76, 15);
      exLine(ctx, [T('0 不能當除數：這個因式可能是 0，就不能拿來除', OC_ROSE)], y + 118, 15);
    }

    out.innerHTML = mode === 'right'
      ? `${wbrEq(S.orig)}，${andTex(S.roots[0], S.roots[1])}`
      : `${wbrEq(S.orig)}，同除只得到 \\(x = ${rTex(S.kept)}\\)`;
    fb.innerHTML = wrapFeedback(mode === 'right'
      ? `先移項讓右邊是 \\(0\\)，再提出 \\((${S.G})\\)：${andTex(S.roots[0], S.roots[1])}。`
      : `兩邊同除以 \\((${S.G})\\) 只得到 \\(x = ${rTex(S.kept)}\\)；但 \\(x = ${rTex(S.lost)}\\) 時 \\(${S.G} = 0\\)，兩邊都是 \\(0\\)，這個解被除掉了。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-dv-prob', v => { key = v; draw(); });
  bindPickGroup(mG, 'data-dv-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：十字交乘法解方程式——先移項、同除公因數，再分解
   ========================================================================== */
const CX_SETS = {
  k1: { rows: [['原式', '右邊已經是 0', 'x^2 + 2x - 24 = 0'],
               ['十字交乘', '相乘 −24、相加 2', '(x + 6)(x - 4) = 0'],
               ['拆成兩個', '', 'x + 6 = 0 或 x - 4 = 0']],
        roots: [[-6, 1], [4, 1]], cross: [1, 6, 1, -4], b: 2, at: 1 },
  k2: { rows: [['原式', '右邊不是 0', '2x^2 - 7x = 15'],
               ['移項', '右邊化成 0', '2x^2 - 7x - 15 = 0'],
               ['十字交乘', '左欄拆 2x²', '(x - 5)(2x + 3) = 0'],
               ['拆成兩個', '', 'x - 5 = 0 或 2x + 3 = 0']],
        roots: [[5, 1], [-3, 2]], cross: [1, -5, 2, 3], b: -7, at: 2 },
  k3: { rows: [['原式', 'x² 係數是負的', '-3x^2 + 6x + 45 = 0'],
               ['同除以 −3', 'x² 係數變成 1', 'x^2 - 2x - 15 = 0'],
               ['十字交乘', '', '(x - 5)(x + 3) = 0'],
               ['拆成兩個', '', 'x - 5 = 0 或 x + 3 = 0']],
        roots: [[5, 1], [-3, 1]], cross: [1, -5, 1, 3], b: -2, at: 2 },
  k4: { rows: [['原式', '右邊不是 0', '12x^2 + 8x = 4'],
               ['移項', '右邊化成 0', '12x^2 + 8x - 4 = 0'],
               ['同除以 4', '各項的公因數', '3x^2 + 2x - 1 = 0'],
               ['十字交乘', '', '(3x - 1)(x + 1) = 0'],
               ['拆成兩個', '', '3x - 1 = 0 或 x + 1 = 0']],
        roots: [[1, 3], [-1, 1]], cross: [3, -1, 1, 1], b: 2, at: 3 }
};

function initCrossCanvas() {
  const cv = elById('canvas-cross');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('cx-prob-group');
  const out = elById('cx-formula');
  const fb = elById('cx-feedback');
  const C = OC_TONE[6];
  const st = { step: 1 };
  let key = 'k1';

  function draw() {
    const S = CX_SETS[key];
    const N = S.rows.length + 1;
    st.step = clamp(st.step, 1, N);
    syncSteps('cx', st.step, N);
    const rows = S.rows.map(([n, h, s]) => row(n, h, s));
    rows.push(row('解', '', solItems(S.roots[0], S.roots[1])));
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '整理成「⋯ = 0」，再用十字交乘分解', C);
    drawStepRows(ctx, rows, st.step, { top: 62, gap: 44, eqX: 160, color: C, size: 20 });

    const y = 316;
    const [a1, c1, a2, c2] = S.cross;
    if (st.step > S.at) {
      drawPanel(ctx, 18, y, W - 36, 190, C, 0.05);
      drawCross(ctx, 150, y + 84, a1, c1, a2, c2, { ends: true, target: S.b, sumW: 230 });
      textLeft(ctx, '左欄相乘 → x² 項', 300, y + 46, OC_ORANGE, f(800, 15));
      textLeft(ctx, '右欄相乘 → 常數項', 300, y + 84, OC_LEAF, f(800, 15));
      textLeft(ctx, '交叉相加 → x 項', 300, y + 122, OC_SKY, f(800, 15));
    } else {
      drawPanel(ctx, 18, y, W - 36, 120, C, 0.05);
      exLine(ctx, [T('分解之前先整理：', C)], y + 30, 17);
      exLine(ctx, [T('① 右邊化成 0　② 各項有公因數就同除', INK)], y + 64, 16);
      exLine(ctx, [T('③ x² 係數是負的就同除以負數', INK)], y + 94, 16);
    }

    const name = rows[st.step - 1].name;
    out.innerHTML = st.step === N
      ? `${wbrEq(S.rows[0][2])}，${andTex(S.roots[0], S.roots[1])}`
      : wbrEq(S.rows[st.step - 1][2].split(' 或 ')[0]) + (S.rows[st.step - 1][2].indexOf(' 或 ') > 0 ? ` 或 ${wbrEq(S.rows[st.step - 1][2].split(' 或 ')[1])}` : '');
    let note;
    if (name === '原式') note = '先看右邊是不是 \\(0\\)，以及各項有沒有公因數。';
    else if (name === '移項') note = '把右邊的項移到左邊，右邊化成 \\(0\\)，才能用「乘積等於 \\(0\\)」。';
    else if (name.indexOf('同除以') === 0) note = '等號兩邊同除以同一個不是 \\(0\\) 的數，解不會改變；係數變小，比較好分解。';
    else if (name === '十字交乘') note = `交叉相乘：${wbrEq(crossTex(a1, c1, a2, c2))}，剛好湊出中間項。`;
    else if (name === '拆成兩個') note = '兩個一次式相乘等於 \\(0\\)，至少有一個是 \\(0\\)。';
    else note = `${andTex(S.roots[0], S.roots[1])}。`;
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-cx-prob', v => { key = v; st.step = 1; draw(); });
  bindSteps('cx', () => CX_SETS[key].rows.length + 1, st, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：平方差公式——a²x² − b² = 0，兩根互為相反數
   ========================================================================== */
function initDiffCanvas() {
  const cv = elById('canvas-diff');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('df-a'), sb = elById('df-b');
  const va = elById('df-va'), vb = elById('df-vb');
  const g = elById('df-mode-group');
  const out = elById('df-formula');
  const fb = elById('df-feedback');
  const C = OC_TONE[7];
  let mode = 'std';

  function draw() {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    const A2 = a * a, B2 = b * b;
    const ax2 = pyMono(A2, 2);
    const std = `${ax2} - ${B2} = 0`;
    const orig = mode === 'neg' ? `${B2} - ${ax2} = 0` : (mode === 'move' ? `${ax2} = ${B2}` : std);
    const neg = reduce(-b, a), pos = reduce(b, a);

    const rows = [row('原式', '', orig)];
    if (mode === 'neg') rows.push(row('同乘以 −1', 'x² 項變成正的', std));
    if (mode === 'move') rows.push(row('移項', '右邊化成 0', std));
    rows.push(row('寫成平方差', 'A² − B² 的樣子', a === 1 ? `x^2 - ${b}^2 = 0` : `(${pyMono(a, 1)})^2 - ${b}^2 = 0`));
    rows.push(row('平方差公式', '(A + B)(A − B)', `(${linStr(a, b)})(${linStr(a, -b)}) = 0`));
    rows.push(row('拆成兩個', '', `${linStr(a, b)} = 0 或 ${linStr(a, -b)} = 0`));
    rows.push(row('解', '', solItems(neg, pos)));

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '平方差：兩個根互為相反數', C);
    drawStepRows(ctx, rows, rows.length, { top: 62, gap: 44, eqX: 160, color: C, size: 20 });

    // 數線：只有正向那端有箭頭（開發約束 34）
    const ny = 428;
    const L = numLine(ctx, { x0: 40, x1: 492, y: ny, min: -10, max: 10, tick: 1, labelEvery: 2, color: INK });
    const xn = L.px(neg[0] / neg[1]), xp = L.px(pos[0] / pos[1]);
    // 兩根到 0 的距離：兩段一樣長的色條
    ocLine(ctx, L.px(0), ny - 12, xn, ny - 12, OC_ORANGE, 4);
    ocLine(ctx, L.px(0), ny - 12, xp, ny - 12, OC_LEAF, 4);
    drawDot(ctx, xn, ny, OC_ORANGE, 7);
    drawDot(ctx, xp, ny, OC_LEAF, 7);
    drawExpr(ctx, [rIt(neg, OC_ORANGE)], xn - 16, ny - 44, 17, OC_ORANGE, { maxW: 80 });
    drawExpr(ctx, [rIt(pos, OC_LEAF)], xp + 16, ny - 44, 17, OC_LEAF, { maxW: 80 });
    textCenter(ctx, '到 0 的距離一樣：互為相反數', L.px(0), ny + 50, MUTED, f(700, 14));

    out.innerHTML = `${wbrEq(orig)}，${andTex(neg, pos)}`;
    fb.innerHTML = wrapFeedback(mode === 'neg'
      ? `\\(x^2\\) 項是負的，先同乘以 \\(-1\\)（或直接分解成 \\((${b} + ${pyMono(a, 1)})(${b} - ${pyMono(a, 1)})\\)），兩根是 \\(\\pm ${rTex(pos)}\\)。`
      : `${wbrEq(`${ax2} - ${B2} = (${linStr(a, b)})(${linStr(a, -b)})`)}，兩根 \\(${rTex(neg)}\\) 和 \\(${rTex(pos)}\\) 互為相反數，不要只寫正的那一個。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-df-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：完全平方式——(ax + b)² = 0，兩個解相同，稱為重根
   ========================================================================== */
function initDoubleCanvas() {
  const cv = elById('canvas-double');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('db-a'), sb = elById('db-b');
  const va = elById('db-va'), vb = elById('db-vb');
  const g = elById('db-mode-group');
  const out = elById('db-formula');
  const fb = elById('db-feedback');
  const C = OC_TONE[8];
  let mode = 'std';
  skipZero(sb);

  function draw() {
    const a = iv(sa), b = iv(sb);
    va.textContent = a; vb.textContent = b;
    const A2 = a * a, M = 2 * a * b, B2 = b * b, bA = Math.abs(b);
    const std = quad(A2, M, B2) + ' = 0';
    const orig = mode === 'move' ? `${pyMono(A2, 2)} + ${B2} = ${pyMono(-M, 1)}` : std;
    const lin = linStr(a, b);
    const r = linRoot(a, b);
    const ax = pyMono(a, 1);

    const rows = [row('原式', '', orig)];
    if (mode === 'move') rows.push(row('移項', '右邊化成 0', std));
    rows.push(row('寫成完全平方', b > 0 ? 'A² + 2AB + B²' : 'A² − 2AB + B²',
      `${a === 1 ? 'x^2' : `(${ax})^2`} ${b > 0 ? '+' : '-'} 2·${ax}·${bA} + ${bA}^2 = 0`));
    rows.push(row(b > 0 ? '和的平方' : '差的平方', '', `(${lin})^2 = 0`));
    rows.push(row('拆成兩個', '兩個因式一樣', `${lin} = 0 或 ${lin} = 0`));
    rows.push(row('解', '', solItems(r, r)));

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '完全平方式：兩個解落在同一點', C);
    drawStepRows(ctx, rows, rows.length, { top: 60, gap: 40, eqX: 160, color: C, size: 19 });

    // 十字交乘：右欄上下兩個數一樣
    drawCross(ctx, 128, 372, a, b, a, b, { ends: true, target: M, sumW: 210, dx: 48, bwL: 68, bwR: 62, size: 20, sumSize: 17 });

    const ny = 420;
    const L = numLine(ctx, { x0: 282, x1: 492, y: ny, min: -6, max: 6, tick: 1, labelEvery: 2, color: INK });
    const xr = L.px(r[0] / r[1]);
    ctx.save();
    ctx.strokeStyle = C;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(xr, ny, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawDot(ctx, xr, ny, OC_ORANGE, 7);
    drawExpr(ctx, [rIt(r, OC_CREAM)], xr, ny - 36, 17, OC_CREAM, { maxW: 80 });
    textCenter(ctx, '兩個解疊在同一點', 387, ny + 50, MUTED, f(700, 13));

    out.innerHTML = `${wbrEq(orig)}，\\(x = ${rTex(r)}\\)（重根）`;
    fb.innerHTML = wrapFeedback(`${wbrEq(`${quad(A2, M, B2)} = (${lin})^2`)}：兩個因式一樣，兩個解都是 \\(${rTex(r)}\\)，記作 \\(x = ${rTex(r)}\\)（重根）。`);
    typeset([out, fb]);
  }

  [sa, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-db-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：右邊不是 0——先展開、移項，不能拆成兩個「= k」
   ========================================================================== */
const EX_SETS = {
  p1: { orig: 'x(x + 2) = 15', k: 15, F: [[1, 0], [1, 2]],
        right: [['展開', '', 'x^2 + 2x = 15'], ['移項', '右邊化成 0', 'x^2 + 2x - 15 = 0'],
                ['十字交乘', '', '(x + 5)(x - 3) = 0'], ['拆成兩個', '', 'x + 5 = 0 或 x - 3 = 0']],
        roots: [[-5, 1], [3, 1]],
        wrong: 'x = 15 或 x + 2 = 15', wroots: [[15, 1], [13, 1]] },
  p2: { orig: '(x + 1)(x + 4) = 10', k: 10, F: [[1, 1], [1, 4]],
        right: [['展開', '', 'x^2 + 5x + 4 = 10'], ['移項', '右邊化成 0', 'x^2 + 5x - 6 = 0'],
                ['十字交乘', '', '(x + 6)(x - 1) = 0'], ['拆成兩個', '', 'x + 6 = 0 或 x - 1 = 0']],
        roots: [[-6, 1], [1, 1]],
        wrong: 'x + 1 = 10 或 x + 4 = 10', wroots: [[9, 1], [6, 1]] },
  p3: { orig: '(x - 2)(2x + 3) = 4', k: 4, F: [[1, -2], [2, 3]],
        right: [['展開', '', '2x^2 - x - 6 = 4'], ['移項', '右邊化成 0', '2x^2 - x - 10 = 0'],
                ['十字交乘', '', '(x + 2)(2x - 5) = 0'], ['拆成兩個', '', 'x + 2 = 0 或 2x - 5 = 0']],
        roots: [[-2, 1], [5, 2]],
        wrong: 'x - 2 = 4 或 2x + 3 = 4', wroots: [[6, 1], [1, 2]] },
  p4: { orig: '(3 - x)(x + 1) = -5', k: -5, F: [[-1, 3], [1, 1]],
        right: [['展開', '', '-x^2 + 2x + 3 = -5'], ['移項', '右邊化成 0', '-x^2 + 2x + 8 = 0'],
                ['同乘以 −1', 'x² 係數變成 1', 'x^2 - 2x - 8 = 0'],
                ['十字交乘', '', '(x - 4)(x + 2) = 0'], ['拆成兩個', '', 'x - 4 = 0 或 x + 2 = 0']],
        roots: [[4, 1], [-2, 1]],
        wrong: '3 - x = -5 或 x + 1 = -5', wroots: [[8, 1], [-6, 1]] }
};

function initExpandCanvas() {
  const cv = elById('canvas-expand');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = elById('ex-prob-group'), mG = elById('ex-mode-group');
  const out = elById('ex-formula');
  const fb = elById('ex-feedback');
  const C = OC_TONE[9];
  let key = 'p1', mode = 'right';

  // 代回原式：兩個因式的值相乘，看是不是 k
  function check(S, r) {
    const f1 = linVal(S.F[0][0], S.F[0][1], r), f2 = linVal(S.F[1][0], S.F[1][1], r);
    const prod = mulR(f1, f2);
    const ok = prod[1] === 1 && prod[0] === S.k;
    return { ok, prod, items: [T('代入', MUTED), xIs(r, INK), T('：', MUTED), valItem(f1, INK), T('×', INK), valItem(f2, INK),
      T('=', INK), rIt(prod, INK), T(ok ? '✓' : `≠ ${mn(S.k)}`, ok ? OC_JADE : OC_ROSE)] };
  }

  function draw() {
    const S = EX_SETS[key];
    const W = cv.width;
    const rows = [row('原式', `右邊是 ${mn(S.k)}，不是 0`, S.orig)];
    if (mode === 'right') {
      S.right.forEach(([n, h, s]) => rows.push(row(n, h, s)));
      rows.push(row('解', '', solItems(S.roots[0], S.roots[1])));
    } else {
      rows.push(row(`拆成兩個 = ${mn(S.k)}`, '錯誤的拆法', S.wrong));
      rows.push(row('得到', '', solItems(S.wroots[0], S.wroots[1])));
    }

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'right' ? '先展開、移項成「⋯ = 0」再分解' : `錯誤：乘積是 ${mn(S.k)}，就把兩個因式都設成 ${mn(S.k)}`, mode === 'right' ? C : OC_ROSE);
    drawStepRows(ctx, rows, rows.length, { top: 60, gap: 40, eqX: 160, color: mode === 'right' ? C : OC_ROSE, size: 19 });

    const y = 330;
    if (mode === 'right') {
      drawPanel(ctx, 18, y, W - 36, 170, OC_JADE, 0.07);
      exLine(ctx, andItems(S.roots[0], S.roots[1], OC_JADE), y + 30, 19);
      exLine(ctx, check(S, S.roots[0]).items, y + 80, 17);
      exLine(ctx, check(S, S.roots[1]).items, y + 132, 17);
    } else {
      drawPanel(ctx, 18, y, W - 36, 170, OC_ROSE, 0.08);
      exLine(ctx, [T(`乘積是 ${mn(S.k)}，不代表兩個因式都是 ${mn(S.k)}`, OC_ROSE)], y + 30, 17);
      exLine(ctx, check(S, S.wroots[0]).items, y + 80, 17);
      exLine(ctx, check(S, S.wroots[1]).items, y + 132, 17);
    }

    out.innerHTML = mode === 'right'
      ? `${wbrEq(S.orig)}，${andTex(S.roots[0], S.roots[1])}`
      : `${wbrEq(S.orig)}，錯拆得到 \\(${rTex(S.wroots[0])}\\)、\\(${rTex(S.wroots[1])}\\)，代回都不成立`;
    fb.innerHTML = wrapFeedback(mode === 'right'
      ? `右邊不是 \\(0\\)，先展開、移項成 ${wbrEq(S.right[1][2])}，再分解。解完代回原式，兩個都成立。`
      : `只有「乘積 \\(= 0\\)」才能拆成兩個「\\(= 0\\)」。乘積是 \\(${S.k}\\) 的兩個數有無限多種，不一定都是 \\(${S.k}\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-ex-prob', v => { key = v; draw(); });
  bindPickGroup(mG, 'data-ex-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：已知一根，求係數與另一根
   ========================================================================== */
// raw：把 x = r 代進去的樣子；代入後整理成 A + B·m = 0
const OR_FAMS = {
  F1: { eq: 'x^2 + mx - 12 = 0', roots: [-12, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 12], def: 2,
        raw: r => `${sqS(r)} + ${pS(r)} × m - 12 = 0`, A: r => r * r - 12, B: r => r, poly: m => [1, m, -12] },
  F2: { eq: 'x^2 + 3x + m = 0', roots: [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6], def: 2,
        raw: r => `${sqS(r)} + 3 × ${pS(r)} + m = 0`, A: r => r * r + 3 * r, B: () => 1, poly: m => [1, 3, m] },
  F3: { eq: 'x^2 - mx - 3m = 0', roots: [-12, -6, -4, -2, 0, 6], def: -2,
        raw: r => `${sqS(r)} - ${pS(r)} × m - 3m = 0`, A: r => r * r, B: r => -r - 3, poly: m => [1, -m, -3 * m] }
};

function initOneRootCanvas() {
  const cv = elById('canvas-one');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sr = elById('or-r'), vr = elById('or-vr');
  const g = elById('or-fam-group');
  const out = elById('or-formula');
  const fb = elById('or-feedback');
  const C = OC_TONE[10];
  let fam = 'F1';

  function setFam(k) {
    fam = k;
    const Fm = OR_FAMS[k];
    sr.max = Fm.roots.length - 1;
    sr.value = Fm.roots.indexOf(Fm.def);
  }

  function draw() {
    const Fm = OR_FAMS[fam];
    const r = Fm.roots[clamp(iv(sr), 0, Fm.roots.length - 1)];
    vr.textContent = r;
    const A = Fm.A(r), B = Fm.B(r);
    const m = -A / B;
    const P = Fm.poly(m);
    const other = -P[1] - r;
    const dbl = (other === r);
    let factored;
    if (dbl && r === 0) factored = 'x^2 = 0';
    else factored = fac(1, -r, 1, -other) + ' = 0';
    const polyS = quad(P[0], P[1], P[2]) + ' = 0';

    const rows = [
      row(`代入 x = ${mn(r)}`, '已知的根代進去', Fm.raw(r)),
      row('整理', '得到 m 的一次方程式', `${vJoin([[A, ''], [B, 'm']])} = 0`),
      row('解出 m', '', `m = ${m}`),
      row('代回原式', '', polyS),
      row('因式分解', r === 0 ? '一定有因式 x' : `一定有 (x ${r < 0 ? '+' : '−'} ${Math.abs(r)})`, factored),
      row(dbl ? '重根' : '另一根', '', dbl ? [xIs([r, 1]), T('（重根）')] : [xIs([other, 1])])
    ];

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '已知一根：代入求係數，再分解找另一根', C);
    drawPanel(ctx, 18, 44, W - 36, 50, C, 0.06);
    exLine(ctx, [ocInk(Fm.eq, OC_CREAM), T(`　已知一根 x = ${mn(r)}`, MUTED)], 69, 20);
    drawStepRows(ctx, rows, rows.length, { top: 128, gap: 50, eqX: 160, color: C, size: 20 });

    const y = 412;
    drawPanel(ctx, 18, y, W - 36, 76, OC_JADE, 0.07);
    exLine(ctx, [T(`m = ${mn(m)}`, OC_JADE), T(dbl ? `，另一根也是 ${mn(r)}（重根）` : `，另一根是 ${mn(other)}`, OC_JADE)], y + 26, 19);
    exLine(ctx, [T('分解的結果裡一定有一個因式讓已知的根成立，可以拿來檢查', MUTED)], y + 56, 14);

    out.innerHTML = `已知 \\(x = ${r}\\)：\\(m = ${m}\\)，${dbl ? `另一根也是 \\(${r}\\)（重根）` : `另一根 \\(x = ${other}\\)`}`;
    fb.innerHTML = wrapFeedback(`代入 \\(x = ${r}\\) 得 \\(${vJoin([[A, ''], [B, 'm']])} = 0\\)，解出 \\(m = ${m}\\)；原方程式是 ${wbrEq(polyS)}，分解成 ${wbrEq(factored)}。`);
    typeset([out, fb]);
  }

  sr.addEventListener('input', draw);
  bindPickGroup(g, 'data-or-fam', v => { setFam(v); draw(); });
  setFam('F1');
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：已知兩根，求方程式的係數
   ========================================================================== */
function initTwoRootCanvas() {
  const cv = elById('canvas-two');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s1 = elById('tr-r1'), s2 = elById('tr-r2');
  const v1 = elById('tr-v1'), v2 = elById('tr-v2');
  const g = elById('tr-mode-group');
  const out = elById('tr-formula');
  const fb = elById('tr-feedback');
  const C = OC_TONE[11];
  let mode = 'sub';

  function draw() {
    const r1 = iv(s1), r2 = iv(s2);
    v1.textContent = r1; v2.textContent = r2;
    const p = -(r1 + r2), q = r1 * r2;
    const same = (r1 === r2);
    const polyS = quad(1, p, q) + ' = 0';
    const rows = [];
    if (mode === 'sub') {
      rows.push(row(`代入 x = ${mn(r1)}`, '', `${sqS(r1)} + ${pS(r1)} × p + q = 0`));
      rows.push(row(`代入 x = ${mn(r2)}`, '', `${sqS(r2)} + ${pS(r2)} × p + q = 0`));
      rows.push(row('整理成 ①', '', `${vJoin([[r1, 'p'], [1, 'q']])} = ${-r1 * r1}`));
      rows.push(row('整理成 ②', '', `${vJoin([[r2, 'p'], [1, 'q']])} = ${-r2 * r2}`));
      if (same) {
        rows.push(row('① − ②', '兩條一模一樣', '0 = 0'));
      } else {
        rows.push(row('① − ②', '消去 q', `${vJoin([[r1 - r2, 'p']])} = ${r2 * r2 - r1 * r1}`));
        rows.push(row('解出 p', '', `p = ${p}`));
        rows.push(row('p 代回 ①', '', `q = ${q}`));
      }
    } else {
      rows.push(row('寫成兩個因式', `根是 r，因式是 (x − r)`, `${fac(1, -r1, 1, -r2)} = 0`));
      rows.push(row('展開', '', `x^2 - (${r1} + ${par(r2)})x + ${pS(r1)} × ${pS(r2)} = 0`));
      rows.push(row('化簡', '', polyS));
      rows.push(row('對照', 'x² + px + q = 0', `p = ${p}，q = ${q}`));
    }

    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'sub' ? '方法一：兩根分別代入，解聯立' : '方法二：寫成 (x − r₁)(x − r₂) = 0 再展開', C);
    drawStepRows(ctx, rows, rows.length, { top: 60, gap: 38, eqX: 160, color: C, size: 19 });

    const y = 330;
    const stuck = (mode === 'sub' && same);
    drawPanel(ctx, 18, y, W - 36, 176, stuck ? OC_ROSE : OC_JADE, 0.07);
    if (stuck) {
      exLine(ctx, [T('兩根相同：代入只得到同一條式子，p、q 解不出來', OC_ROSE)], y + 26, 16);
      exLine(ctx, [T('改用方法二：', INK), ocInk(`${fac(1, -r1, 1, -r1)} = ${polyS.replace(' = 0', '')} = 0`, INK)], y + 58, 16);
    } else {
      exLine(ctx, [T('方程式是', OC_JADE), ocInk(polyS, INK), T(`（p = ${mn(p)}、q = ${mn(q)}）`, MUTED)], y + 28, 18);
    }
    const ny = 450;
    const L = numLine(ctx, { x0: 56, x1: 470, y: ny, min: -6, max: 6, tick: 1, labelEvery: 1, color: INK });
    if (same) {
      ctx.save();
      ctx.strokeStyle = C;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(L.px(r1), ny, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawDot(ctx, L.px(r1), ny, OC_ORANGE, 7);
      textCenter(ctx, `r₁ = r₂ = ${mn(r1)}`, L.px(r1), ny - 30, OC_CREAM, f(800, 15));
    } else {
      drawDot(ctx, L.px(r1), ny, OC_ORANGE, 7);
      drawDot(ctx, L.px(r2), ny, OC_LEAF, 7);
      textCenter(ctx, 'r₁', L.px(r1), ny - 26, OC_ORANGE, f(800, 15));
      textCenter(ctx, 'r₂', L.px(r2), ny - 26, OC_LEAF, f(800, 15));
    }

    out.innerHTML = `兩根 \\(${r1}\\)、\\(${r2}\\)：\\(p = ${p}\\)，\\(q = ${q}\\)`;
    fb.innerHTML = wrapFeedback(stuck
      ? `兩根都是 \\(${r1}\\)，代入兩次是同一條式子。改寫成 \\(${fac(1, -r1, 1, -r1)} = 0\\) 展開，得 ${wbrEq(polyS)}。`
      : (mode === 'sub'
        ? `兩條式子相減消去 \\(q\\)，解出 \\(p = ${p}\\)，再代回得 \\(q = ${q}\\)：${wbrEq(polyS)}。`
        : `根是 \\(${r1}\\) 的因式是 \\((${linStr(1, -r1)})\\)、根是 \\(${r2}\\) 的因式是 \\((${linStr(1, -r2)})\\)；展開得 ${wbrEq(polyS)}。`));
    typeset([out, fb]);
  }

  [s1, s2].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-tr-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}
