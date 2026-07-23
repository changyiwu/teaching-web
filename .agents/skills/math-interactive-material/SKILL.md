---
name: Math Interactive Webpage Builder (互動數學教材網頁建置器)
description: 當使用者提供國中/高中數學教材、PDF、Word 檔，或要求針對特定章節/小節製作教學網頁、互動 Canvas 元件、隨堂評量時，觸發此技能。
---

# 互動數學教材網頁建置指引

本技能指引旨在自動化將數學教材（如 PDF、Word）轉化為高質感、具備 HTML5 Canvas 視覺互動探索、以及即時回饋隨堂評量的線上教學網頁。

## 1. 觸發條件與準備工作
* **觸發語境**：當使用者提及「針對這份教材做一個教學網頁」、「分析教材」、「製作小節網頁」並附上 PDF/Word 檔案路徑，或提供章節代號（如 `1-1-1`）時。
* **準備工作**：
  1. 確認教材檔案格式（`.pdf`, `.doc`, `.docx`）與目標輸出資料夾（預設為 `/materials/V-C-S/`）。
  2. 確保專案具備全域的 `index.html` 入口及 `background.png` 資源。

## 2. 檔案解析與文本提取工作流
* **對於 PDF 檔案**：
  * 使用 Python 腳本（依賴 `PyMuPDF` / `fitz` 庫）提取全文字元。
  * 將提取出的文本以 `utf-8` 編碼寫入臨時文字檔，以避免主控台編碼錯誤（如 Windows CP950 錯誤）。
* **對於 Word 舊格式 (.doc)**：
  * **關鍵注意**：為避免虛擬硬碟（如 Google Drive）網路串流延遲導致 Word COM 程式當掉，必須先將 `.doc` 複製到本地臨時目錄。
  * 使用 `win32com.client.Dispatch("Word.Application")` 開啟檔案（設定 `Encoding=950` 繁體中文），另存為 XML 標準格式的 `.docx`，再解析 `word/document.xml` 讀取文字。

## 3. 引起動機與重點概念結構化
分析提取出的教材文字，將其規劃為**課前引起動機**與數個**概念重點區塊**：

* **課前引起動機 (Pre-class Motivation Comic)**：
  - 於教材網頁的最上方（所有重點區塊之前）插入一個「課前暖身漫畫」區塊，用於引導與激發學生的學習興趣。
  - **此漫畫一律改由 `teaching-comic` 專案的 `comic-generator` 技能產生，流程與規格見下方第 3.1 節，本技能不得自行另寫生圖或加字流程。**
  - **內容與情境**：以教材中的素養扉頁或生活情境為藍本（例如冰箱設定負溫度代表什麼意思、玉山最低溫等）。
  - **數學正確性**：若漫畫中繪有數線，必須嚴格確保**僅在右側（正向）有單向箭頭**，左側（負向）則為無箭頭的平直直線，符合國中數學數線三要素的標準定義；此條在生圖提示與最終驗收皆須檢查。

* **重點區塊拆解**：
  不限於 4 個重點，而是由 AI 根據教材內容的豐富度與邏輯結構，自主規劃與拆解適當的重點數量（例如 3、4 或 5 個重點區塊）。每個重點區塊必須包含以下三個要素：
  1. **重點整理敘述 (Explanation Card)**：
     * 用簡明扼要的清單或表格條列出該概念的核心定理、定義及運算性質。
  2. **視覺互動探索 (Interactive Canvas Card)**：
     * 評估該概念是否適合進行 Canvas 視覺化（例如溫度計、數線坐標、相反數對稱、絕對值距離等）。
     * 於 HTML 中建立 `<canvas>` 容器、動態數值標籤（如 `temp-val`）及控制滑桿（`input[type="range"]`）。
  3. **隨堂形成性評量 (Formative Assessment Quiz)**：
     * 針對該重點設計 2-3 題單選題。
     * **題目數字差異化規範（防止死記）**：評量題目的數字與數值必須與原始 PDF/Word 教材例題中的數字**有所區隔**（可對數值進行微調或使用同類型的不同數字），以防止學生藉由直接死記教科書解答來作答，強迫學生理解其運算原理。
     * 題目使用 `<label class="option-label">` 包裹 `radio` 按鈕。
     * 提供「提交答案」按鈕，並實作解鎖與反饋邏輯。作答完畢後顯示正確/錯誤狀態樣式，並平滑展開（`slideDown`）詳細的數學原理解析。

