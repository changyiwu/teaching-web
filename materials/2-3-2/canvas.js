/* ==========================================================================
   3-2 正比與反比 — 互動 Canvas 與隨堂評量
   畫風：微縮建築模型工坊（沿用 3-1，暖木色調＋厚塗廣告顏料）

   共用工具在 ../math-canvas.js（T／IT／FR／SEQ／GRP／drawExpr／drawStepRows／
   drawPanel／drawChip／wbrEq／reduce／texFrac／gcd…），本檔只放本節專屬的
   色票、道具形狀與 10 個互動。

   正比與反比的三組重點（判斷／求值／應用）走同一套引擎，用 mode 參數切換：
     mode 'ratio' ＝ 正比（看 y ÷ x）、mode 'prod' ＝ 反比（看 x × y）
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initMeanCanvas();
  initCheckCanvas({ cid: 'canvas-chk', pre: 'ck', mode: 'ratio', cases: PR_RATIO_CASES, tone: 1 });
  initSolveCanvas({ cid: 'canvas-sol', pre: 'sl', mode: 'ratio', tone: 2 });
  initApplyCanvas({ cid: 'canvas-app', pre: 'ap', mode: 'ratio', cases: PR_APPLY_DIRECT, tone: 3 });
  initTileCanvas();
  initCheckCanvas({ cid: 'canvas-chk2', pre: 'ck2', mode: 'prod', cases: PR_PROD_CASES, tone: 5 });
  initSolveCanvas({ cid: 'canvas-sol2', pre: 'sl2', mode: 'prod', tone: 6 });
  initApplyCanvas({ cid: 'canvas-app2', pre: 'ap2', mode: 'prod', cases: PR_APPLY_INVERSE, tone: 7 });
  initTrendCanvas();
  initFixCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

// 工坊的材質色（PR_ = Proportion；共用檔沒有這個前綴的符號）
const PR_CREAM = '#f5edd8';   // 米白漆／淺木
const PR_SKY = '#7dd3fc';     // 天藍漆
const PR_WOOD = '#f0c48a';    // 木料
const PR_PAD = '#4ade80';     // 切割墊綠
const PR_RUST = '#fca5a5';    // 紅漆

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const PR_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7',
                 '#d8b4fe', '#fdba74', '#f9a8d4', '#bef264', '#67e8f9'];

// 非零整數的滑桿對照表（滑桿沒有辦法「跳過 0」，改用索引）
const PR_NZ6 = [];
for (let v = -6; v <= 6; v++) if (v !== 0) PR_NZ6.push(v);   // 12 個，索引 0..11
const PR_NZ9 = [];
for (let v = -9; v <= 9; v++) if (v !== 0) PR_NZ9.push(v);   // 18 個，索引 0..17

/**
 * 化簡後的 LaTeX 分數。
 * ⚠️ 共用檔的 texFrac() 不化簡（texFrac(6,2) 會印出 6/2），畫布上的分數
 * 元件卻走 reduce()——所有 LaTeX 分數一律走這個。
 */
function fTex(n, d) {
  const r = reduce(n, d);
  return texFrac(r[0], r[1]);
}

// 需要括號的位置（乘號旁邊、除號後面）：負數加括號
function nTex(v) {
  return v < 0 ? `(${numStr(v)})` : numStr(v);
}

// 已化簡的分數 [n, d] → LaTeX；分母為 1 時寫整數
function pTex(r) {
  return (r[1] === 1) ? numStr(r[0]) : texFrac(r[0], r[1]);
}

// 同上，負數在乘號旁邊時加括號
function pTexP(r) {
  const t = pTex(r);
  return (r[0] < 0) ? `\\left(${t}\\right)` : t;
}

// 正比的係數寫在 x 前面：1 不寫、-1 只寫負號
function kTex(r) {
  if (r[1] === 1) return coefTex(r[0]);
  return texFrac(r[0], r[1]);
}

// canvas 上的一個數（負數加括號）
function numItem(v, color) {
  return T(v < 0 ? `(${numStr(v)})` : numStr(v), color);
}

// canvas 上的分數元件：先化簡，分母為 1 寫整數，負號提到分數外面
function fItem(n, d, color) {
  return pItem(reduce(n, d), color, false);
}

// 已化簡的 [n, d] → canvas 元件；paren 為 true 時負數外面包括號
function pItem(r, color, paren) {
  if (r[1] === 1) return paren ? numItem(r[0], color) : T(numStr(r[0]), color);
  const body = (r[0] < 0) ? SEQ([T('-', color), FR(-r[0], r[1], color)], color, 2) : FR(r[0], r[1], color);
  return (paren && r[0] < 0) ? GRP([body], '()', color) : body;
}

// canvas 上的「kx」：1 不寫、-1 只寫負號，分數係數畫成直式分數
function kxItems(r, color) {
  if (r[1] === 1) {
    if (r[0] === 1) return [IT('x', color)];
    if (r[0] === -1) return [SEQ([T('-', color), IT('x', color)], color, 1)];
    return [SEQ([T(numStr(r[0]), color), IT('x', color)], color, 1)];
  }
  if (r[0] < 0) return [SEQ([T('-', color), FR(-r[0], r[1], color), IT('x', color)], color, 3)];
  return [SEQ([FR(r[0], r[1], color), IT('x', color)], color, 3)];
}

// canvas 上的「xy」
function xyItem(color) {
  return SEQ([IT('x', color), IT('y', color)], color, 1);
}

// 分數的四則（都回傳化簡後的 [n, d]）
function rMul(a, b) { return reduce(a[0] * b[0], a[1] * b[1]); }
function rDiv(a, b) { return reduce(a[0] * b[1], a[1] * b[0]); }
function rEq(a, b) { return a[0] === b[0] && a[1] === b[1]; }

// 步驟列的編號：列數會隨模式改變，號碼一律在畫之前重編一次才不會跳號
const PR_NUMS = ['①', '②', '③', '④', '⑤', '⑥'];
function numberRows(rows) {
  rows.forEach((r, i) => { r.name = PR_NUMS[i] + ' ' + r.name; });
  return rows;
}

/* --------------------------------------------------------------------------
   工坊道具
   -------------------------------------------------------------------------- */

// 一根木條（圓角長方形）
function drawStrip(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha == null ? 0.75 : alpha;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(15,23,42,0.55)';
  ctx.lineWidth = 1.4;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
  ctx.restore();
}

// 一塊方磚
function drawTile(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(15,23,42,0.6)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
  ctx.restore();
}

// 左側的列標籤（兩行）
function rowLabel(ctx, title, sub, x, cy, color) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = f(800, 14);
  ctx.fillText(title, x, sub ? cy - 10 : cy);
  if (sub) {
    ctx.fillStyle = MUTED;
    ctx.font = f(600, 12.5);
    ctx.fillText(sub, x, cy + 10);
  }
  ctx.restore();
}

// 置中的一行字
function centerText(ctx, text, cx, cy, color, font) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// 一組互斥按鈕的 active 狀態，改由程式切換（切換情境時要把按鈕歸位）
function setActive(groupEl, attr, value) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute(attr) === String(value));
  });
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第二冊 3-2 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '3-2-1': 'C',    // x 變 3 倍，y 也變 3 倍：10 → 30
    '3-2-2': 'A',    // x 變 1/10 倍，y 也變 1/10 倍
    '3-2-3': 'D',    // (3,4)(6,8)(12,16) 比值都是 4/3
    '3-2-4': 'C',    // 45 秒 = 3/4 分，y = 3/4 x
    '3-2-5': 'A',    // k = -3/2，y = 15
    '3-2-6': 'C',    // k = -2/3，x = 21
    '3-2-7': 'B',    // k = 3/4，28 分鐘 21 公尺
    '3-2-8': 'D',    // 4 分 30 秒 = 9/2 分，k = 4/3，16 根
    '3-2-9': 'B',    // xy = 60，y = 5
    '3-2-10': 'B',   // x 變 1/5 倍，y 變 5 倍
    '3-2-11': 'A',   // (2,15)(3,10)(6,5) 乘積都是 30
    '3-2-12': 'B',   // 150 毫升平均倒入 x 罐
    '3-2-13': 'A',   // k = -24，y = -2
    '3-2-14': 'C',   // k = -6，x = -3/2
    '3-2-15': 'A',   // k = 60，10 位師傅
    '3-2-16': 'D',   // 2400 立方公分 ÷ 150 = 16
    '3-2-17': 'D',   // y = -x/4 是正比，x 愈大 y 愈小
    '3-2-18': 'C',   // x + y = 15 不是反比、xy = 20 是反比
    '3-2-19': 'D',   // 底固定時，面積與高成正比
    '3-2-20': 'B'    // 距離相同，速率比 = 18 : 12 = 3 : 2
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
   重點 1：木條秤重台——根數變幾倍，總重就變幾倍
   ========================================================================== */
