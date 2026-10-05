/* ==========================================================================
   3-4-3（第三冊 4-3）應用問題 — 互動 Canvas 與隨堂評量
   畫風：木刻版畫風柑橘觀光果園（小柚、阿圃），第 4 章三節共用。
   配色沿用 3-4-1／3-4-2：柑橘橘 OC_ORANGE、葉綠 OC_LEAF、天空藍 OC_SKY；
   玫瑰 OC_ROSE 是「不合、捨去」、翡翠綠 OC_JADE 是「合理、答案」。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／FR／VF／RT／measure／
   drawExpr／drawPanel／drawTitle／drawStepRows／wbrEq／numLine…），本檔只放
   本節的色票、有理數與根式小工具（沿用 3-4-2 的寫法），以及 10 個互動。

   本節的每個互動都是「設 → 列 → 解 → 檢查」四步驟，第 4 步一律畫出捨去的
   理由（負數、非整數、超出上限、讓某一邊變成負數）。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initStepsCanvas();
  initSumCanvas();
  initEggCanvas();
  initPriceCanvas();
  initBorderCanvas();
  initCrossCanvas();
  initPythCanvas();
  initGroupCanvas();
  initNosolCanvas();
  initDiscCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（OC_ = Orchard；共用檔沒有這個前綴）
   ========================================================================== */

const OC_ORANGE = '#fdba74';
const OC_LEAF = '#86efac';
const OC_SKY = '#93c5fd';
const OC_CREAM = '#fef3c7';
const OC_ROSE = '#fb7185';
const OC_JADE = '#6ee7b7';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const OC_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264'];

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
   算式字串 → canvas 元件（3-4-1 的 ocParse）
   原始字串一律用 ASCII 寫：「x(x - 8) = 105」「x^2 - 5x」「4·2·(-1)」，
   中文字可以直接混在裡面。
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
  return [SEQ(ocParse(String(s), color), color, 1)];
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
function ocBox(ctx, x, y, w, h, color, alpha, dash) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.2 : alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  if (dash) ctx.setLineDash(dash);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// 代入用：負數平方要加括號 (−3)²，負數相乘也加括號
function sqS(v) {
  return v < 0 ? `(${v})^2` : `${v}^2`;
}

function pS(v) {
  return v < 0 ? `(${v})` : String(v);
}

// 一列推導（drawStepRows 的列）
function row(name, hint, items, color) {
  return { name, hint, items, color };
}

// 近似值：四捨五入到小數第 2 位，保留尾巴的 0
function ap(v) {
  const r = Math.round(v * 100) / 100;
  return (Math.abs(r) < 0.005 ? 0 : r).toFixed(2);
}

/* --------------------------------------------------------------------------
   有理數：一律以化成最簡的 [分子, 分母] 表示，分母為正
   -------------------------------------------------------------------------- */

// texFrac 不化簡（AGENTS.md〈工作約定〉），本頁的分數一律先 reduce
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

function rTex(r) {
  return fTex(r[0], r[1]);
}

function rAbs(p) {
  return [Math.abs(p[0]), p[1]];
}

function rVal(r) {
  return r[0] / r[1];
}

// canvas 上的分數或整數（負號提到分數前面）
function rIt(r, color) {
  const [a, b] = reduce(r[0], r[1]);
  if (b === 1) return T(mn(a), color);
  if (a < 0) return SEQ([T('−', color), FR(-a, b, color)], color, 2);
  return FR(a, b, color);
}

function xIs(r, color, v) {
  return SEQ([IT(v || 'x', color), T('=', color), rIt(r, color)], color, 6);
}

/* --------------------------------------------------------------------------
   多項式字串（ASCII，同時給 ocInk 與 LaTeX 用）
   polyStr([a, b, c], 'x') → "2x^2 - 5x + 3"；係數 ±1 不寫 1，0 的項省略
   lin('x', r) → "x - r"（r 為負時寫 x + |r|，0 時只寫 x）
   -------------------------------------------------------------------------- */
