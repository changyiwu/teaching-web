/* ==========================================================================
   3-1-1（第三冊 1-1）乘法公式 — 互動 Canvas 與隨堂評量
   畫風：拼布手作工坊（布塊、縫線、格紋）。a² 用玫瑰紅、b² 用薄荷綠、
   ab 長條用芥末黃，九個互動都用同一套顏色，學生一眼就認得哪一塊是哪一項。

   共用工具在 ../math-canvas.js（T／IT／PW／GRP／SEQ／measure／drawIt／drawExpr／
   drawStepRows／drawEqPanel／drawPanel／drawChip／drawArrow／wbrEq／textCenter／
   textLeft／bindPickGroup…），本檔只放本節專屬的色票、布塊繪圖與 9 個互動。

   ⚠️ 依〈開發約束 17〉，所有面積圖的長度都與數值成正比；「算平方」模式裡
   \(200 + 6\) 的 6 只有幾 px 寬，那正是要傳達的訊息，不要為了好看放大。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initDistCanvas();
  initSplitCanvas();
  initSumCanvas();
  initDiffCanvas();
  initDsqCanvas();
  initRevCanvas();
  initErrCanvas();
  initAppCanvas();
  initSubCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（QL_ = Quilt；共用檔沒有這個前綴的符號）
   ========================================================================== */

const QL_ROSE = '#fb7185';     // a² 的大布塊
const QL_TEAL = '#5eead4';     // b² 的小布塊
const QL_MUSTARD = '#fcd34d';  // ab 的長條
const QL_DENIM = '#93c5fd';    // 第三種布（bc、內層正方形）
const QL_CREAM = '#fef3c7';    // 深色底板上的算式字色
const QL_CUT = '#f87171';      // 剪掉的部分
const QL_ROAD = '#94a3b8';     // 水泥道路

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const QL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc'];

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件／LaTeX
   原始字串一律用 ASCII 寫：「(a + b)^2 = 500^2 + 2×500×4 + 4^2」。
     - 小寫英文字母走斜體
     - ^n 接在數字、字母或括號後面就是乘方（括號會跟著指數一起長高）
     - canvas 上的 - 換成數學減號 −，比連字號長、投影時才看得清楚
   -------------------------------------------------------------------------- */
function qlParse(str, color) {
  const out = [];
  let buf = '';
  const flush = () => {
    if (buf) { out.push(T(buf.replace(/-/g, '−'), color)); buf = ''; }
  };
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(') {
      let d = 1, j = i + 1;
      while (j < str.length) {
        if (str[j] === '(') d++;
        else if (str[j] === ')') { d--; if (d === 0) break; }
        j++;
      }
      flush();
      out.push(GRP([SEQ(qlParse(str.slice(i + 1, j), color), color, 1)], '()', color));
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

function qlInk(s, color) {
  return SEQ(qlParse(String(s), color), color, 1);
}

// 同一條字串的 LaTeX 版（給數值列與回饋區）
function qlTex(s) {
  return String(s).replace(/×/g, ' \\times ');
}

// 帶正負號的一串項：[[係數, '文字'], ...] → 「100×500 - 100×3 + 2×500」
function qlSigned(list) {
  let s = '';
  list.forEach(([neg, body], i) => {
    if (i === 0) s = (neg ? '-' : '') + body;
    else s += (neg ? ' - ' : ' + ') + body;
  });
  return s;
}

// 一組按鈕的 active 狀態由程式設定（切換模式時把按鈕歸位）
function qlSetActive(groupEl, attr, value) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute(attr) === String(value));
  });
}

/* --------------------------------------------------------------------------
   布塊繪圖
   -------------------------------------------------------------------------- */

// 一塊布：半透明填色、實線外框，夠大時再加一圈虛線縫線
function qlPatch(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha == null ? 0.30 : o.alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (w > 18 && h > 18 && o.stitch !== false) {
    ctx.setLineDash([4, 4]);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }
  ctx.restore();
}

// 剪掉的部分：淡紅底、斜線、虛線外框
function qlCut(ctx, x, y, w, h, alpha) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.fillStyle = QL_CUT;
  ctx.globalAlpha = alpha == null ? 0.12 : alpha;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = QL_CUT;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let d = -h; d < w; d += 9) {
    ctx.moveTo(x + d, y + h);
    ctx.lineTo(x + d + h, y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = QL_CUT;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.8;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// 單位格線（拼布的格紋），只在格子夠大時畫
function qlGrid(ctx, x, y, w, h, u) {
  if (u < 9) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x + u; gx < x + w - 0.5; gx += u) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); }
  for (let gy = y + u; gy < y + h - 0.5; gy += u) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); }
  ctx.stroke();
  ctx.restore();
}

// 布塊上的標籤：依序試幾個版本（長的、短的），挑第一個放得進去的；都放不下就不畫
function qlLabel(ctx, x, y, w, h, texts, color, size) {
  const sz = size || 15;
  if (w < 14 || h < sz * 1.15) return;
  for (const s of texts) {
    if (!s) continue;
    const it = qlInk(s, color);
    if (measure(ctx, it, sz).w <= w - 8) {
      drawExpr(ctx, [it], x + w / 2, y + h / 2, sz, color);
      return;
    }
  }
}

// 布塊左上角的小名字（甲、乙…）
function qlName(ctx, x, y, w, h, name, color) {
  if (w < 34 || h < 40) return;
  textLeft(ctx, name, x + 7, y + 13, color, f(800, 12));
}

/**
 * 水平尺寸標示：圖形「外側」的一條尺寸線加兩端短豎線（開發約束 18）。
 * o.below：標籤寫在線的下方；o.bump：標籤比線段還寬時，再往外推一排，
 * 才不會跟隔壁那一段的標籤疊在一起。
 */
function qlDimH(ctx, x1, x2, y, label, color, opts) {
  const o = opts || {};
  const dir = o.below ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.moveTo(x1, y - 5); ctx.lineTo(x1, y + 5);
  ctx.moveTo(x2, y - 5); ctx.lineTo(x2, y + 5);
  ctx.stroke();
  ctx.restore();
  const sz = o.size || 15;
  const it = qlInk(label, color);
  const w = measure(ctx, it, sz).w;
  const off = o.bump ? 32 : 14;
  drawExpr(ctx, [it], (x1 + x2) / 2, y + dir * off, sz, color, { maxW: 170 });
}

// 垂直尺寸標示：o.right 為 true 時標籤寫在右邊，否則寫在左邊
function qlDimV(ctx, y1, y2, x, label, color, opts) {
  const o = opts || {};
  const dir = o.right ? 1 : -1;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y1); ctx.lineTo(x, y2);
  ctx.moveTo(x - 5, y1); ctx.lineTo(x + 5, y1);
  ctx.moveTo(x - 5, y2); ctx.lineTo(x + 5, y2);
  ctx.stroke();
  ctx.restore();
  const sz = o.size || 15;
  const it = qlInk(label, color);
  const w = measure(ctx, it, sz).w;
  const gap = 10 + (o.extra || 0);
  drawExpr(ctx, [it], x + dir * (gap + w / 2), (y1 + y2) / 2, sz, color, { maxW: 170 });
}

/**
 * 相鄰兩段的水平尺寸標示（x0–x1、x1–x2）。兩個標籤若會疊在一起，
 * 就把「比較短的那一段」的標籤往外推一排。
 */
function qlDimPairH(ctx, x0, x1, x2, y, l1, l2, c1, c2, opts) {
  const o = opts || {};
  const sz = o.size || 15;
  const w1 = measure(ctx, qlInk(l1, c1), sz).w;
  const w2 = measure(ctx, qlInk(l2, c2), sz).w;
  const clash = (x0 + x1) / 2 + w1 / 2 + 8 > (x1 + x2) / 2 - w2 / 2;
  const shortFirst = (x1 - x0) < (x2 - x1);
  qlDimH(ctx, x0, x1, y, l1, c1, Object.assign({}, o, { bump: clash && shortFirst }));
  qlDimH(ctx, x1, x2, y, l2, c2, Object.assign({}, o, { bump: clash && !shortFirst }));
}