function initMeanCanvas() {
  const cv = document.getElementById('canvas-mean');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const kS = document.getElementById('mn-k-slider');
  const aS = document.getElementById('mn-a-slider');
  const bS = document.getElementById('mn-b-slider');
  const kV = document.getElementById('mn-k-val');
  const aV = document.getElementById('mn-a-val');
  const bV = document.getElementById('mn-b-val');
  const out = document.getElementById('mn-formula');
  const fb = document.getElementById('mn-feedback');
  const C = PR_TONE[0];
  const U = 5.4;           // 1 公克畫成幾 px（最重 9 × 8 = 72 公克）

  function row(cy, n, y, title, color) {
    rowLabel(ctx, title, `${n} 根`, 18, cy, color);
    const x0 = 104;
    for (let i = 0; i < n; i++) drawStrip(ctx, x0 + i * 24, cy - 36, 15, 32, PR_WOOD);
    drawStrip(ctx, x0, cy + 8, Math.max(y * U, 3), 17, color, 0.55);
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = f(800, 15);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x = ${n}`, x0 + n * 24 + 8, cy - 20);
    ctx.fillText(`y = ${y} 公克`, Math.min(x0 + y * U + 10, 430), cy + 16);
    ctx.restore();
  }

  function draw() {
    const k = parseInt(kS.value, 10);
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    kV.textContent = k;
    aV.textContent = a;
    bV.textContent = b;
    const ya = k * a, yb = k * b;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `每根小木條重 ${k} 公克：根數變幾倍，總重就變幾倍？`, C);

    row(92, a, ya, '原本', PR_CREAM);
    row(182, b, yb, '後來', PR_SKY);

    drawStepRows(ctx, numberRows([
      {
        name: '根數變幾倍',
        hint: '後來 ÷ 原本',
        items: [T(`${b} ÷ ${a} =`, INK), fItem(b, a, C), T('倍', INK)],
        color: C
      },
      {
        name: '總重變幾倍',
        hint: '後來 ÷ 原本',
        items: [T(`${yb} ÷ ${ya} =`, INK), fItem(yb, ya, C), T('倍', INK)],
        color: C
      },
      {
        name: '每一組 y ÷ x',
        hint: '兩組算出來都一樣',
        items: [T(`${ya} ÷ ${a} = ${k}`, PR_CREAM), T('，', INK), T(`${yb} ÷ ${b} = ${k}`, PR_SKY)],
        color: C
      },
      {
        name: '關係式',
        hint: `y 永遠是 x 的 ${k} 倍`,
        items: [IT('y', PR_PAD), T('=', PR_PAD)].concat(kxItems([k, 1], PR_PAD)),
        color: PR_PAD
      }
    ]), 4, { top: 256, gap: 54, labX: 18, eqX: 170, size: 20, color: C });

    out.innerHTML = wbrEq(`x: ${a} \\to ${b}`) + '，' + wbrEq(`y: ${ya} \\to ${yb}`) + '，' + wbrEq(`y = ${k}x`);

    let msg;
    if (a === b) {
      msg = `根數沒有變（\\(1\\) 倍），總重也沒有變。把後來的根數調開看看。`;
    } else if (b > a) {
      msg = `根數變成 \\(${fTex(b, a)}\\) 倍，總重<b style="color:${C}">也變成 \\(${fTex(b, a)}\\) 倍</b>。`;
    } else {
      msg = `根數變少，變成原來的 \\(${fTex(b, a)}\\) 倍；總重<b style="color:${C}">也跟著變成 \\(${fTex(b, a)}\\) 倍</b>——「變幾倍」也包括變成幾分之幾倍。`;
    }
    fb.innerHTML = wrapFeedback(
      msg + `<br>不管怎麼調，<b style="color:${PR_PAD}">\\(y \\div x\\) 永遠是 \\(${k}\\)</b>，所以 \\(y = ${k}x\\)，\\(y\\) 與 \\(x\\) 成正比。`
    );
    typeset([out, fb]);
  }

  [kS, aS, bS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 2／重點 6：逐組檢查台（正比算 y ÷ x、反比算 x × y）
   ========================================================================== */
const PR_RATIO_CASES = [
  { story: '雷射切割機的切割時間 x 分鐘，與切出的長度 y 公分',
    xName: '時間 x（分）', yName: '長度 y（公分）',
    cols: [[2, 36], [3, 54], [5, 90], [8, 144]] },
  { story: '一根 60 公分的木條，每分鐘鋸掉 8 公分：鋸了 x 分鐘後剩下 y 公分',
    xName: '時間 x（分）', yName: '剩下 y（公分）',
    cols: [[1, 52], [2, 44], [3, 36], [4, 28]] },
  { story: '同一根木條：鋸了 x 分鐘，已經鋸掉 y 公分',
    xName: '時間 x（分）', yName: '鋸掉 y（公分）',
    cols: [[1, 8], [2, 16], [3, 24], [4, 32]] },
  { story: '木板一片 40 元，一次買 5 片以上每片打九折：買 x 片共付 y 元',
    xName: '片數 x（片）', yName: '總價 y（元）',
    cols: [[1, 40], [2, 80], [5, 180], [6, 216]] }
];

const PR_PROD_CASES = [
  { story: '72 顆螺絲全部分裝成小包：每包 x 顆，共裝 y 包',
    xName: '每包 x（顆）', yName: '包數 y（包）',
    cols: [[3, 24], [4, 18], [8, 9], [12, 6]] },
  { story: '預算 240 元買筆刷，每支 x 元，每買 20 支加送 1 支：共拿到 y 支',
    xName: '單價 x（元）', yName: '拿到 y（支）',
    cols: [[40, 6], [30, 8], [20, 12], [12, 21]] },
  { story: '米白漆與天藍漆一共 20 罐：米白 x 罐、天藍 y 罐',
    xName: '米白 x（罐）', yName: '天藍 y（罐）',
    cols: [[4, 16], [5, 15], [8, 12], [10, 10]] },
  { story: '軌道一圈 240 公分：小火車每秒跑 x 公分，跑一圈要 y 秒',
    xName: '速率 x（公分/秒）', yName: '時間 y（秒）',
    cols: [[10, 24], [12, 20], [15, 16], [20, 12]] }
];

function initCheckCanvas(opts) {
  const cv = document.getElementById(opts.cid);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const P = opts.pre;
  const group = document.getElementById(`${P}-case-group`);
  const nS = document.getElementById(`${P}-n-slider`);
  const nV = document.getElementById(`${P}-n-val`);
  const out = document.getElementById(`${P}-formula`);
  const fb = document.getElementById(`${P}-feedback`);
  const C = PR_TONE[opts.tone];
  const RATIO = (opts.mode === 'ratio');
  const REL = RATIO ? '正比' : '反比';
  let ci = 0;

  function value(col) {
    return RATIO ? reduce(col[1], col[0]) : [col[0] * col[1], 1];
  }

  function draw() {
    const cs = opts.cases[ci];
    const n = parseInt(nS.value, 10);
    nV.textContent = n;
    const vals = cs.cols.map(value);
    const same = vals.map(v => rEq(v, vals[0]));
    let bad = -1;
    for (let i = 1; i < n; i++) if (!same[i]) { bad = i; break; }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, RATIO ? '逐組算 y ÷ x：每一組都一樣，才是正比' : '逐組算 x × y：每一組都一樣，才是反比', C);
    wrapText(ctx, cs.story, 270, 58, 500, 18, INK, 13.5);

    // 資料表
    const top = 80, rh = 34, lw = 128, x0 = 20, cw = 93;
    const tx = i => x0 + lw + i * cw;
    ctx.save();
    for (let i = 0; i < 4; i++) {
      if (i < n) drawPanel(ctx, tx(i) + 3, top + 2, cw - 6, rh * 2 - 4, i === 0 ? C : (same[i] ? OK_COLOR : NO_COLOR), i === n - 1 ? 0.22 : 0.1);
    }
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, top, lw + 4 * cw, rh * 2);
    ctx.beginPath();
    ctx.moveTo(x0, top + rh);
    ctx.lineTo(x0 + lw + 4 * cw, top + rh);
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(tx(i), top);
      ctx.lineTo(tx(i), top + rh * 2);
    }
    ctx.stroke();
    ctx.restore();
    centerText(ctx, cs.xName, x0 + lw / 2, top + rh / 2, PR_CREAM, f(800, 13));
    centerText(ctx, cs.yName, x0 + lw / 2, top + rh * 1.5, PR_SKY, f(800, 13));
    cs.cols.forEach((col, i) => {
      centerText(ctx, String(col[0]), tx(i) + cw / 2, top + rh / 2, i < n ? PR_CREAM : MUTED, f(800, 17));
      centerText(ctx, String(col[1]), tx(i) + cw / 2, top + rh * 1.5, i < n ? PR_SKY : MUTED, f(800, 17));
    });

    // 逐組的算式
    const rows = cs.cols.map((col, i) => {
      const ok = same[i];
      const color = (i === 0) ? C : (ok ? OK_COLOR : NO_COLOR);
      const calc = RATIO
        ? [T(`${col[1]} ÷ ${col[0]} =`, INK), pItem(vals[i], color)]
        : [T(`${col[0]} × ${col[1]} =`, INK), T(numStr(vals[i][0]), color)];
      const mark = (i === 0) ? '（當作基準）' : (ok ? '和第 1 組相同' : '和第 1 組不同');
      return {
        name: `第 ${i + 1} 組`,
        hint: `x = ${col[0]}，y = ${col[1]}`,
        items: calc.concat([T(mark, color)]),
        color: color
      };
    });
    drawStepRows(ctx, rows, n, { top: 196, gap: 50, labX: 18, eqX: 150, size: 19, color: C });

    // 判定
    let verdict, vColor;
    if (bad >= 0) {
      verdict = `第 ${bad + 1} 組和第 1 組不一樣 → y 與 x 不成${REL}`;
      vColor = NO_COLOR;
    } else if (n < 4) {
      verdict = (n === 1)
        ? '只算了 1 組，還有 3 組沒檢查，不能下結論'
        : `前 ${n} 組都一樣，還有 ${4 - n} 組沒檢查，不能下結論`;
      vColor = MUTED;
    } else {
      verdict = RATIO
        ? `4 組的 y ÷ x 都是 ${pTexPlain(vals[0])} → y 與 x 成正比`
        : `4 組的 x × y 都是 ${vals[0][0]} → y 與 x 成反比`;
      vColor = OK_COLOR;
    }
    drawPanel(ctx, 18, 402, 504, 44, vColor, 0.1);
    centerText(ctx, verdict, 270, 424, vColor, f(800, 15.5));

    out.innerHTML = cs.cols.slice(0, n).map((col, i) => RATIO
      ? wbrEq(`${col[1]} \\div ${col[0]} = ${pTex(vals[i])}`)
      : wbrEq(`${col[0]} \\times ${col[1]} = ${vals[i][0]}`)).join('，');

    let msg;
    if (bad >= 0) {
      msg = `<b style="color:${NO_COLOR}">第 \\(${bad + 1}\\) 組算出 \\(${pTex(vals[bad])}\\)，第 \\(1\\) 組是 \\(${pTex(vals[0])}\\)</b>，` +
        `不是固定的數，所以 \\(y\\) 與 \\(x\\) <b>不成${REL}</b>。` +
        (bad >= 2 ? `<br>注意前面 \\(${bad}\\) 組都一樣——只看前兩組就會誤判。` : `<br>找到一組不一樣就可以停下來，後面不必再算。`);
    } else if (n < 4) {
      msg = (n === 1
        ? `第 \\(1\\) 組的${RATIO ? '比值' : '乘積'}是 \\(${pTex(vals[0])}\\)，先把它當作基準。<br>`
        : `目前 \\(${n}\\) 組的${RATIO ? '比值' : '乘積'}都是 \\(${pTex(vals[0])}\\)。<br>`) +
        `<b style="color:${C}">還不能說成${REL}</b>——把滑桿往右拉，檢查完每一組。`;
    } else {
      msg = `<b style="color:${OK_COLOR}">每一組的${RATIO ? ' \\(y \\div x\\)' : ' \\(x \\times y\\)'} 都是 \\(${pTex(vals[0])}\\)</b>，` +
        `所以 \\(y\\) 與 \\(x\\) 成${REL}，關係式是 \\(${RATIO ? `y = ${kTex(vals[0])}x` : `xy = ${vals[0][0]}`}\\)。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, `data-${P}-case`, v => { ci = parseInt(v, 10); draw(); });
  nS.addEventListener('input', draw);
  draw();
}