function polyStr(coefs, v) {
  const deg = coefs.length - 1;
  let s = '';
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const d = deg - i;
    const a = Math.abs(c);
    const body = d === 0 ? String(a) : (a === 1 ? '' : String(a)) + v + (d === 2 ? '^2' : '');
    if (!s) s = (c < 0 ? '-' : '') + body;
    else s += (c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

function lin(v, r) {
  if (r === 0) return v;
  return r > 0 ? `${v} - ${r}` : `${v} + ${-r}`;
}

// 整數係數的 ax² + bx + c（canvas 元件）
function quadItems(a, b, c, color, v) {
  return ocInk(polyStr([a, b, c], v || 'x'), color);
}

/* --------------------------------------------------------------------------
   根式：n = k²·r（r 不含平方因數）
   -------------------------------------------------------------------------- */
function sqSplit(n) {
  let k = 1, r = n;
  for (let p = 2; p * p <= r; p++) {
    while (r % (p * p) === 0) { r /= p * p; k *= p; }
  }
  return [k, r];
}

function surdCore(Q, r, color) {
  return Q === 1 ? RT(T(r, color), color) : SEQ([T(Q, color), RT(T(r, color), color)], color, 1);
}

/* --------------------------------------------------------------------------
   ax² + bx + c = 0（整數係數）的解，一律化成最簡：
     none   無解          double 重根 r1
     rat2   兩個有理根 r1 > r2
     irr    (P ± Q√R) / Dn，Dn > 0、三者互質
   v1 ≥ v2 是近似值。
   -------------------------------------------------------------------------- */
function rootsOf(a, b, c) {
  const D = b * b - 4 * a * c;
  const res = { a, b, c, D };
  if (D < 0) { res.kind = 'none'; return res; }
  if (D === 0) {
    res.kind = 'double';
    res.r1 = res.r2 = reduce(-b, 2 * a);
    res.v1 = res.v2 = -b / (2 * a);
    return res;
  }
  const [k, r] = sqSplit(D);
  const m = -b / (2 * a), s = Math.sqrt(D) / Math.abs(2 * a);
  res.v1 = m + s; res.v2 = m - s;
  if (r === 1) {
    let r1 = reduce(-b + k, 2 * a), r2 = reduce(-b - k, 2 * a);
    if (rVal(r1) < rVal(r2)) { const t = r1; r1 = r2; r2 = t; }
    res.kind = 'rat2'; res.r1 = r1; res.r2 = r2;
    return res;
  }
  let P = -b, Q = k, Dn = 2 * a;
  const g = gcd(gcd(P, Q), Dn);
  P /= g; Q /= g; Dn /= g;
  if (Dn < 0) { P = -P; Dn = -Dn; }
  Object.assign(res, { kind: 'irr', P, Q, R: r, Dn });
  return res;
}

function pmNumTex(P, Q, R) {
  const s = `${Q === 1 ? '' : Q}\\sqrt{${R}}`;
  return P === 0 ? `\\pm ${s}` : `${P} \\pm ${s}`;
}

function pmTex(P, Q, R, Dn) {
  if (Dn === 1) return pmNumTex(P, Q, R);
  if (P === 0) return `\\pm \\frac{${Q === 1 ? '' : Q}\\sqrt{${R}}}{${Dn}}`;
  return `\\frac{${pmNumTex(P, Q, R)}}{${Dn}}`;
}

function pmNumItem(P, Q, R, color) {
  const parts = [];
  if (P !== 0) parts.push(T(mn(P), color));
  parts.push(T('±', color));
  parts.push(surdCore(Q, R, color));
  return SEQ(parts, color, 5);
}

function pmItem(P, Q, R, Dn, color) {
  if (Dn === 1) return pmNumItem(P, Q, R, color);
  if (P === 0) return SEQ([T('±', color), VF(surdCore(Q, R, color), T(Dn, color), color)], color, 4);
  return VF(pmNumItem(P, Q, R, color), T(Dn, color), color);
}

// 「x = …」的 HTML（給數值列）
function rootsHtml(res, v) {
  const x = v || 'x';
  if (res.kind === 'none') return '無解';
  if (res.kind === 'double') return `\\(${x} = ${rTex(res.r1)}\\)（重根）`;
  if (res.kind === 'rat2') return `\\(${x} = ${rTex(res.r1)}\\) 或 \\(${x} = ${rTex(res.r2)}\\)`;
  return `\\(${x} = ${pmTex(res.P, res.Q, res.R, res.Dn)}\\)`;
}

function rootsItems(res, color, v) {
  const x = v || 'x';
  if (res.kind === 'none') return [T('無解', color || OC_ROSE)];
  if (res.kind === 'double') return [xIs(res.r1, color, x), T('（重根）', color)];
  if (res.kind === 'rat2') return [xIs(res.r1, color, x), T('或', MUTED), xIs(res.r2, color, x)];
  return [IT(x, color), T('=', color), pmItem(res.P, res.Q, res.R, res.Dn, color)];
}

// 每個根的 { exact(有理數或 null), v(近似值), item(canvas), tex }
function rootList(res, v) {
  const x = v || 'x';
  if (res.kind === 'none') return [];
  if (res.kind === 'double' || res.kind === 'rat2') {
    const rs = res.kind === 'double' ? [res.r1] : [res.r1, res.r2];
    return rs.map(r => ({ exact: r, v: rVal(r), tex: rTex(r) }));
  }
  const s = `${res.Q === 1 ? '' : res.Q}\\sqrt{${res.R}}`;
  const one = (sign) => {
    const num = res.P === 0 ? `${sign === '-' ? '-' : ''}${s}` : `${res.P} ${sign} ${s}`;
    return res.Dn === 1 ? num : `\\frac{${num}}{${res.Dn}}`;
  };
  return [
    { exact: null, v: res.v1, tex: one('+'), x },
    { exact: null, v: res.v2, tex: one('-'), x }
  ];
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示
   -------------------------------------------------------------------------- */
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

// 長條圖：values 從左到右，bottom 是底線的 y；colorOf(i) 決定每一條的顏色
function ocBars(ctx, x0, bottom, w, h, values, maxV, colorOf) {
  const n = values.length;
  const bw = w / n;
  values.forEach((v, i) => {
    const hh = Math.max(0, v) / maxV * h;
    ctx.save();
    ctx.fillStyle = colorOf(i);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x0 + i * bw + bw * 0.15, bottom - hh, bw * 0.7, hh);
    ctx.restore();
  });
  ocLine(ctx, x0, bottom, x0 + w, bottom, INK, 1.5);
  return bw;
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 4-3 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '4-3-1': 'B',    // (x + 4)(x − 4) = 240 → 16 歲
    '4-3-2': 'D',    // x(x + 6) = 432 → 18 歲
    '4-3-3': 'A',    // 和 47、積 540 → 較大的數 27
    '4-3-4': 'C',    // 三個連續正偶數平方和 200 → 最大 10
    '4-3-5': 'D',    // x(x − 1) = 132 → 每盒 12 顆，共 12 × 14 = 168 顆
    '4-3-6': 'B',    // x(x + 4) = 252 → 生日 14 號，開放日 18 號
    '4-3-7': 'C',    // x(x − 15) = 2700 → 單價 60 元
    '4-3-8': 'A',    // x(x − 9) = 2000 − 380 → 單價 45 元，買 36 個
    '4-3-9': 'B',    // (50 − 2x)(30 − 2x) = 1056 → 3 公尺
    '4-3-10': 'D',   // 2(x − 4)(x − 8) = x(x − 4) → 長 16、寬 12
    '4-3-11': 'A',   // (40 − x)(25 − x) = 814 → 3 公尺
    '4-3-12': 'C',   // 十字走道面積：35x + 22x − x² = 110
    '4-3-13': 'C',   // (x + 1)² = x² + (x − 17)² → 24 公分
    '4-3-14': 'B',   // x² + (x + 31)² = 41² → 兩股 9、40，面積 180
    '4-3-15': 'D',   // (24 + x)(500 − 10x) = 13200，上限 40 人 → 30 人
    '4-3-16': 'A',   // (120 + 10x)(60 − 3x) = 7560，罐數多一點 → 140 元
    '4-3-17': 'C',   // (x + 4)(3x − 5) = 400 → 解不是整數，無解
    '4-3-18': 'B',   // (x + 4)(x − 6) = x²/2 → 2 + 2√13 公分
    '4-3-19': 'A',   // 2x² = 5x − 4 → 判別式 −7，無解
    '4-3-20': 'D'    // 300 元賣 40 盒、每漲 20 元少 1 盒 → 16000 元達不到
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
   重點 1：四個步驟——今年年齡 × d 年前的年齡 = 幸運數字
   ========================================================================== */
function initStepsCanvas() {
  const cv = elById('canvas-steps');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('st-n'), sd = elById('st-d');
  const vn = elById('st-vn'), vd = elById('st-vd');
  const out = elById('st-formula');
  const fb = elById('st-feedback');
  const C = OC_TONE[0];
  const state = { step: 1 };
  let nRows = 1;

  function draw() {
    const n = iv(sn), d = iv(sd);
    vn.textContent = n; vd.textContent = d;
    const P = n * (n - d);
    const neg = d - n;
    const W = cv.width;

    const rows = [
      row('1 設未知數', '今年 x 歲', ocInk(`今年 x 歲，${d} 年前 (x - ${d}) 歲`)),
      row('2 列方程式', '今年 × d 年前 = 幸運數字', ocInk(`x(x - ${d}) = ${P}`)),
      row('3 解方程式', '展開、移項', ocInk(`${polyStr([1, -d, -P], 'x')} = 0`)),
      row('', '因式分解', ocInk(`(${lin('x', n)})(${lin('x', neg)}) = 0`)),
      row('', '兩個解都滿足方程式', [xIs([n, 1]), T('或', MUTED), xIs([neg, 1])]),
      row('4 檢查', '年齡不能是負數', [xIs([neg, 1], OC_ROSE), T('不合，捨去', OC_ROSE)], OC_ROSE),
      row('答', '', ocInk(`今年 ${n} 歲`, OC_JADE), OC_JADE)
    ];
    nRows = rows.length;
    state.step = clamp(state.step, 1, nRows);
    syncSteps('st', state.step, nRows);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `今年年齡 × ${d} 年前的年齡 = 幸運數字 ${P}`, C);
    drawStepRows(ctx, rows, state.step, { top: 70, gap: 50, eqX: 172, color: C, size: 20 });

    // 時間軸：d 年前 → 今年（答案揭曉前，年齡只寫 x）
    const y = 462, xa = 110, xb = 430;
    const done = state.step >= nRows;
    ocLine(ctx, 50, y, 490, y, INK, 2);
    ocLine(ctx, xa, y - 10, xa, y + 10, OC_SKY, 3);
    ocLine(ctx, xb, y - 10, xb, y + 10, OC_ORANGE, 3);
    textCenter(ctx, `${d} 年前`, xa, y - 26, OC_SKY, f(800, 15));
    textCenter(ctx, '今年', xb, y - 26, OC_ORANGE, f(800, 15));
    textCenter(ctx, done ? `${n - d} 歲` : `x − ${d} 歲`, xa, y + 26, OC_SKY, f(800, 16));
    textCenter(ctx, done ? `${n} 歲` : 'x 歲', xb, y + 26, OC_ORANGE, f(800, 16));
    textCenter(ctx, `相隔 ${d} 年`, (xa + xb) / 2, y - 14, MUTED, f(700, 13));
    if (done) {
      textCenter(ctx, `${n - d} × ${n} = ${P} ✓`, W / 2, y + 56, OC_JADE, f(800, 16));
    } else {
      textCenter(ctx, '按「下一步」走完四個步驟', W / 2, y + 56, DIM, f(700, 14));
    }

    out.innerHTML = `${wbrEq(`x(x - ${d}) = ${P}`)}，\\(x = ${n}\\)（\\(x = ${neg}\\) 不合）`;
    fb.innerHTML = wrapFeedback(state.step >= 6
      ? `\\(x = ${neg}\\) 代回方程式也成立：\\((${neg}) \\times (${neg - d}) = ${P}\\)。它不是算錯，而是<b>不合情境</b>——年齡不可能是負數，所以第 4 步要把它捨去。`
      : `第 1 步設未知數、第 2 步把「相乘等於 \\(${P}\\)」翻成方程式、第 3 步解方程式，最後一步別忘了<b>檢查</b>每個解合不合理。`);
    typeset([out, fb]);
  }

  [sn, sd].forEach(s => s.addEventListener('input', draw));
  bindSteps('st', () => nRows, state, draw);
  draw();
}

/* ==========================================================================
   重點 2：數字問題——和是 S、積是 P，另一數寫成 S − x
   ========================================================================== */
function initSumCanvas() {
  const cv = elById('canvas-sum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('su-big'), ss = elById('su-small');
  const vb = elById('su-vbig'), vs = elById('su-vsmall');
  const g = elById('su-mode-group');
  const out = elById('su-formula');
  const fb = elById('su-feedback');
  const C = OC_TONE[1];
  let mode = 'eq';

  // 小翊的號碼一定比小妍大
  sb.addEventListener('input', () => { if (iv(ss) >= iv(sb)) ss.value = iv(sb) - 1; });
  ss.addEventListener('input', () => { if (iv(ss) >= iv(sb)) ss.value = iv(sb) - 1; });

  function card(x, y, w, h, who, val, color) {
    ocBox(ctx, x, y, w, h, color, 0.14);
    textCenter(ctx, who, x + w / 2, y + 20, color, f(800, 15));
    textCenter(ctx, String(val), x + w / 2, y + h / 2 + 12, OC_CREAM, f(900, 30));
  }

  function draw() {
    const a = iv(sb), b = iv(ss);
    vb.textContent = a; vs.textContent = b;
    const S = a + b, P = a * b;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);

    if (mode === 'eq') {
      drawTitle(ctx, `兩個號碼的和是 ${S}、積是 ${P}，小翊的比較大`, C);
      const rows = [
        row('設', '小翊的號碼是 x', ocInk(`小翊 x，小妍 ${S} - x`)),
        row('列', '兩個號碼相乘', ocInk(`x(${S} - x) = ${P}`)),
        row('整理', '移項，讓 x² 的係數是正的', ocInk(`${polyStr([1, -S, P], 'x')} = 0`)),
        row('分解', '', ocInk(`(${lin('x', a)})(${lin('x', b)}) = 0`)),
        row('解', '兩個根剛好是兩個號碼', [xIs([a, 1]), T('或', MUTED), xIs([b, 1])]),
        row('檢查', `x = ${b} 時小妍是 ${a}`, [xIs([b, 1], OC_ROSE), T('不合（小翊反而比較小）', OC_ROSE)], OC_ROSE),
        row('答', '', ocInk(`小翊 ${a}，小妍 ${b}`, OC_JADE), OC_JADE)
      ];
      drawStepRows(ctx, rows, rows.length, { top: 68, gap: 46, eqX: 172, color: C, size: 20 });
    } else {
      drawTitle(ctx, `列舉法：和固定是 ${S}，找乘積 ${P} 的那一組`, C);
      const start = Math.floor(S / 2) + 1;
      const first = Math.max(start, a - 5);
      const last = Math.min(S - 1, first + 6);
      const cols = [110, 220, 340, 450];
      const y0 = 70;
      ['小翊', '小妍', '乘積', `= ${P}？`].forEach((h, i) => textCenter(ctx, h, cols[i], y0, MUTED, f(800, 15)));
      ocLine(ctx, 50, y0 + 16, 490, y0 + 16, DIM, 1.5);
      for (let L = first; L <= last; L++) {
        const yy = y0 + 42 + (L - first) * 40;
        const hit = L * (S - L) === P;
        if (hit) drawPanel(ctx, 40, yy - 17, 460, 34, OC_JADE, 0.14);
        const col = hit ? OC_JADE : INK;
        textCenter(ctx, String(L), cols[0], yy, col, f(800, 18));
        textCenter(ctx, String(S - L), cols[1], yy, col, f(800, 18));
        textCenter(ctx, `${L} × ${S - L} = ${L * (S - L)}`, cols[2], yy, col, f(700, 16));
        textCenter(ctx, hit ? '符合 ✓' : (L * (S - L) > P ? '太大' : '太小'), cols[3], yy, hit ? OC_JADE : MUTED, f(800, 15));
      }
      textCenter(ctx, '兩數越接近，乘積越大；往下列，乘積越來越小', W / 2, 380, DIM, f(700, 13));
    }

    card(70, 410, 180, 96, '小翊（比較大）', a, OC_ORANGE);
    card(290, 410, 180, 96, '小妍', b, OC_SKY);

    out.innerHTML = mode === 'eq'
      ? `${wbrEq(`x(${S} - x) = ${P}`)}，\\(x = ${a}\\) 或 \\(x = ${b}\\)`
      : `\\(${a} + ${b} = ${S}\\)，\\(${a} \\times ${b} = ${P}\\)`;
    fb.innerHTML = wrapFeedback(mode === 'eq'
      ? `兩個根 \\(${a}\\)、\\(${b}\\) 剛好就是兩個號碼。設 \\(x\\) 是較小的那個，列出來的方程式一模一樣；差別只在第 4 步要留下哪一個根——題目說小翊比較大，所以 \\(x = ${a}\\)。`
      : `和固定是 \\(${S}\\)，從最接近的兩數往下列，列到 \\(${a} \\times ${b} = ${P}\\) 就找到了，和列方程式解出來的一樣。數字一大，列舉就要列很多行，這時方程式比較快。`);
    typeset([out, fb]);
  }

  [sb, ss].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-su-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 3：解出 x 之後——題目問的不一定是 x（雞蛋分裝）
   ========================================================================== */
function initEggCanvas() {
  const cv = elById('canvas-egg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('eg-n'), sk = elById('eg-k');
  const vn = elById('eg-vn'), vk = elById('eg-vk');
  const g = elById('eg-ask-group');
  const out = elById('eg-formula');
  const fb = elById('eg-feedback');
  const C = OC_TONE[2];
  let ask = 'total';

  function draw() {
    const n = iv(sn), k = iv(sk);
    vn.textContent = n; vk.textContent = k;
    const R = n * (n - k);
    const neg = k - n;
    const kx = polyStr([1, -k, 0], 'x');
    const W = cv.width;

    let ansItems, ansHint, ansTex;
    if (ask === 'x') {
      ansItems = ocInk(`每盒 x = ${n} 顆`, OC_JADE); ansHint = '問的就是 x'; ansTex = `每盒 \\(${n}\\) 顆`;
    } else if (ask === 'total') {
      ansItems = ocInk(`買進 x^2 = ${n}^2 = ${n * n} 顆`, OC_JADE); ansHint = '共 x 盒、每盒 x 顆'; ansTex = `買進 \\(x^2 = ${n * n}\\) 顆`;
    } else {
      ansItems = ocInk(`還剩 x - ${k} = ${n - k} 盒`, OC_JADE); ansHint = `x 盒賣掉 ${k} 盒`; ansTex = `還剩 \\(x - ${k} = ${n - k}\\) 盒`;
    }
    const askName = { x: '每盒幾顆？', total: '一共買進幾顆？', left: '還剩幾盒？' }[ask];

    const rows = [
      row('設', '盒數 = 每盒顆數', ocInk('每盒 x 顆，共 x 盒')),
      row('列', `賣掉 ${k} 盒，剩 ${R} 顆`, ocInk(`${kx} = ${R}`)),
      row('分解', '移項後因式分解', ocInk(`(${lin('x', n)})(${lin('x', neg)}) = 0`)),
      row('解', '顆數不能是負數', [xIs([n, 1]), T('或', MUTED), xIs([neg, 1], OC_ROSE), T('不合', OC_ROSE)]),
      row('答', ansHint, ansItems, OC_JADE)
    ];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `題目問：${askName}`, C);
    drawStepRows(ctx, rows, rows.length, { top: 66, gap: 46, eqX: 160, color: C, size: 20 });

    // 雞蛋盒：n 盒、每盒 n 顆；前 k 盒是賣掉的
    const top = 300, areaH = 220, areaW = 380;
    const cell = Math.min(areaH / n, areaW / n, 26);
    const gx = (W - cell * n) / 2 + 40;
    for (let i = 0; i < n; i++) {
      const yy = top + i * cell;
      const sold = i < k;
      const hl = ask === 'total' || (ask === 'left' && !sold) || (ask === 'x' && i === k);
      ctx.save();
      ctx.globalAlpha = sold ? 0.3 : 1;
      ctx.strokeStyle = sold ? DIM : (hl ? OC_JADE : OC_ORANGE);
      ctx.lineWidth = hl ? 2 : 1.2;
      roundRect(ctx, gx - 2, yy + 1, cell * n + 4, cell - 2, 5);
      ctx.stroke();
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = sold ? DIM : OC_CREAM;
        ctx.beginPath();
        ctx.ellipse(gx + j * cell + cell / 2, yy + cell / 2, cell * 0.3, cell * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (i === 0) textLeft(ctx, `賣掉 ${k} 盒`, 22, top + k * cell / 2, MUTED, f(700, 13));
    }
    textLeft(ctx, `剩 ${n - k} 盒`, 22, top + (k + n) * cell / 2, OC_ORANGE, f(700, 13));
    textCenter(ctx, `每盒 ${n} 顆`, gx + cell * n / 2, top - 14, OC_CREAM, f(700, 13));

    out.innerHTML = `${wbrEq(`${kx} = ${R}`)}，\\(x = ${n}\\)，${ansTex}`;
    fb.innerHTML = wrapFeedback(ask === 'x'
      ? `題目問的「每盒幾顆」就是設的 \\(x\\)，答 \\(${n}\\) 顆即可。換成問「買進幾顆」「還剩幾盒」，同一個 \\(x\\) 還要再算一步。`
      : (ask === 'total'
        ? `解出 \\(x = ${n}\\) 只是每盒的顆數。題目問一共買進幾顆，要再算 \\(x^2 = ${n * n}\\)；直接寫 \\(${n}\\) 就答錯了。`
        : `盒數是 \\(x\\)，賣掉 \\(${k}\\) 盒，還剩 \\(x - ${k} = ${n - k}\\) 盒。可以驗算：\\(${n - k} \\times ${n} = ${R}\\) 顆。`));
    typeset([out, fb]);
  }

  [sn, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-eg-ask', v => { ask = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：價格問題——單價 × 數量 = 總價
   ========================================================================== */
function initPriceCanvas() {
  const cv = elById('canvas-price');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('pr-p'), sm = elById('pr-m'), sk = elById('pr-k');
  const vp = elById('pr-vp'), vm = elById('pr-vm'), vk = elById('pr-vk');
  const g = elById('pr-mode-group');
  const out = elById('pr-formula');
  const fb = elById('pr-feedback');
  const C = OC_TONE[3];
  let mode = 'total';

  function draw() {
    const p = iv(sp), m = iv(sm), k = iv(sk);
    vp.textContent = p; vm.textContent = m; vk.textContent = k;
    const q = m * p - k;
    const T0 = p * q;
    const X = (Math.floor(T0 / 500) + 1) * 500, Y = X - T0;
    const negR = reduce(-q, m);
    const qx = polyStr([m, -k], 'x');
    const W = cv.width;

    const rows = [
      row('設', `數量是單價的 ${m} 倍少 ${k}`, ocInk(`單價 x 元，數量 (${qx}) 個`))
    ];
    if (mode === 'change') {
      rows.push(row('列', '付的錢 − 找回的錢', ocInk(`x(${qx}) = ${X} - ${Y}`)));
      rows.push(row('算實付', '真正花掉的錢', ocInk(`x(${qx}) = ${T0}`)));
    } else {
      rows.push(row('列', '單價 × 數量 = 收入', ocInk(`x(${qx}) = ${T0}`)));
    }
    rows.push(row('整理', '展開、移項', ocInk(`${polyStr([m, -k, -T0], 'x')} = 0`)));
    rows.push(row('分解', '', ocInk(`(${lin('x', p)})(${polyStr([m, q], 'x')}) = 0`)));
    rows.push(row('解', '', [xIs([p, 1]), T('或', MUTED), xIs(negR)]));
    rows.push(row('檢查', '價格不能是負數', [xIs(negR, OC_ROSE), T('不合', OC_ROSE)], OC_ROSE));
    rows.push(row('答', '', ocInk(`單價 ${p} 元，數量 ${q} 個`, OC_JADE), OC_JADE));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'change' ? `付 ${X} 元、找回 ${Y} 元` : `收入 ${T0} 元`, C);
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 43, eqX: 160, color: C, size: 19 });

    // 收入 = 長方形面積：寬是數量、高是單價
    const top = 420, maxW = 400, maxH = 100;
    const bw = q / 118 * maxW, bh = p / 40 * maxH;
    const x0 = 100;
    ocBox(ctx, x0, top + maxH - bh, bw, bh, OC_ORANGE, 0.25);
    textCenter(ctx, `${T0} 元`, x0 + bw / 2, top + maxH - bh / 2, OC_CREAM, f(800, bw > 90 ? 16 : 13));
    textCenter(ctx, `數量 ${q} 個`, x0 + bw / 2, top + maxH + 18, OC_SKY, f(800, 14));
    ctx.save();
    ctx.translate(x0 - 18, top + maxH - bh / 2);
    ctx.rotate(-Math.PI / 2);
    textCenter(ctx, `單價 ${p} 元`, 0, 0, OC_ORANGE, f(800, 13));
    ctx.restore();
    textLeft(ctx, '收入 = 單價 × 數量', x0 + bw + 16, top + maxH - 12, MUTED, f(700, 13));

    out.innerHTML = `${wbrEq(`x(${qx}) = ${T0}`)}，\\(x = ${p}\\)，數量 \\(${q}\\) 個`;
    fb.innerHTML = wrapFeedback((mode === 'change'
      ? `付 \\(${X}\\) 元找回 \\(${Y}\\) 元，真正花掉的是 \\(${X} - ${Y} = ${T0}\\) 元，等號右邊要寫這個數。`
      : `收入就是「單價 × 數量」：設單價 \\(x\\)，數量就寫成 \\(${qx}\\)，兩個因子都用 \\(x\\) 表示。`)
      + ` 另一個根 \\(x = ${rTex(negR)}\\) 是負的價格，不合。`);
    typeset([out, fb]);
  }

  [sp, sm, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-pr-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：面積——內部四周留等寬的走道
   ========================================================================== */
function initBorderCanvas() {
  const cv = elById('canvas-border');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sL = elById('bd-L'), sW = elById('bd-W'), sw = elById('bd-w');
  const vL = elById('bd-vL'), vW = elById('bd-vW'), vw = elById('bd-vw');
  const out = elById('bd-formula');
  const fb = elById('bd-feedback');
  const C = OC_TONE[4];

  // 走道不能把寬佔滿：2w < W
  function fix() {
    const maxw = Math.floor((iv(sW) - 1) / 2);
    if (iv(sw) > maxw) sw.value = maxw;
  }
  [sW, sw].forEach(s => s.addEventListener('input', fix));

  function draw() {
    const L = iv(sL), Wd = iv(sW), w = iv(sw);
    vL.textContent = L; vW.textContent = Wd; vw.textContent = w;
    const A = (L - 2 * w) * (Wd - 2 * w);
    const a4 = 4, b4 = -2 * (L + Wd), c4 = L * Wd - A;
    const gg = gcd(gcd(a4, b4), c4);
    const res = rootsOf(a4 / gg, b4 / gg, c4 / gg);
    const big = reduce(L + Wd - 2 * w, 2);
    const W = cv.width;

    const rows = [
      row('設', '走道寬 x 公尺', ocInk(`曬果區長 (${L} - 2x)、寬 (${Wd} - 2x)`)),
      row('列', '長 × 寬 = 曬果區面積', ocInk(`(${L} - 2x)(${Wd} - 2x) = ${A}`)),
      row('整理', '展開、移項', ocInk(`${polyStr([a4, b4, c4], 'x')} = 0`))
    ];
    if (gg > 1) rows.push(row(`同除以 ${gg}`, '', ocInk(`${polyStr([a4 / gg, b4 / gg, c4 / gg], 'x')} = 0`)));
    rows.push(row('解', '', rootsItems(res)));
    rows.push(row('檢查', `寬 ${Wd} − 2x 變成 ${Wd - (L + Wd - 2 * w)}`, [xIs(big, OC_ROSE), T('不合', OC_ROSE)], OC_ROSE));
    rows.push(row('答', '', ocInk(`走道寬 ${w} 公尺`, OC_JADE), OC_JADE));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `長 ${L}、寬 ${Wd}，四周走道，曬果區 ${A} 平方公尺`, C);
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 42, eqX: 160, color: C, size: 19 });

    // 圖：外框是整塊地，內框是曬果區；標示一律畫在外側（開發約束 18）
    const s = Math.min(360 / L, 170 / Wd);
    const fw = L * s, fh = Wd * s;
    const x0 = (W - fw) / 2 + 10, y0 = 372;
    ocBox(ctx, x0, y0, fw, fh, OC_ORANGE, 0.22);
    ocBox(ctx, x0 + w * s, y0 + w * s, fw - 2 * w * s, fh - 2 * w * s, OC_LEAF, 0.3);
    textCenter(ctx, `${L}`, x0 + fw / 2, y0 - 12, OC_ORANGE, f(800, 14));
    textCenter(ctx, `${Wd}`, x0 - 16, y0 + fh / 2, OC_ORANGE, f(800, 14));
    textCenter(ctx, `${L} − 2x`, x0 + fw / 2, y0 + fh / 2 - 10, OC_LEAF, f(800, 14));
    textCenter(ctx, `${Wd} − 2x`, x0 + fw / 2, y0 + fh / 2 + 12, OC_LEAF, f(800, 14));
    textCenter(ctx, '橘色：寬 x 的走道', x0 + fw / 2, y0 + fh + 16, MUTED, f(700, 12));

    out.innerHTML = `${wbrEq(`(${L} - 2x)(${Wd} - 2x) = ${A}`)}，\\(x = ${w}\\)`;
    fb.innerHTML = wrapFeedback(`走道佔掉左右兩邊、上下兩邊，所以長和寬都<b>各少 \\(2x\\)</b>。另一個根 \\(x = ${rTex(big)}\\) 代進去，寬 \\(${Wd} - 2x = ${Wd - (L + Wd - 2 * w)}\\) 是負數，不合。`);
    typeset([out, fb]);
  }

  [sL, sW, sw].forEach(s => s.addEventListener('input', draw));
  fix();
  draw();
}

/* ==========================================================================
   重點 6：十字走道——平移到邊上，剩下的拼成 (L − x)(W − x)
   ========================================================================== */
function initCrossCanvas() {
  const cv = elById('canvas-cross');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sL = elById('cr-L'), sW = elById('cr-W'), sw = elById('cr-w');
  const vL = elById('cr-vL'), vW = elById('cr-vW'), vw = elById('cr-vw');
  const g = elById('cr-view-group');
  const out = elById('cr-formula');
  const fb = elById('cr-feedback');
  const C = OC_TONE[5];
  let view = 'orig';

  function draw() {
    const L = iv(sL), Wd = iv(sW), w = iv(sw);
    vL.textContent = L; vW.textContent = Wd; vw.textContent = w;
    const A = (L - w) * (Wd - w);
    const path = L * w + Wd * w - w * w;
    const big = L + Wd - w;
    const W = cv.width;

    const rows = [
      row('平移', '走道推到邊上', ocInk(`果樹區拼成長 (${L} - x)、寬 (${Wd} - x)`)),
      row('列', '長 × 寬 = 果樹區面積', ocInk(`(${L} - x)(${Wd} - x) = ${A}`)),
      row('整理', '展開、移項', ocInk(`${polyStr([1, -(L + Wd), L * Wd - A], 'x')} = 0`)),
      row('分解', '', ocInk(`(${lin('x', w)})(${lin('x', big)}) = 0`)),
      row('解', '', [xIs([w, 1]), T('或', MUTED), xIs([big, 1])]),
      row('檢查', `走道比寬 ${Wd} 還寬`, [xIs([big, 1], OC_ROSE), T('不合', OC_ROSE)], OC_ROSE),
      row('答', '', ocInk(`走道寬 ${w} 公尺`, OC_JADE), OC_JADE)
    ];
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `長 ${L}、寬 ${Wd}，十字走道，果樹區 ${A} 平方公尺`, C);
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 41, eqX: 160, color: C, size: 19 });

    const s = Math.min(380 / L, 170 / Wd);
    const fw = L * s, fh = Wd * s, ws = w * s;
    const x0 = (W - fw) / 2 + 10, y0 = 366;
    ocBox(ctx, x0, y0, fw, fh, OC_ORANGE, 0.22);
    if (view === 'orig') {
      const vx = x0 + Math.round(L * 0.42) * s, hy = y0 + Math.round(Wd * 0.55) * s;
      // 四塊果樹區
      [[x0, y0, vx - x0, hy - y0], [vx + ws, y0, x0 + fw - vx - ws, hy - y0],
       [x0, hy + ws, vx - x0, y0 + fh - hy - ws], [vx + ws, hy + ws, x0 + fw - vx - ws, y0 + fh - hy - ws]]
        .forEach(r => ocBox(ctx, r[0], r[1], r[2], r[3], OC_LEAF, 0.3));
      ocBox(ctx, vx, hy, ws, ws, OC_ROSE, 0.6);
      textCenter(ctx, '紅色：重疊的 x²', x0 + fw / 2, y0 + fh + 16, OC_ROSE, f(800, 12));
    } else {
      ocBox(ctx, x0, y0, fw - ws, fh - ws, OC_LEAF, 0.3);
      textCenter(ctx, `${L} − x`, x0 + (fw - ws) / 2, y0 + (fh - ws) / 2 - 10, OC_LEAF, f(800, 14));
      textCenter(ctx, `${Wd} − x`, x0 + (fw - ws) / 2, y0 + (fh - ws) / 2 + 12, OC_LEAF, f(800, 14));
    }
    textCenter(ctx, `${L}`, x0 + fw / 2, y0 - 12, OC_ORANGE, f(800, 14));
    textCenter(ctx, `${Wd}`, x0 - 16, y0 + fh / 2, OC_ORANGE, f(800, 14));

    out.innerHTML = `${wbrEq(`(${L} - x)(${Wd} - x) = ${A}`)}，\\(x = ${w}\\)`;
    fb.innerHTML = wrapFeedback(view === 'orig'
      ? `直接算走道面積是 \\(${L}x + ${Wd}x - x^2\\)：中間那塊小正方形被直的、橫的走道各算一次，要扣掉一次。\\(x = ${w}\\) 時走道面積 \\(${path}\\) 平方公尺。`
      : `把走道推到邊上，四塊果樹區剛好拼成長 \\(${L} - x\\)、寬 \\(${Wd} - x\\) 的長方形——十字走道只扣<b>一次</b> \\(x\\)，跟四周走道扣兩次不一樣。`);
    typeset([out, fb]);
  }

  [sL, sW, sw].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-cr-view', v => { view = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：畢氏定理列式——斜邊² = 股² + 股²，三邊都要是正的
   ========================================================================== */
