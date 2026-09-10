/* ==========================================================================
   3-1 比例式 — 互動 Canvas 與隨堂評量
   畫風：微縮建築模型工坊（暖木色調＋厚塗廣告顏料）

   共用工具在 ../math-canvas.js（T／VF／FR／SEQ／drawExpr／drawStepRows／
   drawPanel／drawChip／wbrEq／reduce／texFrac／gcd／clamp…），本檔只放
   本節專屬的色票、道具形狀與 11 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMixCanvas();
  initValCanvas();
  initEqCanvas();
  initSimpCanvas();
  initCrossCanvas();
  initShareCanvas();
  initSwapCanvas();
  initFixCanvas();
  initTimesCanvas();
  initChgCanvas();
  initScaleCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 工坊的材質色（MW_ = Model Workshop；共用檔沒有這個前綴的符號）
const MW_CREAM = '#f5edd8';   // 米白漆／淺木
const MW_SKYP = '#7dd3fc';    // 天藍漆
const MW_WOOD = '#f0c48a';    // 木料
const MW_PAD = '#4ade80';     // 切割墊綠
const MW_RUST = '#fca5a5';    // 深棕／紅漆

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const MW_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7',
                 '#d8b4fe', '#fdba74', '#f9a8d4', '#bef264', '#67e8f9', '#fde047'];

// 非零整數的滑桿對照表（滑桿沒有辦法「跳過 0」，改用索引）
const MW_NZ9 = [];
for (let v = -9; v <= 9; v++) if (v !== 0) MW_NZ9.push(v);      // 18 個，索引 0..17
const MW_NZ36 = [];
for (let v = -36; v <= 36; v++) if (v !== 0) MW_NZ36.push(v);   // 72 個，索引 0..71
const MW_NZ6 = [];
for (let v = -6; v <= 6; v++) if (v !== 0) MW_NZ6.push(v);      // 12 個，索引 0..11
const MW_NZ5 = [];
for (let v = -5; v <= 5; v++) if (v !== 0) MW_NZ5.push(v);      // 10 個，索引 0..9
const MW_SVALS = [];
for (let v = -30; v <= 30; v += 2) if (v !== 0) MW_SVALS.push(v); // 30 個，索引 0..29
const MW_P13 = [];
for (let v = -6; v <= 6; v++) MW_P13.push(v);                    // 13 個，索引 0..12

/**
 * 化簡後的 LaTeX 分數。
 * ⚠️ 共用檔的 texFrac() 不化簡（texFrac(6,2) 會印出 6/2），而畫布上的分數
 * 元件走 reduce()，兩邊會長得不一樣——所有 LaTeX 分數一律走這個。
 */
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// 代入時的數字寫法：一律加括號（共用檔的 sub() 只替負數加，並置相乘時會黏成另一個數）
function mul(v) {
  return '(' + numStr(v) + ')';
}

// 比的其中一項：負數要加括號
function nTex(v) {
  return v < 0 ? `(${numStr(v)})` : numStr(v);
}

function ratioTex(a, b) {
  return `${nTex(a)} : ${nTex(b)}`;
}

// canvas 上的一項（負數加括號）
function numItem(v, color) {
  return T(v < 0 ? `(${numStr(v)})` : numStr(v), color);
}

// canvas 上的「a : b」
function ratioItems(a, b, color) {
  return [numItem(a, color), T(':', color), numItem(b, color)];
}

// canvas 上的分數元件：先化簡，分母為 1 時直接寫整數，負號提到分數外面
function fItem(n, d, color) {
  const r = reduce(n, d);
  if (r[1] === 1) return T(String(r[0]), color);
  if (r[0] < 0) return SEQ([T('-', color), FR(-r[0], r[1], color)], color, 2);
  return FR(r[0], r[1], color);
}

// 已化簡的分數元件：[分子, 分母] 進來，分母為 1 時寫成整數，
// 負數在需要括號的位置外面再包一層括號
function pItem(r, color, paren) {
  if (r[1] === 1) return paren ? numItem(r[0], color) : T(numStr(r[0]), color);
  if (r[0] < 0) return GRP([SEQ([T('-', color), FR(-r[0], r[1], color)], color, 2)], '()', color);
  return FR(r[0], r[1], color);
}

// 同一個值的 LaTeX 版本
function pTex(r) {
  return (r[1] === 1) ? numStr(r[0]) : texFrac(r[0], r[1]);
}

// 需要括號的位置（比的項、乘號旁邊）
function pTexP(r) {
  const t = pTex(r);
  return (r[0] < 0) ? `\\left(${t}\\right)` : t;
}

// canvas 上「不化簡」的分數元件（要展示化簡前後的對照時用）
function rawItem(n, d, color) {
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return T(String(n), color);
  if (n < 0) return SEQ([T('-', color), FR(-n, d, color)], color, 2);
  return FR(n, d, color);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

// 步驟列的編號：列數會隨模式改變，號碼一律在畫之前重編一次才不會跳號
const MW_NUMS = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465'];
function numberRows(rows) {
  rows.forEach((r, i) => { r.name = MW_NUMS[i] + ' ' + r.name; });
  return rows;
}

// 化簡整數比要除以的那個數：兩項都是負的時候取負的，一次把負號也除掉
// （(-24) : (-36) 的最簡整數比是 2 : 3，不是 (-2) : (-3)）
function simpDiv(a, b) {
  const g = gcd(a, b);
  return (a < 0 && b < 0) ? -g : g;
}

// 把一個整數比化成最簡整數比
function simpRatio(a, b) {
  const g = simpDiv(a, b);
  return [a / g, b / g];
}

/* --------------------------------------------------------------------------
   工坊道具
   -------------------------------------------------------------------------- */

// 一個小漆罐
function drawCan(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.82;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(15,23,42,0.6)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
  // 罐蓋
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  roundRect(ctx, x - 2.5, y - 6, w + 5, 8, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.5)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, x - 2.5, y - 6, w + 5, 8, 3);
  ctx.stroke();
  // 提把
  ctx.strokeStyle = 'rgba(226,232,240,0.5)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x + w / 2, y - 5, w * 0.42, Math.PI * 1.16, Math.PI * 1.84);
  ctx.stroke();
  ctx.restore();
}

// 一排漆罐；label 寫在左邊
function drawCanRow(ctx, n, cy, color, label, count) {
  const w = 34, gap = 9, hh = 40;
  const L = 116, R = 526;
  const total = n * w + (n - 1) * gap;
  let x = L + (R - L - total) / 2;
  for (let i = 0; i < n; i++) {
    drawCan(ctx, x, cy - hh / 2, w, hh, color);
    x += w + gap;
  }
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = f(800, 14);
  ctx.fillText(label, 18, cy - 9);
  ctx.fillStyle = MUTED;
  ctx.font = f(600, 13);
  ctx.fillText(count, 18, cy + 10);
  ctx.restore();
}