## 3.1 課前暖身漫畫：固定調用 teaching-comic 技能（強制）

製作任何小節教材時，最上方的四格漫畫**必須**依下列方式產生，不得以其他臨時做法取代。

* **技能來源（唯一指定）**：
  * 技能檔：`C:\Users\chang\我的雲端硬碟\agents\teaching-comic\skills\comic-generator\SKILL.md`
  * 後製腳本：
    * `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\scripts\normalize_comic.ps1`
    * `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\scripts\add_captions_json.ps1`
  * 開始製作前先確認上述路徑存在；若不存在，**停下來詢問使用者**，不可退回舊的自製加字流程（本專案已無 `add_captions.ps1`）。

* **執行步驟**：
  1. 讀取 `comic-generator` 的 `SKILL.md`，並完整遵循其「執行流程」第 1～7 步。
  2. 重點數量：課前暖身漫畫固定取**該小節的 1 個核心引起動機重點**，只產出 1 張四格漫畫。
  3. 風格固定選用**「卡皮巴拉水豚風」**，與本技能第 4 節的插圖風格一致。
  4. 三階段檔案不可省略、不可互相覆寫：`_raw` → `_normalized` → `_final`。
  5. 對白一律走 `*_bubbles.json` + `add_captions_json.ps1`，生圖階段必須加上
     `no readable text, no speech bubbles, no captions, no labels, no watermark`。

* **規格對齊（教室投影用）**：
  * 版面：直式 4:5、`1080x1350`、2x2 四格，每格 `540x675`（由 `normalize_comic.ps1` 保證）。
  * 對白可讀性：智慧白板投影距離較遠，`font_size` 建議 `24`～`28`、`min_font_size` 不低於 `18`。
  * 對白框不得遮住主角臉部或數線、溫度計等核心數學元素。

* **四格對齊前處理（重要）**：
  * `add_captions_json.ps1` 是把畫面「等分成四個象限」來定位對話框，所以四格的中線要落在畫布中線上，
    否則對白會跑到隔壁格。
  * **不要為了湊比例去裁切四格內容**；比例不合時以補白邊（上下或左右等量）處理，四格中線自然仍在中線。
  * 若有做前處理，另存為 `_prepped.png`，不可覆寫 `_raw.png`。
  * 對白座標一律從**實際的 `_normalized.png` 量測**，不要憑假設的格線推算。

* **成品搬入教材資料夾**：
  1. 於 `teaching-comic/output/` 完成 `_final.png` 後，壓成 WebP 複製到 `materials/V-C-S/`。
  2. 檔名統一為 `motivation_comic.webp`（寬 1080、品質 88，約 120～150KB）。
  3. 網頁以相對路徑 `<img src="motivation_comic.webp">` 引用，**不得**跨專案連到 `teaching-comic` 的絕對路徑。
  4. 中介檔（`_raw`、`_prepped`、`_normalized`、`_bubbles.json`）留在 `teaching-comic/output/`，不要複製進 `teaching-web`。
  5. 檔名可加上小節代號避免互相覆寫，例如 `comic_1-1-1_point_1_raw.png`。

## 4. UI 視覺設計與美學規範 (Aesthetics & Theme)
* **主題風格**：與主入口網站風格保持一致，採用極致質感的暗黑科技感（Glassmorphism，磨砂玻璃風）。
* **背景與光暈**：
  * 背景圖：使用 `linear-gradient(rgba(10, 8, 28, 0.8), rgba(10, 8, 28, 0.8)), url('../../background.png')`。
  * 背景光暈：加入 3 個使用 `filter: blur(120px)` 的彩色浮動 Blob 圓球，設定無限循環的漂浮動畫（`blob-float`）。
* **重點區塊主題配色 (Themed Concept Colors)**：
  * 每個重點區塊應分配其獨有的主題配色（例如：玫瑰紅、水青綠、魔法紫、香檳金、天空藍等不同的亮色系），以區分各重點的主題。
  * 標題（`.section-title`）應設計為對應的主題漸層文字，並將核心數學專有名詞（`strong`）染上對應主題亮色，打破單調色調。
