/* ==========================================================================
   4-1-2（第四冊 1-2）等差級數 — 互動 Canvas 與隨堂評量
   畫風：Art Deco 復古戲院海報風（小映、阿幕），第 1 章三節共用。
   本節色票前綴 AS_（Arithmetic Series）；共用檔沒有這個前綴。
   金色 AS_GOLD 是「原本那一份」、孔雀藍 AS_TEAL 是「倒過來那一份」，
   玫瑰 AS_ROSE 是「不合、錯誤」、翡翠綠 AS_JADE 是「答案、正確」。

   共用工具在 ../math-canvas.js（T／IT／SEQ／GRP／PW／VF／measure／drawExpr／
   drawPanel／drawTitle／drawStepRows／wbrEq／textCenter…），本檔只放本節的
   色票、下標與算式字串小工具，以及 10 個互動。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initKindCanvas();
  initFlipCanvas();
  initPairCanvas();
  initLastCanvas();
  initFormula2Canvas();
  initSolveCanvas();
  initStackCanvas();
  initSeatCanvas();
  initDaysCanvas();
  initSignCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具
   ========================================================================== */

const AS_GOLD = '#fcd34d';
const AS_TEAL = '#5eead4';
const AS_WINE = '#f9a8d4';
const AS_CREAM = '#fef3c7';
const AS_ROSE = '#fb7185';
const AS_JADE = '#6ee7b7';
const AS_SKY = '#93c5fd';

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const AS_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
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

// 非首項的負數加括號：5 + (-3)
function pT(v) {
  return v < 0 ? `(${v})` : String(v);
}

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件：下標 SB、parseExpr／exprSeq／exprItems、有理數 q*
   都在 math-canvas.js。字串寫法：「S_6 = 6 × (5 + 20)」「a_{12} = a_1 + 11d」
   -------------------------------------------------------------------------- */

// 置中（或 left 靠左）畫一行含下標的算式字串
function exprAt(ctx, str, cx, cy, size, color, left) {
  const o = { maxW: ctx.canvas.width - 40, gap: 6 };
  if (left != null) o.left = left;
  return drawExpr(ctx, exprItems(str, color), cx, cy, size, color, o);
}

// 「左式 = 分子／分母」的一列：left 與 top 都是 parseExpr 字串
function asFracRow(left, top, bot, tail, color) {
  const items = [];
  if (left) items.push(exprSeq(left, color), T('=', color));
  items.push(VF(exprSeq(top, color), exprSeq(bot, color), color));
  if (tail) items.push(exprSeq(tail, color));
  return items;
}

// 一列推導（drawStepRows 的列）
function row(name, hint, items, color) {
  return { name, hint, items, color };
}

/* --------------------------------------------------------------------------
   等差級數的字串
   -------------------------------------------------------------------------- */
function terms(a1, d, n) {
  const t = [];
  for (let k = 0; k < n; k++) t.push(a1 + k * d);
  return t;
}

// 級數的 LaTeX／ASCII：首項不加括號，其餘負數加括號；項數多時寫成「前三項 + ⋯ + 末項」
function seriesTex(t, maxShow) {
  const m = maxShow || 99;
  const one = (v, i) => (i === 0 ? String(v) : pT(v));
  if (t.length <= m) return t.map(one).join(' + ');
  return `${one(t[0], 0)} + ${pT(t[1])} + ${pT(t[2])} + \\cdots + ${pT(t[t.length - 1])}`;
}

function seriesStr(t, maxShow) {
  return seriesTex(t, maxShow).replace('\\cdots', '⋯');
}

// a + b 的括號：裡面已經有括號時用方括號 [ ]
function sumGroup(a, b) {
  const inner = `${a} + ${pT(b)}`;
  return inner.indexOf('(') >= 0 ? `[${inner}]` : `(${inner})`;
}

// 多項式字串：polyStr([a, b, c], 'n') → "2n^2 - 5n + 3"
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

