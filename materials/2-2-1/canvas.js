document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quiz System
  initQuizSystem();

  // Initialize Canvas Simulations
  initFrameCanvas();
  initWalkCanvas();
  initAxisCanvas();
  initDistCanvas();
  initMoveCanvas();
  initBackCanvas();
  initOriginCanvas();
  initQuadCanvas();
  initSignCanvas();
});

/* ==========================================================================
   1. Interactive Quiz System
   ========================================================================== */
function initQuizSystem() {
  const quizCards = document.querySelectorAll('.quiz-card');

  // Correct answers mapping for Book 2 / 2-1 (18 Quizzes)
  const answers = {
    '2-2-1-1': 'C',   // 兩軸交點稱為原點 O
    '2-2-1-2': 'A',   // 2m=6 且 m+5=8 ⇒ m=3
    '2-2-1-3': 'C',   // 向左 6、向下 2 → (-6,-2)
    '2-2-1-4': 'B',   // y 軸右方 7、x 軸下方 2 → (7,-2)
    '2-2-1-5': 'D',   // (0,-4) 在 y 軸上
    '2-2-1-6': 'B',   // (0,-9) 在 y 軸上，不屬於任何象限
    '2-2-1-7': 'A',   // 到 x 軸 5、到 y 軸 8
    '2-2-1-8': 'D',   // |-1| 最小 → C 點
    '2-2-1-9': 'A',   // (-2+7, 4-9) = (5,-5)
    '2-2-1-10': 'C',  // x 變大、y 變小 → (3,1)
    '2-2-1-11': 'D',  // 回推 (2+3, 1-6) = (5,-5)
    '2-2-1-12': 'B',  // 反方向走同樣格數會回到原點
    '2-2-1-13': 'A',  // 碼頭 (4,-2) → 浮標 (7,-3)
    '2-2-1-14': 'C',  // 左留 3 格、下留 4 格
    '2-2-1-15': 'B',  // (-,+) → 第二象限
    '2-2-1-16': 'D',  // 兩坐標皆負 ⇒ 第三象限
    '2-2-1-17': 'A',  // Q 第一象限、R 第三象限
    '2-2-1-18': 'C'   // P 第二象限、Q(b-a, ab) 第四象限
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
   2. 本節配色（復古航海製圖室：黃銅、海青、羊皮）
   ========================================================================== */
const CH_BRASS = '#fcd34d';
const CH_TEAL = '#5eead4';
const CH_SKY = '#7dd3fc';
const CH_CORAL = '#fda4af';
const CH_MINT = '#6ee7b7';
const CH_VIOLET = '#d8b4fe';
const CH_AMBER = '#fdba74';
const CH_MAGENTA = '#f9a8d4';
const CH_MOSS = '#bef264';
const CH_SLATE = '#cbd5e1';


// 在點旁邊標一個名稱與坐標
function labelPoint(ctx, x, y, name, u, v, color, opts) {
  const o = (typeof opts === 'string') ? { side: opts } : (opts || {});
  const maxY = o.maxY == null ? ctx.canvas.height - 8 : o.maxY;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = f(800, 13.5);
  ctx.textBaseline = 'middle';
  const txt = `${name}(${numStr(u)}, ${numStr(v)})`;
  const w = ctx.measureText(txt).width;
  let tx = x + 12, ty = y + (o.dy == null ? 16 : o.dy);
  if (o.side === 'left' || tx + w > ctx.canvas.width - 6) { tx = x - 12 - w; }
  if (tx < 6) tx = 6;
  if (ty > maxY) ty = y - 16;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  roundRect(ctx, tx - 5, ty - 10, w + 10, 20, 6);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(txt, tx, ty);
  ctx.restore();
}


// 方向的中文說法：正負各一句，畫面上的敘述要跟著滑桿翻向
function dirWord(v, pos, neg) {
  if (v > 0) return `${pos} ${v}`;
  if (v < 0) return `${neg} ${-v}`;
  return '不動';
}


/* ==========================================================================
   重點 1：數對順序實驗台
   ========================================================================== */
function initFrameCanvas() {
  const cv = document.getElementById('canvas-frame');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const mS = document.getElementById('fr-m-slider');
  const nS = document.getElementById('fr-n-slider');
  const mV = document.getElementById('fr-m-val');
  const nV = document.getElementById('fr-n-val');
  const out = document.getElementById('fr-formula');
  const fb = document.getElementById('fr-feedback');

  function draw() {
    const m = parseInt(mS.value, 10);
    const n = parseInt(nS.value, 10);
    mV.textContent = m;
    nV.textContent = n;
    const same = (m === n);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `把 (${m} , ${n}) 的兩個數對調，會插到哪裡？`, CH_BRASS);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 30, min: -6, max: 6, labelEvery: 1, axisColor: CH_SLATE });

    // 鏡射參考線 y = x（只是提示，不標式子）
    dashLine(ctx, g.px(-6), g.py(-6), g.px(6), g.py(6), 'rgba(252, 211, 77, 0.28)', [3, 5]);
    ctx.save();
    ctx.fillStyle = 'rgba(252, 211, 77, 0.75)';
    ctx.font = f(700, 11.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('兩個數對調＝沿這條虛線翻過去', g.px(-6) + 6, g.py(-6) - 6);
    ctx.restore();

    // P(m,n) 與 Q(n,m)
    const pX = g.px(m), pY = g.py(n);
    const qX = g.px(n), qY = g.py(m);
    if (!same) {
      dashLine(ctx, pX, pY, qX, qY, 'rgba(249, 168, 212, 0.5)', [4, 4]);
    }
    drawFlag(ctx, qX, qY, CH_MAGENTA);
    drawFlag(ctx, pX, pY, CH_TEAL);
    // P 與 Q 關於 y = x 對稱：靠上的那個標籤往左上放、靠下的往右下放，兩張標籤才不會疊在一起
    const pAbove = (n > m);
    labelPoint(ctx, pX, pY, 'P', m, n, CH_TEAL,
      pAbove ? { side: 'left', dy: -20 } : { dy: 20 });
    if (!same) labelPoint(ctx, qX, qY, 'Q', n, m, CH_MAGENTA,
      pAbove ? { dy: 20 } : { side: 'left', dy: -20 });

    // 底部結論
    const msg = same
      ? `兩個數一樣時，P 與 Q 疊在同一個位置`
      : `P 與 Q 是兩個不同的位置——數對有先後順序`;
    drawNote(ctx, msg, cv.height - 16, same ? OK_COLOR : CH_MAGENTA, 13.5);

    out.innerHTML = same
      ? `${wbrEq(`(${m}, ${n}) = (${n}, ${m})`)}`
      : `${wbrEq(`(${m}, ${n}) \\ne (${n}, ${m})`)}`;

    fb.innerHTML = wrapFeedback(same
      ? `<b style="color:${OK_COLOR}">\\(m = n\\) 時才會重合</b><br>此時 \\(P\\) 與 \\(Q\\) 都是 \\((${m}, ${m})\\)，是同一個點。`
      : `<b style="color:${CH_TEAL}">\\(P\\) 的 \\(x\\) 坐標是 ${m}、\\(y\\) 坐標是 ${n}</b><br>` +
        `<b style="color:${CH_MAGENTA}">\\(Q\\) 的 \\(x\\) 坐標是 ${n}、\\(y\\) 坐標是 ${m}</b><br>` +
        `兩個數字一樣，順序不同，位置就不同。`);
    typeset([out, fb]);
  }

  mS.addEventListener('input', draw);
  nS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 2：雙向翻譯台
   ========================================================================== */
function initWalkCanvas() {
  const cv = document.getElementById('canvas-walk');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const xS = document.getElementById('wk-x-slider');
  const yS = document.getElementById('wk-y-slider');
  const xV = document.getElementById('wk-x-val');
  const yV = document.getElementById('wk-y-val');
  const out = document.getElementById('wk-formula');
  const fb = document.getElementById('wk-feedback');
  let mode = 'walk';

  function draw() {
    const x = parseInt(xS.value, 10);
    const y = parseInt(yS.value, 10);
    xV.textContent = x;
    yV.textContent = y;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, mode === 'walk'
      ? `由數對 (${x} , ${y}) 找出點的位置`
      : `由點 A 讀出它的坐標`, CH_TEAL);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 30, min: -6, max: 6, labelEvery: 1, axisColor: CH_SLATE });
    const aX = g.px(x), aY = g.py(y);

    if (mode === 'walk') {
      // 先左右、再上下的折線
      if (x !== 0) drawArrow(ctx, g.ox, g.oy, aX, g.oy, CH_BRASS, 2.5);
      if (y !== 0) drawArrow(ctx, aX, g.oy, aX, aY, CH_MINT, 2.5);
      ctx.save();
      ctx.font = f(700, 12.5);
      ctx.textBaseline = 'middle';
      if (x !== 0) {
        ctx.fillStyle = CH_BRASS;
        ctx.textAlign = 'center';
        ctx.fillText(dirWord(x, '向右', '向左'), (g.ox + aX) / 2, g.oy - 12);
      }
      if (y !== 0) {
        ctx.fillStyle = CH_MINT;
        ctx.textAlign = x >= 0 ? 'left' : 'right';
        ctx.fillText(dirWord(y, '向上', '向下'), aX + (x >= 0 ? 8 : -8), (g.oy + aY) / 2);
      }
      ctx.restore();
      drawFlag(ctx, aX, aY, CH_TEAL);
      labelPoint(ctx, aX, aY, 'A', x, y, CH_TEAL);
    } else {
      // 過該點作鉛垂線與水平線，讀兩軸上的刻度
      dashLine(ctx, aX, aY, aX, g.oy, CH_BRASS, [5, 4]);
      dashLine(ctx, aX, aY, g.ox, aY, CH_MINT, [5, 4]);
      drawDot(ctx, aX, g.oy, CH_BRASS, 5);
      drawDot(ctx, g.ox, aY, CH_MINT, 5);
      drawFlag(ctx, aX, aY, CH_TEAL);
      labelPoint(ctx, aX, aY, 'A', x, y, CH_TEAL);
      ctx.save();
      ctx.font = f(800, 13);
      ctx.fillStyle = CH_BRASS;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`鉛垂線交 x 軸於 ${x}`, aX, g.oy + 20);
      ctx.fillStyle = CH_MINT;
      // 點在 y 軸左邊時把標註放右邊（反之亦然），才不會壓到點與旗子
      const away = (x >= 0) ? -1 : 1;
      ctx.textAlign = (away > 0) ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`水平線交 y 軸於 ${y}`, g.ox + away * 10, aY - 15);
      ctx.restore();
    }

    drawNote(ctx, mode === 'walk'
      ? '先沿 x 軸左右走，再沿 y 軸上下走'
      : '兩條線交在兩軸上的讀數，就是它的坐標',
      cv.height - 16, MUTED, 13.5);

    out.innerHTML = `${wbrEq(`A(${x}, ${y})`)}<wbr>` +
      `\\( \\)<span style="color:${CH_BRASS}">\\(x\\) 坐標 \\(=${x}\\)</span>` +
      `<wbr>\\( \\)<span style="color:${CH_MINT}">\\(y\\) 坐標 \\(=${y}\\)</span>`;

    fb.innerHTML = wrapFeedback(mode === 'walk'
      ? `<b style="color:${CH_BRASS}">第一步：${dirWord(x, '向右走', '向左走')} 單位</b><br>` +
        `<b style="color:${CH_MINT}">第二步：${dirWord(y, '向上走', '向下走')} 單位</b><br>` +
        `停在 \\(A(${x}, ${y})\\)。先上下再左右也會到同一個地方，但寫下來一定是 \\((${x}, ${y})\\)。`
      : `<b style="color:${CH_BRASS}">過 \\(A\\) 作鉛垂線 \\(\\Rightarrow\\) 交 \\(x\\) 軸於 ${x}</b><br>` +
        `<b style="color:${CH_MINT}">過 \\(A\\) 作水平線 \\(\\Rightarrow\\) 交 \\(y\\) 軸於 ${y}</b><br>` +
        `所以 \\(A\\) 點的坐標是 \\((${x}, ${y})\\)，先寫 \\(x\\) 再寫 \\(y\\)。`);
    typeset([out, fb]);
  }

  bindPickGroup(document.getElementById('wk-mode-group'), 'data-wkmode', v => { mode = v; draw(); });
  xS.addEventListener('input', draw);
  yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 3：離軸偵測器
   ========================================================================== */
