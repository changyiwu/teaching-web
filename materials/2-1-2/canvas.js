document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initPairCanvas();
  initCommonCanvas();
  initSubstCanvas();
  initRearrCanvas();
  initAddSubCanvas();
  initAlignCanvas();
  initStandardCanvas();
  initDenomCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2 / 1-2 (16 Quizzes)
  const answers = {
    '2-1-2-1': 'C',  // 先說筆記本 x 元 → 4x+3y=265、2x+5y=215
    '2-1-2-2': 'A',  // 輛數 x+y=30、輪子 4x+2y=86
    '2-1-2-3': 'B',  // (5,2) 兩式都成立
    '2-1-2-4': 'D',  // 要同時讓兩式等號成立
    '2-1-2-5': 'B',  // y=2x 代入 3x+y=25 → (5,10)
    '2-1-2-6': 'A',  // (4-3x) 要加括號 → (1,1)
    '2-1-2-7': 'C',  // ①式 y 的係數是 1，解 y 最省事
    '2-1-2-8': 'D',  // x=7+3y 代入 → (4,-1)
    '2-1-2-9': 'A',  // y 係數 2 與 -2 互為相反數 → ①＋②
    '2-1-2-10': 'B', // x 係數都是 4（相同）→ 要用 ①－②
    '2-1-2-11': 'C', // ①×2 後與②相減
    '2-1-2-12': 'D', // [2,3]=6 → ①×3、②×2 後相減
    '2-1-2-13': 'B', // 5x-3x-2y=4 → 2x-2y=4
    '2-1-2-14': 'C', // 整理成 2x-y=5、x+y=4 → (3,1)
    '2-1-2-15': 'D', // [3,2]=6，每一項都要乘 → 2x+3y=24
    '2-1-2-16': 'A'  // ×10 得 2x+5y=19 → (2,3)
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
   2. 本節配色（通用繪圖工具在 ../math-canvas.js）
   ========================================================================== */

// 復古車票印刷配色，與 2-1-1 同一套：油墨青、票券米黃、套印洋紅、天青、常數灰藍、警示橘
const C_INK = '#5eead4';
const C_PAPER = '#fcd34d';
const C_MAGENTA = '#f9a8d4';
const C_SKY = '#7dd3fc';
const C_SLATE = '#cbd5e1';
const C_EMBER = '#fdba74';

/* ==========================================================================
   3. 本節專屬繪圖與字串工具
   ========================================================================== */

// 一張復古票根：圓角矩形加一條虛線撕線
function drawTicket(ctx, x, y, w, h, color, opts) {
  const o = opts || {};
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = o.bg || 'rgba(148, 163, 184, 0.14)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 1.8;
  ctx.stroke();
  if (o.perf !== false) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.74, y + 4);
    ctx.lineTo(x + w * 0.74, y + h - 4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// 木製驗票閘門：兩根立柱加一根可抬起的橫桿
function drawGate(ctx, cx, cy, open, color) {
  ctx.save();
  const postW = 12, postH = 66;
  [-48, 48].forEach(dx => {
    roundRect(ctx, cx + dx - postW / 2, cy - postH / 2, postW, postH, 4);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  const ang = open ? -0.5 : 0;
  ctx.translate(cx - 48, cy - 12);
  ctx.rotate(ang);
  roundRect(ctx, 0, -4.5, 96, 9, 4.5);
  ctx.fillStyle = open ? 'rgba(52, 211, 153, 0.30)' : 'rgba(251, 113, 133, 0.25)';
  ctx.fill();
  ctx.strokeStyle = open ? OK_COLOR : NO_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + 78, cy - 16, 8, 0, Math.PI * 2);
  ctx.fillStyle = open ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 113, 133, 0.8)';
  ctx.fill();
  ctx.restore();
}

// 聯立方程式的大括號（左半邊）
function drawBrace(ctx, x, yTop, yBot, color) {
  const h = yBot - yTop, mid = (yTop + yBot) / 2, w = 15;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w, yTop);
  ctx.quadraticCurveTo(x + w * 0.35, yTop, x + w * 0.35, yTop + h * 0.24);
  ctx.quadraticCurveTo(x + w * 0.35, mid - 3, x, mid);
  ctx.quadraticCurveTo(x + w * 0.35, mid + 3, x + w * 0.35, yBot - h * 0.24);
  ctx.quadraticCurveTo(x + w * 0.35, yBot, x + w, yBot);
  ctx.stroke();
  ctx.restore();
}

// 把 ax + by + c 這種項的陣列排成 canvas 算式元件
//   terms: [{ c: 係數, v: 'x' | 'y' | null }]
function termItems(terms, colorOf) {
  const out = [];
  terms.forEach(t => {
    if (t.c === 0 && t.v) return;
    const col = colorOf ? colorOf(t) : C_SLATE;
    const a = Math.abs(t.c);
    let body;
    if (!t.v) body = T(numStr(a), col);
    else if (a === 1) body = IT(t.v, col);
    else body = SEQ([T(numStr(a), col), IT(t.v, col)], col, 1);
    if (out.length) {
      out.push(T(t.c < 0 ? '-' : '+', C_SLATE));
      out.push(body);
    } else {
      // 首項的負號要貼著項，不然 drawExpr 的字距會把它推成「- 2x」
      out.push(t.c < 0 ? SEQ([T('-', col), body], col, 1) : body);
    }
  });
  if (!out.length) out.push(T('0', C_SLATE));
  return out;
}

// 同一組項的字串版本（也給 LaTeX 用）
function termTex(terms) {
  let s = '';
  terms.forEach(t => {
    if (t.c === 0 && t.v) return;
    const a = Math.abs(t.c);
    const body = !t.v ? numStr(a) : (a === 1 ? t.v : numStr(a) + t.v);
    if (!s) s = (t.c < 0 ? '-' : '') + body;
    else s += (t.c < 0 ? ' - ' : ' + ') + body;
  });
  return s || '0';
}

// 一條標準式 ax + by = c 的字串
function eqTex(a, b, c) {
  return termTex([{ c: a, v: 'x' }, { c: b, v: 'y' }]) + ' = ' + numStr(c);
}

// 代入時的數字寫法：負數要加括號
function sub(v) {
  return v < 0 ? `(${v})` : String(v);
}

// 兩式並列的 LaTeX cases 環境（不要餵給 wbrEq，它會把 cases 拆壞）
function casesTex(l1, l2) {
  return `\\(\\begin{cases} ${l1} \\\\ ${l2} \\end{cases}\\)`;
}

// 把一段算式字串轉成 canvas 元件：x、y 走斜體，其餘照原樣
function inkItems(s, color) {
  const parts = [];
  let buf = '';
  for (const ch of String(s)) {
    if (ch === 'x' || ch === 'y') {
      if (buf) { parts.push(T(buf, color)); buf = ''; }
      parts.push(IT(ch, color));
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(T(buf, color));
  return SEQ(parts, color, 1);
}

// 中文沒有空白可斷，逐字量寬度折成幾行
function fitLines(ctx, text, maxW, font) {
  const prev = ctx.font;
  if (font) ctx.font = font;
  const lines = [];
  let cur = '';
  for (const ch of String(text)) {
    const t = cur + ch;
    if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = ch; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  ctx.font = prev;
  return lines;
}

// 逐行推導的固定分欄：左欄步驟名與說明（自動折行），右側算式
//   rows: [{ name, hint, items }]
function drawStepRows(ctx, rows, shown, opts) {
  const o = opts || {};
  // 步驟列數不固定（8 或 9 列），列距由畫布高度自動配，最後一列才不會掉出畫面
  const top = o.top == null ? 56 : o.top;
  const gap = o.gap == null
    ? Math.min(46, (ctx.canvas.height - top - 24) / Math.max(1, rows.length - 1))
    : o.gap;
  const labX = o.labX == null ? 22 : o.labX;
  const eqX = o.eqX == null ? 186 : o.eqX;
  const maxW = o.maxW == null ? ctx.canvas.width - eqX - 20 : o.maxW;
  rows.forEach((r, i) => {
    if (i >= shown) return;
    const cy = top + i * gap;
    const active = (i === shown - 1);
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.62;
    if (active) drawPanel(ctx, 14, cy - gap / 2 + 3, ctx.canvas.width - 28, gap - 6, r.color || C_INK, 0.09);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labW = eqX - labX - 12;
    ctx.fillStyle = r.color || C_INK;
    ctx.font = f(800, 13);
    const hintLines = r.hint ? fitLines(ctx, r.hint, labW, f(600, 11.5)).slice(0, 2) : [];
    ctx.font = f(800, 13);
    ctx.fillText(r.name, labX, hintLines.length === 2 ? cy - 14 : (hintLines.length === 1 ? cy - 9 : cy));
    if (hintLines.length) {
      ctx.fillStyle = MUTED;
      ctx.font = f(600, 11.5);
      const y0 = hintLines.length === 2 ? cy + 1 : cy + 9;
      hintLines.forEach((ln, k) => ctx.fillText(ln, labX, y0 + k * 13));
    }
    drawExpr(ctx, r.items, 0, cy, o.size || 20, r.color || C_SLATE, { left: eqX, maxW: maxW, gap: 6 });
    ctx.restore();
  });
}

/* ==========================================================================
   重點 1：兩張收據列式台
   兩張收據 → 兩條二元一次方程式 → 用大括號夾成聯立方程式
   ========================================================================== */
function initPairCanvas() {
  const canvas = document.getElementById('canvas-pair');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('pr-formula');
  const fb = document.getElementById('pr-feedback');
  const caseGroup = document.getElementById('pr-case-group');
  const roleGroup = document.getElementById('pr-role-group');
  const nS = document.getElementById('pr-n-slider');
  const nV = document.getElementById('pr-n-val');
  const nName = document.getElementById('pr-n-name');

  // 單價一律不畫在畫面上：這一節只列式、不求解
  const CASES = [
    { title: '動物園售票口', a: '全票', b: '優待票', p: 45, q: 25, r1a: 4, r1b: 2, r2b: 1, unit: '張' },
    { title: '早餐店', a: '三明治', b: '奶茶', p: 35, q: 20, r1a: 3, r1b: 4, r2b: 2, unit: '份' },
    { title: '水果攤', a: '蘋果', b: '香蕉', p: 18, q: 12, r1a: 5, r1b: 3, r2b: 4, unit: '個' }
  ];

  let idx = 0, role = 0;

  function state() {
    const c = CASES[idx];
    const n = parseInt(nS.value, 10);
    const t1 = c.p * c.r1a + c.q * c.r1b;
    const t2 = c.p * n + c.q * c.r2b;
    // role 0：x 是第一種商品；role 1：x 是第二種商品
    const e1 = role === 0 ? { a: c.r1a, b: c.r1b } : { a: c.r1b, b: c.r1a };
    const e2 = role === 0 ? { a: n, b: c.r2b } : { a: c.r2b, b: n };
    return { c, n, t1, t2, e1, e2, xName: role === 0 ? c.a : c.b, yName: role === 0 ? c.b : c.a };
  }

  function drawReceipt(s, y, no, na, nb, total) {
    const c = s.c;
    drawPanel(ctx, 24, y, 492, 78, C_PAPER, 0.07);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_PAPER;
    ctx.font = f(800, 14);
    ctx.fillText('收據 ' + no, 42, y + 20);
    ctx.fillStyle = C_SLATE;
    ctx.font = f(650, 15);
    ctx.fillText(`${c.a} × ${na}　　${c.b} × ${nb}`, 42, y + 45);
    ctx.fillStyle = C_INK;
    ctx.font = f(800, 17);
    ctx.textAlign = 'right';
    ctx.fillText(`合計 ${total} 元`, 498, y + 45);
    ctx.textAlign = 'left';
  }

  function draw() {
    const s = state();
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, s.c.title + '：兩張收據列式台', C_INK);

    drawReceipt(s, 44, '①', s.c.r1a, s.c.r1b, s.t1);
    drawReceipt(s, 130, '②', s.n, s.c.r2b, s.t2);

    drawNote(ctx, `設 ${s.xName}每${s.c.unit} x 元、${s.yName}每${s.c.unit} y 元`, 236, C_EMBER, 14);

    drawPanel(ctx, 24, 252, 492, 158, C_INK, 0.07);
    drawBrace(ctx, 76, 282, 388, C_INK);
    drawExpr(ctx, termItems([{ c: s.e1.a, v: 'x' }, { c: s.e1.b, v: 'y' }]).concat(
      [T('=', C_SLATE), T(String(s.t1), C_PAPER)]), 0, 306, 25, C_SLATE, { left: 116, maxW: 380, gap: 7 });
    drawExpr(ctx, termItems([{ c: s.e2.a, v: 'x' }, { c: s.e2.b, v: 'y' }]).concat(
      [T('=', C_SLATE), T(String(s.t2), C_PAPER)]), 0, 364, 25, C_SLATE, { left: 116, maxW: 380, gap: 7 });
    drawNote(ctx, '兩條並列 → 二元一次聯立方程式', 272, C_MAGENTA, 13);

    if (nV) nV.textContent = s.n;
    if (nName) nName.textContent = s.c.a;

    if (out) {
      out.innerHTML = casesTex(eqTex(s.e1.a, s.e1.b, s.t1), eqTex(s.e2.a, s.e2.b, s.t2));
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(
        `\\(x\\) 是<strong>${s.xName}</strong>的價錢、\\(y\\) 是<strong>${s.yName}</strong>的價錢。` +
        `收據①出一條式子、收據②出另一條，兩條講的是<strong>同一組</strong> \\(x\\)、\\(y\\)，` +
        `所以能用大括號夾成一組。<br>換「\\(x\\) 設誰」看看：兩條式子的係數會<strong>整組</strong>跟著換位置，不是只換一條。`);
      typeset([fb]);
    }
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  bindPickGroup(roleGroup, 'data-role', v => { role = parseInt(v, 10); draw(); });
  if (nS) nS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：雙閘門驗票機
   一組 x、y 同時送進兩台閘門，兩台都開才是共同解
   ========================================================================== */
function initCommonCanvas() {
  const canvas = document.getElementById('canvas-common');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('cm-formula');
  const fb = document.getElementById('cm-feedback');
  const group = document.getElementById('cm-eq-group');
  const xS = document.getElementById('cm-x-slider');
  const yS = document.getElementById('cm-y-slider');
  const xV = document.getElementById('cm-x-val');
  const yV = document.getElementById('cm-y-val');

  const SETS = [
    { e1: { a: 1, b: 1, c: 5 }, e2: { a: 2, b: -1, c: 1 }, sol: [2, 3] },
    { e1: { a: 2, b: 1, c: 7 }, e2: { a: 1, b: -1, c: 2 }, sol: [3, 1] },
    { e1: { a: 1, b: -2, c: -3 }, e2: { a: 3, b: 1, c: 5 }, sol: [1, 2] }
  ];

  let idx = 0;

  // 代入後的算式字串，例如 2(2) - (3)
  function evalTex(e, X, Y) {
    let s = '';
    const A = Math.abs(e.a), B = Math.abs(e.b);
    s += (e.a < 0 ? '-' : '') + (A === 1 ? '' : A) + '(' + X + ')';
    s += (e.b < 0 ? ' - ' : ' + ') + (B === 1 ? '' : B) + '(' + Y + ')';
    return s;
  }

  function drawOne(e, X, Y, y0, no) {
    const val = e.a * X + e.b * Y;
    const ok = (val === e.c);
    const col = ok ? OK_COLOR : NO_COLOR;
    drawPanel(ctx, 20, y0, 500, 140, col, 0.08);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_PAPER;
    ctx.font = f(800, 13);
    ctx.fillText('方程式 ' + no, 38, y0 + 22);
    drawExpr(ctx, termItems([{ c: e.a, v: 'x' }, { c: e.b, v: 'y' }]).concat(
      [T('=', C_SLATE), T(String(e.c), C_PAPER)]), 0, y0 + 50, 22, C_SLATE, { left: 38, maxW: 270, gap: 6 });
    ctx.fillStyle = MUTED;
    ctx.font = f(650, 12.5);
    ctx.fillText(`代入 x = ${X}、y = ${Y}`, 38, y0 + 79);
    drawExpr(ctx, [inkItems(evalTex(e, X, Y), col), T('=', col), T(String(val), col)],
      0, y0 + 108, 20, col, { left: 38, maxW: 270, gap: 6 });
    ctx.fillStyle = col;
    ctx.font = f(850, 22);
    ctx.textAlign = 'left';
    ctx.fillText(ok ? '✓' : '✗', 316, y0 + 108);
    drawGate(ctx, 428, y0 + 70, ok, C_PAPER);
    return ok;
  }

  function draw() {
    const s = SETS[idx];
    const X = parseInt(xS.value, 10);
    const Y = parseInt(yS.value, 10);
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '雙閘門驗票機：兩台都開才是解', C_INK);

    const ok1 = drawOne(s.e1, X, Y, 42, '①');
    const ok2 = drawOne(s.e2, X, Y, 194, '②');
    const both = ok1 && ok2;

    const chipW = 320;
    drawChip(ctx, w / 2 - chipW / 2, 346, chipW, 38,
      both ? '兩台都開 → 是這組聯立方程式的解' : (ok1 || ok2 ? '只過一關 → 不是共同解' : '兩台都不開 → 不是解'),
      both ? OK_COLOR : NO_COLOR,
      both ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');
    drawNote(ctx, both ? '這一組 x、y 讓兩個等號同時成立' : '再拉滑桿找找看，哪一組能讓兩台同時抬桿', 404, DIM, 13);

    if (xV) xV.textContent = X;
    if (yV) yV.textContent = Y;

    if (out) {
      out.innerHTML = casesTex(eqTex(s.e1.a, s.e1.b, s.e1.c), eqTex(s.e2.a, s.e2.b, s.e2.c)) +
        '<wbr>　代入：' + `\\(x = ${X}\\)、\\(y = ${Y}\\)`;
      typeset([out]);
    }
    if (fb) {
      let html;
      if (both) {
        html = `兩個等號同時成立，所以 \\(\\begin{cases} x=${X} \\\\ y=${Y} \\end{cases}\\) 是這組聯立方程式的<strong>解</strong>。`;
      } else if (ok1 || ok2) {
        html = `只有第${ok1 ? '①' : '②'}式成立，第${ok1 ? '②' : '①'}式的等號不成立——<strong>只過一關不算</strong>，這一組不是共同解。`;
      } else {
        html = `兩式的等號都不成立，這一組 \\(x\\)、\\(y\\) 兩邊都對不上。`;
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-eq', v => { idx = parseInt(v, 10); draw(); });
  if (xS) xS.addEventListener('input', draw);
  if (yS) yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 3：代入消去法逐步機
   其中一式已經是 x = ... 或 y = ...，直接整組搬進另一式
   ========================================================================== */
function initSubstCanvas() {
  const canvas = document.getElementById('canvas-subst');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('sb-formula');
  const fb = document.getElementById('sb-feedback');
  const group = document.getElementById('sb-case-group');
  const btnNext = document.getElementById('sb-next');
  const btnPrev = document.getElementById('sb-prev');
  const btnReset = document.getElementById('sb-reset');

  const CASES = [
    {
      e1: 'x = 3y', e2: 'x + y = 24', sol: 'x = 18，y = 6',
      rows: [
        { name: '觀察①式', hint: '已經是 x ＝ … 的樣子', tex: 'x = 3y', color: C_MAGENTA },
        { name: '①代入②式', hint: '把②式裡的 x 換成 3y', tex: '3y + y = 24', color: C_SKY },
        { name: '解一元一次', hint: '合併同類項', tex: '4y = 24，y = 6', color: C_SKY },
        { name: '回代①式', hint: '求另一個未知數', tex: 'x = 3 × 6 = 18', color: C_PAPER },
        { name: '驗算', hint: '兩式都代一次', tex: '18 = 3×6 ✓　18 + 6 = 24 ✓', color: OK_COLOR },
        { name: '結論', hint: '兩個值綁在一起', tex: 'x = 18，y = 6', color: OK_COLOR }
      ]
    },
    {
      e1: 'y = 5 - 2x', e2: '3x + 2y = 8', sol: 'x = 2，y = 1',
      rows: [
        { name: '觀察①式', hint: '已經是 y ＝ … 的樣子', tex: 'y = 5 - 2x', color: C_MAGENTA },
        { name: '①代入②式', hint: '整組搬進去，一定要加括號', tex: '3x + 2(5 - 2x) = 8', color: C_SKY },
        { name: '去括號', hint: '分配律，每一項都要乘', tex: '3x + 10 - 4x = 8', color: C_SKY },
        { name: '解一元一次', hint: '合併同類項後移項', tex: '-x = -2，x = 2', color: C_SKY },
        { name: '回代①式', hint: '求另一個未知數', tex: 'y = 5 - 2×2 = 1', color: C_PAPER },
        { name: '結論', hint: '代回②式：6 + 2 = 8 ✓', tex: 'x = 2，y = 1', color: OK_COLOR }
      ]
    },
    {
      e1: 'y = -3x', e2: '2x + y = -4', sol: 'x = 4，y = -12',
      rows: [
        { name: '觀察①式', hint: '已經是 y ＝ … 的樣子', tex: 'y = -3x', color: C_MAGENTA },
        { name: '①代入②式', hint: '把②式裡的 y 換成 -3x', tex: '2x + (-3x) = -4', color: C_SKY },
        { name: '合併同類項', hint: '2x - 3x = -x', tex: '-x = -4', color: C_SKY },
        { name: '解一元一次', hint: '兩邊同乘 -1', tex: 'x = 4', color: C_SKY },
        { name: '回代①式', hint: '負數代入要小心符號', tex: 'y = -3×4 = -12', color: C_PAPER },
        { name: '結論', hint: '代回②式：8 - 12 = -4 ✓', tex: 'x = 4，y = -12', color: OK_COLOR }
      ]
    }
  ];

  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '代入消去法逐步機', C_INK);

    const rows = [
      { name: '原式 ①', hint: '', items: [inkItems(c.e1, C_PAPER)], color: C_PAPER },
      { name: '原式 ②', hint: '', items: [inkItems(c.e2, C_PAPER)], color: C_PAPER }
    ].concat(c.rows.map(r => ({ name: r.name, hint: r.hint, items: [inkItems(r.tex, r.color)], color: r.color })));

    drawStepRows(ctx, rows, 2 + step, { top: 58, gap: 46, size: 20 });

    if (step < c.rows.length) {
      drawNote(ctx, '按「下一步」看下一個動作', 414, DIM, 13);
    }

    if (out) {
      const parts = c.sol.split('，');
      out.innerHTML = casesTex(c.e1, c.e2) +
        (step >= c.rows.length ? '<wbr>　解：' + casesTex(parts[0], parts[1]) : '');
      typeset([out]);
    }
    if (fb) {
      const r = step === 0 ? null : c.rows[step - 1];
      const html = r
        ? `<strong>${r.name}</strong>：${r.hint || '照著做下去'}。`
        : '這一組聯立方程式的①式已經整理好了，按<strong>下一步</strong>看代入怎麼把兩個未知數變成一個。';
      fb.innerHTML = wrapFeedback(html + (step >= c.rows.length
        ? '<br>整條路線只有一個目的：<strong>消去一個未知數</strong>，剩下的就是會解的一元一次方程式。' : ''));
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < CASES[idx].rows.length) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 4：整理路線選擇台
   四條路線都解得出同一組答案，差別只在會不會冒出分數
   ========================================================================== */
function initRearrCanvas() {
  const canvas = document.getElementById('canvas-rearr');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('ra-formula');
  const fb = document.getElementById('ra-feedback');
  const caseGroup = document.getElementById('ra-case-group');
  const routeGroup = document.getElementById('ra-route-group');
  const btnNext = document.getElementById('ra-next');
  const btnPrev = document.getElementById('ra-prev');
  const btnReset = document.getElementById('ra-reset');

  const CASES = [
    { e1: { a: 1, b: 2, c: 7 }, e2: { a: 3, b: -1, c: 7 }, sol: [3, 2] },
    { e1: { a: 2, b: -1, c: 5 }, e2: { a: 3, b: 2, c: 11 }, sol: [3, 1] },
    { e1: { a: 3, b: 1, c: -2 }, e2: { a: 1, b: -2, c: 11 }, sol: [1, -5] }
  ];

  let idx = 0, route = 0, step = 0;

  // k(expr) 的字串，係數 ±1 時不寫 1
  function coefParen(k, exprStr) {
    const A = Math.abs(k);
    return (A === 1 ? '' : A) + '(' + exprStr + ')';
  }

  function plan() {
    const c = CASES[idx];
    const srcFirst = route < 2;
    const src = srcFirst ? c.e1 : c.e2;
    const oth = srcFirst ? c.e2 : c.e1;
    const srcNo = srcFirst ? '①' : '②';
    const othNo = srcFirst ? '②' : '①';
    const solveX = (route % 2 === 0);
    const uName = solveX ? 'x' : 'y';
    const wName = solveX ? 'y' : 'x';
    const cu = solveX ? src.a : src.b;
    const cw = solveX ? src.b : src.a;
    const ou = solveX ? oth.a : oth.b;
    const ow = solveX ? oth.b : oth.a;
    const clean = Math.abs(cu) === 1;

    // u = (n0 + n1·w) / den；分母一律取正數，負號併進分子
    const sg = cu < 0 ? -1 : 1;
    const den = Math.abs(cu);
    const n0 = sg * src.c;
    const n1 = -sg * cw;
    // 常數為負、變數項為正時把變數項寫前面（3x - 7 比 -7 + 3x 好讀）
    const ordered = (t0, t1) => (t0.c < 0 && t1.c > 0) ? [t1, t0] : [t0, t1];
    const numStrTex = termTex(ordered({ c: n0, v: '' }, { c: n1, v: wName }));

    // 消去 w 之後的一元一次方程式：D·w = E
    const D = ou * n1 + den * ow;
    const E = den * oth.c - ou * n0;
    const wVal = E / D;
    const uVal = (n0 + n1 * wVal) / den;

    const rows = [];

    if (clean) {
      rows.push({
        name: `由${srcNo}式解 ${uName}`, hint: `${uName} 的係數是 ${cu}，整理後沒有分數`,
        items: [inkItems(`${uName} = ${numStrTex}　⋯③`, C_MAGENTA)], color: C_MAGENTA
      });
      let lhs;
      if (solveX) {
        lhs = (ou < 0 ? '-' : '') + coefParen(ou, numStrTex);
        lhs += (ow < 0 ? ' - ' : ' + ') + (Math.abs(ow) === 1 ? wName : Math.abs(ow) + wName);
      } else {
        lhs = termTex([{ c: ow, v: wName }]);
        lhs += (ou < 0 ? ' - ' : ' + ') + coefParen(ou, numStrTex);
      }
      rows.push({
        name: `③代入${othNo}式`, hint: '整組搬進去，一定要加括號',
        items: [inkItems(`${lhs} = ${oth.c}`, C_SKY)], color: C_SKY
      });
      const expTerms = solveX
        ? [{ c: ou * n0, v: '' }, { c: ou * n1, v: wName }, { c: ow, v: wName }]
        : [{ c: ow, v: wName }, { c: ou * n0, v: '' }, { c: ou * n1, v: wName }];
      rows.push({
        name: '去括號', hint: '分配律，每一項都要乘',
        items: [inkItems(`${termTex(expTerms)} = ${oth.c}`, C_SKY)], color: C_SKY
      });
    } else {
      const frac = VF(inkItems(numStrTex, C_MAGENTA), T(String(den), C_MAGENTA), C_MAGENTA);
      rows.push({
        name: `由${srcNo}式解 ${uName}`, hint: `${uName} 的係數是 ${cu}，整理後會出現分數`,
        items: [IT(uName, C_MAGENTA), T('=', C_MAGENTA), frac, T('⋯③', C_MAGENTA)], color: C_MAGENTA
      });
      const fr2 = VF(inkItems(numStrTex, C_SKY), T(String(den), C_SKY), C_SKY);
      const wTerm = Math.abs(ow) === 1 ? IT(wName, C_SKY) : SEQ([T(String(Math.abs(ow)), C_SKY), IT(wName, C_SKY)], C_SKY, 1);
      // 分子帶正負號時，係數的「量」與「符號」要分開放：當成第一項才需要自己帶負號
      const uMag = (Math.abs(ou) !== 1) ? [T(String(Math.abs(ou)), C_SKY)] : [];
      const uLead = (ou < 0 ? [T('-', C_SKY)] : []).concat(uMag);
      const tail = [T('=', C_SKY), T(String(oth.c), C_SKY)];
      const items = solveX
        ? uLead.concat([fr2], [T(ow < 0 ? '-' : '+', C_SKY), wTerm], tail)
        : (ow < 0 ? [T('-', C_SKY)] : []).concat([wTerm, T(ou < 0 ? '-' : '+', C_SKY)], uMag, [fr2], tail);
      rows.push({
        name: `③代入${othNo}式`, hint: '代進去之後左邊帶著分數', items: items, color: C_SKY
      });
      const grpStr = (ou < 0 ? '-' : '') + coefParen(ou, numStrTex);
      const wCoef2 = den * ow;
      const lhs2 = solveX
        ? grpStr + (wCoef2 < 0 ? ' - ' : ' + ') + (Math.abs(wCoef2) === 1 ? wName : Math.abs(wCoef2) + wName)
        : termTex([{ c: wCoef2, v: wName }]) + (ou < 0 ? ' - ' : ' + ') + coefParen(ou, numStrTex);
      rows.push({
        name: `兩邊同乘 ${den}`, hint: '先把分母清掉再算比較不會錯',
        items: [inkItems(`${lhs2} = ${den * oth.c}`, C_SKY)], color: C_SKY
      });
    }

    rows.push({
      name: '合併解出', hint: '整理成一元一次方程式',
      items: [inkItems(`${termTex([{ c: D, v: wName }])} = ${E}，${wName} = ${numStr(wVal)}`, C_SKY)], color: C_SKY
    });
    rows.push({
      name: '回代③式', hint: '求另一個未知數',
      items: clean
        ? [inkItems(`${uName} = ${termTex(ordered({ c: n0, v: '' }, { c: n1, v: '(' + numStr(wVal) + ')' }))} = ${numStr(uVal)}`, C_PAPER)]
        : [IT(uName, C_PAPER), T('=', C_PAPER),
           VF(inkItems(termTex(ordered({ c: n0, v: '' }, { c: n1, v: '(' + numStr(wVal) + ')' })), C_PAPER), T(String(den), C_PAPER), C_PAPER),
           T('=', C_PAPER), T(numStr(uVal), C_PAPER)],
      color: C_PAPER
    });
    rows.push({
      name: '結論', hint: '四條路線的答案完全相同',
      items: [inkItems(`x = ${c.sol[0]}，y = ${c.sol[1]}`, OK_COLOR)], color: OK_COLOR
    });

    const thirdTex = clean
      ? `${uName} = ${numStrTex}`
      : `${uName} = \\dfrac{${numStrTex}}{${den}}`;
    return { c, rows, clean, cu, den, srcNo, uName, wName, numStrTex, thirdTex };
  }

  function draw() {
    const p = plan();
    const c = p.c;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '整理路線選擇台', C_INK);

    const rows = [
      { name: '原式 ①', hint: '', items: [inkItems(eqTex(c.e1.a, c.e1.b, c.e1.c), C_PAPER)], color: C_PAPER },
      { name: '原式 ②', hint: '', items: [inkItems(eqTex(c.e2.a, c.e2.b, c.e2.c), C_PAPER)], color: C_PAPER }
    ].concat(p.rows);

    drawStepRows(ctx, rows, 2 + step, { size: 19 });

    if (out) {
      out.innerHTML = casesTex(eqTex(c.e1.a, c.e1.b, c.e1.c), eqTex(c.e2.a, c.e2.b, c.e2.c)) +
        (step >= 1 ? '<wbr>　③：\\( ' + p.thirdTex + ' \\)' : '') +
        (step >= p.rows.length ? '<wbr>　解：' + casesTex('x = ' + c.sol[0], 'y = ' + c.sol[1]) : '');
      typeset([out]);
    }
    if (fb) {
      const r = step === 0 ? null : p.rows[step - 1];
      let html;
      if (!r) {
        html = `兩式都不是「\\(x=\\cdots\\)」的樣子，得自己整理出一個。目前選的是<strong>由${p.srcNo}式解 \\(${p.uName}\\)</strong>，` +
          (p.clean
            ? `係數是 \\(${p.cu}\\)，整理後<strong>不會有分數</strong>。`
            : `係數是 \\(${p.cu}\\)，整理後<strong>會出現分數</strong>——這條路仍然算得出正確答案，只是計算量比較大。`);
      } else {
        html = `<strong>${r.name}</strong>：${r.hint}。`;
        if (step >= p.rows.length) {
          html += `<br>換一條路線再走一次：四條的答案都是 \\(x=${c.sol[0]}\\)、\\(y=${c.sol[1]}\\)，<strong>沒有哪一條是錯的</strong>，只有省不省事的差別。`;
        }
      }
      fb.innerHTML = wrapFeedback(html);
      typeset([fb]);
    }
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); step = 0; draw(); });
  bindPickGroup(routeGroup, 'data-route', v => { route = parseInt(v, 10); step = 0; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < plan().rows.length) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 5：直式加減台
   係數互為相反數 → 相加；係數相同 → 相減
   ========================================================================== */
function initAddSubCanvas() {
  const canvas = document.getElementById('canvas-addsub');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('as-formula');
  const fb = document.getElementById('as-feedback');
  const opGroup = document.getElementById('as-op-group');
  const c1S = document.getElementById('as-c1-slider');
  const c2S = document.getElementById('as-c2-slider');
  const c1V = document.getElementById('as-c1-val');
  const c2V = document.getElementById('as-c2-val');

  const A1 = 2, A2 = 3, K1 = 14, K2 = 6;
  let op = '+';

  function draw() {
    const c1 = parseInt(c1S.value, 10);
    const c2 = parseInt(c2S.value, 10);
    const s = (op === '+') ? 1 : -1;
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '直式加減台：把 y 消掉', C_INK);

    if (c1V) c1V.textContent = c1;
    if (c2V) c2V.textContent = c2;

    const bad = (c1 === 0 || c2 === 0);

    drawPanel(ctx, 46, 50, 448, 152, bad ? NO_COLOR : C_PAPER, 0.07);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = MUTED;
    ctx.font = f(700, 13);
    ctx.fillText('①', 66, 88);
    ctx.fillText('②', 66, 136);
    ctx.fillStyle = C_INK;
    ctx.font = f(850, 26);
    ctx.fillText(op === '+' ? '＋' : '－', 92, 136);

    drawExpr(ctx, termItems([{ c: A1, v: 'x' }, { c: c1, v: 'y' }]).concat([T('=', C_SLATE), T(String(K1), C_PAPER)]),
      0, 88, 23, C_SLATE, { left: 136, maxW: 330, gap: 6 });
    drawExpr(ctx, termItems([{ c: A2, v: 'x' }, { c: c2, v: 'y' }]).concat([T('=', C_SLATE), T(String(K2), C_PAPER)]),
      0, 136, 23, C_SLATE, { left: 136, maxW: 330, gap: 6 });

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(88, 162);
    ctx.lineTo(474, 162);
    ctx.stroke();

    if (bad) {
      drawNote(ctx, '係數不可以是 0——那條式子裡就沒有 y 了', 186, NO_COLOR, 14);
      drawNote(ctx, '把滑桿拉離 0，讓兩式都是二元一次方程式', 226, MUTED, 13);
      if (out) { out.innerHTML = '（係數 0，不是二元一次方程式）'; }
      if (fb) {
        fb.innerHTML = wrapFeedback('目前有一式的 \\(y\\) 係數是 \\(0\\)，那條式子只剩 \\(x\\)，已經不是二元一次方程式了。把滑桿拉離 \\(0\\) 再看。');
        typeset([fb]);
      }
      return;
    }

    const rA = A1 + A2 * s;
    const rC = c1 + c2 * s;
    const rK = K1 + K2 * s;
    const gone = (rC === 0);
    const col = gone ? OK_COLOR : NO_COLOR;

    drawExpr(ctx, termItems([{ c: rA, v: 'x' }, { c: rC, v: 'y' }], () => col).concat(
      [T('=', col), T(String(rK), col)]), 0, 186, 23, col, { left: 136, maxW: 330, gap: 6 });

    const chipW = 330;
    drawChip(ctx, w / 2 - chipW / 2, 224, chipW, 38,
      gone ? 'y 被消掉了，剩下一元一次方程式' : 'y 還在，這樣消不掉',
      col, gone ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.10)');

    const rel = (c1 === -c2) ? '互為相反數' : (c1 === c2 ? '相同' : '既不相同也不是相反數');
    const should = (c1 === -c2) ? '①＋②' : (c1 === c2 ? '①－②' : '先乘倍數對齊（重點 6）');
    wrapText(ctx, `①式的 y 係數是 ${c1}、②式是 ${c2}，兩者${rel}。`, w / 2, 276, 460, 24, C_SLATE, 15);
    wrapText(ctx, gone
      ? `所以用 ${should} 剛好把 y 消掉，接下來解 ${termTex([{ c: rA, v: 'x' }])} = ${rK} 就好。`
      : `這時候該用的是 ${should}；現在這個做法只會得到 ${termTex([{ c: rC, v: 'y' }])}，y 沒有不見。`,
      w / 2, 322, 460, 24, gone ? OK_COLOR : C_EMBER, 15);
    drawNote(ctx, '判準只有兩條：係數互為相反數 → 相加　　係數相同 → 相減', 382, C_MAGENTA, 13.5);
    drawNote(ctx, '兩條都不符合時，先乘倍數把係數對齊（重點 6）', 408, DIM, 12.5);

    if (out) {
      out.innerHTML = casesTex(eqTex(A1, c1, K1), eqTex(A2, c2, K2)) + '<wbr>　' +
        (op === '+' ? '①＋②：' : '①－②：') + wbrEq(eqTex(rA, rC, rK));
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(gone
        ? `\\(y\\) 的係數${rel}，用<strong>${should}</strong>剛好抵消。消去之後就是一條一元一次方程式，解出 \\(x\\) 再回代求 \\(y\\)。`
        : `這樣算完 \\(y\\) 的係數變成 \\(${rC}\\)，<strong>沒有消掉</strong>。${c1 === -c2 || c1 === c2 ? `這一組係數${rel}，該用的是<strong>${should}</strong>。` : `兩個係數${rel}，得先乘倍數把它們對齊（重點 6）。`}`);
      typeset([fb]);
    }
  }

  bindPickGroup(opGroup, 'data-op', v => { op = v; draw(); });
  if (c1S) c1S.addEventListener('input', draw);
  if (c2S) c2S.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 6：係數對齊工作台
   一個係數是另一個的倍數 → 乘一式；互質 → 兩式各乘，取最小公倍數
   ========================================================================== */
function initAlignCanvas() {
  const canvas = document.getElementById('canvas-align');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('al-formula');
  const fb = document.getElementById('al-feedback');
  const a1S = document.getElementById('al-a1-slider');
  const a2S = document.getElementById('al-a2-slider');
  const a1V = document.getElementById('al-a1-val');
  const a2V = document.getElementById('al-a2-val');

  // y 的係數取 3 與 7：a1、|a2| 都在 1~6 時，兩式永遠不會變成同一條直線
  const B1 = 3, B2 = 7, K1 = 15, K2 = 9;

  function draw() {
    const a1 = parseInt(a1S.value, 10);
    const a2 = parseInt(a2S.value, 10);
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '係數對齊工作台：把 x 的係數調到對得齊', C_INK);

    if (a1V) a1V.textContent = a1;
    if (a2V) a2V.textContent = a2;

    drawPanel(ctx, 24, 44, 492, 70, C_PAPER, 0.07);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12.5);
    ctx.fillText('①', 42, 66);
    ctx.fillText('②', 42, 96);
    drawExpr(ctx, termItems([{ c: a1, v: 'x' }, { c: B1, v: 'y' }]).concat([T('=', C_SLATE), T(String(K1), C_PAPER)]),
      0, 66, 20, C_SLATE, { left: 68, maxW: 300, gap: 5 });
    drawExpr(ctx, termItems([{ c: a2, v: 'x' }, { c: B2, v: 'y' }]).concat([T('=', C_SLATE), T(String(K2), C_PAPER)]),
      0, 96, 20, C_SLATE, { left: 68, maxW: 300, gap: 5 });

    if (a2 === 0) {
      drawNote(ctx, '②式的 x 係數不可以是 0——那條式子裡就沒有 x 了', 170, NO_COLOR, 14);
      drawNote(ctx, '把滑桿拉離 0，讓兩式都是二元一次方程式', 206, MUTED, 13);
      if (out) out.innerHTML = '（係數 0，不是二元一次方程式）';
      if (fb) {
        fb.innerHTML = wrapFeedback('②式的 \\(x\\) 係數是 \\(0\\)，那條式子只剩 \\(y\\)，已經不是二元一次方程式了。把滑桿拉離 \\(0\\) 再看。');
        typeset([fb]);
      }
      return;
    }

    const A2 = Math.abs(a2);
    const L = a1 * A2 / gcd(a1, A2);
    const m = L / a1, n = L / A2;
    const opPlus = (a2 < 0);
    const s = opPlus ? 1 : -1;

    const kind = (m === 1 && n === 1) ? '本來就對齊了，不用乘'
      : (m === 1 ? `②的係數已經是①的倍數，只要②×${n}`
        : (n === 1 ? `①的係數已經是②的倍數，只要①×${m}`
          : `${a1} 與 ${A2} 互質，取 [${a1}, ${A2}] = ${L}，①×${m}、②×${n}`));
    drawNote(ctx, kind, 134, C_EMBER, 13.5);

    drawPanel(ctx, 24, 152, 492, 148, C_INK, 0.07);
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12.5);
    ctx.textAlign = 'left';
    ctx.fillText(m === 1 ? '①' : '①×' + m, 42, 182);
    ctx.fillText(n === 1 ? '②' : '②×' + n, 42, 226);
    ctx.fillStyle = C_INK;
    ctx.font = f(850, 24);
    ctx.fillText(opPlus ? '＋' : '－', 96, 226);

    drawExpr(ctx, termItems([{ c: a1 * m, v: 'x' }, { c: B1 * m, v: 'y' }]).concat([T('=', C_SLATE), T(String(K1 * m), C_PAPER)]),
      0, 182, 21, C_SLATE, { left: 136, maxW: 340, gap: 5 });
    drawExpr(ctx, termItems([{ c: a2 * n, v: 'x' }, { c: B2 * n, v: 'y' }]).concat([T('=', C_SLATE), T(String(K2 * n), C_PAPER)]),
      0, 226, 21, C_SLATE, { left: 136, maxW: 340, gap: 5 });

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(92, 252);
    ctx.lineTo(496, 252);
    ctx.stroke();

    const rB = B1 * m + s * B2 * n;
    const rK = K1 * m + s * K2 * n;
    drawExpr(ctx, termItems([{ c: rB, v: 'y' }], () => OK_COLOR).concat([T('=', OK_COLOR), T(String(rK), OK_COLOR)]),
      0, 278, 22, OK_COLOR, { left: 136, maxW: 340, gap: 6 });

    const chipW = 340;
    drawChip(ctx, w / 2 - chipW / 2, 314, chipW, 36,
      opPlus ? '係數互為相反數 → 用加法' : '係數相同 → 用減法',
      C_MAGENTA, 'rgba(249, 168, 212, 0.10)');
    drawNote(ctx, `乘完後 x 的係數是 ${a1 * m} 與 ${a2 * n}`, 372, MUTED, 13);
    drawNote(ctx, 'x 消掉了，接下來解這條一元一次方程式，再回代求 x', 398, DIM, 12.5);


    if (out) {
      const opLabel = `${m === 1 ? '①' : '①×' + m}${opPlus ? '＋' : '－'}${n === 1 ? '②' : '②×' + n}：`;
      out.innerHTML = casesTex(eqTex(a1, B1, K1), eqTex(a2, B2, K2)) + '<wbr>　' + opLabel +
        wbrEq(`${termTex([{ c: rB, v: 'y' }])} = ${rK}`);
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(
        `\\(x\\) 的係數是 \\(${a1}\\) 與 \\(${a2}\\)。${kind}。` +
        `乘完之後兩式的 \\(x\\) 係數變成 \\(${a1 * m}\\) 與 \\(${a2 * n}\\)，${opPlus ? '<strong>互為相反數，用加法</strong>' : '<strong>相同，用減法</strong>'}——` +
        `這正是重點 5 的兩條判準，順序是<strong>先對齊、再加減</strong>。`);
      typeset([fb]);
    }
  }

  if (a1S) a1S.addEventListener('input', draw);
  if (a2S) a2S.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 7：標準式整理台
   未知數散在等號兩邊時，先移項合併成 ax + by = c 再解
   ========================================================================== */
function initStandardCanvas() {
  const canvas = document.getElementById('canvas-standard');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('st-formula');
  const fb = document.getElementById('st-feedback');
  const group = document.getElementById('st-case-group');
  const btnNext = document.getElementById('st-next');
  const btnPrev = document.getElementById('st-prev');
  const btnReset = document.getElementById('st-reset');

  const CASES = [
    {
      e1: '4x - y = 2x + 8', e2: 'x + y = 7', sol: ['x = 5', 'y = 2'],
      rows: [
        { name: '①移項', hint: '未知數搬到左邊，移項要變號', tex: '4x - y - 2x = 8', color: C_MAGENTA },
        { name: '①合併同類項', hint: '得到標準式 ax + by = c', tex: '2x - y = 8　⋯③', color: C_MAGENTA },
        { name: '②檢查', hint: '②本來就是標準式，不必動', tex: 'x + y = 7　⋯④', color: C_MAGENTA },
        { name: '判斷加減', hint: 'y 的係數 -1 與 1 互為相反數', tex: '③ + ④：3x = 15', color: C_SKY },
        { name: '解出並回代', hint: '代進④式最省事', tex: 'x = 5，y = 7 - 5 = 2', color: C_PAPER },
        { name: '結論', hint: '代回原式兩條都成立', tex: 'x = 5，y = 2', color: OK_COLOR }
      ]
    },
    {
      e1: '2x + 3y - 7 = 0', e2: 'y - 2 = x - 3', sol: ['x = 2', 'y = 1'],
      rows: [
        { name: '①移項', hint: '常數 -7 移到右邊變成 +7', tex: '2x + 3y = 7　⋯③', color: C_MAGENTA },
        { name: '②移項', hint: 'x 移到左邊變 -x、-2 移到右邊變 +2', tex: 'y - x = -3 + 2', color: C_MAGENTA },
        { name: '②排好順序', hint: 'x 項寫前面，並合併常數', tex: '-x + y = -1　⋯④', color: C_MAGENTA },
        { name: '判斷加減', hint: 'x 係數 2 與 -1，④×2 後變 -2', tex: '③ + ④×2：5y = 5', color: C_SKY },
        { name: '解出並回代', hint: '代進④式求 x', tex: 'y = 1，x = y + 1 = 2', color: C_PAPER },
        { name: '結論', hint: '代回原式兩條都成立', tex: 'x = 2，y = 1', color: OK_COLOR }
      ]
    },
    {
      e1: '6x = 2x + 3y + 7', e2: '2y + x = 3x - 6', sol: ['x = -2', 'y = -5'],
      rows: [
        { name: '①移項', hint: '2x 與 3y 移到左邊都要變號', tex: '6x - 2x - 3y = 7', color: C_MAGENTA },
        { name: '①合併同類項', hint: '得到標準式③', tex: '4x - 3y = 7　⋯③', color: C_MAGENTA },
        { name: '②移項', hint: '3x 移到左邊變成 -3x', tex: '2y + x - 3x = -6', color: C_MAGENTA },
        { name: '②合併並排序', hint: 'x 項寫前面、y 項寫後面', tex: '-2x + 2y = -6', color: C_MAGENTA },
        { name: '順手約分', hint: '三項同除以 2，數字更小', tex: '-x + y = -3　⋯④', color: C_EMBER },
        { name: '判斷加減後解出', hint: 'y 係數 -3 與 1，④×3 後變 3', tex: '③ + ④×3：x = -2，y = -5', color: C_SKY },
        { name: '結論', hint: '代回原式兩條都成立', tex: 'x = -2，y = -5', color: OK_COLOR }
      ]
    }
  ];

  let idx = 0, step = 0;

  function draw() {
    const c = CASES[idx];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '標準式整理台：先搬好，再解', C_INK);

    const rows = [
      { name: '原式 ①', hint: '未知數散在等號兩邊', items: [inkItems(c.e1, C_PAPER)], color: C_PAPER },
      { name: '原式 ②', hint: '', items: [inkItems(c.e2, C_PAPER)], color: C_PAPER }
    ].concat(c.rows.map(r => ({ name: r.name, hint: r.hint, items: [inkItems(r.tex, r.color)], color: r.color })));

    drawStepRows(ctx, rows, 2 + step, { size: 19 });

    if (out) {
      out.innerHTML = casesTex(c.e1, c.e2) +
        (step >= c.rows.length ? '<wbr>　解：' + casesTex(c.sol[0], c.sol[1]) : '');
      typeset([out]);
    }
    if (fb) {
      const r = step === 0 ? null : c.rows[step - 1];
      const html = r
        ? `<strong>${r.name}</strong>：${r.hint}。`
        : '兩條式子的未知數散在等號兩邊，直式根本對不齊。按<strong>下一步</strong>看它們怎麼被搬成 \\(ax+by=c\\)。';
      fb.innerHTML = wrapFeedback(html + (step >= c.rows.length
        ? '<br>整理只是<strong>準備動作</strong>：搬完之後該用代入還是加減，仍然看係數決定。' : ''));
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-case', v => { idx = parseInt(v, 10); step = 0; draw(); });
  if (btnNext) btnNext.addEventListener('click', () => { if (step < CASES[idx].rows.length) { step++; draw(); } });
  if (btnPrev) btnPrev.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  if (btnReset) btnReset.addEventListener('click', () => { step = 0; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：去分母工作台
   兩邊同乘分母的最小公倍數（小數則乘 10、100），把係數變成整數
   ========================================================================== */
function initDenomCanvas() {
  const canvas = document.getElementById('canvas-denom');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('dn-formula');
  const fb = document.getElementById('dn-feedback');
  const group = document.getElementById('dn-mode-group');
  const d1S = document.getElementById('dn-d1-slider');
  const d2S = document.getElementById('dn-d2-slider');
  const d1V = document.getElementById('dn-d1-val');
  const d2V = document.getElementById('dn-d2-val');

  const MODES = [
    {
      tex: '2x + 3y = 13', latex: '2x+3y=13', mul: 1,
      res: '2x + 3y = 13', resLatex: '2x+3y=13',
      note: '②式的係數本來就是整數，不用乘', extra: ''
    },
    {
      tex: '0.4x - 0.5y = 1.1', latex: '0.4x-0.5y=1.1', mul: 10,
      res: '4x - 5y = 11', resLatex: '4x-5y=11',
      note: '最多一位小數 → 兩邊同乘 10', extra: ''
    },
    {
      tex: '0.25x + 0.75y = 2', latex: '0.25x+0.75y=2', mul: 100,
      res: '25x + 75y = 200', resLatex: '25x+75y=200',
      note: '最多兩位小數 → 兩邊同乘 100', extra: '三項同除以 25，還可以再簡化成 x + 3y = 8'
    }
  ];

  let mode = 0;

  function draw() {
    const d1 = parseInt(d1S.value, 10);
    const d2 = parseInt(d2S.value, 10);
    const m = MODES[mode];
    const w = canvas.width;
    ctx.clearRect(0, 0, w, canvas.height);
    drawTitle(ctx, '去分母工作台：把係數變成整數', C_INK);

    if (d1V) d1V.textContent = d1;
    if (d2V) d2V.textContent = d2;

    const L = d1 * d2 / gcd(d1, d2);

    // ①式
    drawPanel(ctx, 20, 42, 500, 150, C_MAGENTA, 0.07);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12.5);
    ctx.fillText('①式', 38, 62);
    drawExpr(ctx, [
      VF(IT('x', C_SLATE), T(String(d1), C_SLATE), C_SLATE),
      T('+', C_SLATE),
      VF(IT('y', C_SLATE), T(String(d2), C_SLATE), C_SLATE),
      T('=', C_SLATE), T('1', C_PAPER)
    ], w / 2, 98, 24, C_SLATE, { maxW: 420, gap: 8 });
    drawNote(ctx, d1 === d2
      ? `兩個分母都是 ${d1} → 兩邊同乘 ${L}`
      : `分母是 ${d1} 和 ${d2}，[${d1}, ${d2}] = ${L} → 兩邊同乘 ${L}`, 140, C_EMBER, 13.5);
    drawExpr(ctx, termItems([{ c: L / d1, v: 'x' }, { c: L / d2, v: 'y' }], () => OK_COLOR).concat(
      [T('=', OK_COLOR), T(String(L), OK_COLOR)]), w / 2, 172, 23, OK_COLOR, { maxW: 420, gap: 6 });

    // ②式
    drawPanel(ctx, 20, 202, 500, 150, C_SKY, 0.07);
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12.5);
    ctx.textAlign = 'left';
    ctx.fillText('②式', 38, 222);
    drawExpr(ctx, [inkItems(m.tex, C_SLATE)], w / 2, 256, 23, C_SLATE, { maxW: 420, gap: 6 });
    drawNote(ctx, m.note, 296, C_EMBER, 13.5);
    drawExpr(ctx, [inkItems(m.res, OK_COLOR)], w / 2, 328, 23, OK_COLOR, { maxW: 420, gap: 6 });

    drawNote(ctx, m.extra || '兩條式子各乘各的，不必乘一樣的數', 372, MUTED, 13);
    drawNote(ctx, '每一項都要乘，右邊的常數也不例外', 402, DIM, 12.5);

    if (out) {
      out.innerHTML = casesTex(`\\dfrac{x}{${d1}}+\\dfrac{y}{${d2}}=1`, m.latex) +
        '<wbr>　化成整係數　' + casesTex(`${L / d1 === 1 ? '' : L / d1}x+${L / d2 === 1 ? '' : L / d2}y=${L}`, m.resLatex);
      typeset([out]);
    }
    if (fb) {
      fb.innerHTML = wrapFeedback(
        `①式的分母是 \\(${d1}\\) 和 \\(${d2}\\)，取 \\([${d1}, ${d2}]=${L}\\)，兩邊同乘 \\(${L}\\) 之後分數就全部不見了。` +
        `②式${m.mul === 1 ? '本來就是整係數，<strong>不用乘</strong>' : `最多 ${m.mul === 10 ? '一' : '兩'} 位小數，兩邊同乘 \\(${m.mul}\\)`}。` +
        `<br><strong>兩條式子各乘各的</strong>——它們是兩條獨立的等式，各自乘完仍然是原來那一條。`);
      typeset([fb]);
    }
  }

  bindPickGroup(group, 'data-mode', v => { mode = parseInt(v, 10); draw(); });
  if (d1S) d1S.addEventListener('input', draw);
  if (d2S) d2S.addEventListener('input', draw);
  draw();
}
