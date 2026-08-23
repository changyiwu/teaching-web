document.addEventListener('DOMContentLoaded', () => {
  // Initialize features
  initClock();
  initTabs();
  initNotepad();
  initCurriculum();
  initSearch();
});

/* ==========================================================================
   1. Live Digital Clock & Date Display
   ========================================================================== */
function initClock() {
  const clockTime = document.getElementById('clock-time');
  const clockDate = document.getElementById('clock-date');
  const clockDay = document.getElementById('clock-day');

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function updateTime() {
    const now = new Date();

    // Formatting Time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockTime.textContent = `${hours}:${minutes}:${seconds}`;

    // Formatting Date (YYYY年MM月DD日)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    clockDate.textContent = `${year}年${month}月${date}日`;

    // Setting Weekday
    clockDay.textContent = weekdays[now.getDay()];
  }

  // Update clock immediately, then every second
  updateTime();
  setInterval(updateTime, 1000);
}

/* ==========================================================================
   2. Volumes 1 to 6 Tab Switch System
   ========================================================================== */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Deactivate all tabs and panels
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      // Activate clicked tab
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Activate corresponding panel
      const targetPanelId = button.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. Classroom Notepad with Auto-save (LocalStorage)
   ========================================================================== */
function initNotepad() {
  const notepad = document.getElementById('teacher-notes');
  const STORAGE_KEY = 'teaching_portal_notes';

  // Load saved notes if any
  const savedNotes = localStorage.getItem(STORAGE_KEY);
  if (savedNotes) {
    notepad.value = savedNotes;
  }

  // Auto-save on input with small devounce
  let saveTimeout;
  notepad.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, notepad.value);
    }, 500); // Save after 500ms of typing inactivity
  });
}

/* ==========================================================================
   4. Curriculum Database Dynamically Rendered
   課程資料與完成狀態統一放在 curriculum.js（window.CURRICULUM）
   ========================================================================== */
const VOLUME_LABELS = ['第一冊', '第二冊', '第三冊', '第四冊', '第五冊', '第六冊'];

// 已完成的小節不掛徽章——整份課表大多會走到已完成，標記反而變成雜訊；
// 只有還沒建置的「待施工」需要一眼看出來。
function statusBadgeHtml(status) {
  return status === 'completed'
    ? ''
    : `<span class="status-badge pending"><i class="fa-solid fa-person-digging"></i> 待施工</span>`;
}

function sectionLinkHtml(sec, prefix) {
  return `
    <a href="${prefix}materials/${sec.folder}/index.html" class="section-link ${sec.status}">
      <div class="section-info">
        <span class="section-code">${escapeHtml(sec.code)}</span>
        <span class="section-title-text">${escapeHtml(sec.title)}</span>
      </div>
      ${statusBadgeHtml(sec.status)}
    </a>
  `;
}

function initCurriculum() {
  const curriculum = window.CURRICULUM;
  if (!curriculum) {
    console.error('找不到 curriculum.js，課程資料無法載入。');
    return;
  }

  for (let volId = 1; volId <= 6; volId++) {
    const container = document.getElementById(`chapters-v${volId}`);
    if (!container) continue;

    container.innerHTML = '';
    const chapters = curriculum.data[volId] || [];

    chapters.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'chapter-card';

      const header = document.createElement('div');
      header.className = 'chapter-header';
      header.innerHTML = `<i class="fa-solid fa-folder-open"></i> <span>${escapeHtml(ch.chapter)}</span>`;
      card.appendChild(header);

      const list = document.createElement('div');
      list.className = 'sections-list';

      ch.sections.forEach((sec, secIdx) => {
        const match = ch.chapter.match(/第\s*(\d+)\s*章/);
        const chNum = match ? match[1] : '1';
        const folder = `${volId}-${chNum}-${secIdx + 1}`;
        list.innerHTML += sectionLinkHtml({
          folder: folder,
          code: sec.code,
          title: sec.title,
          status: sec.status || 'pending'
        }, './');
      });

      card.appendChild(list);
      container.appendChild(card);
    });

    renderCustomLinks(volId);
  }
}

// Basic HTML escaping utility
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   5. Curriculum Search & Status Filter
   跨 6 冊搜尋小節；有關鍵字或篩選時改顯示搜尋結果面板
   ========================================================================== */
function initSearch() {
  const input = document.getElementById('curriculum-search');
  const clearBtn = document.getElementById('search-clear');
  const chips = document.querySelectorAll('.filter-chip');
  const resultsPanel = document.getElementById('search-results');
  const tabsWrapper = document.getElementById('volume-tabs');
  if (!input || !resultsPanel || !tabsWrapper) return;

  let statusFilter = 'all';

  function apply() {
    const query = input.value.trim().toLowerCase();
    const filtering = query !== '' || statusFilter !== 'all';

    clearBtn.classList.toggle('visible', input.value !== '');
    tabsWrapper.classList.toggle('hidden', filtering);
    resultsPanel.classList.toggle('visible', filtering);
    if (!filtering) return;

    const matches = window.CURRICULUM.sections.filter(sec => {
      if (statusFilter !== 'all' && sec.status !== statusFilter) return false;
      if (!query) return true;
      const volLabel = VOLUME_LABELS[Number(sec.volId) - 1] || '';
      const haystack = `${sec.code} ${sec.title} ${sec.chapter} ${sec.folder} ${volLabel}`.toLowerCase();
      return haystack.includes(query);
    });

    if (!matches.length) {
      resultsPanel.innerHTML = `
        <div class="search-empty">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>找不到符合「${escapeHtml(input.value)}」的小節，換個關鍵字試試。</p>
        </div>`;
      return;
    }

    resultsPanel.innerHTML = `
      <div class="search-summary">找到 <strong>${matches.length}</strong> 個小節</div>
      <div class="search-grid">
        ${matches.map(sec => `
          <a href="./materials/${sec.folder}/index.html" class="search-result ${sec.status}">
            <div class="search-result-meta">
              <span class="vol-badge">${VOLUME_LABELS[Number(sec.volId) - 1]}</span>
              <span class="chapter-text">${escapeHtml(sec.chapter)}</span>
            </div>
            <div class="section-info">
              <span class="section-code">${escapeHtml(sec.code)}</span>
              <span class="section-title-text">${escapeHtml(sec.title)}</span>
            </div>
            ${statusBadgeHtml(sec.status)}
          </a>`).join('')}
      </div>`;
  }

  input.addEventListener('input', apply);
  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    apply();
  });
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      statusFilter = chip.dataset.status;
      apply();
    });
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      apply();
    }
  });
}

