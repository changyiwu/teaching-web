document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initStepsCanvas();
  initCountCanvas();
  initSwapCanvas();
  initPackCanvas();
  initAskCanvas();
  initCheckCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Section 2 / 1-3 (12 Quizzes)
  const answers = {
    '2-1-3-1': 'B',  // 兩條式子不能來自同一句話
    '2-1-3-2': 'D',  // 3x+4y=620、5x+2y=660
    '2-1-3-3': 'A',  // 數件數 x+y=12、數金額 35x+25y=380
    '2-1-3-4': 'C',  // 筆記本 6 本（鉛筆 8 枝是誘答）
    '2-1-3-5': 'D',  // 少的那一邊補差額：30x+45y+150=45x+30y
    '2-1-3-6': 'A',  // 41 與 17，問較小的 → 17
    '2-1-3-7': 'C',  // x-5=6y、x+3=7y → y=8、x=53
    '2-1-3-8': 'B',  // x+y=42、x/5+y/4=9 → 男 30 人
    '2-1-3-9': 'A',  // 男 11 女 8 → 全班 19 人
    '2-1-3-10': 'D', // 8 元 11 張、12 元 19 張 → 相差 8 張
    '2-1-3-11': 'C', // 51.5 分不合情境 → 此題無解
    '2-1-3-12': 'B'  // 妹妹 -1 歲不合情境 → 此題無解
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
   2. 本節配色（與 2-1-1、2-1-2 同一套復古車票印刷色）
   ========================================================================== */
const C_INK = '#5eead4';
const C_PAPER = '#fcd34d';
const C_MAGENTA = '#f9a8d4';
const C_SKY = '#7dd3fc';
const C_SLATE = '#cbd5e1';
const C_EMBER = '#fdba74';

/* ==========================================================================
   3. 本節專屬繪圖與字串工具
   ========================================================================== */

// 一句中文題目，畫成一張紙條（可整條反白）
function drawSentence(ctx, x, y, w, text, color, active) {
  const lines = fitLines(ctx, text, w - 28, f(650, 14));
  const h = 16 + lines.length * 20;
  drawPanel(ctx, x, y, w, h, color, active ? 0.16 : 0.06);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = active ? color : MUTED;
  ctx.font = f(650, 14);
  lines.forEach((ln, i) => ctx.fillText(ln, x + 14, y + 18 + i * 20));
  ctx.restore();
  return h;
}

// 檢查清單的一列：綠勾或紅叉加一句說明
function drawCheckRow(ctx, x, y, w, ok, text) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.beginPath();
  ctx.arc(x + 12, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = ok ? 'rgba(52, 211, 153, 0.22)' : 'rgba(251, 113, 133, 0.22)';
  ctx.fill();
  ctx.strokeStyle = ok ? OK_COLOR : NO_COLOR;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = ok ? OK_COLOR : NO_COLOR;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (ok) {
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 11, y + 4);
    ctx.lineTo(x + 17, y - 4);
  } else {
    ctx.moveTo(x + 8, y - 4);
    ctx.lineTo(x + 16, y + 4);
    ctx.moveTo(x + 16, y - 4);
    ctx.lineTo(x + 8, y + 4);
  }
  ctx.stroke();
  ctx.fillStyle = ok ? C_SLATE : NO_COLOR;
  ctx.font = f(650, 13.5);
  const lines = fitLines(ctx, text, w - 34, f(650, 13.5)).slice(0, 1);
  ctx.fillText(lines[0], x + 30, y);
  ctx.restore();
}

/* ==========================================================================
   重點 1：四步驟工作台
   一段中文 → 設未知數 → 兩條式子 → 解 → 帶單位的答案
   ========================================================================== */
