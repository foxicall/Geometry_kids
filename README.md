# 形狀探險隊 · Geometry Kids

給國小學生的原創幾何矩陣推理遊戲。使用 React、TypeScript、Vite 與 Tailwind CSS，圖形皆由 SVG 繪製，沒有外部圖片、字型或兒童帳號。這是邏輯練習，不是瑞文氏標準測驗、IQ 換算或資優鑑定。

## 開始開發

需要 Node.js **24.14 以上**（建議使用 `.nvmrc` 指定的 Node 24）。

```bash
npm ci
npm run dev
```

開發伺服器使用 5173 埠；`npm run build` 產出 `dist/`，`npm run preview` 使用 4173 埠。專案已在隔離的雲端工作目錄中，直接使用現有 checkout，不需額外建立 worktree。

## 遊戲內容

- 每回合 8 題；2×2 入門與 3×3 進階／挑戰，右下角為空格。
- 圓形、正方形、三角形、星形，支援 0／90／180／270 度旋轉，實心／空心／斜線，以及 1–3 個圖形。
- 每題 5–7 個選項，包含 1 個正解與 4–6 個視覺不同的干擾項。本地題庫在入門／進階用 5 個選項，挑戰用 6 個。
- 自適應模式在同難度連對兩題後升級，答錯後降低一級；也可關閉並固定練習。
- 確認答案後鎖住選項並顯示規律；計時在回饋及結算階段暫停，重新開始會歸零。
- 結算包含答對比例、各種規律的練習紀錄與逐題解釋。最近 10 次結果只存在該瀏覽器；無法使用 localStorage 也能玩。

## Gemini 3.8 題庫維護

金鑰**只**由 Node 腳本中的 `process.env.GEMINI_API_KEY` 讀取。請在雲端環境設定安全提供金鑰；不要放進對話、原始碼、`VITE_` 變數或 Vite `define`。腳本使用官方 `@google/genai` SDK、`models.generateContent` 與 `responseJsonSchema`。

```bash
npx tsx scripts/generateQuestions.ts
# 或使用 npm 指令
npm run questions:generate -- --count 3 --difficulty medium
```

預設依序嘗試 `gemini-3.8`、`gemini-3.8-flash`、`gemini-2.5-flash`、`gemini-1.5-flash`。模型名稱可用性由服務端與帳戶決定；回應異常或題目未通過驗證時繼續下一個候選。每個請求逾時 45 秒、SDK 不自動重試，最多 4 個模型嘗試。沒有金鑰時直接使用本地題庫。

成功結果或本地備援都會寫入 **`src/data/generatedQuestions.json`**，前端會實際載入；用完該難度的題目後繼續使用本地生成器。每題 `source` 標示 `gemini` 或 `local`，控制台會明確回報來源，絕不把離線備援宣稱為 AI 生成。JSON 使用 `{ "version": 1, "questions": [...] }` 格式。

維護參數：`--count 1..12`、`--difficulty easy|medium|hard`、`--out 檔案.json`、`--offline`。預設 3 題入門。可完全離線重新產生：

```bash
npx tsx scripts/generateQuestions.ts --offline
npm run questions:validate
```

只有通過型別、矩陣尺寸、每一格規律、右下角挖空、視覺去重、唯一正解與題庫去重的資料才會寫入。以暫存檔原子替換，驗證或寫檔失敗不會先清空舊檔。題解由已驗證的規則重新產生。發布前仍應審閱題目是否適合目標年齡。

詳細錯誤保留 `status`、`message`、`response`、`errorDetails` 等伺服器欄位，但會遮蔽金鑰、Bearer token、Cookie 與授權標頭。HTTP 400 可據此診斷格式問題；404 可能是模型不存在或已停止對該帳戶提供服務。

雲端透過既有 HTTPS proxy 呼叫 `generativelanguage.googleapis.com`，Node 腳本自動沿用環境 proxy 與 CA 信任，保持 TLS 驗證。遊戲本身不發送 Gemini 請求，不會將作答紀錄傳給模型。生成指令可能消耗帳戶現有配額；建置、安裝與 CI 不自動呼叫 API。

## 驗證

```bash
npm test                 # 規律、答案、狀態機、SVG、API 錯誤與備援測試
npm run build            # TypeScript、題庫驗證、Vite 與前端金鑰洩漏檢查
npx playwright install chromium
npm run test:e2e         # 桌面與手機完整互動
```

此雲端環境已有 Chromium，免下載即可測試：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

瀏覽器測試涵蓋八題結算、重複點選、重啟、計時清理、固定難度、提示、儲存不可用與 320px 版面。截圖及失敗 trace 位於被忽略的 `test-results/`。GitHub Actions 會執行相同的單元、建置與瀏覽器檢查，不需要 API 金鑰。

## 模組

- `src/types/matrix.ts`：圖形、題目與規律型別。
- `src/components/CellRenderer.tsx`：純 SVG 圖形、數量佈局與斜線填充。
- `src/lib/matrix.ts`、`bankSchema.ts`：結構與語意驗證；圓形／正方形旋轉後相同時視為相同答案。
- `src/lib/questions.ts`、`questionBank.ts`：本地規則題與生成題庫載入。
- `src/lib/game.ts`：作答狀態機、自適應難度、計時與本機紀錄。
- `scripts/generateQuestions.ts`、`scripts/lib/`：伺服器端生成、候選重試、錯誤遮蔽與離線備援。

`.gitignore` 已排除 `.env*`、`node_modules/`、`dist/` 及本機測試產物。提交前執行建置與相關測試，使用繁體中文 Conventional Commits，並依任務指定推送分支。