function initPythCanvas() {
  const cv = elById('canvas-pyth');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('py-p'), sq = elById('py-q'), sr = elById('py-r');
  const vp = elById('py-vp'), vq = elById('py-vq'), vr = elById('py-vr');
  const out = elById('py-formula');
  const fb = elById('py-feedback');
  const C = OC_TONE[6];

  const side = s => lin('x', -s);            // x + s
  const wrap = s => (s === 0 ? 'x' : `(${side(s)})`);
  const sqStr = s => (s === 0 ? 'x^2' : `(${side(s)})^2`);

  function draw() {
    const p = iv(sp), q = iv(sq), r = iv(sr);
    vp.textContent = p; vq.textContent = q; vr.textContent = r;
    const B = 2 * (p + q - r), Cc = p * p + q * q - r * r;
    const res = rootsOf(1, B, Cc);
    const list = rootList(res);
    const W = cv.width;

    const verdicts = list.map(o => {
      const sides = [o.v + p, o.v + q, o.v + r];
      const ok = sides.every(t => t > 1e-9);
      return { o, ok, sides };
    });
    const good = verdicts.filter(v => v.ok);

    const rows = [
      row('設', '原本的長度 x', ocInk(`兩股 ${wrap(p)}、${wrap(q)}，斜邊 ${wrap(r)}`)),
      row('列', '斜邊² = 股² + 股²', ocInk(`${sqStr(r)} = ${sqStr(p)} + ${sqStr(q)}`)),
      row('整理', '展開、移項', ocInk(`${polyStr([1, B, Cc], 'x')} = 0`)),
      row('解', res.kind === 'none' ? '判別式小於 0' : '', rootsItems(res))
    ];
    verdicts.forEach(v => {
      const label = v.o.exact ? `x = ${mn(fracText(v.o.exact))}` : `x ≈ ${mn(ap(v.o.v))}`;
      const sidesTxt = v.o.exact ? v.sides.map(t => mn(numText(t))).join('、') : v.sides.map(t => mn(ap(t))).join('、');
      rows.push(row(`檢查 ${label}`, v.ok ? '三邊都是正數' : '有一邊 ≤ 0', [T(`三邊 ${sidesTxt}`, v.ok ? OC_JADE : OC_ROSE), T(v.ok ? '合理' : '不合', v.ok ? OC_JADE : OC_ROSE)], v.ok ? OC_JADE : OC_ROSE));
    });
    rows.push(row('答', '', [T(good.length ? (good.length === 2 ? '兩個解都合理' : `原本的長度 x = ${good[0].o.exact ? mn(numText(good[0].o.v)) : '≈ ' + ap(good[0].o.v)}`) : '沒有合理的三角形：此題無解', good.length ? OC_JADE : OC_ROSE)], good.length ? OC_JADE : OC_ROSE));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '三邊都用 x 表示，用畢氏定理列方程式', C);
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 43, eqX: 172, color: C, size: 19 });

    // 畫出合理的那個直角三角形（取第一個合理的解），邊長標在外側
    const yb = 560, xl = 150;
    if (good.length) {
      const [a, b, c] = good[0].sides;     // a、b 是兩股，c 是斜邊
      const sc = Math.min(260 / b, 150 / a);
      const pa = a * sc, pb = b * sc;
      ctx.save();
      ctx.fillStyle = 'rgba(253, 186, 116, 0.18)';
      ctx.strokeStyle = OC_ORANGE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(xl, yb);
      ctx.lineTo(xl + pb, yb);
      ctx.lineTo(xl, yb - pa);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeRect(xl, yb - 12, 12, 12);
      ctx.restore();
      const lab = t => (good[0].o.exact ? mn(numText(t)) : '≈ ' + ap(t));
      textCenter(ctx, lab(b), xl + pb / 2, yb + 16, OC_ORANGE, f(800, 14));
      textCenter(ctx, lab(a), xl - 26, yb - pa / 2, OC_ORANGE, f(800, 14));
      textLeft(ctx, `斜邊 ${lab(c)}`, xl + pb / 2 + 14, yb - pa / 2 - 8, OC_CREAM, f(800, 14));
    } else {
      textCenter(ctx, '找不到三邊都是正數的直角三角形', W / 2, yb - 60, OC_ROSE, f(800, 16));
    }

    const verdictTex = verdicts.map(v => `\\(x = ${v.o.tex}\\) ${v.ok ? '合理' : '不合'}`).join('，');
    out.innerHTML = `${wbrEq(`${sqStr(r)} = ${sqStr(p)} + ${sqStr(q)}`)}，${res.kind === 'none' ? '無解' : verdictTex}`;
    let note;
    if (res.kind === 'none') note = '整理後判別式小於 0，方程式無解，這樣的三角形不存在。';
    else if (!good.length) note = '方程式有解，但代回去總有一邊是 0 或負數，不能圍成三角形，所以此題無解。';
    else if (verdicts.length === 2 && good.length === 1) note = `兩個根都滿足方程式，但要代回去看<b>三邊</b>：其中一個根讓某一邊變成 0 或負數，要捨去。捨去的理由是「導出的邊長」，不是 \\(x\\) 本身是負數。`;
    else note = '每個根都要代回去，確定三邊都是正數，才算合理。';
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  [sp, sq, sr].forEach(s => s.addEventListener('input', draw));
  draw();
}

