# teaching-web（智慧課堂教學整合網）（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介

智慧課堂教學整合網：純靜態前端頁面（HTML5、CSS3、Vanilla JavaScript），以 HSL 色彩系統打造深色磨砂玻璃風格（Glassmorphic UI）。用於課堂智慧白板投影，涵蓋 6 冊 58 小節課程。外部資源為 Font Awesome 6 CDN 與 Google Fonts 的 `Outfit`、`Noto Sans TC`；隨堂備忘錄與各冊自訂快捷連結存於瀏覽器 `localStorage`。

線上網址：<https://changyiwu.github.io/teaching-web/>

## 關鍵時程

<!-- 目前無固定時程 -->

## 目標與路線圖

- [x] 階段一：首頁與 58 個教材頁骨架、GitHub Pages 自動部署
- [x] 階段二：規則統一為跨 Agent `agents.md`
- [x] 階段三：共用元件抽出——`curriculum.js`、`annotate.css/js`、`tools-sidebar.css/js`、`lesson-nav.css/js`、`materials/pending.css`
- [x] 階段四：小節完成狀態改為資料驅動；首頁新增跨冊搜尋與狀態篩選；修好「新增連結」自訂書籤
- [x] 階段五：教材圖片全面轉 WebP（11.4MB → 0.89MB）
- [ ] 階段六：建置 `1-1-3`「整數的乘除與四則運算」（目前為佔位頁），依 `SKILL.md` 第 3.1 節先產課前漫畫
- [ ] 階段七：在課堂智慧板實測課堂畫筆（捲動模式、觸控筆跡、4K 解析度下的落筆位置）
- [ ] 階段八：其餘 55 個佔位頁逐節建置

> 目前課程進度：58 節中僅 `1-1-1`、`1-1-2` 完成，其餘 56 節為佔位頁。

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

## 工作約定

- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文；涉及檔案操作時回報完整產出位置
- Windows 指令優先使用 PowerShell
- 收工前檢查程式碼是否含 API key、網址 Token、學生姓名等敏感資料
- 只 stage 本次任務相關檔案，**不使用無差別的 `git add .`**；僅在使用者明確授權時 commit 與 push

## 開發約束

1. 網頁用於課堂智慧白板投影，需維持高對比、易讀、美觀及清楚的 hover 微動畫
2. 維持無伺服器架構，不使用後端資料庫或 API 伺服器；使用者自訂資料保存在客戶端 `localStorage`
3. 除非使用者明確要求，不引入 Tailwind CSS 或其他 CSS 框架，維持 Vanilla CSS
4. 不在程式碼中硬編碼帳密或 Token，也不把本機儲存資料上傳至分析平台
5. 外部連結必須使用 `target="_blank" rel="noopener noreferrer"`，避免課堂使用時覆蓋目前分頁
6. 小節完成狀態**一律只寫在 `curriculum.js`**（`"status": "completed"`），不要在 `script.js` 寫判斷式
7. **教材頁是 `<body>` 自己捲動**，不是文件捲動；跟捲動位置有關的功能要同時支援兩種來源（`annotate.js` 已處理）
8. 教材圖片一律使用 WebP（漫畫寬 1080／品質 88，插圖寬 640／品質 85），並加 `loading="lazy"`

## 跨專案依賴

- 教材頁最上方的「課前暖身漫畫」**固定調用** `teaching-comic` 專案的 `comic-generator` 技能：
  `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\skills\comic-generator\SKILL.md`
- 細節規範見 `.agents/skills/math-interactive-material/SKILL.md` 第 3.1 節；本專案不再自行實作漫畫生圖或加字流程
- **漫畫前處理不要裁切四格內容**：比例不合改補白邊，否則會切掉邊緣角色
- 漫畫只有 `_raw.png` 會呼叫生圖 API 計費，`_prepped`／`_normalized`／`_final` 都是本機處理，改對白重跑不用再花錢
- 風格規則為依小節指定，不再全站固定水豚風

## 部署

- GitHub Pages 分支部署（classic）：來源為 `main` 分支根目錄，**push 到 `main` 就會自動發布**
- 沒有 `.github/workflows` 是正常的，設定在 repo Settings → Pages，不要因為找不到 workflow 就以為沒有自動部署
- push 前先確認資產路徑為相對路徑，避免在子路徑 `/teaching-web/` 下失效

## 最近進度

- 2026-07-22：將教學整合網規則統一為跨 Agent `agents.md`，移除舊規則檔並同步 README；本機 `.bak` 備份保留但不納入版控。
- 2026-07-23：新增課堂畫筆並掛載於主網頁與 `1-1-1`、`1-1-2`；教材技能改為固定調用 `teaching-comic` 的 `comic-generator`。
- 2026-07-23（第二輪）：畫筆改整頁座標；工具側邊欄抽成共用元件掛到全部 58 頁；課程資料抽出 `curriculum.js`；首頁新增跨冊搜尋與狀態篩選；修好「新增連結」；新增上下節導覽；教材圖片全面轉 WebP。
- 2026-07-23（第三輪）：刪除 `.bak` 備份；修正 README 部署說明；`1-1-1` 換上消除框中框的新漫畫；`1-1-2` 改回日式動漫風重生。
- 2026-07-24：專案藍圖改用標準範本格式（補上路線圖 checklist、資料夾結構與同步層級表；原「開工流程／收工流程」兩節移除，改以 `startup`／`shutdown` 技能為準）。
