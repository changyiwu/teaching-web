/* ==========================================================================
   Curriculum Database - 國中數學 6 冊課程資料庫（主網頁與教材頁共用）
   --------------------------------------------------------------------------
   每個小節的完成狀態直接寫在資料裡：
     "status": "completed"  已完成，首頁顯示「已完成」並可點入教材
     省略 status            預設為 "pending"（待施工）
   完成一個小節時，只需在此檔把該小節加上 status，不需要再改判斷邏輯。

   資料夾代號 V-C-S = 冊別 - 章次 - 小節序（章次取自「第 N 章」）。
   ========================================================================== */
(function () {
  'use strict';

  const CURRICULUM_DATA = {
    "1": [
      {
        "chapter": "第1章 整數的運算",
        "sections": [
          { "code": "1-1", "title": "負數與數線", "status": "completed" },
          { "code": "1-2", "title": "整數的加減", "status": "completed" },
          { "code": "1-3", "title": "整數的乘除與四則運算", "status": "completed" },
          { "code": "1-4", "title": "指數記法與科學記號", "status": "completed" }
        ]
      },
      {
        "chapter": "第2章 分數的運算",
        "sections": [
          { "code": "2-1", "title": "因數與倍數", "status": "completed" },
          { "code": "2-2", "title": "最大公因數與最小公倍數" },
          { "code": "2-3", "title": "分數的四則運算" },
          { "code": "2-4", "title": "指數律" }
        ]
      },
      {
        "chapter": "第3章 一元一次方程式",
        "sections": [
          { "code": "3-1", "title": "代數式的化簡" },
          { "code": "3-2", "title": "一元一次方程式" },
          { "code": "3-3", "title": "應用問題" }
        ]
      }
    ],
    "2": [
      {
        "chapter": "第1章 二元一次聯立方程式",
        "sections": [
          { "code": "1-1", "title": "二元一次方程式" },
          { "code": "1-2", "title": "解二元一次聯立方程式" },
          { "code": "1-3", "title": "應用問題" }
        ]
      },
      {
        "chapter": "第2章 直角坐標與二元一次方程式的圖形",
        "sections": [
          { "code": "2-1", "title": "直角坐標平面" },
          { "code": "2-2", "title": "二元一次方程式的圖形" }
        ]
      },
      {
        "chapter": "第3章 比與比例式",
        "sections": [
          { "code": "3-1", "title": "比例式" },
          { "code": "3-2", "title": "正比與反比" }
        ]
      },
      {
        "chapter": "第4章 一元一次不等式",
        "sections": [
          { "code": "4-1", "title": "認識一元一次不等式" },
          { "code": "4-2", "title": "解一元一次不等式" }
        ]
      },
      {
        "chapter": "第5章 統計",
        "sections": [
          { "code": "5-1", "title": "統計圖表與資料分析" }
        ]
      },
      {
        "chapter": "第6章 生活中的幾何",
        "sections": [
          { "code": "6-1", "title": "垂直、線對稱與三視圖" }
        ]
      }
    ],
    "3": [
      {
        "chapter": "第1章 乘法公式與多項式",
        "sections": [
          { "code": "1-1", "title": "乘法公式" },
          { "code": "1-2", "title": "多項式與其加減運算" },
          { "code": "1-3", "title": "多項式的乘除運算" }
        ]
      },
      {
        "chapter": "第2章 平方根與畢氏定理",
        "sections": [
          { "code": "2-1", "title": "平方根與近似值" },
          { "code": "2-2", "title": "根式的運算" },
          { "code": "2-3", "title": "畢氏定理" }
        ]
      },
      {
        "chapter": "第3章 因式分解",
        "sections": [
          { "code": "3-1", "title": "利用提公因式與乘法公式做因式分解" },
          { "code": "3-2", "title": "利用十字交乘法做因式分解" }
        ]
      },
      {
        "chapter": "第4章 一元二次方程式",
        "sections": [
          { "code": "4-1", "title": "因式分解解一元二次方程式" },
          { "code": "4-2", "title": "配方法與公式解" },
          { "code": "4-3", "title": "應用問題" }
        ]
      },
      {
        "chapter": "第5章 統計資料處理",
        "sections": [
          { "code": "5-1", "title": "資料整理與統計圖表" }
        ]
      }
    ],
    "4": [
      {
        "chapter": "第1章 數列與級數",
        "sections": [
          { "code": "1-1", "title": "等差數列" },
          { "code": "1-2", "title": "等差級數" },
          { "code": "1-3", "title": "等比數列" }
        ]
      },
      {
        "chapter": "第2章 函數",
        "sections": [
          { "code": "2-1", "title": "函數與函數圖形" }
        ]
      },
      {
        "chapter": "第3章 三角形的基本性質",
        "sections": [
          { "code": "3-1", "title": "三角形與多邊形的內角與外角" },
          { "code": "3-2", "title": "尺規作圖" },
          { "code": "3-3", "title": "三角形的全等性質" },
          { "code": "3-4", "title": "中垂線與角平分線的性質" },
          { "code": "3-5", "title": "三角形的邊角關係" }
        ]
      },
      {
        "chapter": "第4章 平行與四邊形",
        "sections": [
          { "code": "4-1", "title": "平行" },
          { "code": "4-2", "title": "平行四邊形" },
          { "code": "4-3", "title": "特殊四邊形的性質" }
        ]
      }
    ],
    "5": [
      {
        "chapter": "第1章 相似形",
        "sections": [
          { "code": "1-1", "title": "連比例" },
          { "code": "1-2", "title": "比例線段" },
          { "code": "1-3", "title": "縮放與相似" },
          { "code": "1-4", "title": "相似三角形的應用" }
        ]
      },
      {
        "chapter": "第2章 圓",
        "sections": [
          { "code": "2-1", "title": "點、直線與圓之間的位置關係" },
          { "code": "2-2", "title": "圓心角、圓周角與弧的關係" }
        ]
      },
      {
        "chapter": "第3章 幾何與證明",
        "sections": [
          { "code": "3-1", "title": "證明與推理" },
          { "code": "3-2", "title": "三角形的外心、內心與重心" }
        ]
      }
    ],
    "6": [
      {
        "chapter": "第1章 二次函數",
        "sections": [
          { "code": "1-1", "title": "二次函數的圖形與最大值、最小值" }
        ]
      },
      {
        "chapter": "第2章 統計與機率",
        "sections": [
          { "code": "2-1", "title": "資料的分析" },
          { "code": "2-2", "title": "機率" }
        ]
      },
      {
        "chapter": "第3章 生活中的立體圖形",
        "sections": [
          { "code": "3-1", "title": "空間中的線、平面與形體" }
        ]
      }
    ]
  };

  // 攤平成一維小節清單，供首頁渲染與教材頁上下節導覽使用
  const SECTIONS = [];
  Object.keys(CURRICULUM_DATA).forEach(volId => {
    CURRICULUM_DATA[volId].forEach(ch => {
      const match = ch.chapter.match(/第\s*(\d+)\s*章/);
      const chNum = match ? match[1] : '1';
      ch.sections.forEach((sec, idx) => {
        const sNum = idx + 1;
        SECTIONS.push({
          volId: volId,
          chNum: chNum,
          chapter: ch.chapter,
          sNum: sNum,
          code: sec.code,
          title: sec.title,
          folder: volId + '-' + chNum + '-' + sNum,
          status: sec.status || 'pending'
        });
      });
    });
  });

  function indexOfFolder(folder) {
    for (let i = 0; i < SECTIONS.length; i++) {
      if (SECTIONS[i].folder === folder) return i;
    }
    return -1;
  }

  window.CURRICULUM = {
    data: CURRICULUM_DATA,
    sections: SECTIONS,
    get: folder => SECTIONS[indexOfFolder(folder)] || null,
    prev: folder => {
      const i = indexOfFolder(folder);
      return i > 0 ? SECTIONS[i - 1] : null;
    },
    next: folder => {
      const i = indexOfFolder(folder);
      return (i >= 0 && i < SECTIONS.length - 1) ? SECTIONS[i + 1] : null;
    }
  };
})();