// canvas 文字用的分數（斜線寫法只出現在判定句裡）
function pTexPlain(r) {
  return (r[1] === 1) ? numStr(r[0]) : `${r[0]}/${r[1]}`;
}

/* ==========================================================================
   重點 3／重點 7：求值工作台（正比設 y = kx、反比設 xy = k）
   ========================================================================== */
function initSolveCanvas(opts) {
  const cv = document.getElementById(opts.cid);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const P = opts.pre;
  const x1S = document.getElementById(`${P}-x1-slider`);
  const y1S = document.getElementById(`${P}-y1-slider`);
  const tS = document.getElementById(`${P}-t-slider`);
  const x1V = document.getElementById(`${P}-x1-val`);
  const y1V = document.getElementById(`${P}-y1-val`);
  const tV = document.getElementById(`${P}-t-val`);
  const tName = document.getElementById(`${P}-t-name`);
  const askGroup = document.getElementById(`${P}-ask-group`);
  const out = document.getElementById(`${P}-formula`);
  const fb = document.getElementById(`${P}-feedback`);
  const C = PR_TONE[opts.tone];
  const RATIO = (opts.mode === 'ratio');
  let ask = 'y';

  function draw() {
    const x1 = PR_NZ6[parseInt(x1S.value, 10)];
    const y1 = PR_NZ9[parseInt(y1S.value, 10)];
    const t = PR_NZ9[parseInt(tS.value, 10)];
    x1V.textContent = x1;
    y1V.textContent = y1;
    tV.textContent = t;
    tName.textContent = (ask === 'y') ? '已知的另一個 x' : '已知的另一個 y';

    let k, x2, y2;
    if (RATIO) {
      k = reduce(y1, x1);
      if (ask === 'y') { x2 = [t, 1]; y2 = rMul(k, x2); } else { y2 = [t, 1]; x2 = rDiv(y2, k); }
    } else {
      k = [x1 * y1, 1];
      if (ask === 'y') { x2 = [t, 1]; y2 = rDiv(k, x2); } else { y2 = [t, 1]; x2 = rDiv(k, y2); }
    }

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, RATIO ? '已知 y 與 x 成正比，求另一個值' : '已知 y 與 x 成反比，求另一個值', C);

    drawPanel(ctx, 18, 46, 504, 70, C, 0.08);
    drawExpr(ctx, [T('已知：', MUTED), IT('x', PR_CREAM), T(`= ${x1}`, PR_CREAM), T('時，', INK),
      IT('y', PR_SKY), T(`= ${y1}`, PR_SKY)], 270, 66, 18, INK, { gap: 6 });
    drawExpr(ctx, (ask === 'y')
      ? [T('所求：', MUTED), IT('x', PR_CREAM), T(`= ${t}`, PR_CREAM), T('時，', INK), IT('y', PR_SKY), T('= ？', PR_SKY)]
      : [T('所求：', MUTED), IT('y', PR_SKY), T(`= ${t}`, PR_SKY), T('時，', INK), IT('x', PR_CREAM), T('= ？', PR_CREAM)],
      270, 96, 18, INK, { gap: 6 });

    let rows;
    if (RATIO) {
      rows = [
        { name: '設關係式', hint: '成正比就設 y = kx（k ≠ 0）',
          items: [IT('y', INK), T('=', INK), SEQ([IT('k', C), IT('x', INK)], INK, 1)], color: C },
        { name: '代入已知', hint: `x = ${x1}，y = ${y1}`,
          items: [T(numStr(y1), PR_SKY), T('=', INK), IT('k', C), T('×', INK), numItem(x1, PR_CREAM)], color: C },
        { name: '求出 k', hint: 'k ＝ y ÷ x',
          items: [IT('k', C), T('=', INK), T(`${y1} ÷ ${nTex(x1)} =`, INK), pItem(k, C)], color: C },
        { name: '寫出關係式', hint: '把 k 放回去',
          items: [IT('y', INK), T('=', INK)].concat(kxItems(k, C)), color: C }
      ];
      if (ask === 'y') {
        rows.push({ name: '代入求 y', hint: `x = ${t}`,
          items: [IT('y', INK), T('=', INK), pItem(k, C, true), T('×', INK), numItem(t, PR_CREAM), T('=', INK), pItem(y2, PR_PAD)], color: PR_PAD });
      } else {
        rows.push({ name: '代入所求', hint: `y = ${t}`,
          items: [T(numStr(t), PR_SKY), T('=', INK)].concat(kxItems(k, C)), color: C });
        rows.push({ name: '解出 x', hint: '兩邊同除以 k',
          items: [IT('x', INK), T('=', INK), T(`${t} ÷`, INK), pItem(k, C, true), T('=', INK), pItem(x2, PR_PAD)], color: PR_PAD });
      }
    } else {
      rows = [
        { name: '設關係式', hint: '成反比就設 xy = k（k ≠ 0）',
          items: [xyItem(INK), T('=', INK), IT('k', C)], color: C },
        { name: '代入已知', hint: `x = ${x1}，y = ${y1}`,
          items: [numItem(x1, PR_CREAM), T('×', INK), numItem(y1, PR_SKY), T('=', INK), IT('k', C)], color: C },
        { name: '求出 k', hint: 'k ＝ x × y（乘出來）',
          items: [IT('k', C), T('=', INK), T(numStr(k[0]), C)], color: C },
        { name: '寫出關係式', hint: '把 k 放回去',
          items: [xyItem(INK), T('=', INK), T(numStr(k[0]), C)], color: C }
      ];
      if (ask === 'y') {
        rows.push({ name: '代入所求', hint: `x = ${t}`,
          items: [numItem(t, PR_CREAM), T('×', INK), IT('y', INK), T('=', INK), T(numStr(k[0]), C)], color: C });
        rows.push({ name: '解出 y', hint: `兩邊同除以 ${t}`,
          items: [IT('y', INK), T('=', INK), T(`${k[0]} ÷ ${nTex(t)} =`, INK), pItem(y2, PR_PAD)], color: PR_PAD });
      } else {
        rows.push({ name: '代入所求', hint: `y = ${t}`,
          items: [IT('x', INK), T('×', INK), numItem(t, PR_SKY), T('=', INK), T(numStr(k[0]), C)], color: C });
        rows.push({ name: '解出 x', hint: `兩邊同除以 ${t}`,
          items: [IT('x', INK), T('=', INK), T(`${k[0]} ÷ ${nTex(t)} =`, INK), pItem(x2, PR_PAD)], color: PR_PAD });
      }
    }
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 150, gap: 56, labX: 18, eqX: 176, size: 19, color: C });

    const rel = RATIO ? `y = ${kTex(k)}x` : `xy = ${k[0]}`;
    out.innerHTML = wbrEq(rel) + '，' + (ask === 'y'
      ? `當 \\(x = ${t}\\) 時，` + wbrEq(`y = ${pTex(y2)}`)
      : `當 \\(y = ${t}\\) 時，` + wbrEq(`x = ${pTex(x2)}`));

    const ans = (ask === 'y') ? `\\(y = ${pTex(y2)}\\)` : `\\(x = ${pTex(x2)}\\)`;
    if (RATIO) {
      fb.innerHTML = wrapFeedback(
        `<b style="color:${C}">\\(k = ${y1} \\div ${nTex(x1)} = ${pTex(k)}\\)</b>，所以 \\(${rel}\\)，得到 <b style="color:${PR_PAD}">${ans}</b>。<br>` +
        `驗算：\\(${pTexP(k)} \\times ${pTexP(x2)} = ${pTex(y2)}\\) ✓` +
        (k[0] < 0 ? `<br>\\(k\\) 是負數，所以每一組的 \\(x\\)、\\(y\\) 都是<b>一正一負</b>。` : '')
      );
    } else {
      fb.innerHTML = wrapFeedback(
        `<b style="color:${C}">\\(k = ${nTex(x1)} \\times ${nTex(y1)} = ${k[0]}\\)</b>——反比的 \\(k\\) 是<b>乘出來</b>的，得到 <b style="color:${PR_PAD}">${ans}</b>。<br>` +
        `驗算：\\(${pTexP(x2)} \\times ${pTexP(y2)} = ${k[0]}\\) ✓，和已知的那一組乘積相同。`
      );
    }
    typeset([out, fb]);
  }

  bindPickGroup(askGroup, `data-${P}-ask`, v => { ask = v; draw(); });
  [x1S, y1S, tS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4／重點 8：工坊應用計算機
   ========================================================================== */
const PR_APPLY_DIRECT = [
  { title: '木料：買的長度與價錢成正比', story: '木料的單價固定。3 公尺的木料賣 105 元。',
    xName: '長度', xUnit: '公尺', yName: '價錢', yUnit: '元', kMeaning: '每公尺的價錢',
    x1: 3, y1: 105, qx: [1, 2, 4, 5, 6, 8, 10, 12], qy: [70, 140, 175, 210, 280, 350, 420] },
  { title: '小火車：行駛時間與距離成正比', story: '小火車的速率固定。6 秒跑了 90 公分。',
    xName: '時間', xUnit: '秒', yName: '距離', yUnit: '公分', kMeaning: '每秒跑幾公分（速率）',
    x1: 6, y1: 90, qx: [2, 4, 5, 8, 10, 12, 16, 20], qy: [30, 60, 75, 120, 150, 180, 240] },
  { title: '調漆：兩種漆的量成正比', story: '顏色要一樣，米白漆與天藍漆的量要成正比。米白 40 毫升配天藍 16 毫升。',
    xName: '米白漆', xUnit: '毫升', yName: '天藍漆', yUnit: '毫升', kMeaning: '每毫升米白配幾毫升天藍',
    x1: 40, y1: 16, qx: [10, 15, 25, 30, 50, 60, 75, 100], qy: [6, 8, 10, 14, 20, 24, 30] }
];

const PR_APPLY_INVERSE = [
  { title: '小火車：速率與跑一圈的時間成反比', story: '軌道一圈的長度固定。小火車每秒跑 20 公分時，跑一圈要 12 秒。',
    xName: '速率', xUnit: '公分/秒', yName: '時間', yUnit: '秒', kMeaning: '軌道一圈的長度',
    x1: 20, y1: 12, qx: [8, 10, 12, 15, 16, 24, 30, 40], qy: [5, 6, 8, 10, 15, 16, 24, 30] },
  { title: '上漆：師傅人數與完工天數成反比', story: '每位師傅每天的工作量相同。3 位師傅 8 天可以完工。',
    xName: '人數', xUnit: '人', yName: '天數', yUnit: '天', kMeaning: '整件工作總共要幾「人天」',
    x1: 3, y1: 8, qx: [1, 2, 4, 6, 8, 12], qy: [2, 3, 4, 6, 12, 24] },
  { title: '分裝：每包顆數與包數成反比', story: '一批螺絲全部分裝。每包 12 顆時，可以裝 15 包。',
    xName: '每包', xUnit: '顆', yName: '包數', yUnit: '包', kMeaning: '螺絲的總顆數',
    x1: 12, y1: 15, qx: [9, 10, 15, 18, 20, 30, 36], qy: [5, 6, 9, 10, 12, 18, 20] }
];

function initApplyCanvas(opts) {
  const cv = document.getElementById(opts.cid);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const P = opts.pre;
  const caseGroup = document.getElementById(`${P}-case-group`);
  const askGroup = document.getElementById(`${P}-ask-group`);
  const qS = document.getElementById(`${P}-q-slider`);
  const qV = document.getElementById(`${P}-q-val`);
  const qName = document.getElementById(`${P}-q-name`);
  const out = document.getElementById(`${P}-formula`);
  const fb = document.getElementById(`${P}-feedback`);
  const C = PR_TONE[opts.tone];
  const RATIO = (opts.mode === 'ratio');
  let ci = 0, ask = 'y';

  function resetSlider() {
    const cs = opts.cases[ci];
    const list = (ask === 'y') ? cs.qx : cs.qy;
    qS.max = list.length - 1;
    qS.value = Math.floor(list.length / 2);
  }

  // 已知與所求兩組量的長條（正比）
  function bars(left, title, x, y, ux, uy, hot) {
    centerText(ctx, title, left + 115, 88, hot ? PR_PAD : MUTED, f(800, 14));
    drawStrip(ctx, left, 104, Math.max(x * ux, 3), 20, PR_CREAM, 0.6);
    drawStrip(ctx, left, 140, Math.max(y * uy, 3), 20, PR_SKY, 0.6);
    ctx.save();
    ctx.font = f(800, 13.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PR_CREAM;
    ctx.fillText(`x = ${numStr(x)}`, left + x * ux + 8, 114);
    ctx.fillStyle = PR_SKY;
    ctx.fillText(`y = ${numStr(y)}`, left + y * uy + 8, 150);
    ctx.restore();
  }

  // 已知與所求兩組量的長方形：寬是 x、高是 y，面積就是 xy（反比）
  function rect(left, title, x, y, sx, sy, k, hot) {
    centerText(ctx, title, left + 115, 84, hot ? PR_PAD : MUTED, f(800, 14));
    const w = x * sx, h = y * sy;
    const bottom = 206;
    ctx.save();
    ctx.fillStyle = C;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(left, bottom - h, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, bottom - h, w, h);
    ctx.font = f(800, 12.5);
    ctx.fillStyle = PR_CREAM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`x = ${numStr(x)}`, left + w / 2, bottom + 4);
    ctx.fillStyle = PR_SKY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`y = ${numStr(y)}`, left + w + 6, bottom - h / 2);
    ctx.restore();
    if (w > 60 && h > 26) centerText(ctx, `x × y = ${k}`, left + w / 2, bottom - h / 2, INK, f(800, 12.5));
  }

  function draw() {
    const cs = opts.cases[ci];
    const list = (ask === 'y') ? cs.qx : cs.qy;
    const q = list[parseInt(qS.value, 10)];
    qV.textContent = q;
    qName.textContent = (ask === 'y') ? `${cs.xName}（${cs.xUnit}）` : `${cs.yName}（${cs.yUnit}）`;

    let k, x2, y2;
    if (RATIO) {
      k = reduce(cs.y1, cs.x1);
      if (ask === 'y') { x2 = [q, 1]; y2 = rMul(k, x2); } else { y2 = [q, 1]; x2 = rDiv(y2, k); }
    } else {
      k = [cs.x1 * cs.y1, 1];
      if (ask === 'y') { x2 = [q, 1]; y2 = rDiv(k, x2); } else { y2 = [q, 1]; x2 = rDiv(k, y2); }
    }
    const X2 = x2[0] / x2[1], Y2 = y2[0] / y2[1];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, cs.title, C);
    wrapText(ctx, cs.story, 270, 56, 500, 17, INK, 13);

    if (RATIO) {
      const ux = 150 / Math.max(cs.x1, X2), uy = 150 / Math.max(cs.y1, Y2);
      bars(22, '已知的一組', cs.x1, cs.y1, ux, uy, false);
      bars(282, '所求的一組', X2, Y2, ux, uy, true);
    } else {
      const sx = 150 / Math.max(cs.x1, X2), sy = 96 / Math.max(cs.y1, Y2);
      rect(40, '已知的一組', cs.x1, cs.y1, sx, sy, k[0], false);
      rect(300, '所求的一組', X2, Y2, sx, sy, k[0], true);
    }

    const xv = `x = ${cs.x1}`, yv = `y = ${cs.y1}`;
    let rows;
    if (RATIO) {
      rows = [
        { name: '設關係式', hint: `x：${cs.xName}，y：${cs.yName}`,
          items: [IT('y', INK), T('=', INK), SEQ([IT('k', C), IT('x', INK)], INK, 1)], color: C },
        { name: '代入已知', hint: `${xv}，${yv}`,
          items: [T(String(cs.y1), PR_SKY), T('=', INK), IT('k', C), T('×', INK), T(String(cs.x1), PR_CREAM)], color: C },
        { name: '求出 k', hint: cs.kMeaning,
          items: [IT('k', C), T('=', INK), T(`${cs.y1} ÷ ${cs.x1} =`, INK), pItem(k, C)], color: C },
        (ask === 'y')
          ? { name: '代入求 y', hint: `x = ${q}`,
              items: [IT('y', INK), T('=', INK), pItem(k, C), T('×', INK), T(String(q), PR_CREAM), T('=', INK), pItem(y2, PR_PAD)], color: PR_PAD }
          : { name: '代入求 x', hint: `y = ${q}，兩邊同除以 k`,
              items: [T(String(q), PR_SKY), T('=', INK)].concat(kxItems(k, C), [T('，', INK), IT('x', INK), T('=', INK), pItem(x2, PR_PAD)]), color: PR_PAD },
        { name: '比例式驗算', hint: '另一種做法，答案要一樣',
          items: [T(`${cs.x1} : ${cs.y1} =`, INK), pItem(x2, PR_CREAM), T(':', INK), pItem(y2, PR_SKY)], color: C },
        { name: '回答', hint: '記得寫單位',
          items: [T(ask === 'y' ? `${cs.yName} ${numStr(Y2)} ${cs.yUnit}` : `${cs.xName} ${numStr(X2)} ${cs.xUnit}`, PR_PAD)], color: PR_PAD }
      ];
    } else {
      const upX = X2 > cs.x1, upY = Y2 > cs.y1;
      rows = [
        { name: '設關係式', hint: `x：${cs.xName}，y：${cs.yName}`,
          items: [xyItem(INK), T('=', INK), IT('k', C)], color: C },
        { name: '代入已知', hint: `${xv}，${yv}`,
          items: [T(String(cs.x1), PR_CREAM), T('×', INK), T(String(cs.y1), PR_SKY), T('=', INK), IT('k', C)], color: C },
        { name: '求出 k', hint: cs.kMeaning,
          items: [IT('k', C), T('=', INK), T(String(k[0]), C)], color: C },
        (ask === 'y')
          ? { name: '代入求 y', hint: `x = ${q}，兩邊同除以 ${q}`,
              items: [T(String(q), PR_CREAM), T('×', INK), IT('y', INK), T(`= ${k[0]}`, INK), T('，', INK), IT('y', INK), T('=', INK), pItem(y2, PR_PAD)], color: PR_PAD }
          : { name: '代入求 x', hint: `y = ${q}，兩邊同除以 ${q}`,
              items: [IT('x', INK), T('×', INK), T(String(q), PR_SKY), T(`= ${k[0]}`, INK), T('，', INK), IT('x', INK), T('=', INK), pItem(x2, PR_PAD)], color: PR_PAD },
        { name: '直覺檢查', hint: '一個變大，另一個就變小',
          items: (X2 === cs.x1)
            ? [T('和已知的那一組相同', MUTED)]
            : [T(`x ${upX ? '變大' : '變小'}，y ${upY ? '變大' : '變小'}`, (upX !== upY) ? OK_COLOR : NO_COLOR), T((upX !== upY) ? '　合理' : '　不合理', (upX !== upY) ? OK_COLOR : NO_COLOR)],
          color: C },
        { name: '回答', hint: '記得寫單位',
          items: [T(ask === 'y' ? `${cs.yName} ${numStr(Y2)} ${cs.yUnit}` : `${cs.xName} ${numStr(X2)} ${cs.xUnit}`, PR_PAD)], color: PR_PAD }
      ];
    }
    drawStepRows(ctx, numberRows(rows), rows.length, { top: 252, gap: 47, labX: 18, eqX: 176, size: 19, color: C });

    const rel = RATIO ? `y = ${kTex(k)}x` : `xy = ${k[0]}`;
    out.innerHTML = wbrEq(rel) + '，' + (ask === 'y'
      ? `當 \\(x = ${q}\\) 時，` + wbrEq(`y = ${pTex(y2)}`)
      : `當 \\(y = ${q}\\) 時，` + wbrEq(`x = ${pTex(x2)}`));

    if (RATIO) {
      fb.innerHTML = wrapFeedback(
        `<b style="color:${C}">\\(k = ${pTex(k)}\\)</b>，也就是${cs.kMeaning}。<br>` +
        `所求的${ask === 'y' ? cs.yName : cs.xName}是 <b style="color:${PR_PAD}">\\(${numStr(ask === 'y' ? Y2 : X2)}\\) ${ask === 'y' ? cs.yUnit : cs.xUnit}</b>。` +
        `用比例式 \\(${cs.x1} : ${cs.y1} = ${pTex(x2)} : ${pTex(y2)}\\) 算，答案相同。`
      );
    } else {
      const wrong = (ask === 'y') ? reduce(cs.y1 * q, cs.x1) : reduce(cs.x1 * q, cs.y1);
      const same = (ask === 'y') ? (q === cs.x1) : (q === cs.y1);
      fb.innerHTML = wrapFeedback(
        `<b style="color:${C}">\\(k = ${cs.x1} \\times ${cs.y1} = ${k[0]}\\)</b>，也就是${cs.kMeaning}。<br>` +
        `所求的${ask === 'y' ? cs.yName : cs.xName}是 <b style="color:${PR_PAD}">\\(${numStr(ask === 'y' ? Y2 : X2)}\\) ${ask === 'y' ? cs.yUnit : cs.xUnit}</b>。` +
        (same
          ? `（這一組剛好就是已知的那一組。）`
          : `<br>如果<b style="color:${NO_COLOR}">誤用正比</b>去算，會得到 \\(${pTex(wrong)}\\)——` +
            `${ask === 'y' ? cs.xName : cs.yName}${q > (ask === 'y' ? cs.x1 : cs.y1) ? '變大' : '變小'}了，` +
            `${ask === 'y' ? cs.yName : cs.xName}卻也跟著${q > (ask === 'y' ? cs.x1 : cs.y1) ? '變大' : '變小'}，和情境不合。`)
      );
    }
    typeset([out, fb]);
  }

  bindPickGroup(caseGroup, `data-${P}-case`, v => { ci = parseInt(v, 10); resetSlider(); draw(); });
  bindPickGroup(askGroup, `data-${P}-ask`, v => { ask = v; resetSlider(); draw(); });
  qS.addEventListener('input', draw);
  resetSlider();
  draw();
}

