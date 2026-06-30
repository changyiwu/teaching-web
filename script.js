document.addEventListener('DOMContentLoaded', () => {
  // Initialize features
  initClock();
  initTabs();
  initNotepad();
  initCurriculum();
  initSidebar();
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
   ========================================================================== */
const curriculumData = {
  "1": [
    {
      "chapter": "第1章 整數的運算",
      "sections": [
        {
          "code": "1-1",
          "title": "負數與數線"
        },
        {
          "code": "1-2",
          "title": "整數的加減"
        },
        {
          "code": "1-3",
          "title": "整數的乘除與四則運算"
        },
        {
          "code": "1-4",
          "title": "指數記法與科學記號"
        }
      ]
    },
    {
      "chapter": "第2章 分數的運算",
      "sections": [
        {
          "code": "2-1",
          "title": "因數與倍數"
        },
        {
          "code": "2-2",
          "title": "最大公因數與最小公倍數"
        },
        {
          "code": "2-3",
          "title": "分數的四則運算"
        },
        {
          "code": "2-4",
          "title": "指數律"
        }
      ]
    },
    {
      "chapter": "第3章 一元一次方程式",
      "sections": [
        {
          "code": "3-1",
          "title": "代數式的化簡"
        },
        {
          "code": "3-2",
          "title": "一元一次方程式"
        },
        {
          "code": "3-3",
          "title": "應用問題"
        }
      ]
    }
  ],
  "2": [
    {
      "chapter": "第1章 二元一次聯立方程式",
      "sections": [
        {
          "code": "1-1",
          "title": "二元一次方程式"
        },
        {
          "code": "1-2",
          "title": "解二元一次聯立方程式"
        },
        {
          "code": "1-3",
          "title": "應用問題"
        }
      ]
    },
    {
      "chapter": "第2章 直角坐標與二元一次方程式的圖形",
      "sections": [
        {
          "code": "2-1",
          "title": "直角坐標平面"
        },
        {
          "code": "2-2",
          "title": "二元一次方程式的圖形"
        }
      ]
    },
    {
      "chapter": "第3章 比與比例式",
      "sections": [
        {
          "code": "3-1",
          "title": "比例式"
        },
        {
          "code": "3-2",
          "title": "正比與反比"
        }
      ]
    },
    {
      "chapter": "第4章 一元一次不等式",
      "sections": [
        {
          "code": "4-1",
          "title": "認識一元一次不等式"
        },
        {
          "code": "4-2",
          "title": "解一元一次不等式"
        }
      ]
    },
    {
      "chapter": "第5章 統計",
      "sections": [
        {
          "code": "5-1",
          "title": "統計圖表與資料分析"
        }
      ]
    },
    {
      "chapter": "第6章 生活中的幾何",
      "sections": [
        {
          "code": "6-1",
          "title": "垂直、線對稱與三視圖"
        }
      ]
    }
  ],
  "3": [
    {
      "chapter": "第1章 乘法公式與多項式",
      "sections": [
        {
          "code": "1-1",
          "title": "乘法公式"
        },
        {
          "code": "1-2",
          "title": "多項式與其加減運算"
        },
        {
          "code": "1-3",
          "title": "多項式的乘除運算"
        }
      ]
    },
    {
      "chapter": "第2章 平方根與畢氏定理",
      "sections": [
        {
          "code": "2-1",
          "title": "平方根與近似值"
        },
        {
          "code": "2-2",
          "title": "根式的運算"
        },
        {
          "code": "2-3",
          "title": "畢氏定理"
        }
      ]
    },
    {
      "chapter": "第3章 因式分解",
      "sections": [
        {
          "code": "3-1",
          "title": "利用提公因式與乘法公式做因式分解"
        },
        {
          "code": "3-2",
          "title": "利用十字交乘法做因式分解"
        }
      ]
    },
    {
      "chapter": "第4章 一元二次方程式",
      "sections": [
        {
          "code": "4-1",
          "title": "因式分解解一元二次方程式"
        },
        {
          "code": "4-2",
          "title": "配方法與公式解"
        },
        {
          "code": "4-3",
          "title": "應用問題"
        }
      ]
    },
    {
      "chapter": "第5章 統計資料處理",
      "sections": [
        {
          "code": "5-1",
          "title": "資料整理與統計圖表"
        }
      ]
    }
  ],
  "4": [
    {
      "chapter": "第1章 數列與級數",
      "sections": [
        {
          "code": "1-1",
          "title": "等差數列"
        },
        {
          "code": "1-2",
          "title": "等差級數"
        },
        {
          "code": "1-3",
          "title": "等比數列"
        }
      ]
    },
    {
      "chapter": "第2章 函數",
      "sections": [
        {
          "code": "2-1",
          "title": "函數與函數圖形"
        }
      ]
    },
    {
      "chapter": "第3章 三角形的基本性質",
      "sections": [
        {
          "code": "3-1",
          "title": "三角形與多邊形的內角與外角"
        },
        {
          "code": "3-2",
          "title": "尺規作圖"
        },
        {
          "code": "3-3",
          "title": "三角形的全等性質"
        },
        {
          "code": "3-4",
          "title": "中垂線與角平分線的性質"
        },
        {
          "code": "3-5",
          "title": "三角形的邊角關係"
        }
      ]
    },
    {
      "chapter": "第4章 平行與四邊形",
      "sections": [
        {
          "code": "4-1",
          "title": "平行"
        },
        {
          "code": "4-2",
          "title": "平行四邊形"
        },
        {
          "code": "4-3",
          "title": "特殊四邊形的性質"
        }
      ]
    }
  ],
  "5": [
    {
      "chapter": "第1章 相似形",
      "sections": [
        {
          "code": "1-1",
          "title": "連比例"
        },
        {
          "code": "1-2",
          "title": "比例線段"
        },
        {
          "code": "1-3",
          "title": "縮放與相似"
        },
        {
          "code": "1-4",
          "title": "相似三角形的應用"
        }
      ]
    },
    {
      "chapter": "第2章 圓",
      "sections": [
        {
          "code": "2-1",
          "title": "點、直線與圓之間的位置關係"
        },
        {
          "code": "2-2",
          "title": "圓心角、圓周角與弧的關係"
        }
      ]
    },
    {
      "chapter": "第3章 幾何與證明",
      "sections": [
        {
          "code": "3-1",
          "title": "證明與推理"
        },
        {
          "code": "3-2",
          "title": "三角形的外心、內心與重心"
        }
      ]
    }
  ],
  "6": [
    {
      "chapter": "第1章 二次函數",
      "sections": [
        {
          "code": "1-1",
          "title": "二次函數的圖形與最大值、最小值"
        }
      ]
    },
    {
      "chapter": "第2章 統計與機率",
      "sections": [
        {
          "code": "2-1",
          "title": "資料的分析"
        },
        {
          "code": "2-2",
          "title": "機率"
        }
      ]
    },
    {
      "chapter": "第3章 生活中的立體圖形",
      "sections": [
        {
          "code": "3-1",
          "title": "空間中的線、平面與形體"
        }
      ]
    }
  ]
};

function initCurriculum() {
  // Render each volume's curriculum
  for (let volId = 1; volId <= 6; volId++) {
    const container = document.getElementById(`chapters-v${volId}`);
    if (!container) continue;
    
    container.innerHTML = '';
    const chapters = curriculumData[volId] || [];
    
    chapters.forEach((ch, chIdx) => {
      const chNum = chIdx + 1; // 1-indexed for C in V-C-S
      const card = document.createElement('div');
      card.className = 'chapter-card';
      
      // Header for the Chapter
      const header = document.createElement('div');
      header.className = 'chapter-header';
      header.innerHTML = `<i class="fa-solid fa-folder-open"></i> <span>${escapeHtml(ch.chapter)}</span>`;
      card.appendChild(header);
      
      // Sections List
      const list = document.createElement('div');
      list.className = 'sections-list';
      
      ch.sections.forEach((sec, secIdx) => {
        const sNum = secIdx + 1; // 1-indexed for S in V-C-S
        const link = document.createElement('a');
        const match = ch.chapter.match(/第\s*(\d+)\s*章/);
        const chNum = match ? match[1] : (chIdx + 1);
        const folderName = `${volId}-${chNum}-${sNum}`;
        link.href = `./materials/${folderName}/index.html`;
        link.className = 'section-link';
        
        // Special case: Volume 1, Chapter 1, Section 1 (1-1-1), Section 2 (1-1-2), and Section 3 (1-1-3) are complete, others are pending
        const isComplete = (volId === 1 && ch.chapter.includes('第1章') && (sNum === 1 || sNum === 2 || sNum === 3));
        const statusBadge = isComplete 
          ? `<span class="status-badge completed"><i class="fa-solid fa-circle-check"></i> 已完成</span>`
          : `<span class="status-badge pending"><i class="fa-solid fa-person-digging"></i> 待施工</span>`;
          
        link.innerHTML = `
          <div class="section-info">
            <span class="section-code">${escapeHtml(sec.code)}</span>
            <span class="section-title-text">${escapeHtml(sec.title)}</span>
          </div>
          ${statusBadge}
        `;
        list.appendChild(link);
      });
      
      card.appendChild(list);
      container.appendChild(card);
    });
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
   5. Sliding Sidebar drawer for Classroom Tools
   ========================================================================== */
function initSidebar() {
  const sidebar = document.getElementById('sidebar-tools');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const closeBtn = document.getElementById('sidebar-close-btn');

  if (!sidebar || !toggleBtn) return;

  function toggleSidebar(state) {
    if (state === undefined) {
      sidebar.classList.toggle('open');
      toggleBtn.classList.toggle('open');
    } else if (state) {
      sidebar.classList.add('open');
      toggleBtn.classList.add('open');
    } else {
      sidebar.classList.remove('open');
      toggleBtn.classList.remove('open');
    }
    
    // Toggle arrow icon class
    const arrowIcon = toggleBtn.querySelector('.arrow-icon');
    if (arrowIcon) {
      if (sidebar.classList.contains('open')) {
        arrowIcon.className = 'fa-solid fa-chevron-right arrow-icon';
      } else {
        arrowIcon.className = 'fa-solid fa-chevron-left arrow-icon';
      }
    }
  }

  // Toggle button click
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSidebar();
  });

  // Close button click if present
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar(false);
    });
  }

  // Click outside sidebar to close it
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        toggleSidebar(false);
      }
    }
  });

  // Prevent clicks inside sidebar from bubble up and closing it
  sidebar.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}
