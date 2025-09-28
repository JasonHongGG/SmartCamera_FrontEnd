# Smart Camera System - 重構後架構說明

## 📁 項目結構

```
src/
├── components/           # React 組件
│   ├── Common/          # 通用組件
│   │   ├── Toggle.js
│   │   ├── DetectionGroup.js
│   │   ├── CustomSensitivityInput.js
│   │   ├── StatusButton.js
│   │   ├── NavigationBar.js
│   │   ├── HostConfigDialog.js
│   │   └── index.js
│   ├── Detection/       # 檢測相關組件
│   │   ├── MotionDetection.js
│   │   ├── FaceDetection.js
│   │   ├── DetectionInterface.js
│   │   └── index.js
│   └── Camera/          # 相機相關組件 (待實現)
├── hooks/               # 自定義 Hooks
│   ├── commonHooks.js   # 通用 Hooks
│   ├── detectionHooks.js # 檢測相關 Hooks
│   └── index.js
├── services/            # API 服務層
│   ├── cameraApi.js     # 相機 API
│   ├── detectionApi.js  # 檢測 API
│   └── index.js
├── context/             # React Context
│   └── AppConfigContext.js
├── utils/               # 工具函數
│   ├── helpers.js       # 通用輔助函數
│   └── constants.js     # 常量定義
├── App-refactored.js    # 重構後的主應用
└── 原始檔案...
```

## 🔧 主要改進

### 1. **關注點分離 (Separation of Concerns)**
- **組件層**: 只負責 UI 渲染和用戶交互
- **服務層**: 處理所有 API 調用
- **Hooks層**: 管理狀態邏輯和副作用
- **Context層**: 全局狀態管理

### 2. **可重用組件 (Reusable Components)**
- `Toggle`: 統一的開關組件
- `DetectionGroup`: 檢測組的容器組件
- `CustomSensitivityInput`: 自定義敏感度輸入
- `StatusButton`: 帶狀態的按鈕組件

### 3. **自定義 Hooks**
- `usePolling`: 管理 API 輪詢
- `useAsyncOperation`: 處理異步操作狀態
- `useMotionDetection`: 運動檢測邏輯
- `useFaceDetection`: 臉部檢測邏輯

### 4. **服務層封裝**
- `CameraApiService`: 相機 API 封裝
- `DetectionApiService`: 檢測 API 封裝
- 統一錯誤處理和重試邏輯

### 5. **解決輸入框焦點問題**
- 使用 uncontrolled components
- 利用 useRef 避免不必要的重新渲染
- 優化輪詢機制，只在數據變化時更新狀態

## 🚀 使用方式

### 替換主 App 組件
```bash
# 備份原始文件
mv src/App.js src/App-original.js

# 使用重構後的版本
mv src/App-refactored.js src/App.js
```

### 運行應用
```bash
npm start
```

## 📋 功能特性

### ✅ 已實現
- [x] 模組化組件架構
- [x] 運動檢測組件
- [x] 臉部檢測組件
- [x] 自定義敏感度設定
- [x] Apply Custom 按鈕狀態反饋
- [x] 輸入框焦點保持
- [x] 優化的 API 輪詢機制
- [x] 主機配置對話框
- [x] 導航欄組件

### 🔄 待完成
- [ ] 相機控制組件重構
- [ ] 跨線檢測組件
- [ ] 錯誤邊界處理
- [ ] 單元測試
- [ ] 性能監控

## 🎯 核心優勢

1. **維護性**: 每個組件職責單一，易於維護和擴展
2. **可測試性**: 邏輯分離，便於單元測試
3. **可重用性**: 組件高度可重用，減少代碼重複  
4. **性能優化**: 精確的重新渲染控制，提升性能
5. **類型安全**: 清晰的 props 定義和文檔
6. **開發體驗**: 良好的組織結構，提升開發效率

## 🔧 開發指南

### 添加新的檢測類型
1. 在 `services/detectionApi.js` 添加相關 API 方法
2. 在 `hooks/detectionHooks.js` 創建對應的 Hook
3. 在 `components/Detection/` 創建新的組件
4. 在 `DetectionInterface.js` 中引入並使用

### 添加新的通用組件
1. 在 `components/Common/` 創建組件
2. 在 `components/Common/index.js` 導出
3. 在需要的地方引入使用

### 自定義 Hook 開發
1. 遵循 React Hooks 規則
2. 保持單一職責原則
3. 提供清晰的返回值接口
4. 處理錯誤和載入狀態

## 📝 注意事項

1. 確保所有組件都使用 React.memo 或 useMemo 優化
2. API 服務需要適當的錯誤處理和重試機制
3. 狀態更新需要檢查是否真正需要重新渲染
4. 保持組件的可測試性和可維護性