function initStepsCanvas() {
  const canvas = document.getElementById('canvas-steps');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('st-formula');
  const fb = document.getElementById('st-feedback');
  const caseGroup = document.getElementById('st-case-group');
  const sS = document.getElementById('st-step-slider');
  const sV = document.getElementById('st-step-val');

  const CASES = [
    {
      title: '動物園門票',
      s1: '小翊買 4 張全票、3 張優待票，共付 430 元',
      s2: '小妍買 2 張全票、5 張優待票，共付 390 元',
      setTx: '設全票每張 x 元、優待票每張 y 元',
      nx: '全票', ny: '優待票', unit: '元', u: '張',
      a1: 4, b1: 3, c1: 430, a2: 2, b2: 5, c2: 390, x: 70, y: 50,
      solve: [
        { n: '②×2', h: '把 x 的係數湊成一樣', e: '4x + 10y = 780' },
        { n: '③－①', h: 'x 抵消，只剩 y', e: '7y = 350，y = 50' },
        { n: '代回①', h: '把 y 換成 50', e: '4x + 150 = 430，x = 70' }
      ]
    },
    {
      title: '飲料攤',
      s1: '小翊買 3 杯紅茶、2 杯綠茶，共付 190 元',
      s2: '小妍買 5 杯紅茶、3 杯綠茶，共付 305 元',
      setTx: '設紅茶每杯 x 元、綠茶每杯 y 元',
      nx: '紅茶', ny: '綠茶', unit: '元', u: '杯',
      a1: 3, b1: 2, c1: 190, a2: 5, b2: 3, c2: 305, x: 40, y: 35,
      solve: [
        { n: '①×3、②×2', h: '把 y 的係數都湊成 6', e: '9x + 6y = 570，10x + 6y = 610' },
        { n: '相減', h: 'y 抵消', e: 'x = 40' },
        { n: '代回①', h: '把 x 換成 40', e: '120 + 2y = 190，y = 35' }
      ]
    },
    {
      title: '置物櫃',
      s1: '租 2 個大櫃、3 個小櫃，共付 350 元',
      s2: '租 1 個大櫃、2 個小櫃，共付 200 元',
      setTx: '設大櫃每個 x 元、小櫃每個 y 元',
      nx: '大櫃', ny: '小櫃', unit: '元', u: '個',
      a1: 2, b1: 3, c1: 350, a2: 1, b2: 2, c2: 200, x: 100, y: 50,
      solve: [
        { n: '②×2', h: '把 x 的係數湊成一樣', e: '2x + 4y = 400' },
        { n: '③－①', h: 'x 抵消，只剩 y', e: 'y = 50' },
        { n: '代回②', h: '把 y 換成 50', e: 'x + 100 = 200，x = 100' }
      ]
    }
  ];

  let idx = 0;

  function drawChips(step) {
    const names = ['① 設未知數', '② 列聯立式', '③ 解聯立式', '④ 寫答案'];
    const w = 118, gap = 9, x0 = 22;
    names.forEach((nm, i) => {
      const on = (i + 1) === step;
      const done = (i + 1) < step;
      const col = on ? C_PAPER : (done ? C_INK : DIM);
      drawChip(ctx, x0 + i * (w + gap), 36, w, 26, nm, col,
        on ? 'rgba(252, 211, 77, 0.20)' : 'rgba(255,255,255,0.04)');
    });
  }

  function draw() {
    const c = CASES[idx];
    const step = parseInt(sS.value, 10);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, c.title + '：四步驟工作台', C_INK);
    drawChips(step);

    // 題目的兩句話一直留在畫面上，第②步時才點亮
    let y = 78;
    const h1 = drawSentence(ctx, 22, y, 496, '句① ' + c.s1, C_PAPER, step >= 2);
    y += h1 + 8;
    const h2 = drawSentence(ctx, 22, y, 496, '句② ' + c.s2, C_PAPER, step >= 2);
    y += h2 + 12;

    if (step === 1) {
      drawNote(ctx, '兩個不知道的量，各給一個名字', y + 8, C_EMBER, 13.5);
      drawPanel(ctx, 22, y + 22, 496, 116, C_EMBER, 0.08);
      [[c.nx, 'x', 146], [c.ny, 'y', 372]].forEach(t => {
        drawTicket(ctx, t[2] - 92, y + 38, 184, 52, C_EMBER, { perf: false });
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = MUTED;
        ctx.font = f(700, 13);
        ctx.fillText(t[0] + '每' + c.u, t[2], y + 54);
        ctx.restore();
        drawExpr(ctx, [IT(t[1], C_PAPER), T('元', C_SLATE)], t[2], y + 77, 22, C_PAPER, {});
      });
      drawNote(ctx, c.setTx, y + 112, C_INK, 14);

      // 為什麼要兩個未知數：把空格處留白會讓這一步看起來沒東西可看
      const why = y + 148;
      drawPanel(ctx, 22, why, 496, 96, C_SKY, 0.06);
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C_SKY;
      ctx.font = f(800, 13);
      ctx.fillText('為什麼要設兩個？', 38, why + 20);
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 12.5);
      const why2 = `題目有${c.nx}與${c.ny}兩個價錢都不知道，只設一個的話，另一個沒有名字，第二句話就寫不成式子。設的時候把「對象」和「單位」一起講完，列式才不會把「幾${c.u}」和「幾元」混在一起。`;
      fitLines(ctx, why2, 452, f(650, 12.5)).slice(0, 4)
        .forEach((ln, i) => ctx.fillText(ln, 38, why + 42 + i * 18));
      ctx.restore();
    } else {
      // 第②步之後，兩條式子固定畫在下半部
      drawPanel(ctx, 22, y, 496, 92, C_INK, 0.07);
      drawBrace(ctx, 68, y + 16, y + 76, C_INK);
      drawExpr(ctx, termItems([{ c: c.a1, v: 'x' }, { c: c.b1, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(c.c1), C_PAPER)]), 0, y + 30, 23, C_SLATE,
        { left: 106, maxW: 300, gap: 6 });
      drawExpr(ctx, termItems([{ c: c.a2, v: 'x' }, { c: c.b2, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(c.c2), C_PAPER)]), 0, y + 62, 23, C_SLATE,
        { left: 106, maxW: 300, gap: 6 });
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 12);
      ctx.fillText('…①', 430, y + 30);
      ctx.fillText('…②', 430, y + 62);
      ctx.restore();
      y += 104;

      if (step === 2) {
        drawNote(ctx, '一句話列一條式子，兩條講的是同一組 x、y', y + 6, C_MAGENTA, 13.5);
      } else if (step === 3) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        c.solve.forEach((r, i) => {
          const cy = y + 16 + i * 34;
          ctx.fillStyle = C_SKY;
          ctx.font = f(800, 13);
          ctx.fillText(r.n, 26, cy - 7);
          ctx.fillStyle = MUTED;
          ctx.font = f(600, 11.5);
          ctx.fillText(r.h, 26, cy + 9);
          drawExpr(ctx, [inkItems(r.e, C_SLATE)], 0, cy, 19, C_SLATE, { left: 176, maxW: 340, gap: 5 });
        });
        ctx.restore();
      } else {
        drawPanel(ctx, 22, y + 4, 496, 92, OK_COLOR, 0.10);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = OK_COLOR;
        ctx.font = f(800, 15);
        ctx.fillText('答：' + c.nx + '每' + c.u + ' ' + c.x + ' 元', 270, y + 32);
        ctx.fillText('　　' + c.ny + '每' + c.u + ' ' + c.y + ' 元', 270, y + 58);
        ctx.fillStyle = MUTED;
        ctx.font = f(650, 12);
        ctx.fillText('數字要翻回中文、帶單位，再確認題目問的就是它', 270, y + 82);
        ctx.restore();
      }
    }

    if (sV) sV.textContent = step;

    if (out) {
      const STEP_TEX = [
        `① 設未知數：設${c.nx}每${c.u} \\(x\\) 元、${c.ny}每${c.u} \\(y\\) 元`,
        `② 列式：` + casesTex(eqTex(c.a1, c.b1, c.c1), eqTex(c.a2, c.b2, c.c2)),
        `③ 解：` + wbrEq(`x = ${c.x}`) + '、' + wbrEq(`y = ${c.y}`),
        `④ 答：${c.nx}每${c.u} \\(${c.x}\\) 元、${c.ny}每${c.u} \\(${c.y}\\) 元`
      ];
      out.innerHTML = STEP_TEX[step - 1];
      typeset([out]);
    }
    if (fb) {
      const MSG = [
        `題目裡有<strong>兩個</strong>不知道的量，所以要設<strong>兩個</strong>未知數。設的時候把對象和單位一起講完：` +
        `「${c.setTx.replace(/x/g, '\\(x\\)').replace(/y/g, '\\(y\\)')}」，之後列式才不會把「幾張」和「幾元」混在一起。`,
        `<strong>一句話列一條式子</strong>：句①給了第①式，句②給了第②式。兩條式子的 \\(x\\) 都是${c.nx}的價錢——` +
        `如果兩條講的不是同一組 \\(x\\)、\\(y\\)，就不能夾成聯立方程式。`,
        `這一步用的是上一節的<strong>加減消去法</strong>：先把某個未知數的係數湊成一樣，相減讓它消失，` +
        `再把求出來的值代回去。<strong>這節的難處不在這裡</strong>，而在前一步的列式。`,
        `\\(x = ${c.x}\\) 只是一個數，答案要寫成「${c.nx}每份 \\(${c.x}\\) 元」這種<strong>帶單位的完整句子</strong>。` +
        `寫完還有兩件事：題目問的是不是這個量（重點 5），這個數字說不說得通（重點 6）。`
      ];
      fb.innerHTML = wrapFeedback(MSG[step - 1]);
      typeset([fb]);
    }
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  if (sS) sS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：兩條式子配對台
   四條候選式子挑兩條，只有「數個數 + 數金額」那一組算得出答案
   ========================================================================== */