* **評量選項統一主題色與雙欄響應式排版 (Uniform Theme & Responsive Double Columns for Quiz Options)**：
  * 題目中的 A、B、C、D 四個選項應採用**一致的主題色彩**（而非多色混雜）。預設文字為灰白色 (`#cbd5e1`)，Hover 與 Selected 狀態時統一轉為對應小節的精緻主題色（如第一冊的紫色 `#8b5cf6`），且文字高亮為純白色。
  * **排版寬度與響應式**：選項容器（`.options-container`）在電腦或平板開啟時，應採用雙欄排版（一列 2 個選項，如 `grid-template-columns: repeat(2, 1fr)`）；在手機等小螢幕（如小於 640px）則以媒體查詢回退為單欄（一列 1 個選項），兼顧平板操作與手機閱讀。
* **總結與情境配色 (Summary & Context Styling)**：
  * 網頁末尾的「小節總結與核心回顧」應使用獨特的漸層標題，且左右回顧卡片與情境段落應著上不同的主題色彩（如回顧搭配薄荷綠、生活故事搭配亮藍色），提升完課視覺體驗。
* **插圖生成與關聯性規範 (Illustration Quantity & Relevancy)**：
  * **豐富的插圖張數**：為了充實網頁的視覺豐富度與趣味性，每個教學網頁應至少生成並放置 **4 至 6 張** 專屬插圖（包含課前引起動機漫畫、各重點說明卡片、特定評量題目或結尾總結卡片）。
  * **高度內容關聯性**：插圖絕對不能是通用的裝飾，必須與所處的**教材內容、重點概念或題目情境緊密相關**。
    * *例*：若重點為「指數記法（細胞分裂）」，應生成「水豚科學家拿著放大鏡觀察分裂細胞」的插圖。
    * *例*：若題目為「太空中的天文距離」，應生成「水豚宇航員在太空漫步」的插圖。
    * *例*：若題目為「溫度升降」，應生成「水豚在雪地裡泡溫泉」或「水豚吃冰棒」的插圖。
  * **插圖風格與規格**：
    * 風格統一為「呆萌卡通水豚貼紙風（Capybara Sticker Style）」，生圖時使用與主旨相符的主題描述。
    * 插圖規格：網頁內的插圖寬度限制為 `220px`，並設定卡片邊框、投射陰影與 Hover Zoom 特效，置於說明區塊或題目卡片底部的合適位置。

## 5. Canvas 互動開發與定位修正
* **事件對齊公式（極重要）**：
  * 為防止 Canvas 經 CSS 縮放或在 Retina 高解析度螢幕上出現「滑鼠/手指位置與畫布元件對不起來」的偏移 Bug，**必須**在計算座標時乘上縮放比率：
    ```javascript
    function getMouseX(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length > 0) 
        ? e.touches[0].clientX 
        : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX);
      const relativeX = clientX - rect.left;
      return relativeX * (canvas.width / rect.width);
    }
    ```
* **繪圖優化**：
  * 使用 `ctx.shadowBlur` 與亮色（如 `var(--accent)`、`var(--secondary)`）繪製發光點。
  * 加入反光高光線，提升幾何元素的立體感與精緻感。
  * 同步綁定 `mousedown/mousemove/mouseup` 以及 `touchstart/touchmove/touchend` 以支援觸控平板。
* **相反數鏡像命名與標記一致性 (Opposite Point Naming Consistency)**：
  * 在開發相反數的視覺鏡像對稱時，點 A 在原點另一側的對稱點**必須統一命名為 A'**（A Prime）。
  * 確保 HTML 引導說明、數值顯示面板（即使內部 id 為了代碼安全保留為 `opp-b`）、Canvas 繪圖文字 (`ctx.fillText("A'", ...)`) 以及下方詳解所出現的稱呼完全一致為 `A'`，不得混用「點 B」與「點 A'」造成教學困擾。