/* ==========================================================================
   6. Custom Teaching Links per Volume (LocalStorage)
   老師可自行新增各冊常用連結（雲端教材、教案、影片等）
   ========================================================================== */
const LINKS_STORAGE_KEY = 'teaching_portal_custom_links';

function loadCustomLinks() {
  try {
    return JSON.parse(localStorage.getItem(LINKS_STORAGE_KEY)) || {};
  } catch (err) {
    console.warn('自訂連結資料損毀，已重置。', err);
    return {};
  }
}

function saveCustomLinks(all) {
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(all));
}

// 僅允許 http/https，避免存入 javascript: 之類的連結
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function renderCustomLinks(volId) {
  const panel = document.getElementById(`panel-v${volId}`);
  if (!panel) return;

  let wrapper = panel.querySelector('.custom-links');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'custom-links';
    panel.appendChild(wrapper);
  }

  const links = loadCustomLinks()[volId] || [];
  wrapper.innerHTML = `
    <h3 class="custom-links-title">
      <i class="fa-solid fa-bookmark" aria-hidden="true"></i>第 ${volId} 冊自訂連結
    </h3>
    <div class="custom-links-grid">
      ${links.map(link => `
        <div class="custom-link-card">
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="custom-link-main">
            <div class="custom-link-header">
              <i class="fa-solid fa-link"></i>
              <i class="fa-solid fa-arrow-up-right-from-square external-icon" aria-hidden="true"></i>
            </div>
            <h4>${escapeHtml(link.title)}</h4>
            <p>${escapeHtml(link.desc || link.url)}</p>
          </a>
          <button type="button" class="custom-link-delete" data-vol="${volId}" data-id="${link.id}" title="刪除此連結" aria-label="刪除 ${escapeHtml(link.title)}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>`).join('')}
      <button type="button" class="add-link-card" data-vol="${volId}">
        <i class="fa-solid fa-plus"></i>
        <span>新增連結</span>
      </button>
    </div>`;

  wrapper.querySelector('.add-link-card').addEventListener('click', () => openAddLinkModal(volId));
  wrapper.querySelectorAll('.custom-link-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteCustomLink(Number(btn.dataset.vol), btn.dataset.id));
  });
}

function deleteCustomLink(volId, id) {
  const all = loadCustomLinks();
  const links = all[volId] || [];
  const target = links.find(l => String(l.id) === String(id));
  if (!target) return;
  if (!confirm(`確定要刪除「${target.title}」嗎？`)) return;
  all[volId] = links.filter(l => String(l.id) !== String(id));
  saveCustomLinks(all);
  renderCustomLinks(volId);
}

function openAddLinkModal(volId) {
  const modal = document.getElementById('add-link-modal');
  if (!modal) return;
  document.getElementById('modal-volume-index').value = volId;
  document.getElementById('target-volume-num').textContent = volId;
  document.getElementById('add-link-form').reset();
  modal.classList.add('open');
  setTimeout(() => document.getElementById('link-title').focus(), 100);
}

function closeAddLinkModal() {
  const modal = document.getElementById('add-link-modal');
  if (modal) modal.classList.remove('open');
}

function handleFormSubmit(event) {
  event.preventDefault();
  const volId = Number(document.getElementById('modal-volume-index').value);
  const title = document.getElementById('link-title').value.trim();
  const url = document.getElementById('link-url').value.trim();
  const desc = document.getElementById('link-desc').value.trim();

  if (!title || !url) return;
  if (!isSafeUrl(url)) {
    alert('連結網址必須以 http:// 或 https:// 開頭。');
    return;
  }

  const all = loadCustomLinks();
  if (!all[volId]) all[volId] = [];
  all[volId].push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title,
    url: url,
    desc: desc
  });
  saveCustomLinks(all);
  renderCustomLinks(volId);
  closeAddLinkModal();
}

// 點背景或按 Esc 關閉新增連結視窗
document.addEventListener('click', e => {
  const modal = document.getElementById('add-link-modal');
  if (modal && modal.classList.contains('open') && e.target === modal) closeAddLinkModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAddLinkModal();
});

/* ==========================================================================
   本站網址 QR Code：點頁尾的小 QR 放大成投影用大圖
   ========================================================================== */
function closeSiteQrModal() {
  const modal = document.getElementById('site-qr-modal');
  if (modal) modal.classList.remove('open');
}

(function initSiteQrModal() {
  const btn = document.getElementById('site-qr-btn');
  const modal = document.getElementById('site-qr-modal');
  if (!btn || !modal) return;

  btn.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('site-qr-close').addEventListener('click', closeSiteQrModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeSiteQrModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSiteQrModal();
  });
})();
