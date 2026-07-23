/* ==========================================================================
   Classroom Annotator - 課堂畫筆標註工具
   --------------------------------------------------------------------------
   純 Vanilla JavaScript，零相依（圖示使用頁面既有的 Font Awesome 6）。
   使用方式：在任一頁面的 </body> 前加入
     <link rel="stylesheet" href="annotate.css">
     <script src="annotate.js"></script>
   即會自動注入浮動按鈕、工具列與全螢幕標註畫布。

   設計重點：
   - Pointer Events 統一處理滑鼠 / 觸控 / 觸控筆，支援智慧觸控白板。
   - 以「向量筆畫陣列 + 已完成筆畫離屏畫布」保存內容，復原與縮放皆不失真。
   - devicePixelRatio 補償，避免 Retina / 高解析白板出現落筆偏移。
   ========================================================================== */
(function () {
  'use strict';

  const COLORS = [
    { name: '紅', value: '#ef4444' },
    { name: '黃', value: '#facc15' },
    { name: '青', value: '#22d3ee' },
    { name: '綠', value: '#4ade80' },
    { name: '白', value: '#ffffff' },
    { name: '紫', value: '#c084fc' }
  ];

  const SIZES = [
    { name: '細', value: 3, dot: 6 },
    { name: '中', value: 6, dot: 11 },
    { name: '粗', value: 12, dot: 16 }
  ];

  // 各工具相對於基礎筆寬的倍率
  const WIDTH_SCALE = { pen: 1, highlighter: 4, eraser: 6 };
  const MAX_STROKES = 500;

  const state = {
    active: false,
    tool: 'pen',
    color: COLORS[0].value,
    size: SIZES[1].value,
    strokes: [],
    current: null,
    drawing: false,
    dpr: 1
  };

  let canvas, ctx, buffer, bctx, toolbar, toggleBtn, rafId = null;

  /* ------------------------------------------------------------------
     DOM 建立
     ------------------------------------------------------------------ */
  function build() {
    canvas = document.createElement('canvas');
    canvas.className = 'annot-canvas';
    canvas.id = 'annot-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    buffer = document.createElement('canvas');
    bctx = buffer.getContext('2d');

    toolbar = document.createElement('div');
    toolbar.className = 'annot-toolbar';
    toolbar.id = 'annot-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', '課堂畫筆工具列');
    toolbar.innerHTML = `
      <div class="annot-group" data-group="tools">
        <button type="button" class="annot-btn active" data-tool="pen" title="畫筆 (P)" aria-label="畫筆"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="annot-btn" data-tool="highlighter" title="螢光筆 (H)" aria-label="螢光筆"><i class="fa-solid fa-highlighter"></i></button>
        <button type="button" class="annot-btn" data-tool="eraser" title="橡皮擦 (E)" aria-label="橡皮擦"><i class="fa-solid fa-eraser"></i></button>
      </div>
      <div class="annot-group" data-group="colors">
        ${COLORS.map((c, i) => `<button type="button" class="annot-swatch${i === 0 ? ' active' : ''}" data-color="${c.value}" style="background:${c.value}" title="${c.name}色" aria-label="${c.name}色"></button>`).join('')}
      </div>
      <div class="annot-group" data-group="sizes">
        ${SIZES.map((s, i) => `<button type="button" class="annot-size${i === 1 ? ' active' : ''}" data-size="${s.value}" title="${s.name}筆畫" aria-label="${s.name}筆畫"><span class="dot" style="width:${s.dot}px;height:${s.dot}px"></span></button>`).join('')}
      </div>
      <div class="annot-group" data-group="actions">
        <button type="button" class="annot-btn" data-action="undo" title="復原 (Ctrl+Z)" aria-label="復原"><i class="fa-solid fa-rotate-left"></i></button>
        <button type="button" class="annot-btn danger" data-action="clear" title="全部清除 (C)" aria-label="全部清除"><i class="fa-solid fa-trash-can"></i></button>
        <button type="button" class="annot-btn" data-action="save" title="下載標註圖片" aria-label="下載標註圖片"><i class="fa-solid fa-download"></i></button>
        <button type="button" class="annot-btn danger" data-action="close" title="結束標註 (Esc)" aria-label="結束標註"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
    document.body.appendChild(toolbar);

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'annot-toggle-btn';
    toggleBtn.id = 'annot-toggle';
    toggleBtn.title = '課堂畫筆（在畫面上直接標註）';
    toggleBtn.setAttribute('aria-label', '開啟課堂畫筆');
    toggleBtn.innerHTML = '<i class="fa-solid fa-pen-nib"></i>';
    document.body.appendChild(toggleBtn);
  }

  /* ------------------------------------------------------------------
     畫布尺寸與重繪
     ------------------------------------------------------------------ */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    state.dpr = window.devicePixelRatio || 1;

    [canvas, buffer].forEach(cv => {
      cv.width = Math.round(w * state.dpr);
      cv.height = Math.round(h * state.dpr);
    });
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    bctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    rebuildBuffer();
    render();
  }

  function strokeStyleFor(target, stroke) {
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.lineWidth = stroke.size * (WIDTH_SCALE[stroke.tool] || 1);
    if (stroke.tool === 'eraser') {
      target.globalCompositeOperation = 'destination-out';
      target.globalAlpha = 1;
      target.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      target.globalCompositeOperation = 'source-over';
      target.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
      target.strokeStyle = stroke.color;
    }
  }

  function drawStroke(target, stroke) {
    const pts = stroke.points;
    if (!pts.length) return;
    strokeStyleFor(target, stroke);
    target.beginPath();
    if (pts.length === 1) {
      // 單點輕觸畫成圓點
      target.arc(pts[0].x, pts[0].y, target.lineWidth / 2, 0, Math.PI * 2);
      target.fillStyle = target.strokeStyle;
      target.fill();
    } else {
      target.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        // 以中點做二次曲線，讓筆跡平滑
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        target.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      target.lineTo(last.x, last.y);
      target.stroke();
    }
    target.globalCompositeOperation = 'source-over';
    target.globalAlpha = 1;
  }

  // 重播所有已完成筆畫到離屏畫布（復原、縮放時使用）
  function rebuildBuffer() {
    bctx.save();
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, buffer.width, buffer.height);
    bctx.restore();
    state.strokes.forEach(s => drawStroke(bctx, s));
  }

  function render() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buffer, 0, 0);
    ctx.restore();
    if (state.current) drawStroke(ctx, state.current);
  }

  function scheduleRender() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      render();
    });
  }

  /* ------------------------------------------------------------------
     繪圖事件（Pointer Events：滑鼠 / 觸控 / 觸控筆通用）
     ------------------------------------------------------------------ */
  function pointFrom(e) {
    // 畫布為 fixed 全螢幕，client 座標即為畫布座標
    return { x: e.clientX, y: e.clientY };
  }

  function onPointerDown(e) {
    if (!state.active) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    state.drawing = true;
    state.current = {
      tool: state.tool,
      color: state.color,
      size: state.size,
      points: [pointFrom(e)]
    };
    scheduleRender();
  }

  function onPointerMove(e) {
    if (!state.active || !state.drawing || !state.current) return;
    e.preventDefault();
    const pts = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    pts.forEach(p => state.current.points.push(pointFrom(p)));
    scheduleRender();
  }

  function onPointerUp(e) {
    if (!state.drawing || !state.current) return;
    e.preventDefault();
    if (canvas.hasPointerCapture && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    drawStroke(bctx, state.current);
    state.strokes.push(state.current);
    if (state.strokes.length > MAX_STROKES) {
      state.strokes.shift();
      rebuildBuffer();
    }
    state.current = null;
    state.drawing = false;
    render();
  }

  /* ------------------------------------------------------------------
     動作
     ------------------------------------------------------------------ */
  function undo() {
    if (!state.strokes.length) return;
    state.strokes.pop();
    rebuildBuffer();
    render();
  }

  function clearAll() {
    if (!state.strokes.length) return;
    state.strokes = [];
    rebuildBuffer();
    render();
  }

  function saveImage() {
    // 合成深色底，避免透明 PNG 在其他軟體看不到白色筆跡
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext('2d');
    octx.fillStyle = '#0f172a';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const link = document.createElement('a');
    link.download = `課堂標註_${stamp}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  }

  function setTool(tool) {
    state.tool = tool;
    toolbar.querySelectorAll('[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }

  function setColor(color) {
    state.color = color;
    toolbar.querySelectorAll('[data-color]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  function setSize(size) {
    state.size = size;
    toolbar.querySelectorAll('[data-size]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.size) === size);
    });
  }

  function activate(on) {
    state.active = on;
    canvas.classList.toggle('visible', on);
    canvas.classList.toggle('drawable', on);
    toolbar.classList.toggle('open', on);
    toggleBtn.classList.toggle('active', on);
    toggleBtn.innerHTML = on
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-pen-nib"></i>';
    toggleBtn.setAttribute('aria-label', on ? '結束課堂畫筆' : '開啟課堂畫筆');
    document.body.classList.toggle('annot-active', on);
    if (!on) {
      state.drawing = false;
      state.current = null;
      render();
    }
  }

  /* ------------------------------------------------------------------
     事件綁定
     ------------------------------------------------------------------ */
  function bind() {
    toggleBtn.addEventListener('click', () => activate(!state.active));

    toolbar.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.dataset.tool) return setTool(btn.dataset.tool);
      if (btn.dataset.color) return setColor(btn.dataset.color);
      if (btn.dataset.size) return setSize(Number(btn.dataset.size));
      switch (btn.dataset.action) {
        case 'undo': return undo();
        case 'clear': return clearAll();
        case 'save': return saveImage();
        case 'close': return activate(false);
      }
    });

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('resize', resize);

    document.addEventListener('keydown', e => {
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (!state.active) return;
        e.preventDefault();
        return undo();
      }
      if (!state.active) return;
      switch (e.key.toLowerCase()) {
        case 'p': setTool('pen'); break;
        case 'h': setTool('highlighter'); break;
        case 'e': setTool('eraser'); break;
        case 'c': clearAll(); break;
        case 'escape': activate(false); break;
      }
    });
  }

  function init() {
    if (document.getElementById('annot-canvas')) return;
    build();
    resize();
    bind();
    // 對外暴露最小 API，方便其他頁面或工具呼叫
    window.ClassroomAnnotator = {
      open: () => activate(true),
      close: () => activate(false),
      clear: clearAll,
      undo: undo
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
