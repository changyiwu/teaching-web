/* ==========================================================================
   Lesson Navigation - 教材頁上一節 / 下一節導覽
   --------------------------------------------------------------------------
   依網址中的資料夾代號（materials/V-C-S/）自 window.CURRICULUM 取得前後小節，
   於左下角注入導覽列。需先載入 curriculum.js。

     <link rel="stylesheet" href="../../lesson-nav.css">
     <script src="../../curriculum.js"></script>
     <script src="../../lesson-nav.js"></script>
   ========================================================================== */
(function () {
  'use strict';

  function currentFolder() {
    const match = window.location.pathname.match(/materials\/(\d+-\d+-\d+)\//);
    return match ? match[1] : null;
  }

  function linkHtml(sec, dir) {
    const isPrev = dir === 'prev';
    const label = isPrev ? '上一節' : '下一節';
    if (!sec) {
      return `<span class="lesson-nav-link disabled">
          ${isPrev ? '<i class="fa-solid fa-chevron-left"></i>' : ''}
          <span class="lesson-nav-text">
            <span class="lesson-nav-label">${label}</span>
            <span class="lesson-nav-title">已是${isPrev ? '第一' : '最後一'}節</span>
          </span>
          ${isPrev ? '' : '<i class="fa-solid fa-chevron-right"></i>'}
        </span>`;
    }
    const title = sec.title.length > 10 ? sec.title.slice(0, 10) + '…' : sec.title;
    return `<a href="../${sec.folder}/index.html" class="lesson-nav-link" title="${sec.code} ${sec.title}">
        ${isPrev ? '<i class="fa-solid fa-chevron-left"></i>' : ''}
        <span class="lesson-nav-text">
          <span class="lesson-nav-label">${label}</span>
          <span class="lesson-nav-title">${sec.code} ${title}</span>
        </span>
        ${isPrev ? '' : '<i class="fa-solid fa-chevron-right"></i>'}
      </a>`;
  }

  function init() {
    if (document.querySelector('.lesson-nav-bar')) return;
    const curriculum = window.CURRICULUM;
    const folder = currentFolder();
    if (!curriculum || !folder) return;

    const current = curriculum.get(folder);
    if (!current) return;

    const index = curriculum.sections.indexOf(current) + 1;
    const bar = document.createElement('nav');
    bar.className = 'lesson-nav-bar';
    bar.setAttribute('aria-label', '小節導覽');
    bar.innerHTML = `
      ${linkHtml(curriculum.prev(folder), 'prev')}
      <div class="lesson-nav-current" title="${current.chapter}">
        <span class="code">${current.code}</span>
        <span class="of">${index} / ${curriculum.sections.length}</span>
      </div>
      ${linkHtml(curriculum.next(folder), 'next')}
    `;
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