function initCountCanvas() {
  const canvas = document.getElementById('canvas-count');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('ct-formula');
  const fb = document.getElementById('ct-feedback');
  const caseGroup = document.getElementById('ct-case-group');
  const pickGroup = document.getElementById('ct-pick-group');
  const aS = document.getElementById('ct-a-slider');
  const bS = document.getElementById('ct-b-slider');
  const aV = document.getElementById('ct-a-val');
  const bV = document.getElementById('ct-b-val');
  const aN = document.getElementById('ct-a-name');
  const bN = document.getElementById('ct-b-name');

  const CASES = [
    { title: '飲料攤', na: '大杯', nb: '小杯', pa: 45, pb: 30, ua: '杯', ub: '杯', uc: '杯' },
    { title: '文具店', na: '筆記本', nb: '鉛筆', pa: 40, pb: 15, ua: '本', ub: '枝', uc: '件' },
    { title: '動物園門票', na: '全票', nb: '優待票', pa: 70, pb: 50, ua: '張', ub: '張', uc: '張' }
  ];
  // 四條候選：①數個數 ②數金額 ③把金額當個數 ④把個數當金額
  const PAIRS = [[0, 1], [0, 2], [1, 3], [2, 3]];

  let idx = 0, pick = 0;

  function state() {
    const c = CASES[idx];
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const N = a + b;
    const M = c.pa * a + c.pb * b;
    return { c, a, b, N, M };
  }

  // 解 { p x + q y = r } 與 { u x + v y = w }
  function solve2(p, q, r, u, v, w) {
    const det = p * v - q * u;
    if (det === 0) {
      // 左邊成比例：右邊也成同比例才是無限多組，否則矛盾無解
      const k = u !== 0 ? u / p : v / q;
      return { kind: Math.abs(w - r * k) < 1e-9 ? 'many' : 'none' };
    }
    return { kind: 'one', x: (r * v - q * w) / det, y: (p * w - r * u) / det };
  }

  function eqOf(s, i) {
    const c = s.c;
    if (i === 0) return { p: 1, q: 1, r: s.N, tag: '①', desc: '數' + c.uc + '數', ok: true };
    if (i === 1) return { p: c.pa, q: c.pb, r: s.M, tag: '②', desc: '數金額', ok: true };
    if (i === 2) return { p: 1, q: 1, r: s.M, tag: '③', desc: '把金額當' + c.uc + '數', ok: false };
    return { p: c.pa, q: c.pb, r: s.N, tag: '④', desc: '把' + c.uc + '數當金額', ok: false };
  }

  function fmt(v) {
    if (!isFinite(v)) return '—';
    const r = Math.round(v * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }

  function draw() {
    const s = state();
    const c = s.c;
    const sel = PAIRS[pick];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, c.title + '：兩條式子配對台', C_INK);

    // 題目：只給總數與總金額，不給各買幾件
    let yy = 34;
    yy += drawSentence(ctx, 22, yy, 496,
      `買了${c.na}和${c.nb}共 ${s.N} ${c.uc}，付了 ${s.M} 元。` +
      `已知${c.na}每${c.ua} ${c.pa} 元、${c.nb}每${c.ub} ${c.pb} 元。`, C_PAPER, true) + 6;

    drawNote(ctx, `設${c.na} x ${c.ua}、${c.nb} y ${c.ub}`, yy + 8, C_EMBER, 13.5);
    yy += 24;

    // 四條候選式子
    for (let i = 0; i < 4; i++) {
      const e = eqOf(s, i);
      const on = sel.indexOf(i) >= 0;
      const cy = yy + 20 + i * 42;
      const col = on ? (e.ok ? C_INK : NO_COLOR) : DIM;
      drawPanel(ctx, 22, cy - 18, 496, 36, col, on ? 0.14 : 0.05);
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = col;
      ctx.font = f(800, 14);
      ctx.fillText(e.tag, 36, cy);
      ctx.restore();
      drawExpr(ctx, termItems([{ c: e.p, v: 'x' }, { c: e.q, v: 'y' }])
        .concat([T('=', on ? C_SLATE : DIM), T(String(e.r), on ? C_PAPER : DIM)]),
        0, cy, 20, on ? C_SLATE : DIM, { left: 66, maxW: 240, gap: 5 });
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? (e.ok ? C_INK : NO_COLOR) : DIM;
      ctx.font = f(700, 12.5);
      ctx.fillText(e.desc, 504, cy);
      ctx.restore();
    }

    // 結果
    const e1 = eqOf(s, sel[0]), e2 = eqOf(s, sel[1]);
    const res = solve2(e1.p, e1.q, e1.r, e2.p, e2.q, e2.r);
    const good = e1.ok && e2.ok;
    const bandY = yy + 20 + 4 * 42 - 10;
    drawPanel(ctx, 22, bandY, 496, 96, good ? OK_COLOR : NO_COLOR, 0.10);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (res.kind === 'none') {
      ctx.fillStyle = NO_COLOR;
      ctx.font = f(800, 15);
      ctx.fillText('兩條式子的左邊一模一樣、右邊卻不同', 270, bandY + 30);
      ctx.font = f(700, 13.5);
      ctx.fillText('同一次購物不可能既是 ' + e1.r + ' 又是 ' + e2.r + ' → 矛盾，無解', 270, bandY + 56);
    } else if (res.kind === 'many') {
      ctx.fillStyle = NO_COLOR;
      ctx.font = f(800, 15);
      ctx.fillText('兩條其實是同一條式子，答案列不完', 270, bandY + 42);
    } else {
      ctx.fillStyle = good ? OK_COLOR : NO_COLOR;
      ctx.font = f(800, 15);
      ctx.fillText(good ? '解得' : '算得出來，但答案很荒謬', 270, bandY + 26);
      ctx.restore();
      drawExpr(ctx, [IT('x', good ? OK_COLOR : NO_COLOR), T('=', C_SLATE), T(fmt(res.x), good ? OK_COLOR : NO_COLOR),
        T('，', C_SLATE), IT('y', good ? OK_COLOR : NO_COLOR), T('=', C_SLATE), T(fmt(res.y), good ? OK_COLOR : NO_COLOR)],
        270, bandY + 56, 24, C_SLATE, {});
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 12.5);
      ctx.fillText(good
        ? `${c.na} ${s.a} ${c.ua}、${c.nb} ${s.b} ${c.ub}，跟實際買的一樣`
        : `買 ${fmt(res.x)} ${c.ua}${c.na}是不可能的事`, 270, bandY + 80);
    }
    ctx.restore();

    if (aV) aV.textContent = s.a;
    if (bV) bV.textContent = s.b;
    if (aN) aN.textContent = c.na;
    if (bN) bN.textContent = c.nb;

    if (out) {
      out.innerHTML = casesTex(eqTex(e1.p, e1.q, e1.r), eqTex(e2.p, e2.q, e2.r));
      typeset([out]);
    }
    if (fb) {
      let msg;
      if (good) {
        msg = `這一組是對的：①<strong>數${c.uc}數</strong>（係數都是 \\(1\\)，右邊的單位是「${c.uc}」）、` +
          `②<strong>數金額</strong>（係數是單價，右邊的單位是「元」）。兩條從<strong>兩個不同的角度</strong>數同一次購物，` +
          `所以夾得出唯一的一組答案。`;
      } else if (res.kind === 'none') {
        msg = `這一組的兩條式子<strong>左邊完全相同</strong>，右邊一個是 \\(${e1.r}\\)、一個是 \\(${e2.r}\\)，` +
          `等於同時宣稱同一件事有兩個不同的答案——這種聯立方程式<strong>無解</strong>。` +
          `錯的根源是③或④把「${c.uc}數」和「金額」放到了不對的地方。`;
      } else {
        msg = `③把總金額 \\(${s.M}\\) 寫成了${c.uc}數、④把總${c.uc}數 \\(${s.N}\\) 寫成了金額，兩條都不是題目說的事。` +
          `式子照樣解得出來，但算出 \\(x = ${fmt(res.x)}\\) 這種數字——<strong>解得出來不代表列對了</strong>。`;
      }
      fb.innerHTML = wrapFeedback(msg);
      typeset([fb]);
    }
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); draw(); });
  bindPickGroup(pickGroup, 'data-pick', v => { pick = parseInt(v, 10); draw(); });
  if (aS) aS.addEventListener('input', draw);
  if (bS) bS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 3：弄錯了幾元對照台
   把「錯的情形」也寫成式子，差額補在少的那一邊，再整理成標準式
   ========================================================================== */
