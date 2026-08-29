/* ==========================================================================
   Classroom Tools Sidebar - 課堂工具側邊欄（主網頁與各小節教材頁共用）
   --------------------------------------------------------------------------
   使用方式：
     <link rel="stylesheet" href="tools-sidebar.css">
     <script src="tools-sidebar.js"></script>

   教材頁（materials/V-C-S/）改用相對路徑，並可用 data-home 加入「返回主網頁」卡片：
     <link rel="stylesheet" href="../../tools-sidebar.css">
     <script src="../../tools-sidebar.js" data-home="../../index.html"></script>
   ========================================================================== */
(function () {
  'use strict';

  const homeHref = (document.currentScript && document.currentScript.dataset.home) || '';

  const TOOLS = [
    {
      cls: 'tools',
      icon: 'fa-toolbox',
      href: 'https://changyiwu.github.io/class-tools-2',
      title: '班級工具',
      desc: '課堂計時器、隨機抽籤、搶答器等互動教學輔助工具箱。'
    },
    {
      cls: 'score',
      icon: 'fa-clipboard-list',
      href: 'https://changyiwu.github.io/class-score',
      title: '課堂表現登記系統',
      desc: '即時記錄學生課堂表現與參與度。'
    },
    {
      cls: 'wordcloud',
      icon: 'fa-cloud',
      href: 'https://changyiwu.github.io/teaching-web/wordcloud.html',
      title: '課堂即時文字雲',
      desc: '老師，我想對您說。'
    },
    {
      cls: 'exam',
      icon: 'fa-file-powerpoint',
      href: 'https://changyiwu.github.io/exam-review/',
      title: '考卷檢討',
      desc: '段考試卷檢討簡報，需解鎖後檢視。'
    }
  ];

  function cardHtml(t) {
    // 外部工具一律新分頁開啟，避免蓋掉課堂中的教材頁面
    const external = !t.internal;
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const cornerIcon = external
      ? '<i class="fa-solid fa-arrow-up-right-from-square tsb-external" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-chevron-right tsb-external" aria-hidden="true"></i>';
    return `
      <a href="${t.href}"${attrs} class="tsb-card ${t.cls}">
        <div class="tsb-card-header">
          <div class="tsb-icon"><i class="fa-solid ${t.icon}"></i></div>
          ${cornerIcon}
        </div>
        <div class="tsb-card-body">
          <h3 class="tsb-card-title">${t.title}</h3>
          <p class="tsb-card-desc">${t.desc}</p>
        </div>
      </a>`;
  }

  function init() {
    if (document.getElementById('tsb-sidebar')) return;

    const items = TOOLS.slice();
    if (homeHref) {
      items.unshift({
        cls: 'home',
        icon: 'fa-house',
        href: homeHref,
        title: '返回主網頁',
        desc: '回到國中數學教學整合網首頁，切換其他小節教材。',
        internal: true
      });
    }

    const sidebar = document.createElement('aside');
    sidebar.className = 'tsb-sidebar';
    sidebar.id = 'tsb-sidebar';
    sidebar.innerHTML = `
      <div class="tsb-header">
        <h2><i class="fa-solid fa-toolbox" aria-hidden="true"></i>課堂工具</h2>
        <button type="button" class="tsb-close" id="tsb-close" aria-label="收起側邊欄">&times;</button>
      </div>
      <div class="tsb-list">${items.map(cardHtml).join('')}</div>
    `;
    document.body.appendChild(sidebar);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'tsb-toggle';
    toggle.id = 'tsb-toggle';
    toggle.title = '開啟課堂工具';
    toggle.setAttribute('aria-label', '開啟課堂工具');
    toggle.innerHTML = '<i class="fa-solid fa-toolbox"></i><i class="fa-solid fa-chevron-left tsb-arrow"></i>';
    document.body.appendChild(toggle);

    function setOpen(open) {
      sidebar.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-label', open ? '收起課堂工具' : '開啟課堂工具');
      const arrow = toggle.querySelector('.tsb-arrow');
      if (arrow) {
        arrow.className = open
          ? 'fa-solid fa-chevron-right tsb-arrow'
          : 'fa-solid fa-chevron-left tsb-arrow';
      }
    }

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      setOpen(!sidebar.classList.contains('open'));
    });

    sidebar.querySelector('#tsb-close').addEventListener('click', e => {
      e.stopPropagation();
      setOpen(false);
    });

    // 點側邊欄以外的地方關閉
    document.addEventListener('click', e => {
      if (!sidebar.classList.contains('open')) return;
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });

    sidebar.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false);
    });

    window.ClassroomTools = { open: () => setOpen(true), close: () => setOpen(false) };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