// 有理數的近似：整數印整數，否則印到小數第 2 位
function numText(v) {
  return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : ap(v);
}

// canvas 小字裡的有理數：整數或「a/b」
function fracText(r) {
  const [a, b] = reduce(r[0], r[1]);
  return b === 1 ? String(a) : `${a}/${b}`;
}

/* ==========================================================================
   重點 8：收費問題——每多 1 人，每人便宜 d 元
   ========================================================================== */
function initGroupCanvas() {
  const cv = elById('canvas-group');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sN = elById('gp-n0'), sP = elById('gp-p0'), sD = elById('gp-d'), sX = elById('gp-x0'), sC = elById('gp-cap');
  const vN = elById('gp-vn0'), vP = elById('gp-vp0'), vD = elById('gp-vd'), vX = elById('gp-vx0'), vC = elById('gp-vcap');
  const out = elById('gp-formula');
  const fb = elById('gp-feedback');
  const C = OC_TONE[7];

  function draw() {
    const n0 = iv(sN), p0 = iv(sP), d = iv(sD), x0 = iv(sX), cap = iv(sC);
    vN.textContent = n0; vP.textContent = p0; vD.textContent = d; vX.textContent = x0; vC.textContent = cap;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `原訂 ${n0} 人、每人 ${p0} 元；每多 1 人，每人便宜 ${d} 元`, C);

    // 情境不成立：目標收入對應的每人費用 ≤ 0（開發約束 27）
    if (p0 - d * x0 <= 0) {
      drawPanel(ctx, 30, 150, W - 60, 140, OC_ROSE, 0.1);
      exLine(ctx, [T(`多 ${x0} 人時，每人費用是 ${p0} − ${d} × ${x0} = ${mn(p0 - d * x0)} 元`, OC_ROSE)], 196, 17);
      exLine(ctx, [T('費用變成 0 或負數，這個情境不成立', OC_ROSE)], 226, 17);
      exLine(ctx, [T('把「目標的增加人數」調小，或把每人便宜的金額調小', MUTED)], 262, 15);
      out.innerHTML = '（每人費用不是正數，情境不成立）';
      fb.innerHTML = wrapFeedback(`多 \\(${x0}\\) 人時每人費用是 \\(${p0} - ${d} \\times ${x0} = ${p0 - d * x0}\\) 元，旅行團不可能倒貼錢，請把增加人數或優惠金額調小。`);
      typeset([out, fb]);
      return;
    }

    const R = (n0 + x0) * (p0 - d * x0);
    const A = d, Bq = -(p0 - d * n0), Cq = R - n0 * p0;
    const gg = gcd(gcd(A, Bq), Cq);
    const res = rootsOf(A / gg, Bq / gg, Cq / gg);
    const list = rootList(res);
    const why = o => {
      if (o.v < -1e-9) return '人數不會變少（x 不能是負數）';
      if (!o.exact || o.exact[1] !== 1) return '人數要是整數';
      if (o.v > cap + 1e-9) return `超過上限（最多再加 ${cap} 人）`;
      if (p0 - d * o.v <= 0) return '每人費用不是正數';
      return '';
    };
    const checks = list.map(o => ({ o, bad: why(o) }));
    const good = checks.filter(c => !c.bad);

    const rows = [
      row('設', '比原訂多 x 人', ocInk(`人數 (${n0} + x)，每人 (${p0} - ${d}x) 元`)),
      row('列', '人數 × 每人費用 = 總收入', ocInk(`(${n0} + x)(${p0} - ${d}x) = ${R}`)),
      row('整理', gg > 1 ? `展開、移項、同除以 ${gg}` : '展開、移項', ocInk(`${polyStr([A / gg, Bq / gg, Cq / gg], 'x')} = 0`)),
      row('解', '', rootsItems(res))
    ];
    checks.forEach(c => {
      const lab = c.o.exact ? `x = ${mn(fracText(c.o.exact))}` : `x ≈ ${mn(ap(c.o.v))}`;
      rows.push(row(`檢查 ${lab}`, c.bad ? '不合情境' : '在範圍內的整數',
        c.bad ? [T(c.bad, OC_ROSE)] : ocInk(`${n0 + c.o.v} 人，每人 ${p0 - d * c.o.v} 元`, OC_JADE), c.bad ? OC_ROSE : OC_JADE));
    });
    rows.push(row('答', good.length === 2 ? '兩個答案都合理' : '',
      [T(good.length ? good.map(c => `${n0 + c.o.v} 人`).join(' 或 ') : '無解', good.length ? OC_JADE : OC_ROSE)], good.length ? OC_JADE : OC_ROSE));
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 43, eqX: 172, color: C, size: 19 });

    // 長條圖：多 0～(cap + 5) 人時的總收入；超過上限的灰掉，等於目標的亮起來
    const nb = cap + 6;
    const vals = [];
    for (let x = 0; x < nb; x++) vals.push((n0 + x) * (p0 - d * x));
    const maxV = Math.max(R, ...vals) * 1.12;
    const bx = 60, bottom = 580, bwid = 440, bh = 150;
    const hits = new Set(good.map(c => c.o.v));
    ocBars(ctx, bx, bottom, bwid, bh, vals, maxV, i => (hits.has(i) ? OC_JADE : (i > cap ? DIM : OC_ORANGE)));
    const ty = bottom - R / maxV * bh;
    ocLine(ctx, bx, ty, bx + bwid, ty, OC_ROSE, 2, [6, 4]);
    textLeft(ctx, `目標 ${R}`, bx + 4, ty - 10, OC_ROSE, f(800, 12));
    const step = nb > 16 ? 5 : 2;
    for (let x = 0; x < nb; x += step) textCenter(ctx, String(x), bx + (x + 0.5) * bwid / nb, bottom + 12, MUTED, f(700, 11));
    textLeft(ctx, '多幾人（x）', bx + bwid - 60, bottom + 26, MUTED, f(700, 11));

    out.innerHTML = `${wbrEq(`(${n0} + x)(${p0} - ${d}x) = ${R}`)}，${rootsHtml(res)}`;
    let note;
    if (res.kind === 'double') note = `兩個根相同（重根），只有多 \\(${x0}\\) 人一種情形。`;
    else if (good.length === 2) note = '兩個根都是範圍內的整數，兩種參加人數都會得到同樣的收入，兩個都要寫。';
    else note = '兩個根都滿足方程式，但要回到情境檢查：x 是「多出來的人數」，要是 0 以上的整數，也不能超過上限。';
    fb.innerHTML = wrapFeedback(note);
    typeset([out, fb]);
  }

  [sN, sP, sD, sX, sC].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 9：解都不合情境——此題無解（禮盒分裝）
   ========================================================================== */