## 6. 整合與部署
* **資料夾配置**：將 HTML、CSS、JS 與插圖存放在 `/materials/V-C-S/` 子目錄下。
* **更新主入口**：
  * 在根目錄的 `curriculum.js` 中，把該小節加上 `"status": "completed"`，首頁即會顯示「已完成」並可點入。
  * 不要再去改 `script.js` 的判斷式；完成狀態一律只寫在 `curriculum.js` 的資料裡。
* **教材頁必掛的共用元件**（相對路徑一律 `../../`）：
  ```html
  <link rel="stylesheet" href="../../tools-sidebar.css">
  <link rel="stylesheet" href="../../lesson-nav.css">
  <link rel="stylesheet" href="../../annotate.css">
  <script src="../../curriculum.js"></script>
  <script src="../../tools-sidebar.js" data-home="../../index.html"></script>
  <script src="../../lesson-nav.js"></script>
  <script src="../../annotate.js"></script>
  ```
  依序提供：課堂工具側邊欄、上一節／下一節導覽、課堂畫筆標註。
* **圖片最佳化（一律使用 WebP）**：
  * 課前漫畫：寬 `1080`、WebP 品質 `88`，檔名 `motivation_comic.webp`。
  * 其餘插圖：網頁顯示寬度為 `220px`，存檔統一縮到寬 `640`、WebP 品質 `85`（單張約 30～100KB）。
  * 不要把生圖模型輸出的原始 PNG（常常 0.5～2MB）直接放進教材資料夾。
  * 網頁內 `<img>` 一律加上 `loading="lazy"`（首屏的課前漫畫除外）與 `alt` 文字。
* **驗證機制**：
  * 寫入檔案後，執行完整性檢查，確保相對路徑（如 `../../index.html`）正確，網頁跳轉順暢。
  * 確認課前漫畫確實來自第 3.1 節的 `comic-generator` 流程（`teaching-comic/output/` 應留有對應的 `_raw`／`_prepped`／`_normalized`／`_bubbles.json` 檔案）。
  * 確認教材頁沒有殘留未轉檔的 `.png` 引用，且四格漫畫在 1080 寬下對白清晰可讀。

## 7. 數學符號與 LaTeX (MathJax) 格式規範
* **MathJax 載入**：在 HTML `<head>` 中引入：
  `<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>`。
* **基本格式與字元清理**：
  * 所有變數（如 \(a, b, x\)）、坐標（如 \(A(a)\)）、負數與算式，統一包裹在行內定界符 `\( ... \)` 中，以顯示為精美斜體。
  * **嚴禁**在 LaTeX `\( ... \)` 內部使用全形中文運算子（如 `＋`、`－`），必須全面轉換為半形標準符號 `+`、`-`，以防止渲染間距異常。
* **去除冗餘括號**：
  * 除了為避免運算子相鄰的括號（如 `+ (-5)`）外，算式開頭首項與最終結果絕不加上括號。
  * 正確寫法：`-5 + (-3) = -8`。錯誤寫法：`(-5) + (-3) = (-8)`。
* **線段記法**：國中教材線段長度直接寫為 `AB`、`AC` 等字母組合，不使用上橫線 `\overline{AB}`。
* **JavaScript 動態字串轉義（極重要）**：
  * 在 JS 模板字串（反單引號 `\`...\``）中動態寫入 `innerHTML` 時，單反斜線 `\` 會被 JS 吞掉。
  * **必須使用雙反斜線轉義**：寫成 `\\(`, `\\)`, `\\frac`。否則會造成 HTML 輸出為一般括號與 `rac` 換頁亂碼。
* **Hex 顏色渲染防錯**：
  * **嚴禁**在 LaTeX 內部使用 `\color{#hex}`（`#` 在 LaTeX 模式下會觸發巨集參數報錯）。
  * 必須將 HTML 著色標籤寫在 LaTeX 外部：`<span style="color: #fda4af">\(a\)</span>`，這能 100% 正常顯色。
* **Flexbox 對齊排版防錯**：
  * 對於動態寫入的說明回饋區（如 `.visual-feedback`，帶有 `display: flex`），將 `innerHTML` 的內容整體包裹在單一 block 容器 `<div style="width: 100%; text-align: center; line-height: 1.6; font-size: 0.95rem;">...</div>` 內，防止行內標籤與 `br` 被 flex 拆分橫向排列。