function initAxisCanvas() {
  const cv = document.getElementById('canvas-axis');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const xS = document.getElementById('ax-x-slider');
  const yS = document.getElementById('ax-y-slider');
  const xV = document.getElementById('ax-x-val');
  const yV = document.getElementById('ax-y-val');
  const out = document.getElementById('ax-formula');
  const fb = document.getElementById('ax-feedback');

  function draw() {
    const x = parseInt(xS.value, 10);
    const y = parseInt(yS.value, 10);
    xV.textContent = x;
    yV.textContent = y;
    const onX = (y === 0);
    const onY = (x === 0);
    const isO = onX && onY;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `P(${x} , ${y}) 落在哪一條軸上？`, CH_SKY);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 26, min: -7, max: 7, labelEvery: 1, axisColor: CH_SLATE });

    // 落在哪條軸上，就把整條軸點亮
    ctx.save();
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.5;
    if (onX) {
      ctx.strokeStyle = CH_SKY;
      ctx.beginPath();
      ctx.moveTo(g.px(-7), g.oy);
      ctx.lineTo(g.px(7), g.oy);
      ctx.stroke();
    }
    if (onY) {
      ctx.strokeStyle = CH_MINT;
      ctx.beginPath();
      ctx.moveTo(g.ox, g.py(-7));
      ctx.lineTo(g.ox, g.py(7));
      ctx.stroke();
    }
    ctx.restore();

    const pX = g.px(x), pY = g.py(y);
    drawFlag(ctx, pX, pY, isO ? CH_BRASS : (onX || onY ? CH_SKY : CH_CORAL));
    labelPoint(ctx, pX, pY, 'P', x, y, isO ? CH_BRASS : (onX || onY ? CH_SKY : CH_CORAL));

    let verdict, vc;
    if (isO) { verdict = '兩個坐標都是 0：這是原點，兩條軸都在'; vc = CH_BRASS; }
    else if (onX) { verdict = 'y 坐標是 0：落在 x 軸上'; vc = CH_SKY; }
    else if (onY) { verdict = 'x 坐標是 0：落在 y 軸上'; vc = CH_MINT; }
    else { verdict = '兩個坐標都不是 0：不在任何一條軸上'; vc = CH_CORAL; }
    drawNote(ctx, verdict, cv.height - 34, vc, 14);
    drawNote(ctx, '坐標軸上的點不屬於任何一個象限', cv.height - 14, MUTED, 12.5);

    out.innerHTML = `${wbrEq(`P(${x}, ${y})`)}<wbr>\\( \\)` +
      `<span style="color:${vc}">${isO ? '原點' : (onX ? '在 x 軸上' : (onY ? '在 y 軸上' : '不在坐標軸上'))}</span>`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${vc}">${isO ? '\\(x=0\\) 且 \\(y=0\\)' : (onX ? '\\(y = 0\\)' : (onY ? '\\(x = 0\\)' : `\\(x = ${x} \\ne 0\\)，\\(y = ${y} \\ne 0\\)`))}</b><br>` +
      (isO
        ? `原點 \\(O(0,0)\\) 同時滿足 \\(x\\) 軸的 \\((m,0)\\) 與 \\(y\\) 軸的 \\((0,n)\\)，所以兩條軸都在它上面。`
        : onX
          ? `只要 \\(y\\) 坐標是 \\(0\\)，這個點就在 \\(x\\) 軸上——上下完全沒有離開過那條線。`
          : onY
            ? `只要 \\(x\\) 坐標是 \\(0\\)，這個點就在 \\(y\\) 軸上——左右完全沒有離開過那條線。`
            : `兩個坐標都不是 \\(0\\)，代表它左右也離開了、上下也離開了，落在某一個象限裡（重點 8 會判是哪一個）。`));
    typeset([out, fb]);
  }

  xS.addEventListener('input', draw);
  yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 4：兩軸測距儀
   ========================================================================== */
