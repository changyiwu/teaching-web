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
- [ ] 階段八：其餘佔位頁逐節建置（已完成 `1-1-4`「指數記法與科學記號」復古太空探險風、`1-2-1`「因數與倍數」台灣夜市水彩風、`1-2-2`「最大公因數與最小公倍數」8-bit 像素電玩風、`1-2-3`「分數的四則運算」手繪烘焙風、`1-2-4`「指數律」和紙摺紙工房風、`1-3-1`「代數式的化簡」手搖飲吧檯黑板菜單風，皆為 6 重點／6 互動／12 題）
- [x] 階段九：投影可讀性與窄螢幕版面修正——MathJax 上下標與數字字距（`1-1-4`）、CSS Grid／flex 溢出裁切（`1-1-1`～`1-1-4` 與首頁）；規則已收進〈開發約束〉9～11

> 目前課程進度：58 節中 `1-1-1`、`1-1-2`、`1-1-3`、`1-1-4`、`1-2-1`、`1-2-2`、`1-2-3`、`1-2-4`、`1-3-1` 完成，其餘 49 節為佔位頁。

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
├─ tools/                  # 驗收用小工具（不是網站的一部分）
│  ├─ nostore.py           # 送 Cache-Control: no-store 的靜態伺服器（預設埠 8765）
│  └─ shots.py             # 收 canvas toDataURL 存成 PNG（預設埠 8766，輸出 tools/_shots/）
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
- 本機預覽窗格（Browser pane）會供快取的舊版 CSS/JS，改完在那裡看不到效果是正常的；**`navigate` 帶 `force` 與加 query 參數都擋不住**，驗收一律用 **`python tools/nostore.py`**（會送 `Cache-Control: no-store`），不要用 `python -m http.server` 的預設行為
- Browser pane 沒有顯示在畫面上時 `screenshot` 會逾時（頁面不合成畫格）；要看 canvas 就起 **`python tools/shots.py`**，用 `toDataURL()` 把畫面 POST 過去存成 PNG 再讀檔，不必等使用者打開窗格
- **收回來的 canvas PNG 是透明底，判讀外觀前一定要先用卡片底色 `alpha_composite` 疊過**；直接 `convert('RGB')` 會把半透明填色變成全彩（`rgba(52,211,153,0.18)` 變成亮綠），文字跟底色同色就整片消失，看起來像 bug 其實是截圖流程的錯
- 教材頁的本機驗收一定要走 HTTP（`python tools/nostore.py`）；直接開 `file://` 在預覽窗格只會拿到靜態快照，`canvas.js` 不會執行、互動全部驗不到
- 瀏覽器分頁未在前景時渲染會被節流，大量 canvas 迴圈驗證會逾時；先把分頁切到前景，且單批控制在 100 組參數以內
- 驗收 Canvas 不要用 JS 硬撐 `canvas` 的 CSS 寬度來放大（會撐破版面、截圖全黑）；改為把視窗縮到 992px 以下讓版面轉單欄，或直接讀 canvas 像素判斷內容有無溢出邊界
- 本機沒有安裝 `PyMuPDF`／`Pillow`；PDF 與圖片處理一律走 `file-toolkit` 技能建好的共用環境：`C:\Users\chang\AppData\Local\file-toolkit\.venv\Scripts\python.exe`
- **Bash 工具的 heredoc 會把反斜線減半**——不只正規表示式，**LaTeX（`\frac`、`\left`）、CSS 註解、Windows 路徑一律中招**：`\frac` 會變成換頁字元＋`rac` 寫進檔案裡，而且 Python 只會發 SyntaxWarning 不會擋下來。任何含反斜線的內容都不要用 `cat <<'EOF'` 寫檔，改用 Write 工具落檔再執行
- **量版面溢出前先確認 `innerWidth` 不是 0**：預覽窗格尚未配置版面時所有 `getBoundingClientRect()` 都會回 0，掃描程式會回報幾千個假溢出。先 `resize_window` 指定寬度、確認 `innerWidth` 正確再量
- **量 MathJax 的幾何尺寸前一定要 `await document.fonts.ready`**：MathJax 的網頁字型是非同步載入的，`MathJax.startup.promise` resolve 時字型往往還沒到，此時量到的是替代字型的尺寸——分數的框會比實際高出 5 成，看起來像括號框不住分數。2026-08-21 就因為漏了這一步，連續兩輪誤判 `1-2-3` 絕對值括號的成因。量完最好再 `setTimeout` 一小段等重排完成。另注意 `1-2-3` 的 `mjx-stretchy-v.mjx-c7C` 高度是**量出來的固定值**，前提是絕對值裡放單層分數；該頁若改放帶分數或多層分數，那兩個數字要照這條重量

