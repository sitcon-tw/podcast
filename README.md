# podcast

學生戰鬥機

檔案變動 (feature/Index):

- 將 inline CSS 從 `index.html` 移到 `css/style.css`。
- 將 inline JavaScript 抽出到 `js/main.js`，並在 `index.html` 使用 `<script src="js/main.js" defer></script>` 引入。

如何本機測試：
1. 在專案資料夾中打開 `index.html`（直接開啟或使用靜態伺服器，例如 `npx http-server`）。
2. 若 RSS feed 無法載入，可能受到 CORS 限制，請確認網路或更換 proxy。

主要檔案：
- `index.html` - 主頁，現在只保留結構並引用外部資源。
- `css/style.css` - 主要樣式（包含先前的 inline style）。
- `js/main.js` - 主要行為邏輯（從 inline script 抽出）。
