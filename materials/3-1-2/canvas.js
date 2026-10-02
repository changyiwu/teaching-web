/* ==========================================================================
   3-1-2（第三冊 1-2）多項式與其加減運算 — 互動 Canvas 與隨堂評量
   畫風：沿用 3-1-1 的拼布手作工坊。三種布塊對應多項式的三種項：
   大方布 x² 用玫瑰紅、長條 x 用芥末黃、小方布 1 用薄荷綠（與 3-1-1 的
   a²／ab／b² 同色），三次項另用丹寧藍。十個互動都用同一套顏色。

   共用工具在 ../math-canvas.js（T／IT／VF／FR／SEQ／measure／drawExpr／
   drawStepRows／drawEqPanel／drawPanel／drawChip／wbrEq／textCenter／
   textLeft／bindPickGroup…），本檔只放本節的色票、多項式字串工具與 10 個互動。

   ⚠️ qlParse／qlInk／qlPatch 與 3-1-1 的同名函式逐字相同（兩頁各自載入，
   不會撞名）。若第三冊之後還有節要用，照〈工作約定〉的抽取流程搬進共用檔。
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initQuizSystem();

  initCheckCanvas();
  initCoefCanvas();
  initDegreeCanvas();
  initParamCanvas();
  initOrderCanvas();
  initTileCanvas();
  initColCanvas();
  initSubCanvas();
  initMixCanvas();
  initFindCanvas();
});

/* ==========================================================================
   0. 本節調色盤與小工具（QL_ = Quilt、PY_ = Polynomial；共用檔沒有這兩個前綴）
   ========================================================================== */

const QL_ROSE = '#fb7185';     // x² 的大方布
const QL_TEAL = '#5eead4';     // 1 的小方布
const QL_MUSTARD = '#fcd34d';  // x 的長條
const QL_DENIM = '#93c5fd';    // x³ 項
const QL_CREAM = '#fef3c7';    // 深色底板上的算式字色

// 每個重點的主題色，與 style.css 的 #conceptN strong 對應
const QL_TONE = ['#fcd34d', '#5eead4', '#7dd3fc', '#fda4af', '#6ee7b7', '#d8b4fe',
                 '#fdba74', '#f9a8d4', '#a5b4fc', '#bef264'];

// 依次數上色：常數、x、x²、x³
const PY_DEG_COL = [QL_TEAL, QL_MUSTARD, QL_ROSE, QL_DENIM];
const PY_VAR = ['', 'x', 'x^2', 'x^3'];
const PY_CN = ['零', '一', '二', '三'];

/* --------------------------------------------------------------------------
   算式字串 → canvas 元件（與 3-1-1 相同）
   原始字串一律用 ASCII 寫：「3x^2 - 5x + 4」。
     - 小寫英文字母走斜體
     - ^n 接在數字、字母或括號後面就是乘方
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

// 空格：虛線外框（缺項、係數為 0 的位置）
function pyEmpty(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color || DIM;
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// 打勾／打叉的小圓章（不用 ✓ 字元，避免字型缺字）
function pyMark(ctx, x, y, ok) {
  const col = ok ? OK_COLOR : NO_COLOR;
  ctx.save();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x - 5.5, y + 0.5);
    ctx.lineTo(x - 1.5, y + 4.5);
    ctx.lineTo(x + 6, y - 4.5);
  } else {
    ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
  }
  ctx.stroke();
  ctx.restore();
}

// 一組按鈕的 active 狀態由程式設定
function qlSetActive(groupEl, attr, value) {
  if (!groupEl) return;
  groupEl.querySelectorAll('.pick-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute(attr) === String(value));
  });
}

// 數字的顯示：負號一律用數學減號
function pyNum(v) {
  return String(v).replace('-', '−');
}

/* --------------------------------------------------------------------------
   多項式：以係數陣列表示，索引就是次數。[4, -5, 3] 代表 3x² − 5x + 4。
   字串一律是 ASCII（x^2），同一條字串可以直接當 LaTeX，也可以給 qlInk。
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

// 依次數排出 [[係數, 次數], ...]；asc 為 true 時升冪
function pyList(p, asc) {
  const out = [];
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) out.push([p[d], d]);
  return asc ? out.reverse() : out;
}

function pyStr(p, asc) {
  return pyJoin(pyList(p, asc));
}

// 最高次項的次數；零多項式回 -1
function pyDeg(p) {
  for (let d = p.length - 1; d >= 0; d--) if (p[d]) return d;
  return -1;
}

function pyAdd(p, q) {
  const n = Math.max(p.length, q.length);
  const r = [];
  for (let i = 0; i < n; i++) r.push((p[i] || 0) + (q[i] || 0));
  return r;
}

function pyNeg(p) {
  return p.map(c => (c === 0 ? 0 : -c));
}

// 直式格子裡的一格：首欄不寫「+」，係數 0 也寫出來（0x^2、0x、0）
function pyCell(c, d, first) {
  const body = c === 0 ? (d === 0 ? '0' : '0' + (d === 1 ? 'x' : 'x^' + d)) : pyBody(Math.abs(c), d);
  if (first) return (c < 0 ? '-' : '') + body;
  return (c < 0 ? '- ' : '+ ') + body;
}

// 「x² 項」「常數項」這類標籤的 qlInk 字串
function pyTermName(d) {
  return d === 0 ? '常數項' : PY_VAR[d] + ' 項';
}

// 幾次多項式的名稱
function pyKind(p) {
  const d = pyDeg(p);
  if (d < 0) return '常數多項式 0';
  if (d === 0) return '常數多項式';
  return PY_CN[d] + '次多項式';
}

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // 第三冊 1-2 的 20 題正解
  // 正解字母分布：A 5 題、B 5 題、C 5 題、D 5 題（開發約束 36）
  const answers = {
    '1-2-1': 'C',    // 6/x² 的 x 在分母
    '1-2-2': 'D',    // x/2 + |−5| 有分數線與絕對值卻是多項式
    '1-2-3': 'B',    // 4 − 7x² + x³：x² 項係數 −7、常數項 4
    '1-2-4': 'A',    // 8x³ − 6x + 9 的 x² 項係數是 0
    '1-2-5': 'B',    // −2/7 是零次多項式
    '1-2-6': 'C',    // −x² + 5 的次數是 2
    '1-2-7': 'D',    // (a + 6)x² + (b − 7)x + 4 常數 ⇒ a = −6、b = 7
    '1-2-8': 'C',    // (m − 8)x² + (n + 9)x − 2 一次 ⇒ m = 8、n ≠ −9
    '1-2-9': 'A',    // 降冪 −2x³ − 9x² + x + 6
    '1-2-10': 'D',   // 升冪 −8 + 4x + x² − 3x³
    '1-2-11': 'B',   // −5x 與 2x/3 是同類項
    '1-2-12': 'D',   // 4x² + 5x − 5
    '1-2-13': 'A',   // 5x³ − x² + 4x − 5
    '1-2-14': 'C',   // 二次 + 二次 可能是一次
    '1-2-15': 'B',   // 4x² + 4x + 7
    '1-2-16': 'B',   // x 項與常數項兩欄當成加法
    '1-2-17': 'A',   // 3x² + 3x − 9
    '1-2-18': 'C',   // −x² − 2x − 3
    '1-2-19': 'A',   // C − B = −4x² + 6x + 5
    '1-2-20': 'D'    // C + B = 3x² + x + 5
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
   重點 1：多項式檢查站——x 有沒有跑進分母或絕對值裡
   ========================================================================== */
const PC_CANDS = {
  c1: { tex: '\\frac{1}{3}x + 2', ok: true, rwTex: '\\frac{1}{3} \\cdot x + 2',
        note: '除以 3 就是乘上 1/3：x 只是被乘了一個數' },
  c2: { tex: '-2x^2 + x', ok: true, rwTex: '(-2) \\cdot x \\cdot x + 1 \\cdot x',
        note: '負號是係數的一部分，平方就是 x 乘 x' },
  c3: { tex: '5', ok: true, rwTex: '0 \\cdot x + 5',
        note: '只有常數也是多項式（常數多項式）' },
  c4: { tex: '\\frac{x}{4} - 1', ok: true, rwTex: '\\frac{1}{4} \\cdot x + (-1)',
        note: 'x 除以 4 就是 1/4 乘 x，分母只有數字 4' },
  c5: { tex: '\\frac{2}{x} + 1', ok: false, den: true,
        why: 'x 在分母裡：這是「2 除以 x」' },
  c6: { tex: '|x| + 3', ok: false, abs: true,
        why: 'x 在絕對值裡：|x| 寫不成「數乘 x」' },
  c7: { tex: '\\frac{1}{x + 1}', ok: false, den: true,
        why: 'x 在分母裡：這是「1 除以 (x + 1)」' },
  c8: { tex: '|-3|x - 1', ok: true, absNum: true, rwTex: '3 \\cdot x + (-1)',
        note: '絕對值裡只有數字：|−3| 就是 3' }
};