// 相鄰兩段的垂直尺寸標示（y0–y1、y1–y2）：疊在一起時，短的那段標籤再往外移一個標籤寬
function qlDimPairV(ctx, y0, y1, y2, x, l1, l2, c1, c2, opts) {
  const o = opts || {};
  const sz = o.size || 15;
  const w1 = measure(ctx, qlInk(l1, c1), sz).w;
  const w2 = measure(ctx, qlInk(l2, c2), sz).w;
  const clash = (y1 + y2) / 2 - (y0 + y1) / 2 < sz * 1.35;
  const shortFirst = (y1 - y0) < (y2 - y1);
  qlDimV(ctx, y0, y1, x, l1, c1, Object.assign({}, o, { extra: clash && shortFirst ? w2 + 14 : 0 }));
  qlDimV(ctx, y1, y2, x, l2, c2, Object.assign({}, o, { extra: clash && !shortFirst ? w1 + 14 : 0 }));
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 1-1 的 18 題正解
  // 正解字母分布：A 5 題、B 5 題、C 4 題、D 4 題（開發約束 36）
  const answers = {
    '1-1-1': 'B',    // (x + 5)(y + 2) = xy + 2x + 5y + 10
    '1-1-2': 'A',    // (m + 3)(n - 2) = mn - 2m + 3n - 6
    '1-1-3': 'C',    // (50 - 1)(200 + 1) = 9849
    '1-1-4': 'D',    // (5 - 0.1)(30 + 0.2) = 147.98
    '1-1-5': 'B',    // 403² = 162409
    '1-1-6': 'A',    // 30.2² = 912.04
    '1-1-7': 'C',    // 297² = 88209
    '1-1-8': 'D',    // 9.8² = 96.04
    '1-1-9': 'B',    // 405 × 395 = 159975
    '1-1-10': 'A',   // a + b = 13、a - b = 7 ⇒ 10、3
    '1-1-11': 'C',   // (186 + 14)² = 40000
    '1-1-12': 'A',   // (756 + 244)(756 - 244) = 512000
    '1-1-13': 'D',   // (a - b)² = (b - a)²
    '1-1-14': 'C',   // (70 - 6)² = 4096，兩人都錯
    '1-1-15': 'B',   // (25 + 0.4)² = 645.16
    '1-1-16': 'A',   // 46² - 34² = 960
    '1-1-17': 'B',   // 2026² - 2025 × 2027 = 1
    '1-1-18': 'D'    // 連續奇數 mn + 1 是偶數的平方：52²
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
   重點 1：拼布切割台——a(b + c)、a(b - c)、(a + b)(c + d) 的面積模型
   ========================================================================== */
function initDistCanvas() {
  const cv = document.getElementById('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = [1, 2, 3, 4].map(i => document.getElementById('di-s' + i));
  const V = [1, 2, 3, 4].map(i => document.getElementById('di-v' + i));
  const N = [1, 2, 3, 4].map(i => document.getElementById('di-n' + i));
  const r2 = document.getElementById('di-r2');
  const modeG = document.getElementById('di-mode-group');
  const out = document.getElementById('di-formula');
  const fb = document.getElementById('di-feedback');
  const C = QL_TONE[0];
  let mode = 'two';

  // 每個模式四支滑桿的 [名稱, min, max, 預設]；null 表示這個模式用不到
  const CFG = {
    plus: [['直邊 a', 1, 6, 3], null, ['橫邊 b', 1, 6, 4], ['橫邊 c', 1, 4, 2]],
    minus: [['直邊 a', 1, 6, 3], null, ['整條橫邊 b', 2, 8, 6], ['剪掉的橫邊 c（比 b 小）', 1, 7, 2]],
    two: [['直邊 a', 1, 6, 3], ['直邊 b', 1, 4, 2], ['橫邊 c', 1, 6, 4], ['橫邊 d', 1, 4, 2]]
  };

  function loadMode() {
    CFG[mode].forEach((d, i) => {
      if (!d) return;
      N[i].textContent = d[0];
      S[i].min = d[1];
      S[i].max = d[2];
      S[i].value = d[3];
    });
    r2.hidden = (mode !== 'two');
  }

  // a(b - c) 的 c 一定要比 b 小，否則剪不出東西（開發約束 27）
  function clampMinus() {
    if (mode !== 'minus') return;
    const b = parseInt(S[2].value, 10);
    S[3].max = b - 1;
    if (parseInt(S[3].value, 10) > b - 1) S[3].value = b - 1;
  }

  const Y0 = 106;          // 圖形上緣（上方留兩排尺寸標示）
  const MAXW = 370, MAXH = 196;

  function frame(W, H) {
    const u = Math.min(36, MAXW / W, MAXH / H);
    const x0 = Math.round(285 - W * u / 2);
    return { u, x0, y0: Y0 };
  }

  function drawTwo(a, b, c, d) {
    const { u, x0, y0 } = frame(c + d, a + b);
    const total = (a + b) * (c + d);
    drawTitle(ctx, `大長方形 (a + b)(c + d) 剪成四塊`, C);
    const P = [
      { x: x0, y: y0, w: c * u, h: a * u, col: QL_ROSE, nm: '甲', lab: [`ac = ${a * c}`, 'ac'] },
      { x: x0 + c * u, y: y0, w: d * u, h: a * u, col: QL_MUSTARD, nm: '乙', lab: [`ad = ${a * d}`, 'ad'] },
      { x: x0, y: y0 + a * u, w: c * u, h: b * u, col: QL_DENIM, nm: '丙', lab: [`bc = ${b * c}`, 'bc'] },
      { x: x0 + c * u, y: y0 + a * u, w: d * u, h: b * u, col: QL_TEAL, nm: '丁', lab: [`bd = ${b * d}`, 'bd'] }
    ];
    P.forEach(p => qlPatch(ctx, p.x, p.y, p.w, p.h, p.col));
    qlGrid(ctx, x0, y0, (c + d) * u, (a + b) * u, u);
    P.forEach(p => {
      qlName(ctx, p.x, p.y, p.w, p.h, p.nm, p.col);
      qlLabel(ctx, p.x, p.y, p.w, p.h, p.lab, QL_CREAM);
    });
    qlDimPairH(ctx, x0, x0 + c * u, x0 + (c + d) * u, y0 - 14, `c = ${c}`, `d = ${d}`, INK, INK);
    qlDimPairV(ctx, y0, y0 + a * u, y0 + (a + b) * u, x0 - 14, `a = ${a}`, `b = ${b}`, INK, INK);

    const rows = [
      { name: '① 一整塊算', hint: '長 × 寬',
        items: [qlInk(`(${a} + ${b})(${c} + ${d}) = ${a + b}×${c + d} = ${total}`, INK)] },
      { name: '② 四小塊加', hint: '甲 + 乙 + 丙 + 丁',
        items: [qlInk(`${a * c} + ${a * d} + ${b * c} + ${b * d} = ${total}`, INK)] },
      { name: '③ 兩種一樣', hint: '剪開不會改變面積',
        items: [qlInk('(a + b)(c + d) = ac + ad + bc + bd', QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 346, gap: 52, labX: 22, eqX: 172, size: 19, color: C });
    textCenter(ctx, '每一塊都是「一條直邊 × 一條橫邊」，四種配法一個都不能少', 270, 491, INK, f(700, 14));

    out.innerHTML = wbrEq(qlTex(`(${a} + ${b})(${c} + ${d}) = ${a * c} + ${a * d} + ${b * c} + ${b * d} = ${total}`));
    fb.innerHTML = wrapFeedback(`整塊算 \\(${a + b} \\times ${c + d} = ${total}\\)，四小塊加起來也是 \\(${total}\\)。`
      + `不管邊長怎麼調，兩種算法<b style="color:${C}">永遠一樣</b>：${wbrEq('(a + b)(c + d) = ac + ad + bc + bd')}`);
  }

  function drawPlus(a, b, c) {
    const { u, x0, y0 } = frame(b + c, a);
    const total = a * (b + c);
    drawTitle(ctx, '長方形 a(b + c) 剪成兩塊', C);
    qlPatch(ctx, x0, y0, b * u, a * u, QL_ROSE);
    qlPatch(ctx, x0 + b * u, y0, c * u, a * u, QL_MUSTARD);
    qlGrid(ctx, x0, y0, (b + c) * u, a * u, u);
    qlLabel(ctx, x0, y0, b * u, a * u, [`ab = ${a * b}`, 'ab'], QL_CREAM);
    qlLabel(ctx, x0 + b * u, y0, c * u, a * u, [`ac = ${a * c}`, 'ac'], QL_CREAM);
    qlDimPairH(ctx, x0, x0 + b * u, x0 + (b + c) * u, y0 - 14, `b = ${b}`, `c = ${c}`, INK, INK);
    qlDimV(ctx, y0, y0 + a * u, x0 - 14, `a = ${a}`, INK);

    const rows = [
      { name: '① 一整塊算', hint: '長 × 寬',
        items: [qlInk(`${a}×(${b} + ${c}) = ${a}×${b + c} = ${total}`, INK)] },
      { name: '② 兩小塊加', hint: '左塊 + 右塊',
        items: [qlInk(`${a * b} + ${a * c} = ${total}`, INK)] },
      { name: '③ 分配律', hint: 'a 分給 b 也分給 c',
        items: [qlInk('a(b + c) = ab + ac', QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 346, gap: 52, labX: 22, eqX: 172, size: 19, color: C });
    textCenter(ctx, '括號外的 a 要乘到括號裡的每一項', 270, 491, INK, f(700, 14));

    out.innerHTML = wbrEq(qlTex(`${a}×(${b} + ${c}) = ${a * b} + ${a * c} = ${total}`));
    fb.innerHTML = wrapFeedback(`整塊 \\(${a} \\times ${b + c} = ${total}\\)，兩塊 \\(${a * b} + ${a * c} = ${total}\\)，`
      + `<b style="color:${C}">一樣大</b>：${wbrEq('a(b + c) = ab + ac')}`);
  }

  function drawMinus(a, b, c) {
    const { u, x0, y0 } = frame(b, a);
    const left = a * (b - c);
    drawTitle(ctx, '長方形 a × b 剪掉一條 a × c', C);
    qlPatch(ctx, x0, y0, (b - c) * u, a * u, QL_ROSE);
    qlCut(ctx, x0 + (b - c) * u, y0, c * u, a * u);
    qlGrid(ctx, x0, y0, b * u, a * u, u);
    qlLabel(ctx, x0, y0, (b - c) * u, a * u, [`a(b - c) = ${left}`, `${left}`], QL_CREAM);
    qlLabel(ctx, x0 + (b - c) * u, y0, c * u, a * u, [`剪掉 ac`, 'ac'], QL_CUT);
    // 上方兩排：近邊那排是 b - c 與 c，外面那排是整條 b
    qlDimPairH(ctx, x0, x0 + (b - c) * u, x0 + b * u, y0 - 14, `b - c = ${b - c}`, `c = ${c}`, INK, QL_CUT);
    qlDimV(ctx, y0, y0 + a * u, x0 - 14, `a = ${a}`, INK);
    qlDimH(ctx, x0, x0 + b * u, y0 + a * u + 14, `b = ${b}`, INK, { below: true });

    const rows = [
      { name: '① 剩下的那塊', hint: '長 a、寬 b − c',
        items: [qlInk(`${a}×(${b} - ${c}) = ${a}×${b - c} = ${left}`, INK)] },
      { name: '② 整塊減剪掉', hint: 'ab − ac',
        items: [qlInk(`${a * b} - ${a * c} = ${left}`, INK)] },
      { name: '③ 分配律', hint: '減法也一樣分配',
        items: [qlInk('a(b - c) = ab - ac', QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 346, gap: 52, labX: 22, eqX: 172, size: 19, color: C });
    textCenter(ctx, '剪掉的那一條也是「a × 一條橫邊」，所以用減的', 270, 491, INK, f(700, 14));

    out.innerHTML = wbrEq(qlTex(`${a}×(${b} - ${c}) = ${a * b} - ${a * c} = ${left}`));
    fb.innerHTML = wrapFeedback(`剩下的 \\(${a} \\times ${b - c} = ${left}\\)，整塊減掉剪掉的 \\(${a * b} - ${a * c} = ${left}\\)，`
      + `<b style="color:${C}">一樣大</b>：${wbrEq('a(b - c) = ab - ac')}`);
  }

  function draw() {
    clampMinus();
    const v = S.map(s => parseInt(s.value, 10));
    V.forEach((el, i) => { el.textContent = v[i]; });
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'two') drawTwo(v[0], v[1], v[2], v[3]);
    else if (mode === 'plus') drawPlus(v[0], v[2], v[3]);
    else drawMinus(v[0], v[2], v[3]);
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-di-mode', v => { mode = v; loadMode(); draw(); });
  S.forEach(s => s.addEventListener('input', draw));
  loadMode();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 2：拆數乘法表——(100 + s)(B + t) 的四格乘積
   ========================================================================== */
function initSplitCanvas() {
  const cv = document.getElementById('canvas-split');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pS = document.getElementById('sp-p');
  const tS = document.getElementById('sp-t');
  const pV = document.getElementById('sp-pv');
  const tV = document.getElementById('sp-tv');
  const baseG = document.getElementById('sp-base-group');
  const out = document.getElementById('sp-formula');
  const fb = document.getElementById('sp-feedback');
  const C = QL_TONE[1];
  let base = 500;

  // 拆開的一個數：(100 + 2)、(500 - 3)；小數字是 0 時不必拆
  function part(round, d) {
    if (d === 0) return String(round);
    return `(${round} ${d > 0 ? '+' : '-'} ${Math.abs(d)})`;
  }
  function signTxt(d) {
    if (d === 0) return '0';
    return (d > 0 ? '+' : '−') + Math.abs(d);
  }

  function draw() {
    const p = parseInt(pS.value, 10);
    const t = parseInt(tS.value, 10);
    const s = p - 100;
    const q = base + t;
    pV.textContent = p;
    tV.textContent = t;
    const prod = p * q;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, (s === 0 && t === 0) ? `${p} × ${q}：兩個數都已經是整百` : `把 ${p} × ${q} 拆成整百 ± 小數字`, C);

    // 乘法表：列是 100 與 s，欄是 B 與 t
    const X = [40, 150, 330, 500];
    const Y = [52, 92, 152, 212];
    const rowV = [100, s], colV = [base, t];
    const tone = [[QL_ROSE, QL_MUSTARD], [QL_DENIM, QL_TEAL]];
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.10)';
    ctx.fillRect(X[0], Y[0], X[3] - X[0], Y[1] - Y[0]);
    ctx.fillRect(X[0], Y[1], X[1] - X[0], Y[3] - Y[1]);
    ctx.restore();
    textCenter(ctx, '×', (X[0] + X[1]) / 2, (Y[0] + Y[1]) / 2, MUTED, f(800, 18));
    textCenter(ctx, String(base), (X[1] + X[2]) / 2, (Y[0] + Y[1]) / 2, INK, f(800, 18));
    textCenter(ctx, signTxt(t), (X[2] + X[3]) / 2, (Y[0] + Y[1]) / 2, t < 0 ? QL_CUT : INK, f(800, 18));
    textCenter(ctx, '100', (X[0] + X[1]) / 2, (Y[1] + Y[2]) / 2, INK, f(800, 18));
    textCenter(ctx, signTxt(s), (X[0] + X[1]) / 2, (Y[2] + Y[3]) / 2, s < 0 ? QL_CUT : INK, f(800, 18));
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const x = X[j + 1], y = Y[i + 1], w = X[j + 2] - X[j + 1], h = Y[i + 2] - Y[i + 1];
        const a = rowV[i], b = colV[j], v = a * b;
        if (v === 0) {
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
          ctx.restore();
          textCenter(ctx, '0（不用算）', x + w / 2, y + h / 2, DIM, f(700, 14));
          continue;
        }
        if (v < 0) qlCut(ctx, x + 3, y + 3, w - 6, h - 6, 0.16);
        else qlPatch(ctx, x + 3, y + 3, w - 6, h - 6, tone[i][j], { alpha: 0.22 });
        textCenter(ctx, `${a < 0 ? '−' + (-a) : a} × ${b < 0 ? '(−' + (-b) + ')' : b}`, x + w / 2, y + h / 2 - 13, MUTED, f(600, 13));
        textCenter(ctx, v < 0 ? `−${-v}` : String(v), x + w / 2, y + h / 2 + 11, v < 0 ? QL_CUT : QL_CREAM, f(800, 19));
      }
    }

    const cells = [[100, base], [100, t], [s, base], [s, t]].filter(([a, b]) => a !== 0 && b !== 0);
    const pStr = part(100, s), qStr = part(base, t);
    const join = (pStr[0] === '(' && qStr[0] === '(') ? '' : ' × ';
    const terms = qlSigned(cells.map(([a, b]) => [a * b < 0, `${Math.abs(a)}×${Math.abs(b)}`]));
    const vals = qlSigned(cells.map(([a, b]) => [a * b < 0, String(Math.abs(a * b))]));

    const rows = [
      { name: '① 拆數', hint: '整百 ± 小數字', items: [qlInk(`${p}×${q} = ${pStr}${join}${qStr}`, INK)] },
      { name: '② 展開成四項', hint: '帶負號的要減', items: [qlInk(terms, INK)] },
      { name: '③ 算每一格', hint: '對照上面的乘法表', items: [qlInk(vals, INK)] },
      { name: '④ 加起來', hint: '', items: [qlInk(`= ${prod}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    if (cells.length === 1) rows.splice(1, 2);
    drawStepRows(ctx, rows, rows.length, { top: 264, gap: 52, labX: 22, eqX: 160, size: 19, color: C });
    textCenter(ctx, `驗算：直接相乘 ${p} × ${q} = ${prod} ✓`, 270, 482, OK_COLOR, f(700, 14.5));

    out.innerHTML = wbrEq(qlTex(`${p}×${q} = ${vals} = ${prod}`));
    let msg;
    if (s === 0 && t === 0) {
      msg = `兩個數都是整百，直接相乘就好。把它們調離整百，看看四格怎麼出現。`;
    } else if (cells.length === 2) {
      msg = `有一個數剛好是整百、不用拆，只剩兩格。另一個數拆開後，兩格加起來就是 \\(${prod}\\)。`;
    } else {
      msg = `四格各是「一個拆出來的數 × 另一個拆出來的數」，<b style="color:${C}">帶負號的格子要減掉</b>。`
        + `四格加起來是 \\(${prod}\\)，和直接相乘一樣。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(baseG, 'data-sp-base', v => { base = parseInt(v, 10); draw(); });
  [pS, tS].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 3、4 共用：正方形拼布的四塊（和的平方與差的平方共用同一個幾何）
   ========================================================================== */

// 和的平方：左上 A²、右上與左下兩條 AB、右下 B²
function qlSumSquare(ctx, x0, y0, u, A, B, lab) {
  const a = A * u, b = B * u;
  qlPatch(ctx, x0, y0, a, a, QL_ROSE);
  qlPatch(ctx, x0 + a, y0, b, a, QL_MUSTARD);
  qlPatch(ctx, x0, y0 + a, a, b, QL_MUSTARD);
  qlPatch(ctx, x0 + a, y0 + a, b, b, QL_TEAL);
  if (lab.grid) qlGrid(ctx, x0, y0, a + b, a + b, u);
  qlLabel(ctx, x0, y0, a, a, lab.aa, QL_CREAM, 17);
  qlLabel(ctx, x0 + a, y0, b, a, lab.ab, QL_CREAM);
  qlLabel(ctx, x0, y0 + a, a, b, lab.ab, QL_CREAM);
  qlLabel(ctx, x0 + a, y0 + a, b, b, lab.bb, QL_CREAM);
}

// 右側的圖例：色塊、這一項的值、有幾塊
function qlLegend(ctx, x, y, color, text, count) {
  qlPatch(ctx, x, y - 9, 18, 18, color, { stitch: false, alpha: 0.45 });
  drawExpr(ctx, [qlInk(text, INK)], 0, y, 15, INK, { left: x + 26, maxW: 104 });
  textLeft(ctx, `${count} 塊`, x + 26, y + 20, MUTED, f(700, 12));
}

/* ==========================================================================
   重點 3：正方形拼布台——(a + b)² = a² + 2ab + b²
   ========================================================================== */
function initSumCanvas() {
  const cv = document.getElementById('canvas-sum');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('su-mode-group');
  const splitG = document.getElementById('su-split-group');
  const splitRow = document.getElementById('su-split-row');
  const aRow = document.getElementById('su-a-row');
  const bRow = document.getElementById('su-b-row');
  const nRow = document.getElementById('su-n-row');
  const aS = document.getElementById('su-a');
  const bS = document.getElementById('su-b');
  const nS = document.getElementById('su-n');
  const aV = document.getElementById('su-av');
  const bV = document.getElementById('su-bv');
  const nV = document.getElementById('su-nv');
  const out = document.getElementById('su-formula');
  const fb = document.getElementById('su-feedback');
  const C = QL_TONE[2];
  let mode = 'area', split = 'round';

  const X0 = 120, Y0 = 92, SIDE = 236;

  function loadMode() {
    const num = (mode === 'num');
    aRow.hidden = num;
    bRow.hidden = num;
    nRow.hidden = !num;
    splitRow.hidden = !num;
  }

  function drawArea() {
    const a = parseInt(aS.value, 10), b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    const s = a + b, s2 = s * s;
    const u = Math.min(30, SIDE / s);
    drawTitle(ctx, '邊長 a + b 的正方形拼布由哪幾塊組成？', C);
    qlSumSquare(ctx, X0, Y0, u, a, b, { grid: true, aa: [`a^2`], ab: ['ab'], bb: ['b^2'] });
    qlDimPairH(ctx, X0, X0 + a * u, X0 + s * u, Y0 - 14, `a = ${a}`, `b = ${b}`, INK, INK);
    qlDimPairV(ctx, Y0, Y0 + a * u, Y0 + s * u, X0 - 14, `a = ${a}`, `b = ${b}`, INK, INK);
    qlLegend(ctx, 392, 118, QL_ROSE, `a^2 = ${a * a}`, 1);
    qlLegend(ctx, 392, 178, QL_MUSTARD, `ab = ${a * b}`, 2);
    qlLegend(ctx, 392, 238, QL_TEAL, `b^2 = ${b * b}`, 1);

    const rows = [
      { name: '① 一整塊算', hint: '邊長 a + b', items: [qlInk(`(${a} + ${b})^2 = ${s}^2 = ${s2}`, INK)] },
      { name: '② 四塊加起來', hint: 'a² + ab + ab + b²',
        items: [qlInk(`${a * a} + ${a * b} + ${a * b} + ${b * b} = ${s2}`, INK)] },
      { name: '③ 和的平方', hint: '兩塊 ab 合成 2ab',
        items: [qlInk('(a + b)^2 = a^2 + 2ab + b^2', QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 3, { top: 372, gap: 52, labX: 22, eqX: 172, size: 19, color: C });
    textCenter(ctx, `只算 a² + b² = ${a * a + b * b}，就少了兩塊 ab = ${2 * a * b}`, 270, 520, QL_ROSE, f(700, 14.5));

    out.innerHTML = wbrEq(qlTex(`(${a} + ${b})^2 = ${a * a} + 2×${a * b} + ${b * b} = ${s2}`));
    fb.innerHTML = wrapFeedback(`大正方形 \\(${s}^2 = ${s2}\\)，拆成 \\(${a * a}\\)、兩塊 \\(${a * b}\\)、\\(${b * b}\\)，`
      + `加起來也是 \\(${s2}\\)。<b style="color:${C}">中間那兩塊 \\(ab\\) 千萬別漏掉。</b>`);
  }

  function drawNum() {
    const n = parseInt(nS.value, 10);
    nV.textContent = n;
    const A = split === 'round' ? 200 : 190;
    const B = n - A;
    const n2 = n * n;
    const u = SIDE / n;
    drawTitle(ctx, `用和的平方公式算 ${n}²`, C);
    qlSumSquare(ctx, X0, Y0, u, A, B, { grid: false, aa: [`${A}^2`], ab: [`${A}×${B}`], bb: [`${B}^2`] });
    qlDimPairH(ctx, X0, X0 + A * u, X0 + n * u, Y0 - 14, `${A}`, `${B}`, INK, INK);
    qlDimPairV(ctx, Y0, Y0 + A * u, Y0 + n * u, X0 - 14, `${A}`, `${B}`, INK, INK);
    qlLegend(ctx, 392, 118, QL_ROSE, `${A}^2 = ${A * A}`, 1);
    qlLegend(ctx, 392, 178, QL_MUSTARD, `${A}×${B} = ${A * B}`, 2);
    qlLegend(ctx, 392, 238, QL_TEAL, `${B}^2 = ${B * B}`, 1);

    const rows = [
      { name: '① 拆數', hint: split === 'round' ? '整百 + 小數字' : '換一種拆法', items: [qlInk(`${n} = ${A} + ${B}`, INK)] },
      { name: '② 套公式', hint: `a = ${A}、b = ${B}`,
        items: [qlInk(`${n}^2 = ${A}^2 + 2×${A}×${B} + ${B}^2`, INK)] },
      { name: '③ 算每一項', hint: '', items: [qlInk(`= ${A * A} + ${2 * A * B} + ${B * B}`, INK)] },
      { name: '④ 加起來', hint: '', items: [qlInk(`= ${n2}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 362, gap: 42, labX: 22, eqX: 160, size: 19, color: C });
    textCenter(ctx, split === 'round' ? '200² 一下就算得出來，另外兩項也只是乘個位數'
      : `答案一樣，但 190² 和 2 × 190 × ${B} 都比較難算`, 270, 528, split === 'round' ? OK_COLOR : QL_ROSE, f(700, 14.5));

    out.innerHTML = wbrEq(qlTex(`${n}^2 = ${A}^2 + 2×${A}×${B} + ${B}^2 = ${n2}`));
    fb.innerHTML = wrapFeedback(split === 'round'
      ? `拆成 \\(${A} + ${B}\\)，三項是 \\(${A * A}\\)、\\(${2 * A * B}\\)、\\(${B * B}\\)，<b style="color:${C}">每一項都好算</b>。按「\\(190 + (r + 10)\\)」比較另一種拆法。`
      : `拆成 \\(${A} + ${B}\\) 也得到 \\(${n2}\\)：<b style="color:${C}">怎麼拆答案都一樣</b>，只是 \\(${A}^2 = ${A * A}\\) 比 \\(200^2\\) 難算得多。`);
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'area') drawArea();
    else drawNum();
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-su-mode', v => { mode = v; loadMode(); draw(); });
  bindPickGroup(splitG, 'data-su-split', v => { split = v; draw(); });
  [aS, bS, nS].forEach(s => s.addEventListener('input', draw));
  loadMode();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 4：裁邊工作台——(a - b)² = a² - 2ab + b²
   大正方形 a 沿上邊與右邊各剪一條 a × b，兩條在右上角重疊一塊 b²
   ========================================================================== */

// step：1 整塊、2 剪上面、3 再剪右邊（角落被剪兩次）、4 加回角落
function qlTrimSquare(ctx, x0, y0, u, A, B, step, lab) {
  const a = A * u, b = B * u, r = (A - B) * u;
  ctx.save();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, a, a);
  ctx.restore();
  if (step === 1) {
    qlPatch(ctx, x0, y0, a, a, QL_ROSE);
    if (lab.grid) qlGrid(ctx, x0, y0, a, a, u);
    qlLabel(ctx, x0, y0, a, a, lab.aa, QL_CREAM, 18);
    return;
  }
  if (step === 2) {
    qlPatch(ctx, x0, y0 + b, a, r, QL_ROSE);
    qlCut(ctx, x0, y0, a, b);
    if (lab.grid) qlGrid(ctx, x0, y0, a, a, u);
    qlLabel(ctx, x0, y0, a, b, ['剪掉 ab', 'ab'], QL_CUT);
    return;
  }
  qlPatch(ctx, x0, y0 + b, r, r, QL_ROSE);
  qlCut(ctx, x0, y0, r, b);
  qlCut(ctx, x0 + r, y0 + b, b, r);
  if (step === 3) {
    qlCut(ctx, x0 + r, y0, b, b, 0.42);
  } else {
    qlPatch(ctx, x0 + r, y0, b, b, QL_TEAL, { alpha: 0.4 });
  }
  if (lab.grid) qlGrid(ctx, x0, y0, a, a, u);
  qlLabel(ctx, x0, y0 + b, r, r, lab.rr, QL_CREAM, 17);
  qlLabel(ctx, x0, y0, r, b, ['剪掉', ''], QL_CUT, 13);
  qlLabel(ctx, x0 + r, y0, b, b, step === 3 ? ['×2'] : ['b^2'], step === 3 ? QL_CREAM : QL_CREAM, 13);
}

function initDiffCanvas() {
  const cv = document.getElementById('canvas-diff');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('df-mode-group');
  const splitG = document.getElementById('df-split-group');
  const splitRow = document.getElementById('df-split-row');
  const aRow = document.getElementById('df-a-row');
  const bRow = document.getElementById('df-b-row');
  const stepRow = document.getElementById('df-step-row');
  const nRow = document.getElementById('df-n-row');
  const aS = document.getElementById('df-a');
  const bS = document.getElementById('df-b');
  const stS = document.getElementById('df-step');
  const nS = document.getElementById('df-n');
  const aV = document.getElementById('df-av');
  const bV = document.getElementById('df-bv');
  const stV = document.getElementById('df-stepv');
  const nV = document.getElementById('df-nv');
  const out = document.getElementById('df-formula');
  const fb = document.getElementById('df-feedback');
  const C = QL_TONE[3];
  let mode = 'area', split = 'round';

  const X0 = 130, Y0 = 100, SIDE = 226;

  function loadMode() {
    const num = (mode === 'num');
    aRow.hidden = num;
    bRow.hidden = num;
    stepRow.hidden = num;
    nRow.hidden = !num;
    splitRow.hidden = !num;
  }

  // b 一定比 a 小，剪完才剩得下正方形（開發約束 27）
  function clampB() {
    const a = parseInt(aS.value, 10);
    bS.max = a - 1;
    if (parseInt(bS.value, 10) > a - 1) bS.value = a - 1;
  }

  function dims(u, A, B, la, lb, lr) {
    const r = (A - B) * u;
    qlDimPairH(ctx, X0, X0 + r, X0 + A * u, Y0 - 14, lr, lb, INK, INK);
    qlDimPairV(ctx, Y0, Y0 + B * u, Y0 + A * u, X0 - 14, lb, lr, INK, INK);
    qlDimV(ctx, Y0, Y0 + A * u, X0 + A * u + 14, la, INK, { right: true });
  }

  function drawArea() {
    const a = parseInt(aS.value, 10), b = parseInt(bS.value, 10), step = parseInt(stS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    stV.textContent = step;
    const u = Math.min(28, SIDE / a);
    const a2 = a * a, ab = a * b, b2 = b * b;
    const TITLES = ['', '邊長 a 的大正方形', '先剪掉上面一條 a × b', '再剪掉右邊一條：角落被剪了兩次', '角落多剪了一次，補回 b²'];
    drawTitle(ctx, TITLES[step], C);
    qlTrimSquare(ctx, X0, Y0, u, a, b, step, { grid: true, aa: ['a^2'], rr: ['(a - b)^2'] });
    dims(u, a, b, `a = ${a}`, `b = ${b}`, `a - b = ${a - b}`);

    const rows = [
      { name: '① 大正方形', hint: '還沒剪', items: [qlInk(`a^2 = ${a2}`, INK)] },
      { name: '② 剪上面一條', hint: '長 a、寬 b', items: [qlInk(`a^2 - ab = ${a2} - ${ab} = ${a2 - ab}`, INK)] },
      { name: '③ 再剪右邊一條', hint: '角落 b² 被減了兩次', items: [qlInk(`a^2 - 2ab = ${a2} - ${2 * ab} = ${a2 - 2 * ab}`, INK)] },
      { name: '④ 加回角落', hint: '只該減一次', items: [qlInk(`a^2 - 2ab + b^2 = ${a2 - 2 * ab + b2} = ${a - b}^2`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, step, { top: 372, gap: 46, labX: 22, eqX: 172, size: 19, color: C });

    out.innerHTML = wbrEq(qlTex(`(${a} - ${b})^2 = ${a2} - 2×${ab} + ${b2} = ${(a - b) * (a - b)}`));
    let msg;
    if (step === 1) {
      msg = `先看整塊大正方形 \\(a^2 = ${a2}\\)。把「剪裁步驟」往右拉，一條一條剪。`;
    } else if (step === 2) {
      msg = `剪掉上面一條 \\(ab = ${ab}\\)，剩 \\(${a2 - ab}\\)。下一步再剪右邊那一條。`;
    } else if (step === 3) {
      msg = (a2 - 2 * ab < 0
        ? `兩條都減掉之後竟然是 \\(${a2 - 2 * ab}\\)——因為右上角的 \\(b^2\\) 被減了兩次，多減的那一次要補回來。`
        : `兩條都剪掉，算出 \\(${a2 - 2 * ab}\\)。可是右上角的 \\(b^2\\) 屬於兩條長條，<b style="color:${C}">被減了兩次</b>。`);
    } else {
      msg = `補回多減的 \\(b^2 = ${b2}\\)：\\(${a2} - ${2 * ab} + ${b2} = ${(a - b) * (a - b)}\\)，正好是剩下的正方形 \\(${a - b}^2\\)。`
        + `所以 ${wbrEq('(a - b)^2 = a^2 - 2ab + b^2')}`;
    }
    fb.innerHTML = wrapFeedback(msg);
  }

  function drawNum() {
    const n = parseInt(nS.value, 10);
    nV.textContent = n;
    const A = split === 'round' ? 200 : 210;
    const B = A - n;
    const n2 = n * n;
    const u = SIDE / A;
    drawTitle(ctx, `用差的平方公式算 ${n}²`, C);
    qlTrimSquare(ctx, X0, Y0, u, A, B, 4, { grid: false, aa: [], rr: [`${n}^2`] });
    dims(u, A, B, `${A}`, `${B}`, `${n}`);

    const rows = [
      { name: '① 拆數', hint: split === 'round' ? '整百 − 小數字' : '換一種拆法', items: [qlInk(`${n} = ${A} - ${B}`, INK)] },
      { name: '② 套公式', hint: `a = ${A}、b = ${B}`, items: [qlInk(`${n}^2 = ${A}^2 - 2×${A}×${B} + ${B}^2`, INK)] },
      { name: '③ 算每一項', hint: '', items: [qlInk(`= ${A * A} - ${2 * A * B} + ${B * B}`, INK)] },
      { name: '④ 加減起來', hint: '', items: [qlInk(`= ${n2}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 372, gap: 46, labX: 22, eqX: 160, size: 19, color: C });

    out.innerHTML = wbrEq(qlTex(`${n}^2 = ${A}^2 - 2×${A}×${B} + ${B}^2 = ${n2}`));
    fb.innerHTML = wrapFeedback(split === 'round'
      ? `拆成 \\(${A} - ${B}\\)：${wbrEq(`${A * A} - ${2 * A * B} + ${B * B} = ${n2}`)}。<b style="color:${C}">最後一項是加</b>，因為角落被剪了兩次。`
      : `拆成 \\(${A} - ${B}\\) 也得到 \\(${n2}\\)，但 \\(${A}^2\\) 與 \\(2 \\times ${A} \\times ${B}\\) 都比較難算，靠近整百就拆整百。`);
  }

  function draw() {
    clampB();
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'area') drawArea();
    else drawNum();
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-df-mode', v => { mode = v; loadMode(); draw(); });
  bindPickGroup(splitG, 'data-df-split', v => { split = v; draw(); });
  [aS, bS, stS, nS].forEach(s => s.addEventListener('input', draw));
  loadMode();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 5：剪拼重組台——(a + b)(a - b) = a² - b²
   剪掉右上角的 b²；甲是下面那一整條（寬 a、高 a - b），乙是左上那一塊
   （寬 a - b、高 b），乙轉 90° 接到甲的右邊，拼成 (a + b) × (a - b)
   ========================================================================== */
function qlDsqFigure(ctx, x0, y0, u, A, B, t, lab) {
  const r = (A - B) * u, b = B * u, a = A * u;
  const e = t * t * (3 - 2 * t);   // smoothstep，動得比較自然
  // 原本大正方形的位置（虛線）
  ctx.save();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x0, y0, a, a);
  ctx.restore();
  qlCut(ctx, x0 + r, y0, b, b);
  qlLabel(ctx, x0 + r, y0, b, b, lab.cut, QL_CUT, 13);
  // 甲：不動
  qlPatch(ctx, x0, y0 + b, a, r, QL_ROSE);
  if (lab.grid) qlGrid(ctx, x0, y0 + b, a, r, u);
  qlLabel(ctx, x0, y0 + b, a, r, lab.jia, QL_CREAM, 16);
  // 乙：平移並轉 90°
  const c0x = x0 + r / 2, c0y = y0 + b / 2;
  const c1x = x0 + a + b / 2, c1y = y0 + b + r / 2;
  const cx = c0x + (c1x - c0x) * e, cy = c0y + (c1y - c0y) * e;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 2 * e);
  qlPatch(ctx, -r / 2, -b / 2, r, b, QL_MUSTARD);
  if (lab.grid) qlGrid(ctx, -r / 2, -b / 2, r, b, u);
  ctx.restore();
  const yiW = e > 0.5 ? b : r, yiH = e > 0.5 ? r : b;
  qlLabel(ctx, cx - yiW / 2, cy - yiH / 2, yiW, yiH, lab.yi, QL_CREAM, 16);
}

function initDsqCanvas() {
  const cv = document.getElementById('canvas-dsq');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('ds-mode-group');
  const baseG = document.getElementById('ds-base-group');
  const baseRow = document.getElementById('ds-base-row');
  const aRow = document.getElementById('ds-a-row');
  const bRow = document.getElementById('ds-b-row');
  const tRow = document.getElementById('ds-t-row');
  const rRow = document.getElementById('ds-r-row');
  const aS = document.getElementById('ds-a');
  const bS = document.getElementById('ds-b');
  const tS = document.getElementById('ds-t');
  const rS = document.getElementById('ds-r');
  const aV = document.getElementById('ds-av');
  const bV = document.getElementById('ds-bv');
  const tV = document.getElementById('ds-tv');
  const rV = document.getElementById('ds-rv');
  const out = document.getElementById('ds-formula');
  const fb = document.getElementById('ds-feedback');
  const C = QL_TONE[4];
  let mode = 'area', base = 200;

  const X0 = 110, Y0 = 96;

  function loadMode() {
    const num = (mode === 'num');
    aRow.hidden = num;
    bRow.hidden = num;
    tRow.hidden = num;
    rRow.hidden = !num;
    baseRow.hidden = !num;
  }

  function clampB() {
    const a = parseInt(aS.value, 10);
    bS.max = a - 1;
    if (parseInt(bS.value, 10) > a - 1) bS.value = a - 1;
  }

  // 尺寸標示：t = 0 標原本的正方形，t = 1 標拼好的長方形
  function dims(u, A, B, t, la, lb, lr, ls) {
    const r = (A - B) * u;
    if (t === 0) {
      qlDimPairH(ctx, X0, X0 + r, X0 + A * u, Y0 - 14, lr, lb, INK, INK);
      qlDimPairV(ctx, Y0, Y0 + B * u, Y0 + A * u, X0 - 14, lb, lr, INK, INK);
      qlDimH(ctx, X0, X0 + A * u, Y0 + A * u + 14, la, INK, { below: true });
    } else if (t === 1) {
      qlDimH(ctx, X0, X0 + (A + B) * u, Y0 + A * u + 14, ls, QL_MUSTARD, { below: true });
      qlDimV(ctx, Y0 + B * u, Y0 + A * u, X0 - 14, lr, QL_MUSTARD);
    }
  }

  function drawArea() {
    const a = parseInt(aS.value, 10), b = parseInt(bS.value, 10), tp = parseInt(tS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    tV.textContent = tp;
    const t = tp / 100;
    const u = Math.min(24, 380 / (a + b), 210 / a);
    const a2 = a * a, b2 = b * b, res = a2 - b2;
    drawTitle(ctx, tp === 0 ? '大正方形剪掉角落的 b²' : (tp < 100 ? '乙塊轉過去……' : '拼成長 a + b、寬 a − b 的長方形'), C);
    qlDsqFigure(ctx, X0, Y0, u, a, b, t, { grid: true, cut: ['b^2', ''], jia: ['甲'], yi: ['乙'] });
    dims(u, a, b, tp === 0 ? 0 : (tp === 100 ? 1 : 0.5), `a = ${a}`, `b = ${b}`, `a - b = ${a - b}`, `a + b = ${a + b}`);

    const rows = [
      { name: '① 剪掉一角', hint: '大正方形 − 小正方形', items: [qlInk(`a^2 - b^2 = ${a2} - ${b2} = ${res}`, INK)] },
      { name: '② 拼成長方形', hint: '長 a + b、寬 a − b', items: [qlInk(`(a + b)(a - b) = ${a + b}×${a - b} = ${res}`, INK)] },
      { name: '③ 平方差公式', hint: '面積沒有變', items: [qlInk('(a + b)(a - b) = a^2 - b^2', QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, tp === 100 ? 3 : 1, { top: 380, gap: 50, labX: 22, eqX: 172, size: 19, color: C });
    if (tp < 100) {
      textCenter(ctx, '把「重組進度」拉到 100%，看乙塊轉過去接在甲的右邊', 270, 470, MUTED, f(700, 14));
    }

    out.innerHTML = wbrEq(qlTex(`(${a} + ${b})(${a} - ${b}) = ${a}^2 - ${b}^2 = ${res}`));
    fb.innerHTML = wrapFeedback(tp === 100
      ? `剪剩的 \\(${a2} - ${b2} = ${res}\\)，拼成的長方形 \\(${a + b} \\times ${a - b} = ${res}\\)，<b style="color:${C}">面積一樣</b>：${wbrEq('(a + b)(a - b) = a^2 - b^2')}`
      : `剪掉角落之後剩下 \\(a^2 - b^2 = ${res}\\)。乙塊的長是 \\(a - b\\)，剛好等於甲的高，轉過去才接得上。`);
  }

  function drawNum() {
    const r = parseInt(rS.value, 10);
    rV.textContent = r;
    const A = base;
    const p = A + r, q = A - r, res = p * q;
    const u = Math.min(380 / (A + r), 210 / A);
    drawTitle(ctx, `用平方差公式算 ${p} × ${q}`, C);
    qlDsqFigure(ctx, X0, Y0, u, A, r, 1, { grid: false, cut: [''], jia: [`${A}×${q}`, ''], yi: [''] });
    dims(u, A, r, 1, '', '', `${q}`, `${p}`);

    const rows = [
      { name: '① 找中間數', hint: `一個多 ${r}、一個少 ${r}`, items: [qlInk(`${p}×${q} = (${A} + ${r})(${A} - ${r})`, INK)] },
      { name: '② 套公式', hint: `a = ${A}、b = ${r}`, items: [qlInk(`= ${A}^2 - ${r}^2`, INK)] },
      { name: '③ 算每一項', hint: '', items: [qlInk(`= ${A * A} - ${r * r}`, INK)] },
      { name: '④ 減起來', hint: '', items: [qlInk(`= ${res}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 372, gap: 44, labX: 22, eqX: 160, size: 19, color: C });

    out.innerHTML = wbrEq(qlTex(`${p}×${q} = ${A}^2 - ${r}^2 = ${res}`));
    fb.innerHTML = wrapFeedback(`\\(${p}\\) 與 \\(${q}\\) 離 \\(${A}\\) 都是 \\(${r}\\)，所以乘積是 \\(${A}^2 - ${r}^2\\)。`
      + `<b style="color:${C}">只要減一個小小的 \\(${r * r}\\)</b>，比直式快得多。`);
  }

  function draw() {
    clampB();
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'area') drawArea();
    else drawNum();
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-ds-mode', v => { mode = v; loadMode(); draw(); });
  bindPickGroup(baseG, 'data-ds-base', v => { base = parseInt(v, 10); draw(); });
  [aS, bS, tS, rS].forEach(s => s.addEventListener('input', draw));
  loadMode();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 6：形狀辨識機——把 a² ± 2ab + b²、a² - b² 收回去
   ========================================================================== */

// 一串元件緊貼排列、整體置中，回傳每個元件的「中心 x」（乘方取底數的中心）
function qlTokens(ctx, items, cx, cy, size) {
  const ws = items.map(it => measure(ctx, it, size).w);
  const total = ws.reduce((s, w) => s + w, 0);
  let x = cx - total / 2;
  const centers = [];
  items.forEach((it, i) => {
    const bw = it.t === 'pow' ? measure(ctx, it.base, size).w : ws[i];
    centers.push(x + bw / 2);
    drawIt(ctx, it, x, cy, size, INK);
    x += ws[i];
  });
  return centers;
}

function initRevCanvas() {
  const cv = document.getElementById('canvas-rev');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('rv-mode-group');
  const pS = document.getElementById('rv-p');
  const qS = document.getElementById('rv-q');
  const pV = document.getElementById('rv-pv');
  const qV = document.getElementById('rv-qv');
  const out = document.getElementById('rv-formula');
  const fb = document.getElementById('rv-feedback');
  const C = QL_TONE[5];
  let mode = 'sum';

  function draw() {
    const p = parseInt(pS.value, 10), q = parseInt(qS.value, 10);
    pV.textContent = p;
    qV.textContent = q;
    const p2 = p * p, q2 = q * q, pq2 = 2 * p * q;
    ctx.clearRect(0, 0, cv.width, cv.height);

    const P = c => T(String(c), QL_ROSE), Q = c => T(String(c), QL_TEAL);
    const A = IT('a', QL_ROSE), B = IT('b', QL_TEAL);
    let title, top, bot, pairs, fold, mid, res, check, roundOf, roundName;
    if (mode === 'dsq') {
      title = '認出 a² − b²，收回成 (a + b)(a − b)';
      top = [PW(P(p), 2, false, QL_ROSE), T(' − ', INK), PW(Q(q), 2, false, QL_TEAL)];
      bot = [PW(A, 2, false, QL_ROSE), T(' − ', INK), PW(B, 2, false, QL_TEAL)];
      pairs = [[0, 0], [2, 2]];
      fold = `(${p} + ${q})(${p} - ${q})`;
      mid = `= ${p + q}×${p - q}`;
      res = (p + q) * (p - q);
      check = `${p2} - ${q2} = ${res}`;
      roundOf = (p + q) % 10 === 0 || (p - q) % 10 === 0;
      roundName = (p + q) % 10 === 0 ? `p + q = ${p + q}` : `p − q = ${p - q}`;
    } else {
      const sg = mode === 'sum' ? '+' : '-';
      const sgC = mode === 'sum' ? '+' : '−';
      title = mode === 'sum' ? '認出 a² + 2ab + b²，收回成 (a + b)²' : '認出 a² − 2ab + b²，收回成 (a − b)²';
      top = [PW(P(p), 2, false, QL_ROSE), T(` ${sgC} 2 × `, INK), P(p), T(' × ', INK), Q(q), T(' + ', INK), PW(Q(q), 2, false, QL_TEAL)];
      bot = [PW(A, 2, false, QL_ROSE), T(` ${sgC} 2`, INK), A, B, T(' + ', INK), PW(B, 2, false, QL_TEAL)];
      pairs = [[0, 0], [2, 2], [4, 3], [6, 5]];
      const inner = mode === 'sum' ? p + q : p - q;
      fold = `(${p} ${sg} ${q})^2`;
      mid = `= ${inner}^2`;
      res = inner * inner;
      check = `${p2} ${sg} ${pq2} + ${q2} = ${res}`;
      roundOf = inner % 10 === 0;
      roundName = mode === 'sum' ? `p + q = ${inner}` : `p − q = ${inner}`;
    }

    drawTitle(ctx, title, C);
    drawPanel(ctx, 18, 52, 504, 58, C, 0.07);
    textLeft(ctx, '題目', 28, 66, MUTED, f(700, 12));
    const xt = qlTokens(ctx, top, 270, 84, 24);
    drawPanel(ctx, 18, 150, 504, 52, MUTED, 0.06);
    textLeft(ctx, '公式', 28, 164, MUTED, f(700, 12));
    const xb = qlTokens(ctx, bot, 270, 178, 22);
    pairs.forEach(([i, j]) => {
      const col = (top[i].color === QL_TEAL || (top[i].base && top[i].base.color === QL_TEAL)) ? QL_TEAL : QL_ROSE;
      drawArrow(ctx, xt[i], 108, xb[j], 154, col, 2);
    });
    drawChip(ctx, 140, 214, 120, 32, `a = ${p}`, QL_ROSE, 'rgba(251, 113, 133, 0.12)');
    drawChip(ctx, 280, 214, 120, 32, `b = ${q}`, QL_TEAL, 'rgba(94, 234, 212, 0.12)');

    const rows = [
      { name: '① 收回去', hint: mode === 'dsq' ? '平方差' : (mode === 'sum' ? '和的平方' : '差的平方'), items: [qlInk(fold, INK)] },
      { name: '② 先算括號', hint: '', items: [qlInk(mid, INK)] },
      { name: '③ 算出來', hint: '', items: [qlInk(`= ${res}`, QL_MUSTARD)], color: QL_MUSTARD },
      { name: '④ 硬算驗證', hint: '每一項都算出來', items: [qlInk(check, MUTED)] }
    ];
    drawStepRows(ctx, rows, 4, { top: 286, gap: 48, labX: 22, eqX: 160, size: 19, color: C });
    textCenter(ctx, roundOf ? `${roundName} 是整十，收回去幾乎不用算` : `${roundName} 不是整十，收回去也對，只是沒那麼省力`,
      270, 496, roundOf ? OK_COLOR : MUTED, f(700, 14.5));

    const expanded = mode === 'dsq' ? `${p}^2 - ${q}^2`
      : `${p}^2 ${mode === 'sum' ? '+' : '-'} 2×${p}×${q} + ${q}^2`;
    out.innerHTML = wbrEq(qlTex(`${expanded} = ${fold} = ${res}`));
    const form = mode === 'dsq' ? 'a^2 - b^2 = (a + b)(a - b)'
      : (mode === 'sum' ? 'a^2 + 2ab + b^2 = (a + b)^2' : 'a^2 - 2ab + b^2 = (a - b)^2');
    fb.innerHTML = wrapFeedback(`頭尾的底數 \\(a = ${p}\\)、\\(b = ${q}\\)，`
      + (mode === 'dsq' ? '兩個平方相減、沒有中間項，' : `中間是 \\(${mode === 'sum' ? '+' : '-'}2ab\\)，`)
      + `照 ${wbrEq(form)} 收回去，得 \\(${res}\\)。`
      + (roundOf ? `<b style="color:${C}">括號裡剛好是整十，所以特別好算。</b>` : '把 \\(p\\)、\\(q\\) 調成括號裡是整十的數，感受一下差別。'));
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-rv-mode', v => { mode = v; draw(); });
  [pS, qS].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 7：錯誤檢查站——代數字比較左右兩邊
   ========================================================================== */
const QL_CLAIMS = {
  c1: { claim: '(a + b)^2 = a^2 + b^2', L: (a, b) => (a + b) * (a + b), R: (a, b) => a * a + b * b,
        Ls: (a, b) => `(${a} + ${b})^2`, Rs: (a, b) => `${a}^2 + ${b}^2`,
        fix: '(a + b)^2 = a^2 + 2ab + b^2', why: '漏掉了中間兩塊 ab' },
  c2: { claim: '(a + b)^2 = a^2 + ab + b^2', L: (a, b) => (a + b) * (a + b), R: (a, b) => a * a + a * b + b * b,
        Ls: (a, b) => `(${a} + ${b})^2`, Rs: (a, b) => `${a}^2 + ${a}×${b} + ${b}^2`,
        fix: '(a + b)^2 = a^2 + 2ab + b^2', why: 'ab 有兩塊，要寫 2ab' },
  c3: { claim: '(a - b)^2 = a^2 - b^2', L: (a, b) => (a - b) * (a - b), R: (a, b) => a * a - b * b,
        Ls: (a, b) => `(${a} - ${b})^2`, Rs: (a, b) => `${a}^2 - ${b}^2`,
        fix: '(a - b)^2 = a^2 - 2ab + b^2', why: '把差的平方當成平方差' },
  c4: { claim: '(a - b)^2 = a^2 - 2ab - b^2', L: (a, b) => (a - b) * (a - b), R: (a, b) => a * a - 2 * a * b - b * b,
        Ls: (a, b) => `(${a} - ${b})^2`, Rs: (a, b) => `${a}^2 - 2×${a}×${b} - ${b}^2`,
        fix: '(a - b)^2 = a^2 - 2ab + b^2', why: '(−b) × (−b) = +b²，最後是加' },
  c5: { claim: '(a + b)(a - b) = a^2 + b^2', L: (a, b) => (a + b) * (a - b), R: (a, b) => a * a + b * b,
        Ls: (a, b) => `(${a} + ${b})(${a} - ${b})`, Rs: (a, b) => `${a}^2 + ${b}^2`,
        fix: '(a + b)(a - b) = a^2 - b^2', why: 'b × (−b) = −b²，最後是減' }
};

function initErrCanvas() {
  const cv = document.getElementById('canvas-err');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const claimG = document.getElementById('er-claim-group');
  const aS = document.getElementById('er-a');
  const bS = document.getElementById('er-b');
  const aV = document.getElementById('er-av');
  const bV = document.getElementById('er-bv');
  const out = document.getElementById('er-formula');
  const fb = document.getElementById('er-feedback');
  const C = QL_TONE[6];
  let key = 'c1';

  function bar(y, v, zero, scale, color, name) {
    textLeft(ctx, name, 22, y, INK, f(800, 14));
    const len = v * scale;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    const x = len >= 0 ? zero : zero + len;
    ctx.fillRect(x, y - 14, Math.abs(len), 28);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y - 14, Math.abs(len), 28);
    ctx.restore();
    const tx = len >= 0 ? zero + len + 8 : zero + len - 8;
    ctx.save();
    ctx.font = f(800, 16);
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = len >= 0 ? 'left' : 'right';
    ctx.fillText(v < 0 ? `−${-v}` : String(v), tx, y);
    ctx.restore();
  }

  function draw() {
    const a = parseInt(aS.value, 10), b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    const K = QL_CLAIMS[key];
    const L = K.L(a, b), R = K.R(a, b);
    const same = (L === R);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '錯誤檢查站：這個等式對不對？', C);
    drawEqPanel(ctx, [qlInk(K.claim, QL_CREAM)], 78, C, { h: 26, size: 24 });

    textLeft(ctx, `代入 a = ${a}、b = ${b}`, 22, 128, MUTED, f(700, 13));
    textLeft(ctx, '左邊', 22, 158, QL_ROSE, f(800, 14));
    drawExpr(ctx, [qlInk(`${K.Ls(a, b)} = ${L}`, INK)], 0, 158, 19, INK, { left: 80, maxW: 440 });
    textLeft(ctx, '右邊', 22, 194, QL_TEAL, f(800, 14));
    drawExpr(ctx, [qlInk(`${K.Rs(a, b)} = ${R}`, INK)], 0, 194, 19, INK, { left: 80, maxW: 440 });

    // 長條比較：有負數時零點放中間
    const m = Math.max(Math.abs(L), Math.abs(R), 1);
    const neg = Math.min(L, R) < 0;
    const zero = neg ? 290 : 90;
    const scale = (neg ? 180 : 360) / m;
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.beginPath();
    ctx.moveTo(zero, 226);
    ctx.lineTo(zero, 314);
    ctx.stroke();
    ctx.restore();
    textCenter(ctx, '0', zero, 322, MUTED, f(700, 11));
    bar(248, L, zero, scale, QL_ROSE, '左邊');
    bar(292, R, zero, scale, QL_TEAL, '右邊');

    drawChip(ctx, 140, 334, 260, 36, same ? '這組數字剛好相等' : `不相等！差了 ${Math.abs(L - R)}`,
      same ? QL_MUSTARD : NO_COLOR, same ? 'rgba(252, 211, 77, 0.12)' : 'rgba(251, 113, 133, 0.12)');

    textLeft(ctx, '正確寫法', 22, 404, OK_COLOR, f(800, 14));
    drawExpr(ctx, [qlInk(K.fix, OK_COLOR)], 0, 404, 19, OK_COLOR, { left: 110, maxW: 410 });
    textLeft(ctx, '錯在哪', 22, 446, QL_ROSE, f(800, 14));
    textLeft(ctx, K.why, 110, 446, INK, f(700, 15));
    textCenter(ctx, same ? '剛好相等不算數：公式必須「每一組數字」都成立' : '只要找到一組數字不相等，這個等式就不是公式',
      270, 494, same ? QL_MUSTARD : MUTED, f(700, 14));

    out.innerHTML = wbrEq(qlTex(`${K.Ls(a, b)} = ${L}`)) + '，' + wbrEq(qlTex(`${K.Rs(a, b)} = ${R}`));
    fb.innerHTML = wrapFeedback(same
      ? `\\(a = ${a}\\)、\\(b = ${b}\\) 剛好讓兩邊都是 \\(${L}\\)，<b style="color:${C}">但這不代表等式是對的</b>。換一組 \\(a\\)、\\(b\\) 試試，只要有一組不相等，它就不是公式。`
      : `左邊 \\(${L}\\)、右邊 \\(${R}\\)，<b style="color:${C}">不相等</b>，所以這個等式是錯的。錯在：${K.why}。正確的是 ${wbrEq(K.fix)}`);
    typeset([out, fb]);
  }

  bindPickGroup(claimG, 'data-er-claim', v => { key = v; draw(); });
  [aS, bS].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 8：拼布面積計算台——外加 L 形、內扣 L 形、兩個正方形之間
   ========================================================================== */
function initAppCanvas() {
  const cv = document.getElementById('canvas-app');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('ap-mode-group');
  const sS = document.getElementById('ap-s');
  const wS = document.getElementById('ap-w');
  const qS = document.getElementById('ap-q');
  const sV = document.getElementById('ap-sv');
  const wV = document.getElementById('ap-wv');
  const qV = document.getElementById('ap-qv');
  const sN = document.getElementById('ap-sn');
  const wN = document.getElementById('ap-wn');
  const wRow = document.getElementById('ap-w-row');
  const qRow = document.getElementById('ap-q-row');
  const out = document.getElementById('ap-formula');
  const fb = document.getElementById('ap-feedback');
  const C = QL_TONE[7];
  let mode = 'add';

  const X0 = 110, Y0 = 86, SIDE = 200;
  const NAMES = {
    add: ['桌墊邊長（公分）', '拼布寬（公分）'],
    cut: ['土地邊長（公尺）', '道路寬（公分）'],
    ring: ['大正方形邊長（公分）', '']
  };

  function loadMode() {
    sN.textContent = NAMES[mode][0];
    wN.textContent = NAMES[mode][1];
    wRow.hidden = (mode === 'ring');
    qRow.hidden = (mode !== 'ring');
  }

  // 小正方形一定比大正方形小（開發約束 27）
  function clampQ() {
    const p = parseInt(sS.value, 10);
    qS.max = p - 1;
    if (parseInt(qS.value, 10) > p - 1) qS.value = p - 1;
  }

  function legend(y, color, text) {
    qlPatch(ctx, 392, y - 9, 18, 18, color, { stitch: false, alpha: 0.45 });
    textLeft(ctx, text, 418, y, INK, f(700, 14));
  }

  function drawAdd(s, w) {
    const T2 = s + w, u = SIDE / T2;
    const tot = T2 * T2, sw2 = 2 * s * w, w2 = w * w;
    drawTitle(ctx, '桌墊外面加一條 L 形拼布，總面積是多少？', C);
    qlPatch(ctx, X0, Y0 + w * u, s * u, s * u, QL_ROSE);
    qlPatch(ctx, X0, Y0, T2 * u, w * u, QL_MUSTARD, { stitch: false });
    qlPatch(ctx, X0 + s * u, Y0 + w * u, w * u, s * u, QL_MUSTARD, { stitch: false });
    qlLabel(ctx, X0, Y0 + w * u, s * u, s * u, ['桌墊'], QL_CREAM, 17);
    qlDimPairH(ctx, X0, X0 + s * u, X0 + T2 * u, Y0 + T2 * u + 14, `${s}`, `${numStr(w)}`, INK, QL_MUSTARD, { below: true });
    qlDimPairV(ctx, Y0, Y0 + w * u, Y0 + T2 * u, X0 - 14, `${numStr(w)}`, `${s}`, QL_MUSTARD, INK);
    legend(126, QL_ROSE, '桌墊（正方形）');
    legend(162, QL_MUSTARD, 'L 形拼布');

    const rows = [
      { name: '① 看形狀', hint: '加完還是正方形', items: [qlInk(`邊長 = ${s} + ${numStr(w)} = ${numStr(T2)}`, INK)] },
      { name: '② 和的平方', hint: `a = ${s}、b = ${numStr(w)}`, items: [qlInk(`(${s} + ${numStr(w)})^2 = ${s}^2 + 2×${s}×${numStr(w)} + ${numStr(w)}^2`, INK)] },
      { name: '③ 算每一項', hint: '', items: [qlInk(`= ${s * s} + ${numStr(sw2)} + ${numStr(w2)}`, INK)] },
      { name: '④ 總面積', hint: '單位：平方公分', items: [qlInk(`= ${numStr(tot)}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 368, gap: 44, labX: 22, eqX: 160, size: 18, color: C });

    out.innerHTML = wbrEq(qlTex(`(${s} + ${numStr(w)})^2 = ${s * s} + ${numStr(sw2)} + ${numStr(w2)} = ${numStr(tot)}`)) + ' 平方公分';
    fb.innerHTML = wrapFeedback(`加了拼布仍是邊長 \\(${numStr(T2)}\\) 的正方形，總面積 \\(${numStr(tot)}\\) 平方公分。`
      + `其中 L 形拼布本身是 \\(${numStr(sw2)} + ${numStr(w2)} = ${numStr(sw2 + w2)}\\) 平方公分，<b style="color:${C}">就是公式裡的 \\(2ab + b^2\\)</b>。`);
  }

  function drawCut(s, wcm) {
    const w = wcm / 100;
    const u = SIDE / s, r = s - w;
    const res = r * r, sw2 = 2 * s * w, w2 = w * w;
    drawTitle(ctx, '土地裡開一條 L 形道路，剩下的面積是多少？', C);
    qlPatch(ctx, X0, Y0 + w * u, r * u, r * u, '#6ee7b7');
    qlPatch(ctx, X0, Y0, s * u, w * u, QL_ROAD, { stitch: false, alpha: 0.45 });
    qlPatch(ctx, X0 + r * u, Y0 + w * u, w * u, r * u, QL_ROAD, { stitch: false, alpha: 0.45 });
    qlLabel(ctx, X0, Y0 + w * u, r * u, r * u, ['剩下的土地'], QL_CREAM, 16);
    qlDimH(ctx, X0, X0 + s * u, Y0 - 14, `${s} 公尺`, INK);
    qlDimPairH(ctx, X0, X0 + r * u, X0 + s * u, Y0 + s * u + 14, `${numStr(r)}`, `${numStr(w)}`, '#6ee7b7', QL_ROAD, { below: true });
    qlDimV(ctx, Y0, Y0 + s * u, X0 - 14, `${s}`, INK);
    legend(126, '#6ee7b7', '剩下的土地');
    legend(162, QL_ROAD, 'L 形道路');

    const rows = [
      { name: '① 換單位', hint: '道路寬換成公尺', items: [qlInk(`${wcm} 公分 = ${numStr(w)} 公尺`, INK)] },
      { name: '② 差的平方', hint: `a = ${s}、b = ${numStr(w)}`, items: [qlInk(`(${s} - ${numStr(w)})^2 = ${s}^2 - 2×${s}×${numStr(w)} + ${numStr(w)}^2`, INK)] },
      { name: '③ 算每一項', hint: '', items: [qlInk(`= ${s * s} - ${numStr(sw2)} + ${numStr(w2)}`, INK)] },
      { name: '④ 剩下的面積', hint: '單位：平方公尺', items: [qlInk(`= ${numStr(res)}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 368, gap: 44, labX: 22, eqX: 160, size: 18, color: C });

    out.innerHTML = wbrEq(qlTex(`(${s} - ${numStr(w)})^2 = ${s * s} - ${numStr(sw2)} + ${numStr(w2)} = ${numStr(res)}`)) + ' 平方公尺';
    fb.innerHTML = wrapFeedback(`<b style="color:${C}">單位先統一</b>：\\(${wcm}\\) 公分 \\(= ${numStr(w)}\\) 公尺。`
      + `剩下的土地是邊長 \\(${numStr(r)}\\) 的正方形，面積 \\(${numStr(res)}\\) 平方公尺。`);
  }

  function drawRing(p, q) {
    const u = SIDE / p, off = (p - q) / 2 * u;
    const res = p * p - q * q;
    drawTitle(ctx, '兩個正方形之間的區域，面積是多少？', C);
    qlPatch(ctx, X0, Y0, p * u, p * u, QL_ROSE, { alpha: 0.32 });
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(X0 + off, Y0 + off, q * u, q * u);
    ctx.restore();
    qlPatch(ctx, X0 + off, Y0 + off, q * u, q * u, QL_DENIM, { alpha: 0.22 });
    qlLabel(ctx, X0 + off, Y0 + off, q * u, q * u, ['小正方形', ''], QL_DENIM, 14);
    qlDimH(ctx, X0, X0 + p * u, Y0 - 14, `${p}`, INK);
    qlDimH(ctx, X0 + off, X0 + off + q * u, Y0 + p * u + 14, `${q}`, QL_DENIM, { below: true });
    legend(126, QL_ROSE, '中間的區域');
    legend(162, QL_DENIM, '小正方形');

    const rows = [
      { name: '① 列式', hint: '大正方形 − 小正方形', items: [qlInk(`${p}^2 - ${q}^2`, INK)] },
      { name: '② 平方差', hint: `a = ${p}、b = ${q}`, items: [qlInk(`= (${p} + ${q})(${p} - ${q})`, INK)] },
      { name: '③ 先算括號', hint: '', items: [qlInk(`= ${p + q}×${p - q}`, INK)] },
      { name: '④ 面積', hint: '單位：平方公分', items: [qlInk(`= ${res}`, QL_MUSTARD)], color: QL_MUSTARD }
    ];
    drawStepRows(ctx, rows, 4, { top: 368, gap: 44, labX: 22, eqX: 160, size: 18, color: C });

    out.innerHTML = wbrEq(qlTex(`${p}^2 - ${q}^2 = (${p} + ${q})(${p} - ${q}) = ${res}`)) + ' 平方公分';
    fb.innerHTML = wrapFeedback(`直接算 \\(${p * p} - ${q * q}\\) 也可以；用平方差寫成 \\(${p + q} \\times ${p - q}\\)，`
      + `<b style="color:${C}">數字越大越省力</b>。不論小正方形放在哪裡，中間區域的面積都一樣。`);
  }

  function draw() {
    clampQ();
    const s = parseInt(sS.value, 10), wv = parseInt(wS.value, 10), q = parseInt(qS.value, 10);
    sV.textContent = s;
    wV.textContent = mode === 'cut' ? wv * 50 : numStr(wv / 2);
    qV.textContent = q;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (mode === 'add') drawAdd(s, wv / 2);
    else if (mode === 'cut') drawCut(s, wv * 50);
    else drawRing(s, q);
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-ap-mode', v => { mode = v; loadMode(); draw(); });
  [sS, wS, qS].forEach(s => s.addEventListener('input', draw));
  loadMode();
  drawWithFonts(draw);
}

/* ==========================================================================
   重點 9：規律觀察表——先化簡，再代數字
   ========================================================================== */
function initSubCanvas() {
  const cv = document.getElementById('canvas-sub');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const modeG = document.getElementById('sb-mode-group');
  const nS = document.getElementById('sb-n');
  const kS = document.getElementById('sb-k');
  const nV = document.getElementById('sb-nv');
  const kV = document.getElementById('sb-kv');
  const kRow = document.getElementById('sb-k-row');
  const out = document.getElementById('sb-formula');
  const fb = document.getElementById('sb-feedback');
  const C = QL_TONE[8];
  let mode = 'm1';

  // 每一列：[算式, 直接算, 結果]
  function rowOf(m, k) {
    if (mode === 'm1') return [`${m + 1}×${m - 1} - ${m}^2`, `${(m + 1) * (m - 1)} - ${m * m}`, '-1'];
    if (mode === 'p1') return [`${m - 1}×${m + 1} + 1`, `${(m - 1) * (m + 1)} + 1`, `${m * m} = ${m}^2`];
    return [`${m + k}×${m - k} - ${m}^2`, `${(m + k) * (m - k)} - ${m * m}`, `${-k * k}`];
  }

  function draw() {
    const n = parseInt(nS.value, 10), k = parseInt(kS.value, 10);
    nV.textContent = n;
    kV.textContent = k;
    kRow.hidden = (mode !== 'k');
    ctx.clearRect(0, 0, cv.width, cv.height);
    const TITLES = {
      m1: '(n + 1)(n − 1) − n² 會等於多少？',
      p1: '相差 2 的兩數相乘再加 1，會是什麼數？',
      k: '(n + k)(n − k) − n² 會等於多少？'
    };
    drawTitle(ctx, TITLES[mode], C);

    // 表格：n 附近的五個數
    const CX = [62, 212, 362, 470];
    textCenter(ctx, 'n', CX[0], 66, MUTED, fi(800, 15));
    textCenter(ctx, '算式', CX[1], 66, MUTED, f(800, 14));
    textCenter(ctx, '直接算', CX[2], 66, MUTED, f(800, 14));
    textCenter(ctx, '結果', CX[3], 66, MUTED, f(800, 14));
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
    ctx.beginPath();
    ctx.moveTo(24, 82); ctx.lineTo(516, 82);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 5; i++) {
      const m = n - 2 + i;
      const y = 104 + i * 36;
      const cur = (m === n);
      if (cur) drawPanel(ctx, 22, y - 16, 496, 32, C, 0.12);
      const [e, d, r] = rowOf(m, k);
      const col = cur ? QL_CREAM : INK;
      textCenter(ctx, String(m), CX[0], y, col, f(800, 16));
      drawExpr(ctx, [qlInk(e, col)], CX[1], y, 16, col, { maxW: 180 });
      drawExpr(ctx, [qlInk(d, col)], CX[2], y, 16, col, { maxW: 120 });
      drawExpr(ctx, [qlInk(r, QL_MUSTARD)], CX[3], y, 16, QL_MUSTARD, { maxW: 96 });
    }

    let rows, foot;
    if (mode === 'm1') {
      rows = [
        { name: '① 設 a = n', hint: '把中間的數看成 a', items: [qlInk('(a + 1)(a - 1) - a^2', INK)] },
        { name: '② 用平方差', hint: '(a + 1)(a − 1) = a² − 1', items: [qlInk('= a^2 - 1 - a^2', INK)] },
        { name: '③ 化簡', hint: '', items: [qlInk('= -1', QL_MUSTARD)], color: QL_MUSTARD }
      ];
      foot = '不管 a 是多少，結果都是 −1：表格每一列都一樣';
    } else if (mode === 'p1') {
      rows = [
        { name: '① 設 a = n', hint: '兩數是 a − 1 與 a + 1', items: [qlInk('(a - 1)(a + 1) + 1', INK)] },
        { name: '② 用平方差', hint: '', items: [qlInk('= a^2 - 1 + 1', INK)] },
        { name: '③ 化簡', hint: '', items: [qlInk('= a^2', QL_MUSTARD)], color: QL_MUSTARD }
      ];
      foot = '相差 2 的兩數相乘再加 1，就是中間那個數的平方';
    } else {
      rows = [
        { name: '① 設 a = n', hint: `兩數離 a 都是 ${k}`, items: [qlInk(`(a + ${k})(a - ${k}) - a^2`, INK)] },
        { name: '② 用平方差', hint: '', items: [qlInk(`= a^2 - ${k}^2 - a^2`, INK)] },
        { name: '③ 化簡', hint: '', items: [qlInk(`= -${k * k}`, QL_MUSTARD)], color: QL_MUSTARD }
      ];
      foot = `兩數離 a 都是 ${k}，乘積就比 a² 少 ${k}² = ${k * k}`;
    }
    drawStepRows(ctx, rows, 3, { top: 316, gap: 50, labX: 22, eqX: 180, size: 19, color: C });
    textCenter(ctx, foot, 270, 476, OK_COLOR, f(700, 14.5));

    const [e, d, r] = rowOf(n, k);
    out.innerHTML = wbrEq(qlTex(`${e} = ${d} = ${r}`));
    const msg = mode === 'm1'
      ? `表格裡每一列直接算出來都是 \\(-1\\)。化簡之後就知道為什麼：${wbrEq('(a + 1)(a - 1) - a^2 = -1')}，<b style="color:${C}">跟 \\(a\\) 是多少無關</b>。`
      : (mode === 'p1'
        ? `\\(${n - 1} \\times ${n + 1} + 1 = ${n * n} = ${n}^2\\)。化簡：${wbrEq('(a - 1)(a + 1) + 1 = a^2')}，<b style="color:${C}">一定是中間數的平方</b>。`
        : `兩數離 \\(n\\) 都是 \\(${k}\\)，結果都是 \\(-${k}^2 = -${k * k}\\)。<b style="color:${C}">\\(k\\) 越大，乘積比 \\(n^2\\) 少得越多</b>。`);
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(modeG, 'data-sb-mode', v => { mode = v; draw(); });
  [nS, kS].forEach(s => s.addEventListener('input', draw));
  drawWithFonts(draw);
}