function initDistCanvas() {
  const cv = document.getElementById('canvas-dist');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const xS = document.getElementById('di-x-slider');
  const yS = document.getElementById('di-y-slider');
  const xV = document.getElementById('di-x-val');
  const yV = document.getElementById('di-y-val');
  const out = document.getElementById('di-formula');
  const fb = document.getElementById('di-feedback');
  let mode = 'both';

  function draw() {
    const x = parseInt(xS.value, 10);
    const y = parseInt(yS.value, 10);
    xV.textContent = x;
    yV.textContent = y;
    const dy = Math.abs(x); // 到 y 軸的距離
    const dx = Math.abs(y); // 到 x 軸的距離
    const showToY = (mode === 'both' || mode === 'toy');
    const showToX = (mode === 'both' || mode === 'tox');

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `P(${x} , ${y}) 離兩條軸各有多遠？`, CH_CORAL);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 26, min: -7, max: 7, labelEvery: 1, axisColor: CH_SLATE });
    const pX = g.px(x), pY = g.py(y);

    ctx.save();
    ctx.lineCap = 'round';
    // 到 y 軸：水平的一段，長度 |x|
    if (showToY) {
      ctx.strokeStyle = CH_BRASS;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.ox, pY);
      ctx.lineTo(pX, pY);
      ctx.stroke();
      dashLine(ctx, g.ox, pY, g.ox, g.oy, 'rgba(252, 211, 77, 0.35)');
    }
    // 到 x 軸：鉛垂的一段，長度 |y|
    if (showToX) {
      ctx.strokeStyle = CH_MINT;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pX, g.oy);
      ctx.lineTo(pX, pY);
      ctx.stroke();
      dashLine(ctx, pX, g.oy, g.ox, g.oy, 'rgba(110, 231, 183, 0.35)');
    }
    ctx.restore();

    drawFlag(ctx, pX, pY, CH_CORAL);
    // 水平量尺在點的哪一側，標籤就往另一側放
    labelPoint(ctx, pX, pY, 'P', x, y, CH_CORAL, { side: x < 0 ? 'left' : null, dy: -4 });

    // 兩段長度標在線段旁
    ctx.save();
    ctx.font = f(800, 13);
    ctx.textBaseline = 'middle';
    if (showToY && x !== 0) {
      ctx.fillStyle = CH_BRASS;
      ctx.textAlign = 'center';
      ctx.fillText(`到 y 軸 ${dy}`, (g.ox + pX) / 2, pY + 15);
    }
    if (showToX && y !== 0) {
      ctx.fillStyle = CH_MINT;
      ctx.textAlign = x >= 0 ? 'left' : 'right';
      ctx.fillText(`到 x 軸 ${dx}`, pX + (x >= 0 ? 10 : -10), (g.oy + pY) / 2);
    }
    ctx.restore();

    drawNote(ctx, '橫的那一段量的是 x 坐標，卻是「到 y 軸」的距離', cv.height - 34, CH_BRASS, 13);
    drawNote(ctx, '直的那一段量的是 y 坐標，卻是「到 x 軸」的距離', cv.height - 14, CH_MINT, 13);

    // 含 |…| 的算式不能交給 wbrEq（它不認得絕對值的直線），自己在等號處斷段
    const absEq = (axis, val, d) =>
      `\\(\\text{到 }${axis}\\text{ 軸}\\)<wbr>\\({}= |${val}|\\)<wbr>\\({}= ${d}\\)`;
    const parts = [];
    if (showToY) parts.push(`<span style="color:${CH_BRASS}">${absEq('y', x, dy)}</span>`);
    if (showToX) parts.push(`<span style="color:${CH_MINT}">${absEq('x', y, dx)}</span>`);
    out.innerHTML = `${wbrEq(`P(${x}, ${y})`)}<wbr>\\( \\)` + parts.join('<wbr>\\( \\)');

    let extra;
    if (dx === dy) extra = `此時兩段一樣長，\\(P\\) 到兩條軸<b>一樣遠</b>。`;
    else if (dx < dy) extra = `\\(${dx} < ${dy}\\)，所以 \\(P\\) 離 <b style="color:${CH_MINT}">\\(x\\) 軸比較近</b>。`;
    else extra = `\\(${dy} < ${dx}\\)，所以 \\(P\\) 離 <b style="color:${CH_BRASS}">\\(y\\) 軸比較近</b>。`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_BRASS}">到 \\(y\\) 軸：\\(|x| = |${x}| = ${dy}\\)</b><br>` +
      `<b style="color:${CH_MINT}">到 \\(x\\) 軸：\\(|y| = |${y}| = ${dx}\\)</b><br>` + extra);
    typeset([out, fb]);
  }

  bindPickGroup(document.getElementById('di-mode-group'), 'data-dimode', v => { mode = v; draw(); });
  xS.addEventListener('input', draw);
  yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 5：航行指令台（正推）
   ========================================================================== */