function initSwapCanvas() {
  const canvas = document.getElementById('canvas-swap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('sw-formula');
  const fb = document.getElementById('sw-feedback');
  const caseGroup = document.getElementById('sw-case-group');
  const dS = document.getElementById('sw-d-slider');
  const dV = document.getElementById('sw-d-val');
  const dN = document.getElementById('sw-d-name');

  const CONF = [
    { min: 0, max: 160, step: 4, def: 80, label: '送來的多花了幾元' },
    { min: 0, max: 400, step: 20, def: 200, label: '貼反後多收了幾元' },
    { min: 0, max: 40, step: 2, def: 22, label: '看成減號算得幾' }
  ];

  let idx = 0;
  let dVal = [CONF[0].def, CONF[1].def, CONF[2].def];

  // 差額為 0 時不要印出「-0」
  const neg = v => (v === 0 ? '0' : '-' + v);
  const plus = v => (v === 0 ? '' : ' + ' + v);

  function state() {
    const d = dVal[idx];
    if (idx === 0) {
      // 帽子 x 元、T 恤 y 元，總價 620；點 4 頂 2 件，送成 2 頂 4 件，多花 d 元
      const x = 310 - d / 4, y = 310 + d / 4;
      return {
        d, x, y,
        title: '紀念品店：數量聽反',
        s1: '1 頂帽子和 1 件 T 恤合買是 620 元',
        s2: '點了 4 頂帽子、2 件 T 恤，卻送成 2 頂帽子、4 件 T 恤，多花了 ' + d + ' 元',
        setTx: '設 1 頂帽子 x 元、1 件 T 恤 y 元',
        rows: [
          { name: '第①式', hint: '總價，最單純的那一句', e: 'x + y = 620', color: C_PAPER },
          { name: '對的情形', hint: '原本點的 4 頂 2 件', e: '4x + 2y', color: C_SKY },
          { name: '錯的情形', hint: '送來的 2 頂 4 件', e: '2x + 4y', color: C_MAGENTA },
          { name: '差額補在少的那邊', hint: d === 0 ? '差額是 0，兩種情形收一樣的錢' : '送來的比較貴，所以補在對的那邊', e: '4x + 2y' + plus(d) + ' = 2x + 4y', color: C_INK },
          { name: '移項整理', hint: '未知數搬到左邊', e: '2x - 2y = ' + neg(d), color: C_INK },
          { name: '同除以 2', hint: '化成第②式', e: 'x - y = ' + neg(d / 2), color: C_INK },
          { name: '解聯立', hint: '和與差都知道了', e: 'x = ' + x + '，y = ' + y, color: OK_COLOR }
        ],
        eq2: { p: 1, q: -1, r: -d / 2 },
        eq1: { p: 1, q: 1, r: 620 },
        unitX: '1 頂帽子 ' + x + ' 元', unitY: '1 件 T 恤 ' + y + ' 元',
        same: d === 0
      };
    }
    if (idx === 1) {
      // 冬瓜茶 35 元 x 杯、汽水 25 元 y 杯，共 80 杯；價錢貼反後多收 d 元
      const x = 40 - d / 20, y = 40 + d / 20;
      return {
        d, x, y,
        title: '園遊會：價錢貼反',
        s1: '冬瓜茶每杯 35 元、汽水每杯 25 元，兩種共賣出 80 杯',
        s2: '結算時發現有人把兩種價錢貼反了，收入比原本多了 ' + d + ' 元',
        setTx: '設冬瓜茶賣出 x 杯、汽水賣出 y 杯',
        rows: [
          { name: '第①式', hint: '總杯數', e: 'x + y = 80', color: C_PAPER },
          { name: '原本應收', hint: '冬瓜茶 35、汽水 25', e: '35x + 25y', color: C_SKY },
          { name: '貼反後實收', hint: '兩種價錢互換', e: '25x + 35y', color: C_MAGENTA },
          { name: '差額補在少的那邊', hint: d === 0 ? '差額是 0，貼反前後收一樣的錢' : '實收比較多，所以補在應收那邊', e: '35x + 25y' + plus(d) + ' = 25x + 35y', color: C_INK },
          { name: '移項整理', hint: '未知數搬到左邊', e: '10x - 10y = ' + neg(d), color: C_INK },
          { name: '同除以 10', hint: '化成第②式', e: 'x - y = ' + neg(d / 10), color: C_INK },
          { name: '解聯立', hint: '和與差都知道了', e: 'x = ' + x + '，y = ' + y, color: OK_COLOR }
        ],
        eq2: { p: 1, q: -1, r: -d / 10 },
        eq1: { p: 1, q: 1, r: 80 },
        unitX: '冬瓜茶 ' + x + ' 杯', unitY: '汽水 ' + y + ' 杯',
        same: d === 0
      };
    }
    // 兩個整數，加號看成減號得 d，正確答案 68
    const x = (68 + d) / 2, y = (68 - d) / 2;
    return {
      d, x, y,
      title: '計算紙：符號看錯',
      s1: '兩個整數相加，正確答案是 68',
      s2: '小翊把加號看成減號，算得的答案是 ' + d,
      setTx: '設這兩個整數為 x、y',
      rows: [
        { name: '第①式', hint: '正確的加法', e: 'x + y = 68', color: C_PAPER },
        { name: '第②式', hint: '看成減號的結果', e: 'x - y = ' + d, color: C_MAGENTA },
        { name: '不必整理', hint: '兩句話直接就是兩條標準式', e: '① 與 ② 都已是 ax + by = c', color: MUTED },
        { name: '①＋②', hint: 'y 抵消', e: '2x = ' + (68 + d) + '，x = ' + x, color: C_INK },
        { name: '代回①', hint: '把 x 換掉', e: 'y = 68 - ' + x + ' = ' + y, color: OK_COLOR }
      ],
      eq2: { p: 1, q: -1, r: d },
      eq1: { p: 1, q: 1, r: 68 },
      unitX: '較大的數 ' + x, unitY: '較小的數 ' + y,
      same: d === 0
    };
  }

  function draw() {
    const s = state();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, s.title, C_INK);

    let y = 34;
    y += drawSentence(ctx, 22, y, 496, '句① ' + s.s1, C_PAPER, true) + 6;
    y += drawSentence(ctx, 22, y, 496, '句② ' + s.s2, C_MAGENTA, true) + 6;
    drawNote(ctx, s.setTx, y + 8, C_EMBER, 13.5);
    y += 22;

    const rows = s.rows.map(r => ({
      name: r.name, hint: r.hint, color: r.color, items: [inkItems(r.e, r.color)]
    }));
    drawStepRows(ctx, rows, rows.length, {
      top: y + 22,
      gap: Math.min(40, (canvas.height - y - 44) / Math.max(1, rows.length - 1)),
      labX: 24, eqX: 180, size: 18, color: C_INK
    });

    if (dV) dV.textContent = s.d;
    if (dN) dN.textContent = CONF[idx].label;

    if (out) {
      out.innerHTML = casesTex(eqTex(s.eq1.p, s.eq1.q, s.eq1.r), eqTex(s.eq2.p, s.eq2.q, s.eq2.r))
        + '：' + wbrEq(`x = ${s.x}`) + '、' + wbrEq(`y = ${s.y}`);
      typeset([out]);
    }
    if (fb) {
      let msg;
      if (idx === 2) {
        msg = `<strong>符號看錯是最單純的一型</strong>：「正確答案是 \\(68\\)」給了 \\(x+y=68\\)，` +
          `「看成減號得 \\(${s.d}\\)」給了 \\(x-y=${s.d}\\)，<strong>兩句話直接就是兩條標準式</strong>，不必移項也不必化簡。` +
          (s.same
            ? `<br>現在差是 \\(0\\)，表示兩個數一樣大（都是 \\(34\\)），加號減號算起來當然不同——這仍是合理的情形。`
            : `<br>解得 ${s.unitX}、${s.unitY}。`);
      } else {
        msg = `難的永遠是<strong>第②式</strong>：先把「對的情形」和「錯的情形」<strong>各自寫成一段式子</strong>，` +
          `再讓差額 \\(${s.d}\\) 補在<strong>比較少的那一邊</strong>。` +
          `補完之後兩邊都有未知數，要<strong>移項化成 \\(ax+by=c\\)</strong>（\\(1\\text{-}2\\) 重點 7），同類項還會抵消掉一部分。` +
          (s.same
            ? `<br>把差額拉到 \\(0\\) 看看：兩種情形收一樣的錢，表示兩者<strong>單價相同</strong>，第②式變成 \\(x-y=0\\)，這是合理的邊界情形。`
            : `<br>解得 ${s.unitX}、${s.unitY}。`);
      }
      fb.innerHTML = wrapFeedback(msg);
      typeset([fb]);
    }
  }

  function applyConf() {
    const c = CONF[idx];
    if (!dS) return;
    dS.min = c.min; dS.max = c.max; dS.step = c.step;
    dS.value = dVal[idx];
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); applyConf(); draw(); });
  if (dS) dS.addEventListener('input', () => { dVal[idx] = parseInt(dS.value, 10); draw(); });
  applyConf();
  draw();
}

