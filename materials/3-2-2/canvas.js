/* ==========================================================================
   3-2-2（第三冊 2-2）根式的運算 — 互動 Canvas 與隨堂評量
   畫風：復古磁磚工坊（沿用 3-2-1 的小瓷、阿岩）。邊長 √n 的方磚就是本節的
   根式：同一種磚（根號裡的數相同）才能排在一起合併。
   陶土橘 TL_TERRA 是第一個根式、鈷藍 TL_COBALT 是第二個、翡翠綠 TL_JADE 是
   結果、玫瑰 TL_ROSE 是錯誤或要扣掉的那一份。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／PW／GRP／SEQ／RT／measure／
   drawExpr／drawStepRows／drawEqPanel／drawPanel／drawChip／wbrEq／
   textCenter／textLeft／bindPickGroup…），本檔只放本節的色票、根式運算
   （rd 開頭的工具）與 13 個互動。

   ⚠️ 根式一律用「係數是最簡分數 n/d、根號裡 r 不含平方因數」的項來算
   （rdTerm／rdSum／rdMul），r = 1 就是有理數。不要用浮點數判斷相等或化簡。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initNotationCanvas();
  initMulCanvas();
  initDivCanvas();
  initSimplestCanvas();
  initExtractCanvas();
  initRatCanvas();
  initFracRootCanvas();
  initLikeCanvas();
  initAddCanvas();
  initMixCanvas();
  initDistCanvas();
  initFormulaCanvas();
  initConjCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（TL_ = Tile；共用檔沒有這個前綴）
   ========================================================================== */

const TL_TERRA = '#fdba74';   // 第一個根式
const TL_COBALT = '#93c5fd';  // 第二個根式
const TL_JADE = '#6ee7b7';    // 結果
const TL_ROSE = '#fda4af';    // 錯誤、扣掉的
const TL_GOLD = '#fcd34d';    // 提示、平方因數

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const TL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5', '#f0abfc'];

// 同類方根的配色：根號裡（化成最簡之後）是幾，就是哪一種磚
const TL_RCOL = { 1: '#e2e8f0', 2: '#fdba74', 3: '#93c5fd', 5: '#6ee7b7', 6: '#fcd34d', 7: '#f9a8d4' };
function rCol(r) {
  return TL_RCOL[r] || '#c4b5fd';
}

const CIRC = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

function elById(id) {
  return document.getElementById(id);
}

function iv(el) {
  return parseInt(el.value, 10);
}

// 整數平方根（無條件捨去），浮點誤差在這裡修正
function isqrt(n) {
  if (n <= 0) return 0;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

// canvas 上的減號換成數學減號 −，投影時比連字號清楚
function mn(s) {
  return String(s).replace(/-/g, '−');
}

// 近似值（三位小數），-0.000 一律寫成 0.000
function ap(v) {
  return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
}

// 分數一律先約分（AGENTS.md〈工作約定〉texFrac 那條）
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// canvas 上的分數元件：約分、負號提到前面、分母 1 時寫整數
function fracItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(mn(r[0]), color);
  if (r[0] < 0) return SEQ([T('−', color), FR(-r[0], r[1], color)], color, 2);
  return FR(r[0], r[1], color);
}

// √n 的 canvas 元件
function rtItem(s, color) {
  return RT(T(s, color), color);
}

// c√n（c 是整數；1 與 −1 不寫係數）
function crItem(c, n, color) {
  const root = rtItem(n, color);
  if (c === 1) return root;
  if (c === -1) return SEQ([T('−', color), root], color, 2);
  return SEQ([T(mn(c), color), root], color, 2);
}

function crTex(c, n) {
  if (c === 1) return `\\sqrt{${n}}`;
  if (c === -1) return `-\\sqrt{${n}}`;
  return `${c}\\sqrt{${n}}`;
}

// 負數並置相乘要加括號
function par(item, v, color) {
  return v < 0 ? GRP([item], '()', color) : item;
}

function parTex(s, v) {
  return v < 0 ? `\\left(${s}\\right)` : s;
}

// 步驟列重新編號（列數會隨狀態改變，編號不寫死）
function numberRows(rows) {
  rows.forEach((r, i) => { r.name = `${CIRC[i]} ${r.name}`; });
  return rows;
}

// 滑桿不可以停在 0：拖過 0 時直接跳到另一邊
function skipZero(slider) {
  let last = iv(slider);
  slider.addEventListener('input', () => {
    let v = iv(slider);
    if (v === 0) { v = last > 0 ? -1 : 1; slider.value = v; }
    last = v;
  });
}