function initMoveCanvas() {
  const cv = document.getElementById('canvas-move');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const aS = document.getElementById('mv-a-slider');
  const bS = document.getElementById('mv-b-slider');
  const hS = document.getElementById('mv-h-slider');
  const vS = document.getElementById('mv-v-slider');
  const aV = document.getElementById('mv-a-val');
  const bV = document.getElementById('mv-b-val');
  const hV = document.getElementById('mv-h-val');
  const vV = document.getElementById('mv-v-val');
  const out = document.getElementById('mv-formula');
  const fb = document.getElementById('mv-feedback');

  function draw() {
    const a = parseInt(aS.value, 10);
    const b = parseInt(bS.value, 10);
    const h = parseInt(hS.value, 10);
    const v = parseInt(vS.value, 10);
    aV.textContent = a; bV.textContent = b; hV.textContent = h; vV.textContent = v;
    const nx = a + h, ny = b + v;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `從 A(${a} , ${b}) 出發，會停在哪裡？`, CH_MINT);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 21, min: -8, max: 8, labelEvery: 2, axisColor: CH_SLATE });
    const aX = g.px(a), aY = g.py(b);
    const mX = g.px(nx), mY = g.py(b);
    const nX = g.px(nx), nY = g.py(ny);

    if (h !== 0) drawArrow(ctx, aX, aY, mX, mY, CH_BRASS, 2.5);
    if (v !== 0) drawArrow(ctx, mX, mY, nX, nY, CH_MINT, 2.5);

    drawFlag(ctx, aX, aY, CH_SKY);
    labelPoint(ctx, aX, aY, 'A', a, b, CH_SKY, 'left');
    drawFlag(ctx, nX, nY, CH_MINT);
    labelPoint(ctx, nX, nY, 'B', nx, ny, CH_MINT);

    // 畫布上的逐行推導（開發約束 22：算式要畫在畫布上）
    const rows = [
      {
        name: '① 水平航程', hint: dirWord(h, '向右', '向左') + ' 單位，只改 x',
        items: [inkItems(`x = ${a} ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${nx}`, CH_BRASS)], color: CH_BRASS
      },
      {
        name: '② 鉛垂航程', hint: dirWord(v, '向上', '向下') + ' 單位，只改 y',
        items: [inkItems(`y = ${b} ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${ny}`, CH_MINT)], color: CH_MINT
      },
      {
        name: '③ 停泊點', hint: '兩個坐標各算各的',
        items: [inkItems(`B(${nx}, ${ny})`, CH_SKY)], color: CH_SKY
      }
    ];
    drawStepRows(ctx, rows, 3, { top: 418, gap: 33, labX: 18, eqX: 176, size: 18, color: CH_SLATE });

    out.innerHTML = `${wbrEq(`A(${a}, ${b})`)}<wbr>\\( \\)` +
      `<span style="color:${CH_BRASS}">${wbrEq(`x: ${a} ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${nx}`)}</span><wbr>\\( \\)` +
      `<span style="color:${CH_MINT}">${wbrEq(`y: ${b} ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${ny}`)}</span><wbr>\\( \\)` +
      `${wbrEq(`B(${nx}, ${ny})`)}`;

    const still = (h === 0 && v === 0);
    fb.innerHTML = wrapFeedback(still
      ? `<b style="color:${MUTED}">兩段航程都是 \\(0\\)，船沒有動</b><br>所以終點就是起點 \\(A(${a}, ${b})\\)。把任一支航程滑桿推離 \\(0\\) 再看看。`
      : `<b style="color:${CH_BRASS}">${dirWord(h, '向右', '向左')} 單位：\\(x\\) 由 \\(${a}\\) 變成 \\(${nx}\\)</b><br>` +
        `<b style="color:${CH_MINT}">${dirWord(v, '向上', '向下')} 單位：\\(y\\) 由 \\(${b}\\) 變成 \\(${ny}\\)</b><br>` +
        `終點是 \\(B(${nx}, ${ny})\\)。${h === 0 ? '水平沒有移動，\\(x\\) 坐標原封不動抄下來。' : (v === 0 ? '鉛垂沒有移動，\\(y\\) 坐標原封不動抄下來。' : '兩段先後順序對調，落點還是同一個。')}`);
    typeset([out, fb]);
  }

  [aS, bS, hS, vS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 6：回航推算台（回推）
   ========================================================================== */
function initBackCanvas() {
  const cv = document.getElementById('canvas-back');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pS = document.getElementById('bk-p-slider');
  const qS = document.getElementById('bk-q-slider');
  const hS = document.getElementById('bk-h-slider');
  const vS = document.getElementById('bk-v-slider');
  const stS = document.getElementById('bk-step-slider');
  const pV = document.getElementById('bk-p-val');
  const qV = document.getElementById('bk-q-val');
  const hV = document.getElementById('bk-h-val');
  const vV = document.getElementById('bk-v-val');
  const stV = document.getElementById('bk-step-val');
  const out = document.getElementById('bk-formula');
  const fb = document.getElementById('bk-feedback');

  function draw() {
    const p = parseInt(pS.value, 10);
    const q = parseInt(qS.value, 10);
    const h = parseInt(hS.value, 10);
    const v = parseInt(vS.value, 10);
    const step = parseInt(stS.value, 10);
    pV.textContent = p; qV.textContent = q; hV.textContent = h; vV.textContent = v; stV.textContent = step;
    const a = p - h, b = q - v;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `已知終點 F(${p} , ${q})，起點 E 在哪裡？`, CH_VIOLET);

    const g = drawPlane(ctx, { cx: cv.width / 2, top: 58, unit: 19, min: -8, max: 8, labelEvery: 2, axisColor: CH_SLATE });
    const fX = g.px(p), fY = g.py(q);
    const eX = g.px(a), eY = g.py(b);
    const midX = g.px(p), midY = g.py(b);

    // 由終點倒著走回起點：兩支箭頭都由 F 指向 E
    if (v !== 0) drawArrow(ctx, fX, fY, midX, midY, CH_MINT, 2.5);
    if (h !== 0) drawArrow(ctx, midX, midY, eX, eY, CH_BRASS, 2.5);

    drawFlag(ctx, fX, fY, CH_VIOLET);
    labelPoint(ctx, fX, fY, 'F', p, q, CH_VIOLET);
    if (step >= 4) {
      drawFlag(ctx, eX, eY, CH_MINT);
      labelPoint(ctx, eX, eY, 'E', a, b, CH_MINT, 'left');
    } else {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(eX, eY, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = MUTED;
      ctx.font = f(800, 13);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('E(?, ?)', eX + 13, eY + 15);
      ctx.restore();
    }

    const rows = [
      {
        name: '① 設起點', hint: '未知的那一個先給名字',
        items: [inkItems('E(a, b)', CH_SLATE)], color: CH_SLATE
      },
      {
        name: '② 水平那一段', hint: dirWord(h, '向右', '向左') + ' 單位，列成方程式',
        items: [inkItems(`a ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${p}`, CH_BRASS)], color: CH_BRASS
      },
      {
        name: '③ 鉛垂那一段', hint: dirWord(v, '向上', '向下') + ' 單位，列成方程式',
        items: [inkItems(`b ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${q}`, CH_MINT)], color: CH_MINT
      },
      {
        name: '④ 解出起點', hint: `a = ${p} ${h < 0 ? '+' : '-'} ${Math.abs(h)}，b = ${q} ${v < 0 ? '+' : '-'} ${Math.abs(v)}`,
        items: [inkItems(`E(${a}, ${b})`, CH_VIOLET)], color: CH_VIOLET
      }
    ];
    drawStepRows(ctx, rows, step, { top: 398, gap: 33, labX: 18, eqX: 186, size: 18, color: CH_SLATE });

    const texts = [
      `E(a, b)`,
      `a ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${p}`,
      `b ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${q}`,
      `E(${a}, ${b})`
    ];
    out.innerHTML = texts.slice(0, step).map(t => wbrEq(t)).join('<wbr>\\( \\;\\Rightarrow\\; \\)');

    const hintMap = [
      `<b style="color:${CH_SLATE}">先給起點一個名字</b><br>起點未知，設它是 \\(E(a,b)\\)。接下來把兩段航程各寫成一條一元一次方程式。`,
      `<b style="color:${CH_BRASS}">水平：${dirWord(h, '向右', '向左')} 單位</b><br>` +
        `起點的 \\(x\\) 坐標 \\(a\\) 經過這一段之後變成終點的 \\(${p}\\)，所以 \\(a ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${p}\\)。`,
      `<b style="color:${CH_MINT}">鉛垂：${dirWord(v, '向上', '向下')} 單位</b><br>` +
        `起點的 \\(y\\) 坐標 \\(b\\) 經過這一段之後變成終點的 \\(${q}\\)，所以 \\(b ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${q}\\)。`,
      `<b style="color:${CH_VIOLET}">解得 \\(a = ${a}\\)、\\(b = ${b}\\)，起點是 \\(E(${a}, ${b})\\)</b><br>` +
        `也可以倒著走：從 \\(F\\) 改成${dirWord(-h, '向右', '向左')}、${dirWord(-v, '向上', '向下')} 單位，一樣到 \\(E\\)。` +
        `驗算：\\(${a} ${h < 0 ? '-' : '+'} ${Math.abs(h)} = ${p}\\)、\\(${b} ${v < 0 ? '-' : '+'} ${Math.abs(v)} = ${q}\\)，回得到 \\(F\\)。`
    ];
    fb.innerHTML = wrapFeedback(hintMap[step - 1]);
    typeset([out, fb]);
  }

  [pS, qS, hS, vS, stS].forEach(s => s.addEventListener('input', draw));
  draw();
}

/* ==========================================================================
   重點 7：海圖重繪台（自訂原點）
   ========================================================================== */
// 地標在方格圖上的原始格號（左下角為 (0,0)），與坐標系無關
const CH_MARKS = [
  { name: '碼頭', gx: 3, gy: 3, icon: 'pier' },
  { name: '燈塔', gx: 1, gy: 5, icon: 'light' },
  { name: '沉船', gx: 2, gy: 1, icon: 'wreck' },
  { name: '浮標', gx: 5, gy: 4, icon: 'buoy' },
  { name: '礁石', gx: 5, gy: 1, icon: 'reef' },
  { name: '漁村', gx: 0, gy: 2, icon: 'village' }
];

function drawMarkIcon(ctx, x, y, kind, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  if (kind === 'light') {
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 7);
    ctx.lineTo(x - 3, y - 7);
    ctx.lineTo(x + 3, y - 7);
    ctx.lineTo(x + 5, y + 7);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 9, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'pier') {
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 3);
    ctx.lineTo(x + 8, y - 3);
    ctx.stroke();
    [-5, 0, 5].forEach(dx => {
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 3);
      ctx.lineTo(x + dx, y + 6);
      ctx.stroke();
    });
  } else if (kind === 'buoy') {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
  } else if (kind === 'wreck') {
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 5);
    ctx.lineTo(x + 8, y + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 3);
    ctx.lineTo(x - 5, y - 7);
    ctx.stroke();
  } else if (kind === 'reef') {
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 6);
    ctx.lineTo(x - 2, y - 5);
    ctx.lineTo(x + 2, y + 2);
    ctx.lineTo(x + 6, y - 3);
    ctx.lineTo(x + 9, y + 6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 6);
    ctx.lineTo(x - 7, y - 1);
    ctx.lineTo(x - 2, y - 6);
    ctx.lineTo(x + 3, y - 1);
    ctx.lineTo(x + 3, y + 6);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function initOriginCanvas() {
  const cv = document.getElementById('canvas-origin');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const pkS = document.getElementById('og-pick-slider');
  const pkV = document.getElementById('og-pick-val');
  const out = document.getElementById('og-formula');
  const fb = document.getElementById('og-feedback');
  let originIdx = 0;

  function draw() {
    const pick = parseInt(pkS.value, 10) - 1;
    pkV.textContent = CH_MARKS[pick].name;
    const O = CH_MARKS[originIdx];
    const sel = CH_MARKS[pick];
    const sx = sel.gx - O.gx, sy = sel.gy - O.gy;

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `以「${O.name}」為原點，重新讀整張海圖`, CH_AMBER);

    // 方格地圖：原始格號 0..6，畫成 7x7 的格線
    const unit = 46;
    const left = (cv.width - 6 * unit) / 2;
    const top = 72;
    const gx2px = u => left + u * unit;
    const gy2px = v => top + (6 - v) * unit;
    const ox = gx2px(O.gx), oy = gy2px(O.gy);

    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.13)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(gx2px(i), gy2px(0)); ctx.lineTo(gx2px(i), gy2px(6)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx2px(0), gy2px(i)); ctx.lineTo(gx2px(6), gy2px(i)); ctx.stroke();
    }
    // 由選定的原點畫出兩條坐標軸（依開發約束 34，只在正向那端加箭頭）
    ctx.strokeStyle = CH_AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx2px(0) - 10, oy); ctx.lineTo(gx2px(6) + 6, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, gy2px(0) + 10); ctx.lineTo(ox, gy2px(6) - 6); ctx.stroke();
    ctx.restore();
    axisArrow(ctx, gx2px(6) + 6, oy, 'right', CH_AMBER);
    axisArrow(ctx, ox, gy2px(6) - 6, 'up', CH_AMBER);
    ctx.save();
    ctx.fillStyle = CH_AMBER;
    ctx.font = fi(700, 13);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('x', gx2px(6) + 20, oy);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('y', ox, gy2px(6) - 20);
    ctx.restore();

    // 六個地標
    CH_MARKS.forEach((m, i) => {
      const x = gx2px(m.gx), y = gy2px(m.gy);
      const isO = (i === originIdx);
      const isSel = (i === pick);
      const col = isO ? CH_BRASS : (isSel ? CH_MOSS : CH_SLATE);
      drawMarkIcon(ctx, x, y - 2, m.icon, col);
      ctx.save();
      const coord = `(${m.gx - O.gx}, ${m.gy - O.gy})`;
      ctx.font = f(800, 12);
      const tw = Math.max(ctx.measureText(coord).width, ctx.measureText(m.name).width) + 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      roundRect(ctx, x - tw / 2, y + 6, tw, 28, 6);
      ctx.fill();
      ctx.font = f(isSel || isO ? 800 : 600, 11.5);
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(m.name, x, y + 8);
      ctx.font = f(800, 12);
      ctx.fillText(coord, x, y + 21);
      ctx.restore();
      if (isSel && !isO) {
        ctx.save();
        ctx.strokeStyle = CH_MOSS;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(x, y - 1, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    drawNote(ctx, `${O.name}是原點 (0, 0)；${sel.name}要向${sx >= 0 ? '右' : '左'} ${Math.abs(sx)}、向${sy >= 0 ? '上' : '下'} ${Math.abs(sy)}`,
      cv.height - 34, CH_MOSS, 13.5);
    drawNote(ctx, '換一個地標當原點，每個坐標都會變，但彼此的相對位置不變', cv.height - 14, MUTED, 12.5);

    out.innerHTML = `<span style="color:${CH_BRASS}">${wbrEq(`\\text{${O.name}}(0, 0)`)}</span>` +
      `<wbr>\\( \\)<span style="color:${CH_MOSS}">${wbrEq(`\\text{${sel.name}}(${sx}, ${sy})`)}</span>`;

    fb.innerHTML = wrapFeedback(
      `<b style="color:${CH_BRASS}">原點設在${O.name}</b><br>` +
      (pick === originIdx
        ? `你選的正是原點本身，所以它的坐標就是 \\((0,0)\\)。換一支滑桿位置讀別的地標看看。`
        : `\\(x\\) 坐標：${sel.name}在${O.name}的${sx >= 0 ? '右' : '左'}方 \\(${Math.abs(sx)}\\) 格 \\(\\Rightarrow ${sx}\\)<br>` +
          `\\(y\\) 坐標：${sel.name}在${O.name}的${sy >= 0 ? '上' : '下'}方 \\(${Math.abs(sy)}\\) 格 \\(\\Rightarrow ${sy}\\)<br>` +
          `所以${sel.name}的坐標是 \\((${sx}, ${sy})\\)。`));
    typeset([out, fb]);
  }

  bindPickGroup(document.getElementById('og-origin-group'), 'data-ogorigin', v => { originIdx = parseInt(v, 10); draw(); });
  pkS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 8：四海域羅盤
   ========================================================================== */
function initQuadCanvas() {
  const cv = document.getElementById('canvas-quad');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const xS = document.getElementById('qd-x-slider');
  const yS = document.getElementById('qd-y-slider');
  const xV = document.getElementById('qd-x-val');
  const yV = document.getElementById('qd-y-val');
  const out = document.getElementById('qd-formula');
  const fb = document.getElementById('qd-feedback');

  const QCOL = [CH_SLATE, CH_MINT, CH_SKY, CH_VIOLET, CH_MAGENTA];
  const QSIGN = ['', '(+ , +)', '(- , +)', '(- , -)', '(+ , -)'];
  const QNUM = ['', '一', '二', '三', '四'];

  function draw() {
    const x = parseInt(xS.value, 10);
    const y = parseInt(yS.value, 10);
    xV.textContent = x;
    yV.textContent = y;
    const q = quadOf(x, y);

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `(${x} , ${y}) 落在哪一個象限？`, CH_MAGENTA);

    const M = 7;
    const unit = 26;
    const cx = cv.width / 2;
    const top = 58;
    const span = 2 * M * unit;
    const left = cx - span / 2;
    const px = u => left + (u + M) * unit;
    const py = v => top + (M - v) * unit;

    // 四塊區域先鋪底色（現在所在的那一塊加亮）
    const blocks = [
      { qi: 1, x0: 0, y0: M, x1: M, y1: 0 },
      { qi: 2, x0: -M, y0: M, x1: 0, y1: 0 },
      { qi: 3, x0: -M, y0: 0, x1: 0, y1: -M },
      { qi: 4, x0: 0, y0: 0, x1: M, y1: -M }
    ];
    blocks.forEach(b => {
      ctx.save();
      ctx.globalAlpha = (q === b.qi) ? 0.22 : 0.06;
      ctx.fillStyle = QCOL[b.qi];
      ctx.fillRect(px(b.x0), py(b.y0), px(b.x1) - px(b.x0), py(b.y1) - py(b.y0));
      ctx.restore();
      ctx.save();
      ctx.fillStyle = QCOL[b.qi];
      ctx.globalAlpha = (q === b.qi) ? 1 : 0.55;
      ctx.font = f(800, q === b.qi ? 15 : 13);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 名稱與符號併成一行，放在最外圈那一格：滑桿只到 ±6，旗子進不了這一圈
      const right = (b.qi === 1 || b.qi === 4);
      const upper = (b.qi === 1 || b.qi === 2);
      const mx = right ? px(M) - 8 : px(-M) + 8;
      const my = upper ? py(M) + 13 : py(-M) - 13;
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillText(`第${QNUM[b.qi]}象限 ${QSIGN[b.qi]}`, mx, my);
      ctx.restore();
    });

    const g = drawPlane(ctx, { cx: cx, top: top, unit: unit, min: -M, max: M, labelEvery: 2, axisColor: CH_SLATE });
    const pX = g.px(x), pY = g.py(y);
    drawFlag(ctx, pX, pY, q === 0 ? CH_BRASS : QCOL[q]);
    // 標籤朝原點那一側放，才不會擠到角落的象限名稱
    labelPoint(ctx, pX, pY, 'P', x, y, q === 0 ? CH_BRASS : QCOL[q],
      { side: x > 0 ? 'left' : null, dy: y < 0 ? -22 : 20 });

    if (q === 0) {
      drawNote(ctx, '有一個坐標是 0：落在界線上，不屬於任何象限', cv.height - 22, CH_BRASS, 14);
    } else {
      drawNote(ctx, `符號是 ${QSIGN[q]}，所以在第${QNUM[q]}象限`, cv.height - 22, QCOL[q], 14);
    }

    const col = q === 0 ? CH_BRASS : QCOL[q];
    out.innerHTML = `${wbrEq(`P(${x}, ${y})`)}<wbr>\\( \\)` +
      `<span style="color:${col}">${q === 0 ? '不屬於任何象限' : `符號 ${QSIGN[q]}，第${QNUM[q]}象限`}</span>`;

    fb.innerHTML = wrapFeedback(q === 0
      ? `<b style="color:${CH_BRASS}">${x === 0 && y === 0 ? '兩個坐標都是 \\(0\\)：這是原點' : (x === 0 ? '\\(x = 0\\)：落在 \\(y\\) 軸上' : '\\(y = 0\\)：落在 \\(x\\) 軸上')}</b><br>` +
        `兩條坐標軸是四個象限的<b>界線</b>，界線上的點不屬於任何一個象限。`
      : `<b style="color:${col}">\\(x = ${x}\\) 是${x > 0 ? '正' : '負'}數，\\(y = ${y}\\) 是${y > 0 ? '正' : '負'}數</b><br>` +
        `符號組合是 ${QSIGN[q]}，對照規則落在<b>第${QNUM[q]}象限</b>。<br>` +
        `判象限只看兩個符號，數字大小完全不影響。`);
    typeset([out, fb]);
  }

  xS.addEventListener('input', draw);
  yS.addEventListener('input', draw);
  draw();
}

/* ==========================================================================
   重點 9：符號推算盤
   ========================================================================== */
// 六個候選點：每一個分量的正負都只由 s、t 的正負決定
const CH_EXPRS = [
  {
    tex: 'B(t, |s|)', name: 'B',
    c1: {
      tex: 't', why: (ss) => `t 是${ss.t > 0 ? '正' : '負'}數`, sign: (ss) => ss.t,
      items: (c) => IT('t', c)
    },
    c2: {
      tex: '|s|', why: () => '絕對值必為正', sign: () => 1,
      items: (c) => SEQ([T('|', c), IT('s', c), T('|', c)], c, 1)
    }
  },
  {
    tex: 'C(-s, \\dfrac{s}{t})', name: 'C',
    c1: {
      tex: '-s', why: (ss) => `s 是${ss.s > 0 ? '正' : '負'}數，加負號翻向`, sign: (ss) => -ss.s,
      items: (c) => SEQ([T('-', c), IT('s', c)], c, 2)
    },
    c2: {
      tex: '\\dfrac{s}{t}', why: (ss) => (ss.s === ss.t ? '同號相除得正' : '異號相除得負'),
      sign: (ss) => ss.s * ss.t,
      items: (c) => VF(IT('s', c), IT('t', c), c)
    }
  },
  {
    tex: 'D(st, -t)', name: 'D',
    c1: {
      tex: 'st', why: (ss) => (ss.s === ss.t ? '同號相乘得正' : '異號相乘得負'),
      sign: (ss) => ss.s * ss.t,
      items: (c) => SEQ([IT('s', c), IT('t', c)], c, 1)
    },
    c2: {
      tex: '-t', why: (ss) => `t 是${ss.t > 0 ? '正' : '負'}數，加負號翻向`, sign: (ss) => -ss.t,
      items: (c) => SEQ([T('-', c), IT('t', c)], c, 2)
    }
  },
  {
    tex: 'E(s^2, st)', name: 'E',
    c1: {
      tex: 's^2', why: () => '平方必為正', sign: () => 1,
      items: (c) => PW(IT('s', c), 2, false, c)
    },
    c2: {
      tex: 'st', why: (ss) => (ss.s === ss.t ? '同號相乘得正' : '異號相乘得負'),
      sign: (ss) => ss.s * ss.t,
      items: (c) => SEQ([IT('s', c), IT('t', c)], c, 1)
    }
  },
  {
    tex: 'F(-|t|, s)', name: 'F',
    c1: {
      tex: '-|t|', why: () => '絕對值為正，加上負號必為負', sign: () => -1,
      items: (c) => SEQ([T('-', c), T('|', c), IT('t', c), T('|', c)], c, 1)
    },
    c2: {
      tex: 's', why: (ss) => `s 是${ss.s > 0 ? '正' : '負'}數`, sign: (ss) => ss.s,
      items: (c) => IT('s', c)
    }
  },
  {
    tex: 'G(\\dfrac{t}{s}, -s)', name: 'G',
    c1: {
      tex: '\\dfrac{t}{s}', why: (ss) => (ss.s === ss.t ? '同號相除得正' : '異號相除得負'),
      sign: (ss) => ss.s * ss.t,
      items: (c) => VF(IT('t', c), IT('s', c), c)
    },
    c2: {
      tex: '-s', why: (ss) => `s 是${ss.s > 0 ? '正' : '負'}數，加負號翻向`, sign: (ss) => -ss.s,
      items: (c) => SEQ([T('-', c), IT('s', c)], c, 2)
    }
  }
];

// 各象限對應的 (s, t) 符號
const CH_QSIGNS = { 1: { s: 1, t: 1 }, 2: { s: -1, t: 1 }, 3: { s: -1, t: -1 }, 4: { s: 1, t: -1 } };

function initSignCanvas() {
  const cv = document.getElementById('canvas-sign');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const eS = document.getElementById('sg-expr-slider');
  const stS = document.getElementById('sg-step-slider');
  const eV = document.getElementById('sg-expr-val');
  const stV = document.getElementById('sg-step-val');
  const out = document.getElementById('sg-formula');
  const fb = document.getElementById('sg-feedback');
  let quad = 2;

  const QNUM = ['', '一', '二', '三', '四'];
  const QCOL = [CH_SLATE, CH_MINT, CH_SKY, CH_VIOLET, CH_MAGENTA];

  function draw() {
    const ei = parseInt(eS.value, 10) - 1;
    const step = parseInt(stS.value, 10);
    const ex = CH_EXPRS[ei];
    const ss = CH_QSIGNS[quad];
    eV.textContent = ex.name;
    stV.textContent = step;

    const s1 = ex.c1.sign(ss) > 0 ? 1 : -1;
    const s2 = ex.c2.sign(ss) > 0 ? 1 : -1;
    const resQ = (s1 > 0 && s2 > 0) ? 1 : (s1 < 0 && s2 > 0) ? 2 : (s1 < 0 && s2 < 0) ? 3 : 4;
    const sgn = v => (v > 0 ? '+' : '-');

    ctx.clearRect(0, 0, cv.width, cv.height);
    drawTitle(ctx, `已知 A(s, t) 在第${QNUM[quad]}象限，${ex.name} 點在哪一象限？`, CH_MOSS);

    // 上方：四象限小地圖（左為 A、右為結論）
    const mapW = 122, mapH = 122;
    const gap = 46;
    const y0 = 46;
    const x1 = cv.width / 2 - mapW - gap / 2;
    const x2 = cv.width / 2 + gap / 2;

    function miniMap(mx, my, hi, caption, capColor) {
      const half = mapW / 2;
      const cells = [
        { qi: 1, dx: half, dy: 0 },
        { qi: 2, dx: 0, dy: 0 },
        { qi: 3, dx: 0, dy: half },
        { qi: 4, dx: half, dy: half }
      ];
      cells.forEach(c => {
        ctx.save();
        ctx.globalAlpha = (hi === c.qi) ? 0.3 : 0.06;
        ctx.fillStyle = QCOL[c.qi];
        ctx.fillRect(mx + c.dx, my + c.dy, half, half);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = (hi === c.qi) ? 1 : 0.5;
        ctx.fillStyle = QCOL[c.qi];
        ctx.font = f(800, hi === c.qi ? 16 : 13);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(QNUM[c.qi], mx + c.dx + half / 2, my + c.dy + half / 2);
        ctx.restore();
      });
      ctx.save();
      ctx.strokeStyle = CH_SLATE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(mx, my + half); ctx.lineTo(mx + mapW, my + half);
      ctx.moveTo(mx + half, my); ctx.lineTo(mx + half, my + mapH);
      ctx.stroke();
      ctx.fillStyle = capColor;
      ctx.font = f(800, 14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(caption, mx + half, my + mapH + 8);
      ctx.restore();
    }

    miniMap(x1, y0, quad, `A(s, t)`, CH_SLATE);
    miniMap(x2, y0, step >= 4 ? resQ : 0, step >= 4 ? `${ex.name} 在第${QNUM[resQ]}象限` : `${ex.name} 點：？`,
      step >= 4 ? QCOL[resQ] : MUTED);
    drawArrow(ctx, x1 + mapW + 8, y0 + mapH / 2, x2 - 8, y0 + mapH / 2, CH_MOSS, 2);

    // 下方：四步推導
    const rows = [
      {
        name: '① 定 s、t 的正負', hint: `第${QNUM[quad]}象限的符號是 (${sgn(ss.s)} , ${sgn(ss.t)})`,
        items: [inkItems(`s ${ss.s > 0 ? '>' : '<'} 0 , t ${ss.t > 0 ? '>' : '<'} 0`, CH_SLATE)], color: CH_SLATE
      },
      {
        name: `② 判 ${ex.name} 的 x 坐標`, hint: ex.c1.why(ss),
        items: [ex.c1.items(CH_BRASS), T(s1 > 0 ? '為正' : '為負', CH_BRASS)], color: CH_BRASS
      },
      {
        name: `③ 判 ${ex.name} 的 y 坐標`, hint: ex.c2.why(ss),
        items: [ex.c2.items(CH_MINT), T(s2 > 0 ? '為正' : '為負', CH_MINT)], color: CH_MINT
      },
      {
        name: '④ 對照象限規則', hint: `符號組合是 (${sgn(s1)} , ${sgn(s2)})`,
        items: [inkItems(`${ex.name} 在第${QNUM[resQ]}象限`, QCOL[resQ])], color: QCOL[resQ]
      }
    ];
    drawStepRows(ctx, rows, step, { top: 240, gap: 52, labX: 18, eqX: 196, size: 18, color: CH_SLATE });

    const texts = [
      `s ${ss.s > 0 ? '>' : '<'} 0 ,\\; t ${ss.t > 0 ? '>' : '<'} 0`,
      `${ex.c1.tex} \\;${s1 > 0 ? '>' : '<'}\\; 0`,
      `${ex.c2.tex} \\;${s2 > 0 ? '>' : '<'}\\; 0`,
      `(${sgn(s1)} , ${sgn(s2)})`
    ];
    const parts = texts.slice(0, step).map(t => `\\( ${t} \\)`);
    if (step >= 4) parts.push(`<span style="color:${QCOL[resQ]}">第${QNUM[resQ]}象限</span>`);
    out.innerHTML = parts.join('<wbr>\\( \\;\\Rightarrow\\; \\)');

    const hints = [
      `<b style="color:${CH_SLATE}">第${QNUM[quad]}象限的符號規則是 \\((${sgn(ss.s)} , ${sgn(ss.t)})\\)</b><br>` +
        `所以 \\(s ${ss.s > 0 ? '> 0' : '< 0'}\\)、\\(t ${ss.t > 0 ? '> 0' : '< 0'}\\)。這兩個結論是後面每一步的依據。`,
      `<b style="color:${CH_BRASS}">\\(${ex.c1.tex}\\)：${ex.c1.why(ss)}</b><br>` +
        `所以 \\(${ex.name}\\) 點的 \\(x\\) 坐標<b>為${s1 > 0 ? '正' : '負'}</b>。`,
      `<b style="color:${CH_MINT}">\\(${ex.c2.tex}\\)：${ex.c2.why(ss)}</b><br>` +
        `所以 \\(${ex.name}\\) 點的 \\(y\\) 坐標<b>為${s2 > 0 ? '正' : '負'}</b>。`,
      `<b style="color:${QCOL[resQ]}">符號組合 \\((${sgn(s1)} , ${sgn(s2)})\\) \\(\\Rightarrow\\) 第${QNUM[resQ]}象限</b><br>` +
        `整個過程<b>沒有算出任何一個數字</b>——判象限只需要正負號。`
    ];
    fb.innerHTML = wrapFeedback(hints[step - 1]);
    typeset([out, fb]);
  }

  bindPickGroup(document.getElementById('sg-quad-group'), 'data-sgquad', v => { quad = parseInt(v, 10); draw(); });
  eS.addEventListener('input', draw);
  stS.addEventListener('input', draw);
  draw();
}