function initNosolCanvas() {
  const cv = elById('canvas-nosol');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ns-a'), sk = elById('ns-k'), sr = elById('ns-r');
  const va = elById('ns-va'), vk = elById('ns-vk'), vr = elById('ns-vr');
  const out = elById('ns-formula');
  const fb = elById('ns-feedback');
  const C = OC_TONE[8];

  function draw() {
    const a = iv(sa), k = iv(sk), R = iv(sr);
    va.textContent = a; vk.textContent = k; vr.textContent = R;
    const e = a - k;
    const res = rootsOf(1, e, -R);
    const list = rootList(res);
    const pos = list.find(o => o.v > 0);
    const okInt = pos && pos.exact && pos.exact[1] === 1;
    const W = cv.width;
    const remain = e === 0 ? 'x' : `(${polyStr([1, e], 'x')})`;

    const rows = [
      row('設', `盒數比每盒顆數多 ${a}`, ocInk(`每盒 x 顆，共 (x + ${a}) 盒`)),
      row('列', `賣掉 ${k} 盒，剩 ${R} 顆`, ocInk(`x(x + ${a} - ${k}) = ${R}`)),
      row('整理', '', ocInk(`${polyStr([1, e, -R], 'x')} = 0`)),
      row('解', res.kind === 'irr' ? '用公式解' : '因式分解', rootsItems(res))
    ];
    list.forEach(o => {
      const lab = o.exact ? `x = ${mn(numText(o.v))}` : `x ≈ ${mn(ap(o.v))}`;
      const bad = o.v <= 0 ? '顆數不能是負數' : (!o.exact ? '顆數不能是無理數' : '');
      rows.push(row(`檢查 ${lab}`, bad || '正整數', [T(bad ? '不合' : '合理', bad ? OC_ROSE : OC_JADE)], bad ? OC_ROSE : OC_JADE));
    });
    rows.push(row('結論', '', [T(okInt ? `每盒 ${pos.v} 顆` : '兩個解都不合：此題無解', okInt ? OC_JADE : OC_ROSE)], okInt ? OC_JADE : OC_ROSE));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '每盒顆數一定是正整數，解出來的數合不合？', C);
    drawStepRows(ctx, rows, rows.length, { top: 64, gap: 46, eqX: 172, color: C, size: 19 });

    // 數線：兩個根落在哪裡？正整數格點亮起來
    const L = numLine(ctx, { x0: 50, x1: W - 50, y: 470, min: -14, max: 14, tick: 1, labelEvery: 2, font: f(700, 11) });
    for (let v = 1; v <= 14; v++) {
      ctx.save();
      ctx.fillStyle = OC_JADE;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(L.px(v), 470, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    textLeft(ctx, '綠點：正整數', L.px(1), 440, OC_JADE, f(700, 12));
    list.forEach(o => {
      const good = o.v > 0 && o.exact;
      const x = L.px(clamp(o.v, -14, 14));
      numLineEnd(ctx, x, 470, true, good ? OC_JADE : OC_ROSE);
      textCenter(ctx, o.exact ? mn(numText(o.v)) : '≈ ' + mn(ap(o.v)), x, 512, good ? OC_JADE : OC_ROSE, f(800, 14));
    });

    out.innerHTML = `${wbrEq(`x(x + ${a} - ${k}) = ${R}`)}，${rootsHtml(res)}，${okInt ? `每盒 \\(${pos.v}\\) 顆` : '此題無解'}`;
    fb.innerHTML = wrapFeedback(okInt
      ? `正根 \\(x = ${pos.v}\\) 剛好是正整數，可以驗算：剩下 \\(${pos.v + e}\\) 盒 × \\(${pos.v}\\) 顆 \\(= ${R}\\) 顆。`
      : `方程式有兩個解，但一個是負數、另一個不是整數，沒有一個能當「顆數」。<b>解出來了卻都不合情境</b>，這題就是無解——這樣的分裝方式不可能剩下 \\(${R}\\) 顆。`);
    typeset([out, fb]);
  }

  [sa, sk, sr].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 10：判別式 < 0——收入目標達不到
   ========================================================================== */
function initDiscCanvas() {
  const cv = elById('canvas-disc');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('dc-p'), sn = elById('dc-n'), st = elById('dc-t');
  const vp = elById('dc-vp'), vn = elById('dc-vn'), vt = elById('dc-vt');
  const out = elById('dc-formula');
  const fb = elById('dc-feedback');
  const C = OC_TONE[9];

  function draw() {
    const p = iv(sp), n = iv(sn), Tg = iv(st);
    vp.textContent = p; vn.textContent = n; vt.textContent = Tg;
    const W = cv.width;
    // 10y² − (10n − p)y + (T − pn) = 0，係數都是 10 的倍數，同除以 10
    const B = -(10 * n - p) / 10, Cc = (Tg - p * n) / 10;
    const D = B * B - 4 * Cc;
    const res = rootsOf(1, B, Cc);
    const list = rootList(res).filter(o => o.exact && o.exact[1] === 1 && o.v >= 0 && o.v <= n);
    const yStar = (10 * n - p) / 20;
    const maxRev = (10 * n + p) * (10 * n + p) / 40;

    const rows = [
      row('設', '售價提高 10y 元、少賣 y 罐', ocInk(`售價 (${p} + 10y) 元，賣出 (${n} - y) 罐`)),
      row('列', '售價 × 罐數 = 收入', ocInk(`(${p} + 10y)(${n} - y) = ${Tg}`)),
      row('整理', '展開、移項、同除以 10', ocInk(`${polyStr([1, B, Cc], 'y')} = 0`)),
      row('判別式', 'b² − 4ac', ocInk(`${sqS(B)} - 4·1·${pS(Cc)} = ${D}`), D < 0 ? OC_ROSE : undefined)
    ];
    let concl;
    if (D < 0) concl = [T('判別式 < 0：方程式無解，收入達不到', OC_ROSE)];
    else if (!list.length) concl = [T('有解，但 y 不是 0 到 ' + n + ' 的整數：達不到', OC_ROSE)];
    else concl = [T(list.map(o => `y = ${o.v}，售價 ${p + 10 * o.v} 元`).join('；'), OC_JADE)];
    rows.push(row('結論', D < 0 ? '不必再解' : '解出 y，再檢查', concl, D < 0 || !list.length ? OC_ROSE : OC_JADE));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `每罐 ${p} 元可賣 ${n} 罐；每漲 10 元少賣 1 罐`, C);
    drawStepRows(ctx, rows, rows.length, { top: 66, gap: 50, eqX: 160, color: C, size: 19 });

    // 長條圖：漲 y 次時的收入（y = 0～n），目標線畫在上面
    const vals = [];
    for (let y = 0; y <= n; y++) vals.push((p + 10 * y) * (n - y));
    const maxV = Math.max(Tg, maxRev) * 1.12;
    const bx = 60, bottom = 560, bwid = 440, bh = 190;
    const hit = new Set(list.map(o => o.v));
    ocBars(ctx, bx, bottom, bwid, bh, vals, maxV, i => (hit.has(i) ? OC_JADE : OC_ORANGE));
    const ty = bottom - Tg / maxV * bh;
    ocLine(ctx, bx, ty, bx + bwid, ty, D < 0 ? OC_ROSE : OC_JADE, 2, [6, 4]);
    textLeft(ctx, `目標 ${Tg} 元`, bx + 4, ty - 10, D < 0 ? OC_ROSE : OC_JADE, f(800, 12));
    const my = bottom - maxRev / maxV * bh;
    textCenter(ctx, `最高約 ${Math.round(maxRev)} 元`, bx + (yStar + 0.5) * bwid / (n + 1), my - 24, MUTED, f(700, 12));
    for (let y = 0; y <= n; y += 10) textCenter(ctx, String(y), bx + (y + 0.5) * bwid / (n + 1), bottom + 12, MUTED, f(700, 11));
    textLeft(ctx, '漲幾次（y）', bx + bwid - 70, bottom + 26, MUTED, f(700, 11));

    out.innerHTML = `${wbrEq(`(${p} + 10y)(${n} - y) = ${Tg}`)}，判別式 \\(${D}\\)，${D < 0 ? '無解' : rootsHtml(res, 'y')}`;
    fb.innerHTML = wrapFeedback(D < 0
      ? `判別式 \\(${D} \\lt 0\\)，方程式無解——目標線比每一根長條都高，<b>不必把解算出來</b>就知道這個收入不可能達到。`
      : (list.length
        ? `判別式 \\(${D} \\ge 0\\)，方程式有解；目標線碰到長條的地方就是解。把目標往上拉，超過最高的那根，判別式就會變成負數。`
        : `判別式 \\(${D} \\ge 0\\)，方程式有實數解，但不是 \\(0\\) 到 \\(${n}\\) 的整數，「漲幾次」做不到，所以也達不到。`));
    typeset([out, fb]);
  }

  [sp, sn, st].forEach(s => s.addEventListener('input', draw));
  draw();
}
