# teaching-web（智慧課堂教學整合網）（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介

智慧課堂教學整合網：純靜態前端頁面（HTML5、CSS3、Vanilla JavaScript），以 HSL 色彩系統打造深色磨砂玻璃風格（Glassmorphic UI）。用於課堂智慧白板投影，涵蓋 6 冊 58 小節課程。外部資源為 Font Awesome 6 CDN 與 Google Fonts 的 `Outfit`、`Noto Sans TC`；隨堂備忘錄與各冊自訂快捷連結存於瀏覽器 `localStorage`。獨立的即時文字雲頁 `wordcloud.html` 例外使用 Firebase Firestore 同步課堂輸入。

線上網址：<https://changyiwu.github.io/teaching-web/>

## 關鍵時程

<!-- 目前無固定時程 -->

## 目標與路線圖

- [x] 階段一：首頁與 58 個教材頁骨架、GitHub Pages 自動部署
- [x] 階段二：規則統一為跨 Agent `agents.md`
- [x] 階段三：共用元件抽出——`curriculum.js`、`annotate.css/js`、`tools-sidebar.css/js`、`lesson-nav.css/js`、`materials/pending.css`
- [x] 階段四：小節完成狀態改為資料驅動；首頁新增跨冊搜尋與狀態篩選；修好「新增連結」自訂書籤
- [x] 階段五：教材圖片全面轉 WebP（11.4MB → 0.89MB）
- [x] 階段六：建置 `1-1-3`「整數的乘除與四則運算」（黏土定格動畫風，6 重點／6 互動／12 題）
- [ ] 階段七：在課堂智慧板實測課堂畫筆（捲動模式、觸控筆跡、4K 解析度下的落筆位置）
- [ ] 階段八：其餘佔位頁逐節建置（已完成 `1-1-4`「指數記法與科學記號」，復古太空探險風，6 重點／6 互動／12 題）

> 目前課程進度：58 節中 `1-1-1`、`1-1-2`、`1-1-3`、`1-1-4` 完成，其餘 54 節為佔位頁。

## 資料夾結構

```
teaching-web/
├─ index.html              # 首頁（跨冊搜尋、狀態篩選、自訂連結）
├─ script.js               # 首頁邏輯（不放完成狀態判斷式）
├─ style.css
├─ curriculum.js           # 6 冊 58 小節課程資料庫；完成狀態只寫這裡
├─ tools-sidebar.css/js    # 課堂工具側邊欄（共用元件）
├─ annotate.css/js         # 課堂畫筆（整頁座標，跟隨捲動）
├─ lesson-nav.css/js       # 教材頁上一節／下一節導覽
├─ materials/              # 58 個教材頁
│  └─ pending.css          # 56 個「待施工」佔位頁共用樣式
├─ background.png
├─ wordcloud.html          # 即時協作文字雲（Firebase；全域技能模板產生）
├─ README.md
├─ agents.md               # 本檔：專案藍圖
├─ handoff.md              # 交接檔（每次收工必更新）
├─ .agents/skills/math-interactive-material/SKILL.md
└─ .gitignore
```

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地（GDrive） | `agents.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | https://github.com/changyiwu/teaching-web （公開，push `main` 自動部署 Pages） | 指定時 |
| L3 | Obsidian | `teaching-web/專案工作流程.md` | 有需要時 |

## 三個檔案的職責（依「時效性」分家，不是依「詳細程度」）

| 檔案 | 時效 | 寫入方式 | 放什麼 |
|------|------|---------|--------|
| `handoff.md` | **只對下一個 session 有效**，過期即丟 | 每次收工整份重寫 | 做到哪、下一步、**這次**的暫時 workaround |
| `agents.md`（本檔） | **長期有效**，每個 session 都適用 | 只有規則本身變了才改 | 目標、路線圖、常設規則、結構 |
| Obsidian／`git log` | **歷史**：發生過什麼、為什麼 | 只增不刪 | 決策紀錄、踩坑完整版、逐次進度 |

驗收標準：**`handoff.md` 整份刪掉，不應損失任何長期資訊**——會的話代表該升級進本檔卻沒升級。

**本檔不要出現的東西**：❌ `## 最近進度`／逐次工作紀錄、❌ 決策理由與踩坑完整版。2026-08-03 移除了 `## 最近進度`，內容逐條比對後已在 L3 筆記的〈🗓️ 最近更動紀錄〉——**是主動移除，不是遺漏，不要補回來**。踩過的坑只把**結論**收斂成一條祈使句寫進〈工作約定〉，原因留 L3。

## 工作約定

- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文；涉及檔案操作時回報完整產出位置
- Windows 指令優先使用 PowerShell
- 收工前檢查程式碼是否含 API key、網址 Token、學生姓名等敏感資料
- 只 stage 本次任務相關檔案，**不使用無差別的 `git add .`**；僅在使用者明確授權時 commit 與 push
- 本機預覽窗格（Browser pane）會供快取的舊版 CSS/JS，改完在那裡看不到效果是正常的；驗收一律強制重載或以帶版本參數的方式重新載入資源
- 教材頁的本機驗收要起一個 HTTP 伺服器（例：`python -m http.server`）；直接開 `file://` 在預覽窗格只會拿到靜態快照，`canvas.js` 不會執行、互動全部驗不到
- 瀏覽器分頁未在前景時渲染會被節流，大量 canvas 迴圈驗證會逾時；先把分頁切到前景，且單批控制在 100 組參數以內
- 驗收 Canvas 不要用 JS 硬撐 `canvas` 的 CSS 寬度來放大（會撐破版面、截圖全黑）；改為把視窗縮到 992px 以下讓版面轉單欄，或直接讀 canvas 像素判斷內容有無溢出邊界

## 開發約束

1. 網頁用於課堂智慧白板投影，需維持高對比、易讀、美觀及清楚的 hover 微動畫
2. 首頁與教材頁維持無伺服器架構，使用者自訂資料保存在客戶端 `localStorage`；獨立即時互動頁可依全域技能規範使用 Firebase Firestore
3. 除非使用者明確要求，不引入 Tailwind CSS 或其他 CSS 框架，維持 Vanilla CSS
4. 不在程式碼中硬編碼帳密或 Token，也不把本機儲存資料上傳至分析平台
5. 外部連結必須使用 `target="_blank" rel="noopener noreferrer"`，避免課堂使用時覆蓋目前分頁
6. 小節完成狀態**一律只寫在 `curriculum.js`**（`"status": "completed"`），不要在 `script.js` 寫判斷式
7. **教材頁是 `<body>` 自己捲動**，不是文件捲動；跟捲動位置有關的功能要同時支援兩種來源（`annotate.js` 已處理）
8. 教材圖片一律使用 WebP（漫畫寬 1080／品質 85，插圖寬 640／品質 85），並加 `loading="lazy"`；漫畫品質原為 88，2026-08-07 實測降到 85 可少 13～16% 體積且投影下看不出差異

## 跨專案依賴

- 教材頁最上方的「課前暖身漫畫」**固定調用** `teaching-comic` 專案的 `comic-generator` 技能：
  `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\skills\comic-generator\SKILL.md`
- 細節規範見 `.agents/skills/math-interactive-material/SKILL.md` 第 3.1 節；本專案不再自行實作漫畫生圖或加字流程
- **漫畫前處理不要裁切四格內容**：比例不合改補白邊，否則會切掉邊緣角色
- 漫畫只有 `_raw.png` 會呼叫生圖 API 計費，`_prepped`／`_normalized`／`_final` 都是本機處理，改對白重跑不用再花錢
- 風格規則為依小節指定，不再全站固定水豚風
- **對話泡一律由生圖階段畫出**（生圖提示要空白泡，不要再寫 `no speech bubbles`），後製腳本預設只排字；泡不堪用就重生原圖，不要用 `-DrawBubbles` 補框
- **對白座標一律從實際的 `_normalized.png` 量測**泡的內緣，不要從腳本參數或原圖推算
- **`bubbles.json` 的 `w`／`h` 要給泡的完整內緣，不要預先內縮**：`add_captions_json.ps1` 自己會加 padding，先內縮會變成縮兩次，字級被壓到最小值仍排不下而報錯
- **不要用 gpt-image-2 的遮罩改圖（`--mask`）做局部修圖**：實測會無視遮罩把整張重畫，四格結構全毀；要改一個小物件也一律整張重生，並在同一次呼叫多生幾張候選挑選
- `wordcloud.html` **固定由全域 `word-cloud-page` 技能模板產生／同步**：`C:\Users\chang\.agents\skills\word-cloud-page\SKILL.md`
- 文字雲固定使用 `CLOUD_ID = teaching_web`，資料位於 `clouds/teaching_web/words/`；同步新版模板時保留本專案的 `background.png` 背景客製化

## 部署

- GitHub Pages 分支部署（classic）：來源為 `main` 分支根目錄，**push 到 `main` 就會自動發布**
- 沒有 `.github/workflows` 是正常的，設定在 repo Settings → Pages，不要因為找不到 workflow 就以為沒有自動部署
- push 前先確認資產路徑為相對路徑，避免在子路徑 `/teaching-web/` 下失效
- 正式 Firebase 互動頁不要用自動化瀏覽器驗收；App Check 可能拒絕低可信用戶端，改由使用者本人用一般瀏覽器實測或查看 App Check Metrics