/* ==========================================================================
   重點 4：裝盒機
   同一批東西兩種裝法：「剩下」要減、「不足」要加
   ========================================================================== */
function initPackCanvas() {
  const canvas = document.getElementById('canvas-pack');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('pk-formula');
  const fb = document.getElementById('pk-feedback');
  const modeGroup = document.getElementById('pk-mode-group');
  const kS = document.getElementById('pk-k-slider');
  const rS = document.getElementById('pk-r-slider');
  const sS = document.getElementById('pk-s-slider');
  const kV = document.getElementById('pk-k-val');
  const rV = document.getElementById('pk-r-val');
  const sV = document.getElementById('pk-s-val');
  const sRow = document.getElementById('pk-s-row');

  let mode = 0;

  function state() {
    const k = parseInt(kS.value, 10);
    const r = parseInt(rS.value, 10);
    // 「不足」的數量不能超過一盒的容量，否則等於整盒空著（那是模式二的情形）
    if (sS.max != k) {
      sS.max = k;
      if (parseInt(sS.value, 10) > k) sS.value = k;
    }
    const s = parseInt(sS.value, 10);
    if (mode === 0) {
      // 每盒 k 張剩 r 張；每盒 k+1 張不足 s 張
      const y = r + s;             // ②-① 之後 x 消失，直接得到盒數
      const x = k * y + r;
      return { k, r, s, y, x, mode };
    }
    // 每盒 k 張剩 r 張；每盒 k+1 張恰好裝完但多出一個空盒
    const y = k + r + 1;
    const x = k * y + r;
    return { k, r, s, y, x, mode };
  }

  // 一排盒子：full 個裝滿、後面 short 個位置空著；loose 為盒外散張
  function drawBoxRow(ctx, x0, cy, n, per, opts) {
    const o = opts || {};
    const maxW = 470;
    const bw = Math.min(46, (maxW - (n - 1) * 6) / Math.max(1, n));
    const gap = 6;
    const totalW = n * bw + (n - 1) * gap;
    let bx = x0 + (maxW - totalW) / 2;
    for (let i = 0; i < n; i++) {
      const shortBox = (o.shortIdx != null && i === o.shortIdx);
      const emptyBox = (o.emptyIdx != null && i === o.emptyIdx);
      const col = emptyBox ? NO_COLOR : (shortBox ? C_EMBER : C_INK);
      ctx.save();
      roundRect(ctx, bx, cy - 17, bw, 34, 4);
      ctx.fillStyle = emptyBox ? 'rgba(251, 113, 133, 0.10)' : 'rgba(94, 234, 212, 0.12)';
      ctx.fill();
      if (emptyBox) { ctx.setLineDash([4, 3]); }
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = col;
      ctx.font = f(800, emptyBox ? 12 : 15);
      ctx.fillText(emptyBox ? '空' : String(shortBox ? o.shortCount : per), bx + bw / 2, cy);
      ctx.restore();
      bx += bw + gap;
    }
    return bw;
  }

  function drawLoose(ctx, cx, cy, n, color) {
    const tw = 15, gap = 4;
    const total = n * tw + (n - 1) * gap;
    let x = cx - total / 2;
    for (let i = 0; i < n; i++) {
      drawTicket(ctx, x, cy - 10, tw, 20, color, { perf: false, lw: 1.3 });
      x += tw + gap;
    }
  }

  function draw() {
    const s = state();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, '紀念票裝盒機：兩種裝法', C_INK);

    const s2Text = mode === 0
      ? `若每盒改裝 ${s.k + 1} 張，則會不足 ${s.s} 張`
      : `若每盒改裝 ${s.k + 1} 張，則會剛好裝完並多出一個空盒`;

    let y = 34;
    y += drawSentence(ctx, 22, y, 496, `句① 每盒裝 ${s.k} 張，會剩下 ${s.r} 張沒盒子裝`, C_PAPER, true) + 5;
    y += drawSentence(ctx, 22, y, 496, '句② ' + s2Text, C_MAGENTA, true) + 8;
    drawNote(ctx, '設票券共 x 張、盒子共 y 個（兩個都不知道）', y + 6, C_EMBER, 13.5);
    y += 22;

    // 裝法一：y 個盒子各裝 k 張，外面散 r 張
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_PAPER;
    ctx.font = f(800, 12.5);
    ctx.fillText('裝法一', 24, y + 14);
    ctx.restore();
    drawBoxRow(ctx, 40, y + 32, s.y, s.k, {});
    drawLoose(ctx, 270, y + 68, s.r, C_PAPER);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(650, 11.5);
    ctx.fillText('盒外剩下 ' + s.r + ' 張 → 要把它扣掉才等於裝進去的數量', 270, y + 88);
    ctx.restore();
    y += 100;

    // 裝法二
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_MAGENTA;
    ctx.font = f(800, 12.5);
    ctx.fillText('裝法二', 24, y + 14);
    ctx.restore();
    if (mode === 0) {
      drawBoxRow(ctx, 40, y + 32, s.y, s.k + 1, { shortIdx: s.y - 1, shortCount: (s.k + 1) - s.s });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 11.5);
      ctx.fillText('最後一盒少了 ' + s.s + ' 張 → 要補上才裝得滿', 270, y + 58);
      ctx.restore();
    } else {
      drawBoxRow(ctx, 40, y + 32, s.y, s.k + 1, { emptyIdx: s.y - 1 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 11.5);
      ctx.fillText('最後一個盒子整個空著 → 實際只用了 ' + (s.y - 1) + ' 個盒子', 270, y + 58);
      ctx.restore();
    }
    y += 74;

    // 兩條式子與答案
    drawPanel(ctx, 22, y, 496, 96, C_INK, 0.08);
    drawBrace(ctx, 62, y + 14, y + 62, C_INK);
    const line1 = `x - ${s.r} = ${s.k}y`;
    const line2 = mode === 0 ? `x + ${s.s} = ${s.k + 1}y` : `x = ${s.k + 1}(y - 1)`;
    drawExpr(ctx, [inkItems(line1, C_SLATE)], 0, y + 26, 21, C_SLATE, { left: 100, maxW: 330, gap: 5 });
    drawExpr(ctx, [inkItems(line2, C_SLATE)], 0, y + 54, 21, C_SLATE, { left: 100, maxW: 330, gap: 5 });
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12);
    ctx.fillText('…①', 440, y + 26);
    ctx.fillText('…②', 440, y + 54);
    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 14);
    ctx.textAlign = 'center';
    ctx.fillText(`解得 y = ${s.y}（${s.y} 個盒子）、x = ${s.x}（${s.x} 張票）`, 270, y + 80);
    ctx.restore();

    if (kV) kV.textContent = s.k;
    if (rV) rV.textContent = s.r;
    if (sV) sV.textContent = s.s;
    if (sRow) sRow.style.display = (mode === 0 ? '' : 'none');

    if (out) {
      out.innerHTML = casesTex(`x - ${s.r} = ${s.k}y`,
        mode === 0 ? `x + ${s.s} = ${s.k + 1}y` : `x = ${s.k + 1}(y - 1)`)
        + '：' + wbrEq(`y = ${s.y}`) + '、' + wbrEq(`x = ${s.x}`);
      typeset([out]);
    }
    if (fb) {
      let msg;
      if (mode === 0) {
        msg = `<strong>剩下用減、不足用加</strong>：盒外剩 \\(${s.r}\\) 張，表示真正裝進去的是 \\(x-${s.r}\\)；` +
          `第二種裝法還缺 \\(${s.s}\\) 張才裝得滿，表示裝滿需要 \\(x+${s.s}\\)。扣完補完剛好都等於「整整齊齊裝滿」的數量。` +
          `<br>兩式相減時 \\(x\\) 自己消失（兩條的係數都是 \\(1\\)），直接得到 \\(y = ${s.r} + ${s.s} = ${s.y}\\)——` +
          `<strong>盒數就是「剩下」加「不足」</strong>，這一型幾乎都用加減消去法最快。`;
      } else {
        msg = `<strong>「多出一盒」改變的是盒數，不是張數</strong>。盒子仍有 \\(y\\) 個，但第二種裝法只用到 \\(y-1\\) 個，` +
          `所以右邊要寫成 \\(${s.k + 1}(y-1)\\)，不是 \\(${s.k + 1}y\\)。` +
          `<br>展開後 \\(x = ${s.k + 1}y - ${s.k + 1}\\)，配上第①式解得 \\(y = ${s.y}\\)、\\(x = ${s.x}\\)。` +
          `把「多出一盒」誤寫成 \\(x = ${s.k + 1}y\\) 是這一型最常見的錯誤。`;
      }
      fb.innerHTML = wrapFeedback(msg);
      typeset([fb]);
    }
  }

  bindPickGroup(modeGroup, 'data-mode', v => { mode = parseInt(v, 10); draw(); });
  [kS, rS, sS].forEach(el => { if (el) el.addEventListener('input', draw); });
  draw();
}

