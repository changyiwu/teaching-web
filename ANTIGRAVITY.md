# AntiGravity 專案規則 - teaching-web

本專案是一個供教師在課堂上使用的「智慧課堂教學整合網」。

## 專案核心技術棧
- **架構**：純靜態前端頁面（HTML5、CSS3、Vanilla JavaScript）。
- **樣式視覺**：以 HSL 色彩系統打造的深色磨砂玻璃風（Glassmorphic UI）。
- **外部資源**：採用 FontAwesome V6 (CDN) 提供視覺圖示，以及 Google Fonts 載入 "Outfit" 與 "Noto Sans TC"。
- **本地端功能**：使用瀏覽器的 `localStorage` 來永久保存隨堂備忘錄與每一冊的自訂快捷連結。

## 開發守則與約束
1. **極致視覺美感**：本網頁用於課堂智慧白板投影，版面配置需保持高對比度、易讀、美觀，並具備優雅的懸停微動畫。
2. **無伺服器架構**：不使用任何後端資料庫或 API 伺服器，所有自訂資料必須保存在客戶端（`localStorage`）。
3. **保持純 CSS**：除非使用者明確要求，否則不引進 TailwindCSS 或其他 CSS 框架，保持 Vanilla CSS 的控制彈性。
4. **安全與隱私**：隨堂備忘錄或連結可能包含敏感資訊，請勿在程式碼中硬編碼任何帳密、Token，也不要將本地存儲資料上傳至任何分析平台。
5. **連結相容性**：所有外部連結（如康軒、翰林、南一）皆必須使用 `target="_blank" rel="noopener noreferrer"`，避免課堂教學時覆蓋本整合網分頁。

## 開工流程
1. 讀取此 `ANTIGRAVITY.md`。
2. 開啟並閱讀 Obsidian 專案駕駛艙：`C:\Users\chang\我的雲端硬碟\2ndbrain\teaching-web-專案駕駛艙.md`。
3. 執行 `git status` 了解目前狀態。
4. 回報專案現狀與建議的下一步。

## 收工流程
1. 檢查程式碼中是否含有敏感資料（API key、網址 Token、學生姓名等）。
2. 在 `teaching-web-專案駕駛艙.md` 中記錄已完成事項、待辦事項、遇到的問題或踩坑紀錄。
3. 檢查 `git status` 和 `git diff`。
4. 將修改的檔案加入 stage（僅 stage 當次相關檔案，請勿直接 `git add .`）。
5. Commit 並 Push 至 GitHub。