// 各候選式在畫布上的樣子；bad 是 x 跑錯地方時的顏色
function pcInk(key, col, bad) {
  const X = c => IT('x', c);
  switch (key) {
    case 'c1': return [SEQ([FR(1, 3, col), X(col)], col, 3), T('+', col), T('2', col)];
    case 'c2': return [qlInk('-2x^2', col), T('+', col), X(col)];
    case 'c3': return [T('5', col)];
    case 'c4': return [VF(X(col), T('4', col), col), T('−', col), T('1', col)];
    case 'c5': return [VF(T('2', col), X(bad), col), T('+', col), T('1', col)];
    case 'c6': return [SEQ([T('|', bad), X(bad), T('|', bad)], bad, 3), T('+', col), T('3', col)];
    case 'c7': return [VF(T('1', col), SEQ([X(bad), T('+', bad), T('1', bad)], bad, 5), col)];
    default: return [SEQ([T('|−3|', col), X(col)], col, 3), T('−', col), T('1', col)];
  }
}

// 可以拆開的式子，拆開之後的樣子
function pcRewrite(key, col) {
  switch (key) {
    case 'c1': return [SEQ([FR(1, 3, col), T('·', col), IT('x', col)], col, 4), T('+', col), T('2', col)];
    case 'c2': return [qlInk('(-2)·x·x + 1·x', col)];
    case 'c3': return [qlInk('0·x + 5', col)];
    case 'c4': return [SEQ([FR(1, 4, col), T('·', col), IT('x', col)], col, 4), T('+', col), qlInk('(-1)', col)];
    default: return [qlInk('3·x + (-1)', col)];
  }
}