/* ==========================================================================
   重點 5：回頭讀題機
   同一組解，換一個問句就換一個答案
   ========================================================================== */
function initAskCanvas() {
  const canvas = document.getElementById('canvas-ask');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('ak-formula');
  const fb = document.getElementById('ak-feedback');
  const caseGroup = document.getElementById('ak-case-group');
  const qGroup = document.getElementById('ak-q-group');
  const xS = document.getElementById('ak-x-slider');
  const yS = document.getElementById('ak-y-slider');
  const xV = document.getElementById('ak-x-val');
  const yV = document.getElementById('ak-y-val');
  const xN = document.getElementById('ak-x-name');
  const yN = document.getElementById('ak-y-name');

  const CASES = [
    {
      title: '班級人數', nx: '男生', ny: '女生', unit: '人', verb: '有',
      qn: 4, money: null
    },
    {
      title: '飲料攤', nx: '大杯', ny: '小杯', unit: '杯', verb: '賣出',
      qn: 5, money: { px: 60, py: 45 }
    }
  ];

  let idx = 0, qi = 0;

  // 「甲比乙多幾個」的敘述要跟目前的 x、y 相容：x < y 時整句話要反過來問，
  // 否則畫面上會出現「男生比女生多 -16 人」（開發約束 27）
  function qText(c, x, y, q) {
    if (q === 0) return c.nx + c.verb + '多少' + c.unit + '？';
    if (q === 1) return c.ny + c.verb + '多少' + c.unit + '？';
    if (q === 2) return '兩種共' + c.verb + '多少' + c.unit + '？';
    if (q === 3) return (x >= y ? c.nx + '比' + c.ny : c.ny + '比' + c.nx) + '多多少' + c.unit + '？';
    return '這次總收入多少元？';
  }

  function answerOf(c, x, y, q) {
    if (q === 0) return { tex: `x = ${x}`, val: x, unit: c.unit, why: '直接交出 x' };
    if (q === 1) return { tex: `y = ${y}`, val: y, unit: c.unit, why: '直接交出 y' };
    if (q === 2) return { tex: `x + y = ${x} + ${y} = ${x + y}`, val: x + y, unit: c.unit, why: '要的是兩者的和' };
    if (q === 3) {
      return x >= y
        ? { tex: `x - y = ${x} - ${y} = ${x - y}`, val: x - y, unit: c.unit, why: '要的是兩者的差，大的減小的' }
        : { tex: `y - x = ${y} - ${x} = ${y - x}`, val: y - x, unit: c.unit, why: '要的是兩者的差，大的減小的' };
    }
    const m = c.money;
    return {
      tex: `${m.px}x + ${m.py}y = ${m.px * x} + ${m.py * y} = ${m.px * x + m.py * y}`,
      val: m.px * x + m.py * y, unit: '元', why: '要的是單價乘數量再相加'
    };
  }

  function draw() {
    const c = CASES[idx];
    const x = parseInt(xS.value, 10);
    const y = parseInt(yS.value, 10);
    const q = Math.min(qi, c.qn - 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, c.title + '：回頭讀題機', C_INK);

    // 已經解出來的兩個數
    drawNote(ctx, '聯立方程式已經解完了，手上有這兩個數：', 42, MUTED, 13);
    [[c.nx, 'x', x, 148], [c.ny, 'y', y, 372]].forEach(t => {
      drawTicket(ctx, t[3] - 92, 58, 184, 56, C_PAPER, { perf: false });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 12.5);
      ctx.fillText(t[0], t[3], 74);
      ctx.restore();
      drawExpr(ctx, [IT(t[1], C_PAPER), T('=', C_SLATE), T(String(t[2]), C_PAPER)],
        t[3], 96, 24, C_SLATE, {});
    });

    // 題目的最後一句：問句
    drawNote(ctx, '但題目最後問的是——', 138, MUTED, 13);
    drawPanel(ctx, 40, 152, 460, 52, C_MAGENTA, 0.16);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C_MAGENTA;
    ctx.font = f(800, 17);
    ctx.fillText(qText(c, x, y, q), 270, 178);
    ctx.restore();

    // 放大鏡：問句下方一個指向的箭頭
    drawArrow(ctx, 270, 210, 270, 236, C_MAGENTA, 2.2);

    // 對應的算式與答案
    const a = answerOf(c, x, y, q);
    drawPanel(ctx, 40, 244, 460, 150, OK_COLOR, 0.10);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = MUTED;
    ctx.font = f(700, 12.5);
    ctx.fillText(a.why, 270, 266);
    ctx.restore();
    drawExpr(ctx, [inkItems(a.tex, C_SLATE)], 270, 300, 21, C_SLATE, { maxW: 430 });
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = OK_COLOR;
    ctx.font = f(800, 20);
    ctx.fillText('答：' + a.val + ' ' + a.unit, 270, 344);
    ctx.fillStyle = MUTED;
    ctx.font = f(650, 12.5);
    ctx.fillText('答案要寫成帶單位的完整句子，唸起來怪怪的通常就是答錯對象了', 270, 376);
    ctx.restore();

    if (xV) xV.textContent = x;
    if (yV) yV.textContent = y;
    if (xN) xN.textContent = c.nx;
    if (yN) yN.textContent = c.ny;
    // 「總金額」只有在有單價的情境才有意義
    if (qGroup) {
      const btn = qGroup.querySelector('[data-q="4"]');
      if (btn) btn.style.display = (c.money ? '' : 'none');
    }

    if (out) {
      out.innerHTML = wbrEq(`x = ${x}`) + '、' + wbrEq(`y = ${y}`)
        + '　→　' + wbrEq(a.tex);
      typeset([out]);
    }
    if (fb) {
      const same = (q === 0 || q === 1);
      fb.innerHTML = wrapFeedback(
        (same
          ? `這次問句剛好就要 \\(${q === 0 ? 'x' : 'y'}\\) 本身，直接交出去即可——但<strong>不能假設每次都這樣</strong>。`
          : `注意答案 \\(${a.val}\\) <strong>不是</strong> \\(x\\) 也不是 \\(y\\)，而是它們的組合。` +
            `解完就把 \\(x = ${x}\\) 寫上去的話，這題就錯了。`) +
        `<br>換一個問句看看：<strong>同一組解 \\(x = ${x}\\)、\\(y = ${y}\\)，${c.qn} 個問句有 ${c.qn} 種答案</strong>。` +
        `選擇題的誘答就藏在這裡——問「${c.ny}」時，選項一定會放「${c.nx}」的那個數。`);
      typeset([fb]);
    }
  }

  bindPickGroup(caseGroup, 'data-case', v => {
    idx = parseInt(v, 10);
    if (qi >= CASES[idx].qn) {
      qi = 0;
      if (qGroup) {
        qGroup.querySelectorAll('.pick-btn').forEach(b => b.classList.remove('active'));
        const first = qGroup.querySelector('[data-q="0"]');
        if (first) first.classList.add('active');
      }
    }
    draw();
  });
  bindPickGroup(qGroup, 'data-q', v => { qi = parseInt(v, 10); draw(); });
  if (xS) xS.addEventListener('input', draw);
  if (yS) yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 6：合理性檢查關
   式子每次都解得出來，但解得出來不一定過得了關
   ========================================================================== */
