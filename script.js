document.addEventListener('DOMContentLoaded', () => {
  // Initialize features
  initClock();
  initTabs();
  initNotepad();
  initCustomLinks();
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

  // Auto-save on input with small debounce
  let saveTimeout;
  notepad.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, notepad.value);
    }, 500); // Save after 500ms of typing inactivity
  });
}

/* ==========================================================================
   4. Custom Links System (Volume-specific bookmarks)
   ========================================================================== */
const LINKS_STORAGE_KEY = 'teaching_portal_custom_links';
let customLinks = {};

function initCustomLinks() {
  // Load custom links from localStorage
  const savedLinks = localStorage.getItem(LINKS_STORAGE_KEY);
  if (savedLinks) {
    try {
      customLinks = JSON.parse(savedLinks);
    } catch (e) {
      console.error('Failed to parse custom links', e);
      customLinks = {};
    }
  }

  // Render links for each volume
  for (let i = 1; i <= 6; i++) {
    renderVolumeLinks(i);
  }
}

// Render links for a specific volume
function renderVolumeLinks(volumeIndex) {
  const panel = document.getElementById(`panel-v${volumeIndex}`);
  if (!panel) return;

  const grid = panel.querySelector('.materials-grid');
  if (!grid) return;

  // Clear existing dynamically added custom cards
  const existingCustoms = grid.querySelectorAll('.portal-card.custom-link');
  existingCustoms.forEach(c => c.remove());

  // Get custom links for this volume
  const volLinks = customLinks[volumeIndex] || [];

  // Find the 'add-custom-card' element so we can insert new cards before it
  const addCard = grid.querySelector('.add-custom-card');

  volLinks.forEach((link, idx) => {
    // Create link card element
    const linkCard = document.createElement('div');
    linkCard.className = 'portal-card custom-link';
    linkCard.style.minHeight = '180px';
    linkCard.style.borderStyle = 'solid';
    linkCard.style.borderColor = 'rgba(139, 92, 246, 0.3)';

    // Build internal HTML structure
    linkCard.innerHTML = `
      <div class="portal-card-header">
        <div class="portal-icon-wrapper" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">
          <i class="fa-solid fa-link"></i>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="delete-btn" onclick="deleteCustomLink(${volumeIndex}, ${idx}, event)" 
                  style="background: transparent; border: none; color: #ef4444; opacity: 0.6; cursor: pointer; transition: opacity 0.3s;"
                  title="刪除連結">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color: inherit;">
            <i class="fa-solid fa-arrow-up-right-from-square external-icon"></i>
          </a>
        </div>
      </div>
      <div class="portal-card-body" style="margin-top: 1rem;">
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
          <h3 class="portal-card-title">${escapeHtml(link.title)}</h3>
          <p class="portal-card-desc" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(link.desc || '自訂教學檔案連結')}
          </p>
        </a>
      </div>
    `;

    // Make the whole card clickable except the delete button
    linkCard.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    // Style the delete button hover effect
    const delBtn = linkCard.querySelector('.delete-btn');
    delBtn.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
    delBtn.addEventListener('mouseleave', () => delBtn.style.opacity = '0.6');

    // Insert before the "Add custom link" card
    grid.insertBefore(linkCard, addCard);
  });
}

// Modal Toggle Functions (Scoped globally for HTML onclick handlers)
window.openAddLinkModal = function(volumeIndex) {
  const modal = document.getElementById('add-link-modal');
  const volumeNumSpan = document.getElementById('target-volume-num');
  const volumeIndexInput = document.getElementById('modal-volume-index');
  const form = document.getElementById('add-link-form');

  // Reset form
  form.reset();

  // Set target volume metadata
  volumeNumSpan.textContent = volumeIndex;
  volumeIndexInput.value = volumeIndex;

  // Show modal
  modal.style.display = 'flex';
  document.getElementById('link-title').focus();
};

window.closeAddLinkModal = function() {
  const modal = document.getElementById('add-link-modal');
  modal.style.display = 'none';
};

// Form submission handler
window.handleFormSubmit = function(event) {
  event.preventDefault();

  const volumeIndex = document.getElementById('modal-volume-index').value;
  const title = document.getElementById('link-title').value.trim();
  const url = document.getElementById('link-url').value.trim();
  const desc = document.getElementById('link-desc').value.trim();

  if (!title || !url) return;

  // Save new link
  if (!customLinks[volumeIndex]) {
    customLinks[volumeIndex] = [];
  }

  customLinks[volumeIndex].push({ title, url, desc });

  // Update local storage
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(customLinks));

  // Rerender volume section
  renderVolumeLinks(volumeIndex);

  // Close modal
  closeAddLinkModal();
};

// Delete handler
window.deleteCustomLink = function(volumeIndex, linkIdx, event) {
  event.stopPropagation(); // Avoid triggering card click
  
  if (!confirm('確定要刪除此自訂連結嗎？')) return;

  if (customLinks[volumeIndex]) {
    customLinks[volumeIndex].splice(linkIdx, 1);
    
    // Clean up key if empty
    if (customLinks[volumeIndex].length === 0) {
      delete customLinks[volumeIndex];
    }

    // Update storage
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(customLinks));

    // Rerender
    renderVolumeLinks(volumeIndex);
  }
};

// Close modal if user clicks outside of modal content
window.addEventListener('click', (e) => {
  const modal = document.getElementById('add-link-modal');
  if (e.target === modal) {
    closeAddLinkModal();
  }
});

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
