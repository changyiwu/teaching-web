/* ==========================================================================
   4-1-3（第四冊 1-3）等比數列 — 互動 Canvas 與隨堂評量
   畫風：Art Deco 復古戲院海報風（小映、阿幕），第 1 章三節共用。
   配色：金 GS_GOLD、孔雀藍 GS_TEAL、奶油 GS_CREAM；
   玫瑰 GS_ROSE 是「不成立、錯誤」、翡翠綠 GS_JADE 是「成立、答案」。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／FR／VF／RT／measure／
   drawExpr／drawPanel／drawTitle／drawStepRows／wbrEq…），本檔只放本節的
   色票、有理數小工具，以及 12 個互動。

   數列的每一項一律用化成最簡的有理數 [分子, 分母] 計算（分母為正），
   不用浮點數判斷「比值相等」。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initDefCanvas();
  initListCanvas();
  initFillCanvas();
  initNthCanvas();
  initBackCanvas();
  initSubCanvas();
  initGrowCanvas();
  initBounceCanvas();
  initMidCanvas();
  initEqCanvas();
  initSymCanvas();
  initBothCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（GS_ = Geometric Sequence；共用檔沒有這個前綴）
   ========================================================================== */

const GS_GOLD = '#fcd34d';
const GS_TEAL = '#5eead4';
const GS_CREAM = '#fef3c7';
const GS_ROSE = '#fb7185';
const GS_JADE = '#6ee7b7';
const GS_SKY = '#93c5fd';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const GS_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264', '#67e8f9', '#fca5a5'];

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

// 不含 0 的整數清單：[-n, …, -1, 1, …, n]（滑桿用索引取值）
function nzList(n) {
  const out = [];
  for (let v = -n; v <= n; v++) if (v !== 0) out.push(v);
  return out;
}

/* --------------------------------------------------------------------------
   有理數：一律以化成最簡的 [分子, 分母] 表示，分母為正。
   四則運算、qTex／qTexP／qTexM、qIt／qOpIt／qPowIt 在 math-canvas.js
   -------------------------------------------------------------------------- */
function rIsZero(a) { return a[0] === 0; }

// "−1/2"、"3/2"、"-3" → 有理數
function rParse(s) {
  const t = String(s).split('/');
  return qOf(parseInt(t[0], 10), t[1] ? parseInt(t[1], 10) : 1);
}

// canvas 上的純文字（標題用）："−1/2"
function rTxt(a) {
  return mn(a[0]) + (a[1] === 1 ? '' : '/' + a[1]);
}

function powTex(a, e) {
  if (e === 1) return qTexM(a);
  return `${qNeedP(a) ? qTexP(a) : qTex(a)}^{${e}}`;
}

// 一串數，每個各自包一段 \( \)，中間用逗號，窄螢幕才換得了行
function listTex(arr) {
  return arr.map(a => `\\(${qTex(a)}\\)`).join(', ');
}

/* --------------------------------------------------------------------------
   canvas 元件
   -------------------------------------------------------------------------- */

function mulIt(a, color) {
  return SEQ([T('×', color), qOpIt(a, color)], color, 3);
}

function divIt(a, color) {
  return SEQ([T('÷', color), qOpIt(a, color)], color, 3);
}

// 一列推導（drawStepRows 的列）
function row(name, hint, items, color) {
  return { name, hint, items, color };
}

// n 張卡片在 [left, right] 之間平均排開，回傳每張的中心 x
function rowXs(n, left, right, w) {
  if (n === 1) return [(left + right) / 2];
  const g = (right - left - n * w) / (n - 1);
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(left + w / 2 + i * (w + g));
  return xs;
}

// 一張 Art Deco 票卡：半透明填色、外框、內框細線
function gsCard(ctx, cx, y, w, h, color, item, opts) {
  const o = opts || {};
  const x = cx - w / 2;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.16 : o.alpha;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 2;
  if (o.dash) ctx.setLineDash(o.dash);
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 3);
  ctx.stroke();
  ctx.restore();
  if (item) drawExpr(ctx, [item], cx, y + h / 2, o.size || 18, o.ink || GS_CREAM, { maxW: w - 12, gap: 4 });
}

// 兩張卡片之間的跳躍弧線：below 為 true 時畫在下方（往回除）
function gsHop(ctx, x1, x2, y, color, label, below) {
  const s = below ? 1 : -1;
  const mx = (x1 + x2) / 2;
  const cy = y + s * 30;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo(mx, cy, x2, y);
  ctx.stroke();
  const ang = Math.atan2(y - cy, x2 - mx);
  const hs = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.45), y - hs * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.45), y - hs * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (label) drawExpr(ctx, [label], mx, y + s * 36, 13, color, { maxW: Math.max(44, Math.abs(x2 - x1) + 24), gap: 2 });
}

// 小方格：上面一行小字、下面一個元件
function gsChip(ctx, cx, y, w, h, color, top, item, size) {
  drawPanel(ctx, cx - w / 2, y, w, h, color, 0.12);
  if (top) textCenter(ctx, top, cx, y + 13, color, f(700, 11.5));
  if (item) drawExpr(ctx, [item], cx, top ? y + h * 0.62 : y + h / 2, size || 15, color, { maxW: w - 8, gap: 3 });
}

