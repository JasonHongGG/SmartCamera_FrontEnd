# SmartCamera_FrontEnd

智慧相機前端控制系統 - 基於 React 開發的相機控制介面

## 專案簡介

這是一個用於控制智慧相機的前端應用程式，提供直觀的使用者介面來管理相機設定和監控功能。

## 技術棧

- **React** - 前端框架
- **Material-UI** - UI 組件庫
- **Tailwind CSS** - 樣式框架
- **Lucide React** - 圖標庫

## 系統需求

在開始之前，請確保您的電腦已安裝以下軟體：

- **Node.js** (建議版本 16.0.0 或更高)
  - 下載地址：https://nodejs.org/
- **npm** (通常隨 Node.js 一起安裝)
- **Git** (用於下載專案)
  - 下載地址：https://git-scm.com/

## 安裝與啟動步驟

### 步驟 1: 下載專案

選擇以下其中一種方式下載專案：

#### 方法 A: 使用 Git 克隆 (推薦)
```bash
git clone https://github.com/JasonHongGG/SmartCamera_FrontEnd.git
cd SmartCamera_FrontEnd
```

#### 方法 B: 下載 ZIP 檔案
1. 前往 GitHub 專案頁面
2. 點擊綠色的 "Code" 按鈕
3. 選擇 "Download ZIP"
4. 解壓縮檔案到您想要的位置

### 步驟 2: 進入專案目錄

```bash
cd SmartCamera_FrontEnd
```

### 步驟 3: 安裝相依套件

```bash
npm install
```

> **注意：** 首次安裝可能需要幾分鐘時間，請耐心等待。

### 步驟 4: 啟動開發伺服器

```bash
npm start
```

### 步驟 5: 開啟瀏覽器

專案啟動成功後，系統會自動開啟瀏覽器並導向 `http://localhost:4000`

如果瀏覽器沒有自動開啟，請手動在瀏覽器網址列輸入：`http://localhost:4000`

## 專案指令說明

### 開發模式
```bash
npm start
```
啟動開發伺服器，應用程式將在 `http://localhost:4000` 運行。
- 修改程式碼時會自動重新載入頁面
- 控制台會顯示任何錯誤訊息

### 建置生產版本
```bash
npm run build
```
將應用程式建置為生產版本，輸出至 `build` 資料夾。
- 程式碼會被最佳化以獲得最佳效能
- 檔案名稱會包含雜湊值以利快取管理

### 建置獨立版本
```bash
npm run build:standalone
```
建置可獨立執行的版本，包含所有必要的資源檔案。

## API
將連線端的 URL 改成 /api
接著就可以在 serve.js 下定義自己的流量轉發方式
(ex: detector 是放在跟網頁一樣的裝置上，那就可以設為 /api 後，在 serve.js 設置要轉發到 detector 的 port 上)

## 常見問題排解

### 問題 1: npm install 失敗
**解決方案：**
```bash
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 資料夾和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

### 問題 2: 埠號 3000 已被占用
**解決方案：**
- 系統會自動詢問是否使用其他埠號，選擇 "Y" 即可
- 或手動指定埠號：
```bash
PORT=3001 npm start
```

### 問題 3: Node.js 版本不相容
**解決方案：**
- 確保 Node.js 版本為 16.0.0 或更高
- 檢查版本：`node --version`
- 如需更新請前往 https://nodejs.org/

### 問題 4: 套件相依性衝突
**解決方案：**
```bash
# 使用 --legacy-peer-deps 參數安裝
npm install --legacy-peer-deps
```

## 專案結構

```
SmartCamera_FrontEnd/
├── public/                 # 靜態檔案
├── src/                   # 原始碼
│   ├── App.js            # 主要應用程式組件
│   ├── CameraInterface.js # 相機控制介面
│   ├── DetectionInterface.js # 偵測功能介面
│   └── ...
├── build/                # 建置輸出目錄
├── package.json          # 專案配置檔案
└── README.md            # 專案說明文件
```

## 開發指南

### 開發環境設定
1. 使用您喜歡的程式碼編輯器 (推薦 VS Code)
2. 安裝相關擴充套件：
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - Prettier - Code formatter

### 程式碼規範
- 使用 ES6+ 語法
- 遵循 React Hooks 最佳實踐
- 組件檔案使用 PascalCase 命名
- 樣式使用 Tailwind CSS 類別

## 部署說明

### 本地部署
```bash
# 建置專案
npm run build

# 使用靜態檔案伺服器執行 (需先安裝 serve)
npx serve -s build
```

### 生產環境部署
建置完成後，將 `build` 資料夾的內容部署到您的網頁伺服器即可。

## 技術支援

如果您遇到任何問題或需要協助，請：

1. 檢查 [常見問題排解](#常見問題排解) 章節
2. 查看專案的 GitHub Issues
3. 聯繫開發團隊

## 版本資訊

- 目前版本：0.1.0
- Node.js 要求：16.0.0+
- 最後更新：2025年9月

---

**SmartCamera_FrontEnd** - 智慧相機前端控制系統
© 2025 JasonHongGG. All rights reserved.