function initCheckCanvas() {
  const canvas = document.getElementById('canvas-check');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const out = document.getElementById('ck-formula');
  const fb = document.getElementById('ck-feedback');
  const caseGroup = document.getElementById('ck-case-group');
  const pS = document.getElementById('ck-p-slider');
  const qS = document.getElementById('ck-q-slider');
  const pV = document.getElementById('ck-p-val');
  const qV = document.getElementById('ck-q-val');
  const pN = document.getElementById('ck-p-name');
  const qN = document.getElementById('ck-q-name');
  const qRow = document.getElementById('ck-q-row');

  const CONF = [
    { p: { min: 18, max: 90, step: 9, def: 81, label: '姐姐的 4 倍多出幾歲' }, q: null },
    {
      p: { min: 20, max: 48, step: 4, def: 24, label: '月分與日期的和' },
      q: { min: 4, max: 40, step: 4, def: 8, label: '月分的 3 倍減日期' }
    },
    {
      p: { min: 2, max: 10, step: 2, def: 6, label: '甲隊多得幾分' },
      q: { min: 30, max: 48, step: 1, def: 42, label: '兩隊合計得分' }
    }
  ];

  let idx = 0;
  let pVal = CONF.map(c => c.p.def);
  let qVal = CONF.map(c => (c.q ? c.q.def : 0));

  function state() {
    const P = pVal[idx], Q = qVal[idx];
    if (idx === 0) {
      // 6 年後姐姐是小翊的 3 倍；3 年前姐姐的 4 倍比小翊的 3 倍多 P 歲
      const x = (P - 9) / 3;
      const y = (x - 12) / 3;
      const checks = [
        { ok: Number.isInteger(x) && Number.isInteger(y), t: '年齡必須是整數' },
        { ok: y > 0, t: y > 0 ? '小翊今年 ' + y + ' 歲，是正數' : '小翊今年 ' + y + ' 歲，年齡不能是負數或 0' },
        { ok: y - 3 >= 0, t: y - 3 >= 0 ? '3 年前小翊 ' + (y - 3) + ' 歲，已經出生' : '3 年前小翊 ' + (y - 3) + ' 歲，那時還沒出生' }
      ];
      return {
        title: '年齡問題：算出負數怎麼辦',
        s1: '6 年後，姐姐的年齡是小翊的 3 倍',
        s2: '3 年前，姐姐年齡的 4 倍比小翊年齡的 3 倍多 ' + P + ' 歲',
        setTx: '設姐姐今年 x 歲、小翊今年 y 歲',
        raw1: 'x + 6 = 3(y + 6)', raw2: '4(x - 3) = 3(y - 3) + ' + P,
        eq1: { p: 1, q: -3, r: 12 }, eq2: { p: 4, q: -3, r: P + 3 },
        x, y, xu: '姐姐 ' + x + ' 歲', yu: '小翊 ' + y + ' 歲', checks
      };
    }
    if (idx === 1) {
      // 生日的月分 x 與日期 y：x + y = P、3x - y = Q
      const x = (P + Q) / 4;
      const y = P - x;
      const checks = [
        { ok: Number.isInteger(x) && Number.isInteger(y), t: '月分與日期必須是整數' },
        { ok: x >= 1 && x <= 12, t: (x >= 1 && x <= 12) ? '月分是 ' + x + '，在 1 到 12 之間' : '月分算出 ' + x + '，沒有這個月分' },
        { ok: y >= 1 && y <= 31, t: (y >= 1 && y <= 31) ? '日期是 ' + y + '，在 1 到 31 之間' : '日期算出 ' + y + '，超出一個月的天數' }
      ];
      return {
        title: '生日問題：月分只有 12 個',
        s1: '姐姐生日的月分與日期相加是 ' + P,
        s2: '月分的 3 倍減去日期是 ' + Q,
        setTx: '設姐姐生日是 x 月 y 日',
        raw1: 'x + y = ' + P, raw2: '3x - y = ' + Q,
        eq1: { p: 1, q: 1, r: P }, eq2: { p: 3, q: -1, r: Q },
        x, y, xu: x + ' 月', yu: y + ' 日', checks
      };
    }
    // 球賽：甲比乙多 P 分、合計 Q 分
    const x = (P + Q) / 2;
    const y = (Q - P) / 2;
    const checks = [
      { ok: Number.isInteger(x) && Number.isInteger(y), t: Number.isInteger(x) ? '兩隊得分都是整數' : '算出 ' + x + ' 分，籃球得分不會有小數' },
      { ok: y >= 0, t: y >= 0 ? '乙隊得 ' + y + ' 分，不是負數' : '乙隊得 ' + y + ' 分，得分不能是負數' },
      { ok: x >= y, t: x >= y ? '甲隊得分確實比乙隊高' : '甲隊反而比乙隊低，與題意不符' }
    ];
    return {
      title: '球賽得分：得分不會有小數',
      s1: '甲隊比乙隊多得 ' + P + ' 分',
      s2: '兩隊合計得 ' + Q + ' 分',
      setTx: '設甲隊得 x 分、乙隊得 y 分',
      raw1: 'x - y = ' + P, raw2: 'x + y = ' + Q,
      eq1: { p: 1, q: -1, r: P }, eq2: { p: 1, q: 1, r: Q },
      x, y, xu: '甲隊 ' + x + ' 分', yu: '乙隊 ' + y + ' 分', checks
    };
  }

  function nf(v) {
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  }

  function draw() {
    const s = state();
    const pass = s.checks.every(c => c.ok);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitle(ctx, s.title, C_INK);

    let y = 34;
    y += drawSentence(ctx, 22, y, 496, '句① ' + s.s1, C_PAPER, true) + 5;
    y += drawSentence(ctx, 22, y, 496, '句② ' + s.s2, C_PAPER, true) + 6;
    drawNote(ctx, s.setTx, y + 6, C_EMBER, 13);
    y += 20;

    // 列式與化簡（原式已是標準式時不畫「化簡」那一段空動作）
    const std1 = eqTex(s.eq1.p, s.eq1.q, s.eq1.r).replace(/\s/g, '');
    const std2 = eqTex(s.eq2.p, s.eq2.q, s.eq2.r).replace(/\s/g, '');
    const needSimp = (s.raw1.replace(/\s/g, '') !== std1 || s.raw2.replace(/\s/g, '') !== std2);
    drawPanel(ctx, 22, y, 496, 76, C_SKY, 0.07);
    if (needSimp) {
      drawBrace(ctx, 46, y + 12, y + 64, C_SKY);
      drawExpr(ctx, [inkItems(s.raw1, C_SLATE)], 0, y + 24, 18, C_SLATE, { left: 78, maxW: 170, gap: 4 });
      drawExpr(ctx, [inkItems(s.raw2, C_SLATE)], 0, y + 52, 18, C_SLATE, { left: 78, maxW: 170, gap: 4 });
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(700, 12);
      ctx.fillText('化簡', 276, y + 38);
      ctx.restore();
      drawArrow(ctx, 258, y + 50, 296, y + 50, MUTED, 1.8);
      drawBrace(ctx, 312, y + 12, y + 64, C_INK);
      drawExpr(ctx, termItems([{ c: s.eq1.p, v: 'x' }, { c: s.eq1.q, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(s.eq1.r), C_PAPER)]), 0, y + 24, 18, C_SLATE,
        { left: 340, maxW: 170, gap: 4 });
      drawExpr(ctx, termItems([{ c: s.eq2.p, v: 'x' }, { c: s.eq2.q, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(s.eq2.r), C_PAPER)]), 0, y + 52, 18, C_SLATE,
        { left: 340, maxW: 170, gap: 4 });
    } else {
      // 兩句話直接就是標準式，只畫一組並在旁邊註明不必整理
      drawBrace(ctx, 168, y + 12, y + 64, C_INK);
      drawExpr(ctx, termItems([{ c: s.eq1.p, v: 'x' }, { c: s.eq1.q, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(s.eq1.r), C_PAPER)]), 0, y + 24, 20, C_SLATE,
        { left: 202, maxW: 220, gap: 5 });
      drawExpr(ctx, termItems([{ c: s.eq2.p, v: 'x' }, { c: s.eq2.q, v: 'y' }])
        .concat([T('=', C_SLATE), T(String(s.eq2.r), C_PAPER)]), 0, y + 52, 20, C_SLATE,
        { left: 202, maxW: 220, gap: 5 });
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = MUTED;
      ctx.font = f(650, 11.5);
      ctx.fillText('兩句話直接', 38, y + 30);
      ctx.fillText('就是標準式', 38, y + 46);
      ctx.restore();
    }
    y += 86;

    // 解
    drawNote(ctx, '解聯立方程式（列式與計算都沒有錯）', y + 4, MUTED, 12.5);
    drawExpr(ctx, [IT('x', C_SKY), T('=', C_SLATE), T(nf(s.x), C_SKY), T('，', C_SLATE),
      IT('y', C_SKY), T('=', C_SLATE), T(nf(s.y), C_SKY)], 270, y + 32, 24, C_SLATE, {});
    y += 52;

    // 檢查清單
    drawPanel(ctx, 22, y, 496, 84, pass ? OK_COLOR : NO_COLOR, 0.08);
    s.checks.forEach((c, i) => drawCheckRow(ctx, 36, y + 20 + i * 24, 470, c.ok, c.t));
    y += 94;

    // 判定
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pass ? OK_COLOR : NO_COLOR;
    ctx.font = f(800, 17);
    ctx.fillText(pass ? '答：' + s.xu + '、' + s.yu : '不合情境 → 此題無解', 270, y + 12);
    ctx.restore();

    if (pV) pV.textContent = pVal[idx];
    if (qV) qV.textContent = qVal[idx];
    if (pN) pN.textContent = CONF[idx].p.label;
    if (qN && CONF[idx].q) qN.textContent = CONF[idx].q.label;
    if (qRow) qRow.style.display = (CONF[idx].q ? '' : 'none');

    if (out) {
      out.innerHTML = casesTex(eqTex(s.eq1.p, s.eq1.q, s.eq1.r), eqTex(s.eq2.p, s.eq2.q, s.eq2.r))
        + '：' + wbrEq(`x = ${nf(s.x)}`) + '、' + wbrEq(`y = ${nf(s.y)}`);
      typeset([out]);
    }
    if (fb) {
      const bad = s.checks.filter(c => !c.ok);
      fb.innerHTML = wrapFeedback(pass
        ? `三項檢查全部通過，這組解在情境裡站得住，可以照常寫答案：<strong>${s.xu}、${s.yu}</strong>。` +
          `<br>拉滑桿試試看：同樣一個題型，換一個數字就可能算出不存在的答案——<strong>檢查合理性不是多餘的步驟</strong>。`
        : `列式沒錯、計算也沒錯，但<strong>${bad[0].t}</strong>。這時候正確的回答是「<strong>此題無解</strong>」，` +
          `而不是「我算錯了」，更不是把 \\(${nf(s.x)}\\) 這種數字硬寫上去。` +
          `<br>注意這跟「聯立方程式無法求解」<strong>不一樣</strong>：式子本身解得出唯一一組 \\(x\\)、\\(y\\)，` +
          `問題出在那組數字在現實裡不存在。`);
      typeset([fb]);
    }
  }

  function applyConf() {
    const c = CONF[idx];
    if (pS) { pS.min = c.p.min; pS.max = c.p.max; pS.step = c.p.step; pS.value = pVal[idx]; }
    if (qS && c.q) { qS.min = c.q.min; qS.max = c.q.max; qS.step = c.q.step; qS.value = qVal[idx]; }
  }

  bindPickGroup(caseGroup, 'data-case', v => { idx = parseInt(v, 10); applyConf(); draw(); });
  if (pS) pS.addEventListener('input', () => { pVal[idx] = parseInt(pS.value, 10); draw(); });
  if (qS) qS.addEventListener('input', () => { qVal[idx] = parseInt(qS.value, 10); draw(); });
  applyConf();
  draw();
}