function gsLine(ctx, x1, y1, x2, y2, color, width, dash) {
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

function surdIt(k, r, color) {
  if (r === 1) return T(k, color);
  if (k === 1) return RT(T(r, color), color);
  return SEQ([T(k, color), RT(T(r, color), color)], color, 1);
}

function surdTex(k, r) {
  if (r === 1) return String(k);
  return `${k === 1 ? '' : k}\\sqrt{${r}}`;
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

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 1-3 的 24 題正解
  // 正解字母分布：A 6 題、B 6 題、C 6 題、D 6 題（開發約束 36）
  const answers = {
    '1-3-1': 'B',    // 81, −27, 9, −3 是公比 −1/3 的等比數列
    '1-3-2': 'C',    // 公比可以是負數或分數
    '1-3-3': 'A',    // 首項 7、公比 −2 → 7, −14, 28, −56
    '1-3-4': 'D',    // −64、公比 −1/2，第 6 項 2
    '1-3-5': 'A',    // □, −12, 48, □ → 3 與 −192
    '1-3-6': 'B',    // □, 10b, 4b, □ → 25b 與 8b/5
    '1-3-7': 'C',    // (−7) × 2⁵ = −224
    '1-3-8': 'D',    // 3, 12, 48 → 3 × 4^(n−1)
    '1-3-9': 'C',    // a₃ = 18、a₄ = −54 → a₁ = 2
    '1-3-10': 'D',   // 64, 16, 4 → a₇ = 1/64
    '1-3-11': 'B',   // 公比 −5，取偶數項 → 25
    '1-3-12': 'D',   // a₁₀ ÷ a₇ = (−3)³ = −27
    '1-3-13': 'B',   // 0.3 × 4^(n−1) = 76.8 → 第 5 天
    '1-3-14': 'A',   // 2 × 5^(n−1) = 250 → 第 4 輪
    '1-3-15': 'A',   // 第 0 格是首項，第 4 格是 4⁴ = 256
    '1-3-16': 'C',   // 首項是第 1 次彈跳 100 公分 → 第 4 次
    '1-3-17': 'B',   // 3, x, 48 → ±12
    '1-3-18': 'D',   // a₅² = 12 × 27 → ±18
    '1-3-19': 'A',   // (x + 9)² = (x + 3)(x + 24) → x = 1
    '1-3-20': 'C',   // (x + 2)² = (x − 2)(x + 10) → x = 6
    '1-3-21': 'C',   // 中間項 −7 → (−7)³ = −343
    '1-3-22': 'D',   // a × c = b² = 6 × 24 = 144
    '1-3-23': 'A',   // −8, −8, −8, −8
    '1-3-24': 'B'    // 公比 1 的等比數列也是等差數列
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
   重點 1：比值檢查機——每一組「後項 ÷ 前項」都相等才是等比數列
   ========================================================================== */
function initDefCanvas() {
  const cv = elById('canvas-def');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('df-a'), sd = elById('df-d');
  const va = elById('df-va'), vd = elById('df-vd');
  const g = elById('df-r-group');
  const out = elById('df-formula');
  const fb = elById('df-feedback');
  const C = GS_TONE[0];
  const AS = nzList(5);
  let rS = '2';

  function draw() {
    const a = AS[iv(sa)], d = iv(sd);
    const r = rParse(rS);
    va.textContent = a;
    vd.textContent = d > 0 ? '+' + d : String(d);
    const W = cv.width;

    const terms = [];
    for (let i = 0; i < 5; i++) terms.push(qMul([a, 1], qPow(r, i)));
    terms[3] = qAdd(terms[3], [d, 1]);
    const ratios = [], diffs = [];
    for (let i = 1; i < 5; i++) {
      ratios.push(rIsZero(terms[i - 1]) ? null : qDiv(terms[i], terms[i - 1]));
      diffs.push(qSub(terms[i], terms[i - 1]));
    }
    const hasZero = terms.some(rIsZero);
    const first = ratios[0];
    const same = ratios.map(q => q !== null && qEq(q, first));
    const isGeo = !hasZero && same.every(Boolean);
    const isArith = diffs.every(q => qEq(q, diffs[0]));
    const bad = same.indexOf(false);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '檢查每一組相鄰兩項：後項 ÷ 前項', C);

    const xs = rowXs(5, 20, 520, 82);
    xs.forEach((x, i) => {
      const edited = (i === 3 && d !== 0);
      const col = rIsZero(terms[i]) ? GS_ROSE : (edited ? GS_SKY : GS_GOLD);
      gsCard(ctx, x, 60, 82, 56, col, qIt(terms[i], GS_CREAM), { dash: edited ? [5, 4] : null });
      subLabel(ctx, 'a', i + 1, x, 132, edited ? GS_SKY : MUTED, 15);
    });
    if (d !== 0) textCenter(ctx, '改動過', xs[3], 49, GS_SKY, f(700, 12));

    // 相鄰兩項的比
    for (let i = 0; i < 4; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const q = ratios[i];
      const col = q === null ? GS_ROSE : (same[i] ? GS_JADE : GS_ROSE);
      const item = q === null ? T('÷ 0 無意義', GS_ROSE) : qIt(q, col);
      gsChip(ctx, cx, 150, 90, 64, col, `第 ${i + 2} 項 ÷ 第 ${i + 1} 項`, item, 16);
    }

    // 相鄰兩項的差（對照等差）
    textCenter(ctx, '相鄰兩項的差（等差數列看這一排）', W / 2, 236, MUTED, f(700, 13));
    for (let i = 0; i < 4; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      gsChip(ctx, cx, 250, 90, 48, isArith ? GS_SKY : DIM, null, qIt(diffs[i], isArith ? GS_SKY : MUTED), 15);
    }

    // 判定
    const vcol = isGeo ? GS_JADE : GS_ROSE;
    drawPanel(ctx, 20, 318, W - 40, 82, vcol, 0.1);
    let line1, line2;
    if (isGeo) {
      line1 = exprItems('是等比數列，公比 r = @0', GS_JADE, [qIt(first, GS_JADE)]);
      line2 = isArith ? '每一項都相同，所以也是公差 0 的等差數列' : '每一組比值都相等';
    } else if (hasZero) {
      line1 = exprItems('不是等比數列：出現 0 這一項', GS_ROSE);
      line2 = '0 不能當除數；等比數列的每一項都不是 0';
    } else {
      line1 = exprItems(`不是等比數列：第 ${bad + 1} 組的比值 @0 ≠ @1`, GS_ROSE, [qIt(ratios[bad], GS_ROSE), qIt(first, GS_ROSE)]);
      line2 = '只要有一組不同，就不是等比數列';
    }
    drawExpr(ctx, line1, W / 2, 344, 19, vcol, { maxW: W - 70, gap: 6 });
    textCenter(ctx, line2, W / 2, 378, MUTED, f(700, 14));

    textCenter(ctx, '公比可以是負數或分數，但不能是 0', W / 2, 430, DIM, f(700, 13));

    const ratioTex = ratios.map(q => q === null ? '無意義' : `\\(${qTex(q)}\\)`).join(', ');
    out.innerHTML = `數列 ${listTex(terms)}<br>比值 ${ratioTex}`;
    fb.innerHTML = wrapFeedback(isGeo
      ? `每一組「後項 ÷ 前項」都是 \\(${qTex(first)}\\)，所以是公比 \\(${qTex(first)}\\) 的等比數列。${isArith ? '每一項都相同時，它同時也是等差數列（見重點 12）。' : '把「改動第 4 項」拉離 \\(0\\) 看看。'}`
      : (hasZero
        ? `第 4 項變成 \\(0\\) 了：第 \\(5\\) 項 \\(\\div\\) 第 \\(4\\) 項要除以 \\(0\\)，等比數列裡不能有 \\(0\\)。`
        : `只改了第 \\(4\\) 項，第 \\(3\\)、\\(4\\) 兩組的比值就跟第 \\(1\\) 組不同了。檢查等比數列，<b>每一組</b>都要看。`));
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-df-r', v => { rS = v; draw(); });
  [sa, sd].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：乘法鏈——一項接一項乘 r
   ========================================================================== */
function initListCanvas() {
  const cv = elById('canvas-list');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ls-a');
  const va = elById('ls-va');
  const g = elById('ls-r-group');
  const out = elById('ls-formula');
  const fb = elById('ls-feedback');
  const C = GS_TONE[1];
  const AS = nzList(6);
  let rS = '-2';

  function pattern(a, r) {
    const v = qVal(r);
    if (v === 1) return '公比 1：每一項都一樣';
    if (v === -1) return '公比 −1：大小不變，正、負交錯';
    if (v < 0 && v < -1) return '公比是負數：正、負交錯，而且離 0 越來越遠';
    if (v < 0) return '公比是負數：正、負交錯，而且越來越接近 0';
    if (v > 1) return a > 0 ? '公比大於 1：越來越大' : '首項是負數：乘大於 1 的公比，反而越來越小（越來越負）';
    return '公比在 0 與 1 之間：越來越接近 0，但永遠不會等於 0';
  }

  function draw() {
    const a = AS[iv(sa)];
    const r = rParse(rS);
    va.textContent = a;
    const W = cv.width;
    const terms = [];
    for (let i = 0; i < 6; i++) terms.push(qMul([a, 1], qPow(r, i)));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `首項 ${mn(a)}、公比 ${rTxt(r)}：每一項都是前一項 × r`, C);

    const w = 70, y = 100;
    const xs = rowXs(6, 22, 518, w);
    for (let i = 0; i < 5; i++) gsHop(ctx, xs[i] + 10, xs[i + 1] - 10, y - 2, C, mulIt(r, C));
    xs.forEach((x, i) => {
      const col = terms[i][0] < 0 ? GS_TEAL : GS_GOLD;
      gsCard(ctx, x, y, w, 54, col, qIt(terms[i], GS_CREAM), { size: 17 });
      subLabel(ctx, 'a', i + 1, x, 170, MUTED, 15);
    });

    textCenter(ctx, pattern(a, r), W / 2, 198, C, f(800, 15));

    // 長條：長度與數值成正比（開發約束 17），負數畫在 0 的下方
    const zy = 340, maxH = 112;
    const maxV = Math.max(...terms.map(t => Math.abs(qVal(t))));
    gsLine(ctx, 18, zy, 522, zy, INK, 1.5);
    textLeft(ctx, '0', 4, zy, MUTED, f(700, 13));
    xs.forEach((x, i) => {
      const v = qVal(terms[i]);
      const hh = Math.max(1.5, Math.abs(v) / maxV * maxH);
      ctx.save();
      ctx.fillStyle = v < 0 ? GS_TEAL : GS_GOLD;
      ctx.globalAlpha = 0.85;
      if (v >= 0) ctx.fillRect(x - 18, zy - hh, 36, hh);
      else ctx.fillRect(x - 18, zy, 36, hh);
      ctx.restore();
    });
    textCenter(ctx, '金色：正數　藍綠色：負數　長條長度和數值成正比', W / 2, 470, DIM, f(700, 12.5));

    out.innerHTML = `\\(a_1 = ${a}\\)，\\(r = ${qTex(r)}\\)：${listTex(terms)}`;
    const neg = qVal(r) < 0;
    fb.innerHTML = wrapFeedback(neg
      ? `公比是負數，每乘一次正負號就翻一次：第 \\(1, 3, 5\\) 項與首項同號，第 \\(2, 4, 6\\) 項與首項異號。所以不能說「公比負的就越來越小」。`
      : `公比是正數，每一項都和首項同號。公比正的也不一定越來越大：\\(0 \\lt r \\lt 1\\) 時越來越接近 \\(0\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-ls-r', v => { rS = v; draw(); });
  sa.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3：補上缺號的座位牌——往後乘 r、往前除以 r
   ========================================================================== */
function initFillCanvas() {
  const cv = elById('canvas-fill');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('fl-k'), sv = elById('fl-v');
  const vk = elById('fl-vk'), vv = elById('fl-vv');
  const g = elById('fl-r-group');
  const out = elById('fl-formula');
  const fb = elById('fl-feedback');
  const C = GS_TONE[2];
  const VS = nzList(6);
  const state = { step: 1 };
  const N = 4;
  let rS = '3';

  function draw() {
    const k = iv(sk), v = VS[iv(sv)];
    const r = rParse(rS);
    vk.textContent = k; vv.textContent = v;
    state.step = clamp(state.step, 1, N);
    syncSteps('fl', state.step, N);
    const step = state.step;
    const W = cv.width;

    // terms[i] 是第 i+1 項
    const terms = [];
    for (let i = 1; i <= 5; i++) terms.push(qMul([v, 1], qPow(r, i - k)));
    const after = [], before = [];
    for (let i = k + 2; i <= 5; i++) after.push(i);
    for (let i = k - 1; i >= 1; i--) before.push(i);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `只知道第 ${k}、${k + 1} 項，補出其他三張座位牌`, C);

    const w = 82, y = 100;
    const xs = rowXs(5, 20, 520, w);
    const known = i => (i === k || i === k + 1);
    const shown = i => known(i) || (step >= 3 && i > k + 1) || (step >= 4 && i < k);
    for (let i = 1; i <= 5; i++) {
      const x = xs[i - 1];
      if (shown(i)) {
        gsCard(ctx, x, y, w, 56, known(i) ? GS_GOLD : GS_JADE, qIt(terms[i - 1], GS_CREAM));
      } else {
        gsCard(ctx, x, y, w, 56, DIM, T('?', MUTED), { dash: [5, 4], alpha: 0.06, size: 22 });
      }
      subLabel(ctx, 'a', i, x, 172, known(i) ? GS_GOLD : MUTED, 15);
    }
    // 往後：×r（畫在上方）
    if (step >= 2) gsHop(ctx, xs[k - 1] + 12, xs[k] - 12, y - 2, GS_GOLD, mulIt(r, GS_GOLD));
    if (step >= 3) after.forEach(i => gsHop(ctx, xs[i - 2] + 12, xs[i - 1] - 12, y - 2, GS_JADE, mulIt(r, GS_JADE)));
    // 往前：÷r（畫在下方）
    if (step >= 4) before.forEach(i => gsHop(ctx, xs[i] - 12, xs[i - 1] + 12, 186, GS_JADE, divIt(r, GS_JADE), true));

    const rowsAfter = after.length
      ? [SEQ(after.map((i, n) => SEQ(parseExpr(`${n ? '；' : ''}@0 × @1 = @2`, INK, [qIt(terms[i - 2]), qOpIt(r), qIt(terms[i - 1])]), INK, 1)), INK, 2)]
      : [T('第 5 項已經知道，後面沒有空格', MUTED)];
    const rowsBefore = before.length
      ? [SEQ(before.map((i, n) => SEQ(parseExpr(`${n ? '；' : ''}@0 ÷ @1 = @2`, INK, [qIt(terms[i]), qOpIt(r), qIt(terms[i - 1])]), INK, 1)), INK, 2)]
      : [T('第 1 項已經知道，前面沒有空格', MUTED)];
    const rows = [
      row('已知', '相鄰的兩項', exprItems(`第 ${k} 項 = @0，第 ${k + 1} 項 = @1`, INK, [qIt(terms[k - 1]), qIt(terms[k])])),
      row('求公比', '後項 ÷ 前項', exprItems('r = @0 ÷ @1 = @2', INK, [qIt(terms[k]), qOpIt(terms[k - 1]), qIt(r)])),
      row('往後補', '每往後一項 × r', rowsAfter),
      row('往前補', '每往前一項 ÷ r', rowsBefore)
    ];
    drawStepRows(ctx, rows, step, { top: 270, gap: 52, eqX: 150, color: C, size: 18 });

    const full = terms.map((t, i) => (shown(i + 1) ? `\\(${qTex(t)}\\)` : '\\(\\square\\)')).join(', ');
    out.innerHTML = `${full}；公比 \\(r = ${qTex(r)}\\)`;
    const fbs = [
      `先看已知的兩項：第 \\(${k}\\) 項 \\(${qTex(terms[k - 1])}\\)、第 \\(${k + 1}\\) 項 \\(${qTex(terms[k])}\\)。按「下一步」求公比。`,
      `公比 \\(r = ${qTex(terms[k])} \\div ${qTexM(terms[k - 1])} = ${qTex(r)}\\)。有了公比，往後、往前都補得出來。`,
      `往後一項就乘一次 \\(${qTex(r)}\\)。下一步往前補：要<b>除以</b>公比，不是再乘一次。`,
      `往前一項就除以 \\(${qTex(r)}\\)${r[1] !== 1 ? '，除以分數等於乘它的倒數' : ''}。五張座位牌都補齊了，相鄰兩項的比都是 \\(${qTex(r)}\\)。`
    ];
    fb.innerHTML = wrapFeedback(fbs[step - 1]);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-fl-r', v => { rS = v; draw(); });
  [sk, sv].forEach(s => s.addEventListener('input', draw));
  bindSteps('fl', () => N, state, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：第 n 項——從第 1 項走到第 n 項，乘了 n − 1 次 r
   ========================================================================== */
function initNthCanvas() {
  const cv = elById('canvas-nth');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('nt-a'), sn = elById('nt-n');
  const va = elById('nt-va'), vn = elById('nt-vn');
  const g = elById('nt-r-group');
  const out = elById('nt-formula');
  const fb = elById('nt-feedback');
  const C = GS_TONE[3];
  let rS = '3';

  function draw() {
    const a = iv(sa), n = iv(sn);
    const r = rParse(rS);
    va.textContent = a; vn.textContent = n;
    const W = cv.width;
    const terms = [];
    for (let i = 0; i < n; i++) terms.push(qMul([a, 1], qPow(r, i)));
    const rp = qPow(r, n - 1);
    const an = terms[n - 1];
    const wrong = qMul([a, 1], qPow(r, n));

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `從第 1 項走到第 ${n} 項，要乘幾次 r？`, C);

    const w = Math.min(64, (500 - (n - 1) * 10) / n), y = 100;
    const xs = rowXs(n, 20, 520, w);
    for (let i = 0; i < n - 1; i++) gsHop(ctx, xs[i] + w * 0.22, xs[i + 1] - w * 0.22, y - 2, C, mulIt(r, C));
    xs.forEach((x, i) => {
      const col = i === n - 1 ? GS_JADE : (i === 0 ? GS_GOLD : DIM);
      gsCard(ctx, x, y, w, 52, col, qIt(terms[i], GS_CREAM), { size: 16, alpha: i === 0 || i === n - 1 ? 0.18 : 0.08 });
      subLabel(ctx, 'a', i + 1, x, 166, i === n - 1 ? GS_JADE : MUTED, 14);
    });
    // 計數括線
    const bx1 = xs[0], bx2 = xs[n - 1], by = 184;
    gsLine(ctx, bx1, by, bx2, by, C, 2);
    gsLine(ctx, bx1, by - 6, bx1, by + 6, C, 2);
    gsLine(ctx, bx2, by - 6, bx2, by + 6, C, 2);
    textCenter(ctx, `共乘了 ${n} − 1 = ${n - 1} 次 r`, W / 2, 204, C, f(800, 15));

    const rows = [
      row('公式', '第 n 項 = 首項 × r 的 (n−1) 次方', exprItems('第 n 項 = 首項 × r^{n-1}', INK)),
      row('代入', `首項 ${a}、r = ${rTxt(r)}、n = ${n}`, exprItems(`第 ${n} 項 = ${a} × @0`, INK, [qPowIt(r, n - 1)])),
      row('計算', `先算 r 的 ${n - 1} 次方`, exprItems(`= ${a} × @0`, INK, [qOpIt(rp)])),
      row('常見錯誤', '指數寫成 n', exprItems(`${a} × @0 = @1  ✗ 多乘了一次`, GS_ROSE, [qPowIt(r, n, GS_ROSE), qIt(wrong, GS_ROSE)]), GS_ROSE),
      row('答', '', exprItems(`第 ${n} 項 = @0`, GS_JADE, [qIt(an, GS_JADE)]), GS_JADE)
    ];
    drawStepRows(ctx, rows, rows.length, { top: 252, gap: 52, eqX: 172, color: C, size: 19 });

    out.innerHTML = wbrEq(`a_{${n}} = ${a} \\times ${powTex(r, n - 1)} = ${a} \\times ${qTexM(rp)} = ${qTex(an)}`);
    fb.innerHTML = wrapFeedback(`從 \\(a_1\\) 到 \\(a_{${n}}\\) 中間有 \\(${n - 1}\\) 個「\\(\\times r\\)」，所以指數是 \\(n - 1 = ${n - 1}\\)。${r[0] < 0 ? `公比是負數，次方一定要連括號一起寫：\\(${powTex(r, n - 1)}\\)。` : '寫成 \\(r^n\\) 就多乘了一次。'}`);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-nt-r', v => { rS = v; draw(); });
  [sa, sn].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：倒帶回第 1 項——由相鄰兩項求公比，再反求首項
   ========================================================================== */
function initBackCanvas() {
  const cv = elById('canvas-back');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sk = elById('bk-k'), sv = elById('bk-v');
  const vk = elById('bk-vk'), vv = elById('bk-vv');
  const g = elById('bk-r-group');
  const out = elById('bk-formula');
  const fb = elById('bk-feedback');
  const C = GS_TONE[4];
  const VS = nzList(8);
  const state = { step: 1 };
  const N = 5;
  let rS = '1/2';

  function draw() {
    const k = iv(sk), v = VS[iv(sv)];
    const r = rParse(rS);
    vk.textContent = k; vv.textContent = v;
    state.step = clamp(state.step, 1, N);
    syncSteps('bk', state.step, N);
    const step = state.step;
    const W = cv.width;

    // terms[i] 是第 i+1 項，共 k+1 項
    const terms = [];
    for (let i = 1; i <= k + 1; i++) terms.push(qMul([v, 1], qPow(r, i - k)));
    const a1 = terms[0];
    const rk = qPow(r, k - 1);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `已知第 ${k}、${k + 1} 項，倒帶回第 1 項`, C);

    const w = 72, y = 100;
    const xs = rowXs(k + 1, 20, 520, w);
    for (let i = 1; i <= k + 1; i++) {
      const x = xs[i - 1];
      const known = (i === k || i === k + 1);
      if (known) gsCard(ctx, x, y, w, 56, GS_GOLD, qIt(terms[i - 1], GS_CREAM));
      else if (step >= 4) gsCard(ctx, x, y, w, 56, i === 1 ? GS_JADE : DIM, qIt(terms[i - 1], GS_CREAM), { alpha: i === 1 ? 0.2 : 0.08 });
      else gsCard(ctx, x, y, w, 56, DIM, T('?', MUTED), { dash: [5, 4], alpha: 0.06, size: 22 });
      subLabel(ctx, 'a', i, x, 172, known ? GS_GOLD : (i === 1 ? GS_JADE : MUTED), 15);
    }
    if (step >= 2) gsHop(ctx, xs[k - 1] + 12, xs[k] - 12, y - 2, GS_GOLD, mulIt(r, GS_GOLD));
    if (step >= 4) {
      for (let i = k; i >= 2; i--) gsHop(ctx, xs[i - 1] - 12, xs[i - 2] + 12, 186, GS_JADE, divIt(r, GS_JADE), true);
    }

    const rows = [
      row('已知', '相鄰的兩項', exprItems(`第 ${k} 項 = @0，第 ${k + 1} 項 = @1`, INK, [qIt(terms[k - 1]), qIt(terms[k])])),
      row('求公比', '後項 ÷ 前項', exprItems('r = @0 ÷ @1 = @2', INK, [qIt(terms[k]), qOpIt(terms[k - 1]), qIt(r)])),
      row('列式', `第 ${k} 項 = 首項 × r 的 ${k - 1} 次方`, exprItems('@0 = 首項 × @1', INK, [qIt(terms[k - 1]), qPowIt(r, k - 1)])),
      row('反求首項', `往回除 ${k - 1} 次`, exprItems('首項 = @0 ÷ @1 = @2', GS_JADE, [qIt(terms[k - 1], GS_JADE), qPowIt(r, k - 1, GS_JADE), qIt(a1, GS_JADE)]), GS_JADE),
      row('第 n 項', '代回公式', exprItems('第 n 項 = @0 × @1', INK, [qIt(a1), PW(qIt(r), 'n−1', qNeedP(r))]))
    ];
    drawStepRows(ctx, rows, step, { top: 274, gap: 53, eqX: 160, color: C, size: 17 });

    out.innerHTML = `\\(r = ${qTex(r)}\\)，${wbrEq(`a_1 = ${qTex(terms[k - 1])} \\div ${powTex(r, k - 1)} = ${qTex(terms[k - 1])} \\div ${qTexM(rk)} = ${qTex(a1)}`)}`;
    const fbs = [
      `只知道第 \\(${k}\\) 項與第 \\(${k + 1}\\) 項，首項在左邊看不到。按「下一步」先求公比。`,
      `公比 \\(r = ${qTex(r)}\\)。往後一項 \\(\\times r\\)，所以往前一項就要 \\(\\div r\\)。`,
      `由第 \\(n\\) 項的公式，第 \\(${k}\\) 項 ＝ 首項 \\(\\times\\, ${powTex(r, k - 1)}\\)，首項是唯一的未知數。`,
      `兩邊同除以 \\(${powTex(r, k - 1)}\\)，等於一項一項往回除 \\(${k - 1}\\) 次，首項是 \\(${qTex(a1)}\\)。`,
      `有了首項 \\(${qTex(a1)}\\) 與公比 \\(${qTex(r)}\\)，任何一項都算得出來。代 \\(n = ${k}\\) 回去檢查，正好是 \\(${qTex(terms[k - 1])}\\)。`
    ];
    fb.innerHTML = wrapFeedback(fbs[step - 1]);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-bk-r', v => { rS = v; draw(); });
  [sk, sv].forEach(s => s.addEventListener('input', draw));
  bindSteps('bk', () => N, state, draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：跳著取項——倒過來 1/r、每隔一項 r²、每隔兩項 r³、a_m ÷ a_n
   ========================================================================== */
function initSubCanvas() {
  const cv = elById('canvas-sub');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sb-a'), sm = elById('sb-m'), sn = elById('sb-n');
  const va = elById('sb-va'), vm = elById('sb-vm'), vn = elById('sb-vn');
  const rowM = elById('sb-row-m'), rowN = elById('sb-row-n');
  const gr = elById('sb-r-group'), gm = elById('sb-mode-group');
  const out = elById('sb-formula');
  const fb = elById('sb-feedback');
  const C = GS_TONE[5];
  let rS = '2', mode = 'odd';

  function draw() {
    const a = iv(sa), m = iv(sm), n = iv(sn);
    const r = rParse(rS);
    va.textContent = a; vm.textContent = m; vn.textContent = n;
    rowM.style.display = mode === 'cmp' ? '' : 'none';
    rowN.style.display = mode === 'cmp' ? '' : 'none';
    const W = cv.width;
    const terms = [];
    for (let i = 0; i < 7; i++) terms.push(qMul([a, 1], qPow(r, i)));

    ctx.clearRect(0, 0, W, cv.height);
    const titles = {
      rev: '倒過來寫，新數列的公比是多少？',
      odd: '每隔一項取一項（第 1、3、5、7 項）',
      step3: '每隔兩項取一項（第 1、4、7 項）',
      cmp: `第 ${m} 項是第 ${n} 項的幾倍？`
    };
    drawTitle(ctx, titles[mode], C);

    const w = 62, y = 96;
    const xs = rowXs(7, 16, 524, w);
    let pick = [];
    if (mode === 'odd') pick = [0, 2, 4, 6];
    if (mode === 'step3') pick = [0, 3, 6];
    const hl = i => {
      if (mode === 'rev') return true;
      if (mode === 'cmp') return i === m - 1 || i === n - 1;
      return pick.indexOf(i) >= 0;
    };
    for (let i = 0; i < 6; i++) gsHop(ctx, xs[i] + 9, xs[i + 1] - 9, y - 2, DIM, mulIt(r, MUTED));
    xs.forEach((x, i) => {
      let col = hl(i) ? GS_GOLD : DIM;
      if (mode === 'cmp') col = i === m - 1 ? GS_JADE : (i === n - 1 ? GS_GOLD : DIM);
      gsCard(ctx, x, y, w, 50, col, qIt(terms[i], GS_CREAM), { size: 16, alpha: hl(i) ? 0.18 : 0.06 });
      subLabel(ctx, 'a', i + 1, x, 162, hl(i) ? col : DIM, 14);
    });

    let newR = null, fbHtml = '', outHtml = '';
    if (mode === 'rev') {
      newR = qDiv([1, 1], r);
      const rev = terms.slice().reverse();
      const y2 = 286;
      for (let i = 0; i < 6; i++) gsHop(ctx, xs[i] + 9, xs[i + 1] - 9, y2 - 2, GS_JADE, mulIt(newR, GS_JADE));
      xs.forEach((x, i) => {
        gsCard(ctx, x, y2, w, 50, GS_JADE, qIt(rev[i], GS_CREAM), { size: 16 });
        subLabel(ctx, 'a', 7 - i, x, 352, MUTED, 14);
      });
      drawPanel(ctx, 20, 378, W - 40, 92, GS_JADE, 0.08);
      drawExpr(ctx, exprItems('新公比 = @0 ÷ @1 = @2 = 1 ÷ r', GS_JADE, [qIt(rev[1], GS_JADE), qOpIt(rev[0], GS_JADE), qIt(newR, GS_JADE)]), W / 2, 408, 19, GS_JADE, { maxW: W - 60, gap: 6 });
      textCenter(ctx, '原本往右 × r，倒過來往右就是 ÷ r，也就是 × (1/r)', W / 2, 446, MUTED, f(700, 14));
      outHtml = `倒過來：${listTex(rev)}；公比 \\(${qTex(newR)}\\)`;
      fbHtml = `倒過來寫仍然是等比數列，公比變成 \\(\\frac{1}{r} = ${qTex(newR)}\\)。`;
    } else if (mode === 'odd' || mode === 'step3') {
      const s = mode === 'odd' ? 2 : 3;
      newR = qPow(r, s);
      const y2 = 286;
      pick.forEach(i => gsLine(ctx, xs[i], 176, xs[i], y2 - 4, GS_GOLD, 1.5, [4, 4]));
      for (let j = 0; j < pick.length - 1; j++) gsHop(ctx, xs[pick[j]] + 12, xs[pick[j + 1]] - 12, y2 - 2, GS_JADE, mulIt(newR, GS_JADE));
      pick.forEach(i => gsCard(ctx, xs[i], y2, w, 50, GS_JADE, qIt(terms[i], GS_CREAM), { size: 16 }));
      drawPanel(ctx, 20, 378, W - 40, 92, GS_JADE, 0.08);
      drawExpr(ctx, exprItems(`新公比 = 第 ${1 + s} 項 ÷ 第 1 項 = @0 = r^${s}`, GS_JADE, [qIt(newR, GS_JADE)]), W / 2, 408, 19, GS_JADE, { maxW: W - 60, gap: 6 });
      textCenter(ctx, `相鄰兩個選中的項之間，乘了 ${s} 次 r`, W / 2, 446, MUTED, f(700, 14));
      outHtml = `${listTex(pick.map(i => terms[i]))}；公比 \\(${powTex(r, s)} = ${qTex(newR)}\\)`;
      fbHtml = `選出來的相鄰兩項之間隔了 \\(${s}\\) 步，每一步 \\(\\times r\\)，所以新公比是 \\(r^${s} = ${qTex(newR)}\\)${r[0] < 0 && s === 2 ? '——負數的平方是正數，新數列不再正負交錯' : ''}。`;
    } else {
      const e = m - n;
      const q = qDiv(terms[m - 1], terms[n - 1]);
      const lo = Math.min(m, n) - 1, hi = Math.max(m, n) - 1;
      if (e !== 0) {
        gsLine(ctx, xs[lo], 180, xs[hi], 180, C, 2);
        gsLine(ctx, xs[lo], 174, xs[lo], 186, C, 2);
        gsLine(ctx, xs[hi], 174, xs[hi], 186, C, 2);
      }
      const say = e > 0 ? `從第 ${n} 項往後走到第 ${m} 項：乘了 ${e} 次 r`
        : (e < 0 ? `從第 ${n} 項往前走到第 ${m} 項：除了 ${-e} 次 r` : '同一項：自己是自己的 1 倍');
      textCenter(ctx, say, W / 2, 206, C, f(800, 15));
      drawPanel(ctx, 20, 240, W - 40, 150, GS_JADE, 0.08);
      let line;
      if (e > 0) line = exprItems(`第 ${m} 項 ÷ 第 ${n} 項 = r^{${e}} = @0`, GS_JADE, [qIt(q, GS_JADE)]);
      else if (e < 0) line = exprItems(`第 ${m} 項 ÷ 第 ${n} 項 = 1 ÷ r^{${-e}} = @0`, GS_JADE, [qIt(q, GS_JADE)]);
      else line = exprItems(`第 ${m} 項 ÷ 第 ${n} 項 = 1`, GS_JADE);
      drawExpr(ctx, line, W / 2, 280, 20, GS_JADE, { maxW: W - 60, gap: 6 });
      drawExpr(ctx, exprItems('驗算：@0 ÷ @1 = @2', INK, [qIt(terms[m - 1]), qOpIt(terms[n - 1]), qIt(q)]), W / 2, 340, 18, INK, { maxW: W - 60, gap: 6 });
      textCenter(ctx, '首項在相除時消掉了，倍數只跟公比與項數差有關', W / 2, 430, MUTED, f(700, 14));
      outHtml = e > 0 ? `\\(a_{${m}} \\div a_{${n}} = ${powTex(r, e)} = ${qTex(q)}\\)`
        : (e < 0 ? `\\(a_{${m}} \\div a_{${n}} = 1 \\div ${powTex(r, -e)} = ${qTex(q)}\\)` : `\\(a_{${m}} \\div a_{${n}} = 1\\)`);
      fbHtml = e === 0 ? '把 \\(m\\)、\\(n\\) 調成不同的項數。'
        : `第 \\(${m}\\) 項是第 \\(${n}\\) 項的 \\(${qTex(q)}\\) 倍。把首項換掉，倍數不會變。`;
    }

    out.innerHTML = outHtml;
    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  bindPickGroup(gr, 'data-sb-r', v => { rS = v; draw(); });
  bindPickGroup(gm, 'data-sb-mode', v => { mode = v; draw(); });
  [sa, sm, sn].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：預告片的觀看次數——第幾天會達到目標？
   ========================================================================== */
function initGrowCanvas() {
  const cv = elById('canvas-grow');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('gr-a'), sk = elById('gr-k');
  const va = elById('gr-va'), vk = elById('gr-vk');
  const g = elById('gr-r-group');
  const out = elById('gr-formula');
  const fb = elById('gr-feedback');
  const C = GS_TONE[6];
  let r = 2;

  function draw() {
    const a = iv(sa), k = iv(sk);
    const P = ipow(r, k);
    const T0 = a * P;
    const n = k + 1;
    va.textContent = a; vk.textContent = T0;
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `第 1 天 ${a} 萬次、每天 × ${r}，第幾天剛好 ${T0} 萬次？`, C);

    const rows = [
      row('首項、公比', '第 1 天、每天的倍數', exprItems(`首項 ${a}，公比 ${r}`, INK)),
      row('設', '第 n 天剛好達到目標', exprItems(`第 n 天 = ${a} × ${r}^{n-1}`, INK)),
      row('列', '第 n 項 = 目標', exprItems(`${a} × ${r}^{n-1} = ${T0}`, INK)),
      row('同除首項', `兩邊除以 ${a}`, exprItems(`${r}^{n-1} = ${T0} ÷ ${a} = ${P}`, INK)),
      row('寫成次方', `${P} 連除以 ${r}，除了 ${k} 次`, exprItems(`${P} = ${r}^{${k}}，所以 ${r}^{n-1} = ${r}^{${k}}`, INK)),
      row('比指數', '底數相同，指數相等', exprItems(`n - 1 = ${k}，n = ${n}`, INK)),
      row('答', '', exprItems(`第 ${n} 天剛好 ${T0} 萬次`, GS_JADE), GS_JADE)
    ];
    drawStepRows(ctx, rows, rows.length, { top: 66, gap: 42, eqX: 168, color: C, size: 18 });

    // 長條：每天的觀看次數，長度與數值成正比
    const base = 506, maxH = 128, left = 40, right = 500;
    const bw = (right - left) / n;
    gsLine(ctx, left, base, right, base, INK, 1.5);
    for (let d = 1; d <= n; d++) {
      const v = a * ipow(r, d - 1);
      const hh = Math.max(1.5, v / T0 * maxH);
      const x = left + (d - 1) * bw;
      ctx.save();
      ctx.fillStyle = d === n ? GS_JADE : GS_GOLD;
      ctx.globalAlpha = d === n ? 0.95 : 0.7;
      ctx.fillRect(x + bw * 0.18, base - hh, bw * 0.64, hh);
      ctx.restore();
      textCenter(ctx, `第${d}天`, x + bw / 2, base + 14, d === n ? GS_JADE : MUTED, f(700, 12));
      textCenter(ctx, String(v), x + bw / 2, base - hh - 10, d === n ? GS_JADE : MUTED, f(700, 12));
    }

    out.innerHTML = `${wbrEq(`${a} \\times ${r}^{n-1} = ${T0}`)}，${wbrEq(`${r}^{n-1} = ${P} = ${r}^{${k}}`)}，\\(n = ${n}\\)`;
    fb.innerHTML = wrapFeedback(`比完指數得到的是 \\(n - 1 = ${k}\\)，答案要再加 \\(1\\)：第 \\(${n}\\) 天。看長條：第 \\(1\\) 天的 \\(${a}\\) 萬次跟第 \\(${n}\\) 天比起來幾乎看不見——這就是等比成長。`);
    typeset([out, fb]);
  }

  bindPickGroup(g, 'data-gr-r', v => { r = parseInt(v, 10); draw(); });
  [sa, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：舞台上的彈力球——數列的第 1 項是哪一個？
   ========================================================================== */
function initBounceCanvas() {
  const cv = elById('canvas-bounce');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sh = elById('bo-h'), sk = elById('bo-k');
  const vh = elById('bo-vh'), vk = elById('bo-vk');
  const gr = elById('bo-r-group'), gm = elById('bo-mode-group');
  const out = elById('bo-formula');
  const fb = elById('bo-feedback');
  const C = GS_TONE[7];
  let rS = '1/2', mode = 'first';

  function draw() {
    const r = rParse(rS);
    const unit = r[1] === 2 ? 64 : 81;   // 2⁶、3⁴：前 4 次彈跳都是整數
    const H = iv(sh) * unit, k = iv(sk);
    vh.textContent = H; vk.textContent = k;
    const hs = [];
    for (let i = 1; i <= 4; i++) hs.push(qMul([H, 1], qPow(r, i)));
    const hk = hs[k - 1];
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `從 ${H} 公分落下，每次彈回 ${rTxt(r)}：第 ${k} 次彈跳多高？`, C);

    // 彈跳路徑：高度與數值成正比
    const floor = 290, scale = 210 / H;
    const x0 = 70, widths = [128, 104, 84, 68];
    gsLine(ctx, 30, floor, 516, floor, INK, 2);
    gsLine(ctx, x0, floor - H * scale, x0, floor, GS_SKY, 2.5, [6, 5]);
    ctx.save();
    ctx.fillStyle = GS_ROSE;
    ctx.beginPath();
    ctx.arc(x0, floor - H * scale - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    let x = x0;
    for (let i = 0; i < 4; i++) {
      const hpx = qVal(hs[i]) * scale;
      const xe = x + widths[i];
      const on = i === k - 1;
      ctx.save();
      ctx.strokeStyle = on ? GS_JADE : GS_GOLD;
      ctx.lineWidth = on ? 3.5 : 2;
      ctx.setLineDash(on ? [] : [6, 5]);
      ctx.beginPath();
      ctx.moveTo(x, floor);
      ctx.quadraticCurveTo((x + xe) / 2, floor - 2 * hpx, xe, floor);
      ctx.stroke();
      ctx.restore();
      const cx = (x + xe) / 2;
      textCenter(ctx, `第${i + 1}次`, cx, floor + 16, on ? GS_JADE : MUTED, f(700, 12));
      textCenter(ctx, rTxt(hs[i]), cx, floor + 34, on ? GS_JADE : INK, f(800, 14));
      const idx = mode === 'first' ? i + 1 : i + 2;
      subLabel(ctx, 'a', idx, cx, floor + 54, on ? GS_JADE : MUTED, 14);
      x = xe;
    }
    textCenter(ctx, '落下', x0, floor + 16, GS_SKY, f(700, 12));
    textCenter(ctx, String(H), x0, floor + 34, GS_SKY, f(800, 14));
    if (mode === 'drop') subLabel(ctx, 'a', 1, x0, floor + 54, GS_SKY, 14);
    else textCenter(ctx, '不是項', x0, floor + 54, DIM, f(700, 12));

    const rr = qDiv(hk, mode === 'first' ? hs[0] : [H, 1]);
    const pr = PW(qIt(r), 'n−1', true);
    let rows;
    if (mode === 'first') {
      rows = [
        row('首項', '第 1 次彈跳的高度', exprItems(`首項 = ${H} × @0 = @1`, INK, [qIt(r), qIt(hs[0])])),
        row('列式', '第 n 次彈跳 = 第 n 項', exprItems('@0 × @1 = @2', INK, [qIt(hs[0]), pr, qIt(hk)])),
        row('解', '同除首項', exprItems('@0 = @1 = @2', INK, [pr, qIt(rr), qPowIt(r, k - 1)])),
        row('比指數', '', exprItems(`n - 1 = ${k - 1}，n = ${k}`, INK)),
        row('答', '第 n 項就是第 n 次', exprItems(`第 ${k} 次彈跳是 @0 公分`, GS_JADE, [qIt(hk, GS_JADE)]), GS_JADE)
      ];
    } else {
      rows = [
        row('首項', '把落下高度當第 1 項', exprItems(`首項 = ${H}`, INK)),
        row('列式', '', exprItems(`${H} × @0 = @1`, INK, [pr, qIt(hk)])),
        row('解', '同除首項', exprItems('@0 = @1 = @2', INK, [pr, qIt(rr), qPowIt(r, k)])),
        row('比指數', '得到的是第幾項', exprItems(`n - 1 = ${k}，n = ${k + 1}`, INK)),
        row('翻回題目', '第 1 項還沒彈', exprItems(`第 ${k + 1} 項 = 第 ${k} 次彈跳，@0 公分`, GS_JADE, [qIt(hk, GS_JADE)]), GS_JADE)
      ];
    }
    drawStepRows(ctx, rows, rows.length, { top: 378, gap: 47, eqX: 160, color: C, size: 17 });

    out.innerHTML = `第 \\(${k}\\) 次彈跳：${wbrEq(`${H} \\times ${powTex(r, k)} = ${qTex(hk)}`)} 公分`;
    fb.innerHTML = wrapFeedback(mode === 'first'
      ? `首項取第 \\(1\\) 次彈跳 \\(${qTex(hs[0])}\\) 公分，第 \\(n\\) 項就是第 \\(n\\) 次彈跳，解出 \\(n = ${k}\\) 直接就是答案。`
      : `首項取落下高度 \\(${H}\\) 公分，解出 \\(n = ${k + 1}\\)——但第 \\(1\\) 項還沒彈，第 \\(${k + 1}\\) 項是第 \\(${k}\\) 次彈跳。兩種設法都對，答案一樣，差別在最後要翻回題目。`);
    typeset([out, fb]);
  }

  bindPickGroup(gr, 'data-bo-r', v => { rS = v; draw(); });
  bindPickGroup(gm, 'data-bo-mode', v => { mode = v; draw(); });
  [sh, sk].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：中間那個座位——等比中項 b = ±√(ac)
   ========================================================================== */
function initMidCanvas() {
  const cv = elById('canvas-mid');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('md-a'), sc = elById('md-c');
  const va = elById('md-va'), vc = elById('md-vc');
  const out = elById('md-formula');
  const fb = elById('md-feedback');
  const C = GS_TONE[8];
  const VS = nzList(9);

  // 公比 s·k√r ÷ a 的 canvas 元件（已化簡）
  function ratioIt(sign, k, rr, a, color) {
    const [p, q] = reduce(sign * k, a);
    if (rr === 1) return qIt([p, q], color);
    const ap = Math.abs(p);
    const num = ap === 1 ? RT(T(rr, color), color) : SEQ([T(ap, color), RT(T(rr, color), color)], color, 1);
    const body = q === 1 ? num : VF(num, T(q, color), color);
    return p < 0 ? SEQ([T('−', color), body], color, 2) : body;
  }

  function ratioTex(sign, k, rr, a) {
    const [p, q] = reduce(sign * k, a);
    if (rr === 1) return qTex(p, q);
    const ap = Math.abs(p);
    const num = `${ap === 1 ? '' : ap}\\sqrt{${rr}}`;
    const body = q === 1 ? num : `\\frac{${num}}{${q}}`;
    return (p < 0 ? '-' : '') + body;
  }

  function draw() {
    const a = VS[iv(sa)], c = VS[iv(sc)];
    va.textContent = a; vc.textContent = c;
    const P = a * c;
    const W = cv.width;
    const ok = P > 0;
    const [k, rr] = ok ? sqSplit(P) : [0, 0];

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `${mn(a)} 與 ${mn(c)} 的等比中項：b² = a × c`, C);

    const w = 104;
    const xs = rowXs(3, 96, 516, w);
    [[1, 62, '取正'], [-1, 162, '取負']].forEach(([s, y, tag]) => {
      textCenter(ctx, tag, 46, y + 28, ok ? (s > 0 ? GS_GOLD : GS_TEAL) : DIM, f(800, 15));
      gsCard(ctx, xs[0], y, w, 56, GS_GOLD, qIt([a, 1], GS_CREAM));
      gsCard(ctx, xs[2], y, w, 56, GS_GOLD, qIt([c, 1], GS_CREAM));
      if (ok) {
        const bIt = s > 0 ? surdIt(k, rr, GS_CREAM) : SEQ([T('−', GS_CREAM), surdIt(k, rr, GS_CREAM)], GS_CREAM, 2);
        gsCard(ctx, xs[1], y, w, 56, GS_JADE, bIt, { alpha: 0.2 });
        drawExpr(ctx, exprItems('公比 @0', MUTED, [ratioIt(s, k, rr, a, MUTED)]), W / 2 + 40, y + 76, 14, MUTED, { maxW: 300, gap: 4 });
      } else {
        gsCard(ctx, xs[1], y, w, 56, GS_ROSE, T('不存在', GS_ROSE), { dash: [5, 4], alpha: 0.06, size: 16 });
      }
    });

    const rows = [
      row('關係', '中間項的平方 = 前 × 後', exprItems('b^2 = a × c', INK)),
      row('代入', '', exprItems(`b^2 = @0 × @1 = ${mn(P)}`, INK, [qIt([a, 1]), qOpIt([c, 1])])),
      ok
        ? row('開平方', '平方是正數的數有兩個', exprItems('b = ± @0', GS_JADE, [surdIt(k, rr, GS_JADE)]), GS_JADE)
        : row('開平方', 'a、c 一正一負', exprItems('b² 是負數：沒有等比中項', GS_ROSE), GS_ROSE),
      row('對照', '平均是等差中項', exprItems('等差中項 = (@0 + @1) ÷ 2 = @2', MUTED, [qIt([a, 1], MUTED), qOpIt([c, 1], MUTED), qIt(qOf(a + c, 2), MUTED)]), DIM)
    ];
    drawStepRows(ctx, rows, rows.length, { top: 300, gap: 48, eqX: 160, color: C, size: 18 });

    out.innerHTML = ok
      ? `${wbrEq(`b^2 = ${a} \\times ${c < 0 ? `(${c})` : c} = ${P}`)}，\\(b = \\pm ${surdTex(k, rr)}\\)`
      : `${wbrEq(`b^2 = ${a} \\times ${c < 0 ? `(${c})` : c} = ${P}`)}，沒有等比中項`;
    fb.innerHTML = wrapFeedback(ok
      ? `\\(b = ${surdTex(k, rr)}\\) 與 \\(b = -${surdTex(k, rr)}\\) 都讓三個數成等比數列（公比 \\(${ratioTex(1, k, rr, a)}\\) 與 \\(${ratioTex(-1, k, rr, a)}\\)），所以等比中項有兩個。它不是平均：等差中項是 \\(${qTex(a + c, 2)}\\)。`
      : `\\(a\\)、\\(c\\) 一正一負，\\(b^2 = ${P}\\) 是負數，沒有任何數的平方是負數，所以 \\(${a}\\) 與 \\(${c}\\) 沒有等比中項。`);
    typeset([out, fb]);
  }

  [sa, sc].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 10：列方程式求 x——(x + q)² = (x + p)(x + s)
   ========================================================================== */
function initEqCanvas() {
  const cv = elById('canvas-eq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sp = elById('eq-p'), sq = elById('eq-q'), ss = elById('eq-s');
  const vp = elById('eq-vp'), vq = elById('eq-vq'), vs = elById('eq-vs');
  const out = elById('eq-formula');
  const fb = elById('eq-feedback');
  const C = GS_TONE[9];

  // 維持 p < q < s
  sp.addEventListener('input', () => {
    if (iv(sq) <= iv(sp)) sq.value = iv(sp) + 1;
    if (iv(ss) <= iv(sq)) ss.value = iv(sq) + 1;
  });
  sq.addEventListener('input', () => {
    if (iv(sq) <= iv(sp)) sp.value = iv(sq) - 1;
    if (iv(ss) <= iv(sq)) ss.value = iv(sq) + 1;
  });
  ss.addEventListener('input', () => {
    if (iv(ss) <= iv(sq)) sq.value = iv(ss) - 1;
    if (iv(sq) <= iv(sp)) sp.value = iv(sq) - 1;
  });

  function coefS(c) {
    if (c === 1) return '';
    if (c === -1) return '-';
    return String(c);
  }

  function draw() {
    const p = iv(sp), q = iv(sq), s = iv(ss);
    vp.textContent = p; vq.textContent = q; vs.textContent = s;
    const W = cv.width;
    const den = 2 * q - p - s, num = p * s - q * q;
    const solvable = den !== 0;
    const x = solvable ? qOf(num, den) : null;
    const tm = solvable ? [qAdd(x, [p, 1]), qAdd(x, [q, 1]), qAdd(x, [s, 1])] : null;
    const zero = solvable && tm.some(rIsZero);
    const ratio = solvable && !zero ? qDiv(tm[1], tm[0]) : null;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `x + ${p}、x + ${q}、x + ${s} 依序成等比數列，求 x`, C);

    const rows = [
      row('列式', '中項² = 前 × 後', exprItems(`(x + ${q})^2 = (x + ${p})(x + ${s})`, INK)),
      row('展開', '完全平方別漏中間項', exprItems(`x^2 + ${2 * q}x + ${q * q} = x^2 + ${p + s}x + ${p * s}`, INK)),
      row('消去 x²', '兩邊的 x² 抵消', exprItems(`${2 * q}x + ${q * q} = ${p + s}x + ${p * s}`, INK)),
      solvable
        ? row('移項', 'x 移左、常數移右', exprItems(`${coefS(den)}x = ${num}`, INK))
        : row('移項', 'x 的係數變成 0', exprItems(`0x = ${num}`, GS_ROSE), GS_ROSE),
      solvable
        ? row('解', '', exprItems('x = @0', GS_JADE, [qIt(x, GS_JADE)]), GS_JADE)
        : row('解', '0 乘任何數都是 0', exprItems('無解：找不到這樣的 x', GS_ROSE), GS_ROSE),
      solvable
        ? row('代回', '三項都不能是 0', exprItems('@0，@1，@2', zero ? GS_ROSE : INK, [qIt(tm[0]), qIt(tm[1]), qIt(tm[2])]), zero ? GS_ROSE : null)
        : row('代回', '', exprItems('沒有 x 可以代', MUTED)),
      ratio
        ? row('公比', '後項 ÷ 前項', exprItems('@0 ÷ @1 = @2', INK, [qIt(tm[1]), qOpIt(tm[0]), qIt(ratio)]))
        : row('公比', '', exprItems(zero ? '有一項是 0，不是等比數列，不合' : '—', zero ? GS_ROSE : MUTED), zero ? GS_ROSE : null)
    ];
    drawStepRows(ctx, rows, rows.length, { top: 62, gap: 46, eqX: 150, color: C, size: 18 });

    const w = 110;
    const xs = rowXs(3, 80, 460, w);
    const y = 418;
    for (let i = 0; i < 3; i++) {
      if (ratio) gsCard(ctx, xs[i], y, w, 56, GS_JADE, qIt(tm[i], GS_CREAM));
      else gsCard(ctx, xs[i], y, w, 56, GS_ROSE, T('?', GS_ROSE), { dash: [5, 4], alpha: 0.06, size: 22 });
    }
    if (ratio) for (let i = 0; i < 2; i++) gsHop(ctx, xs[i] + 22, xs[i + 1] - 22, y - 2, GS_JADE, mulIt(ratio, GS_JADE));

    const eqHead = `(x + ${q})^2 = (x + ${p})(x + ${s})`;
    if (!solvable) {
      out.innerHTML = `${wbrEq(eqHead)}，\\(0x = ${num}\\)，無解`;
    } else {
      out.innerHTML = `${wbrEq(eqHead)}，\\(x = ${qTex(x)}\\)${zero ? '（不合）' : `：${listTex(tm)}`}`;
    }
    fb.innerHTML = wrapFeedback(!solvable
      ? `\\(2q = p + s\\)，消去 \\(x^2\\) 之後連 \\(x\\) 也消掉了，剩下 \\(0x = ${num}\\)，沒有任何 \\(x\\) 能讓它成立，所以無解。這時 \\(p, q, s\\) 本身就成等差數列。`
      : (zero
        ? `解出 \\(x = ${qTex(x)}\\)，代回去有一項是 \\(0\\)。等比數列不能有 \\(0\\) 這一項，所以這個解不合。`
        : `兩邊的 \\(x^2\\) 一定會消掉，剩下一元一次方程式。代回去三項是 ${listTex(tm)}，相鄰兩項的比都是 \\(${qTex(ratio)}\\)。`));
    typeset([out, fb]);
  }

  [sp, sq, ss].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 11：對稱的座位——以中間項為中心，對稱兩項的乘積都是 m²
   ========================================================================== */
function initSymCanvas() {
  const cv = elById('canvas-sym');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sm = elById('sy-m');
  const vm = elById('sy-vm');
  const gr = elById('sy-r-group'), gc = elById('sy-c-group');
  const out = elById('sy-formula');
  const fb = elById('sy-feedback');
  const C = GS_TONE[10];
  const MS = nzList(6);
  let rS = '2', cnt = 5;

  function draw() {
    const m = MS[iv(sm)];
    const r = rParse(rS);
    vm.textContent = m;
    const h = (cnt - 1) / 2;
    const terms = [];
    for (let j = -h; j <= h; j++) terms.push(qMul([m, 1], qPow(r, j)));
    const total = qPow([m, 1], cnt);
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `中間項 ${mn(m)}、公比 ${rTxt(r)}：左右對稱的兩項相乘`, C);

    const w = cnt === 7 ? 62 : (cnt === 5 ? 80 : 100);
    const xs = rowXs(cnt, 20, 520, w);
    const y = 150;
    for (let j = 1; j <= h; j++) {
      const xl = xs[h - j], xr = xs[h + j];
      const peak = 22 * j + 10;
      ctx.save();
      ctx.strokeStyle = GS_TONE[10];
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xl, y - 4);
      ctx.quadraticCurveTo((xl + xr) / 2, y - 4 - 2 * peak, xr, y - 4);
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, `乘積 ${mn(m * m)}`, (xl + xr) / 2, y - 4 - peak - 9, GS_JADE, f(800, 13));
    }
    xs.forEach((x, i) => {
      gsCard(ctx, x, y, w, 54, i === h ? GS_GOLD : GS_TEAL, qIt(terms[i], GS_CREAM), { size: 17, alpha: i === h ? 0.22 : 0.12 });
      subLabel(ctx, 'a', i + 1, x, 220, i === h ? GS_GOLD : MUTED, 14);
    });

    const mS = m < 0 ? `(${m})` : String(m);
    const parts = [];
    for (let j = -h; j <= h; j++) {
      // 5、7 項只寫頭、中、尾，字太多會縮到投影看不見
      if (cnt > 3 && Math.abs(j) !== h && j !== 0) { if (parts[parts.length - 1] !== '…') parts.push('…'); continue; }
      if (j === 0) parts.push(mS);
      else if (j < 0) parts.push(`${mS} ÷ r${-j > 1 ? '^' + (-j) : ''}`);
      else parts.push(`${mS} × r${j > 1 ? '^' + j : ''}`);
    }
    const rows = [
      row('設', '以中間項為中心', exprItems(parts.join('，'), INK)),
      row('對稱兩項', 'r 互相抵消', exprItems(`(${mS} ÷ r) × (${mS} × r) = ${mS}^2 = ${m * m}`, INK)),
      row('全部相乘', `${cnt} 個 ${mn(m)} 相乘`, exprItems(`乘積 = ${mS}^${cnt} = @0`, GS_JADE, [qIt(total, GS_JADE)]), GS_JADE),
      row('驗算', '首項 × 末項', exprItems('@0 × @1 = @2', INK, [qIt(terms[0]), qOpIt(terms[cnt - 1]), qIt(qMul(terms[0], terms[cnt - 1]))]))
    ];
    drawStepRows(ctx, rows, rows.length, { top: 264, gap: 48, eqX: 150, color: C, size: 18 });
    textCenter(ctx, '換一個公比，對稱兩項的乘積不會變', W / 2, 456, DIM, f(700, 13));

    out.innerHTML = `${listTex(terms)}；乘積 \\(${powTex([m, 1], cnt)} = ${qTex(total)}\\)`;
    fb.innerHTML = wrapFeedback(`每一組對稱的兩項，一個除以 \\(r^j\\)、一個乘以 \\(r^j\\)，相乘時 \\(r\\) 消掉，乘積都是 \\(${mS}^2 = ${m * m}\\)。所以 \\(${cnt}\\) 項的乘積就是 \\(${powTex([m, 1], cnt)}\\)，跟公比無關。`);
    typeset([out, fb]);
  }

  bindPickGroup(gr, 'data-sy-r', v => { rS = v; draw(); });
  bindPickGroup(gc, 'data-sy-c', v => { cnt = parseInt(v, 10); draw(); });
  sm.addEventListener('input', draw);
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 12：兩台檢驗機——既是等差又是等比
   ========================================================================== */
function initBothCanvas() {
  const cv = elById('canvas-both');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('bt-a'), sb = elById('bt-b'), sc = elById('bt-c');
  const va = elById('bt-va'), vb = elById('bt-vb'), vc = elById('bt-vc');
  const out = elById('bt-formula');
  const fb = elById('bt-feedback');
  const C = GS_TONE[11];

  function lamp(cx, cy, on) {
    ctx.save();
    ctx.fillStyle = on ? GS_JADE : 'rgba(148, 163, 184, 0.18)';
    if (on) { ctx.shadowColor = GS_JADE; ctx.shadowBlur = 18; }
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = on ? GS_JADE : DIM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const a = iv(sa), b = iv(sb), c = iv(sc);
    va.textContent = a; vb.textContent = b; vc.textContent = c;
    const W = cv.width;
    const d1 = b - a, d2 = c - b;
    const arith = d1 === d2;
    const hasZero = a === 0 || b === 0 || c === 0;
    const q1 = a !== 0 ? qOf(b, a) : null, q2 = b !== 0 ? qOf(c, b) : null;
    const geo = !hasZero && qEq(q1, q2);

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, '同一組數，兩台檢驗機', C);

    const w = 110;
    const xs = rowXs(3, 80, 460, w);
    [a, b, c].forEach((v, i) => {
      gsCard(ctx, xs[i], 52, w, 56, v === 0 ? GS_ROSE : GS_GOLD, T(mn(v), GS_CREAM), { size: 22 });
      subLabel(ctx, 'a', i + 1, xs[i], 124, MUTED, 14);
    });

    // 左：等差機
    drawPanel(ctx, 20, 146, 242, 186, GS_SKY, 0.08);
    textCenter(ctx, '等差檢驗機：看「差」', 141, 168, GS_SKY, f(800, 15));
    drawExpr(ctx, exprItems(`第 2 項 − 第 1 項 = ${mn(d1)}`, INK), 141, 208, 16, INK, { maxW: 226, gap: 4 });
    drawExpr(ctx, exprItems(`第 3 項 − 第 2 項 = ${mn(d2)}`, INK), 141, 242, 16, INK, { maxW: 226, gap: 4 });
    lamp(141, 290, arith);
    textCenter(ctx, arith ? `是等差（公差 ${mn(d1)}）` : '不是等差', 141, 318, arith ? GS_JADE : MUTED, f(800, 14));

    // 右：等比機
    drawPanel(ctx, 278, 146, 242, 186, GS_GOLD, 0.08);
    textCenter(ctx, '等比檢驗機：看「比」', 399, 168, GS_GOLD, f(800, 15));
    const ratioLine = (lab, q) => (q === null
      ? exprItems(`${lab}：除以 0，無意義`, GS_ROSE)
      : exprItems(`${lab} = @0`, INK, [qIt(q)]));
    drawExpr(ctx, ratioLine('第 2 項 ÷ 第 1 項', q1), 399, 208, 16, INK, { maxW: 226, gap: 4 });
    drawExpr(ctx, ratioLine('第 3 項 ÷ 第 2 項', q2), 399, 242, 16, INK, { maxW: 226, gap: 4 });
    lamp(399, 290, geo);
    textCenter(ctx, geo ? `是等比（公比 ${rTxt(q1)}）` : (hasZero ? '有 0，不是等比' : '不是等比'), 399, 318, geo ? GS_JADE : MUTED, f(800, 14));

    // 結論
    const both = arith && geo;
    drawPanel(ctx, 20, 350, W - 40, 110, both ? GS_JADE : DIM, 0.08);
    let msg;
    if (both) msg = '兩盞燈都亮：每一項都相同，公差 0、公比 1';
    else if (arith && hasZero && a === 0 && b === 0 && c === 0) msg = '0, 0, 0 只是等差：後項 ÷ 前項要除以 0';
    else if (arith) msg = '只亮等差燈：差相等，比不相等';
    else if (geo) msg = '只亮等比燈：比相等，差不相等';
    else msg = '兩盞燈都不亮';
    textCenter(ctx, msg, W / 2, 378, both ? GS_JADE : INK, f(800, 16));
    drawExpr(ctx, exprItems('a - d，a，a + d 也成等比 ⇒ a^2 = a^2 - d^2 ⇒ d = 0', MUTED), W / 2, 424, 15, MUTED, { maxW: W - 60, gap: 4 });

    const ratioTex = (q) => (q === null ? '無意義' : `\\(${qTex(q)}\\)`);
    out.innerHTML = `差 \\(${d1}\\), \\(${d2}\\)；比 ${ratioTex(q1)}, ${ratioTex(q2)}`;
    let fbHtml;
    if (both) fbHtml = `三個數都是 \\(${a}\\)：差都是 \\(0\\)、比都是 \\(1\\)。既是等差又是等比的數列，每一項都相同而且不是 \\(0\\)。`;
    else if (a === 0 && b === 0 && c === 0) fbHtml = '\\(0, 0, 0\\) 的差都是 \\(0\\)，是等差數列；但「後項 ÷ 前項」要除以 \\(0\\)，所以不是等比數列。';
    else if (arith) fbHtml = `公差 \\(${d1}\\) 的等差數列。等比的條件是比相等，${hasZero ? '而且這組數裡有 \\(0\\)，一定不是等比。' : '這組數的比並不相等。'}`;
    else if (geo) fbHtml = `公比 \\(${qTex(q1)}\\) 的等比數列。相鄰兩項的差 \\(${d1}\\)、\\(${d2}\\) 不相等，所以不是等差。`;
    else fbHtml = '差與比都不相等。試試把三個數調成一樣。';
    fb.innerHTML = wrapFeedback(fbHtml);
    typeset([out, fb]);
  }

  [sa, sb, sc].forEach(el => el.addEventListener('input', draw));
  drawWithFonts(draw);
}