// 一根木條（可帶等分刻痕）
function drawStrip(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = o.alpha == null ? 0.72 : o.alpha;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = o.stroke || 'rgba(15,23,42,0.55)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
  if (o.ticks && o.ticks > 1) {
    ctx.strokeStyle = 'rgba(15,23,42,0.42)';
    ctx.lineWidth = 1;
    for (let i = 1; i < o.ticks; i++) {
      const tx = x + (w * i) / o.ticks;
      ctx.beginPath();
      ctx.moveTo(tx, y + 2);
      ctx.lineTo(tx, y + h - 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 一排等寬的小方格（份數示意）
function drawSegs(ctx, x, y, n, segW, h, color) {
  for (let i = 0; i < n; i++) {
    drawStrip(ctx, x + i * (segW + 3), y, segW, h, color);
  }
  return n * segW + (n - 1) * 3;
}

// 左側的列標籤（兩行）
function rowLabel(ctx, title, sub, x, cy, color) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = f(800, 13.5);
  ctx.fillText(title, x, sub ? cy - 9 : cy);
  if (sub) {
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 12);
    ctx.fillText(sub, x, cy + 9);
  }
  ctx.restore();
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 3-1 的 22 題正解
  // 正解字母分布：A 5 題、B 6 題、C 5 題、D 6 題（開發約束 36）
  const answers = {
    '3-1-1': 'C',    // 45:27 的比值 5/3
    '3-1-2': 'D',    // 乙與甲的比值應為 4/11
    '3-1-3': 'A',    // 5/6 ÷ (-10/9) = -3/4
    '3-1-4': 'B',    // (-1.2) ÷ 0.9 = -4/3
    '3-1-5': 'D',    // 同乘以 -2/7，28 → -8
    '3-1-6': 'B',    // 15:(-9) 同除以 -3 得 (-5):3
    '3-1-7': 'D',    // 5/6 : 2/9 同乘 18 得 15:4
    '3-1-8': 'C',    // 9 與 -20 都是整數且互質
    '3-1-9': 'A',    // 5x = -60 ⇒ x = -12
    '3-1-10': 'B',   // 2(2x+1) = 5(x-4) ⇒ x = 22
    '3-1-11': 'C',   // r=4 ⇒ x-y = 8
    '3-1-12': 'D',   // r=5 ⇒ b = 40
    '3-1-13': 'A',   // 11x = 6y ⇒ x:y = 6:11
    '3-1-14': 'D',   // 17r : r ⇒ 比值 17
    '3-1-15': 'B',   // 3x/(2y) 齊次，r 約得掉
    '3-1-16': 'C',   // 比不是數本身，答案隨 r 改變
    '3-1-17': 'A',   // 8x = 3y ⇒ x:y = 3:8
    '3-1-18': 'B',   // r=11 ⇒ 大屋頂 99 片
    '3-1-19': 'C',   // r=12 ⇒ 木片 48 片
    '3-1-20': 'D',   // r=4 ⇒ 共 64 根
    '3-1-21': 'A',   // 150 × 2.6 = 390 公分 = 3.9 公尺
    '3-1-22': 'B'    // 4 : 6000 = 1 : 1500
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
   重點 1：調色配方台
   ========================================================================== */
function initMixCanvas() {
  const cv = document.getElementById('canvas-mix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('mx-a-slider');
  const bS = document.getElementById('mx-b-slider');
  const aV = document.getElementById('mx-a-val');
  const bV = document.getElementById('mx-b-val');
  const out = document.getElementById('mx-formula');
  const fb = document.getElementById('mx-feedback');
  const C = MW_TONE[0];

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '米白漆與天藍漆的比、比值是多少？', C);

    drawCanRow(ctx, a, 88, MW_CREAM, '米白漆', `${a} 匙`);
    drawCanRow(ctx, b, 168, MW_SKYP, '天藍漆', `${b} 匙`);

    const ab = reduce(a, b);
    const ba = reduce(b, a);

    drawStepRows(ctx, [
      {
        name: '① 寫成比',
        hint: '前項是米白、後項是天藍',
        items: [T('米白 : 天藍 =', INK)].concat(ratioItems(a, b, C)),
        color: C
      },
      {
        name: '② 算比值',
        hint: '比值＝前項÷後項',
        items: [T(`${a} ÷ ${b} =`, INK), rawItem(a, b, C), T('=', INK), fItem(a, b, C)],
        color: C
      },
      {
        name: '③ 米白是幾倍',
        hint: '比值就是倍數',
        items: [T('米白 =', INK), fItem(a, b, MW_CREAM), T('× 天藍', INK)],
        color: MW_CREAM
      },
      {
        name: '④ 天藍是幾倍',
        hint: '反過來看，比值互為倒數',
        items: [T('天藍 =', INK), fItem(b, a, MW_SKYP), T('× 米白', INK)],
        color: MW_SKYP
      }
    ], 4, { top: 258, gap: 50, labX: 20, eqX: 176, size: 20, color: C });

    out.innerHTML = wbrEq(`${a} : ${b}`) + '，' +
      wbrEq(`\\text{比值} = ${fTex(a, b)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">米白 : 天藍 \\(= ${a} : ${b}\\)，比值是 \\(${fTex(a, b)}\\)</b><br>` +
      `也就是「米白是天藍的 \\(${fTex(a, b)}\\) 倍」。<br>` +
      (a === b
        ? `兩種漆一樣多，比值是 \\(1\\)，反過來看也是 \\(1\\)。`
        : `反過來寫 \\(${b} : ${a}\\)，比值變成 \\(${fTex(b, a)}\\)——<b style="color:${C}">順序一換，比值就變成倒數</b>。`)
    );
    typeset([out, fb]);
  }

  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：比值計算台（整數 / 分數 / 小數）
   ========================================================================== */
function initValCanvas() {
  const cv = document.getElementById('canvas-val');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('vl-a-slider');
  const bS = document.getElementById('vl-b-slider');
  const aV = document.getElementById('vl-a-val');
  const bV = document.getElementById('vl-b-val');
  const out = document.getElementById('vl-formula');
  const fb = document.getElementById('vl-feedback');
  const modeGroup = document.getElementById('vl-mode-group');
  const C = MW_TONE[1];
  let mode = 'int';

  function draw() {
    const A = MW_NZ9[parseInt(aS.value, 10)];
    const B = MW_NZ9[parseInt(bS.value, 10)];

    // ra、rb 是前項與後項的值，一律以「化簡後的分數」表示（分母 1 就是整數）
    let ra, rb;
    if (mode === 'int') { ra = [A, 1]; rb = [B, 1]; }
    else if (mode === 'frac') { ra = reduce(A, 4); rb = reduce(B, 3); }
    else { ra = reduce(A, 10); rb = reduce(B, 10); }

    const lab = (r, raw) => (mode === 'dec') ? numStr(raw / 10)
      : (r[1] === 1 ? numStr(r[0]) : `${r[0]}/${r[1]}`);
    aV.textContent = lab(ra, A);
    bV.textContent = lab(rb, B);

    const aItem = (mode === 'dec') ? numItem(A / 10, C) : pItem(ra, C, true);
    const bItem = (mode === 'dec') ? numItem(B / 10, C) : pItem(rb, C, true);

    // 比值：分子分母都取「畫面上真的寫出來的那兩個數」，逐步才對得起來
    let vn, vd;
    if (mode === 'int') { vn = A; vd = B; }
    else if (mode === 'frac') { vn = ra[0] * rb[1]; vd = ra[1] * rb[0]; }
    else { vn = A * 10; vd = 10 * B; }
    const vr = reduce(vn, vd);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '這個比的比值是多少？（化成最簡分數）', C);
    drawEqPanel(ctx, [aItem, T(':', INK), bItem], 96, C, { h: 40, size: 26 });

    const rows = [];
    rows.push({ name: '比值的定義', hint: '前項除以後項', items: [aItem, T('÷', INK), bItem], color: C });

    if (mode === 'int') {
      rows.push({
        name: '寫成分數', hint: '除法直接寫成分數',
        items: [rawItem(A, B, C)], color: C
      });
      rows.push({
        name: '化到最簡', hint: `分子分母同除以 ${gcd(A, B)}`,
        items: [fItem(vn, vd, MW_PAD)], color: MW_PAD
      });
    } else {
      let fa = ra, fq = rb;
      if (mode === 'dec') {
        fa = [A, 10]; fq = [B, 10];
        rows.push({
          name: '小數化分數', hint: '小數點後一位，就是十分之幾',
          items: [pItem(fa, C, true), T('÷', INK), pItem(fq, C, true)], color: C
        });
      }
      // 倒數只把分子分母對調（負號提到分子），不可以化簡——化簡過的倒數
      // 會跟下一步實際相乘的兩個數對不起來
      const recip = (fq[0] < 0) ? [-fq[1], -fq[0]] : [fq[1], fq[0]];
      rows.push({
        name: '除以就是乘倒數', hint: '把後項的分子分母對調',
        items: [pItem(fa, C, true), T('×', INK), pItem(recip, C, true)], color: C
      });
      rows.push({
        name: '相乘後化到最簡', hint: '分子乘分子、分母乘分母',
        items: (gcd(vn, vd) === 1)
          ? [fItem(vn, vd, MW_PAD)]
          : [rawItem(vn, vd, C), T('=', INK), fItem(vn, vd, MW_PAD)],
        color: MW_PAD
      });
    }

    numberRows(rows);
    drawStepRows(ctx, rows, rows.length, {
      top: 176, gap: rows.length === 3 ? 76 : 66, labX: 20, eqX: 172, size: 21, color: C
    });

    drawEqPanel(ctx, [T('比值 =', INK), fItem(vn, vd, MW_PAD)], 452, MW_PAD, { h: 34, size: 26 });
    const sign = (vr[0] < 0) ? '異號，比值是負的' : '同號，比值是正的';
    drawNote(ctx, `前項與後項${sign}`, 516, vr[0] < 0 ? MW_RUST : MW_PAD, 14);

    const aWrap = (mode === 'dec') ? numStr(A / 10) : pTexP(ra);
    const bWrap = (mode === 'dec')
      ? (B < 0 ? `\\left(${numStr(B / 10)}\\right)` : numStr(B / 10))
      : pTexP(rb);

    out.innerHTML = `\\(${aWrap} : ${bWrap}\\)<wbr>\\({}\\text{ 的比值} = ${fTex(vn, vd)}\\)`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">比值 \\(= ${fTex(vn, vd)}\\)</b><br>` +
      (mode === 'int'
        ? `整數比直接寫成分數再約分即可。`
        : (mode === 'frac'
          ? `分數比的關鍵是<b style="color:${C}">除以一個分數＝乘以它的倒數</b>。`
          : `小數比先寫成分數（小數點後一位就是十分之幾），再照分數的做法。`)) +
      `<br>兩項${vr[0] < 0 ? '<b style="color:' + MW_RUST + '">異號</b>，所以比值是負的' : '<b style="color:' + MW_PAD + '">同號</b>，所以比值是正的'}。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(modeGroup, 'data-vl-mode', v => { mode = v; draw(); });
  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 3：等比放大縮小台
   ========================================================================== */
const MW_EQ_BASES = [[3, 5], [4, -6], [8, 18]];

function initEqCanvas() {
  const cv = document.getElementById('canvas-eq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const mS = document.getElementById('eq-m-slider');
  const mV = document.getElementById('eq-m-val');
  const out = document.getElementById('eq-formula');
  const fb = document.getElementById('eq-feedback');
  const baseGroup = document.getElementById('eq-base-group');
  const C = MW_TONE[2];
  let bi = 0;

  function bar(cx, cy, val, u, color) {
    const w = Math.abs(val) * u;
    const x = val >= 0 ? cx : cx - w;
    drawStrip(ctx, x, cy - 10, Math.max(w, 2), 20, color);
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = f(800, 13);
    ctx.textBaseline = 'middle';
    ctx.textAlign = val >= 0 ? 'left' : 'right';
    ctx.fillText(numStr(val), val >= 0 ? x + w + 7 : x - 7, cy);
    ctx.restore();
  }

  function draw() {
    const m = MW_NZ6[parseInt(mS.value, 10)];
    mV.textContent = m;
    const a = MW_EQ_BASES[bi][0];
    const b = MW_EQ_BASES[bi][1];
    const na = a * m, nb = b * m;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `前後項同乘以 ${m}，比值變了嗎？`, C);

    const cx = 268;
    const maxAbs = Math.max(Math.abs(a), Math.abs(b), Math.abs(na), Math.abs(nb));
    const u = Math.min(15, 168 / maxAbs);

    // 中央基準線：往右是正、往左是負
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 62);
    ctx.lineTo(cx, 236);
    ctx.stroke();
    ctx.restore();

    rowLabel(ctx, '原比', '前項', 16, 84, MW_WOOD);
    bar(cx, 84, a, u, MW_WOOD);
    rowLabel(ctx, '', '後項', 16, 118, MW_WOOD);
    bar(cx, 118, b, u, MW_WOOD);
    rowLabel(ctx, `同乘 ${m}`, '前項', 16, 176, C);
    bar(cx, 176, na, u, C);
    rowLabel(ctx, '', '後項', 16, 210, C);
    bar(cx, 210, nb, u, C);

    drawStepRows(ctx, [
      {
        name: '① 原本的比',
        hint: '兩根木條的長度比',
        items: ratioItems(a, b, MW_WOOD).concat([T('，比值', INK), fItem(a, b, MW_WOOD)]),
        color: MW_WOOD
      },
      {
        name: '② 前後項同乘',
        hint: `兩項都乘以 ${m}`,
        items: [T(`(${numStr(a)} × ${numStr(m)}) : (${numStr(b)} × ${numStr(m)})`, INK)],
        color: C
      },
      {
        name: '③ 得到新的比',
        hint: '長度都變了',
        items: ratioItems(na, nb, C).concat([T('，比值', INK), fItem(na, nb, C)]),
        color: C
      },
      {
        name: '④ 比一比',
        hint: '兩個比值完全相同',
        items: ratioItems(a, b, MW_WOOD).concat([T('=', MW_PAD)], ratioItems(na, nb, C)),
        color: MW_PAD
      }
    ], 4, { top: 274, gap: 48, labX: 20, eqX: 172, size: 20, color: C });

    out.innerHTML = wbrEq(`${ratioTex(a, b)} = ${ratioTex(na, nb)}`) +
      '，' + wbrEq(`\\text{比值都是 } ${fTex(a, b)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">\\(${ratioTex(a, b)} = ${ratioTex(na, nb)}\\)</b><br>` +
      `兩根木條的長度都變成 \\(${numStr(Math.abs(m))}\\) 倍${m < 0 ? '、而且都換到另一邊（同乘以負數）' : ''}，` +
      `但比值仍然是 \\(${fTex(a, b)}\\)——<b style="color:${MW_PAD}">前後項同乘以不為 \\(0\\) 的數，比不會改變</b>。<br>` +
      `試試看把它們各<b>加上</b>同一個數，比值就守不住了。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(baseGroup, 'data-eq-base', v => { bi = parseInt(v, 10); draw(); });
  mS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 4：化簡工作台
   ========================================================================== */
function initSimpCanvas() {
  const cv = document.getElementById('canvas-simp');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('sp-a-slider');
  const bS = document.getElementById('sp-b-slider');
  const aV = document.getElementById('sp-a-val');
  const bV = document.getElementById('sp-b-val');
  const out = document.getElementById('sp-formula');
  const fb = document.getElementById('sp-feedback');
  const modeGroup = document.getElementById('sp-mode-group');
  const C = MW_TONE[3];
  let mode = 'int';

  function draw() {
    const A = MW_NZ36[parseInt(aS.value, 10)];
    const B = MW_NZ36[parseInt(bS.value, 10)];
    aV.textContent = A;
    bV.textContent = B;

    // 第一步之後都變成整數比 ia : ib
    let ia, ib, srcItems, srcTex, mulK;
    let fracDens = [1, 1];
    if (mode === 'int') {
      ia = A; ib = B;
      srcItems = ratioItems(A, B, C);
      srcTex = ratioTex(A, B);
      mulK = 0;
    } else if (mode === 'frac') {
      const ra = reduce(A, 12), rb = reduce(B, 8);
      fracDens = [ra[1], rb[1]];
      mulK = lcm(ra[1], rb[1]);
      ia = ra[0] * (mulK / ra[1]);
      ib = rb[0] * (mulK / rb[1]);
      srcItems = [pItem(ra, C, true), T(':', INK), pItem(rb, C, true)];
      srcTex = `${pTexP(ra)} : ${pTexP(rb)}`;
    } else {
      mulK = 10;
      ia = A; ib = B;
      srcItems = ratioItems(A / 10, B / 10, C);
      srcTex = ratioTex(A / 10, B / 10);
    }
    const g = simpDiv(ia, ib);
    const fa = ia / g, fb2 = ib / g;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '把它化成最簡整數比', C);

    drawEqPanel(ctx, srcItems, 92, C, { h: 40, size: 26 });

    const rows = [];
    if (mode === 'frac') {
      if (mulK === 1) {
        rows.push({ name: '兩項都是整數', hint: '這一組約分之後剛好都是整數，不必清分母', items: ratioItems(ia, ib, C), color: C });
      } else {
        rows.push({
          name: '清掉分母',
          hint: `分母 ${fracDens[0]} 與 ${fracDens[1]} 的最小公倍數是 ${mulK}，前後項同乘 ${mulK}`,
          items: srcItems.concat([T(`　同乘 ${mulK}`, MUTED)]),
          color: C
        });
        rows.push({ name: '變成整數比', hint: '兩項都是整數了', items: ratioItems(ia, ib, C), color: C });
      }
    } else if (mode === 'dec') {
      rows.push({
        name: '清掉小數',
        hint: '小數點後一位，前後項同乘 10',
        items: srcItems.concat([T('　同乘 10', MUTED)]),
        color: C
      });
      rows.push({ name: '變成整數比', hint: '兩項都是整數了', items: ratioItems(ia, ib, C), color: C });
    } else {
      rows.push({ name: '兩項都是整數', hint: '接下來只要約分', items: ratioItems(ia, ib, C), color: C });
    }
    rows.push({
      name: '找最大公因數',
      hint: `${Math.abs(ia)} 與 ${Math.abs(ib)} 的最大公因數是 ${Math.abs(g)}`,
      items: [T('=', INK), T(String(Math.abs(g)), MW_WOOD)],
      color: MW_WOOD
    });
    rows.push({
      name: '前後項同除',
      hint: g < 0 ? `兩項都是負的，同除以 ${g}，負號一起除掉` : `兩項都除以 ${g}`,
      items: ratioItems(fa, fb2, MW_PAD),
      color: MW_PAD
    });
    rows.push({
      name: '檢查互質',
      hint: '最大公因數是 1 才算最簡',
      items: [T(`gcd(${Math.abs(fa)}, ${Math.abs(fb2)}) = 1`, MW_PAD)],
      color: MW_PAD
    });
    numberRows(rows);

    drawStepRows(ctx, rows, rows.length, {
      top: 176, gap: rows.length >= 5 ? 46 : 56, labX: 20, eqX: 188, size: 20, color: C
    });

    drawEqPanel(ctx, [T('最簡整數比 =', INK)].concat(ratioItems(fa, fb2, MW_PAD)), 424, MW_PAD,
      { h: 30, size: 24 });

    out.innerHTML = wbrEq(`${srcTex} = ${ratioTex(fa, fb2)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">最簡整數比是 \\(${ratioTex(fa, fb2)}\\)</b><br>` +
      (mode === 'int'
        ? `兩項本來就是整數，只要同除以最大公因數 \\(${g}\\)。`
        : (mode === 'frac'
          ? (mulK === 1
            ? `這一組約分之後兩項剛好都是整數，只要再同除以 \\(${g}\\)。`
            : `先同乘以兩個分母的最小公倍數 \\(${mulK}\\) 把分數清掉，再同除以 \\(${g}\\)。`)
          : `先同乘以 \\(10\\) 把小數清掉，再同除以 \\(${g}\\)。`)) +
      `<br>檢查：\\(${Math.abs(fa)}\\) 與 \\(${Math.abs(fb2)}\\) 的最大公因數是 \\(1\\)，` +
      (g === 1 && mode === 'int' ? `所以原本就已經是最簡整數比了。` : `確實化到最簡了。`)
    );
    typeset([out, fb]);
  }

  bindPickGroup(modeGroup, 'data-sp-mode', v => { mode = v; draw(); });
  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 5：交叉相乘解題台
   ========================================================================== */

// 比例式的四個位置：a : b = c : d，並畫出「外項乘積」「內項乘積」兩道弧線
function drawProportion(ctx, items, cy, color) {
  const bw = 96, bh = 42;
  const xs = [34, 162, 296, 424];
  const seps = ['：', '＝', '：'];
  const sepX = [146, 277, 408];

  for (let i = 0; i < 4; i++) {
    drawPanel(ctx, xs[i], cy - bh / 2, bw, bh, color, 0.1);
    drawExpr(ctx, items[i], xs[i] + bw / 2, cy, 20, color, { maxW: bw - 12, gap: 5 });
  }
  ctx.save();
  ctx.fillStyle = INK;
  ctx.font = f(800, 19);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) ctx.fillText(seps[i], sepX[i], cy);
  ctx.restore();

  const c1 = xs[0] + bw / 2, c4 = xs[3] + bw / 2;
  const c2 = xs[1] + bw / 2, c3 = xs[2] + bw / 2;
  const yb = cy + bh / 2, yt = cy - bh / 2;

  // 外項（下方那道弧）
  ctx.save();
  ctx.strokeStyle = MW_WOOD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c1, yb);
  ctx.quadraticCurveTo((c1 + c4) / 2, yb + 62, c4, yb);
  ctx.stroke();
  ctx.fillStyle = MW_WOOD;
  ctx.font = f(800, 13.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('外項乘積', (c1 + c4) / 2, yb + 50);
  ctx.restore();

  // 內項（上方那道弧）
  ctx.save();
  ctx.strokeStyle = MW_SKYP;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c2, yt);
  ctx.quadraticCurveTo((c2 + c3) / 2, yt - 44, c3, yt);
  ctx.stroke();
  ctx.fillStyle = MW_SKYP;
  ctx.font = f(800, 13.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('內項乘積', (c2 + c3) / 2, yt - 26);
  ctx.restore();
}

function initCrossCanvas() {
  const cv = document.getElementById('canvas-cross');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('cr-a-slider');
  const bS = document.getElementById('cr-b-slider');
  const cS = document.getElementById('cr-c-slider');
  const aV = document.getElementById('cr-a-val');
  const bV = document.getElementById('cr-b-val');
  const cV = document.getElementById('cr-c-val');
  const aL = document.getElementById('cr-a-label');
  const bL = document.getElementById('cr-b-label');
  const cRow = document.getElementById('cr-c-row');
  const out = document.getElementById('cr-formula');
  const fb = document.getElementById('cr-feedback');
  const modeGroup = document.getElementById('cr-mode-group');
  const C = MW_TONE[4];
  const LQ = 4, LT = 7;          // 含一次式時兩個後項固定為 4 與 7（兩者不等，一定解得出來）
  let mode = 'num';
  const numState = { a: 6, b: 5, c: 9 };
  const linState = { a: 7, b: 10 };   // MW_P13 索引：p = 1、s = 4

  function applyMode() {
    if (mode === 'num') {
      aS.min = 2; aS.max = 9; aS.value = numState.a;
      bS.min = 0; bS.max = 17; bS.value = numState.b;
      cS.min = 2; cS.max = 9; cS.value = numState.c;
      cRow.style.display = '';
      aL.textContent = '第一個外項';
      bL.textContent = '第一個內項';
    } else {
      aS.min = 0; aS.max = 12; aS.value = linState.a;
      bS.min = 0; bS.max = 12; bS.value = linState.b;
      cRow.style.display = 'none';
      aL.textContent = '左式的常數';
      bL.textContent = '右式的常數';
    }
  }

  function store() {
    if (mode === 'num') {
      numState.a = parseInt(aS.value, 10);
      numState.b = parseInt(bS.value, 10);
      numState.c = parseInt(cS.value, 10);
    } else {
      linState.a = parseInt(aS.value, 10);
      linState.b = parseInt(bS.value, 10);
    }
  }

  function draw() {
    store();
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '用「外項乘積＝內項乘積」解出 x', C);

    let rows, xn, xd, propTex;
    if (mode === 'num') {
      const a = numState.a;
      const b = MW_NZ9[numState.b];
      const c = numState.c;
      aV.textContent = a;
      bV.textContent = b;
      cV.textContent = c;
      xn = b * c; xd = a;

      drawProportion(ctx, [
        [numItem(a, C)], [numItem(b, C)], [numItem(c, C)], [IT('x', MW_PAD)]
      ], 108, C);

      propTex = `${nTex(a)} : ${nTex(b)} = ${nTex(c)} : x`;
      rows = [
        { name: '① 比例式', hint: '外項是頭尾兩個、內項是中間兩個', items: [T(`${nTex(a)} : ${nTex(b)} = ${nTex(c)} :`, INK), IT('x', MW_PAD)], color: C },
        { name: '② 交叉相乘', hint: '外項乘積＝內項乘積', items: [T(`${numStr(a)}`, INK), IT('x', MW_PAD), T(`= ${nTex(b)} × ${nTex(c)}`, INK)], color: C },
        { name: '③ 算出右邊', hint: '兩個內項相乘', items: [T(`${numStr(a)}`, INK), IT('x', MW_PAD), T(`= ${numStr(b * c)}`, C)], color: C },
        { name: '④ 解出 x', hint: `兩邊同除以 ${a}`, items: [IT('x', MW_PAD), T('=', INK), fItem(xn, xd, MW_PAD)], color: MW_PAD }
      ];
    } else {
      const p = MW_P13[linState.a];
      const s = MW_P13[linState.b];
      aV.textContent = p;
      bV.textContent = s;
      xn = LQ * s - LT * p;
      xd = LT - LQ;                              // 3
      const pTx = p === 0 ? '' : (p > 0 ? ` + ${p}` : ` - ${-p}`);
      const sTx = s === 0 ? '' : (s > 0 ? ` + ${s}` : ` - ${-s}`);

      drawProportion(ctx, [
        [inkItems(`(x${pTx})`, C)], [numItem(LQ, C)], [inkItems(`(x${sTx})`, C)], [numItem(LT, C)]
      ], 108, C);

      propTex = `(x${pTx}) : ${LQ} = (x${sTx}) : ${LT}`;
      rows = [
        { name: '① 比例式', hint: '兩個外項是括號與最後那個數', items: [inkItems(`(x${pTx}) : ${LQ} = (x${sTx}) : ${LT}`, INK)], color: C },
        { name: '② 交叉相乘', hint: '外項乘積＝內項乘積', items: [inkItems(`${LT}(x${pTx}) = ${LQ}(x${sTx})`, INK)], color: C },
        { name: '③ 分配律展開', hint: '括號裡每一項都要乘到', items: [inkItems(`${LT}x ${LT * p < 0 ? '- ' + (-LT * p) : '+ ' + LT * p} = ${LQ}x ${LQ * s < 0 ? '- ' + (-LQ * s) : '+ ' + LQ * s}`, INK)], color: C },
        { name: '④ 移項整理', hint: '未知數移到左邊、常數移到右邊', items: [inkItems(`${xd}x = ${numStr(xn)}`, INK)], color: C },
        { name: '⑤ 解出 x', hint: `兩邊同除以 ${xd}`, items: [IT('x', MW_PAD), T('=', INK), fItem(xn, xd, MW_PAD)], color: MW_PAD }
      ];
    }

    drawStepRows(ctx, rows, rows.length, {
      top: 232, gap: mode === 'num' ? 54 : 46, labX: 18, eqX: 150, size: 19, color: C
    });

    out.innerHTML = wbrEq(propTex) + '，' + wbrEq(`x = ${fTex(xn, xd)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">\\(x = ${fTex(xn, xd)}\\)</b><br>` +
      (mode === 'num'
        ? `外項是 <b style="color:${MW_WOOD}">頭尾那兩個</b>、內項是 <b style="color:${MW_SKYP}">中間那兩個</b>，兩組乘積相等，比例式就變成一元一次方程式了。`
        : `括號整組都要乘進去——<b style="color:${C}">只乘第一項</b>是這一型最常見的錯。`) +
      `<br>驗算：把 \\(x = ${fTex(xn, xd)}\\) 代回去，兩邊的比值會相同。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(modeGroup, 'data-cr-mode', v => { mode = v; applyMode(); draw(); });
  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  cS.addEventListener('input', draw);
  applyMode();
  draw();
}

/* ==========================================================================
   重點 6：一份是多少？
   ========================================================================== */
const MW_SH_RATIOS = [[5, 3], [4, 7], [2, 9]];

function initShareCanvas() {
  const cv = document.getElementById('canvas-share');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sS = document.getElementById('sh-s-slider');
  const sV = document.getElementById('sh-s-val');
  const out = document.getElementById('sh-formula');
  const fb = document.getElementById('sh-feedback');
  const ratioGroup = document.getElementById('sh-ratio-group');
  const condGroup = document.getElementById('sh-cond-group');
  const C = MW_TONE[5];
  let ri = 0;
  let cond = 'sum';

  function draw() {
    const S = MW_SVALS[parseInt(sS.value, 10)];
    sV.textContent = S;
    const a = MW_SH_RATIOS[ri][0];
    const b = MW_SH_RATIOS[ri][1];
    const den = (cond === 'sum') ? (a + b) : (a - b);
    const rr = reduce(S, den);          // r = S / den
    const xr = reduce(a * S, den);
    const yr = reduce(b * S, den);
    const rNeg = (rr[0] < 0);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${a} 份與 ${b} 份，一份到底是多少？`, C);

    // 份數示意（畫的是「幾份」，不是實際大小——r 可能是負的或分數）
    const segW = Math.min(30, 300 / Math.max(a, b));
    rowLabel(ctx, 'x', `${a} 份`, 18, 92, MW_CREAM);
    drawSegs(ctx, 74, 78, a, segW, 28, MW_CREAM);
    rowLabel(ctx, 'y', `${b} 份`, 18, 140, MW_SKYP);
    drawSegs(ctx, 74, 126, b, segW, 28, MW_SKYP);
    drawNote(ctx, '每一小格都是一份，也就是 r', 182, MUTED, 13);

    const condTex = (cond === 'sum') ? 'x + y' : 'x - y';
    const combTex = (cond === 'sum')
      ? `${a}r + ${b}r`
      : `${a}r - ${b}r`;

    drawStepRows(ctx, [
      {
        name: '① 依比設份數',
        hint: `x 有 ${a} 份、y 有 ${b} 份`,
        items: [inkItems(`x = ${a}r，y = ${b}r`, C)],
        color: C
      },
      {
        name: '② 代入條件',
        hint: `題目給的是 ${condTex} = ${numStr(S)}`,
        items: [T(`${combTex} = ${numStr(S)}`, INK)],
        color: C
      },
      {
        name: '③ 合併同類項',
        hint: '把 r 的係數加起來',
        items: [T(`${numStr(den)}r = ${numStr(S)}`, INK)],
        color: C
      },
      {
        name: '④ 解出一份',
        hint: `兩邊同除以 ${numStr(den)}`,
        items: [T('r =', INK), fItem(S, den, MW_PAD)],
        color: MW_PAD
      },
      {
        name: '⑤ 回代求值',
        hint: '份數乘上一份的大小',
        items: [IT('x', MW_CREAM), T('=', INK), fItem(a * S, den, MW_CREAM),
                T('，', INK), IT('y', MW_SKYP), T('=', INK), fItem(b * S, den, MW_SKYP)],
        color: C
      }
    ], 5, { top: 224, gap: 48, labX: 18, eqX: 158, size: 19, color: C });

    out.innerHTML = wbrEq(`r = ${fTex(S, den)}`) + '，' +
      wbrEq(`x = ${fTex(a * S, den)}`) + '，' + wbrEq(`y = ${fTex(b * S, den)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">一份是 \\(r = ${fTex(S, den)}\\)，所以 \\(x = ${fTex(a * S, den)}\\)、\\(y = ${fTex(b * S, den)}\\)</b><br>` +
      `檢查：\\(${fTex(a * S, den)} : ${fTex(b * S, den)}\\) 化簡後確實是 \\(${a} : ${b}\\)。<br>` +
      (rNeg
        ? `<b style="color:${MW_RUST}">這裡的 \\(r\\) 是負的</b>，所以 \\(x\\)、\\(y\\) 兩個數都是負數——比值仍然是 \\(${fTex(a, b)}\\)，比沒有變。`
        : (rr[1] === 1
          ? `兩個未知數被壓成一個 \\(r\\)，剩下的就只是一元一次方程式。`
          : `\\(r\\) 不是整數也沒關係，性質② 只要求 \\(r \\ne 0\\)。`))
    );
    typeset([out, fb]);
  }

  bindPickGroup(ratioGroup, 'data-sh-ratio', v => { ri = parseInt(v, 10); draw(); });
  bindPickGroup(condGroup, 'data-sh-cond', v => { cond = v; draw(); });
  sS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 7：係數互換台
   ========================================================================== */
const MW_SW_TARGETS = [
  { tex: 'x : y', a: [1, 0], b: [0, 1] },
  { tex: '2x : 3y', a: [2, 0], b: [0, 3] },
  { tex: '(x+y) : (x-y)', a: [1, 1], b: [1, -1] },
  { tex: '(2x-y) : (x+3y)', a: [2, -1], b: [1, 3] }
];

function initSwapCanvas() {
  const cv = document.getElementById('canvas-swap');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pS = document.getElementById('sw-p-slider');
  const qS = document.getElementById('sw-q-slider');
  const pV = document.getElementById('sw-p-val');
  const qV = document.getElementById('sw-q-val');
  const out = document.getElementById('sw-formula');
  const fb = document.getElementById('sw-feedback');
  const targetGroup = document.getElementById('sw-target-group');
  const C = MW_TONE[6];
  let ti = 0;

  function chip(x, y, w, h, label, color) {
    drawPanel(ctx, x, y, w, h, color, 0.16);
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = f(800, 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
  }

  function curveArrow(x1, y1, x2, y2, bend, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    const mx = (x1 + x2) / 2 + bend;
    const my = (y1 + y2) / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    // 箭頭（自己畫，共用檔的 drawArrow 只有 5.4px 寬，投影下看不見）
    const ang = Math.atan2(y2 - my, x2 - mx);
    const L = 13, HW = 5.5;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - L * Math.cos(ang) - HW * Math.sin(ang), y2 - L * Math.sin(ang) + HW * Math.cos(ang));
    ctx.lineTo(x2 - L * Math.cos(ang) + HW * Math.sin(ang), y2 - L * Math.sin(ang) - HW * Math.cos(ang));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const p = parseInt(pS.value, 10);
    const q = parseInt(qS.value, 10);
    pV.textContent = p;
    qV.textContent = q;
    const g = gcd(p, q);
    const u = q / g, v = p / g;          // x : y = u : v
    const tgt = MW_SW_TARGETS[ti];
    const rn = tgt.a[0] * u + tgt.a[1] * v;
    const rd = tgt.b[0] * u + tgt.b[1] * v;
    const ok = (rd !== 0);
    const res = ok ? simpRatio(rn, rd) : [rn, 0];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '係數會左右互換——注意箭頭的走向', C);

    // 上排：p x = q y
    chip(176, 66, 44, 38, String(p), MW_WOOD);
    chip(292, 66, 44, 38, String(q), MW_SKYP);
    ctx.save();
    ctx.fillStyle = INK;
    ctx.font = fi(800, 22);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', 226, 85);
    ctx.fillText('y', 342, 85);
    ctx.font = f(800, 22);
    ctx.fillText('=', 258, 85);
    ctx.restore();

    // 下排：x : y = u : v
    ctx.save();
    ctx.fillStyle = INK;
    ctx.font = f(800, 20);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('x : y  =', 170, 189);
    ctx.textAlign = 'center';
    ctx.fillText(':', 260, 189);
    ctx.restore();
    chip(176, 170, 44, 38, String(u), MW_SKYP);
    chip(276, 170, 44, 38, String(v), MW_WOOD);

    // 兩道交叉的箭頭：p 跑到後項、q 跑到前項
    curveArrow(198, 108, 298, 166, 76, MW_WOOD);
    curveArrow(314, 108, 200, 166, -66, MW_SKYP);
    if (g > 1) drawNote(ctx, `（${q} : ${p} 同除以最大公因數 ${g}）`, 226, MUTED, 12.5);

    const rows = [
      { name: '① 已知的等式', hint: '兩個係數在等號的兩邊', items: [inkItems(`${p}x = ${q}y`, INK)], color: C },
      { name: '② 兩邊同除', hint: `同除以 ${p * q}，各自留下一個分母`, items: [VF(IT('x', C), T(String(q), C), C), T('=', INK), VF(IT('y', C), T(String(p), C), C)], color: C },
      { name: '③ 寫成比', hint: g > 1 ? `再同除以 ${g} 化到最簡` : '係數互換過來了', items: [T('x : y =', INK)].concat(ratioItems(u, v, MW_PAD)), color: MW_PAD }
    ];
    if (ti === 0) {
      rows.push({ name: '④ 驗算', hint: '代回原式，兩邊相等', items: [T(`${p} × ${u} = ${q} × ${v} = ${p * u}`, MW_PAD)], color: MW_PAD });
    } else {
      rows.push({
        name: '④ 代入目標',
        hint: `設 x = ${u}r、y = ${v}r，r 會約掉`,
        items: ok
          ? [T(`${tgt.tex} = `, INK), T(`${numStr(rn)}r : ${numStr(rd)}r = `, C)].concat(ratioItems(res[0], res[1], MW_PAD))
          : [T(`${tgt.tex} = ${numStr(rn)}r : 0`, MW_RUST)],
        color: ok ? MW_PAD : MW_RUST
      });
    }

    drawStepRows(ctx, rows, rows.length, {
      top: 260, gap: 50, labX: 18, eqX: 168, size: 20, color: C
    });

    if (!ok) drawNote(ctx, '後項是 0，這個比的比值不存在', 456, MW_RUST, 13.5);

    out.innerHTML = wbrEq(`${p}x = ${q}y`) + '，' + wbrEq(`x : y = ${u} : ${v}`) +
      (ti === 0 ? '' : ('，' + (ok
        ? wbrEq(`${tgt.tex} = ${ratioTex(res[0], res[1])}`)
        : `\\(${tgt.tex}\\)<wbr>\\({}\\text{ 的後項為 } 0\\)`)));

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">由 \\(${p}x = ${q}y\\) 得 \\(x : y = ${u} : ${v}\\)</b><br>` +
      `注意 \\(x\\) 的係數 \\(${p}\\) 跑到了<b style="color:${MW_WOOD}">後項</b>、\\(y\\) 的係數 \\(${q}\\) 跑到了<b style="color:${MW_SKYP}">前項</b>` +
      (g > 1 ? `（再同除以最大公因數 \\(${g}\\)）` : '') + `。<br>` +
      (ti === 0
        ? `直覺檢查：係數大的那一邊，數量反而小。`
        : (ok
          ? `設 \\(x = ${u}r\\)、\\(y = ${v}r\\) 代進去，\\(r\\) 上下相消，` + wbrEq(`${tgt.tex} = ${ratioTex(res[0], res[1])}`) + `。`
          : `<b style="color:${MW_RUST}">這一組的後項算出來是 \\(0\\)</b>，比值不存在（不能除以 \\(0\\)）。把 \\(p\\) 或 \\(q\\) 調開就好。`))
    );
    typeset([out, fb]);
  }

  bindPickGroup(targetGroup, 'data-sw-target', v => { ti = parseInt(v, 10); draw(); });
  pS.addEventListener('input', draw);
  qS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 8：r 一變，誰跟著變？
   ========================================================================== */
function initFixCanvas() {
  const cv = document.getElementById('canvas-fix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const rS = document.getElementById('fx-r-slider');
  const rV = document.getElementById('fx-r-val');
  const out = document.getElementById('fx-formula');
  const fb = document.getElementById('fx-feedback');
  const C = MW_TONE[7];
  const A = 7, B = 3;      // 固定 x : y = 7 : 3

  function draw() {
    const r = MW_NZ5[parseInt(rS.value, 10)];
    rV.textContent = r;
    const x = A * r, y = B * r;
    const hn = 2 * x, hd = 3 * y;          // 齊次：2x : 3y
    const nn = x + 1, nd = y + 1;          // 非齊次：(x+1) : (y+1)
    const ndZero = (nd === 0);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `固定 x : y = ${A} : ${B}，只換一份的大小 r`, C);

    drawEqPanel(ctx, [T(`r = ${r}`, C), T('　→　', INK),
      IT('x', MW_CREAM), T(`= ${numStr(x)}`, MW_CREAM), T('，', INK),
      IT('y', MW_SKYP), T(`= ${numStr(y)}`, MW_SKYP)], 78, C, { h: 30, size: 21 });

    // 齊次
    drawPanel(ctx, 20, 112, 500, 62, MW_PAD, 0.09);
    drawExpr(ctx, [T('2x : 3y =', INK), T(`${numStr(2 * A)}r : ${numStr(3 * B)}r =`, MUTED)]
      .concat(ratioItems(simpRatio(hn, hd)[0], simpRatio(hn, hd)[1], MW_PAD)),
      270, 134, 20, MW_PAD, { maxW: 480, gap: 6 });
    drawChip(ctx, 186, 148, 168, 22, '不隨 r 改變', MW_PAD, 'rgba(134,239,172,0.12)');

    // 非齊次
    drawPanel(ctx, 20, 190, 500, 62, MW_RUST, 0.09);
    drawExpr(ctx, ndZero
      ? [T('(x+1) : (y+1) =', INK), T(`${numStr(nn)} : 0`, MW_RUST)]
      : [T('(x+1) : (y+1) =', INK), T(`${numStr(nn)} : ${numStr(nd)} =`, MUTED)]
        .concat(ratioItems(simpRatio(nn, nd)[0], simpRatio(nn, nd)[1], MW_RUST)),
      270, 212, 20, MW_RUST, { maxW: 480, gap: 6 });
    drawChip(ctx, 186, 226, 168, 22, '隨 r 一直在變', MW_RUST, 'rgba(252,165,165,0.12)');

    // 下方對照表：r = 1 ~ 5 的 (x+1):(y+1) 比值
    ctx.save();
    ctx.fillStyle = INK;
    ctx.font = f(800, 13.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('把 r 換成 1、2、3、4、5，(x+1) : (y+1) 的比值：', 20, 282);
    ctx.restore();

    const cols = [1, 2, 3, 4, 5];
    const cw = 96;
    const x0 = 26;
    cols.forEach((k, i) => {
      const cx = x0 + i * cw + cw / 2;
      const hit = (k === r);
      drawPanel(ctx, x0 + i * cw + 4, 306, cw - 8, 96, hit ? C : MUTED, hit ? 0.2 : 0.06);
      ctx.save();
      ctx.fillStyle = hit ? C : MUTED;
      ctx.font = f(800, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`r = ${k}`, cx, 326);
      ctx.restore();
      drawExpr(ctx, [fItem(A * k + 1, B * k + 1, hit ? MW_RUST : INK)], cx, 368, 21, INK, { maxW: cw - 16, gap: 4 });
    });

    drawNote(ctx, '五格的值全都不一樣 → 它不是一個固定的數', 430, MW_RUST, 14);

    out.innerHTML = wbrEq(`x = ${numStr(x)}`) + '，' + wbrEq(`y = ${numStr(y)}`) +
      `，\\(2x : 3y = ${ratioTex(simpRatio(hn, hd)[0], simpRatio(hn, hd)[1])}\\)` +
      (ndZero
        ? `，\\((x+1) : (y+1) = ${numStr(nn)} : 0\\)`
        : `，\\((x+1) : (y+1) = ${ratioTex(simpRatio(nn, nd)[0], simpRatio(nn, nd)[1])}\\)`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${MW_PAD}">\\(2x : 3y\\) 永遠是 \\(${ratioTex(simpRatio(2 * A, 3 * B)[0], simpRatio(2 * A, 3 * B)[1])}\\)</b>——` +
      `分子分母都是<b>沒有常數項</b>的一次式，\\(r\\) 上下相消。<br>` +
      (ndZero
        ? `<b style="color:${MW_RUST}">\\((x+1) : (y+1)\\) 的後項這時候剛好是 \\(0\\)</b>，比值根本不存在。`
        : `<b style="color:${MW_RUST}">\\((x+1) : (y+1)\\) 現在是 \\(${ratioTex(simpRatio(nn, nd)[0], simpRatio(nn, nd)[1])}\\)</b>，` +
          `換一個 \\(r\\) 就換一個答案——多了 \\(+1\\) 這個常數，\\(r\\) 就約不掉了。`) +
      `<br>所以「\\(x : y = ${A} : ${B}\\)」<b style="color:${C}">不代表</b> \\(x = ${A}\\)、\\(y = ${B}\\)。`
    );
    typeset([out, fb]);
  }

  rS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 9：倍數換算台
   ========================================================================== */
function initTimesCanvas() {
  const cv = document.getElementById('canvas-times');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const mS = document.getElementById('tm-m-slider');
  const nS = document.getElementById('tm-n-slider');
  const sS = document.getElementById('tm-s-slider');
  const mV = document.getElementById('tm-m-val');
  const nV = document.getElementById('tm-n-val');
  const sV = document.getElementById('tm-s-val');
  const out = document.getElementById('tm-formula');
  const fb = document.getElementById('tm-feedback');
  const C = MW_TONE[8];

  function draw() {
    const m = parseInt(mS.value, 10);
    const n = parseInt(nS.value, 10);
    const S = parseInt(sS.value, 10);
    mV.textContent = m;
    nV.textContent = n;
    sV.textContent = S;

    const g = gcd(m, n);
    const u = n / g, v = m / g;         // x : y = n : m，先化到最簡
    const den = u + v;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `甲的 ${m} 倍 ＝ 乙的 ${n} 倍`, C);

    // 兩排總長相同：甲排 m 段、乙排 n 段，每段長度就是各自的數量
    const W = 336, x0 = 148;
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    [x0, x0 + W].forEach(px => {
      ctx.beginPath();
      ctx.moveTo(px, 62);
      ctx.lineTo(px, 176);
      ctx.stroke();
    });
    ctx.restore();

    const segM = W / m, segN = W / n;
    for (let i = 0; i < m; i++) drawStrip(ctx, x0 + i * segM + 1.5, 76, segM - 3, 26, MW_CREAM);
    for (let i = 0; i < n; i++) drawStrip(ctx, x0 + i * segN + 1.5, 128, segN - 3, 26, MW_SKYP);
    rowLabel(ctx, '甲（x）', `${m} 根一樣長`, 16, 89, MW_CREAM);
    rowLabel(ctx, '乙（y）', `${n} 根一樣長`, 16, 141, MW_SKYP);
    drawNote(ctx, '兩排總長相同，所以「根數多的那一種比較短」', 194, MUTED, 13);

    drawStepRows(ctx, [
      {
        name: '① 翻成等式',
        hint: '兩邊一樣多',
        items: [inkItems(`${m}x = ${n}y`, INK)],
        color: C
      },
      {
        name: '② 反求比',
        hint: g > 1 ? `係數互換後再同除以 ${g}` : '係數左右互換',
        items: [T('x : y =', INK)].concat(ratioItems(u, v, C)),
        color: C
      },
      {
        name: '③ 設出份數',
        hint: 'x 與 y 各佔幾份',
        items: [inkItems(`x = ${u}r，y = ${v}r`, C)],
        color: C
      },
      {
        name: '④ 代入總量',
        hint: `x + y = ${S}`,
        items: [T(`${u}r + ${v}r = ${den}r = ${S}`, INK)],
        color: C
      },
      {
        name: '⑤ 解出答案',
        hint: '份數乘上一份的大小',
        items: [T('r =', INK), fItem(S, den, MW_WOOD), T('，', INK),
                IT('x', MW_CREAM), T('=', INK), fItem(u * S, den, MW_CREAM),
                T('，', INK), IT('y', MW_SKYP), T('=', INK), fItem(v * S, den, MW_SKYP)],
        color: MW_PAD
      }
    ], 5, { top: 226, gap: 46, labX: 18, eqX: 150, size: 18, color: C });

    out.innerHTML = wbrEq(`${m}x = ${n}y`) + '，' + wbrEq(`x : y = ${u} : ${v}`) +
      '，' + wbrEq(`x = ${fTex(u * S, den)}`) + '，' + wbrEq(`y = ${fTex(v * S, den)}`);

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">\\(${m}x = ${n}y \\Rightarrow x : y = ${u} : ${v}\\)</b><br>` +
      (m === n
        ? `兩個倍數一樣，所以甲和乙<b>一樣多</b>，比是 \\(1 : 1\\)。`
        : (m > n
          ? `甲要乘上比較大的 \\(${m}\\) 倍才追得上，表示<b style="color:${MW_CREAM}">甲比較少</b>。`
          : `乙要乘上比較大的 \\(${n}\\) 倍才追得上，表示<b style="color:${MW_SKYP}">乙比較少</b>。`)) +
      `<br>配上 \\(x + y = ${S}\\)，一份是 \\(r = ${fTex(S, den)}\\)，` +
      `所以 \\(x = ${fTex(u * S, den)}\\)、\\(y = ${fTex(v * S, den)}\\)。`
    );
    typeset([out, fb]);
  }

  mS.addEventListener('input', draw);
  nS.addEventListener('input', draw);
  sS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 10：進出料工作台
   ========================================================================== */
const MW_CHG_CASES = [
  { a: 5, b: 2, p: 4, q: 4, c: 2, d: 1, name: '各加料',
    story: '兩種材料各補進 4 件', ans: 4 },
  { a: 3, b: 7, p: -3, q: -5, c: 2, d: 5, name: '各領走',
    story: '甲領走 3 件、乙領走 5 件', ans: 5 },
  { a: 9, b: 4, p: -3, q: 3, c: 8, d: 5, name: '一加一減',
    story: '甲領走 3 件、乙補進 3 件', ans: 3 }
];

function initChgCanvas() {
  const cv = document.getElementById('canvas-chg');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const rS = document.getElementById('cg-r-slider');
  const rV = document.getElementById('cg-r-val');
  const out = document.getElementById('cg-formula');
  const fb = document.getElementById('cg-feedback');
  const caseGroup = document.getElementById('cg-case-group');
  const C = MW_TONE[9];
  let ci = 0;

  // 一列：底色是原本的量，右邊接上（或末端劃掉）變化的量
  function line(cy, base, delta, u, color, label, sub) {
    const x0 = 132;
    rowLabel(ctx, label, sub, 16, cy, color);
    if (delta >= 0) {
      drawStrip(ctx, x0, cy - 13, Math.max(base * u, 2), 26, color);
      if (delta > 0) drawStrip(ctx, x0 + base * u + 2, cy - 13, Math.max(delta * u, 2), 26, MW_PAD);
    } else {
      const keep = base + delta;
      drawStrip(ctx, x0, cy - 13, Math.max(keep * u, 2), 26, color);
      drawStrip(ctx, x0 + keep * u + 2, cy - 13, Math.max(-delta * u, 2), 26, MW_RUST, { alpha: 0.3 });
    }
  }

  function draw() {
    const r = parseInt(rS.value, 10);
    rV.textContent = r;
    const cs = MW_CHG_CASES[ci];
    const ox = cs.a * r, oy = cs.b * r;
    const nx = ox + cs.p, ny = oy + cs.q;
    const sim = (ny === 0) ? [nx, 0] : simpRatio(nx, ny);
    const hit = (ny !== 0) && (nx * cs.d === ny * cs.c);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `原本 ${cs.a} : ${cs.b}，${cs.story}，要變成 ${cs.c} : ${cs.d}`, C);

    const span = Math.max(ox, oy, nx, ny, 1);
    const u = Math.min(9, 340 / span);
    line(80, ox, cs.p, u, MW_CREAM, '甲', `原本 ${ox} 件`);
    line(128, oy, cs.q, u, MW_SKYP, '乙', `原本 ${oy} 件`);
    drawNote(ctx, cs.p >= 0 && cs.q >= 0 ? '綠色是補進來的量' : '淡紅色是被領走的量', 168, MUTED, 13);

    drawStepRows(ctx, [
      {
        name: '① 原本的量',
        hint: `一份是 ${r}，甲 ${cs.a} 份、乙 ${cs.b} 份`,
        items: [T(`${cs.a}r = ${ox}`, MW_CREAM), T('，', INK), T(`${cs.b}r = ${oy}`, MW_SKYP)],
        color: C
      },
      {
        name: '② 變化後的量',
        hint: '領走的要寫成負的',
        items: [T(`${ox} ${cs.p < 0 ? '- ' + (-cs.p) : '+ ' + cs.p} = ${nx}`, MW_CREAM), T('，', INK),
                T(`${oy} ${cs.q < 0 ? '- ' + (-cs.q) : '+ ' + cs.q} = ${ny}`, MW_SKYP)],
        color: C
      },
      {
        name: '③ 化成最簡比',
        hint: '把變化後的兩個量寫成比',
        items: (ny === 0)
          ? [T(`${nx} : 0`, MW_RUST)]
          : ratioItems(nx, ny, C).concat([T('=', INK)], ratioItems(sim[0], sim[1], C)),
        color: C
      },
      {
        name: '④ 對上目標了嗎',
        hint: `目標是 ${cs.c} : ${cs.d}`,
        items: hit
          ? [T(`${sim[0]} : ${sim[1]}`, MW_PAD), T('＝', MW_PAD), T(`${cs.c} : ${cs.d}`, MW_PAD), T('　對上了', MW_PAD)]
          : [T((ny === 0 ? `${nx} : 0` : `${sim[0]} : ${sim[1]}`), MW_RUST), T('≠', MW_RUST), T(`${cs.c} : ${cs.d}`, MW_RUST), T('　再調 r', MW_RUST)],
        color: hit ? MW_PAD : MW_RUST
      }
    ], 4, { top: 216, gap: 52, labX: 18, eqX: 168, size: 19, color: C });

    if (hit) {
      drawChip(ctx, 150, 424, 240, 30, `r = ${r}，原本是 ${ox} 與 ${oy}`, MW_PAD, 'rgba(134,239,172,0.12)');
    } else {
      drawNote(ctx, `把 r 調到 ${cs.ans} 試試看`, 440, MUTED, 14);
    }

    out.innerHTML = wbrEq(`(${cs.a}r ${cs.p < 0 ? '- ' + (-cs.p) : '+ ' + cs.p}) : (${cs.b}r ${cs.q < 0 ? '- ' + (-cs.q) : '+ ' + cs.q}) = ${cs.c} : ${cs.d}`) +
      `，\\(r = ${r}\\) <wbr>\\({}\\Rightarrow ${nx} : ${ny}\\)`;

    fb.innerHTML = wrapFeedback(
      (hit
        ? `<b style="color:${MW_PAD}">對上了！\\(r = ${r}\\)，原本是 \\(${ox}\\) 與 \\(${oy}\\)</b><br>` +
          `直接算的話：\\(${cs.d}(${cs.a}r ${cs.p < 0 ? '- ' + (-cs.p) : '+ ' + cs.p}) = ${cs.c}(${cs.b}r ${cs.q < 0 ? '- ' + (-cs.q) : '+ ' + cs.q})\\)，` +
          `整理後就會解出 \\(r = ${cs.ans}\\)——不必一個一個試。`
        : `<b style="color:${MW_RUST}">\\(r = ${r}\\) 時變化後是 \\(${nx} : ${ny}\\)</b>，` +
          (ny === 0 ? '後項變成 \\(0\\) 了，' : `化簡後是 \\(${sim[0]} : ${sim[1]}\\)，`) +
          `還不是 \\(${cs.c} : ${cs.d}\\)。<br>` +
          `一個一個試很慢——正式做法是列出比例式 \\((${cs.a}r ${cs.p < 0 ? '- ' + (-cs.p) : '+ ' + cs.p}) : (${cs.b}r ${cs.q < 0 ? '- ' + (-cs.q) : '+ ' + cs.q}) = ${cs.c} : ${cs.d}\\)，交叉相乘直接解出 \\(r\\)。`)
    );
    typeset([out, fb]);
  }

  bindPickGroup(caseGroup, 'data-cg-case', v => { ci = parseInt(v, 10); draw(); });
  rS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 11：比例尺換算台
   ========================================================================== */
const MW_SCALE_KS = [200, 800, 25000];

function initScaleCanvas() {
  const cv = document.getElementById('canvas-scale');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const lS = document.getElementById('sc-l-slider');
  const lV = document.getElementById('sc-l-val');
  const out = document.getElementById('sc-formula');
  const fb = document.getElementById('sc-feedback');
  const kGroup = document.getElementById('sc-k-group');
  const C = MW_TONE[10];
  let ki = 0;

  // 一棟小屋的側影，寬度就是圖上量到的長度
  function house(x, yBase, w) {
    const h = Math.min(w * 0.62, 64);
    const wallH = h * 0.58;
    ctx.save();
    ctx.fillStyle = MW_WOOD;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(x, yBase - wallH, w, wallH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(15,23,42,0.55)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x, yBase - wallH, w, wallH);
    ctx.fillStyle = MW_RUST;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 3, yBase - wallH);
    ctx.lineTo(x + w / 2, yBase - h);
    ctx.lineTo(x + w + 3, yBase - wallH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(15,23,42,0.55)';
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const L = parseInt(lS.value, 10);
    const k = MW_SCALE_KS[ki];
    lV.textContent = L;
    const cm = k * L;
    const m = cm / 100;
    const km = m / 1000;
    const useKm = (k >= 10000);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `比例尺 1 : ${k}，圖上量到 ${L} 公分`, C);

    // 直尺：12px 代表 1 公分，總長 20 公分
    const PX = 12, RX = 150, RY = 168;
    ctx.save();
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(RX, RY);
    ctx.lineTo(RX + 20 * PX, RY);
    ctx.stroke();
    ctx.font = f(600, 11);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 20; i++) {
      const tx = RX + i * PX;
      const big = (i % 5 === 0);
      ctx.strokeStyle = big ? INK : 'rgba(148,163,184,0.7)';
      ctx.lineWidth = big ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(tx, RY);
      ctx.lineTo(tx, RY + (big ? 10 : 6));
      ctx.stroke();
      if (big) {
        ctx.fillStyle = MUTED;
        ctx.fillText(String(i), tx, RY + 12);
      }
    }
    ctx.restore();

    house(RX, RY - 2, L * PX);

    // 量到的長度標線：畫在小屋上方，不要壓到屋頂
    const houseH = Math.min(L * PX * 0.62, 64);
    const mY = RY - 2 - houseH - 12;
    ctx.save();
    ctx.strokeStyle = C;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(RX, mY);
    ctx.lineTo(RX + L * PX, mY);
    ctx.stroke();
    [RX, RX + L * PX].forEach(px => {
      ctx.beginPath();
      ctx.moveTo(px, mY - 5);
      ctx.lineTo(px, mY + 5);
      ctx.stroke();
    });
    ctx.fillStyle = C;
    ctx.font = f(800, 13.5);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`圖上 ${L} 公分`, RX + L * PX / 2, mY - 7);
    ctx.restore();

    drawNote(ctx, '尺上一格是 1 公分', 200, MUTED, 13);

    drawStepRows(ctx, [
      {
        name: '① 比例尺的意義',
        hint: '圖上距離 : 實際距離',
        items: [T(`1 : ${k}`, C)],
        color: C
      },
      {
        name: '② 列出比例式',
        hint: '兩個比相等',
        items: [T(`1 : ${k} = ${L} :`, INK), IT('x', MW_PAD)],
        color: C
      },
      {
        name: '③ 交叉相乘',
        hint: '外項乘積＝內項乘積',
        items: [IT('x', MW_PAD), T(`= ${k} × ${L} = ${numStr(cm)}`, INK), T('公分', MUTED)],
        color: C
      },
      {
        name: '④ 換算單位',
        hint: useKm ? '100 公分是 1 公尺、1000 公尺是 1 公里' : '100 公分是 1 公尺',
        items: useKm
          ? [T(`= ${numStr(m)} 公尺 = ${numStr(km)} 公里`, MW_PAD)]
          : [T(`= ${numStr(m)} 公尺`, MW_PAD)],
        color: MW_PAD
      }
    ], 4, { top: 240, gap: 52, labX: 18, eqX: 176, size: 19, color: C });

    out.innerHTML = wbrEq(`1 : ${k} = ${L} : x`) + '，' +
      `\\(x = ${numStr(cm)}\\)<wbr>\\({}\\text{ 公分} = ${numStr(m)}\\text{ 公尺}\\)` +
      (useKm ? `<wbr>\\({}= ${numStr(km)}\\text{ 公里}\\)` : '');

    fb.innerHTML = wrapFeedback(
      `<b style="color:${C}">圖上 \\(${L}\\) 公分 → 實際 \\(${numStr(m)}\\) 公尺` +
      (useKm ? `（\\(${numStr(km)}\\) 公里）` : '') + `</b><br>` +
      `比例尺 \\(1 : ${k}\\) 的意思是「圖上 \\(1\\) 公分代表實際 \\(${k}\\) 公分」，所以先乘以 \\(${k}\\) 得到<b>公分</b>，再換算單位。<br>` +
      `<b style="color:${MW_RUST}">最常見的錯就是忘了換單位</b>——算出 \\(${numStr(cm)}\\) 就直接寫成公尺。`
    );
    typeset([out, fb]);
  }

  bindPickGroup(kGroup, 'data-sc-k', v => { ki = parseInt(v, 10); draw(); });
  lS.addEventListener('input', draw);
  draw();
}