## 開發約束

1. 網頁用於課堂智慧白板投影，需維持高對比、易讀、美觀及清楚的 hover 微動畫
2. 首頁與教材頁維持無伺服器架構，使用者自訂資料保存在客戶端 `localStorage`；獨立即時互動頁可依全域技能規範使用 Firebase Firestore
3. 除非使用者明確要求，不引入 Tailwind CSS 或其他 CSS 框架，維持 Vanilla CSS
4. 不在程式碼中硬編碼帳密或 Token，也不把本機儲存資料上傳至分析平台
5. 外部連結必須使用 `target="_blank" rel="noopener noreferrer"`，避免課堂使用時覆蓋目前分頁
6. 小節完成狀態**一律只寫在 `curriculum.js`**（`"status": "completed"`），不要在 `script.js` 寫判斷式
7. **教材頁是 `<body>` 自己捲動**，不是文件捲動；跟捲動位置有關的功能要同時支援兩種來源（`annotate.js` 已處理）
8. 教材圖片一律使用 WebP（漫畫寬 1080、插圖寬 640），並加 `loading="lazy"`。品質**依畫風的紋理密度分兩級**：
   - **平面風格**（黏土定格、日式動漫、水豚等大色塊）用 **q85**；漫畫品質原為 88，2026-08-07 實測降到 85 可少 13～16% 體積且投影下看不出差異
   - **高頻紋理風格**（復古印刷網點、水彩紙紋、黑板粉筆紋等）用 **q75**；2026-08-20 實測 q75 比 q85 少 32% 體積，平均色差僅約 1%，且差異全落在不帶資訊的紙紋／網點雜訊上。再往下降（q70、q65）體積幾乎不再變小，畫質卻繼續掉，所以 **q75 是轉折點，不要再往下調**
   - 只剩 WebP、找不到原始 PNG 時可以直接重壓：實測 q85 WebP 再壓 q75 的二次失真（平均差 3.86/255）比從 PNG 單次壓 q75（4.79/255）還小
   - **8-bit 像素風算高頻紋理**（dithering 的棋盤點跟印刷網點同一類），插圖用 **q75**；2026-08-20 實測省 31%、2 倍放大下與 q85 看不出差別
   - **但漫畫一律維持 q85**：漫畫上有後製排入的中文對白，字的邊緣禁不起再壓；插圖沒有文字才可以降