/* ==========================================================================
   重點 5：方磚排列台——每排塊數變幾倍，排數就變幾分之一
   ========================================================================== */
const PR_TILE_SETS = {
  12: [1, 2, 3, 4, 6, 12],
  18: [2, 3, 6, 9],
  24: [2, 3, 4, 6, 8, 12],
  36: [3, 4, 6, 9, 12]
};

function initTileCanvas() {
  const cv = document.getElementById('canvas-tile');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('tl-n-group');
  const aS = document.getElementById('tl-a-slider');
  const bS = document.getElementById('tl-b-slider');
  const aV = document.getElementById('tl-a-val');
  const bV = document.getElementById('tl-b-val');
  const out = document.getElementById('tl-formula');
  const fb = document.getElementById('tl-feedback');
  const C = PR_TONE[4];
  let N = 24;

  function resetSliders(ai, bi) {
    const d = PR_TILE_SETS[N];
    aS.max = d.length - 1;
    bS.max = d.length - 1;
    aS.value = Math.min(ai, d.length - 1);
    bS.value = Math.min(bi, d.length - 1);
  }

  function grid(left, x, y, t, title, color) {
    centerText(ctx, title, left + 122, 62, color, f(800, 14.5));
    const gw = x * t, gh = y * t;
    const gx = left + (245 - gw) / 2;
    for (let r = 0; r < y; r++) {
      for (let c = 0; c < x; c++) drawTile(ctx, gx + c * t, 82 + r * t, t, PR_WOOD);
    }
    ctx.save();
    ctx.font = f(700, 12.5);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`每排 ${x} 塊，共 ${y} 排`, left + 122, 82 + gh + 6);
    ctx.restore();
  }

  function draw() {
    const d = PR_TILE_SETS[N];
    const a = d[parseInt(aS.value, 10)];
    const b = d[parseInt(bS.value, 10)];
    const ya = N / a, yb = N / b;
    aV.textContent = a;
    bV.textContent = b;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${N} 塊方磚排成長方形：每排塊數變幾倍，排數就變幾倍？`, C);

    const t = Math.min(20, 225 / Math.max(a, b), 176 / Math.max(ya, yb));
    grid(20, a, ya, t, '原本', PR_CREAM);
    grid(275, b, yb, t, '後來', PR_SKY);

    drawStepRows(ctx, numberRows([
      { name: '每排塊數變幾倍', hint: '後來 ÷ 原本',
        items: [T(`${b} ÷ ${a} =`, INK), fItem(b, a, PR_CREAM), T('倍', INK)], color: C },
      { name: '排數變幾倍', hint: '後來 ÷ 原本',
        items: [T(`${yb} ÷ ${ya} =`, INK), fItem(yb, ya, PR_SKY), T('倍', INK)], color: C },
      { name: '兩個倍數相乘', hint: '互為倒數，乘起來是 1',
        items: [fItem(b, a, PR_CREAM), T('×', INK), fItem(yb, ya, PR_SKY), T('= 1', INK)], color: C },
      { name: '每一組 x × y', hint: '磚數不變',
        items: [T(`${a} × ${ya} = ${N}`, PR_CREAM), T('，', INK), T(`${b} × ${yb} = ${N}`, PR_SKY)], color: PR_PAD }
    ]), 4, { top: 318, gap: 48, labX: 18, eqX: 170, size: 19, color: C });

    out.innerHTML = wbrEq(`x: ${a} \\to ${b}`) + '，' + wbrEq(`y: ${ya} \\to ${yb}`) + '，' + wbrEq(`xy = ${N}`);

    let msg;
    if (a === b) {
      msg = `每排塊數沒有變，排數也沒有變。把「後來」的每排塊數調開看看。`;
    } else {
      msg = `每排塊數變成 \\(${fTex(b, a)}\\) 倍，排數變成 <b style="color:${C}">\\(${fTex(yb, ya)}\\) 倍</b>——` +
        `兩個倍數<b>互為倒數</b>。`;
    }
    fb.innerHTML = wrapFeedback(
      msg + `<br>磚數始終是 \\(${N}\\) 塊，<b style="color:${PR_PAD}">\\(x \\times y = ${N}\\)</b>，所以 \\(y\\) 與 \\(x\\) 成反比。`
    );
    typeset([out, fb]);
  }

  if (group) {
    group.querySelectorAll('.pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setActive(group, 'data-tl-n', btn.getAttribute('data-tl-n'));
        N = parseInt(btn.getAttribute('data-tl-n'), 10);
        resetSliders(0, PR_TILE_SETS[N].length - 2);
        draw();
      });
    });
  }
  aS.addEventListener('input', draw);
  bS.addEventListener('input', draw);
  resetSliders(0, 3);
  draw();
}

/* ==========================================================================
   重點 9：關係檢驗台——看趨勢，還是看比值與乘積？
   ========================================================================== */
const PR_TREND_CANDS = [
  { tex: 'y = 3x', y: x => [3 * x, 1] },
  { tex: 'y = -2x', y: x => [-2 * x, 1] },
  { tex: 'y = x + 4', y: x => [x + 4, 1] },
  { tex: 'xy = 12', y: x => reduce(12, x) },
  { tex: 'x + y = 8', y: x => [8 - x, 1] }
];

function initTrendCanvas() {
  const cv = document.getElementById('canvas-trend');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('tr-cand-group');
  const sS = document.getElementById('tr-s-slider');
  const sV = document.getElementById('tr-s-val');
  const out = document.getElementById('tr-formula');
  const fb = document.getElementById('tr-feedback');
  const C = PR_TONE[8];
  let ci = 0;

  function draw() {
    const cand = PR_TREND_CANDS[ci];
    const s = parseInt(sS.value, 10);
    sV.textContent = s;
    const xs = [];
    for (let v = s; xs.length < 4; v++) if (v !== 0) xs.push(v);
    const ys = xs.map(cand.y);
    const ratios = xs.map((x, i) => rDiv(ys[i], [x, 1]));
    const prods = xs.map((x, i) => rMul(ys[i], [x, 1]));
    const ratioFixed = ratios.every(r => rEq(r, ratios[0]));
    const prodFixed = prods.every(r => rEq(r, prods[0]));
    const dirs = [];
    for (let i = 1; i < 4; i++) {
      const d = ys[i][0] * ys[i - 1][1] - ys[i - 1][0] * ys[i][1];   // 分母皆為正
      dirs.push(d > 0 ? 1 : (d < 0 ? -1 : 0));
    }
    const trend = dirs.every(d => d > 0) ? '愈來愈大'
      : (dirs.every(d => d < 0) ? '愈來愈小'
        : (dirs.every(d => d === 0) ? '都不變' : '忽大忽小'));

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${cand.tex}：看趨勢，還是看比值與乘積？`, C);

    // 表格
    const lw = 116, x0 = 18, cw = 96;
    const tx = i => x0 + lw + i * cw;
    const rowsY = [
      { label: 'x', cy: 72, h: 36, color: PR_CREAM },
      { label: 'y', cy: 114, h: 44, color: PR_SKY },
      { label: 'y ÷ x', cy: 176, h: 48, color: ratioFixed ? OK_COLOR : NO_COLOR },
      { label: 'x × y', cy: 230, h: 48, color: prodFixed ? OK_COLOR : NO_COLOR }
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.lineWidth = 1;
    rowsY.forEach(r => ctx.strokeRect(x0, r.cy - r.h / 2, lw + 4 * cw, r.h));
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(tx(i), 54);
      ctx.lineTo(tx(i), 254);
      ctx.stroke();
    }
    ctx.restore();
    rowsY.forEach(r => centerText(ctx, r.label, x0 + lw / 2, r.cy, r.color, (r.label.length === 1 ? fi(800, 17) : f(800, 15))));
    xs.forEach((x, i) => {
      const cx = tx(i) + cw / 2;
      centerText(ctx, String(x), cx, 72, PR_CREAM, f(800, 17));
      drawExpr(ctx, [pItem(ys[i], PR_SKY)], cx, 114, 18, PR_SKY, { maxW: cw - 10 });
      drawExpr(ctx, [pItem(ratios[i], rowsY[2].color)], cx, 176, 18, INK, { maxW: cw - 10 });
      drawExpr(ctx, [pItem(prods[i], rowsY[3].color)], cx, 230, 18, INK, { maxW: cw - 10 });
    });
    // 趨勢箭頭：畫在 y 列相鄰兩格的交界
    dirs.forEach((d, i) => {
      const bx = tx(i + 1), by = 142;
      const col = d > 0 ? PR_WOOD : (d < 0 ? PR_SKY : MUTED);
      centerText(ctx, d > 0 ? '▲' : (d < 0 ? '▼' : '＝'), bx, by, col, f(800, 12));
    });

    // 判定
    const verdict = ratioFixed ? '成正比' : (prodFixed ? '成反比' : '不成正比，也不成反比');
    const vColor = (ratioFixed || prodFixed) ? OK_COLOR : NO_COLOR;
    drawPanel(ctx, 18, 272, 504, 44, PR_WOOD, 0.08);
    drawExpr(ctx, [T('x 愈大時，y', INK), T(trend, trend === '愈來愈大' ? PR_WOOD : (trend === '愈來愈小' ? PR_SKY : MUTED))], 270, 294, 17, INK, { gap: 8 });

    drawChip(ctx, 30, 330, 230, 34, `y ÷ x 固定嗎？${ratioFixed ? '是' : '否'}`, ratioFixed ? OK_COLOR : NO_COLOR);
    drawChip(ctx, 280, 330, 230, 34, `x × y 固定嗎？${prodFixed ? '是' : '否'}`, prodFixed ? OK_COLOR : NO_COLOR);

    drawPanel(ctx, 18, 378, 504, 48, vColor, 0.12);
    centerText(ctx, `結論：y 與 x ${verdict}`, 270, 402, vColor, f(800, 18));

    let trap = '';
    if (ratioFixed && trend === '愈來愈小') trap = '愈來愈小，卻是正比';
    else if (!ratioFixed && !prodFixed && trend === '愈來愈大') trap = '愈來愈大，卻不是正比';
    else if (!ratioFixed && !prodFixed && trend === '愈來愈小') trap = '愈來愈小，卻不是反比';
    else if (prodFixed && trend !== '愈來愈小') trap = `反比，y 卻${trend}`;
    if (trap) drawNote(ctx, `只看趨勢會誤判：${trap}`, 446, PR_RUST, 14);

    // 每個數各自一段 \( \)，用 <wbr> 接起來，窄欄才折得了行（開發約束 24）
    out.innerHTML = `\\(${cand.tex}\\)，當 ` +
      xs.map((x, i) => i ? `\\(${x}\\)` : `\\(x = ${x}\\)`).join('、<wbr>') + ' 時，<wbr>' +
      ys.map((y, i) => i ? `\\(${pTex(y)}\\)` : `\\(y = ${pTex(y)}\\)`).join('、<wbr>');

    let msg = `<b style="color:${vColor}">\\(${cand.tex}\\)：${verdict}</b>`;
    if (ratioFixed) msg += `——每一組的 \\(y \\div x\\) 都是 \\(${pTex(ratios[0])}\\)。`;
    else if (prodFixed) msg += `——每一組的 \\(x \\times y\\) 都是 \\(${pTex(prods[0])}\\)。`;
    else msg += `——比值與乘積都不固定。`;
    if (trap) {
      msg += `<br><b style="color:${PR_RUST}">這一組會騙人</b>：\\(y\\) ${trend}，但判斷依據是比值與乘積，不是趨勢。`;
    } else {
      msg += `<br>這一次趨勢和結論剛好沒有衝突——但判斷的依據仍然是比值與乘積。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-tr-cand', v => { ci = parseInt(v, 10); draw(); });
  sS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 10：三個量的開關——固定哪一個，決定正比還是反比
   ========================================================================== */
const PR_FIX_FORMS = [
  { name: '面積＝長×寬', A: '面積', B: '長', C: '寬', uA: '平方公分', uB: '公分', uC: '公分',
    locks: [
      { fixed: 'A', val: 36, B: [6, 9, 12, 18], C: [6, 4, 3, 2] },
      { fixed: 'B', val: 6, C: [1, 2, 3, 5] },
      { fixed: 'C', val: 4, B: [2, 3, 5, 7] }
    ] },
  { name: '距離＝速率×時間', A: '距離', B: '速率', C: '時間', uA: '公分', uB: '公分/秒', uC: '秒',
    locks: [
      { fixed: 'A', val: 240, B: [10, 20, 30, 40], C: [24, 12, 8, 6] },
      { fixed: 'B', val: 15, C: [2, 4, 6, 10] },
      { fixed: 'C', val: 8, B: [5, 10, 15, 25] }
    ] }
];

function initFixCanvas() {
  const cv = document.getElementById('canvas-fix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const formGroup = document.getElementById('fx-form-group');
  const lockGroup = document.getElementById('fx-lock-group');
  const nS = document.getElementById('fx-n-slider');
  const nV = document.getElementById('fx-n-val');
  const out = document.getElementById('fx-formula');
  const fb = document.getElementById('fx-feedback');
  const C = PR_TONE[9];
  let fi0 = 0, li = 0;

  function data() {
    const fm = PR_FIX_FORMS[fi0];
    const lk = fm.locks[li];
    let A, B, Cv;
    if (lk.fixed === 'A') { B = lk.B; Cv = lk.C; A = B.map(() => lk.val); }
    else if (lk.fixed === 'B') { Cv = lk.C; B = Cv.map(() => lk.val); A = Cv.map(c => c * lk.val); }
    else { B = lk.B; Cv = B.map(() => lk.val); A = B.map(b => b * lk.val); }
    return { fm, lk, A, B, C: Cv };
  }

  function relabel() {
    const fm = PR_FIX_FORMS[fi0];
    lockGroup.querySelectorAll('.pick-btn').forEach(btn => {
      const key = ['A', 'B', 'C'][parseInt(btn.getAttribute('data-fx-lock'), 10)];
      btn.textContent = `固定${fm[key]}`;
    });
  }

  function draw() {
    const d = data();
    const fm = d.fm, lk = d.lk;
    const n = parseInt(nS.value, 10);
    nV.textContent = n;
    const i = n - 1;
    const names = { A: fm.A, B: fm.B, C: fm.C };
    const units = { A: fm.uA, B: fm.uB, C: fm.uC };
    const vals = { A: d.A, B: d.B, C: d.C };
    const free = ['A', 'B', 'C'].filter(key => key !== lk.fixed);
    // 兩個會變的量：固定的是乘積 A 時是 B 與 C；否則是 A 與另一個因數
    const p = free[0], q = free[1];
    const inverse = (lk.fixed === 'A');

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `${fm.name}：固定${names[lk.fixed]}，另外兩個量是什麼關係？`, C);

    // 表格
    const lw = 150, x0 = 18, cw = 88, rh = 34, top = 48;
    const tx = k => x0 + lw + k * cw;
    ['A', 'B', 'C'].forEach((key, r) => {
      const y = top + r * rh;
      const fixed = (key === lk.fixed);
      if (fixed) drawPanel(ctx, x0, y + 2, lw + 4 * cw, rh - 4, PR_WOOD, 0.14);
      centerText(ctx, `${names[key]}（${units[key]}）${fixed ? ' 固定' : ''}`, x0 + lw / 2, y + rh / 2, fixed ? PR_WOOD : (key === p ? PR_CREAM : PR_SKY), f(800, 12.5));
      vals[key].forEach((v, k) => {
        centerText(ctx, String(v), tx(k) + cw / 2, y + rh / 2, fixed ? PR_WOOD : (k === i ? INK : MUTED), f(800, k === i ? 17 : 15));
      });
    });
    drawPanel(ctx, tx(i) + 2, top, cw - 4, rh * 3, C, 0.16);

    // 圖示
    const vy = 160;
    if (fi0 === 0) {
      const L = d.B[i], W = d.C[i];
      const maxL = Math.max.apply(null, d.B), maxW = Math.max.apply(null, d.C);
      // 四組共用同一個比例尺，面積的大小關係才看得出來
      const s = Math.min(320 / maxL, 104 / maxW);
      const rx = 270 - (L * s) / 2, ry = vy + 108 - W * s;
      ctx.save();
      ctx.fillStyle = PR_WOOD;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(rx, ry, L * s, W * s);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PR_WOOD;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, L * s, W * s);
      ctx.restore();
      centerText(ctx, `長 ${L}`, 270, vy + 122, PR_CREAM, f(800, 13));
      ctx.save();
      ctx.fillStyle = PR_SKY;
      ctx.font = f(800, 13);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`寬 ${W}`, rx + L * s + 8, ry + (W * s) / 2);
      ctx.restore();
      if (L * s > 90 && W * s > 26) centerText(ctx, `面積 ${d.A[i]}`, 270, ry + (W * s) / 2, INK, f(800, 13));
    } else {
      const D = d.A[i];
      const maxD = Math.max.apply(null, d.A);
      const len = 420 * D / maxD;
      ctx.save();
      ctx.strokeStyle = 'rgba(148,163,184,0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(60, vy + 70);
      ctx.lineTo(480, vy + 70);
      ctx.stroke();
      ctx.strokeStyle = PR_CREAM;
      ctx.beginPath();
      ctx.moveTo(60, vy + 70);
      ctx.lineTo(60 + len, vy + 70);
      ctx.stroke();
      ctx.restore();
      drawStrip(ctx, 60 + len - 26, vy + 50, 30, 16, PR_RUST, 0.9);
      centerText(ctx, `速率 ${d.B[i]} 公分/秒，跑 ${d.C[i]} 秒`, 270, vy + 30, PR_SKY, f(800, 13.5));
      centerText(ctx, `跑了 ${D} 公分`, 270, vy + 100, PR_CREAM, f(800, 13.5));
    }

    const p1 = vals[p][0], pn = vals[p][i], q1 = vals[q][0], qn = vals[q][i];
    const check = inverse
      ? [T(`${names.B} × ${names.C} = ${d.B[i]} × ${d.C[i]} = ${lk.val}`, OK_COLOR)]
      : [T(`${names.A} ÷ ${names[q === 'A' ? p : q]} = ${d.A[i]} ÷ ${vals[q === 'A' ? p : q][i]} = ${lk.val}`, OK_COLOR)];
    const concl = inverse
      ? `${names.B}與${names.C}成反比`
      : `${names.A}與${names[q === 'A' ? p : q]}成正比`;

    drawStepRows(ctx, numberRows([
      { name: '固定的量', hint: '這一個不會變',
        items: [T(`${names[lk.fixed]} = ${lk.val} ${units[lk.fixed]}`, PR_WOOD)], color: C },
      { name: '兩個量怎麼變', hint: `第 1 組 → 第 ${n} 組`,
        items: [T(`${names[p]}變`, PR_CREAM), fItem(pn, p1, PR_CREAM), T('倍，', INK), T(`${names[q]}變`, PR_SKY), fItem(qn, q1, PR_SKY), T('倍', INK)],
        color: C },
      { name: inverse ? '乘積固定' : '比值固定', hint: inverse ? '兩個因數乘起來不變' : '乘積 ÷ 因數不變',
        items: check, color: OK_COLOR },
      { name: '結論', hint: '',
        items: [T(concl, PR_PAD)], color: PR_PAD }
    ]), 4, { top: 328, gap: 46, labX: 18, eqX: 170, size: 18, color: C });

    const other = (q === 'A') ? p : q;
    out.innerHTML = inverse
      ? wbrEq(`${d.B[i]} \\times ${d.C[i]} = ${lk.val}`) + `，\\(\\text{${names.B}}\\) 與 \\(\\text{${names.C}}\\) 成反比`
      : wbrEq(`${d.A[i]} \\div ${vals[other][i]} = ${lk.val}`) + `，\\(\\text{${names.A}}\\) 與 \\(\\text{${names[other]}}\\) 成正比`;

    fb.innerHTML = wrapFeedback(inverse
      ? `固定的是<b style="color:${PR_WOOD}">乘出來的${names.A}</b>，所以${names.B}變成幾倍，${names.C}就變成幾分之一——` +
        `<b style="color:${PR_PAD}">${names.B}與${names.C}成反比</b>。`
      : `固定的是<b style="color:${PR_WOOD}">其中一個因數（${names[lk.fixed]}）</b>，所以${names[other]}變成幾倍，${names.A}也變成幾倍——` +
        `<b style="color:${PR_PAD}">${names.A}與${names[other]}成正比</b>。`);
    typeset([out, fb]);
  }

  bindPickGroup(formGroup, 'data-fx-form', v => { fi0 = parseInt(v, 10); relabel(); draw(); });
  bindPickGroup(lockGroup, 'data-fx-lock', v => { li = parseInt(v, 10); draw(); });
  nS.addEventListener('input', draw);
  relabel();
  draw();
}
