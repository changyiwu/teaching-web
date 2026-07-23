# teaching-web（跨 Agent 專案規則）

> 本檔供不同 Agent 維護「智慧課堂教學整合網」時共同遵循。

## 專案技術棧

- 架構：純靜態前端頁面（HTML5、CSS3、Vanilla JavaScript）。
- 視覺：以 HSL 色彩系統打造深色磨砂玻璃風格（Glassmorphic UI）。
- 外部資源：Font Awesome 6 CDN、Google Fonts 的 `Outfit` 與 `Noto Sans TC`。
- 本地功能：以瀏覽器 `localStorage` 保存隨堂備忘錄及各冊自訂快捷連結。
- 課堂畫筆：`annotate.css` + `annotate.js`（Pointer Events 全螢幕標註，主網頁與教材頁共用）。
- Obsidian 筆記：`teaching-web/專案工作流程.md`。

## 跨專案依賴

- 教材頁最上方的「課前暖身漫畫」**固定調用** `teaching-comic` 專案的 `comic-generator` 技能：
  `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\skills\comic-generator\SKILL.md`
- 細節規範見 `.agents/skills/math-interactive-material/SKILL.md` 第 3.1 節；
  本專案不再自行實作漫畫生圖或加字流程。

## 開發約束

1. 網頁用於課堂智慧白板投影，需維持高對比、易讀、美觀及清楚的 hover 微動畫。
2. 維持無伺服器架構，不使用後端資料庫或 API 伺服器；使用者自訂資料保存在客戶端 `localStorage`。
3. 除非使用者明確要求，不引入 Tailwind CSS 或其他 CSS 框架，維持 Vanilla CSS。
4. 不在程式碼中硬編碼帳密或 Token，也不把本機儲存資料上傳至分析平台。
5. 外部連結必須使用 `target="_blank" rel="noopener noreferrer"`，避免課堂使用時覆蓋目前分頁。

## 開工流程

1. 讀取本檔與 `handoff.md`。
2. 需要詳細脈絡時，讀取 Obsidian 的 `teaching-web/專案工作流程.md`。
3. 執行 `git status`，確認目前工作樹及使用者既有變更。
4. 回報專案現況與建議下一步。

## 收工流程

1. 檢查程式碼是否含 API key、網址 Token、學生姓名等敏感資料。
2. 在 Obsidian 專案筆記記錄已完成事項、待辦及踩坑，並同步更新 `handoff.md`。
3. 檢查 `git status` 與 `git diff`。
4. 只 stage 本次任務相關檔案，不使用無差別的 `git add .`。
5. 僅在使用者明確授權時 commit 與 push。

## 共通約定

- 回應與文件使用繁體中文。
- 涉及檔案操作時回報完整產出位置。
- Windows 指令優先使用 PowerShell。

## 最近進度

- 2026-07-22：將教學整合網規則統一為跨 Agent `agents.md`，移除舊規則檔並同步 README；本機 `.bak` 備份保留但不納入版控。
- 2026-07-23：新增課堂畫筆 `annotate.css` / `annotate.js`，掛載於主網頁與 `1-1-1`、`1-1-2` 教材頁；教材技能改為固定調用 `teaching-comic` 的 `comic-generator` 產生課前漫畫。