// 一列等距的小圓點（項），回傳每一點的 x
function dotRow(ctx, n, x0, x1, y, color, r) {
  const xs = [];
  for (let k = 0; k < n; k++) {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * k / (n - 1);
    xs.push(x);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r || 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return xs;
}

// Art Deco 票卡：圓角矩形、上緣一道金線
function asCard(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.16 : alpha;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.lineTo(x + w - 6, y + 6);
  ctx.stroke();
  ctx.restore();
}

function asLine(ctx, x1, y1, x2, y2, color, width, dash) {
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

// 下方大括號（水平）：從 x1 到 x2，尖端朝下
function hBrace(ctx, x1, x2, y, color) {
  const mid = (x1 + x2) / 2, h = 9;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo(x1, y + h, x1 + 10, y + h);
  ctx.lineTo(mid - 8, y + h);
  ctx.quadraticCurveTo(mid, y + h, mid, y + h * 2);
  ctx.quadraticCurveTo(mid, y + h, mid + 8, y + h);
  ctx.lineTo(x2 - 10, y + h);
  ctx.quadraticCurveTo(x2, y + h, x2, y);
  ctx.stroke();
  ctx.restore();
}

/* --------------------------------------------------------------------------
   步驟按鈕：上一步／下一步／全部顯示（3-4-3 的寫法）
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

function showRow(id, on) {
  const el = elById(id);
  if (el) el.style.display = on ? '' : 'none';
}

/* ==========================================================================
   隨堂評量
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第四冊 1-2 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '1-2-1': 'C',    // 13 + 13 + 13 + 13 是等差級數（公差 0）
    '1-2-2': 'A',    // 17 + 24 + ⋯ + 52 共 6 項，S₆ = 207
    '1-2-3': 'D',    // 1 + 2 + ⋯ + 80：2S = 80 × 81，S = 3240
    '1-2-4': 'B',    // 4、9、⋯、44 共 9 排，拼成每排 48 個，S = 216
    '1-2-5': 'B',    // −23 + (−16) + ⋯ + 26 → 12
    '1-2-6': 'C',    // 15 項，首項 −31，末項 53 → 165
    '1-2-7': 'A',    // 13 + 21 + ⋯ + 141 → 17 項，1309
    '1-2-8': 'D',    // 100 到 300 之間 9 的倍數 → 4455
    '1-2-9': 'C',    // 41 + 37 + 33 + ⋯ 前 18 項 → 126
    '1-2-10': 'B',   // 首項 −17、公差 6，前 14 項 → 308
    '1-2-11': 'D',   // 首項 25、前 16 項和 160 → d = −2
    '1-2-12': 'A',   // 8 與 68 之間，和 608 → 16 項，公差 4
    '1-2-13': 'B',   // 汽水罐 2、6、⋯、50 → 13 層，338 罐
    '1-2-14': 'C',   // 正方形燈框 7 圈 → 224 顆
    '1-2-15': 'A',   // 18 排、每排多 3、共 1035 → 第一排 32
    '1-2-16': 'D',   // 12 排、每排多 5、共 402 → 最後一排 61
    '1-2-17': 'C',   // 7、12、17、⋯ 累積 243 → 9 天
    '1-2-18': 'B',   // 27、25、23、⋯ 共 132 → 6 層（22 層不合）
    '1-2-19': 'D',   // 27 + 23 + 19 + ⋯：S₇ 最大
    '1-2-20': 'A'    // 首項 −38、末項 38 → 和為 0
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
   重點 1：數列、級數、等差級數——逗號還是加號？順序有沒有亂？
   ========================================================================== */
function initKindCanvas() {
  const cv = elById('canvas-kind');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('kd-a'), sd = elById('kd-d'), sn = elById('kd-n');
  const va = elById('kd-va'), vd = elById('kd-vd'), vn = elById('kd-vn');
  const g = elById('kd-mode-group');
  const out = elById('kd-formula');
  const fb = elById('kd-feedback');
  const C = AS_TONE[0];
  let mode = 'series';

  function draw() {
    const a1 = iv(sa), d = iv(sd), n = iv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    const t = terms(a1, d, n);
    // 打亂：第 2、3 項對調（n ≥ 3，公差不為 0 時一定不再等差）
    const idx = t.map((v, i) => i);
    if (mode === 'shuffle') { idx[1] = 2; idx[2] = 1; }
    const shown = idx.map(i => t[i]);
    const diffs = [];
    for (let k = 1; k < n; k++) diffs.push(shown[k] - shown[k - 1]);
    const arith = diffs.every(x => x === diffs[0]);
    const S = t.reduce((s, v) => s + v, 0);
    const W = cv.width;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'list' ? '各項用「，」隔開：這是一個數列'
      : (mode === 'series' ? '等差數列的各項依序用「+」連起來' : '同樣這幾個數，換了順序再用「+」連起來'), C);

    // 一排座位票卡
    const gap = 20;
    const cw = Math.min(62, (W - 40 - (n - 1) * gap) / n);
    const total = n * cw + (n - 1) * gap;
    const x0 = (W - total) / 2;
    const y0 = 66, ch = 66;
    shown.forEach((v, k) => {
      const x = x0 + k * (cw + gap);
      asCard(ctx, x, y0, cw, ch, mode === 'shuffle' && (k === 1 || k === 2) && d !== 0 ? AS_WINE : AS_GOLD);
      textCenter(ctx, mn(v), x + cw / 2, y0 + ch / 2 + 4, AS_CREAM, f(900, cw < 50 ? 19 : 22));
      exprAt(ctx, `a_{${idx[k] + 1}}`, x + cw / 2, y0 + ch + 16, 16, MUTED);
      if (k < n - 1) {
        textCenter(ctx, mode === 'list' ? '，' : '+', x + cw + gap / 2, y0 + ch / 2 + 2, INK, f(900, 22));
      }
    });

    // 相鄰兩項的差
    textLeft(ctx, '後項 − 前項：', 22, 186, MUTED, f(700, 13));
    for (let k = 0; k < n - 1; k++) {
      const cx = x0 + k * (cw + gap) + cw + gap / 2;
      const ok = diffs[k] === diffs[0] && arith;
      textCenter(ctx, (diffs[k] >= 0 ? '+' : '') + mn(diffs[k]), cx, 210, ok ? AS_JADE : AS_ROSE, f(800, 15));
    }

    // 整條寫出來
    const line = mode === 'list' ? shown.map(mn).join(', ') : seriesStr(shown);
    drawPanel(ctx, 20, 236, W - 40, 56, C, 0.08);
    drawExpr(ctx, exprItems(mode === 'series' ? `S_${n} = ${line} = ${S}` : (mode === 'list' ? line : `${line} = ${S}`), AS_CREAM), W / 2, 264, 21, AS_CREAM, { maxW: W - 70, gap: 6 });

    // 判定
    let verdict, why1, why2, vc;
    if (mode === 'list') {
      verdict = '是「數列」，不是級數'; vc = AS_SKY;
      why1 = '項與項之間是逗號，只是一個一個排好的數';
      why2 = '數列沒有「和」可以算；用「+」連起來才叫級數';
    } else if (mode === 'series') {
      verdict = '是「等差級數」'; vc = AS_JADE;
      why1 = d === 0 ? '公差是 0：每一項都一樣，仍然是等差級數' : `相鄰兩項都差 ${mn(d)}，而且用「+」連起來`;
      why2 = `S_n 表示前 n 項的和：S_{${n}} = ${S}`;
    } else if (arith) {
      verdict = '還是「等差級數」'; vc = AS_JADE;
      why1 = '公差是 0：每一項都一樣，怎麼換順序都一樣';
      why2 = `和 = ${mn(S)}`;
    } else {
      verdict = '是「級數」，但不是等差級數'; vc = AS_ROSE;
      why1 = '用「+」連起來了，可是相鄰兩項的差不固定';
      why2 = `和沒變（還是 ${mn(S)}），但「等差」看的是排列的順序`;
    }
    drawPanel(ctx, 20, 312, W - 40, 112, vc, 0.1);
    textCenter(ctx, verdict, W / 2, 338, vc, f(900, 20));
    textCenter(ctx, why1, W / 2, 370, INK, f(700, 15));
    exprAt(ctx, why2, W / 2, 398, 15, MUTED);

    // 三個名詞對照
    const tags = [['數列', '用逗號', 'list'], ['級數', '用加號', 'any'], ['等差級數', '等差數列＋加號', 'series']];
    tags.forEach((tg, i) => {
      const x = 30 + i * 166, w = 148;
      const on = (tg[2] === 'list' && mode === 'list') || (tg[2] === 'any' && mode !== 'list')
        || (tg[2] === 'series' && mode !== 'list' && arith);
      drawPanel(ctx, x, 440, w, 56, on ? AS_GOLD : DIM, on ? 0.16 : 0.05);
      textCenter(ctx, tg[0], x + w / 2, 458, on ? AS_GOLD : DIM, f(900, 15));
      textCenter(ctx, tg[1], x + w / 2, 480, on ? INK : DIM, f(700, 12.5));
    });

    if (mode === 'list') {
      out.innerHTML = shown.map((v, i) => `\\(${v}${i < n - 1 ? ',' : ''}\\)`).join('<wbr> ');
    } else {
      const head = mode === 'series' ? `S_{${n}} = ` : '';
      out.innerHTML = wbrEq(`${head}${seriesTex(shown)} = ${S}`);
    }
    let msg;
    if (mode === 'list') msg = '用逗號隔開的是<b>數列</b>；把各項依序用「\\(+\\)」連起來才是<b>級數</b>，這時才有「和」可以算。';
    else if (mode === 'series') msg = d === 0
      ? '公差是 \\(0\\) 的等差數列，每一項都一樣，用「\\(+\\)」連起來<b>仍然是等差級數</b>。'
      : `等差數列 \\(a_1, a_2, \\ldots, a_{${n}}\\) 依序用「\\(+\\)」連起來，就是<b>等差級數</b>；它的和記作 \\(S_{${n}}\\)。`;
    else msg = arith
      ? '每一項都一樣時，換順序不會改變相鄰兩項的差（都是 \\(0\\)），所以仍是等差級數。'
      : `第 2、3 項對調後，相鄰兩項的差變成 \\(${diffs.slice(0, 3).join(',\\ ')}\\ldots\\)，不再固定。<b>和不變，但它已經不是等差級數</b>。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-kd-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：倒序相加（高斯的方法）——複製一份倒過來，拼成長方形
   ========================================================================== */
function initFlipCanvas() {
  const cv = elById('canvas-flip');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('fl-a'), sd = elById('fl-d'), sn = elById('fl-n');
  const va = elById('fl-va'), vd = elById('fl-vd'), vn = elById('fl-vn');
  const out = elById('fl-formula');
  const fb = elById('fl-feedback');
  const C = AS_TONE[1];
  const state = { step: 1 };
  const N_STEP = 3;

  function draw() {
    const a1 = iv(sa), d = iv(sd), n = iv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    const t = terms(a1, d, n);
    const an = t[n - 1], P = a1 + an, S = n * P / 2;
    state.step = clamp(state.step, 1, N_STEP);
    syncSteps('fl', state.step, N_STEP);
    const step = state.step;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);

    drawTitle(ctx, step === 1 ? `階梯座位：第 1 排 ${a1} 個，每排多 ${d} 個，共 ${n} 排`
      : (step === 2 ? '再拿一份一模一樣的，上下倒過來' : `拼成長方形：${n} 排，每排都是 ${P} 個`), C);

    const pitch = Math.min(24, 420 / P);
    const r = pitch * 0.36;
    const rowH = Math.min(34, 230 / n);
    const gapX = step === 2 ? 48 : 0;
    const totalW = P * pitch + gapX;
    const x0 = (W - totalW) / 2 + 20;
    const top = 62;
    for (let k = 0; k < n; k++) {
      const y = top + k * rowH + rowH / 2;
      ctx.save();
      for (let j = 0; j < t[k]; j++) {
        ctx.fillStyle = AS_GOLD;
        ctx.beginPath();
        ctx.arc(x0 + j * pitch + pitch / 2, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (step >= 2) {
        const m = t[n - 1 - k];
        for (let j = 0; j < m; j++) {
          ctx.fillStyle = AS_TEAL;
          ctx.beginPath();
          ctx.arc(x0 + totalW - j * pitch - pitch / 2, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      textCenter(ctx, `第${k + 1}排`, x0 - 30, y, DIM, f(700, 11.5));
    }
    const yb = top + n * rowH;
    if (step === 3) {
      ctx.save();
      ctx.strokeStyle = AS_JADE;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x0 - 2, top - 2, totalW + 4, n * rowH + 4);
      ctx.restore();
      textCenter(ctx, `每排 ${a1} + ${an} = ${P} 個`, x0 + totalW / 2, yb + 16, AS_JADE, f(800, 14));
    }

    const lines = [];
    lines.push([`S = ${seriesStr(t)}`, AS_GOLD]);
    if (step >= 2) lines.push([`S = ${seriesStr(t.slice().reverse())}`, AS_TEAL]);
    if (step >= 3) {
      lines.push([`2S = ${n} × (${a1} + ${an}) = ${2 * S}`, AS_JADE]);
      lines.push([`S = ${2 * S} ÷ 2 = ${S}`, AS_JADE]);
    }
    const ly = Math.max(yb + 46, 330);
    lines.forEach((ln, i) => {
      drawExpr(ctx, exprItems(ln[0], ln[1]), W / 2, ly + i * 38, 19, ln[1], { maxW: W - 50, gap: 6 });
    });
    if (step === 1) textCenter(ctx, '按「下一步」，看高斯怎麼不必一排一排加', W / 2, ly + 46, DIM, f(700, 14));

    out.innerHTML = step >= 3
      ? wbrEq(`2S = ${n} \\times (${a1} + ${an}) = ${2 * S}`) + '，' + `\\(S = ${S}\\)`
      : wbrEq(`S = ${seriesTex(t)}`);
    fb.innerHTML = wrapFeedback(step === 1
      ? `一排一排加要加 \\(${n}\\) 次。高斯的想法是：再寫一份<b>倒過來</b>的。`
      : (step === 2
        ? `倒過來那一份的第 1 排是 \\(${an}\\) 個、最後一排是 \\(${a1}\\) 個。把兩份同一排的座位放在一起，每一排會是幾個？`
        : `每一排都是「首項 \\(+\\) 末項」\\(= ${P}\\) 個，共 \\(${n}\\) 排，所以 \\(2S = ${n} \\times ${P}\\)。<b>兩份才是長方形，所以最後要除以 \\(2\\)</b>。`));
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  bindSteps('fl', () => N_STEP, state, draw);
  draw();
}

/* ==========================================================================
   重點 3：公式 Sₙ = n(a₁ + aₙ)/2——頭尾配對，每一對都一樣大
   ========================================================================== */
function initPairCanvas() {
  const cv = elById('canvas-pair');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('pr-a'), sd = elById('pr-d'), sn = elById('pr-n');
  const va = elById('pr-va'), vd = elById('pr-vd'), vn = elById('pr-vn');
  const out = elById('pr-formula');
  const fb = elById('pr-feedback');
  const C = AS_TONE[2];
  const PAIR_COLORS = [AS_GOLD, AS_TEAL, AS_WINE, AS_SKY];

  function draw() {
    const a1 = iv(sa), d = iv(sd), n = iv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    const t = terms(a1, d, n);
    const an = t[n - 1], P = a1 + an, S = n * P / 2;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `共 ${n} 項：第 1 項配最後一項，第 2 項配倒數第 2 項……`, C);

    const gap = 8;
    const cw = Math.min(54, (W - 40 - (n - 1) * gap) / n);
    const total = n * cw + (n - 1) * gap;
    const x0 = (W - total) / 2;
    const y0 = 52, ch = 50;
    const pairs = Math.floor(n / 2);
    const mid = n % 2 === 1 ? (n - 1) / 2 : -1;
    const colorOf = k => (k === mid ? AS_JADE : PAIR_COLORS[Math.min(k, n - 1 - k) % 4]);
    const xc = [];
    t.forEach((v, k) => {
      const x = x0 + k * (cw + gap);
      xc.push(x + cw / 2);
      asCard(ctx, x, y0, cw, ch, colorOf(k));
      textCenter(ctx, mn(v), x + cw / 2, y0 + ch / 2 + 3, AS_CREAM, f(900, cw < 46 ? 16 : 19));
    });

    // 巢狀的配對弧線，最外層最深
    const yb = y0 + ch + 6;
    for (let k = 0; k < pairs; k++) {
      const depth = 16 + (pairs - k) * 22;
      const col = PAIR_COLORS[k % 4];
      const xa = xc[k], xz = xc[n - 1 - k];
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(xa, yb);
      ctx.quadraticCurveTo((xa + xz) / 2, yb + depth * 2, xz, yb);
      ctx.stroke();
      ctx.restore();
      textCenter(ctx, mn(P), (xa + xz) / 2, yb + depth + 11, col, f(800, 13));
    }
    let y = yb + 16 + pairs * 22 + 36;
    if (mid >= 0) {
      textCenter(ctx, `正中間的 ${mn(t[mid])} 自己一組，剛好是 ${mn(P)} 的一半`, W / 2, Math.max(y, yb + 40), AS_JADE, f(800, 14));
    }
    y = Math.max(y, yb + 40) + 30;
    if (pairs > 0) exprAt(ctx, `每一對的和都是 a_1 + a_n = ${a1} + ${pT(an)} = ${P}`, W / 2, y, 16, INK);

    const rows = [
      row('首末', `共 ${n} 項`, exprItems(`a_1 = ${a1}，a_${n} = ${an}`)),
      row('公式', '首項加末項，乘項數，除以 2', asFracRow(`S_n`, 'n(a_1 + a_n)', '2')),
      row('代入', '', asFracRow(`S_${n}`, `${n} × ${sumGroup(a1, an)}`, '2')),
      row('答', '', exprItems(`S_${n} = ${S}`, AS_JADE), AS_JADE)
    ];
    drawStepRows(ctx, rows, rows.length, { top: y + 40, gap: 50, eqX: 150, color: C, size: 20 });

    out.innerHTML = wbrEq(`S_{${n}} = \\frac{${n} \\times ${sumGroup(a1, an)}}{2} = ${S}`);
    fb.innerHTML = wrapFeedback(n % 2 === 0
      ? `\\(${n}\\) 項配成 \\(${n / 2}\\) 對，每對都是 \\(${P}\\)：\\(${n / 2} \\times ${pT(P)} = ${S}\\)，就是 \\(\\frac{n(a_1 + a_n)}{2}\\)。`
      : `項數是奇數時，正中間那一項 \\(${t[mid]}\\) 落單，它剛好是 \\(${P}\\) 的一半，所以 \\(S_{${n}} = ${n} \\times ${pT(t[mid])} = ${S}\\)——公式照樣成立。`);
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4：不知道項數——先用 aₙ = a₁ + (n − 1)d 算出幾項，再求和
   ========================================================================== */
function initLastCanvas() {
  const cv = elById('canvas-last');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('ls-a'), sd = elById('ls-d'), sn = elById('ls-n');
  const va = elById('ls-va'), vd = elById('ls-vd'), vn = elById('ls-vn');
  const sm = elById('ls-m'), sN = elById('ls-N');
  const vm = elById('ls-vm'), vN = elById('ls-vN');
  const g = elById('ls-mode-group');
  const out = elById('ls-formula');
  const fb = elById('ls-feedback');
  const C = AS_TONE[3];
  let mode = 'last';

  function drawStrip(n, first, last, yy) {
    const xs = dotRow(ctx, Math.min(n, 30), 70, 470, yy, C, n > 30 ? 3.5 : 6);
    if (n > 30) textCenter(ctx, `（共 ${n} 項，只畫出 30 點示意）`, 270, yy + 62, DIM, f(700, 12));
    textCenter(ctx, mn(first), xs[0], yy - 18, AS_GOLD, f(800, 14));
    textCenter(ctx, mn(last), xs[xs.length - 1], yy - 18, AS_GOLD, f(800, 14));
    hBrace(ctx, xs[0], xs[xs.length - 1], yy + 12, MUTED);
    textCenter(ctx, `${n} 個項，中間只有 ${n - 1} 個間隔（${n - 1} 個公差）`, 270, yy + 42, INK, f(700, 14));
  }

  function draw() {
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    showRow('ls-row-a', mode === 'last'); showRow('ls-row-d', mode === 'last'); showRow('ls-row-n', mode === 'last');
    showRow('ls-row-m', mode === 'mult'); showRow('ls-row-N', mode === 'mult');

    if (mode === 'last') {
      const a1 = iv(sa), d = iv(sd), n = iv(sn);
      const t = terms(a1, d, n), an = t[n - 1];
      va.textContent = a1; vd.textContent = d; vn.textContent = d === 0 ? '—' : an;
      if (d === 0) {
        drawTitle(ctx, `每一項都是 ${mn(a1)}`, C);
        drawPanel(ctx, 30, 160, W - 60, 140, AS_ROSE, 0.1);
        textCenter(ctx, '公差是 0：每一項都等於首項', W / 2, 200, AS_ROSE, f(900, 19));
        textCenter(ctx, '末項跟首項一樣，看不出有幾項', W / 2, 236, INK, f(700, 15));
        textCenter(ctx, '把公差調成不是 0 的數再試一次', W / 2, 266, MUTED, f(700, 14));
        out.innerHTML = '公差為 \\(0\\) 時算不出項數';
        fb.innerHTML = wrapFeedback('公差是 \\(0\\) 的級數每一項都一樣，首項等於末項，\\(a_n = a_1 + (n-1)d\\) 解不出 \\(n\\)。題目一定要另外告訴你有幾項。');
        typeset([out, fb]);
        return;
      }
      const S = n * (a1 + an) / 2;
      drawTitle(ctx, `等差級數 ${seriesStr(t, 4)}`, C);
      const rows = [
        row('1 公差', '後項減前項', exprItems(`d = ${t[1]} - ${pT(a1)} = ${d}`)),
        row('2 列式', '末項公式', exprItems(`${an} = ${a1} + (n - 1) × ${pT(d)}`)),
        row('', '末項減首項，再除以公差', exprItems(`n - 1 = ${n - 1}，n = ${n}`)),
        row('3 求和', '首項加末項，乘項數，除以 2', asFracRow(`S_{${n}}`, `${n} × ${sumGroup(a1, an)}`, '2', `= ${S}`)),
        row('答', '', exprItems(`共 ${n} 項，和是 ${S}`, AS_JADE), AS_JADE)
      ];
      drawStepRows(ctx, rows, rows.length, { top: 76, gap: 54, eqX: 160, color: C, size: 20 });
      drawStrip(n, a1, an, 380);
      out.innerHTML = `\\(n = ${n}\\)，` + wbrEq(`S_{${n}} = \\frac{${n} \\times ${sumGroup(a1, an)}}{2} = ${S}`);
      fb.innerHTML = wrapFeedback(`從 \\(${a1}\\) 走到 \\(${an}\\) 一共走了 \\(${(an - a1) / d}\\) 個公差，所以 \\(n - 1 = ${n - 1}\\)。<b>項數比間隔多 \\(1\\)</b>，忘了加 \\(1\\) 就會少算一項。`);
    } else {
      const m = iv(sm), N = iv(sN);
      vm.textContent = m; vN.textContent = N;
      const q = Math.floor(N / m), r = N % m, last = m * q;
      const S = q * (m + last) / 2;
      drawTitle(ctx, `1 到 ${N} 之中，所有 ${m} 的倍數的和`, C);
      const rows = [
        row('首項', `最小的 ${m} 的倍數`, exprItems(`a_1 = ${m}`)),
        row('末項', `不超過 ${N} 的最大倍數`, exprItems(r === 0 ? `${N} = ${m} × ${q}，a_n = ${last}` : `${N} = ${m} × ${q} + ${r}，a_n = ${last}`)),
        row('項數', `${m} × 1 一直到 ${m} × ${q}`, exprItems(`n = ${q}`)),
        row('求和', '首項加末項，乘項數，除以 2', asFracRow(`S_{${q}}`, `${q} × (${m} + ${last})`, '2', `= ${S}`)),
        row('答', '', exprItems(`和是 ${S}`, AS_JADE), AS_JADE)
      ];
      drawStepRows(ctx, rows, rows.length, { top: 76, gap: 54, eqX: 160, color: C, size: 20 });
      drawStrip(q, m, last, 380);
      out.innerHTML = `\\(${m} + ${2 * m} + \\cdots + ${last}\\)，` + wbrEq(`S_{${q}} = \\frac{${q} \\times (${m} + ${last})}{2} = ${S}`);
      fb.innerHTML = wrapFeedback(`\\(${m}\\) 的倍數是公差 \\(${m}\\) 的等差數列。末項是 \\(${m} \\times ${q} = ${last}\\)，所以項數就是 \\(${q}\\)——${r === 0 ? `\\(${N}\\) 剛好是 \\(${m}\\) 的倍數，末項就是它自己。` : `\\(${N}\\) 不是 \\(${m}\\) 的倍數，末項要往下找到 \\(${last}\\)。`}`);
    }
    typeset([out, fb]);
  }

  [sa, sd, sn, sm, sN].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-ls-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：不知道末項——Sₙ = n[2a₁ + (n − 1)d]/2；是 n − 1 不是 n
   ========================================================================== */
function initFormula2Canvas() {
  const cv = elById('canvas-f2');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('f2-a'), sd = elById('f2-d'), sn = elById('f2-n');
  const va = elById('f2-va'), vd = elById('f2-vd'), vn = elById('f2-vn');
  const g = elById('f2-mode-group');
  const out = elById('f2-formula');
  const fb = elById('f2-feedback');
  const C = AS_TONE[4];
  let mode = 'right';

  function draw() {
    const a1 = iv(sa), d = iv(sd), n = iv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    const t = terms(a1, d, n), an = t[n - 1];
    const X = 2 * a1 + (n - 1) * d, S = n * X / 2;
    const Xw = 2 * a1 + n * d;           // 錯誤寫法：(n − 1) 寫成 n
    const Sw = reduce(n * Xw, 2);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `首項 ${mn(a1)}、公差 ${mn(d)}，求前 ${n} 項的和`, C);

    // 從 a₁ 走到 aₙ：n 個點、n − 1 步
    const xs = dotRow(ctx, n, 60, 480, 78, AS_GOLD, 7);
    xs.forEach((x, k) => {
      if (n <= 9 || k === 0 || k === n - 1) textCenter(ctx, mn(t[k]), x, 100, AS_CREAM, f(800, n > 9 ? 12 : 13.5));
    });
    if (n <= 9) {
      for (let k = 0; k < n - 1; k++) textCenter(ctx, (d >= 0 ? '+' : '') + mn(d), (xs[k] + xs[k + 1]) / 2, 60, MUTED, f(700, 11.5));
    }
    hBrace(ctx, xs[0], xs[n - 1], 114, MUTED);
    drawExpr(ctx, exprItems(`從 a_1 走到 a_${n} 只走了 ${n - 1} 步：a_${n} = ${a1} + ${n - 1} × ${pT(d)} = ${an}`, INK), W / 2, 152, 16, INK, { maxW: W - 40, gap: 6 });

    let rows;
    if (mode === 'right') {
      rows = [
        row('公式', '首項、公差、項數', asFracRow('S_n', 'n[2a_1 + (n - 1)d]', '2')),
        row('代入', '', asFracRow(`S_${n}`, `${n} × [2 × ${pT(a1)} + (${n} - 1) × ${pT(d)}]`, '2')),
        row('計算', '', asFracRow(`S_${n}`, `${n} × ${pT(X)}`, '2', `= ${S}`)),
        row('驗算', '先求末項，用公式一', asFracRow(`S_${n}`, `${n} × ${sumGroup(a1, an)}`, '2', `= ${S} ✓`), AS_JADE)
      ];
    } else {
      rows = [
        row('錯誤', '把 n − 1 寫成 n', asFracRow('S_n', 'n[2a_1 + nd]', '2', ' ✗'), AS_ROSE),
        row('代入', '', asFracRow(`S_${n}`, `${n} × [2 × ${pT(a1)} + ${n} × ${pT(d)}]`, '2'), AS_ROSE),
        row('得到', '', [exprSeq(`S_${n} = `, AS_ROSE), qIt(Sw, AS_ROSE)], AS_ROSE),
        row('正確', '應該是 n − 1', exprItems(`S_${n} = ${S}`, AS_JADE), AS_JADE)
      ];
    }
    drawStepRows(ctx, rows, rows.length, { top: 216, gap: 62, eqX: 150, color: C, size: 20 });
    if (mode === 'wrong') {
      const diff = reduce(Math.abs(n * d), 2);
      if (d === 0) {
        textCenter(ctx, '公差是 0，剛好看不出錯——換一個公差試試', W / 2, 476, MUTED, f(800, 15));
      } else {
        drawExpr(ctx, [T(d > 0 ? '錯誤的結果多了' : '錯誤的結果少了', AS_ROSE),
          VF(exprSeq(`${n} × ${Math.abs(d)}`, AS_ROSE), T('2', AS_ROSE), AS_ROSE), T('=', AS_ROSE), qIt(diff, AS_ROSE)],
          W / 2, 476, 17, AS_ROSE, { maxW: W - 60, gap: 6 });
      }
    }

    out.innerHTML = mode === 'right'
      ? wbrEq(`S_{${n}} = \\frac{${n} \\times [2 \\times ${pT(a1)} + (${n} - 1) \\times ${pT(d)}]}{2} = ${S}`)
      : wbrEq(`\\frac{${n} \\times [2 \\times ${pT(a1)} + ${n} \\times ${pT(d)}]}{2} = ${qTex(Sw[0], Sw[1])}`) + `，正確是 \\(${S}\\)`;
    fb.innerHTML = wrapFeedback(mode === 'right'
      ? `不知道末項時，把 \\(a_n = a_1 + (n-1)d\\) 代進 \\(\\frac{n(a_1 + a_n)}{2}\\)，就得到 \\(\\frac{n[2a_1 + (n-1)d]}{2}\\)。兩個公式算出來一樣，都是 \\(${S}\\)。`
      : `\\(${n}\\) 個項之間只有 \\(${n - 1}\\) 個公差。寫成 \\(nd\\) 等於讓末項多走一步，結果差了 \\(\\frac{${n} \\times ${pT(d)}}{2}\\)。`);
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-f2-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：倒過來求——已知和，反求公差或項數
   ========================================================================== */
function initSolveCanvas() {
  const cv = elById('canvas-solve');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sv-a'), sn = elById('sv-n'), sk = elById('sv-k');
  const va = elById('sv-va'), vn = elById('sv-vn'), vk = elById('sv-vk');
  const sa2 = elById('sv-a2'), sb2 = elById('sv-b2'), sm2 = elById('sv-m2');
  const va2 = elById('sv-va2'), vb2 = elById('sv-vb2'), vm2 = elById('sv-vm2');
  const g = elById('sv-mode-group');
  const out = elById('sv-formula');
  const fb = elById('sv-feedback');
  const C = AS_TONE[5];
  let mode = 'd';

  // 求項數模式：讓和是整數的項數清單
  function validN(a1, an) {
    const L = [];
    for (let n = 3; n <= 12; n++) if ((n * (a1 + an)) % 2 === 0) L.push(n);
    return L;
  }

  function draw() {
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    ['a', 'n', 'k'].forEach(s => showRow('sv-row-' + s, mode === 'd'));
    ['a2', 'b2', 'm2'].forEach(s => showRow('sv-row-' + s, mode === 'n'));

    if (mode === 'd') {
      const a1 = iv(sa), n = iv(sn), d = iv(sk);
      const S = n * (2 * a1 + (n - 1) * d) / 2;
      va.textContent = a1; vn.textContent = n; vk.textContent = S;
      const L = 2 * S / n;                         // = 2a₁ + (n − 1)d
      drawTitle(ctx, `首項 ${mn(a1)}、前 ${n} 項的和 ${mn(S)}，公差是多少？`, C);
      const rows = [
        row('設', '', exprItems('公差為 d')),
        row('代入', '代入公式二', asFracRow(`${S}`, `${n} × [2 × ${pT(a1)} + (${n} - 1)d]`, '2')),
        row('同乘 2', '兩邊同乘 2', exprItems(`${2 * S} = ${n}(${2 * a1} + ${n - 1}d)`)),
        row('同除', `兩邊同除以 ${n}`, exprItems(`${L} = ${2 * a1} + ${n - 1}d`)),
        row('移項', '', exprItems(`${n - 1}d = ${L - 2 * a1}`)),
        row('答', '', exprItems(`d = ${d}`, AS_JADE), AS_JADE)
      ];
      drawStepRows(ctx, rows, rows.length, { top: 72, gap: 50, eqX: 150, color: C, size: 20 });
      const t = terms(a1, d, n);
      textCenter(ctx, '代回去檢查：', W / 2, 390, MUTED, f(700, 13));
      drawExpr(ctx, exprItems(`${seriesStr(t, 5)} = ${S}`, AS_CREAM), W / 2, 420, 18, AS_CREAM, { maxW: W - 40, gap: 6 });
      out.innerHTML = wbrEq(`${S} = \\frac{${n} \\times [2 \\times ${pT(a1)} + (${n} - 1)d]}{2}`) + `，\\(d = ${d}\\)`;
      fb.innerHTML = wrapFeedback(`和、首項、項數都知道，只剩公差 \\(d\\) 未知：代進公式就是一個<b>一元一次方程式</b>。先兩邊乘 \\(2\\)、再除以 \\(${n}\\)，最後別忘了係數是 \\(n - 1 = ${n - 1}\\)。`);
    } else {
      const a1 = iv(sa2), an = iv(sb2);
      const L = validN(a1, an);
      sm2.max = L.length - 1;
      const n = L[clamp(iv(sm2), 0, L.length - 1)];
      const S = n * (a1 + an) / 2;
      const dd = reduce(an - a1, n - 1);
      va2.textContent = a1; vb2.textContent = an; vm2.textContent = S;
      drawTitle(ctx, `首項 ${a1}、末項 ${an}、和 ${S}，有幾項？公差多少？`, C);
      const rows = [
        row('設', '', exprItems('共 n 項，公差為 d')),
        row('代入', '首項加末項，乘項數，除以 2', asFracRow(`${S}`, `n × (${a1} + ${an})`, '2')),
        row('同乘 2', '', exprItems(`${2 * S} = ${a1 + an}n`)),
        row('項數', '', exprItems(`n = ${n}`)),
        row('末項式', '再用末項公式求公差', exprItems(`${an} = ${a1} + (${n} - 1)d`)),
        row('答', '', [exprSeq(`共 ${n} 項，d = `, AS_JADE), qIt(dd, AS_JADE)], AS_JADE)
      ];
      drawStepRows(ctx, rows, rows.length, { top: 72, gap: 50, eqX: 150, color: C, size: 20 });
      const xs = dotRow(ctx, n, 70, 470, 404, C, 6);
      textCenter(ctx, String(a1), xs[0], 384, AS_GOLD, f(800, 14));
      textCenter(ctx, String(an), xs[n - 1], 384, AS_GOLD, f(800, 14));
      textCenter(ctx, `${a1} 與 ${an} 之間插入了 ${n - 2} 個數`, W / 2, 436, INK, f(700, 14));
      out.innerHTML = wbrEq(`${S} = \\frac{n \\times (${a1} + ${an})}{2}`) + `，\\(n = ${n}\\)，\\(d = ${qTex(dd[0], dd[1])}\\)`;
      fb.innerHTML = wrapFeedback(`這次不知道項數：用 \\(S_n = \\frac{n(a_1 + a_n)}{2}\\) 先解出 \\(n = ${n}\\)，再代進 \\(a_n = a_1 + (n-1)d\\) 求公差。注意「之間插入」的個數是 \\(n - 2 = ${n - 2}\\)，不是項數。`);
    }
    typeset([out, fb]);
  }

  [sa, sn, sk, sa2, sb2, sm2].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-sv-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 7：數量問題——層層堆疊的汽水罐，從上數或從下數
   ========================================================================== */
function initStackCanvas() {
  const cv = elById('canvas-stack');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const st = elById('sk-t'), sd = elById('sk-d'), sn = elById('sk-n');
  const vt = elById('sk-vt'), vd = elById('sk-vd'), vn = elById('sk-vn');
  const g = elById('sk-mode-group');
  const out = elById('sk-formula');
  const fb = elById('sk-feedback');
  const C = AS_TONE[6];
  let mode = 'down';

  function draw() {
    const top = iv(st), d = iv(sd), n = iv(sn);
    vt.textContent = top; vd.textContent = d; vn.textContent = n;
    const layers = terms(top, d, n);            // 由上往下
    const bottom = layers[n - 1];
    const A1 = mode === 'down' ? top : bottom;
    const D = mode === 'down' ? d : -d;
    const AN = mode === 'down' ? bottom : top;
    const S = n * (top + bottom) / 2;
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `小賣部的汽水罐牆：最上層 ${top} 罐，往下每層多 ${d} 罐，共 ${n} 層`, C);

    const pitch = Math.min(28, 400 / bottom);
    const lh = Math.min(34, 250 / n);
    const y0 = 56;
    layers.forEach((c, k) => {
      const y = y0 + k * lh;
      const wRow = c * pitch;
      const x = (W - wRow) / 2;
      const isA1 = (mode === 'down' && k === 0) || (mode === 'up' && k === n - 1);
      for (let j = 0; j < c; j++) {
        ctx.save();
        ctx.fillStyle = isA1 ? AS_JADE : (k % 2 ? AS_TEAL : AS_GOLD);
        ctx.globalAlpha = 0.85;
        roundRect(ctx, x + j * pitch + pitch * 0.1, y + lh * 0.1, pitch * 0.8, lh * 0.8, Math.min(4, pitch * 0.2));
        ctx.fill();
        ctx.restore();
      }
      textLeft(ctx, `${c} 罐`, Math.max(x + wRow + 8, 300), y + lh / 2, MUTED, f(700, 12));
      const lab = mode === 'down' ? (k === 0 ? 'a_1' : (k === n - 1 ? `a_${n}` : '')) : (k === n - 1 ? 'a_1' : (k === 0 ? `a_${n}` : ''));
      if (lab) exprAt(ctx, lab, 0, y + lh / 2, 17, AS_JADE, 24);
    });

    const rows = [
      row('想法', mode === 'down' ? '最上層當第 1 項' : '最下層當第 1 項', exprItems(`a_1 = ${A1}，d = ${D}，n = ${n}`)),
      row('末項', mode === 'down' ? '最下層' : '最上層', exprItems(`a_${n} = ${A1} + (${n} - 1) × ${pT(D)} = ${AN}`)),
      row('求和', '', asFracRow(`S_${n}`, `${n} × (${A1} + ${AN})`, '2', `= ${S}`)),
      row('答', '', exprItems(`共 ${S} 罐`, AS_JADE), AS_JADE)
    ];
    drawStepRows(ctx, rows, rows.length, { top: 348, gap: 50, eqX: 150, color: C, size: 20 });

    out.innerHTML = wbrEq(`S_{${n}} = \\frac{${n} \\times (${A1} + ${AN})}{2} = ${S}`);
    fb.innerHTML = wrapFeedback(mode === 'down'
      ? `從上往下數：首項 \\(${top}\\)、公差 \\(${d}\\)。換成「從下往上數」看看——首項、末項對調，公差變成 \\(${-d}\\)，和會不會變？`
      : `從下往上數：首項 \\(${bottom}\\)、公差 \\(${-d}\\)，和一樣是 \\(${S}\\)。只要<b>首項、末項、層數</b>讀對，從哪一頭數都可以。`);
    typeset([out, fb]);
  }

  [st, sd, sn].forEach(s => s.addEventListener('input', draw));
  bindPickGroup(g, 'data-sk-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：座位問題——已知總座位、排數、每排多幾個，設第一排為 x
   ========================================================================== */
function initSeatCanvas() {
  const cv = elById('canvas-seat');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sn = elById('se-n'), sd = elById('se-d'), sa = elById('se-a');
  const vn = elById('se-vn'), vd = elById('se-vd'), va = elById('se-va');
  const g = elById('se-ask-group');
  const out = elById('se-formula');
  const fb = elById('se-feedback');
  const C = AS_TONE[7];
  const state = { step: 1 };
  let ask = 'first';
  let nRows = 1;

  function draw() {
    const n = iv(sn), d = iv(sd), a1 = iv(sa);
    const t = terms(a1, d, n), an = t[n - 1];
    const S = n * (a1 + an) / 2;
    vn.textContent = n; vd.textContent = d; va.textContent = S;
    const L = 2 * S / n;
    const W = cv.width;

    const rows = [
      row('設', '', exprItems('第 1 排有 x 個座位')),
      row('列式', '代入公式二', asFracRow(`${S}`, `${n} × [2x + (${n} - 1) × ${d}]`, '2')),
      row('同乘 2', '兩邊同乘 2', exprItems(`${2 * S} = ${n}(2x + ${(n - 1) * d})`)),
      row('同除', `兩邊同除以 ${n}`, exprItems(`${L} = 2x + ${(n - 1) * d}`)),
      row('解', '', exprItems(`2x = ${2 * a1}，x = ${a1}`))
    ];
    if (ask === 'last') rows.push(row('末項', '最後一排', exprItems(`a_{${n}} = ${a1} + (${n} - 1) × ${d} = ${an}`)));
    rows.push(row('答', '', exprItems(ask === 'first' ? `第 1 排有 ${a1} 個座位` : `最後一排有 ${an} 個座位`, AS_JADE), AS_JADE));
    nRows = rows.length;
    state.step = clamp(state.step, 1, nRows);
    syncSteps('se', state.step, nRows);
    const done = state.step >= nRows;

    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `放映廳共 ${n} 排、${S} 個座位，每排比前一排多 ${d} 個`, C);

    // 舞台與一排排座位（長度與座位數成正比）
    ctx.save();
    ctx.fillStyle = 'rgba(190, 18, 60, 0.35)';
    roundRect(ctx, 150, 48, 240, 16, 6);
    ctx.fill();
    ctx.restore();
    textCenter(ctx, '舞台', 270, 56, AS_CREAM, f(800, 11.5));
    const maxSeats = 20 + 14 * 4;
    const scale = 300 / maxSeats;
    const rh = Math.min(12, 168 / n);
    t.forEach((c, k) => {
      const w = c * scale, y = 74 + k * rh;
      ctx.save();
      ctx.fillStyle = (k === 0 && ask === 'first') || (k === n - 1 && ask === 'last') ? AS_JADE : AS_WINE;
      ctx.globalAlpha = 0.7;
      ctx.fillRect((W - w) / 2, y, w, rh * 0.72);
      ctx.restore();
    });
    const yFirst = 74 + rh * 0.36, yLast = 74 + (n - 1) * rh + rh * 0.36;
    textLeft(ctx, done && ask === 'first' ? `第 1 排 ${a1} 個` : '第 1 排 ?', 24, yFirst, ask === 'first' ? AS_JADE : MUTED, f(800, 12.5));
    textLeft(ctx, done && ask === 'last' ? `第 ${n} 排 ${an} 個` : `第 ${n} 排 ?`, 24, yLast, ask === 'last' ? AS_JADE : MUTED, f(800, 12.5));

    drawStepRows(ctx, rows, state.step, { top: 280, gap: 44, eqX: 150, color: C, size: 20 });

    out.innerHTML = wbrEq(`${S} = \\frac{${n} \\times [2x + (${n} - 1) \\times ${d}]}{2}`) + `，\\(x = ${a1}\\)` + (ask === 'last' ? `，\\(a_{${n}} = ${an}\\)` : '');
    fb.innerHTML = wrapFeedback(ask === 'first'
      ? `把題目翻成公式的三個量：總座位 \\(S_n = ${S}\\)、排數 \\(n = ${n}\\)、每排多 \\(d = ${d}\\)。剩下的首項設成 \\(x\\)，就是一元一次方程式。`
      : `題目問的是<b>最後一排</b>：解出 \\(x = ${a1}\\) 還沒結束，要再用 \\(a_n = a_1 + (n-1)d\\) 算出 \\(a_{${n}} = ${an}\\)。`);
    typeset([out, fb]);
  }

  [sn, sd, sa].forEach(s => s.addEventListener('input', draw));
  bindSteps('se', () => nRows, state, draw);
  bindPickGroup(g, 'data-se-ask', v => { ask = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：計數問題——求項數 n，列出來是一元二次方程式
   ========================================================================== */

// A n² + B n + C = 0，已知整數根 n0；回傳整理後的係數、另一根、因式分解字串
function solveCount(a1, d, n0, tot) {
  let A = d, B = 2 * a1 - d, Cc = -2 * tot;
  if (A < 0) { A = -A; B = -B; Cc = -Cc; }
  const g0 = gcd(gcd(A, B), Cc);
  A /= g0; B /= g0; Cc /= g0;
  const other = reduce(-B - A * n0, A);     // 兩根之和 = −B／A
  const p = other[0], q = other[1];
  const k = A / q;
  const kS = k === 1 ? '' : String(k);
  let fac;
  if (q === 1 && p === n0) fac = `${kS}(${lin('n', n0)})^2`;
  else if (q === 1) fac = `${kS}(${lin('n', n0)})(${lin('n', p)})`;
  else fac = `${kS}(${lin('n', n0)})(${q}n ${p < 0 ? '+' : '-'} ${Math.abs(p)})`;
  return { A, B, C: Cc, other, fac, double: q === 1 && p === n0 };
}

function initDaysCanvas() {
  const cv = elById('canvas-days');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('dy-a'), sd = elById('dy-d'), sn = elById('dy-n');
  const va = elById('dy-va'), vd = elById('dy-vd'), vn = elById('dy-vn');
  const la = elById('dy-la'), ld = elById('dy-ld');
  const g = elById('dy-mode-group');
  const out = elById('dy-formula');
  const fb = elById('dy-feedback');
  const C = AS_TONE[8];
  const state = { step: 1 };
  let mode = 'inc';
  let nRows = 1;

  function setMode(v) {
    mode = v;
    if (mode === 'inc') {
      la.textContent = '第 1 天'; ld.textContent = '每天多';
      sa.min = 1; sa.max = 6; sa.value = 3;
      sd.min = 1; sd.max = 4; sd.value = 2;
      sn.min = 3; sn.max = 12; sn.value = 8;
    } else {
      la.textContent = '最下層'; ld.textContent = '每層少';
      sa.min = 10; sa.max = 24; sa.value = 17;
      sd.min = 1; sd.max = 3; sd.value = 2;
      sn.min = 2; sn.value = 5;
    }
    state.step = 1;
    draw();
  }

  function draw() {
    const a1 = iv(sa), dd = iv(sd);
    const d = mode === 'inc' ? dd : -dd;
    if (mode === 'dec') {
      // 每一層至少 1 個：aₙ₀ ≥ 1
      const nmax = Math.min(12, Math.floor((a1 - 1) / dd) + 1);
      sn.max = nmax;
      if (iv(sn) > nmax) sn.value = nmax;
    }
    const n0 = iv(sn);
    const tot = n0 * (2 * a1 + (n0 - 1) * d) / 2;
    va.textContent = a1; vd.textContent = dd; vn.textContent = tot;
    const res = solveCount(a1, d, n0, tot);
    const o = res.other, oV = o[0] / o[1];
    const unit = mode === 'inc' ? '天' : '層';
    const what = mode === 'inc' ? '桶' : '個';

    let reason, rejItems;
    if (res.double) {
      reason = '兩個根一樣，只有一個答案';
      rejItems = exprItems(`n = ${n0}（重根）`, AS_JADE);
    } else if (oV < 0) {
      reason = `${unit}數不能是負數`;
      rejItems = [exprSeq('n = ', AS_ROSE), qIt(o, AS_ROSE), T('不合', AS_ROSE)];
    } else if (o[1] !== 1) {
      reason = `${unit}數要是正整數`;
      rejItems = [exprSeq('n = ', AS_ROSE), qIt(o, AS_ROSE), T('不合', AS_ROSE)];
    } else {
      const am = a1 + (o[0] - 1) * d;
      reason = `第 ${o[0]} 層是 ${mn(am)} 個`;
      rejItems = exprItems(`n = ${o[0]} 不合（a_{${o[0]}} = ${am}）`, AS_ROSE);
    }
    const rows = [
      row('設', '', exprItems(mode === 'inc' ? '要賣 n 天' : '共有 n 層')),
      row('列式', '首項、公差、和都知道', asFracRow(`${tot}`, `n[2 × ${a1} + (n - 1) × ${pT(d)}]`, '2')),
      row('整理', '移項，n² 的係數是正的', exprItems(`${polyStr([res.A, res.B, res.C], 'n')} = 0`)),
      row('分解', '', exprItems(`${res.fac} = 0`)),
      row('解', '', res.double ? exprItems(`n = ${n0}（重根）`) : [exprSeq(`n = ${n0}`), T('或', MUTED), exprSeq('n = '), qIt(o)]),
      row('檢查', reason, rejItems, res.double ? AS_JADE : AS_ROSE),
      row('答', '', exprItems(`${n0} ${unit}`, AS_JADE), AS_JADE)
    ];
    nRows = rows.length;
    state.step = clamp(state.step, 1, nRows);
    syncSteps('dy', state.step, nRows);
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, mode === 'inc'
      ? `小映賣爆米花：第 1 天 ${a1} 桶，每天多 ${dd} 桶，累積 ${tot} 桶要幾天？`
      : `公仔展示架：最下層 ${a1} 個，往上每層少 ${dd} 個，共 ${tot} 個，幾層？`, C);
    drawStepRows(ctx, rows, state.step, { top: 66, gap: 46, eqX: 150, color: C, size: 20 });

    // 每一項的長條：前 n₀ 項金色；另一根若是正整數，把多出來的項也畫出來（玫瑰色）
    const extra = (!res.double && o[1] === 1 && oV > n0) ? o[0] : n0;
    const show = Math.min(extra, 24);
    const vals = terms(a1, d, show);
    const maxAbs = Math.max(1, ...vals.map(Math.abs));
    const bw = Math.min(30, 440 / show);
    const base = 500, hMax = 60;
    const x0 = (W - bw * show) / 2;
    vals.forEach((v, k) => {
      const h = Math.abs(v) / maxAbs * hMax;
      ctx.save();
      ctx.fillStyle = k < n0 ? AS_GOLD : AS_ROSE;
      ctx.globalAlpha = 0.85;
      if (v >= 0) ctx.fillRect(x0 + k * bw + bw * 0.15, base - h, bw * 0.7, h);
      else ctx.fillRect(x0 + k * bw + bw * 0.15, base, bw * 0.7, h);
      ctx.restore();
    });
    asLine(ctx, x0 - 6, base, x0 + bw * show + 6, base, INK, 1.5);
    textCenter(ctx, extra > n0
      ? `加到第 ${extra} 層：多出來的正數和負數抵銷，和又回到 ${tot}，但個數不能是 0 或負的`
      : `每一${unit}的${what}數（共 ${n0} ${unit}）`, W / 2, 582, extra > n0 ? AS_ROSE : MUTED, f(700, 12.5));

    out.innerHTML = wbrEq(`${polyStr([res.A, res.B, res.C], 'n')} = 0`) + `，\\(n = ${n0}\\)`;
    fb.innerHTML = wrapFeedback(res.double
      ? `整理出來是完全平方式，兩個根都是 \\(${n0}\\)，答案只有一個。`
      : (oV < 0
        ? `求項數時，\\(n\\) 會出現在公式的兩個地方，列出來是<b>一元二次方程式</b>。另一個根 \\(${qTex(o[0], o[1])}\\) 是負的，${unit}數不可能是負數，捨去。`
        : (o[1] !== 1
          ? `另一個根 \\(${qTex(o[0], o[1])}\\) 不是整數，${unit}數一定是正整數，捨去。`
          : `兩個根都是正整數！但第 \\(${o[0]}\\) 層的個數是 \\(${a1 + (o[0] - 1) * d}\\)——疊到後面已經變成 \\(0\\) 或負數，<b>要回到情境檢查</b>，\\(n = ${o[0]}\\) 不合。`)));
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  bindSteps('dy', () => nRows, state, draw);
  bindPickGroup(g, 'data-dy-mode', v => setMode(v));
  draw();
}

/* ==========================================================================
   重點 10：級數和的判斷——Sₙ − Sₙ₋₁ = aₙ；首末互為相反數時和為 0
   ========================================================================== */
function initSignCanvas() {
  const cv = elById('canvas-sign');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sa = elById('sg-a'), sd = elById('sg-d'), sn = elById('sg-n');
  const va = elById('sg-va'), vd = elById('sg-vd'), vn = elById('sg-vn');
  const out = elById('sg-formula');
  const fb = elById('sg-feedback');
  const C = AS_TONE[9];

  function panel(vals, cy, hHalf, label, hiOf) {
    const n = vals.length;
    const bw = 440 / 12;
    const x0 = 70;
    const maxAbs = Math.max(1, ...vals.map(Math.abs));
    textLeft(ctx, label, 16, cy - hHalf + 4, MUTED, f(800, 13));
    asLine(ctx, x0 - 6, cy, x0 + bw * n + 6, cy, INK, 1.5);
    vals.forEach((v, k) => {
      const h = Math.abs(v) / maxAbs * hHalf;
      const x = x0 + k * bw + bw * 0.15;
      ctx.save();
      const hi = hiOf(k);
      ctx.fillStyle = hi || (v >= 0 ? AS_GOLD : '#a5b4fc');
      ctx.globalAlpha = hi ? 0.95 : 0.6;
      if (v >= 0) ctx.fillRect(x, cy - Math.max(h, 1.5), bw * 0.7, Math.max(h, 1.5));
      else ctx.fillRect(x, cy, bw * 0.7, h);
      ctx.restore();
      if (hi || n <= 8) {
        textCenter(ctx, mn(v), x + bw * 0.35, v >= 0 ? cy - h - 10 : cy + h + 10, hi ? INK : MUTED, f(700, 11.5));
      }
    });
    return { bw, x0 };
  }

  function draw() {
    const a1 = iv(sa), d = iv(sd), n = iv(sn);
    va.textContent = a1; vd.textContent = d; vn.textContent = n;
    const t = terms(a1, d, n), an = t[n - 1];
    const sums = [];
    t.reduce((s, v) => { sums.push(s + v); return s + v; }, 0);
    const Sn = sums[n - 1], Sp = sums[n - 2];
    const W = cv.width;
    ctx.clearRect(0, 0, W, cv.height);
    drawTitle(ctx, `首項 ${mn(a1)}、公差 ${mn(d)}：上面是每一項，下面是累加的和`, C);

    const lastC = an > 0 ? AS_JADE : (an < 0 ? AS_ROSE : MUTED);
    const p1 = panel(t, 140, 70, '每一項', k => (k === n - 1 ? lastC : null));
    panel(sums, 318, 74, '前 k 項和', k => (k === n - 2 ? AS_SKY : (k === n - 1 ? lastC : null)));
    for (let k = 0; k < n; k++) textCenter(ctx, String(k + 1), p1.x0 + k * p1.bw + p1.bw * 0.5, 420, DIM, f(700, 11.5));
    textLeft(ctx, 'k', 16, 420, DIM, fi(700, 12));

    let msg, mc;
    if (an > 0) { msg = `a_${n} = ${an} > 0，所以 S_${n} 比 S_{${n - 1}} 大`; mc = AS_JADE; }
    else if (an < 0) { msg = `a_${n} = ${an} < 0，所以 S_${n} 反而比 S_{${n - 1}} 小`; mc = AS_ROSE; }
    else { msg = `a_${n} = 0，所以 S_${n} 和 S_{${n - 1}} 一樣大`; mc = MUTED; }
    drawPanel(ctx, 20, 448, W - 40, 72, mc, 0.1);
    drawExpr(ctx, exprItems(`S_${n} = S_{${n - 1}} + a_${n} = ${Sp} + ${pT(an)} = ${Sn}`, INK), W / 2, 468, 17, INK, { maxW: W - 60, gap: 5 });
    exprAt(ctx, msg, W / 2, 500, 16, mc);
    if (a1 + an === 0) {
      exprAt(ctx, `首項 ${a1} 與末項 ${an} 互為相反數 → S_${n} = 0`, W / 2, 556, 16, AS_JADE);
    } else {
      exprAt(ctx, `首項加末項 = ${a1 + an}，不是 0，所以 S_${n} ≠ 0`, W / 2, 556, 15, DIM);
    }

    out.innerHTML = wbrEq(`S_{${n}} = S_{${n - 1}} + a_{${n}} = ${Sp} + ${pT(an)} = ${Sn}`);
    fb.innerHTML = wrapFeedback(an > 0
      ? `多加的第 \\(${n}\\) 項是正數，和才會變大。試著讓公差變成負的，加到後面的項變負數時，和會開始變小。`
      : (an < 0
        ? `第 \\(${n}\\) 項是負數，加上它反而讓和變小——「項數越多和越大」不一定成立，要看<b>多加的那一項</b>是正是負。`
        : `第 \\(${n}\\) 項剛好是 \\(0\\)，加了等於沒加，\\(S_{${n}} = S_{${n - 1}}\\)。`)
      + (a1 + an === 0 ? `<br>首末項互為相反數，\\(a_1 + a_n = 0\\)，所以 \\(S_{${n}} = \\frac{${n} \\times 0}{2} = 0\\)。` : ''));
    typeset([out, fb]);
  }

  [sa, sd, sn].forEach(s => s.addEventListener('input', draw));
  draw();
}