9. **CSS Grid 一律不要留 min-content 底線**：`1fr` 的最小值是 min-content，卡片裡只要有一段不能斷行的內容（MathJax 算式、長數字按鈕）整欄就會被撐破外框，而 `.concept-section`／`body` 是 `overflow: hidden`，超出的部分直接被裁掉。欄寬固定寫 `minmax(0, 1fr)`，有最小寬度需求就寫 `minmax(min(300px, 100%), 1fr)`
10. **flex 容器不要用 `align-items: center` 裝比它寬的內容**：溢出會左右各分一半，左邊那一半連橫向捲動都捲不到，等於內容消失。改用 `align-items: stretch`，需要置中的元素自己加 `margin-inline: auto`
11. **MathJax 預設字距在投影下不夠用，每個教材頁都要補這三條 kerning**：上下標 `mjx-msup > mjx-script { margin-left: 0.18em }`（實測預設 gap = 0，`0ⁿ` 的天然墨跡間距只有 0.03em）、數字內部 `mjx-mn > mjx-c + mjx-c { margin-left: 0.09em }`（`10000`、`0.001` 會黏成一團）、canvas 上自己畫的指數 `POW_KERN = 0.17`
12. **短除法一律「除到商是質數為止」**：課本的短除法停在商已經是質數的那一步（180 停在 `3)15`、梯形下面留 `5`），不要一路除到商為 1；`2-2` 最大公因數／最小公倍數也沿用同一個呈現方式
14. **顯示型算式 `\[ ... \]` 太長會直接壓到右欄的互動卡上**：兩欄之間只有 2rem（32px）的 gap，`1-2-3` 實測有一條算式溢出 95px，整段蓋在互動卡上。長算式要拆成 `\begin{aligned}` 多行（在 `&=` 前換行），並補一條 `.explanation-card mjx-container[display="true"] { overflow-x: auto }` 當保險；`overflow-y` 會連帶變成 hidden，記得加 `padding-block` 以免切掉分數的上下緣。**`aligned` 的第一行也要以 `&` 開頭**——`aligned` 的總寬是「左半欄最寬 ＋ 右半欄最寬」，第一行若放完整算式（沒有 `&`）就等於把它整條塞進左半欄，即使後面每行都拆過，總寬仍舊爆掉；`1-3-1` 實測 414px 下 15 條顯示型算式全部需要捲動，改成第一行 `& 原式`、其餘 `&= …` 之後歸零
13. **教材頁的 canvas 在投影下只有約 0.7 倍**：容器上限 1200px，兩欄版面下 540px 的 canvas 實際只顯示約 380px。內容密集的 canvas（百數表這類格子陣列）字級要比其他 canvas 大一級（實測 17px → 20px），否則投影在智慧板上讀不到
15. **`.sign-table` 在窄螢幕會被 `overflow: hidden` 裁掉**：`.concept-section` 是 `overflow: hidden`，414px 下表格實測溢出卡片 34px、整欄直接消失且捲不到。表格一律包一層 `<div class="table-scroll">`（`max-width: 100%; overflow-x: auto`）。**不可以直接對 `<table>` 下 `overflow-x`**——那需要 `display: block`，一旦不是 table 就失去欄寬同步，`thead` 與 `tbody` 的欄位會對不齊
16. **行內算式 `\( ... \)` 太長同樣會被裁掉**（開發約束 14 的另一半）：`mjx-container` 是 inline-block、內部不折行，接在中文引言後面時起點被推到句中，更容易超出卡片。窄螢幕下判準是「這條式子單獨一行放不下嗎」，會的就改成顯示型 `\[ ... \]`（吃得到 14 的 `overflow-x` 保險），必要時再拆 `aligned`。不要靠對行內 `mjx-container` 加 `overflow-x` 解決——那會讓 inline-block 的基線改成下緣，行內數學與文字的對齊全部跑掉
17. **教材圖表的長度／面積必須與數值成正比**：比大小、成長衰減這類主題**不可以用對數尺度**——等距的階梯很好看，但 \(a^2\) 看起來只比 \(a^1\) 長一點，實際上是它的 \(a\) 倍，等於把要教的東西抹平。值小到快看不見時就讓它看不見（保留 1～2px 並標數值），那正是要傳達的訊息

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
- **`add_captions_json.ps1` 用矩形 bbox 判定重疊**：旁白方框與相鄰橢圓泡只要 bbox 的角落交疊就會報 `Bubble N and bubble M overlap`，即使兩個泡在畫面上根本沒碰到。把靠得比較近的那個框寬度縮 15～20px 就好，**不要加 `-AllowOverlap`**（那會讓真正的重疊也被放行）
- **挑生圖候選要看泡的內緣尺寸，不是只看畫面好不好看**：同一次呼叫產生的候選畫面品質往往相近，但泡的大小可能差很多（實測第 1 格旁白框 154×49 vs 180×55），小的那張排不進 18px 字級
- **`add_captions_json.ps1` 的字級自動縮放只在「連折行都放不下」時才降級**，文字太寬時它預設是折行而不是縮小；長數字串想排成一行得自己把 `font_size` 試小
- **畫面要表現「尺寸變化」時，生圖提示要把每一格的相對尺寸寫死**：只說「摺了幾次」模型會畫成同尺寸的紙疊，面積不會跟著變小。要逐格寫明（例：第 2 格是原張的四分之一面積、第 3 格只有巴掌大但明顯變厚、第 4 格兩者並排對比），數學上的比例才會出現在畫面上
- **`normalize_comic.ps1` 與 `add_captions_json.ps1` 覆蓋既有輸出要加 `-Force`**：重生原圖後沿用同一個檔名會被擋下來
- **不要用 gpt-image-2 的遮罩改圖（`--mask`）做局部修圖**：實測會無視遮罩把整張重畫，四格結構全毀；要改一個小物件也一律整張重生，並在同一次呼叫多生幾張候選挑選
- `wordcloud.html` **固定由全域 `word-cloud-page` 技能模板產生／同步**：`C:\Users\chang\.agents\skills\word-cloud-page\SKILL.md`
- 文字雲固定使用 `CLOUD_ID = teaching_web`，資料位於 `clouds/teaching_web/words/`；同步新版模板時保留本專案的 `background.png` 背景客製化

## 部署

- GitHub Pages 分支部署（classic）：來源為 `main` 分支根目錄，**push 到 `main` 就會自動發布**
- 沒有 `.github/workflows` 是正常的，設定在 repo Settings → Pages，不要因為找不到 workflow 就以為沒有自動部署
- push 前先確認資產路徑為相對路徑，避免在子路徑 `/teaching-web/` 下失效
- 正式 Firebase 互動頁不要用自動化瀏覽器驗收；App Check 可能拒絕低可信用戶端，改由使用者本人用一般瀏覽器實測或查看 App Check Metrics