function initCheckCanvas() {
  const cv = document.getElementById('canvas-check');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const group = document.getElementById('pc-cand-group');
  const out = document.getElementById('pc-formula');
  const fb = document.getElementById('pc-feedback');
  const C = QL_TONE[0];
  let key = 'c1';

  function draw() {
    const K = PC_CANDS[key];
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '多項式檢查站：是不是 x 的多項式？', C);
    drawEqPanel(ctx, pcInk(key, QL_CREAM, NO_COLOR), 92, C, { h: 40, size: 32 });

    if (K.ok) {
      textLeft(ctx, '拆開來看', 22, 168, C, f(800, 14));
      drawExpr(ctx, pcRewrite(key, QL_CREAM), 0, 168, 22, QL_CREAM, { left: 116, maxW: 400, gap: 7 });
      textLeft(ctx, K.note, 116, 206, MUTED, f(700, 13.5));
    } else {
      textLeft(ctx, '問題在這裡', 22, 168, NO_COLOR, f(800, 14));
      textLeft(ctx, K.why, 116, 168, NO_COLOR, f(800, 15));
      textLeft(ctx, '紅色的部分，就是 x 跑進去的地方', 116, 206, MUTED, f(700, 13.5));
    }

    const rows = [
      { q: 'x 有沒有在分母裡？', ans: K.den ? '有' : '沒有', ok: !K.den },
      { q: 'x 有沒有在絕對值裡？', ans: K.abs ? '有' : (K.absNum ? '沒有（裡面只有數字）' : '沒有'), ok: !K.abs },
      { q: '能寫成「數乘 x」一項一項相加嗎？', ans: K.ok ? '可以' : '不行', ok: K.ok }
    ];
    rows.forEach((r, i) => {
      const y = 252 + i * 42;
      drawPanel(ctx, 18, y - 18, 504, 36, r.ok ? OK_COLOR : NO_COLOR, 0.05);
      pyMark(ctx, 40, y, r.ok);
      textLeft(ctx, r.q, 62, y, INK, f(700, 14.5));
      ctx.save();
      ctx.font = f(800, 14);
      ctx.fillStyle = r.ok ? OK_COLOR : NO_COLOR;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.ans, 510, y);
      ctx.restore();
    });

    drawChip(ctx, 120, 384, 300, 42, K.ok ? '是 x 的多項式' : '不是 x 的多項式',
      K.ok ? OK_COLOR : NO_COLOR, K.ok ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');
    textCenter(ctx, K.ok ? '多項式裡的 x 只會被「乘一個數」，再一項一項加起來'
      : '只要 x 跑進分母或絕對值裡，整個式子就不是多項式', 270, 448, INK, f(700, 14));
    textCenter(ctx, '分數線、絕對值本身沒關係，要看裡面有沒有 x', 270, 472, MUTED, f(600, 12.5));

    if (K.ok) {
      out.innerHTML = wbrEq(`${K.tex} = ${K.rwTex}`) + '：是 \\(x\\) 的多項式';
      fb.innerHTML = wrapFeedback(`\\(${K.tex}\\) 可以拆成 ${wbrEq(K.rwTex)}，\\(x\\) 只和數相乘、再相加，`
        + `<b style="color:${C}">是</b> \\(x\\) 的多項式。`);
    } else {
      out.innerHTML = `\\(${K.tex}\\)：不是 \\(x\\) 的多項式`;
      fb.innerHTML = wrapFeedback(`\\(${K.tex}\\) 的 \\(x\\) 在${K.den ? '<b style="color:' + C + '">分母</b>' : '<b style="color:' + C + '">絕對值</b>'}裡，`
        + `沒辦法寫成「數乘 \\(x\\)」相加的樣子，所以<b style="color:${C}">不是</b> \\(x\\) 的多項式。`);
    }
    typeset([out, fb]);
  }

  bindPickGroup(group, 'data-pc', v => { key = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 2：係數標籤機——每一項都寫成「係數 × x 的乘方」
   ========================================================================== */

// 完整寫法的一項：負係數加括號、係數 1 與 0 也寫出來
function pyFullTerm(c, d) {
  const k = c < 0 ? `(${c})` : String(c);
  return d === 0 ? k : k + PY_VAR[d];
}

function initCoefCanvas() {
  const cv = document.getElementById('canvas-coef');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = [0, 1, 2, 3].map(d => document.getElementById('cf-s' + d));
  const V = [0, 1, 2, 3].map(d => document.getElementById('cf-v' + d));
  const out = document.getElementById('cf-formula');
  const fb = document.getElementById('cf-feedback');
  const C = QL_TONE[1];

  function draw() {
    const p = S.map(s => parseInt(s.value, 10));
    V.forEach((el, d) => { el.textContent = p[d]; });
    const full = [3, 2, 1, 0].map(d => pyFullTerm(p[d], d)).join(' + ');
    const n = p.filter(c => c !== 0).length;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '係數標籤機：每一項的係數是多少？', C);
    drawEqPanel(ctx, [qlInk(pyStr(p), QL_CREAM)], 84, C, { h: 30, size: 28 });
    textCenter(ctx, '改寫成加法，每一項都寫成「係數 × x 的乘方」', 270, 140, MUTED, f(700, 14));

    [3, 2, 1, 0].forEach((d, i) => {
      const x0 = 18 + i * 128;
      const c = p[d];
      const col = PY_DEG_COL[d];
      if (c !== 0) qlPatch(ctx, x0, 160, 112, 64, col, { alpha: 0.22 });
      else pyEmpty(ctx, x0, 160, 112, 64, DIM);
      drawExpr(ctx, [qlInk(pyFullTerm(c, d), c === 0 ? DIM : QL_CREAM)], x0 + 56, 192, 21, QL_CREAM, { maxW: 104 });
      if (i < 3) textCenter(ctx, '+', x0 + 120, 192, INK, f(800, 16));

      const lab = d === 0 ? '常數項' : PY_VAR[d] + ' 項係數';
      drawExpr(ctx, [qlInk(lab, MUTED)], x0 + 56, 246, 14, MUTED);
      textCenter(ctx, pyNum(c), x0 + 56, 282, c === 0 ? DIM : col, f(800, 28));

      let note = '';
      if (c === 0) note = d === 0 ? '沒有常數項 → 0' : '沒出現 → 0';
      else if (c === 1 && d > 0) note = '看不見的 1';
      else if (c === -1 && d > 0) note = '看不見的 −1';
      else if (c < 0) note = '負號要帶著';
      if (note) textCenter(ctx, note, x0 + 56, 316, c === 0 ? MUTED : QL_ROSE, f(700, 12.5));
    });

    drawChip(ctx, 60, 344, 190, 38, n === 0 ? '項數：1（就是 0）' : `項數：${n}`, C, 'rgba(94, 234, 212, 0.10)');
    drawChip(ctx, 290, 344, 190, 38, `常數項：${pyNum(p[0])}`, C, 'rgba(94, 234, 212, 0.10)');

    drawExpr(ctx, [qlInk(`${pyStr(p)} = ${full}`, INK)], 270, 412, 18, INK, { maxW: 500 });

    let note;
    if (n === 0) note = '四個係數都是 0，這個多項式就是 0';
    else if (p.some(c => c < 0)) note = '負號是係數的一部分：減號連同後面的數，一起變成係數';
    else if (p.some(c => c === 0)) note = '沒有出現的項，係數就是 0';
    else note = '被「+」隔開的每一塊，就是一項';
    textCenter(ctx, note, 270, 458, INK, f(700, 14));

    out.innerHTML = wbrEq(`${pyStr(p)} = ${full}`);
    fb.innerHTML = wrapFeedback(`\\(x^3\\) 項係數 \\(${p[3]}\\)、\\(x^2\\) 項係數 \\(${p[2]}\\)、`
      + `\\(x\\) 項係數 \\(${p[1]}\\)、常數項 \\(${p[0]}\\)；`
      + (n === 0 ? `四個係數都是 \\(0\\)，這個多項式就是 <b style="color:${C}">\\(0\\)</b>。`
        : `係數不為 \\(0\\) 的有 <b style="color:${C}">${n} 項</b>。`));
    typeset([out, fb]);
  }

  S.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 3：多項式身分證——最高次項、次數、單項式、常數多項式
   ========================================================================== */
function initDegreeCanvas() {
  const cv = document.getElementById('canvas-degree');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const S = [0, 1, 2, 3].map(d => document.getElementById('dg-s' + d));
  const V = [0, 1, 2, 3].map(d => document.getElementById('dg-v' + d));
  const out = document.getElementById('dg-formula');
  const fb = document.getElementById('dg-feedback');
  const C = QL_TONE[2];

  function draw() {
    const p = S.map(s => parseInt(s.value, 10));
    V.forEach((el, d) => { el.textContent = p[d]; });
    const deg = pyDeg(p);
    const n = p.filter(c => c !== 0).length;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '多項式身分證：幾次？是哪一種？', C);
    drawEqPanel(ctx, [qlInk(pyStr(p), QL_CREAM)], 82, C, { h: 30, size: 28 });

    // 次數階梯：次數越高，格子越高；係數 0 的格子是空的
    const BOT = 300;
    [3, 2, 1, 0].forEach((d, i) => {
      const x0 = 40 + i * 120;
      const h = 44 + 34 * d;
      const c = p[d];
      const col = PY_DEG_COL[d];
      if (c !== 0) {
        qlPatch(ctx, x0, BOT - h, 100, h, col, { alpha: 0.26 });
        const sign = c < 0 ? '-' : '';
        drawExpr(ctx, [qlInk(sign + pyBody(Math.abs(c), d), QL_CREAM)], x0 + 50, BOT - h / 2, 19, QL_CREAM, { maxW: 92 });
      } else {
        pyEmpty(ctx, x0, BOT - h, 100, h, DIM);
        textCenter(ctx, '係數 0', x0 + 50, BOT - h / 2, DIM, f(700, 13));
      }
      if (d === deg) {
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = 3.5;
        ctx.strokeRect(x0 - 3, BOT - h - 3, 106, h + 6);
        ctx.restore();
        textCenter(ctx, '最高次項', x0 + 50, BOT - h - 16, col, f(800, 13));
      }
      drawExpr(ctx, [qlInk(pyTermName(d), MUTED)], x0 + 50, BOT + 18, 14, MUTED);
    });

    const bg = 'rgba(125, 211, 252, 0.10)';
    // 0 也是單項式（課本：13、−1/2、0 都是常數多項式，而常數多項式是單項式）
    const mono = n <= 1;
    drawChip(ctx, 30, 342, 230, 36, `次數：${deg < 0 ? '不規定' : deg}`, C, bg);
    drawChip(ctx, 280, 342, 230, 36, n === 0 ? '項數：1（就是 0）' : `項數：${n}`, C, bg);
    drawChip(ctx, 30, 388, 230, 36, `單項式：${mono ? '是' : '否'}`, mono ? QL_MUSTARD : MUTED, bg);
    drawChip(ctx, 280, 388, 230, 36, `常數多項式：${deg <= 0 ? '是' : '否'}`, deg <= 0 ? QL_MUSTARD : MUTED, bg);

    let kind;
    if (deg < 0) kind = '0 是常數多項式，但不規定次數';
    else if (deg === 0) kind = '零次多項式（不為 0 的常數多項式）';
    else kind = `${PY_CN[deg]}次多項式`;
    textCenter(ctx, kind, 270, 450, C, f(800, 18));

    let note;
    if (deg < 0) note = '四個係數都是 0：0 不是零次多項式';
    else if (deg < 3 && p[3] === 0) note = '係數是 0 的項等於不存在，不能拿來決定次數';
    else note = '次數看「係數不為 0」的最高次項';
    textCenter(ctx, note, 270, 482, MUTED, f(700, 13));

    out.innerHTML = `\\(${pyStr(p)}\\)：${deg < 0 ? '常數多項式，不規定次數' : (deg === 0 ? '零次多項式' : PY_CN[deg] + '次多項式')}`;
    let msg;
    if (deg < 0) {
      msg = `四個係數都是 \\(0\\)，多項式就是 \\(0\\)。它是單項式、常數多項式，但<b style="color:${C}">不規定次數</b>，所以不是零次多項式。`;
    } else if (deg === 0) {
      msg = `只剩常數項 \\(${p[0]}\\)，是<b style="color:${C}">零次多項式</b>，也是單項式、常數多項式。`;
    } else {
      const top = (p[deg] < 0 ? '-' : '') + pyBody(Math.abs(p[deg]), deg);
      msg = `最高次項是 \\(${top}\\)，所以是 <b style="color:${C}">${PY_CN[deg]}次多項式</b>`
        + `${n === 1 ? '，而且只有一項，是單項式' : `，共 ${n} 項`}。`;
    }
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  S.forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 4：條件檢查器——含未知數的係數，要 = 0 還是 ≠ 0
   ========================================================================== */
const PA_TPL = {
  t1: { s2: 'a - 2', f2: a => a - 2, r2: 2, s1: 'b + 3', f1: b => b + 3, r1: -3, k: 7 },
  t2: { s2: 'a + 4', f2: a => a + 4, r2: -4, s1: '2 - b', f1: b => 2 - b, r1: 2, k: -1 },
  t3: { s2: '5 - a', f2: a => 5 - a, r2: 5, s1: 'b - 1', f1: b => b - 1, r1: 1, k: 3 }
};
const PA_GOAL = ['常數多項式', '一次多項式', '二次多項式'];

function initParamCanvas() {
  const cv = document.getElementById('canvas-param');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const tplG = document.getElementById('pa-tpl-group');
  const goalG = document.getElementById('pa-goal-group');
  const aS = document.getElementById('pa-a');
  const bS = document.getElementById('pa-b');
  const aV = document.getElementById('pa-av');
  const bV = document.getElementById('pa-bv');
  const out = document.getElementById('pa-formula');
  const fb = document.getElementById('pa-feedback');
  const C = QL_TONE[3];
  let tpl = 't1';
  let goal = 0;

  // 把 a、b 代進去：負數加括號
  function subst(s, name, v) {
    return s.replace(name, v < 0 ? `(${v})` : String(v));
  }

  function draw() {
    const a = parseInt(aS.value, 10), b = parseInt(bS.value, 10);
    aV.textContent = a;
    bV.textContent = b;
    const K = PA_TPL[tpl];
    const c2 = K.f2(a), c1 = K.f1(b);
    const p = [K.k, c1, c2];
    const kTail = K.k < 0 ? `- ${-K.k}` : `+ ${K.k}`;
    const tplStr = `(${K.s2})x^2 + (${K.s1})x ${kTail}`;
    const subStr = `(${subst(K.s2, 'a', a)})x^2 + (${subst(K.s1, 'b', b)})x ${kTail}`;

    // 目標對應的條件：need 為 'zero'、'nonzero' 或 null（任意數）
    const need2 = goal === 2 ? 'nonzero' : 'zero';
    const need1 = goal === 0 ? 'zero' : (goal === 1 ? 'nonzero' : null);
    const pass = (need, v) => need === null || (need === 'zero' ? v === 0 : v !== 0);
    const rows = [
      { lab: 'x^2 項係數', expr: K.s2, need: need2, v: c2 },
      { lab: 'x 項係數', expr: K.s1, need: need1, v: c1 },
      { lab: '常數項', expr: String(K.k), need: null, v: K.k }
    ];
    const match = rows.every(r => pass(r.need, r.v));

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '條件檢查器：a、b 要是多少？', C);
    drawEqPanel(ctx, [qlInk(tplStr, QL_CREAM)], 80, C, { h: 28, size: 24 });
    textLeft(ctx, `代入 a = ${pyNum(a)}、b = ${pyNum(b)}`, 22, 134, MUTED, f(700, 13.5));
    drawExpr(ctx, [qlInk(`${subStr} = ${pyStr(p)}`, INK)], 0, 166, 19, INK, { left: 22, maxW: 496 });

    textLeft(ctx, `目標：${PA_GOAL[goal]}`, 22, 212, C, f(800, 15));
    textLeft(ctx, '每一條都打勾，才算符合', 330, 212, MUTED, f(700, 13));

    rows.forEach((r, i) => {
      const y = 254 + i * 42;
      const ok = pass(r.need, r.v);
      drawPanel(ctx, 18, y - 18, 504, 36, ok ? OK_COLOR : NO_COLOR, 0.05);
      drawExpr(ctx, [qlInk(r.lab, INK)], 0, y, 14, INK, { left: 30 });
      let cond;
      if (r.need === 'zero') cond = `${r.expr} = 0`;
      else if (r.need === 'nonzero') cond = `${r.expr} ≠ 0`;
      else cond = '任意數';
      drawExpr(ctx, [qlInk(cond, QL_CREAM)], 0, y, 18, QL_CREAM, { left: 134, maxW: 180 });
      textLeft(ctx, `現在 = ${pyNum(r.v)}`, 340, y, MUTED, f(700, 14));
      pyMark(ctx, 492, y, ok);
    });

    const kind = pyKind(p);
    drawChip(ctx, 70, 380, 400, 40, `現在是${kind}，${match ? '符合目標' : '不符合目標'}`,
      match ? OK_COLOR : NO_COLOR, match ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)');

    let sol, solHtml;
    if (goal === 0) { sol = `a = ${K.r2}，b = ${K.r1}`; solHtml = `\\(a = ${K.r2}\\)、\\(b = ${K.r1}\\)`; }
    else if (goal === 1) { sol = `a = ${K.r2}，b ≠ ${K.r1}`; solHtml = `\\(a = ${K.r2}\\)、\\(b \\ne ${K.r1}\\)`; }
    else { sol = `a ≠ ${K.r2}（b 為任意數）`; solHtml = `\\(a \\ne ${K.r2}\\)（\\(b\\) 為任意數）`; }
    textLeft(ctx, '要符合，必須', 22, 446, C, f(800, 14));
    drawExpr(ctx, [qlInk(sol, QL_CREAM)], 0, 446, 19, QL_CREAM, { left: 130, maxW: 380 });

    let tip;
    if (goal === 0) tip = '常數多項式：x^2 項、x 項都要消失';
    else if (goal === 1) tip = '「≠」也是條件：x 項要留下，係數就不能是 0';
    else tip = '二次多項式：只要 x^2 項的係數不是 0';
    drawExpr(ctx, [qlInk(tip, MUTED)], 270, 482, 13.5, MUTED);

    out.innerHTML = wbrEq(`${subStr} = ${pyStr(p)}`);
    fb.innerHTML = wrapFeedback(match
      ? `\\(a = ${a}\\)、\\(b = ${b}\\) 時式子是 \\(${pyStr(p)}\\)，<b style="color:${C}">符合</b>「${PA_GOAL[goal]}」。`
      : `現在是${kind}，還不是「${PA_GOAL[goal]}」。要符合，必須 ${solHtml}。`);
    typeset([out, fb]);
  }

  bindPickGroup(tplG, 'data-pa-tpl', v => { tpl = v; draw(); });
  bindPickGroup(goalG, 'data-pa-goal', v => { goal = parseInt(v, 10); draw(); });
  [aS, bS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 5：布條排序架——升冪、降冪，符號跟著項一起搬
   ========================================================================== */
const OD_SETS = {
  p1: [[3, 2], [-5, 0], [2, 3], [-1, 1]],
  p2: [[-1, 1], [7, 0], [4, 3]],
  p3: [[1, 0], [-6, 2], [2, 1], [-3, 3]]
};

function initOrderCanvas() {
  const cv = document.getElementById('canvas-order');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = document.getElementById('od-p-group');
  const mG = document.getElementById('od-mode-group');
  const out = document.getElementById('od-formula');
  const fb = document.getElementById('od-feedback');
  const C = QL_TONE[4];
  let set = 'p1';
  let mode = 'desc';

  const W = 100, H = 60, STEP = 120;

  // 一張布條：寫出「這一項在這個位置上的樣子」，首項的「+」省略
  function card(x, y, c, d, first) {
    const col = PY_DEG_COL[d];
    qlPatch(ctx, x, y, W, H, col, { alpha: 0.24 });
    const body = pyBody(Math.abs(c), d);
    const s = first ? (c < 0 ? '-' : '') + body : (c < 0 ? '-' : '+') + body;
    drawExpr(ctx, [qlInk(s, QL_CREAM)], x + W / 2, y + 24, 21, QL_CREAM, { maxW: W - 8 });
    textCenter(ctx, `${d} 次`, x + W / 2, y + 49, MUTED, f(700, 12));
  }

  function draw() {
    const orig = OD_SETS[set];
    const idx = orig.map((t, i) => i);
    if (mode === 'desc') idx.sort((i, j) => orig[j][1] - orig[i][1]);
    else if (mode === 'asc') idx.sort((i, j) => orig[i][1] - orig[j][1]);
    const arr = idx.map(i => orig[i]);
    const n = orig.length;
    const x0 = 270 - (n * STEP - (STEP - W)) / 2;
    const origStr = pyJoin(orig);
    const arrStr = pyJoin(arr);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '布條排序架：符號跟著項一起搬', C);
    textLeft(ctx, '原來的順序', 22, 62, MUTED, f(800, 14));
    orig.forEach((t, i) => card(x0 + i * STEP, 76, t[0], t[1], i === 0));

    // 每一張布條從上面的位置連到下面的新位置
    idx.forEach((oi, ni) => {
      const col = PY_DEG_COL[orig[oi][1]];
      ctx.save();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x0 + oi * STEP + W / 2, 140);
      ctx.lineTo(x0 + ni * STEP + W / 2, 254);
      ctx.stroke();
      ctx.restore();
    });

    arr.forEach((t, i) => card(x0 + i * STEP, 258, t[0], t[1], i === 0));
    const lab = mode === 'desc' ? '降冪排列：次數由大到小' : (mode === 'asc' ? '升冪排列：次數由小到大' : '還沒排列（和上面一樣）');
    textLeft(ctx, lab, 22, 340, C, f(800, 14));

    drawEqPanel(ctx, [qlInk(arrStr, QL_CREAM)], 392, C, { h: 28, size: 24 });

    // 首項的「+」會隱藏或出現：把位置變動造成的符號變化寫出來
    const notes = [];
    idx.forEach((oi, ni) => {
      const [c, d] = orig[oi];
      const body = pyBody(Math.abs(c), d);
      if (oi === ni) return;
      if (c < 0 && ni === 0) notes.push(`-${body} 搬到最前面，負號要跟著走`);
      else if (c > 0 && oi === 0) notes.push(`${body} 原本在最前面沒寫「+」，搬到後面要補上「+」`);
      else if (c > 0 && ni === 0) notes.push(`+${body} 搬到最前面，前面的「+」可以省略`);
    });
    if (mode === 'orig') notes.push('按「升冪」或「降冪」，看布條怎麼換位置');
    else if (!notes.length) notes.push('每一項的正負號都跟著自己走，不會因為換位置而改變');
    notes.slice(0, 2).forEach((s, i) => {
      drawExpr(ctx, [qlInk(s, i === 0 ? INK : MUTED)], 270, 446 + i * 26, 14, INK, { maxW: 500 });
    });

    out.innerHTML = wbrEq(`${origStr} = ${arrStr}`);
    fb.innerHTML = wrapFeedback(mode === 'orig'
      ? `\\(${origStr}\\) 還沒排列。按「升冪」或「降冪」試試看。`
      : `${mode === 'desc' ? '降冪（次數由大到小）' : '升冪（次數由小到大）'}：\\(${arrStr}\\)。`
        + `換位置只改順序，每一項<b style="color:${C}">連同自己的正負號</b>一起搬，值不變。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-od-p', v => { set = v; draw(); });
  bindPickGroup(mG, 'data-od-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 6：布塊合併桌——同類項才能合起來
   ========================================================================== */
function initTileCanvas() {
  const cv = document.getElementById('canvas-tile');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const ids = ['a2', 'a1', 'a0', 'b2', 'b1', 'b0'];
  const S = {}, V = {};
  ids.forEach(k => { S[k] = document.getElementById('tl-' + k); V[k] = document.getElementById('tl-v' + k); });
  const out = document.getElementById('tl-formula');
  const fb = document.getElementById('tl-feedback');
  const C = QL_TONE[5];

  const SQ = 40, U = 12;   // 大方布邊長 x、小方布邊長 1（示意，不是真的比例）

  function big(x, y) {
    qlPatch(ctx, x, y, SQ, SQ, QL_ROSE, { alpha: 0.32 });
    drawExpr(ctx, [qlInk('x^2', QL_CREAM)], x + SQ / 2, y + SQ / 2, 12, QL_CREAM);
  }
  function strip(x, y) { qlPatch(ctx, x, y, U, SQ, QL_MUSTARD, { alpha: 0.4, stitch: false }); }
  function unit(x, y) { qlPatch(ctx, x, y, U, U, QL_TEAL, { alpha: 0.45, stitch: false }); }

  // 一個人的布：第一排大方布與長條，第二排小方布
  function owner(bx, name, p) {
    drawPanel(ctx, bx, 44, 246, 152, INK, 0.04);
    textCenter(ctx, name, bx + 123, 60, INK, f(800, 14));
    let x = bx + 12;
    for (let i = 0; i < p[2]; i++) { big(x, 74); x += SQ + 6; }
    if (p[2]) x += 4;
    for (let i = 0; i < p[1]; i++) { strip(x, 74); x += U + 6; }
    for (let i = 0; i < p[0]; i++) unit(bx + 12 + i * 18, 126);
    drawExpr(ctx, [qlInk(pyStr(p), QL_CREAM)], bx + 123, 172, 19, QL_CREAM, { maxW: 230 });
  }

  function draw() {
    const v = {};
    ids.forEach(k => { v[k] = parseInt(S[k].value, 10); V[k].textContent = v[k]; });
    const A = [v.a0, v.a1, v.a2], B = [v.b0, v.b1, v.b2];
    const R = pyAdd(A, B);
    const pieces = A.concat(B).reduce((s, c) => s + c, 0);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '布塊合併桌：同樣大小的才能合起來', C);
    owner(16, '小禾的布', A);
    owner(278, '阿森的布', B);

    drawPanel(ctx, 16, 210, 508, 162, C, 0.05);
    textCenter(ctx, '合起來：同樣大小的放同一堆', 270, 228, C, f(800, 14));

    // 大方布堆：每排 3 塊
    const n2 = R[2], n1 = R[1], n0 = R[0];
    for (let i = 0; i < n2; i++) {
      const cols = Math.min(n2 - Math.floor(i / 3) * 3, 3);
      const rx = 100 - (cols * SQ + (cols - 1) * 6) / 2;
      big(rx + (i % 3) * (SQ + 6), 244 + Math.floor(i / 3) * (SQ + 6));
    }
    // 長條堆：一排
    for (let i = 0; i < n1; i++) strip(270 - (n1 * 16 - 4) / 2 + i * 16, 254);
    // 小方布堆：每排 4 塊
    for (let i = 0; i < n0; i++) {
      const cols = Math.min(n0 - Math.floor(i / 4) * 4, 4);
      unit(440 - (cols * 18 - 6) / 2 + (i % 4) * 18, 254 + Math.floor(i / 4) * 18);
    }
    [[100, n2, v.a2, v.b2, '大方布'], [270, n1, v.a1, v.b1, '長條'], [440, n0, v.a0, v.b0, '小方布']].forEach(([cx, n, a, b, nm]) => {
      if (!n) textCenter(ctx, '（沒有）', cx, 290, DIM, f(700, 13));
      textCenter(ctx, `${nm} ${a} + ${b} = ${n}`, cx, 354, MUTED, f(700, 13.5));
    });

    // 只列出有布的次數
    const parts = [];
    [2, 1, 0].forEach(d => {
      if (A[d] || B[d]) parts.push(`(${A[d]} + ${B[d]})${PY_VAR[d]}`);
    });
    const mid = parts.length ? parts.join(' + ') : '0';
    drawExpr(ctx, [qlInk(`(${pyStr(A)}) + (${pyStr(B)})`, INK)], 270, 404, 19, INK, { maxW: 500 });
    drawExpr(ctx, [qlInk(`= ${mid}`, INK)], 270, 442, 19, INK, { maxW: 500 });
    drawExpr(ctx, [qlInk(`= ${pyStr(R)}`, C)], 270, 480, 21, C, { maxW: 500 });
    textCenter(ctx, `一共 ${pieces} 塊布，但大小不同，不能直接寫成 ${pieces}`, 270, 508, MUTED, f(700, 12.5));

    out.innerHTML = wbrEq(`(${pyStr(A)}) + (${pyStr(B)}) = ${pyStr(R)}`);
    fb.innerHTML = wrapFeedback(`大方布 \\(${v.a2} + ${v.b2} = ${n2}\\) 塊、長條 \\(${v.a1} + ${v.b1} = ${n1}\\) 條、`
      + `小方布 \\(${v.a0} + ${v.b0} = ${n0}\\) 塊，合起來是 \\(${pyStr(R)}\\)。`
      + `雖然一共有 \\(${pieces}\\) 塊，但<b style="color:${C}">大小不同的布不能直接相加</b>。`);
    typeset([out, fb]);
  }

  ids.forEach(k => S[k].addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：直式對齊台——缺項補 0，同類項才會在同一欄
   ========================================================================== */
const CO_SETS = {
  p1: { A: [-4, 0, 3], B: [2, 5, 1] },        // (3x² − 4) + (x² + 5x + 2)
  p2: { A: [-1, 2, 0, 1], B: [6, -2, 3] },    // (x³ + 2x − 1) + (3x² − 2x + 6)
  p3: { A: [0, 3, -2], B: [-5, 1, 2] },       // (−2x² + 3x) + (2x² + x − 5)
  p4: { A: [0, 0, -1, 4], B: [7, -2] }        // (4x³ − x²) + (−2x + 7)
};

// 直式格子的欄位中心：欄 i = 0 是最高次
function pyColX(i, nCol) {
  const L = 96, R = 520;
  return L + (R - L) / nCol * (i + 0.5);
}

function initColCanvas() {
  const cv = document.getElementById('canvas-col');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = document.getElementById('co-p-group');
  const mG = document.getElementById('co-mode-group');
  const out = document.getElementById('co-formula');
  const fb = document.getElementById('co-feedback');
  const C = QL_TONE[6];
  let set = 'p1';
  let mode = 'pad';

  const YA = 112, YB = 158, YL = 184, YR = 216;

  function draw() {
    const { A, B } = CO_SETS[set];
    const R = pyAdd(A, B);
    const D = Math.max(pyDeg(A), pyDeg(B));
    const nCol = D + 1;
    const cw = (520 - 96) / nCol;
    const eq = `(${pyStr(A)}) + (${pyStr(B)}) = ${pyStr(R)}`;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '直式對齊台：同類項要排在同一欄', C);

    // 欄位標題
    for (let i = 0; i < nCol; i++) {
      const d = D - i;
      drawExpr(ctx, [qlInk(pyTermName(d), mode === 'pad' ? PY_DEG_COL[d] : DIM)], pyColX(i, nCol), 66, 14, MUTED);
    }
    textCenter(ctx, '+)', 52, YB, INK, f(800, 18));
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, YL);
    ctx.lineTo(522, YL);
    ctx.stroke();
    ctx.restore();

    const bad = [];
    if (mode === 'pad') {
      for (let i = 0; i < nCol; i++) {
        const d = D - i, x = pyColX(i, nCol);
        [[A, YA], [B, YB]].forEach(([p, y]) => {
          const c = p[d] || 0;
          drawExpr(ctx, [qlInk(pyCell(c, d, i === 0), c === 0 ? DIM : QL_CREAM)], x, y, 19, QL_CREAM, { maxW: cw - 6 });
          if (c === 0) textCenter(ctx, '補 0', x, y + 21, QL_ROSE, f(700, 11));
        });
        const r = R[d] || 0;
        drawExpr(ctx, [qlInk(pyCell(r, d, i === 0), r === 0 ? DIM : C)], x, YR, 20, C, { maxW: cw - 6 });
      }

      textLeft(ctx, '橫式驗算', 22, 268, C, f(800, 14));
      drawExpr(ctx, [qlInk(eq, INK)], 0, 268, 18, INK, { left: 110, maxW: 410 });
      textLeft(ctx, '次數', 22, 314, C, f(800, 14));
      const dA = pyDeg(A), dB = pyDeg(B), dR = pyDeg(R);
      textLeft(ctx, `${PY_CN[dA]}次 + ${PY_CN[dB]}次 → ${dR < 0 ? '0' : PY_CN[dR] + '次'}`, 110, 314, INK, f(800, 16));
      let note;
      if (dR < Math.max(dA, dB)) {
        const t = Math.max(dA, dB);
        note = `${PY_VAR[t]} 項：${A[t]} + ${B[t] < 0 ? '(' + B[t] + ')' : B[t]} = 0，互相抵消，次數變低了`;
      } else if (dA !== dB) {
        note = `最高次的 ${PY_VAR[Math.max(dA, dB)]} 項沒有別的項能抵消，次數不變`;
      } else {
        note = '兩個最高次項加起來不是 0，次數不變';
      }
      drawExpr(ctx, [qlInk(note, dR < Math.max(dA, dB) ? QL_ROSE : MUTED)], 0, 356, 15, MUTED, { left: 110, maxW: 410 });
      textCenter(ctx, '缺項的位置補 0（或留空位），同類項才會排在同一欄', 270, 420, INK, f(700, 14));
    } else {
      // 不補 0：各列的項直接靠右擠
      const LA = pyList(A), LB = pyList(B);
      const colA = {}, colB = {};
      LA.forEach((t, k) => { colA[nCol - LA.length + k] = t; });
      LB.forEach((t, k) => { colB[nCol - LB.length + k] = t; });
      for (let i = 0; i < nCol; i++) {
        const x = pyColX(i, nCol);
        const ta = colA[i], tb = colB[i];
        const clash = ta && tb && ta[1] !== tb[1];
        if (clash) {
          bad.push([ta, tb]);
          drawPanel(ctx, x - cw / 2 + 4, 90, cw - 8, 146, NO_COLOR, 0.10);
        }
        if (ta) drawExpr(ctx, [qlInk(pyCell(ta[0], ta[1], i === 0 || !colA[i - 1]), clash ? NO_COLOR : QL_CREAM)], x, YA, 19, QL_CREAM, { maxW: cw - 10 });
        if (tb) drawExpr(ctx, [qlInk(pyCell(tb[0], tb[1], i === 0 || !colB[i - 1]), clash ? NO_COLOR : QL_CREAM)], x, YB, 19, QL_CREAM, { maxW: cw - 10 });
        if (clash) {
          textCenter(ctx, '?', x, YR, NO_COLOR, f(800, 22));
        } else if (ta || tb) {
          const c = (ta ? ta[0] : 0) + (tb ? tb[0] : 0);
          const d = (ta || tb)[1];
          drawExpr(ctx, [qlInk(pyCell(c, d, i === 0), c === 0 ? DIM : C)], x, YR, 20, C, { maxW: cw - 10 });
        }
      }
      if (bad.length) {
        textCenter(ctx, '上下兩項的次數不同，卻擠在同一欄！', 270, 266, NO_COLOR, f(800, 16));
        bad.slice(0, 2).forEach(([ta, tb], k) => {
          const s1 = (ta[0] < 0 ? '-' : '') + pyBody(Math.abs(ta[0]), ta[1]);
          const s2 = (tb[0] < 0 ? '-' : '') + pyBody(Math.abs(tb[0]), tb[1]);
          drawExpr(ctx, [qlInk(`${s1} 和 ${s2} 不是同類項，不能相加`, INK)], 270, 306 + k * 36, 16, INK, { maxW: 500 });
        });
      } else {
        textCenter(ctx, '這一題剛好沒有錯欄，但這只是巧合', 270, 266, QL_MUSTARD, f(800, 16));
      }
      textCenter(ctx, '改回「補 0 對齊」，讓同類項排在同一欄', 270, 420, MUTED, f(700, 14));
    }

    out.innerHTML = wbrEq(eq);
    fb.innerHTML = wrapFeedback(mode === 'pad'
      ? `缺項補 \\(0\\) 之後，每一欄都是同類項，逐欄相加得 \\(${pyStr(R)}\\)。`
      : `沒有補 \\(0\\)，有 <b style="color:${C}">${bad.length} 欄</b>上下兩項不是同類項，加不下去。缺項的位置要補 \\(0\\)（或留空位）。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-co-p', v => { set = v; draw(); });
  bindPickGroup(mG, 'data-co-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 8：減法檢查台——橫式、直式與常見錯誤
   ========================================================================== */
const SB_SETS = {
  p1: { A: [-5, 2, 3], B: [1, -4, 1] },         // (3x² + 2x − 5) − (x² − 4x + 1)
  p2: { A: [7, -2, 0, 1], B: [-3, 0, 1, 2] },   // (x³ − 2x + 7) − (2x³ + x² − 3)
  p3: { A: [0, 1, -4], B: [-2, 5, -1] }         // (−4x² + x) − (−x² + 5x − 2)
};

// 兩式相加減時，按次數把同類項分組：(3x^2 - x^2) + (2x + 4x) + (-5 - 1)
function pyGroups(P, Q) {
  const D = Math.max(P.length, Q.length) - 1;
  let s = '';
  for (let d = D; d >= 0; d--) {
    const a = P[d] || 0, b = Q[d] || 0;
    if (!a && !b) continue;
    if (a && b) {
      const g = '(' + pyJoin([[a, d], [b, d]]) + ')';
      s += s ? ' + ' + g : g;
    } else {
      const c = a || b;
      const body = pyBody(Math.abs(c), d);
      if (!s) s = (c < 0 ? '-' : '') + body;
      else s += (c < 0 ? ' - ' : ' + ') + body;
    }
  }
  return s || '0';
}

function initSubCanvas() {
  const cv = document.getElementById('canvas-sub');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = document.getElementById('sb-p-group');
  const mG = document.getElementById('sb-mode-group');
  const out = document.getElementById('sb-formula');
  const fb = document.getElementById('sb-feedback');
  const C = QL_TONE[7];
  let set = 'p1';
  let mode = 'h';

  function draw() {
    const { A, B } = SB_SETS[set];
    const NB = pyNeg(B);
    const R = pyAdd(A, NB);
    const LA = pyList(A), LNB = pyList(NB);
    const head = `(${pyStr(A)}) - (${pyStr(B)})`;

    ctx.clearRect(0, 0, cv.width, cv.height);

    if (mode === 'h') {
      drawTitle(ctx, '減法檢查台：橫式去括號', C);
      drawExpr(ctx, [qlInk('-(a + b) = -a - b', MUTED)], 140, 66, 17, MUTED);
      drawExpr(ctx, [qlInk('-(a - b) = -a + b', MUTED)], 400, 66, 17, MUTED);
      const rows = [
        { name: '① 原式', hint: '括號前是減號', items: [qlInk(head, INK)] },
        { name: '② 去括號', hint: '括號裡每一項都變號', items: [qlInk(pyJoin(LA.concat(LNB)), QL_ROSE)], color: QL_ROSE },
        { name: '③ 同類項分組', hint: '按次數放在一起', items: [qlInk(pyGroups(A, NB), INK)] },
        { name: '④ 合併', hint: '係數相加減', items: [qlInk(pyStr(R), C)] }
      ];
      drawStepRows(ctx, rows, 4, { top: 128, gap: 76, labX: 22, eqX: 150, size: 19, color: C });
      textCenter(ctx, '括號裡的「每一項」都要變號，不是只有第一項', 270, 456, INK, f(700, 14));
    } else if (mode === 'v') {
      drawTitle(ctx, '減法檢查台：直式每一欄都是上減下', C);
      const D = Math.max(pyDeg(A), pyDeg(B));
      const nCol = D + 1;
      const cw = (520 - 96) / nCol;
      for (let i = 0; i < nCol; i++) {
        const d = D - i;
        drawExpr(ctx, [qlInk(pyTermName(d), PY_DEG_COL[d])], pyColX(i, nCol), 62, 14, MUTED);
        [[A, 104], [B, 148]].forEach(([p, y]) => {
          const c = p[d] || 0;
          drawExpr(ctx, [qlInk(pyCell(c, d, i === 0), c === 0 ? DIM : QL_CREAM)], pyColX(i, nCol), y, 19, QL_CREAM, { maxW: cw - 6 });
        });
        const r = R[d] || 0;
        drawExpr(ctx, [qlInk(pyCell(r, d, i === 0), r === 0 ? DIM : C)], pyColX(i, nCol), 206, 20, C, { maxW: cw - 6 });
      }
      textCenter(ctx, '−)', 52, 148, QL_ROSE, f(800, 18));
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(36, 174);
      ctx.lineTo(522, 174);
      ctx.stroke();
      ctx.restore();

      textLeft(ctx, '逐欄計算（上減下）', 22, 250, C, f(800, 14));
      for (let i = 0; i < nCol; i++) {
        const d = D - i;
        const a = A[d] || 0, b = B[d] || 0, r = R[d] || 0;
        const bs = b < 0 ? `(${b})` : String(b);
        const s = `${d === 0 ? '常數' : PY_VAR[d]} 欄：${a} - ${bs} = ${r}`;
        drawExpr(ctx, [qlInk(s, INK)], 0, 290 + i * 38, 17, INK, { left: 40, maxW: 460 });
      }
      textCenter(ctx, '也可以把下面那一列全部變號，改成直式加法', 270, 456, MUTED, f(700, 14));
    } else {
      drawTitle(ctx, '減法檢查台：只變第一項的號，錯在哪？', C);
      // 錯法：只有 B 的第一項（最高次項）變號，其餘照抄
      const top = pyDeg(B);
      const BW = B.map((c, d) => (d === top ? -c : c));
      const W = pyAdd(A, BW);
      const LW = pyList(BW);
      const rows = [
        { name: '① 原式', hint: '括號前是減號', items: [qlInk(head, INK)] },
        { name: '② 錯的去括號', hint: '只有第一項變號', items: [qlInk(pyJoin(LA.concat(LW)), NO_COLOR)], color: NO_COLOR },
        { name: '③ 錯的結果', hint: '後面幾項的號都錯了', items: [qlInk(pyStr(W), NO_COLOR)], color: NO_COLOR },
        { name: '④ 正確去括號', hint: '每一項都變號', items: [qlInk(pyJoin(LA.concat(LNB)), OK_COLOR)], color: OK_COLOR },
        { name: '⑤ 正確結果', hint: '合併同類項', items: [qlInk(pyStr(R), OK_COLOR)], color: OK_COLOR }
      ];
      drawStepRows(ctx, rows, 5, { top: 78, gap: 70, labX: 22, eqX: 150, size: 19, color: C });
      textCenter(ctx, '括號前是減號，括號裡「每一項」都要變號', 270, 440, INK, f(700, 14));
    }

    out.innerHTML = wbrEq(`${head} = ${pyStr(R)}`);
    let msg;
    if (mode === 'h') msg = `去括號時 \\(${pyStr(B)}\\) 的每一項都變號，變成 \\(${pyStr(NB)}\\)，合併後得 \\(${pyStr(R)}\\)。`;
    else if (mode === 'v') msg = `直式要<b style="color:${C}">每一欄都上減下</b>，不能只有第一欄記得減。`;
    else msg = `只變第一項的號，後面幾項等於被加了回去，答案就錯了。正確答案是 \\(${pyStr(R)}\\)。`;
    fb.innerHTML = wrapFeedback(msg);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-sb-p', v => { set = v; draw(); });
  bindPickGroup(mG, 'data-sb-mode', v => { mode = v; draw(); });
  draw();
}

/* ==========================================================================
   重點 9：去括號步驟機——由內而外
   ========================================================================== */
const MX_SETS = {
  p1: [
    { name: '① 原式', hint: '先看中括號裡面', s: '(2x^2 + x - 3) - [(x^2 - 4) + (3x - 1)]',
      why: '中括號裡有兩個小括號，先處理它們' },
    { name: '② 去小括號', hint: '加號後面的括號直接去掉', s: '(2x^2 + x - 3) - [x^2 - 4 + 3x - 1]',
      why: '小括號前是加號，括號裡的符號都不變' },
    { name: '③ 中括號裡合併', hint: '先整理成一個多項式', s: '(2x^2 + x - 3) - [x^2 + 3x - 5]',
      why: '-4 - 1 = -5，中括號裡剩三項' },
    { name: '④ 去中括號', hint: '前面是減號，每一項都變號', s: '2x^2 + x - 3 - x^2 - 3x + 5', color: QL_ROSE,
      why: 'x^2 變 -x^2、3x 變 -3x、-5 變 +5' },
    { name: '⑤ 合併同類項', hint: '答案寫成降冪', s: 'x^2 - 2x + 2',
      why: '2x^2 - x^2 = x^2，x - 3x = -2x，-3 + 5 = 2' }
  ],
  p2: [
    { name: '① 原式', hint: '先看中括號裡面', s: '(5x - x^2) - [(2x^2 + 3) - (x - 6)]',
      why: '中括號裡有一個減號，要特別注意' },
    { name: '② 去小括號', hint: '減號後面的括號要變號', s: '(5x - x^2) - [2x^2 + 3 - x + 6]',
      why: '-(x - 6) = -x + 6' },
    { name: '③ 中括號裡合併', hint: '先整理成一個多項式', s: '(5x - x^2) - [2x^2 - x + 9]',
      why: '3 + 6 = 9，中括號裡剩三項' },
    { name: '④ 去中括號', hint: '前面是減號，每一項都變號', s: '5x - x^2 - 2x^2 + x - 9', color: QL_ROSE,
      why: '2x^2 變 -2x^2、-x 變 +x、9 變 -9' },
    { name: '⑤ 合併同類項', hint: '答案寫成降冪', s: '-3x^2 + 6x - 9',
      why: '-x^2 - 2x^2 = -3x^2，5x + x = 6x' }
  ],
  p3: [
    { name: '① 原式', hint: '先看中括號裡面', s: '(x^2 + 7) + [(4x - x^2) - (3x^2 + 2x)]',
      why: '這一題中括號前面是加號' },
    { name: '② 去小括號', hint: '減號後面的括號要變號', s: '(x^2 + 7) + [4x - x^2 - 3x^2 - 2x]',
      why: '-(3x^2 + 2x) = -3x^2 - 2x' },
    { name: '③ 中括號裡合併', hint: '先整理成一個多項式', s: '(x^2 + 7) + [-4x^2 + 2x]',
      why: '-x^2 - 3x^2 = -4x^2，4x - 2x = 2x' },
    { name: '④ 去中括號', hint: '前面是加號，符號不變', s: 'x^2 + 7 - 4x^2 + 2x', color: QL_MUSTARD,
      why: '中括號前是加號，直接去掉，每一項的符號都不變' },
    { name: '⑤ 合併同類項', hint: '答案寫成降冪', s: '-3x^2 + 2x + 7',
      why: 'x^2 - 4x^2 = -3x^2，再把各項按降冪排好' }
  ]
};

// qlParse 只認小括號；中括號另外包成會跟著長高的 [ ]（GRP 的 '[]'）
function mxInk(s, color) {
  const i = s.indexOf('['), j = s.lastIndexOf(']');
  if (i < 0 || j < i) return qlInk(s, color);
  const items = qlParse(s.slice(0, i), color);
  items.push(GRP([qlInk(s.slice(i + 1, j), color)], '[]', color));
  return SEQ(items.concat(qlParse(s.slice(j + 1), color)), color, 1);
}

function initMixCanvas() {
  const cv = document.getElementById('canvas-mix');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pG = document.getElementById('mx-p-group');
  const prev = document.getElementById('mx-prev');
  const next = document.getElementById('mx-next');
  const all = document.getElementById('mx-all');
  const counter = document.getElementById('mx-step');
  const out = document.getElementById('mx-formula');
  const fb = document.getElementById('mx-feedback');
  const C = QL_TONE[8];
  let set = 'p1';
  let step = 1;

  function draw() {
    const steps = MX_SETS[set];
    const n = steps.length;
    step = clamp(step, 1, n);
    counter.textContent = `${step} / ${n}`;
    prev.disabled = (step === 1);
    next.disabled = (step === n);
    all.disabled = (step === n);
    const cur = steps[step - 1];

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '去括號步驟機：由內而外', C);
    const rows = steps.map((s, i) => ({
      name: s.name, hint: s.hint,
      items: [mxInk(s.s, i === n - 1 ? C : (s.color || INK))],
      color: s.color
    }));
    drawStepRows(ctx, rows, step, { top: 82, gap: 76, labX: 22, eqX: 160, size: 19, color: C });
    drawExpr(ctx, [qlInk(cur.why, cur.color || QL_CREAM)], 270, 452, 15, INK, { maxW: 500 });

    out.innerHTML = wbrEq(cur.s);
    fb.innerHTML = wrapFeedback(step === n
      ? `答案是 \\(${cur.s}\\)。步驟是<b style="color:${C}">先處理中括號裡面，再去中括號，最後合併同類項</b>。`
      : `第 ${step} 步：${cur.hint}。按「下一步」繼續。`);
    typeset([out, fb]);
  }

  bindPickGroup(pG, 'data-mx-p', v => { set = v; step = 1; draw(); });
  prev.addEventListener('click', () => { step -= 1; draw(); });
  next.addEventListener('click', () => { step += 1; draw(); });
  all.addEventListener('click', () => { step = MX_SETS[set].length; draw(); });
  draw();
}

/* ==========================================================================
   重點 10：補布計算台——由 A、B、C 的關係反求 A
   ========================================================================== */
const FD_C = [-2, 1, 3];   // C = 3x² + x − 2（固定）

function initFindCanvas() {
  const cv = document.getElementById('canvas-find');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const mG = document.getElementById('fd-mode-group');
  const S = [0, 1, 2].map(d => document.getElementById('fd-s' + d));
  const V = [0, 1, 2].map(d => document.getElementById('fd-v' + d));
  const out = document.getElementById('fd-formula');
  const fb = document.getElementById('fd-feedback');
  const C = QL_TONE[9];
  let mode = 'add';

  function draw() {
    const B = S.map(s => parseInt(s.value, 10));
    V.forEach((el, d) => { el.textContent = B[d]; });
    const Cp = FD_C;
    const sB = pyStr(B), sC = pyStr(Cp);
    // wrong：最常見的錯法真的算一次（開發約束 29：誘答要能被錯誤產生出來）
    let A, rel, solve, expand, expandHint, check, checkStr, wrongName, wrong;
    if (mode === 'add') {
      A = pyAdd(Cp, pyNeg(B));
      rel = `A + (${sB}) = ${sC}`;
      solve = `A = (${sC}) - (${sB})`;
      expand = pyJoin(pyList(Cp).concat(pyList(pyNeg(B))));
      expandHint = '減號後面的每一項都變號';
      check = pyAdd(A, B);
      checkStr = `(${pyStr(A)}) + (${sB}) = ${pyStr(check)}`;
      wrongName = 'B - C';
      wrong = pyAdd(B, pyNeg(Cp));
    } else if (mode === 'sub') {
      A = pyAdd(Cp, B);
      rel = `A - (${sB}) = ${sC}`;
      solve = `A = (${sC}) + (${sB})`;
      expand = pyJoin(pyList(Cp).concat(pyList(B)));
      expandHint = '加號後面的括號直接去掉';
      check = pyAdd(A, pyNeg(B));
      checkStr = `(${pyStr(A)}) - (${sB}) = ${pyStr(check)}`;
      wrongName = 'C - B';
      wrong = pyAdd(Cp, pyNeg(B));
    } else {
      A = pyAdd(B, pyNeg(Cp));
      rel = `(${sB}) - A = ${sC}`;
      solve = `A = (${sB}) - (${sC})`;
      expand = pyJoin(pyList(B).concat(pyList(pyNeg(Cp))));
      expandHint = '減號後面的每一項都變號';
      check = pyAdd(B, pyNeg(A));
      checkStr = `(${sB}) - (${pyStr(A)}) = ${pyStr(check)}`;
      wrongName = 'C - B';
      wrong = pyAdd(Cp, pyNeg(B));
    }
    // 加減的順序寫反時，答案剛好是 −A；A − B = C 寫成 C − B 則是把該加的減掉
    const wrongTail = mode === 'sub' ? '把該加回去的 B 減掉了' : '每一項都差一個負號';
    const ruleTxt = { add: 'A + B = C，所以 A = C - B', sub: 'A - B = C，所以 A = C + B', rsub: 'B - A = C，所以 A = B - C' }[mode];
    const okCheck = pyStr(check) === sC;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, '補布計算台：求出未知的多項式 A', C);
    drawExpr(ctx, [qlInk(ruleTxt, MUTED)], 270, 60, 16, MUTED);
    const rows = [
      { name: '① 已知', hint: '把 B、C 代進去', items: [qlInk(rel, INK)] },
      { name: '② 反過來求 A', hint: ruleTxt.split('，')[1], items: [qlInk(solve, INK)] },
      { name: '③ 去括號', hint: expandHint, items: [qlInk(expand, INK)] },
      { name: '④ 合併同類項', hint: '得到 A', items: [qlInk(`A = ${pyStr(A)}`, C)], color: C },
      { name: '⑤ 驗算', hint: '代回原來的關係', items: [qlInk(checkStr, okCheck ? OK_COLOR : NO_COLOR)], color: okCheck ? OK_COLOR : NO_COLOR }
    ];
    drawStepRows(ctx, rows, 5, { top: 102, gap: 68, labX: 22, eqX: 160, size: 19, color: C });
    textCenter(ctx, okCheck ? '驗算的結果正好是 C，A 求對了' : '驗算不等於 C，哪裡算錯了', 270, 424, okCheck ? OK_COLOR : NO_COLOR, f(800, 14));
    // B = 0 或 B = C 這類邊界，錯法剛好也得到 A：不能再說「差一個負號」（開發約束 27）
    const wrongNote = pyStr(wrong) === pyStr(A)
      ? `這組 B 剛好讓 ${wrongName} 也等於 A，換一組 B 就看得出差別`
      : `常見錯誤：寫成 ${wrongName}，會得到 ${pyStr(wrong)}，${wrongTail}`;
    drawExpr(ctx, [qlInk(wrongNote, MUTED)], 270, 458, 14, MUTED, { maxW: 504 });

    out.innerHTML = wbrEq(`${solve} = ${pyStr(A)}`);
    fb.innerHTML = wrapFeedback(`\\(A = ${pyStr(A)}\\)。代回去驗算：${wbrEq(checkStr)}，`
      + `<b style="color:${C}">正好等於 \\(C\\)</b>。`);
    typeset([out, fb]);
  }

  bindPickGroup(mG, 'data-fd-mode', v => { mode = v; draw(); });
  S.forEach(s => s.addEventListener('input', draw));
  draw();
}
