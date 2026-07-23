# teaching-web（跨 Agent 專案規則）

> 本檔供不同 Agent 維護「智慧課堂教學整合網」時共同遵循。

## 專案技術棧

- 架構：純靜態前端頁面（HTML5、CSS3、Vanilla JavaScript）。
- 視覺：以 HSL 色彩系統打造深色磨砂玻璃風格（Glassmorphic UI）。
- 外部資源：Font Awesome 6 CDN、Google Fonts 的 `Outfit` 與 `Noto Sans TC`。
- 本地功能：以瀏覽器 `localStorage` 保存隨堂備忘錄及各冊自訂快捷連結。
- 共用元件（首頁與 58 個教材頁共用，皆自動注入 UI）：
  - `curriculum.js`：6 冊 58 小節課程資料庫；**完成狀態一律只寫在這裡**（`"status": "completed"`），不要在 `script.js` 寫判斷式。
  - `tools-sidebar.css/js`：課堂工具側邊欄；教材頁以 `data-home="../../index.html"` 附加「返回主網頁」卡片。
  - `annotate.css/js`：課堂畫筆，筆跡以整頁座標保存並跟隨捲動。
  - `lesson-nav.css/js`：教材頁上一節／下一節導覽。
  - `materials/pending.css`：56 個「待施工」佔位頁共用樣式。
- 圖片規範：教材圖片一律使用 WebP（漫畫寬 1080／品質 88，插圖寬 640／品質 85），並加 `loading="lazy"`。
- Obsidian 筆記：`teaching-web/專案工作流程.md`。

## 跨專案依賴

- 教材頁最上方的「課前暖身漫畫」**固定調用** `teaching-comic` 專案的 `comic-generator` 技能：
  `C:\Users\chang\我的雲端硬碟\agents\teaching-comic\skills\comic-generator\SKILL.md`
- 細節規範見 `.agents/skills/math-interactive-material/SKILL.md` 第 3.1 節；
  本專案不再自行實作漫畫生圖或加字流程。

## 部署

- GitHub Pages 分支部署（classic）：來源為 `main` 分支根目錄，**push 到 `main` 就會自動發布**。
- 線上網址：<https://changyiwu.github.io/teaching-web/>
- 沒有 `.github/workflows` 是正常的，設定在 repo Settings → Pages，不要因為找不到 workflow 就以為沒有自動部署。
- push 前先確認資產路徑為相對路徑，避免在子路徑 `/teaching-web/` 下失效。

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
- 2026-07-23（第二輪）：
  - 畫筆改為整頁座標並新增捲動模式；課堂工具側邊欄抽成共用元件，掛到首頁與全部 58 個教材頁。
  - 課程資料抽出 `curriculum.js`，完成狀態改為資料驅動；首頁新增跨冊搜尋與狀態篩選。
  - 修好原本無作用的「新增連結」視窗，各冊自訂連結可新增／刪除並存於 `localStorage`。
  - 教材頁新增上一節／下一節導覽；56 個佔位頁改用共用 `materials/pending.css` 重新產生。
  - `1-1-1`、`1-1-2` 課前漫畫依 `comic-generator` 重生（水豚風、1080x1350、JSON 對白框）。
  - 教材圖片全面轉 WebP：11.4MB → 0.89MB。