// 一塊磁磚：半透明釉面、實線外框，夠大時在左上角加一道反光
function tlTile(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.28 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.strokeRect(x, y, w, h);
  if (o.glaze !== false && w > 16 && h > 16) {
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 6);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + w - 6, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

// 量尺：兩端有短豎線的橫線
function measureBar(ctx, x1, x2, y, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 2;
  ctx.beginPath();
  ctx.moveTo(x1, y - 6); ctx.lineTo(x1, y + 6);
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.moveTo(x2, y - 6); ctx.lineTo(x2, y + 6);
  ctx.stroke();
  ctx.restore();
}

// 一行左對齊的算式（中文字與算式元件混排）
function exprLeft(ctx, items, x, cy, size, color, maxW) {
  return drawExpr(ctx, items, 0, cy, size, color, { left: x, maxW: maxW || (ctx.canvas.width - x - 14), gap: 6 });
}

/* ==========================================================================
   根式運算：項 = (n/d)√r，n/d 是最簡分數、r 不含平方因數（r = 1 是有理數）
   ========================================================================== */

// n = k² × r（r 不含平方因數）
function rdSqf(n) {
  let k = 1, r = n;
  for (let p = 2; p * p <= r; p++) {
    while (r % (p * p) === 0) { r /= p * p; k *= p; }
  }
  return [k, r];
}

// 標準分解式 [[質數, 次數], ...]
function rdFactor(n) {
  const out = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    let e = 0;
    while (m % p === 0) { m /= p; e++; }
    if (e) out.push([p, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

// (n/d)√rad 化成最簡的一項
function rdTerm(n, d, rad) {
  if (n === 0) return { n: 0, d: 1, r: 1 };
  const [k, r] = rdSqf(rad);
  const c = reduce(n * k, d);
  return { n: c[0], d: c[1], r };
}

// 合併同類方根；順序照各類第一次出現的位置（課本的寫法，例：2√3 + √6）
function rdSum(terms) {
  const map = new Map();
  terms.forEach(t0 => {
    const t = rdTerm(t0.n, t0.d, t0.r);
    if (t.n === 0) return;
    const c = map.get(t.r) || [0, 1];
    map.set(t.r, reduce(c[0] * t.d + t.n * c[1], c[1] * t.d));
  });
  return [...map.entries()]
    .filter(([, c]) => c[0] !== 0)
    .map(([r, c]) => ({ n: c[0], d: c[1], r }));
}

function rdMul(A, B) {
  const out = [];
  A.forEach(x => B.forEach(y => out.push(rdTerm(x.n * y.n, x.d * y.d, x.r * y.r))));
  return rdSum(out);
}

function rdVal(terms) {
  return terms.reduce((s, t) => s + t.n / t.d * Math.sqrt(t.r), 0);
}

function rdSame(A, B) {
  if (A.length !== B.length) return false;
  return A.every((t, i) => t.n === B[i].n && t.d === B[i].d && t.r === B[i].r);
}

// 一項的 LaTeX（不含正負號）：5、\frac{3}{4}、2\sqrt{3}、\frac{5\sqrt{3}}{6}
function rdBodyTex(t) {
  const a = Math.abs(t.n);
  if (t.r === 1) return t.d === 1 ? `${a}` : `\\frac{${a}}{${t.d}}`;
  const num = a === 1 ? `\\sqrt{${t.r}}` : `${a}\\sqrt{${t.r}}`;
  return t.d === 1 ? num : `\\frac{${num}}{${t.d}}`;
}

function rdTex(terms) {
  if (!terms.length) return '0';
  return terms.map((t, i) => {
    const b = rdBodyTex(t);
    if (i === 0) return (t.n < 0 ? '-' : '') + b;
    return (t.n < 0 ? ' - ' : ' + ') + b;
  }).join('');
}

// 一項的 canvas 元件（不含正負號）
function rdBodyItem(t, color) {
  const a = Math.abs(t.n);
  let num;
  if (t.r === 1) num = T(a, color);
  else num = a === 1 ? rtItem(t.r, color) : SEQ([T(a, color), rtItem(t.r, color)], color, 2);
  return t.d === 1 ? num : VF(num, T(t.d, color), color);
}

// 一整串項的 canvas 元件陣列；colorOf(t) 可依項上色
function rdItems(terms, color, colorOf) {
  if (!terms.length) return [T('0', color)];
  const out = [];
  terms.forEach((t, i) => {
    const col = colorOf ? colorOf(t) : color;
    const body = rdBodyItem(t, col);
    if (i === 0) out.push(t.n < 0 ? SEQ([T('−', col), body], col, 2) : body);
    else out.push(T(t.n < 0 ? '−' : '+', INK), body);
  });
  return out;
}

// 把一串項包成單一元件（放進分數、括號用）
function rdSeq(terms, color) {
  return SEQ(rdItems(terms, color), color, 6);
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 2-2 的 26 題正解
  // 正解字母分布：A 6 題、B 7 題、C 7 題、D 6 題（開發約束 36）
  const answers = {
    '2-2-1': 'B',    // √13 + √13 + √13 = 3√13
    '2-2-2': 'A',    // (4√19 / 9) × (−6) = −8√19 / 3
    '2-2-3': 'D',    // (−2√11) × (3/4)√13 = −3√143 / 2
    '2-2-4': 'C',    // √27 × √3 = 9
    '2-2-5': 'A',    // √117 ÷ √13 = 3
    '2-2-6': 'C',    // (−15√22) ÷ (6√11) = −5√2 / 2
    '2-2-7': 'B',    // √51 / 4 是最簡根式
    '2-2-8': 'B',    // 3√75：75 = 3 × 5²
    '2-2-9': 'D',    // √252 = 6√7
    '2-2-10': 'A',   // √18 × √60 = 6√30
    '2-2-11': 'C',   // 14 / √35 = 2√35 / 5
    '2-2-12': 'B',   // 9 / (2√27) = √3 / 2
    '2-2-13': 'D',   // √0.45 = 3√5 / 10
    '2-2-14': 'A',   // √(11/18) = √22 / 6
    '2-2-15': 'C',   // √147 = 7√3 不是 √7 的同類方根
    '2-2-16': 'D',   // √72、√98、√0.5 都是 √2 的同類方根
    '2-2-17': 'B',   // √50 − 3√6 + √54 − √8 = 3√2
    '2-2-18': 'C',   // √12 + √27 = √75 成立
    '2-2-19': 'A',   // √(5/6) × √(3/10) ÷ √(1/8) = √2
    '2-2-20': 'D',   // (−2√15)(−√(3/5)) − 4√3 = 6 − 4√3
    '2-2-21': 'B',   // 2√7(√14 − √28) = 14√2 − 28
    '2-2-22': 'C',   // (√6 + 2)(√6 − 3) = −√6
    '2-2-23': 'A',   // (√11 − 2√3)² = 23 − 4√33
    '2-2-24': 'B',   // (√13 + 3)(√13 − 3) = 4
    '2-2-25': 'D',   // 6 / (√17 − √11) = √17 + √11
    '2-2-26': 'C'    // 22 / (5 + √3) = 5 − √3
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
   重點 1：根式的表示——a × √b 寫成 a√b，√b ÷ a 寫成 √b / a
   ========================================================================== */
function initNotationCanvas() {
  const cv = elById('canvas-note');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('no-a'), sb = elById('no-b'), sq = elById('no-q');
  const va = elById('no-va'), vb = elById('no-vb'), vq = elById('no-vq');
  const rowQ = elById('no-row-q');
  const mG = elById('no-mode-group');
  const out = elById('no-formula');
  const fb = elById('no-feedback');
  const C = TL_TONE[0];
  let mode = 'mul';
  skipZero(sq);

  // 一排 n 塊邊長 √b 的方磚，左下角 (x0, yb)，每塊邊長 L
  function tileRow(n, x0, yb, L, b, color, opts) {
    for (let i = 0; i < n; i++) {
      tlTile(ctx, x0 + i * L, yb - L, L, L, color, opts);
      if (L >= 28) drawExpr(ctx, [rtItem(b, color)], x0 + i * L + L / 2, yb - L / 2, Math.min(15, L * 0.36), color, { maxW: L - 4 });
    }
  }

  function drawMul(a, b) {
    const k = isqrt(b), perfect = k * k === b;
    const head = [T(a, C), T('×', INK), rtItem(b, TL_TERRA), T('=', INK), crItem(a, b, TL_TERRA)];
    if (perfect) head.push(T('=', INK), T(a * k, TL_TERRA));
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 25 });

    // 同一張圖裡每塊磚一樣大、邊長與 √b 成正比；整排盡量撐滿畫布
    const L = Math.min(40, 470 / (a * Math.sqrt(b))) * Math.sqrt(b), W = a * L, x0 = (cv.width - W) / 2, yb = 300;
    tileRow(a, x0, yb, L, b, TL_TERRA);
    measureBar(ctx, x0, x0 + W, yb + 16, TL_JADE);
    drawExpr(ctx, [T(`${a} 塊排一排，總長`, INK), crItem(a, b, TL_JADE), T(`≈ ${ap(a * Math.sqrt(b))}`, TL_JADE)], cv.width / 2, yb + 44, 17, INK);

    drawPanel(ctx, 18, 372, cv.width - 36, 92, C, 0.06);
    textCenter(ctx, `就像 ${a} × x 寫成 ${a}x：`, cv.width / 2, 398, INK, f(700, 16));
    textCenter(ctx, '乘號省略，數字寫在根號前面', cv.width / 2, 432, C, f(800, 17));

    out.innerHTML = wbrEq(`${a} \\times \\sqrt{${b}} = ${a}\\sqrt{${b}}${perfect ? ` = ${a * k}` : ''}`);
    fb.innerHTML = wrapFeedback(`\\(${a}\\) 塊邊長 \\(\\sqrt{${b}}\\) 的磚排成一排，總長是 \\(${a}\\) 個 \\(\\sqrt{${b}}\\)，寫成 <b style="color:${C}">\\(${a}\\sqrt{${b}}\\)</b>${perfect ? `；\\(\\sqrt{${b}} = ${k}\\)，所以也等於 \\(${a * k}\\)` : ''}。`);
  }

  function drawDiv(a, b) {
    const head = [rtItem(b, TL_TERRA), T('÷', INK), T(a, C), T('=', INK),
      VF(rtItem(b, TL_TERRA), T(a, C), TL_TERRA), T('=', INK), SEQ([FR(1, a, C), rtItem(b, TL_TERRA)], TL_TERRA, 3)];
    drawEqPanel(ctx, head, 80, C, { h: 34, size: 24 });

    // 左：邊長 √b 的方磚，底邊切成 a 等份
    const L = 34 * Math.sqrt(b), x0 = 36, yb = 290;
    tlTile(ctx, x0, yb - L, L, L, TL_TERRA);
    drawExpr(ctx, [T('邊長', TL_TERRA), rtItem(b, TL_TERRA)], x0 + L / 2, yb - L - 16, 15, TL_TERRA);
    ctx.save();
    ctx.strokeStyle = TL_JADE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, yb + 8);
    ctx.lineTo(x0 + L / a, yb + 8);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= a; i++) {
      ctx.beginPath();
      ctx.moveTo(x0 + i * L / a, yb + 2);
      ctx.lineTo(x0 + i * L / a, yb + 14);
      ctx.stroke();
    }
    ctx.restore();
    textLeft(ctx, `底邊切成 ${a} 等份`, x0, yb + 34, INK, f(700, 14));

    // 右：兩種寫法的長度比一比
    const U = 60, bx = 250;
    const v1 = Math.sqrt(b) / a, v2 = Math.sqrt(b / a);
    textLeft(ctx, '一份的長度：', bx, 150, INK, f(800, 15));
    ctx.save();
    ctx.strokeStyle = TL_JADE;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(bx, 186); ctx.lineTo(bx + v1 * U, 186); ctx.stroke();
    ctx.restore();
    exprLeft(ctx, [VF(rtItem(b, TL_JADE), T(a, TL_JADE), TL_JADE), T(`≈ ${ap(v1)}`, TL_JADE)], bx + v1 * U + 12, 186, 16, TL_JADE, 520 - bx - v1 * U);
    textLeft(ctx, '✗ 錯的寫法：', bx, 236, TL_ROSE, f(800, 15));
    ctx.save();
    ctx.strokeStyle = TL_ROSE;
    ctx.lineWidth = 6;
    ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(bx, 272); ctx.lineTo(bx + v2 * U, 272); ctx.stroke();
    ctx.restore();
    exprLeft(ctx, [RT(SEQ([T(b, TL_ROSE), T('÷', TL_ROSE), T(a, TL_ROSE)], TL_ROSE, 4), TL_ROSE), T(`≈ ${ap(v2)}`, TL_ROSE)], bx + v2 * U + 12, 272, 16, TL_ROSE, 520 - bx - v2 * U);

    drawPanel(ctx, 18, 372, cv.width - 36, 92, TL_ROSE, 0.06);
    textCenter(ctx, `${a} 在根號外面，就要除在根號外面`, cv.width / 2, 398, INK, f(700, 16));
    exprLeft(ctx, [rtItem(b, TL_ROSE), T('÷', TL_ROSE), T(a, TL_ROSE), T('≠', TL_ROSE), RT(SEQ([T(b, TL_ROSE), T('÷', TL_ROSE), T(a, TL_ROSE)], TL_ROSE, 4), TL_ROSE), T('（兩條長度不一樣）', INK)], 70, 434, 17, INK, 420);

    out.innerHTML = wbrEq(`\\sqrt{${b}} \\div ${a} = \\frac{\\sqrt{${b}}}{${a}} = \\frac{1}{${a}}\\sqrt{${b}}`);
    fb.innerHTML = wrapFeedback(`\\(\\sqrt{${b}} \\div ${a}\\) 是把長度 \\(\\sqrt{${b}}\\) 分成 \\(${a}\\) 等份，一份 \\(\\frac{\\sqrt{${b}}}{${a}} \\approx ${ap(v1)}\\)。<br><span style="color:${TL_ROSE}">✗ 寫成 \\(\\sqrt{${b} \\div ${a}} \\approx ${ap(v2)}\\) 就變成另一個數了。</span>`);
  }

  function drawChain(a, b, q) {
    const col = q > 0 ? TL_TERRA : TL_ROSE;
    const head = [crItem(a, b, TL_TERRA), T('×', INK), par(T(mn(q), C), q, C), T('=', INK), crItem(a * q, b, col)];
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 25 });

    const n = Math.abs(q);
    const L = Math.min(52, 340 / a, 184 / n - 6), W = a * L, x0 = (cv.width - W) / 2 - 36, top = 126;
    for (let j = 0; j < n; j++) {
      const yb = top + (j + 1) * (L + 6);
      tileRow(a, x0, yb, L, b, col, q < 0 ? { dash: [5, 3] } : null);
      drawExpr(ctx, [crItem(a, b, col)], x0 + W + 44, yb - L / 2, 15, col);
    }
    if (q < 0) textCenter(ctx, '負號：整批變成「要扣掉」的', cv.width / 2, top + n * (L + 6) + 22, TL_ROSE, f(700, 14));

    drawPanel(ctx, 18, 352, cv.width - 36, 112, C, 0.06);
    exprLeft(ctx, [T('① 係數相乘：', C), T(a, INK), T('×', INK), par(T(mn(q), INK), q, INK), T('=', INK), T(mn(a * q), col)], 40, 382, 18, INK, 460);
    exprLeft(ctx, [T('② 根號照抄：', C), rtItem(b, TL_TERRA)], 40, 418, 18, INK, 460);
    exprLeft(ctx, [T('③ 合起來：', C), crItem(a * q, b, col)], 40, 448, 18, INK, 460);

    out.innerHTML = wbrEq(`${a}\\sqrt{${b}} \\times ${parTex(String(q), q)} = ${crTex(a * q, b)}`);
    fb.innerHTML = wrapFeedback(`\\(${a}\\sqrt{${b}}\\) 是 \\(${a}\\) 個 \\(\\sqrt{${b}}\\)，再乘 \\(${parTex(String(q), q)}\\) 就是 \\(${a * q}\\) 個：係數相乘、根號照抄，得 <b style="color:${C}">\\(${crTex(a * q, b)}\\)</b>。`);
  }

  function draw() {
    const a = iv(sa), b = iv(sb), q = iv(sq);
    va.textContent = a; vb.textContent = b; vq.textContent = q;
    rowQ.style.display = mode === 'chain' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'mul' ? '幾塊一樣的方磚排一排' : (mode === 'div' ? '一條邊切成幾等份' : '一排磚再乘一個數'), C);
    if (mode === 'mul') drawMul(a, b);
    else if (mode === 'div') drawDiv(a, b);
    else drawChain(a, b, q);
    typeset([out, fb]);
  }

  [sa, sb, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-no-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：根式的乘法——√a × √b = √(ab)
   ========================================================================== */
function initMulCanvas() {
  const cv = elById('canvas-mul');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('mu-a'), sb = elById('mu-b'), sp = elById('mu-p'), sq = elById('mu-q');
  const va = elById('mu-va'), vb = elById('mu-vb'), vp = elById('mu-vp'), vq = elById('mu-vq');
  const rowP = elById('mu-row-p'), rowQ = elById('mu-row-q');
  const mG = elById('mu-mode-group');
  const out = elById('mu-formula');
  const fb = elById('mu-feedback');
  const C = TL_TONE[1];
  let mode = 'plain';
  skipZero(sp);
  skipZero(sq);

  // 下方：面積 a、面積 b、面積 ab 的三塊方磚（同一個比例尺）
  function squares(a, b) {
    const U = 15, yb = 466;
    const sA = Math.sqrt(a) * U, sB = Math.sqrt(b) * U, sC = Math.sqrt(a * b) * U;
    let x = 30;
    tlTile(ctx, x, yb - sA, sA, sA, TL_TERRA);
    textCenter(ctx, `面積 ${a}`, x + Math.max(sA, 44) / 2, yb - sA - 12, TL_TERRA, f(700, 12));
    x += Math.max(sA, 44) + 12;
    tlTile(ctx, x, yb - sB, sB, sB, TL_COBALT);
    textCenter(ctx, `面積 ${b}`, x + Math.max(sB, 44) / 2, yb - sB - 12, TL_COBALT, f(700, 12));
    x += Math.max(sB, 44) + 16;
    tlTile(ctx, x, yb - sC, sC, sC, TL_JADE);
    textCenter(ctx, `面積 ${a * b}`, x + Math.max(sC, 50) / 2, yb - sC - 12, TL_JADE, f(700, 12));

    const tx = 336;
    const ra = Math.sqrt(a), rb = Math.sqrt(b);
    exprLeft(ctx, [rtItem(a, TL_TERRA), T(`≈ ${ap(ra)}`, TL_TERRA)], tx, 340, 15, INK, 190);
    exprLeft(ctx, [rtItem(b, TL_COBALT), T(`≈ ${ap(rb)}`, TL_COBALT)], tx, 370, 15, INK, 190);
    exprLeft(ctx, [T('相乘', INK), T(`≈ ${ap(ra * rb)}`, INK)], tx, 400, 15, INK, 190);
    exprLeft(ctx, [rtItem(a * b, TL_JADE), T(`≈ ${ap(Math.sqrt(a * b))}`, TL_JADE)], tx, 430, 15, INK, 190);
    textLeft(ctx, '兩個一樣長 ✓', tx, 458, OK_COLOR, f(800, 14));
  }

  function drawPlain(a, b) {
    const ab = a * b, simp = [rdTerm(1, 1, ab)];
    const head = [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('=', INK), rtItem(ab, TL_JADE)];
    const plainSimp = simp[0].n === 1 && simp[0].r === ab && ab > 1;
    if (!plainSimp) head.push(T('=', INK), ...rdItems(simp, TL_JADE));
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 25 });

    const prod = GRP([rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT)], '()', INK);
    const rows = [
      { name: '平方看看', hint: '乘法可以交換、結合', items: [PW(prod, 2, false, INK), T('=', INK), PW(rtItem(a, TL_TERRA), 2, true, TL_TERRA), T('×', INK), PW(rtItem(b, TL_COBALT), 2, true, TL_COBALT)] },
      { name: '算出來', hint: '(√a)² = a', items: [T('=', INK), T(a, TL_TERRA), T('×', INK), T(b, TL_COBALT), T('=', INK), T(ab, TL_JADE)] },
      { name: '下結論', hint: `平方是 ${ab} 的正數就是 √${ab}`, items: [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('=', INK), rtItem(ab, TL_JADE)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 150, gap: 54, labX: 22, eqX: 176, size: 20, color: C });
    squares(a, b);

    out.innerHTML = wbrEq(`\\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${ab}}${plainSimp ? '' : ` = ${rdTex(simp)}`}`);
    fb.innerHTML = wrapFeedback(`${wbrEq(`(\\sqrt{${a}} \\times \\sqrt{${b}})^2 = ${a} \\times ${b} = ${ab}`)}，而且 \\(\\sqrt{${a}} \\times \\sqrt{${b}}\\) 是正數，所以它就是 <b style="color:${C}">\\(\\sqrt{${ab}}\\)</b>${plainSimp ? '' : `，化成最簡根式是 \\(${rdTex(simp)}\\)`}。`);
  }

  function drawCoef(a, b, p, q) {
    const ab = a * b, pq = p * q, simp = [rdTerm(pq, 1, ab)];
    const raw = crItem(pq, ab, TL_JADE);
    const plainSimp = simp[0].n === pq && simp[0].r === ab && ab > 1;
    const head = [crItem(p, a, TL_TERRA), T('×', INK), par(crItem(q, b, TL_COBALT), q, INK), T('=', INK), raw];
    if (!plainSimp) head.push(T('=', INK), ...rdItems(simp, TL_JADE));
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 24 });

    const rows = [
      { name: '係數乘係數', hint: '先決定正負號', items: [T(mn(p), TL_TERRA), T('×', INK), par(T(mn(q), TL_COBALT), q, INK), T('=', INK), T(mn(pq), TL_JADE)] },
      { name: '根號乘根號', hint: '√a × √b = √(ab)', items: [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('=', INK), rtItem(ab, TL_JADE)] },
      { name: '合起來', hint: '', items: [raw] }
    ];
    if (!plainSimp) rows.push({ name: '化成最簡根式', hint: '根號裡有平方因數要提出來', items: [T('=', INK), ...rdItems(simp, TL_JADE)] });
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 146, gap: rows.length === 4 ? 44 : 54, labX: 22, eqX: 176, size: 20, color: C });
    squares(a, b);

    out.innerHTML = wbrEq(`${crTex(p, a)} \\times ${parTex(crTex(q, b), q)} = ${crTex(pq, ab)}${plainSimp ? '' : ` = ${rdTex(simp)}`}`);
    fb.innerHTML = wrapFeedback(`係數 \\(${p} \\times ${parTex(String(q), q)} = ${pq}\\)，根號 \\(\\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${ab}}\\)，合起來是 <b style="color:${C}">\\(${rdTex(simp)}\\)</b>。`);
  }

  function draw() {
    const a = iv(sa), b = iv(sb), p = iv(sp), q = iv(sq);
    va.textContent = a; vb.textContent = b; vp.textContent = p; vq.textContent = q;
    rowP.style.display = mode === 'coef' ? '' : 'none';
    rowQ.style.display = mode === 'coef' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'plain' ? '為什麼 √a × √b = √(ab)？' : '有係數時：係數乘係數、根號乘根號', C);
    if (mode === 'plain') drawPlain(a, b);
    else drawCoef(a, b, p, q);
    typeset([out, fb]);
  }

  [sa, sb, sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-mu-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：根式的除法——√a ÷ √b = √(a ÷ b)
   ========================================================================== */
function initDivCanvas() {
  const cv = elById('canvas-div');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sb = elById('dv-b'), sk = elById('dv-k'), sp = elById('dv-p'), sq = elById('dv-q');
  const vb = elById('dv-vb'), vk = elById('dv-vk'), vp = elById('dv-vp'), vq = elById('dv-vq');
  const rowP = elById('dv-row-p'), rowQ = elById('dv-row-q');
  const mG = elById('dv-mode-group');
  const out = elById('dv-formula');
  const fb = elById('dv-feedback');
  const C = TL_TONE[2];
  let mode = 'plain';
  skipZero(sp);
  skipZero(sq);

  // 下方：兩條邊長比一比
  function bars(a, b, k) {
    const U = 44, x0 = 40;
    const la = Math.sqrt(a) * U, lb = Math.sqrt(b) * U;
    ctx.save();
    ctx.lineWidth = 7;
    ctx.strokeStyle = TL_TERRA;
    ctx.beginPath(); ctx.moveTo(x0, 372); ctx.lineTo(x0 + la, 372); ctx.stroke();
    ctx.strokeStyle = TL_COBALT;
    ctx.beginPath(); ctx.moveTo(x0, 414); ctx.lineTo(x0 + lb, 414); ctx.stroke();
    ctx.restore();
    exprLeft(ctx, [rtItem(a, TL_TERRA), T(`≈ ${ap(Math.sqrt(a))}`, TL_TERRA)], x0 + la + 10, 372, 15, INK, 500 - x0 - la);
    exprLeft(ctx, [rtItem(b, TL_COBALT), T(`≈ ${ap(Math.sqrt(b))}`, TL_COBALT)], x0 + lb + 10, 414, 15, INK, 500 - x0 - lb);
    exprLeft(ctx, [T('橘色是藍色的', INK), ...rdItems([rdTerm(1, 1, k)], TL_JADE), T(`≈ ${ap(Math.sqrt(k))} 倍`, TL_JADE)], x0, 456, 16, INK, 460);
  }

  function drawPlain(b, k) {
    const a = b * k, res = [rdTerm(1, 1, k)];
    const done = res[0].n === 1 && res[0].r === k;   // √k 已經是最簡
    const head = [rtItem(a, TL_TERRA), T('÷', INK), rtItem(b, TL_COBALT), T('=', INK), RT(FR(a, b, INK), INK), T('=', INK), rtItem(k, TL_JADE)];
    if (!done) head.push(T('=', INK), ...rdItems(res, TL_JADE));
    drawEqPanel(ctx, head, 82, C, { h: 34, size: 23 });

    const rows = [
      { name: '平方看看', hint: '分子分母各自平方', items: [PW(GRP([VF(rtItem(a, TL_TERRA), rtItem(b, TL_COBALT), INK)], '()', INK), 2, false, INK), T('=', INK), FR(a, b, INK)] },
      { name: '下結論', hint: `平方是 ${a}/${b} 的正數`, items: [VF(rtItem(a, TL_TERRA), rtItem(b, TL_COBALT), INK), T('=', INK), RT(FR(a, b, INK), INK)] },
      { name: '約分', hint: `${a} 除以 ${b} 得 ${k}`, items: [T('=', INK), rtItem(k, TL_JADE)].concat(done ? [] : [T('=', INK), ...rdItems(res, TL_JADE)]) }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 156, gap: 62, labX: 22, eqX: 176, size: 20, color: C });
    bars(a, b, k);

    out.innerHTML = wbrEq(`\\sqrt{${a}} \\div \\sqrt{${b}} = \\sqrt{\\frac{${a}}{${b}}} = \\sqrt{${k}}${done ? '' : ` = ${rdTex(res)}`}`);
    fb.innerHTML = wrapFeedback(`\\(\\left(\\frac{\\sqrt{${a}}}{\\sqrt{${b}}}\\right)^2 = \\frac{${a}}{${b}}\\)，所以 \\(\\sqrt{${a}} \\div \\sqrt{${b}} = \\sqrt{${a} \\div ${b}}\\) <b style="color:${C}">\\(= ${rdTex(res)}\\)</b>：根號裡的數直接相除。`);
  }

  function drawCoef(b, k, p, q) {
    const a = b * k;
    const res = [rdTerm(p, q, k)];
    // 除數帶係數，一律加括號（課本寫法 (−12√6) ÷ (8√3)），否則 a ÷ 6√5 會被讀成 (a ÷ 6) × √5
    const head = [par(crItem(p, a, TL_TERRA), p, INK), T('÷', INK), GRP([crItem(q, b, TL_COBALT)], '()', INK), T('=', INK), ...rdItems(res, TL_JADE)];
    drawEqPanel(ctx, head, 80, C, { h: 32, size: 24 });

    const rows = [
      { name: '寫成分數', hint: '除以一個數 = 分數', items: [VF(crItem(p, a, TL_TERRA), crItem(q, b, TL_COBALT), INK)] },
      { name: '分開相除', hint: '係數除係數、根號除根號', items: [T('=', INK), fracItem(p, q, C), T('×', INK), RT(FR(a, b, INK), INK)] },
      { name: '約分', hint: `${a} 除以 ${b} 得 ${k}`, items: [T('=', INK), ...rdItems(res, TL_JADE)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 154, gap: 64, labX: 22, eqX: 176, size: 20, color: C });
    bars(a, b, k);

    out.innerHTML = wbrEq(`${parTex(crTex(p, a), p)} \\div \\left(${crTex(q, b)}\\right) = ${fTex(p, q)} \\times \\sqrt{${k}} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(`係數 \\(${p} \\div ${parTex(String(q), q)} = ${fTex(p, q)}\\)，根號 \\(\\sqrt{${a}} \\div \\sqrt{${b}} = \\sqrt{${k}}\\)，合起來 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。`);
  }

  function draw() {
    const b = iv(sb), k = iv(sk), p = iv(sp), q = iv(sq);
    vb.textContent = b; vk.textContent = k; vp.textContent = p; vq.textContent = q;
    rowP.style.display = mode === 'coef' ? '' : 'none';
    rowQ.style.display = mode === 'coef' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'plain' ? '√a ÷ √b：根號裡的數直接相除' : '有係數時：係數除係數、根號除根號', C);
    if (mode === 'plain') drawPlain(b, k);
    else drawCoef(b, k, p, q);
    typeset([out, fb]);
  }

  [sb, sk, sp, sq].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-dv-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：最簡根式——三道檢查關卡
   ========================================================================== */
function initSimplestCanvas() {
  const cv = elById('canvas-simp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('sm-n'), sm = elById('sm-m');
  const vn = elById('sm-vn'), vm = elById('sm-vm');
  const rowM = elById('sm-row-m');
  const mG = elById('sm-mode-group');
  const out = elById('sm-formula');
  const fb = elById('sm-feedback');
  const C = TL_TONE[3];
  let mode = 'int';

  // 標準分解式的元件：次數大於 1 的那個質數畫成玫瑰色
  function factorItems(n) {
    const fs = rdFactor(n);
    const items = [];
    fs.forEach(([p, e], i) => {
      if (i) items.push(T('×', INK));
      const col = e > 1 ? TL_ROSE : TL_JADE;
      items.push(e > 1 ? PW(T(p, col), e, false, col) : T(p, col));
    });
    return items;
  }

  function checkRow(y, ok, text, reason) {
    const col = ok === null ? MUTED : (ok ? OK_COLOR : TL_ROSE);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    roundRect(ctx, 24, y - 22, cv.width - 48, 44, 10);
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, ok === null ? '—' : (ok ? '✓' : '✗'), 48, y, col, f(800, 20));
    textLeft(ctx, text, 70, y - 8, INK, f(700, 14.5));
    textLeft(ctx, reason, 70, y + 11, col, f(600, 12.5));
  }

  function draw() {
    const n = iv(sn), m = iv(sm);
    vn.textContent = n; vm.textContent = m;
    rowM.style.display = (mode === 'int' || mode === 'dec') ? 'none' : '';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '這是最簡根式嗎？三道關卡都要過', C);

    let head, tex, val, c1, c2, c3, why1, why2, why3, intRad = null;
    if (mode === 'int') {
      head = [rtItem(n, TL_TERRA)]; tex = `\\sqrt{${n}}`;
      val = [rdTerm(1, 1, n)];
      c1 = true; why1 = `根號裡是 ${n}`; c2 = true; why2 = '沒有分母'; intRad = n;
    } else if (mode === 'over') {
      head = [VF(rtItem(n, TL_TERRA), T(m, TL_COBALT), INK)]; tex = `\\frac{\\sqrt{${n}}}{${m}}`;
      val = [rdTerm(1, m, n)];
      c1 = true; why1 = `根號裡是 ${n}`; c2 = true; why2 = `分母是 ${m}，沒有根號`; intRad = n;
    } else if (mode === 'under') {
      head = [VF(T(m, TL_COBALT), rtItem(n, TL_TERRA), INK)]; tex = `\\frac{${m}}{\\sqrt{${n}}}`;
      val = [rdTerm(m, n, n)];
      c1 = true; why1 = `根號裡是 ${n}`; c2 = false; why2 = `分母是 √${n}`; intRad = n;
    } else if (mode === 'frac') {
      const [N, D] = reduce(n, m);
      head = [RT(FR(n, m, TL_TERRA), TL_TERRA)]; tex = `\\sqrt{\\frac{${n}}{${m}}}`;
      val = [rdTerm(1, D, N * D)];
      c1 = false; why1 = D === 1 ? `根號裡寫成分數（約分後是 ${N}）` : `根號裡是分數 ${n}/${m}`;
      c2 = true; why2 = '根號外沒有分母';
    } else {
      const isInt = n % 10 === 0;
      const s = isInt ? String(n / 10) : (n < 10 ? `0.${n}` : `${Math.floor(n / 10)}.${n % 10}`);
      head = [rtItem(s, TL_TERRA)]; tex = `\\sqrt{${s}}`;
      const [N, D] = reduce(n, 10);
      val = [rdTerm(1, D, N * D)];
      c1 = isInt; why1 = isInt ? `其實是整數 ${s}` : `根號裡是小數 ${s}`;
      c2 = true; why2 = '沒有分母';
      if (isInt) intRad = n / 10;
    }
    if (intRad !== null) {
      const bad = rdFactor(intRad).filter(([, e]) => e > 1);
      c3 = intRad > 1 && bad.length === 0;
      why3 = intRad === 1 ? '1 = 1²，根號可以拿掉'
        : (bad.length ? `${bad.map(([p, e]) => `${p} 的次數是 ${e}`).join('、')}` : '每個質因數都只有 1 次');
    } else {
      c3 = null; why3 = '根號裡不是整數，先過第 ① 關';
    }
    const ok = c1 && c2 && c3;

    drawEqPanel(ctx, head, 82, C, { h: 42, size: 24 });
    if (intRad !== null && intRad > 1) {
      exprLeft(ctx, [T('根號裡：', INK), T(intRad, TL_TERRA), T('=', INK), ...factorItems(intRad)], 30, 142, 17, INK, 480);
    } else if (intRad === null) {
      textLeft(ctx, mode === 'dec' ? '根號裡是小數，要先化成分數' : '根號裡是分數，要先處理', 30, 142, INK, f(700, 15));
    } else {
      textLeft(ctx, '根號裡是 1', 30, 142, INK, f(700, 15));
    }

    checkRow(198, c1, '① 根號裡是正整數（不是分數、小數）', why1);
    checkRow(254, c2, '② 分母沒有根號', why2);
    checkRow(310, c3, '③ 根號裡的質因數，次數都是 1', why3);

    const verdict = ok ? '是最簡根式 ✓' : '不是最簡根式';
    drawChip(ctx, 24, 352, 170, 38, verdict, ok ? OK_COLOR : TL_ROSE, 'rgba(15, 23, 42, 0.6)');
    if (!ok) {
      exprLeft(ctx, [T('化簡後', INK), T('=', INK), ...rdItems(val, TL_JADE)], 214, 371, 20, INK, 300);
    }
    drawNote(ctx, ok ? '三關全過：根號裡已經不能再化簡' : '哪一關沒過，就從哪裡下手化簡（方法見重點 5～7）', 430, ok ? OK_COLOR : INK, 14);

    out.innerHTML = ok ? `\\( ${tex} \\)<wbr> 是最簡根式` : `\\( ${tex} \\)<wbr> 不是最簡根式，<wbr>${wbrEq(`${tex} = ${rdTex(val)}`)}`;
    const failed = [];
    if (!c1) failed.push('根號裡是分數或小數');
    if (!c2) failed.push('分母含有根號');
    if (c3 === false) failed.push(intRad === 1 ? '根號裡是完全平方數' : '根號裡有質因數的次數大於 1');
    fb.innerHTML = wrapFeedback(ok
      ? `三關都過，<b style="color:${OK_COLOR}">\\(${tex}\\) 是最簡根式</b>。`
      : `沒過的關卡：<b style="color:${TL_ROSE}">${failed.join('；')}</b>。化成最簡根式是 \\(${rdTex(val)}\\)。`);
    typeset([out, fb]);
  }

  [sn, sm].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-sm-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：化成最簡根式——把根號裡的平方因數提出來
   一塊面積 n 的大方磚，每邊切成 k 份，切出 k × k 塊面積 n/k² 的小方磚，
   所以邊長 √n = k√(n/k²)。切到小方磚的面積沒有平方因數，就是最簡根式。
   ========================================================================== */
function initExtractCanvas() {
  const cv = elById('canvas-extract');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('ex-n'), sk = elById('ex-k');
  const vn = elById('ex-vn'), vk = elById('ex-vk');
  const out = elById('ex-formula');
  const fb = elById('ex-feedback');
  const C = TL_TONE[4];
  let ks = [1];

  function validKs(n) {
    const r = [];
    for (let k = 1; k * k <= n; k++) if (n % (k * k) === 0) r.push(k);
    return r;
  }

  function syncK(reset) {
    ks = validKs(iv(sn));
    sk.max = ks.length - 1;
    if (reset) sk.value = 0;
    if (iv(sk) > ks.length - 1) sk.value = ks.length - 1;
  }

  // k 個 √m；m = 1 時就是整數 k
  function kr(k, m, color) {
    return m === 1 ? T(k, color) : crItem(k, m, color);
  }

  function krTex(k, m) {
    return m === 1 ? String(k) : (k === 1 ? `\\sqrt{${m}}` : `${k}\\sqrt{${m}}`);
  }

  function draw() {
    const n = iv(sn), k = ks[iv(sk)];
    vn.textContent = n; vk.textContent = k;
    const [K, R] = rdSqf(n);
    const inner = n / (k * k);
    const best = k === K;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '大方磚切成小方磚，邊長換個寫法', C);

    const head = [rtItem(n, TL_TERRA)];
    if (k > 1) head.push(T('=', INK), kr(k, inner, best ? TL_JADE : TL_GOLD));
    if (!best) head.push(T('=', INK), kr(K, R, TL_JADE));
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 25 });

    // 左：大方磚與切線
    const S = 200, X0 = 28, Y0 = 136;
    tlTile(ctx, X0, Y0, S, S, TL_TERRA, { alpha: 0.18 });
    ctx.save();
    ctx.strokeStyle = best ? TL_JADE : TL_GOLD;
    ctx.lineWidth = 1.6;
    for (let i = 1; i < k; i++) {
      ctx.beginPath(); ctx.moveTo(X0 + i * S / k, Y0); ctx.lineTo(X0 + i * S / k, Y0 + S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, Y0 + i * S / k); ctx.lineTo(X0 + S, Y0 + i * S / k); ctx.stroke();
    }
    ctx.restore();
    const cell = S / k;
    if (k === 1) {
      textCenter(ctx, `面積 ${n}`, X0 + S / 2, Y0 + S / 2, TL_TERRA, f(800, 18));
    } else if (cell >= 30) {
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
        textCenter(ctx, String(inner), X0 + (i + 0.5) * cell, Y0 + (j + 0.5) * cell, best ? TL_JADE : TL_GOLD, f(700, Math.min(16, cell * 0.36)));
      }
    }
    measureBar(ctx, X0, X0 + S, Y0 + S + 14, best ? TL_JADE : TL_TERRA);
    const sideItems = k === 1 ? [T('邊長', INK), rtItem(n, TL_TERRA)]
      : [T(`邊長 = ${k} 個`, INK), inner === 1 ? T('1', TL_GOLD) : rtItem(inner, best ? TL_JADE : TL_GOLD)];
    drawExpr(ctx, sideItems, X0 + S / 2, Y0 + S + 40, 16, INK, { maxW: 220 });
    if (k > 1) textCenter(ctx, `${k} × ${k} = ${k * k} 塊，每塊面積 ${inner}`, X0 + S / 2, Y0 + S + 70, MUTED, f(700, 13));

    // 右：標準分解式，成對的質因數搬出根號
    const RX = 256;
    textLeft(ctx, '根號裡的質因數：', RX, 140, INK, f(800, 14));
    let x = RX, chips = 0;
    rdFactor(n).forEach(([p, e]) => {
      for (let i = 0; i < Math.floor(e / 2); i++) {
        ctx.save();
        ctx.strokeStyle = TL_JADE;
        ctx.lineWidth = 1.6;
        roundRect(ctx, x - 3, 156, 58, 34, 8);
        ctx.stroke();
        ctx.restore();
        tlTile(ctx, x, 160, 24, 26, TL_JADE, { glaze: false });
        tlTile(ctx, x + 28, 160, 24, 26, TL_JADE, { glaze: false });
        textCenter(ctx, String(p), x + 12, 173, TL_JADE, f(800, 14));
        textCenter(ctx, String(p), x + 40, 173, TL_JADE, f(800, 14));
        textCenter(ctx, `→ ${p}`, x + 26, 204, TL_JADE, f(800, 13));
        x += 66; chips++;
      }
      if (e % 2) {
        tlTile(ctx, x, 160, 24, 26, TL_TERRA, { glaze: false });
        textCenter(ctx, String(p), x + 12, 173, TL_TERRA, f(800, 14));
        textCenter(ctx, '留著', x + 12, 204, TL_TERRA, f(700, 12));
        x += 32; chips++;
      }
    });
    textLeft(ctx, '一對一樣的質因數，搬出一個到根號外', RX, 230, MUTED, f(600, 12.5));

    const fac = [];
    rdFactor(n).forEach(([p, e], i) => {
      if (i) fac.push(T('×', INK));
      fac.push(e > 1 ? PW(T(p, INK), e, false, INK) : T(p, INK));
    });
    exprLeft(ctx, [T(n, TL_TERRA), T('=', INK), ...fac], RX, 268, 18, INK, 270);
    if (K > 1) {
      exprLeft(ctx, [T('=', INK), PW(T(K, TL_JADE), 2, false, TL_JADE), T('×', INK), T(R, TL_TERRA)], RX, 308, 18, INK, 270);
      exprLeft(ctx, [rtItem(n, TL_TERRA), T('=', INK), kr(K, R, TL_JADE)], RX, 350, 20, INK, 270);
    } else {
      textLeft(ctx, '沒有成對的質因數', RX, 308, TL_TERRA, f(700, 14));
      exprLeft(ctx, [rtItem(n, TL_TERRA), T('已經是最簡根式', INK)], RX, 350, 18, INK, 270);
    }

    let msg;
    if (K === 1) msg = `${n} 沒有平方因數，切不成更小的方磚`;
    else if (best) msg = R === 1 ? `${n} 是完全平方數，邊長就是整數 ${K}` : `√${R} 裡沒有平方因數了：這就是最簡根式`;
    else msg = `每塊面積 ${inner} 還能再切：√${inner} 裡還有平方因數`;
    drawChip(ctx, 24, 446, cv.width - 48, 36, msg, (K === 1 || best) ? OK_COLOR : TL_GOLD, 'rgba(15, 23, 42, 0.6)');

    out.innerHTML = wbrEq(`\\sqrt{${n}}${k > 1 ? ` = ${krTex(k, inner)}` : ''}${best ? '' : ` = ${krTex(K, R)}`}`);
    fb.innerHTML = wrapFeedback(K === 1
      ? `\\(${n}\\) 的質因數都只有一次，\\(\\sqrt{${n}}\\) 已經是最簡根式。`
      : `\\(${n} = ${K}^2 \\times ${R}\\)，把 \\(${K}^2\\) 提到根號外：<b style="color:${C}">\\(\\sqrt{${n}} = ${krTex(K, R)}\\)</b>。${best ? '' : `目前切成 \\(${krTex(k, inner)}\\)，根號裡的 \\(${inner}\\) 還有平方因數，還沒化完。`}`);
    typeset([out, fb]);
  }

  sn.addEventListener('input', () => { syncK(true); draw(); });
  sk.addEventListener('input', draw);
  syncK(false);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：分母有理化（分母是一個根式）
   ========================================================================== */
function initRatCanvas() {
  const cv = elById('canvas-rat');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sc = elById('ra-c'), sn = elById('ra-n');
  const vc = elById('ra-vc'), vn = elById('ra-vn');
  const mG = elById('ra-mode-group');
  const out = elById('ra-formula');
  const fb = elById('ra-feedback');
  const C = TL_TONE[5];
  let mode = 'direct';

  function draw() {
    const c = iv(sc), n = iv(sn);
    vc.textContent = c; vn.textContent = n;
    const [k, r] = rdSqf(n);
    const res = [rdTerm(c, n, n)];
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'direct' ? '分子分母同乘 √n，分母就沒有根號' : '先把分母化簡，再同乘最小的根號', C);

    const orig = VF(T(c, TL_TERRA), rtItem(n, TL_COBALT), INK);
    drawEqPanel(ctx, [orig, T('=', INK), ...rdItems(res, TL_JADE)], 84, C, { h: 36, size: 24 });

    const rows = [{ name: '原式', hint: '分母有根號', items: [orig] }];
    let note;
    if (r === 1) {
      rows.push({ name: '分母開得出來', hint: `√${n} = ${k}，不必有理化`, items: [T('=', INK), fracItem(c, k, TL_JADE)] });
      note = `${n} 是完全平方數，分母本來就不是根號`;
    } else if (mode === 'direct' || k === 1) {
      rows.push({ name: `同乘 √${n}`, hint: '分子分母同乘，值不變', items: [T('=', INK), VF(SEQ([T(c, TL_TERRA), T('×', INK), rtItem(n, C)], INK, 6), SEQ([rtItem(n, TL_COBALT), T('×', INK), rtItem(n, C)], INK, 6), INK)] });
      rows.push({ name: '分母變整數', hint: `√${n} × √${n} = ${n}`, items: [T('=', INK), VF(crItem(c, n, TL_TERRA), T(n, TL_COBALT), INK)] });
      const shown = { n: c, d: n, r: n };
      if (!(res[0].n === shown.n && res[0].d === shown.d && res[0].r === shown.r)) {
        rows.push({ name: '化簡', hint: k > 1 ? `√${n} = ${k}√${r}，再約分` : '約分', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
      }
      note = k === 1 ? '分母已經是最簡根式，兩種方法一樣' : `直接乘 √${n}：分子出現 √${n}，還得再化簡一次`;
    } else {
      rows.push({ name: '分母先化簡', hint: `√${n} = ${k}√${r}`, items: [T('=', INK), VF(T(c, TL_TERRA), crItem(k, r, TL_COBALT), INK)] });
      rows.push({ name: `同乘 √${r}`, hint: `只要乘 √${r} 就夠了`, items: [T('=', INK), VF(crItem(c, r, TL_TERRA), SEQ([T(k, TL_COBALT), T('×', INK), T(r, TL_COBALT)], INK, 4), INK)] });
      if (gcd(c, k * r) > 1) rows.push({ name: '約分', hint: '分子分母約分', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
      note = `先化簡分母，只要乘 √${r}，數字比較小`;
    }
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 160, gap: rows.length >= 4 ? 64 : 76, labX: 22, eqX: 176, size: 20, color: C });

    const v = c / Math.sqrt(n);
    drawPanel(ctx, 18, 406, cv.width - 36, 66, C, 0.06);
    exprLeft(ctx, [T('值不變：', INK), orig, T(`≈ ${ap(v)}`, TL_TERRA), T('，', INK), ...rdItems(res, TL_JADE), T(`≈ ${ap(rdVal(res))} ✓`, TL_JADE)], 34, 428, 15, INK, 470);
    textLeft(ctx, note, 34, 458, MUTED, f(600, 13));

    out.innerHTML = wbrEq(`\\frac{${c}}{\\sqrt{${n}}} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(r === 1
      ? `\\(\\sqrt{${n}} = ${k}\\)，分母本來就是整數：\\(\\frac{${c}}{\\sqrt{${n}}} = ${rdTex(res)}\\)。`
      : `分子分母同乘 \\(${mode === 'simp' && k > 1 ? `\\sqrt{${r}}` : `\\sqrt{${n}}`}\\)，等於乘 \\(1\\)，值不變，分母卻變成整數：<b style="color:${C}">\\(\\frac{${c}}{\\sqrt{${n}}} = ${rdTex(res)}\\)</b>。`);
    typeset([out, fb]);
  }

  [sc, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ra-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：根號裡是分數或小數
   ========================================================================== */
function initFracRootCanvas() {
  const cv = elById('canvas-fracroot');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('fr-p'), sq = elById('fr-q'), st = elById('fr-t');
  const vp = elById('fr-vp'), vq = elById('fr-vq'), vt = elById('fr-vt');
  const rowP = elById('fr-row-p'), rowQ = elById('fr-row-q'), rowT = elById('fr-row-t');
  const kG = elById('fr-kind-group'), mG = elById('fr-meth-group');
  const out = elById('fr-formula');
  const fb = elById('fr-feedback');
  const C = TL_TONE[6];
  let kind = 'frac', meth = 'm1';

  function kr(k, m, color) {
    return m === 1 ? T(k, color) : crItem(k, m, color);
  }

  function decOf(t) {
    if (t % 10 === 0) return String(t / 10);
    return `${Math.floor(t / 10)}.${t % 10}`;
  }

  function draw() {
    const p = iv(sp), q = iv(sq), t = iv(st);
    vp.textContent = p; vq.textContent = q; vt.textContent = decOf(t);
    rowP.style.display = kind === 'frac' ? '' : 'none';
    rowQ.style.display = kind === 'frac' ? '' : 'none';
    rowT.style.display = kind === 'dec' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, meth === 'm1' ? '方法一：分開開根號，再有理化' : '方法二：根號裡擴分，讓分母變平方數', C);

    let N, D, raw, rawTex;
    const rows = [];
    if (kind === 'frac') {
      [N, D] = reduce(p, q);
      raw = RT(FR(p, q, TL_TERRA), TL_TERRA);
      rawTex = `\\sqrt{\\frac{${p}}{${q}}}`;
      if (N !== p) rows.push({ name: '約分', hint: '根號裡先約分', items: [T('=', INK), D === 1 ? rtItem(N, TL_TERRA) : RT(FR(N, D, TL_TERRA), TL_TERRA)] });
    } else {
      [N, D] = reduce(t, 10);
      raw = rtItem(decOf(t), TL_TERRA);
      rawTex = `\\sqrt{${decOf(t)}}`;
      const it = [T('=', INK), RT(FR(t, 10, TL_TERRA), TL_TERRA)];
      if (D !== 10) it.push(T('=', INK), D === 1 ? rtItem(N, TL_TERRA) : RT(FR(N, D, TL_TERRA), TL_TERRA));
      rows.push({ name: '小數化分數', hint: `${decOf(t)} = ${t}/10`, items: it });
    }
    const res = [rdTerm(1, D, N * D)];
    drawEqPanel(ctx, [raw, T('=', INK), ...rdItems(res, TL_JADE)], 84, C, { h: 36, size: 24 });

    const [kN, rN] = rdSqf(N), [kD, rD] = rdSqf(D);
    let note;
    if (D === 1) {
      rows.push({ name: '化簡', hint: '根號裡其實是整數', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
      note = '根號裡約分後是整數，照重點 5 化簡就好';
    } else if (meth === 'm1') {
      rows.push({ name: '分開開根號', hint: '√(a/b) = √a / √b', items: [T('=', INK), VF(rtItem(N, TL_TERRA), rtItem(D, TL_COBALT), INK)] });
      if (kN > 1 || kD > 1) rows.push({ name: '分子分母化簡', hint: '提出平方因數', items: [T('=', INK), VF(kr(kN, rN, TL_TERRA), kr(kD, rD, TL_COBALT), INK)] });
      if (rD > 1) {
        const den = kD > 1 ? SEQ([T(kD, TL_COBALT), T('×', INK), T(rD, TL_COBALT)], INK, 4) : T(rD, TL_COBALT);
        rows.push({ name: `同乘 √${rD}`, hint: '分母有理化', items: [T('=', INK), VF(SEQ([kr(kN, rN, TL_TERRA), T('×', INK), rtItem(rD, C)], INK, 5), den, INK)] });
      }
      rows.push({ name: '結果', hint: '化成最簡根式', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
      note = '方法一：分子分母各自化簡，最後再有理化';
    } else {
      const s = rD, D2 = D * s, sq2 = kD * rD;
      if (s > 1) rows.push({ name: `根號裡擴分 × ${s}`, hint: `分母 ${D} × ${s} = ${D2} 是平方數`, items: [T('=', INK), RT(FR(N * s, D2, TL_TERRA), TL_TERRA)] });
      rows.push({ name: '分母開出來', hint: `√${D2} = ${sq2}`, items: [T('=', INK), VF(rtItem(N * s, TL_TERRA), T(sq2, TL_COBALT), INK)] });
      const shown = rdSqf(N * s);
      if (!(shown[0] === 1 && gcd(1, sq2) === 1 && res[0].d === sq2 && res[0].n === 1)) {
        rows.push({ name: '化簡', hint: '提出平方因數、約分', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
      }
      note = s > 1 ? `方法二：只要乘 ${s}，分母就開得出來` : `分母 ${D} 本來就是平方數，直接開`;
    }
    const gap = rows.length >= 5 ? 56 : (rows.length === 4 ? 64 : 76);
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 160, gap, labX: 22, eqX: 180, size: 20, color: C });

    drawPanel(ctx, 18, 410, cv.width - 36, 62, C, 0.06);
    exprLeft(ctx, [T('驗算：', INK), raw, T(`≈ ${ap(Math.sqrt(N / D))}`, TL_TERRA), T('，', INK), ...rdItems(res, TL_JADE), T(`≈ ${ap(rdVal(res))} ✓`, TL_JADE)], 34, 430, 15, INK, 470);
    textLeft(ctx, note, 34, 458, MUTED, f(600, 13));

    out.innerHTML = wbrEq(`${rawTex} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(D === 1
      ? `根號裡是 \\(${N}\\)，化簡得 \\(${rdTex(res)}\\)。`
      : `${kind === 'dec' ? `先把 \\(${decOf(t)}\\) 化成 \\(${fTex(t, 10)}\\)，` : ''}${meth === 'm1' ? '分開開根號、分母有理化' : `根號裡分子分母同乘 \\(${rD}\\)，讓分母變成平方數`}，得 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。兩種方法答案一樣。`);
    typeset([out, fb]);
  }

  [sp, sq, st].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(kG, 'data-fr-kind', v => { kind = v; draw(); });
  bindPickGroup(mG, 'data-fr-meth', v => { meth = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：同類方根——化成最簡根式後，根號裡相同的放同一箱
   ========================================================================== */
function initLikeCanvas() {
  const cv = elById('canvas-like');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('lk-n'), sm = elById('lk-m');
  const vn = elById('lk-vn'), vm = elById('lk-vm');
  const rowM = elById('lk-row-m');
  const mG = elById('lk-mode-group');
  const out = elById('lk-formula');
  const fb = elById('lk-feedback');
  const C = TL_TONE[7];
  let mode = 'int';
  const hist = [];
  const BINS = [2, 3, 5, 6, 7, 'other', 'none'];

  function cand(md, n, m) {
    if (md === 'int') return { raw: rtItem(n, INK), tex: `\\sqrt{${n}}`, val: rdTerm(1, 1, n), key: `i${n}` };
    if (md === 'frac') return { raw: RT(FR(m, n, INK), INK), tex: `\\sqrt{\\frac{${m}}{${n}}}`, val: rdTerm(1, n, m * n), key: `f${m}/${n}` };
    return { raw: VF(T(m, INK), rtItem(n, INK), INK), tex: `\\frac{${m}}{\\sqrt{${n}}}`, val: rdTerm(m, n, n), key: `u${m}/${n}` };
  }

  function binOf(r) {
    if (r === 1) return 'none';
    return [2, 3, 5, 6, 7].indexOf(r) >= 0 ? r : 'other';
  }

  function remember() {
    const c = cand(mode, iv(sn), iv(sm));
    const i = hist.findIndex(h => h.key === c.key);
    if (i >= 0) hist.splice(i, 1);
    hist.push(c);
    if (hist.length > 14) hist.shift();
  }

  function draw() {
    const n = iv(sn), m = iv(sm);
    vn.textContent = n; vm.textContent = m;
    rowM.style.display = mode === 'int' ? 'none' : '';
    const cur = cand(mode, n, m);
    const bin = binOf(cur.val.r);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '化成最簡根式，再看根號裡是多少', C);

    const col = rCol(cur.val.r);
    const simp = rdItems([cur.val], col);
    drawEqPanel(ctx, [cur.raw, T('=', INK), ...simp], 82, C, { h: 34, size: 25 });

    const X0 = 18, BW = (cv.width - 36) / 7, Y0 = 158, BH = 222;
    BINS.forEach((b, i) => {
      const x = X0 + i * BW;
      const bc = b === 'none' ? TL_RCOL[1] : (b === 'other' ? '#c4b5fd' : rCol(b));
      const on = b === bin;
      ctx.save();
      ctx.fillStyle = bc;
      ctx.globalAlpha = on ? 0.16 : 0.06;
      roundRect(ctx, x + 3, Y0, BW - 6, BH, 10);
      ctx.fill();
      ctx.globalAlpha = on ? 1 : 0.45;
      ctx.strokeStyle = bc;
      ctx.lineWidth = on ? 3 : 1.5;
      ctx.stroke();
      ctx.restore();
      if (typeof b === 'number') drawExpr(ctx, [rtItem(b, bc)], x + BW / 2, Y0 + BH - 22, 18, bc);
      else textCenter(ctx, b === 'none' ? '沒有根號' : '其他', x + BW / 2, Y0 + BH - 22, bc, f(800, 13));

      // 這一箱裡放過的磚（最新的在上面，最多 3 塊）
      const inBin = hist.filter(h => binOf(h.val.r) === b).slice(-3);
      inBin.forEach((h, j) => {
        const cy = Y0 + BH - 72 - j * 50;
        const isCur = h.key === cur.key;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        roundRect(ctx, x + 6, cy - 22, BW - 12, 44, 7);
        ctx.fill();
        ctx.strokeStyle = bc;
        ctx.lineWidth = isCur ? 2.5 : 1;
        ctx.stroke();
        ctx.restore();
        drawExpr(ctx, [h.raw], x + BW / 2, cy, 12.5, bc, { maxW: BW - 18 });
      });
    });
    // 目前這塊落進哪一箱
    const bi = BINS.indexOf(bin);
    const ax = X0 + (bi + 0.5) * BW;
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ax - 9, Y0 - 18); ctx.lineTo(ax + 9, Y0 - 18); ctx.lineTo(ax, Y0 - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const r = cur.val.r;
    drawNote(ctx, r === 1 ? '化簡後沒有根號：這是有理數，不是任何根式的同類方根'
      : `化成最簡根式後根號裡是 ${r}：它是 √${r} 的同類方根`, 414, col, 15);
    drawNote(ctx, '同一箱的都是同類方根；根號外的係數不影響', 446, MUTED, 13.5);

    out.innerHTML = wbrEq(`${cur.tex} = ${rdTex([cur.val])}`);
    fb.innerHTML = wrapFeedback(r === 1
      ? `\\(${cur.tex} = ${rdTex([cur.val])}\\)，化簡後根號不見了，是有理數。`
      : `\\(${cur.tex} = ${rdTex([cur.val])}\\)，根號裡是 \\(${r}\\)，所以它是 <b style="color:${col}">\\(\\sqrt{${r}}\\) 的同類方根</b>。`);
    typeset([out, fb]);
  }

  [sn, sm].forEach(s => {
    s.addEventListener('input', draw);
    s.addEventListener('change', () => { remember(); draw(); });
  });
  bindPickGroup(mG, 'data-lk-mode', v => { mode = v; remember(); draw(); });
  remember();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：根式的加減——同類方根才能合併
   ========================================================================== */
function initAddCanvas() {
  const cv = elById('canvas-add');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ad-a'), sm = elById('ad-m'), sb = elById('ad-b'), sn = elById('ad-n');
  const sx = elById('ad-x'), sy = elById('ad-y');
  const va = elById('ad-va'), vm = elById('ad-vm'), vb = elById('ad-vb'), vn = elById('ad-vn');
  const vx = elById('ad-vx'), vy = elById('ad-vy');
  const rowsMerge = ['ad-row-a', 'ad-row-m', 'ad-row-b', 'ad-row-n'].map(elById);
  const rowsMyth = ['ad-row-x', 'ad-row-y'].map(elById);
  const mG = elById('ad-mode-group');
  const out = elById('ad-formula');
  const fb = elById('ad-feedback');
  const C = TL_TONE[8];
  let mode = 'merge';
  skipZero(sb);

  // 一排 |c| 塊小方磚代表 c 個 √r；負的畫虛線（要扣掉）
  function tileStrip(c, r, x0, cy, maxW) {
    const cnt = Math.abs(c);
    const s = Math.min(22, (maxW - 4) / Math.max(1, cnt) - 3);
    const col = rCol(r);
    for (let i = 0; i < cnt; i++) {
      tlTile(ctx, x0 + i * (s + 3), cy - s / 2, s, s, c < 0 ? TL_ROSE : col, c < 0 ? { dash: [4, 3], glaze: false } : { glaze: false });
    }
    return x0 + cnt * (s + 3);
  }

  function rootLabel(r, color) {
    return r === 1 ? T('1', color) : rtItem(r, color);
  }

  function drawMerge(a, m, b, n) {
    const t1 = rdTerm(a, 1, m), t2 = rdTerm(b, 1, n);
    const sum = rdSum([t1, t2]);
    const same = t1.r === t2.r;
    const head = [crItem(a, m, TL_TERRA), T(b < 0 ? '−' : '+', INK), crItem(Math.abs(b), n, TL_COBALT), T('=', INK), ...rdItems(sum, TL_JADE, t => rCol(t.r))];
    drawEqPanel(ctx, head, 80, C, { h: 30, size: 23 });

    const LX = 22, TX = 196;
    exprLeft(ctx, [crItem(a, m, TL_TERRA), T('=', INK), ...rdItems([t1], rCol(t1.r))], LX, 158, 17, INK, 170);
    let e = tileStrip(t1.n, t1.r, TX, 158, 250);
    exprLeft(ctx, [T(`${Math.abs(t1.n)} 個`, INK), rootLabel(t1.r, rCol(t1.r))], e + 6, 158, 14, INK, 520 - e);
    exprLeft(ctx, [crItem(b, n, TL_COBALT), T('=', INK), ...rdItems([t2], rCol(t2.r))], LX, 214, 17, INK, 170);
    e = tileStrip(t2.n, t2.r, TX, 214, 250);
    exprLeft(ctx, [T(t2.n < 0 ? `扣 ${-t2.n} 個` : `${t2.n} 個`, INK), rootLabel(t2.r, t2.n < 0 ? TL_ROSE : rCol(t2.r))], e + 6, 214, 14, INK, 520 - e);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(22, 248); ctx.lineTo(518, 248); ctx.stroke();
    ctx.restore();

    if (same) {
      const net = t1.n + t2.n;
      textLeft(ctx, '同一種磚，合併：', LX, 284, OK_COLOR, f(800, 15));
      if (net === 0) textLeft(ctx, '剛好抵消，等於 0', TX, 284, INK, f(700, 15));
      else {
        e = tileStrip(net, t1.r, TX, 284, 250);
        exprLeft(ctx, [T(`${Math.abs(net)} 個`, INK), rootLabel(t1.r, net < 0 ? TL_ROSE : rCol(t1.r))], e + 6, 284, 14, INK, 520 - e);
      }
    } else {
      textLeft(ctx, '兩種磚不一樣：', LX, 284, TL_ROSE, f(800, 15));
      exprLeft(ctx, [rootLabel(t1.r, rCol(t1.r)), T('和', INK), rootLabel(t2.r, rCol(t2.r)), T('不能合併，分開寫', INK)], TX, 284, 15, INK, 320);
    }

    drawPanel(ctx, 18, 330, cv.width - 36, 136, C, 0.06);
    exprLeft(ctx, [T('① 各自化成最簡根式：', C)], 34, 354, 15, INK, 470);
    exprLeft(ctx, [T('=', INK), ...rdItems([t1], rCol(t1.r)), T(t2.n < 0 ? '−' : '+', INK), rdBodyItem({ n: Math.abs(t2.n), d: 1, r: t2.r }, rCol(t2.r))], 60, 384, 19, INK, 450);
    const step2 = !same ? '② 不是同類方根，不能合併：' : (t1.r === 1 ? '② 根號都開完了，整數直接計算：' : '② 同類方根，係數相加：');
    exprLeft(ctx, [T(step2, same ? C : TL_ROSE)], 34, 416, 15, INK, 470);
    const fin = same && t1.r !== 1
      ? [T('=', INK), GRP([T(mn(t1.n), INK), T(t2.n < 0 ? '−' : '+', INK), T(Math.abs(t2.n), INK)], '()', INK), rootLabel(t1.r, rCol(t1.r)), T('=', INK), ...rdItems(sum, TL_JADE, t => rCol(t.r))]
      : [T('=', INK), ...rdItems(sum, TL_JADE, t => rCol(t.r))];
    exprLeft(ctx, fin, 60, 446, 19, INK, 450);

    const mt = `${crTex(a, m)} ${b < 0 ? '-' : '+'} ${crTex(Math.abs(b), n)}`;
    out.innerHTML = wbrEq(`${mt} = ${rdTex([t1])} ${t2.n < 0 ? '-' : '+'} ${rdBodyTex(t2)} = ${rdTex(sum)}`);
    fb.innerHTML = wrapFeedback(same
      ? `化簡後兩項都是 \\(${t1.r === 1 ? '整數' : `\\sqrt{${t1.r}}`}\\)，是同類，係數直接相加：<b style="color:${C}">${wbrEq(rdTex(sum))}</b>。`
      : `化簡後一個是 \\(\\sqrt{${t1.r}}\\)${t1.r === 1 ? '（整數）' : ''}、一個是 \\(\\sqrt{${t2.r}}\\)${t2.r === 1 ? '（整數）' : ''}，<b style="color:${TL_ROSE}">不是同類方根，不能合併</b>，答案就是 \\(${rdTex(sum)}\\)。`);
  }

  function drawMyth(x, y) {
    const rx = Math.sqrt(x), ry = Math.sqrt(y), rs = Math.sqrt(x + y);
    drawEqPanel(ctx, [rtItem(x, TL_TERRA), T('+', INK), rtItem(y, TL_COBALT), T('≠', TL_ROSE), rtItem(x + y, TL_ROSE)], 80, C, { h: 30, size: 25 });

    const U = 38, X0 = 40;
    ctx.save();
    ctx.lineWidth = 9;
    ctx.strokeStyle = TL_TERRA;
    ctx.beginPath(); ctx.moveTo(X0, 176); ctx.lineTo(X0 + rx * U, 176); ctx.stroke();
    ctx.strokeStyle = TL_COBALT;
    ctx.beginPath(); ctx.moveTo(X0 + rx * U, 176); ctx.lineTo(X0 + (rx + ry) * U, 176); ctx.stroke();
    ctx.strokeStyle = TL_ROSE;
    ctx.setLineDash([10, 6]);
    ctx.beginPath(); ctx.moveTo(X0, 248); ctx.lineTo(X0 + rs * U, 248); ctx.stroke();
    ctx.restore();
    drawExpr(ctx, [rtItem(x, TL_TERRA)], X0 + rx * U / 2, 150, 15, TL_TERRA);
    drawExpr(ctx, [rtItem(y, TL_COBALT)], X0 + (rx + ry / 2) * U, 150, 15, TL_COBALT);
    drawExpr(ctx, [rtItem(x + y, TL_ROSE)], X0 + rs * U / 2, 222, 15, TL_ROSE);

    const kx = isqrt(x), ky = isqrt(y), ks = isqrt(x + y);
    const show = (n, k) => (k * k === n ? T(k, INK) : T(ap(Math.sqrt(n)), INK));
    exprLeft(ctx, [rtItem(x, TL_TERRA), T('+', INK), rtItem(y, TL_COBALT), T(kx * kx === x && ky * ky === y ? '=' : '≈', INK), T(kx * kx === x && ky * ky === y ? kx + ky : ap(rx + ry), TL_JADE)], 40, 302, 18, INK, 460);
    exprLeft(ctx, [rtItem(x + y, TL_ROSE), T(ks * ks === x + y ? '=' : '≈', INK), show(x + y, ks)], 40, 340, 18, INK, 460);
    if (x > y) {
      exprLeft(ctx, [T('減法也一樣：', MUTED), rtItem(x, TL_TERRA), T('−', INK), rtItem(y, TL_COBALT), T(`≈ ${ap(rx - ry)}`, INK), T('，', INK), rtItem(x - y, TL_ROSE), T(`≈ ${ap(Math.sqrt(x - y))}`, INK)], 40, 384, 15, INK, 470);
    } else {
      textLeft(ctx, `減法也一樣：√${x} − √${y} 是 ${x === y ? '0' : '負數'}，√(${x} − ${y}) ${x === y ? '也是 0，但只是碰巧' : '根本沒有意義'}`, 40, 384, MUTED, f(600, 13.5));
    }
    drawNote(ctx, '根號不能拆開來加減：只有同類方根才能合併', 440, TL_ROSE, 15);

    out.innerHTML = wbrEq(`\\sqrt{${x}} + \\sqrt{${y}} \\approx ${ap(rx + ry)}`) + '，<wbr>' + wbrEq(`\\sqrt{${x + y}} \\approx ${ap(rs)}`);
    fb.innerHTML = wrapFeedback(`兩段接起來是 \\(${ap(rx + ry)}\\)，\\(\\sqrt{${x + y}}\\) 卻只有 \\(${ap(rs)}\\)：<b style="color:${TL_ROSE}">\\(\\sqrt{${x}} + \\sqrt{${y}} \\ne \\sqrt{${x + y}}\\)</b>。`);
  }

  function draw() {
    const a = iv(sa), m = iv(sm), b = iv(sb), n = iv(sn), x = iv(sx), y = iv(sy);
    va.textContent = a; vm.textContent = m; vb.textContent = b; vn.textContent = n; vx.textContent = x; vy.textContent = y;
    rowsMerge.forEach(r => { r.style.display = mode === 'merge' ? '' : 'none'; });
    rowsMyth.forEach(r => { r.style.display = mode === 'myth' ? '' : 'none'; });
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'merge' ? '同一種磚才能合併' : '√a + √b 等於 √(a + b) 嗎？', C);
    if (mode === 'merge') drawMerge(a, m, b, n);
    else drawMyth(x, y);
    typeset([out, fb]);
  }

  [sa, sm, sb, sn, sx, sy].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ad-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：根式的四則運算——先乘除、後加減
   ========================================================================== */
function initMixCanvas() {
  const cv = elById('canvas-mix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('mx-a'), sb = elById('mx-b'), sc = elById('mx-c'), sk = elById('mx-k');
  const va = elById('mx-va'), vb = elById('mx-vb'), vc = elById('mx-vc'), vk = elById('mx-vk');
  const rowK = elById('mx-row-k');
  const mG = elById('mx-mode-group');
  const out = elById('mx-formula');
  const fb = elById('mx-feedback');
  const C = TL_TONE[9];
  let mode = 'chain';

  // 運算順序的工單：幾個方塊用箭頭串起來
  function flow(labels, y) {
    const w = 128, gap = 34;
    const total = labels.length * w + (labels.length - 1) * gap;
    let x = (cv.width - total) / 2;
    labels.forEach((lb, i) => {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      roundRect(ctx, x, y - 18, w, 36, 9);
      ctx.fill();
      ctx.strokeStyle = lb[1];
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, lb[0], x + w / 2, y, lb[1], f(800, 14));
      if (i < labels.length - 1) drawArrow(ctx, x + w + 6, y, x + w + gap - 6, y, INK, 2.5);
      x += w + gap;
    });
  }

  function drawChain(a, b, c) {
    const [N, D] = reduce(a * b, c);
    const res = [rdTerm(1, D, N * D)];
    drawEqPanel(ctx, [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('÷', INK), rtItem(c, TL_GOLD), T('=', INK), ...rdItems(res, TL_JADE)], 80, C, { h: 32, size: 24 });
    flow([['× 和 ÷', C], ['放進同一個根號', TL_GOLD], ['化成最簡根式', TL_JADE]], 148);

    const rows = [
      { name: '合成一個根號', hint: '乘除都可以放進同一個根號', items: [T('=', INK), RT(VF(SEQ([T(a, TL_TERRA), T('×', INK), T(b, TL_COBALT)], INK, 4), T(c, TL_GOLD), INK), INK)] }
    ];
    if (!(N === a * b && D === c)) rows.push({ name: '約分', hint: `${a * b}/${c} 約分`, items: [T('=', INK), D === 1 ? rtItem(N, INK) : RT(FR(N, D, INK), INK)] });
    const done = res[0].d === 1 && res[0].r === N && res[0].n === 1;
    if (!done || D !== 1) rows.push({ name: '化成最簡根式', hint: D === 1 ? '提出平方因數' : '分開開根號、分母有理化', items: [T('=', INK), ...rdItems(res, TL_JADE)] });
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 214, gap: 66, labX: 22, eqX: 180, size: 20, color: C });

    const v = Math.sqrt(a) * Math.sqrt(b) / Math.sqrt(c);
    drawPanel(ctx, 18, 418, cv.width - 36, 50, C, 0.06);
    exprLeft(ctx, [T('驗算：', INK), T(`${ap(Math.sqrt(a))} × ${ap(Math.sqrt(b))} ÷ ${ap(Math.sqrt(c))} ≈ ${ap(v)}`, INK), T('，', INK), ...rdItems(res, TL_JADE), T(`≈ ${ap(rdVal(res))} ✓`, TL_JADE)], 30, 443, 14, INK, 480);

    out.innerHTML = wbrEq(`\\sqrt{${a}} \\times \\sqrt{${b}} \\div \\sqrt{${c}} = \\sqrt{\\frac{${a} \\times ${b}}{${c}}} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(`連乘除可以全部放進同一個根號：\\(\\sqrt{\\frac{${a} \\times ${b}}{${c}}} = ${D === 1 ? `\\sqrt{${N}}` : `\\sqrt{${fTex(N, D)}}`}\\)，化成最簡根式得 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。`);
  }

  function drawOrder(a, b, c, k) {
    const prod = rdTerm(1, 1, a * b), t2 = rdTerm(-k, 1, c);
    const res = rdSum([prod, t2]);
    const same = prod.r === t2.r;
    drawEqPanel(ctx, [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('−', INK), crItem(k, c, TL_GOLD), T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))], 80, C, { h: 32, size: 23 });
    flow([['先乘除', C], ['化成最簡', TL_GOLD], ['再加減', TL_JADE]], 148);

    const rows = [
      { name: '先乘', hint: '乘法比減法先算', items: [rtItem(a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('=', INK), rtItem(a * b, TL_COBALT)] },
      { name: '各自化簡', hint: `√${a * b} 與 ${k}√${c} 化成最簡`, items: [T('=', INK), ...rdItems([prod], rCol(prod.r)), T('−', INK), rdBodyItem({ n: -t2.n, d: 1, r: t2.r }, rCol(t2.r))] },
      { name: same ? '同類合併' : '不能合併', hint: same ? '同類方根，係數相減' : '不是同類方根，到此為止', items: [T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 214, gap: 66, labX: 22, eqX: 180, size: 20, color: C });

    const wrong = rdMul([rdTerm(1, 1, a)], rdSum([rdTerm(1, 1, b), rdTerm(-k, 1, c)]));
    const differ = Math.abs(rdVal(wrong) - rdVal(res)) > 1e-9;
    drawPanel(ctx, 18, 410, cv.width - 36, 60, TL_ROSE, 0.06);
    exprLeft(ctx, [T('✗ 先算減法：', TL_ROSE), rtItem(a, TL_ROSE), GRP([rtItem(b, TL_ROSE), T('−', TL_ROSE), crItem(k, c, TL_ROSE)], '()', TL_ROSE), T(`≈ ${ap(rdVal(wrong))}`, TL_ROSE)], 30, 430, 15, INK, 480);
    textLeft(ctx, differ ? `正確答案 ≈ ${ap(rdVal(res))}，順序錯了答案就不一樣` : 'a = 1 時碰巧一樣，但順序還是要先乘除', 30, 456, MUTED, f(600, 13));

    out.innerHTML = wbrEq(`\\sqrt{${a}} \\times \\sqrt{${b}} - ${crTex(k, c)} = ${rdTex([prod])} - ${rdBodyTex({ n: -t2.n, d: 1, r: t2.r })} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(`先算乘法 \\(\\sqrt{${a}} \\times \\sqrt{${b}} = ${rdTex([prod])}\\)，再減 \\(${rdBodyTex({ n: -t2.n, d: 1, r: t2.r })}\\)：${same ? '同類方根可以合併，' : '不是同類方根，不能再合併，'}答案 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。`);
  }

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc), k = iv(sk);
    va.textContent = a; vb.textContent = b; vc.textContent = c; vk.textContent = k;
    rowK.style.display = mode === 'order' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'chain' ? '連乘除：全部放進同一個根號' : '有加減時：先乘除、後加減', C);
    if (mode === 'chain') drawChain(a, b, c);
    else drawOrder(a, b, c, k);
    typeset([out, fb]);
  }

  [sa, sb, sc, sk].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-mx-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：分配律——乘開、拆開，再化簡合併
   ========================================================================== */
function initDistCanvas() {
  const cv = elById('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ds-a'), sb = elById('ds-b'), sc = elById('ds-c'), sk = elById('ds-k'), sp = elById('ds-p');
  const va = elById('ds-va'), vb = elById('ds-vb'), vc = elById('ds-vc'), vk = elById('ds-vk'), vp = elById('ds-vp');
  const rowK = elById('ds-row-k'), rowP = elById('ds-row-p');
  const mG = elById('ds-mode-group');
  const out = elById('ds-formula');
  const fb = elById('ds-feedback');
  const C = TL_TONE[10];
  let mode = 'one';

  // 磁磚乘法表：rowHeads × colHeads，cells[i][j] 是化簡後的項
  function tileTable(rowHeads, colHeads, cells, y0) {
    const hw = 104, cw = 150, ch = 52, hh = 40;
    const W = hw + colHeads.length * cw;
    const x0 = (cv.width - W) / 2;
    colHeads.forEach((h, j) => {
      tlTile(ctx, x0 + hw + j * cw + 3, y0, cw - 6, hh - 4, MUTED, { alpha: 0.1, glaze: false });
      drawExpr(ctx, [h], x0 + hw + j * cw + cw / 2, y0 + hh / 2 - 2, 18, INK, { maxW: cw - 14 });
    });
    rowHeads.forEach((h, i) => {
      const y = y0 + hh + i * ch;
      tlTile(ctx, x0 + 3, y + 3, hw - 6, ch - 6, MUTED, { alpha: 0.1, glaze: false });
      drawExpr(ctx, [h], x0 + hw / 2, y + ch / 2, 18, INK, { maxW: hw - 12 });
      colHeads.forEach((_, j) => {
        const t = cells[i][j];
        const col = t.n < 0 ? TL_ROSE : rCol(t.r);
        tlTile(ctx, x0 + hw + j * cw + 3, y + 3, cw - 6, ch - 6, col, { alpha: 0.16 });
        drawExpr(ctx, rdItems([t], col), x0 + hw + j * cw + cw / 2, y + ch / 2, 18, col, { maxW: cw - 14 });
      });
    });
    textLeft(ctx, '同一種顏色的格子是同類方根，可以合併', x0, y0 + hh + rowHeads.length * ch + 18, MUTED, f(600, 12.5));
    return y0 + hh + rowHeads.length * ch;
  }

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc), k = iv(sk), p = iv(sp);
    va.textContent = a; vb.textContent = b; vc.textContent = c; vk.textContent = k; vp.textContent = p;
    rowK.style.display = mode === 'one' ? '' : 'none';
    rowP.style.display = mode === 'two' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);

    let head, rows, res, tex, msg;
    const grpAB = GRP([rtItem(a, TL_TERRA), T('+', INK), rtItem(b, TL_COBALT)], '()', INK);
    if (mode === 'one') {
      drawTitle(ctx, '一項乘括號：每一項都要乘到', C);
      const e1 = rdTerm(k, 1, a * b), e2 = rdTerm(k, 1, a * c);
      res = rdSum([e1, e2]);
      head = [crItem(k, a, TL_TERRA), GRP([rtItem(b, TL_COBALT), T('+', INK), rtItem(c, TL_COBALT)], '()', INK), T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))];
      drawEqPanel(ctx, head, 80, C, { h: 30, size: 23 });
      tileTable([crItem(k, a, TL_TERRA)], [rtItem(b, TL_COBALT), rtItem(c, TL_COBALT)], [[e1, e2]], 126);
      rows = [
        { name: '分配', hint: '括號裡每一項都乘', items: [T('=', INK), crItem(k, a, TL_TERRA), T('×', INK), rtItem(b, TL_COBALT), T('+', INK), crItem(k, a, TL_TERRA), T('×', INK), rtItem(c, TL_COBALT)] },
        { name: '根號相乘', hint: '√a × √b = √(ab)', items: [T('=', INK), crItem(k, a * b, INK), T('+', INK), crItem(k, a * c, INK)] },
        { name: '化簡、合併', hint: '同類方根才能合併', items: [T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))] }
      ];
      tex = `${crTex(k, a)}(\\sqrt{${b}} + \\sqrt{${c}}) = ${crTex(k, a * b)} + ${crTex(k, a * c)} = ${rdTex(res)}`;
      msg = `\\(${crTex(k, a)}\\) 分別乘 \\(\\sqrt{${b}}\\) 與 \\(\\sqrt{${c}}\\)，再各自化簡`;
    } else if (mode === 'div') {
      drawTitle(ctx, '括號除以根式：拆成兩個分數', C);
      const e1 = rdTerm(1, c, a * c), e2 = rdTerm(1, c, b * c);
      res = rdSum([e1, e2]);
      head = [grpAB, T('÷', INK), rtItem(c, TL_GOLD), T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))];
      drawEqPanel(ctx, head, 80, C, { h: 34, size: 23 });
      tileTable([SEQ([T('÷', INK), rtItem(c, TL_GOLD)], INK, 4)], [rtItem(a, TL_TERRA), rtItem(b, TL_COBALT)], [[e1, e2]], 126);
      const fr = (n) => { const [N, D] = reduce(n, c); return D === 1 ? rtItem(N, INK) : RT(FR(N, D, INK), INK); };
      rows = [
        { name: '拆成兩個分數', hint: '分子每一項都除以 √c', items: [T('=', INK), VF(rtItem(a, TL_TERRA), rtItem(c, TL_GOLD), INK), T('+', INK), VF(rtItem(b, TL_COBALT), rtItem(c, TL_GOLD), INK)] },
        { name: '根號相除', hint: '根號裡的數直接相除', items: [T('=', INK), fr(a), T('+', INK), fr(b)] },
        { name: '化簡、合併', hint: '有理化後同類方根合併', items: [T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))] }
      ];
      tex = `(\\sqrt{${a}} + \\sqrt{${b}}) \\div \\sqrt{${c}} = \\frac{\\sqrt{${a}}}{\\sqrt{${c}}} + \\frac{\\sqrt{${b}}}{\\sqrt{${c}}} = ${rdTex(res)}`;
      msg = `分子的兩項各自除以 \\(\\sqrt{${c}}\\)，化成最簡根式後再合併`;
    } else {
      drawTitle(ctx, '兩個括號相乘：展開成四項', C);
      const e = [rdTerm(1, 1, a * c), rdTerm(-p, 1, a), rdTerm(1, 1, b * c), rdTerm(-p, 1, b)];
      res = rdSum(e);
      head = [grpAB, GRP([rtItem(c, TL_GOLD), T('−', INK), T(p, TL_GOLD)], '()', INK), T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))];
      drawEqPanel(ctx, head, 80, C, { h: 30, size: 22 });
      tileTable([rtItem(a, TL_TERRA), rtItem(b, TL_COBALT)], [rtItem(c, TL_GOLD), T(`−${p}`.replace('-', '−'), TL_GOLD)], [[e[0], e[1]], [e[2], e[3]]], 126);
      rows = [
        { name: '展開成四項', hint: '每一項乘每一項', items: [T('=', INK), rtItem(a * c, INK), T('−', INK), crItem(p, a, INK), T('+', INK), rtItem(b * c, INK), T('−', INK), crItem(p, b, INK)] },
        { name: '各自化簡', hint: '提出平方因數', items: [T('=', INK), ...rdItems(e, INK, t => (t.n < 0 ? TL_ROSE : rCol(t.r)))] },
        { name: '合併', hint: '同類方根合併', items: [T('=', INK), ...rdItems(res, TL_JADE, t => rCol(t.r))] }
      ];
      tex = `(\\sqrt{${a}} + \\sqrt{${b}})(\\sqrt{${c}} - ${p}) = \\sqrt{${a * c}} - ${crTex(p, a)} + \\sqrt{${b * c}} - ${crTex(p, b)} = ${rdTex(res)}`;
      msg = `四格各乘一次，化簡後顏色相同的格子合併`;
    }
    const tableBottom = mode === 'two' ? 126 + 40 + 104 : 126 + 40 + 52;
    drawStepRows(ctx, numberRows(rows), 3, { top: tableBottom + 66, gap: 60, labX: 22, eqX: 170, size: 19, color: C });

    out.innerHTML = wbrEq(tex);
    fb.innerHTML = wrapFeedback(`${msg}，得 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。`);
    typeset([out, fb]);
  }

  [sa, sb, sc, sk, sp].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-ds-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：乘法公式用在根式——面積拼圖
   ========================================================================== */
function initFormulaCanvas() {
  const cv = elById('canvas-formula');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('fm-p'), sa = elById('fm-a'), sq = elById('fm-q'), sb = elById('fm-b');
  const vp = elById('fm-vp'), va = elById('fm-va'), vq = elById('fm-vq'), vb = elById('fm-vb');
  const mG = elById('fm-mode-group');
  const out = elById('fm-formula');
  const fb = elById('fm-feedback');
  const C = TL_TONE[11];
  let mode = 'sum';

  function region(x, y, w, h, color, label, opts) {
    tlTile(ctx, x, y, w, h, color, opts);
    if (label && w >= 44 && h >= 30) textCenter(ctx, label, x + w / 2, y + h / 2, color, f(800, Math.min(16, Math.min(w, h) * 0.4)));
  }

  function draw() {
    const p = iv(sp), a = iv(sa), q = iv(sq), b = iv(sb);
    vp.textContent = p; va.textContent = a; vq.textContent = q; vb.textContent = b;
    const xv = p * Math.sqrt(a), yv = q * Math.sqrt(b);
    const xItem = crItem(p, a, TL_TERRA);
    const yItem = b === 1 ? T(q, TL_COBALT) : crItem(q, b, TL_COBALT);
    const xTex = crTex(p, a), yTex = b === 1 ? String(q) : crTex(q, b);
    const x2 = p * p * a, y2 = q * q * b;
    const xy2 = rdTerm(2 * p * q, 1, a * b);
    let res, sign;
    if (mode === 'sum') { sign = 1; res = rdSum([{ n: x2, d: 1, r: 1 }, xy2, { n: y2, d: 1, r: 1 }]); }
    else if (mode === 'diff') { sign = -1; res = rdSum([{ n: x2, d: 1, r: 1 }, { n: -xy2.n, d: 1, r: xy2.r }, { n: y2, d: 1, r: 1 }]); }
    else { sign = 0; res = rdSum([{ n: x2, d: 1, r: 1 }, { n: -y2, d: 1, r: 1 }]); }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'sum' ? '和的平方：(x + y)² = x² + 2xy + y²' : (mode === 'diff' ? '差的平方：(x − y)² = x² − 2xy + y²' : '平方差：(x + y)(x − y) = x² − y²'), C);
    const lhs = mode === 'dsq'
      ? [GRP([xItem, T('+', INK), yItem], '()', INK), GRP([xItem, T('−', INK), yItem], '()', INK)]
      : [PW(GRP([xItem, T(mode === 'sum' ? '+' : '−', INK), yItem], '()', INK), 2, false, INK)];
    drawEqPanel(ctx, [...lhs, T('=', INK), ...rdItems(res, TL_JADE)], 80, C, { h: 32, size: 23 });

    // 面積拼圖（同一個比例尺）
    const X0 = 30, Y0 = 128, S = 190;
    if (mode === 'sum') {
      const s = S / (xv + yv), X = xv * s, Y = yv * s;
      region(X0, Y0, X, X, TL_TERRA, 'x²');
      region(X0 + X, Y0, Y, X, TL_COBALT, 'xy');
      region(X0, Y0 + X, X, Y, TL_COBALT, 'xy');
      region(X0 + X, Y0 + X, Y, Y, TL_JADE, 'y²');
      textCenter(ctx, '邊長 x + y', X0 + S / 2, Y0 + S + 16, INK, f(700, 13));
    } else if (Math.abs(xv - yv) < 1e-9) {
      textCenter(ctx, 'x = y', X0 + S / 2, Y0 + S / 2 - 14, INK, f(800, 18));
      textCenter(ctx, mode === 'diff' ? '(x − y)² = 0' : 'x² − y² = 0', X0 + S / 2, Y0 + S / 2 + 14, INK, f(700, 15));
    } else {
      const big = Math.max(xv, yv), small = Math.min(xv, yv);
      const s = S / big, B = S, m = small * s;
      if (mode === 'diff') {
        region(X0, Y0, B - m, B - m, TL_JADE, '(x−y)²');
        tlTile(ctx, X0 + B - m, Y0, m, B, TL_COBALT, { alpha: 0.18, dash: [5, 4] });
        tlTile(ctx, X0, Y0 + B - m, B, m, TL_COBALT, { alpha: 0.18, dash: [5, 4] });
        tlTile(ctx, X0 + B - m, Y0 + B - m, m, m, TL_GOLD, { alpha: 0.35 });
        textCenter(ctx, `邊長 ${xv >= yv ? 'x' : 'y'}；藍色是兩條 xy，金色重疊的 y² 扣了兩次要加回來`, 270, Y0 + S + 16, MUTED, f(600, 12));
      } else {
        region(X0, Y0, B, B - m, TL_TERRA, '');
        region(X0, Y0 + B - m, B - m, m, TL_TERRA, '');
        tlTile(ctx, X0 + B - m, Y0 + B - m, m, m, TL_ROSE, { alpha: 0.12, dash: [5, 4] });
        if (B - m >= 44) textCenter(ctx, xv > yv ? 'x² − y²' : 'y² − x²', X0 + (B - m) / 2, Y0 + (B - m) / 2, TL_TERRA, f(800, 16));
        textCenter(ctx, xv > yv ? '大正方形挖掉一角 y²，剩下的橘色是 x² − y²' : 'x < y：x² − y² 是負的', X0 + S / 2 + 20, Y0 + S + 16, MUTED, f(600, 12.5));
      }
    }

    // 右邊：各塊的面積
    const RX = 250;
    exprLeft(ctx, [IT('x', TL_TERRA), T('=', INK), xItem, T(`≈ ${ap(xv)}`, TL_TERRA)], RX, 138, 16, INK, 270);
    exprLeft(ctx, [IT('y', TL_COBALT), T('=', INK), yItem, T(`≈ ${ap(yv)}`, TL_COBALT)], RX, 172, 16, INK, 270);
    exprLeft(ctx, [PW(IT('x', TL_TERRA), 2, false, TL_TERRA), T('=', INK), PW(xItem, 2, true, TL_TERRA), T('=', INK), T(x2, TL_TERRA)], RX, 216, 16, INK, 270);
    if (mode !== 'dsq') exprLeft(ctx, [SEQ([T('2', TL_COBALT), IT('x', TL_COBALT), IT('y', TL_COBALT)], TL_COBALT, 1), T('=', INK), ...rdItems([xy2], TL_COBALT)], RX, 256, 16, INK, 270);
    exprLeft(ctx, [PW(IT('y', TL_JADE), 2, false, TL_JADE), T('=', INK), PW(yItem, 2, true, TL_JADE), T('=', INK), T(y2, TL_JADE)], RX, mode === 'dsq' ? 256 : 296, 16, INK, 270);

    // 下方：步驟
    const f1 = mode === 'sum' ? '(x+y)²=x²+2xy+y²' : (mode === 'diff' ? '(x−y)²=x²−2xy+y²' : '(x+y)(x−y)=x²−y²');
    const rows = [
      { name: '套公式', hint: 'x、y 各代表一項', items: [inkItems(f1, INK)] },
      { name: '算 x²', hint: '係數平方 × 根號裡的數', items: [PW(xItem, 2, true, TL_TERRA), T('=', INK), ...(p > 1 ? [PW(T(p, TL_TERRA), 2, false, TL_TERRA), T('×', INK), T(a, TL_TERRA), T('=', INK)] : []), T(x2, TL_TERRA)] }
    ];
    if (mode !== 'dsq') rows.push({ name: '算 2xy', hint: '2 × 係數 × 係數 × 根號相乘', items: [T('2', TL_COBALT), T('×', INK), xItem, T('×', INK), yItem, T('=', INK), ...rdItems([xy2], TL_COBALT)] });
    rows.push({ name: '算 y²', hint: '係數平方 × 根號裡的數', items: [PW(yItem, 2, true, TL_JADE), T('=', INK), T(y2, TL_JADE)] });
    const mid = mode === 'sum' ? [T(x2, TL_TERRA), T('+', INK), ...rdItems([xy2], TL_COBALT), T('+', INK), T(y2, TL_JADE)]
      : (mode === 'diff' ? [T(x2, TL_TERRA), T('−', INK), ...rdItems([xy2], TL_COBALT), T('+', INK), T(y2, TL_JADE)]
        : [T(x2, TL_TERRA), T('−', INK), T(y2, TL_JADE)]);
    rows.push({ name: '合併', hint: '整數和整數合併', items: [T('=', INK), ...mid, T('=', INK), ...rdItems(res, TL_JADE)] });
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 368, gap: rows.length === 5 ? 46 : 56, labX: 22, eqX: 170, size: 19, color: C });

    const lhsTex = mode === 'dsq' ? `(${xTex} + ${yTex})(${xTex} - ${yTex})` : `(${xTex} ${mode === 'sum' ? '+' : '-'} ${yTex})^2`;
    const midTex = mode === 'dsq' ? `${x2} - ${y2}` : `${x2} ${mode === 'sum' ? '+' : '-'} ${rdBodyTex(xy2)} + ${y2}`;
    out.innerHTML = wbrEq(`${lhsTex} = ${midTex} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(mode === 'dsq'
      ? `\\(x = ${xTex}\\)、\\(y = ${yTex}\\)，平方差 \\(x^2 - y^2 = ${x2} - ${y2}\\)，根號全部消失：<b style="color:${C}">${wbrEq(rdTex(res))}</b>。`
      : `\\(x^2 = ${x2}\\)、\\(2xy = ${rdBodyTex(xy2)}\\)、\\(y^2 = ${y2}\\)，${sign > 0 ? '相加' : '中間項相減'}得 <b style="color:${C}">${wbrEq(rdTex(res))}</b>。<br><span style="color:${TL_ROSE}">✗ 漏掉中間項會寫成 \\(${x2} + ${y2}\\)。</span>`);
    typeset([out, fb]);
  }

  [sp, sa, sq, sb].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(mG, 'data-fm-mode', v => { mode = v; draw(); });
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 13：分母是兩項時——乘共軛，用平方差消掉根號
   ========================================================================== */
function initConjCanvas() {
  const cv = elById('canvas-conj');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sc = elById('cj-c'), sa = elById('cj-a'), sb = elById('cj-b'), sp = elById('cj-p');
  const vc = elById('cj-vc'), va = elById('cj-va'), vb = elById('cj-vb'), vp = elById('cj-vp');
  const rowA = elById('cj-row-a'), rowP = elById('cj-row-p');
  const kG = elById('cj-kind-group'), sG = elById('cj-sign-group');
  const out = elById('cj-formula');
  const fb = elById('cj-feedback');
  const C = TL_TONE[12];
  let kind = 'rr', sgn = 1;

  function draw() {
    const c = iv(sc), a = iv(sa), b = iv(sb), p = iv(sp);
    vc.textContent = c; va.textContent = a; vb.textContent = b; vp.textContent = p;
    rowA.style.display = kind === 'rr' ? '' : 'none';
    rowP.style.display = kind === 'ir' ? '' : 'none';
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '分母乘它的共軛，平方差把根號消掉', C);

    const xItem = kind === 'rr' ? rtItem(a, TL_TERRA) : T(p, TL_TERRA);
    const xTex = kind === 'rr' ? `\\sqrt{${a}}` : String(p);
    const xSq = kind === 'rr' ? a : p * p;
    const yItem = rtItem(b, TL_COBALT);
    const op = sgn > 0 ? '+' : '−', cop = sgn > 0 ? '−' : '+';
    const opT = sgn > 0 ? '+' : '-', copT = sgn > 0 ? '-' : '+';
    const den = SEQ([xItem, T(op, INK), yItem], INK, 6);
    const conj = SEQ([xItem, T(cop, C), yItem], C, 6);
    const N = xSq - b;
    const origTex = `\\frac{${c}}{${xTex} ${opT} \\sqrt{${b}}}`;
    const orig = VF(T(c, INK), den, INK);

    if (N === 0 && sgn < 0) {
      drawEqPanel(ctx, [orig], 84, TL_ROSE, { h: 36, size: 26 });
      const why = kind === 'rr' ? `√${a} − √${b} = 0` : `${p} − √${b} = ${p} − ${p} = 0`;
      drawNote(ctx, `分母 ${why}，這個分數沒有意義（情境不成立）`, 210, TL_ROSE, 17);
      drawNote(ctx, kind === 'rr' ? '把 a 或 b 調成不一樣的數' : `把 b 調成不是 ${p * p} 的數`, 250, INK, 15);
      out.innerHTML = `\\( ${origTex} \\)<wbr>\\(\\text{ 的分母是 } 0 \\)`;
      fb.innerHTML = wrapFeedback(`<span style="color:${TL_ROSE}">分母是 \\(0\\)，這個分數不存在。</span>${kind === 'rr' ? '把 \\(a\\)、\\(b\\) 調成不同的數' : `把 \\(b\\) 調成不是 \\(${p * p}\\) 的數`}再試。`);
      typeset([out, fb]);
      return;
    }

    let res, rows;
    if (N === 0) {
      // 分母 = 2X：兩項其實一樣，乘共軛會乘到 0
      res = kind === 'rr' ? [rdTerm(c, 2 * a, a)] : [rdTerm(c, 2 * p, 1)];
      drawEqPanel(ctx, [orig, T('=', INK), ...rdItems(res, TL_JADE)], 84, C, { h: 36, size: 24 });
      rows = [
        { name: '兩項一樣', hint: '共軛會變成 0，不能乘', items: [T('=', INK), VF(T(c, INK), SEQ([T('2', TL_TERRA), xItem], TL_TERRA, 2), INK)] },
        { name: '照重點 6', hint: kind === 'rr' ? '分母只剩一個根式' : '分母沒有根號', items: [T('=', INK), ...rdItems(res, TL_JADE)] }
      ];
      drawStepRows(ctx, numberRows(rows), 2, { top: 220, gap: 76, labX: 22, eqX: 180, size: 21, color: C });
      drawNote(ctx, kind === 'rr' ? `a = b 時分母是 2√${a}，乘共軛 (√${a} − √${b}) 會變成乘 0` : `√${b} = ${p}：分母其實是 ${2 * p}`, 420, TL_GOLD, 14);
      out.innerHTML = wbrEq(`${origTex} = ${rdTex(res)}`);
      fb.innerHTML = wrapFeedback(`兩項相同，分母是 \\(2 \\times ${xTex}\\)，共軛會是 \\(0\\)，不能用；直接照單一根式處理得 \\(${rdTex(res)}\\)。`);
      typeset([out, fb]);
      return;
    }

    const tX = kind === 'rr' ? rdTerm(c, N, a) : rdTerm(c * p, N, 1);
    const tY = rdTerm(-sgn * c, N, b);
    // 正的那一項寫前面（例：(√5 − √3)/2，而不是 −√3/2 + √5/2）
    res = rdSum(tX.n < 0 && tY.n > 0 ? [tY, tX] : [tX, tY]);
    drawEqPanel(ctx, [orig, T('=', INK), ...rdItems(res, TL_JADE)], 84, C, { h: 36, size: 24 });

    // 配對：分母與共軛只差中間的符號
    const PY = 160;
    drawExpr(ctx, [GRP([den], '()', INK), T('×', INK), GRP([conj], '()', C), T('=', INK),
      PW(xItem, 2, kind === 'rr', TL_TERRA), T('−', INK), PW(yItem, 2, true, TL_COBALT), T('=', INK), T(xSq, TL_TERRA), T('−', INK), T(b, TL_COBALT), T('=', INK), T(mn(N), TL_JADE)], cv.width / 2, PY, 19, INK, { maxW: 500 });
    textCenter(ctx, '共軛：兩項相同，只有中間的正負號相反', cv.width / 2, PY + 32, C, f(700, 13.5));

    rows = [
      { name: '同乘共軛', hint: '分子分母一起乘，值不變', items: [T('=', INK), VF(SEQ([T(c, INK), GRP([conj], '()', C)], INK, 3), SEQ([GRP([den], '()', INK), GRP([conj], '()', C)], INK, 3), INK)] },
      { name: '分母平方差', hint: `${xSq} − ${b} = ${N}`, items: [T('=', INK), VF(SEQ([T(c, INK), GRP([conj], '()', C)], INK, 3), T(mn(N), TL_JADE), INK)] },
      { name: '化簡', hint: N < 0 ? '分母是負的，正負號提到前面' : '約分', items: [T('=', INK), ...rdItems(res, TL_JADE)] }
    ];
    drawStepRows(ctx, numberRows(rows), 3, { top: 244, gap: 70, labX: 22, eqX: 170, size: 20, color: C });

    const v = c / ((kind === 'rr' ? Math.sqrt(a) : p) + sgn * Math.sqrt(b));
    drawPanel(ctx, 18, 432, cv.width - 36, 50, C, 0.06);
    exprLeft(ctx, [T('驗算：', INK), orig, T(`≈ ${ap(v)}`, INK), T('，', INK), ...rdItems(res, TL_JADE), T(`≈ ${ap(rdVal(res))} ✓`, TL_JADE)], 30, 457, 14, INK, 480);

    const conjTex = `${xTex} ${copT} \\sqrt{${b}}`;
    out.innerHTML = wbrEq(`${origTex} = \\frac{${c}(${conjTex})}{${N}} = ${rdTex(res)}`);
    fb.innerHTML = wrapFeedback(`分子分母同乘共軛 \\((${conjTex})\\)，分母變成 \\(${xSq} - ${b} = ${N}\\)，根號不見了：<b style="color:${C}">${wbrEq(rdTex(res))}</b>。`);
    typeset([out, fb]);
  }

  [sc, sa, sb, sp].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(kG, 'data-cj-kind', v => { kind = v; draw(); });
  bindPickGroup(sG, 'data-cj-sign', v => { sgn = v === '+' ? 1 : -1; draw(); });
  drawWithFonts(draw);
}
