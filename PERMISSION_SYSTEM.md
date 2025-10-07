# 權限系統使用說明

## 📋 概述

本系統實作了基於角色的權限控制（RBAC），支援細粒度的功能權限管理。

## 🏗️ 系統架構

### 1. 權限配置 (`public/user.json`)

```json
{
  "users": [
    {
      "username": "aini",
      "password": "0102",
      "role": "admin",
      "permissions": {
        "camera": {
          "view": true,
          "control": true,
          "settings": true
        },
        "detection": {
          "view": true,
          "control": true,
          "settings": true
        },
        "images": {
          "view": true,
          "download": true,
          "delete": true
        }
      }
    }
  ]
}
```

### 2. 權限模組說明

#### Camera（相機控制）
- `view`: 查看相機畫面
- `control`: 控制相機（變焦、移動等）
- `settings`: 修改相機設定

#### Detection（偵測系統）
- `view`: 查看偵測結果
- `control`: 啟動/停止偵測
- `settings`: 修改偵測參數

#### Images（圖片管理）
- `view`: 查看圖片
- `download`: 下載圖片
- `delete`: 刪除圖片

## 🔧 使用方法

### 方法一：使用 `usePermission` Hook（推薦）

```jsx
import { usePermission } from '../../hooks/usePermission';
import PermissionDialog from '../Common/PermissionDialog';

const MyComponent = () => {
  const { checkPermission, permissionDialog, closePermissionDialog } = usePermission();

  const handleDelete = () => {
    // 檢查權限，如果有權限則執行回調函數
    checkPermission('images', 'delete', () => {
      // 有權限時執行的邏輯
      console.log('執行刪除操作');
      deleteImage();
    }, '您沒有權限刪除圖片'); // 可選的自訂訊息
  };

  return (
    <>
      <button onClick={handleDelete}>刪除</button>
      
      {/* 權限警告對話框 */}
      <PermissionDialog
        open={permissionDialog.open}
        message={permissionDialog.message}
        onClose={closePermissionDialog}
      />
    </>
  );
};
```

### 方法二：直接使用 `hasPermission`

```jsx
import { useAuth } from '../../context/AuthContext';

const MyComponent = () => {
  const { hasPermission } = useAuth();

  // 根據權限顯示/隱藏按鈕
  return (
    <div>
      {hasPermission('images', 'download') && (
        <button>下載</button>
      )}
      
      {hasPermission('images', 'delete') && (
        <button>刪除</button>
      )}
    </div>
  );
};
```

### 方法三：條件渲染 + 權限檢查

```jsx
import { usePermission } from '../../hooks/usePermission';
import PermissionDialog from '../Common/PermissionDialog';

const MyComponent = () => {
  const { checkPermission, permissionDialog, closePermissionDialog, hasPermission } = usePermission();

  const handleDelete = () => {
    checkPermission('images', 'delete', () => {
      deleteImage();
    });
  };

  return (
    <>
      {/* 只有有權限的用戶才看到刪除按鈕 */}
      {hasPermission('images', 'delete') && (
        <button onClick={handleDelete}>刪除</button>
      )}
      
      {/* 或者，顯示按鈕但禁用 */}
      <button 
        onClick={handleDelete}
        disabled={!hasPermission('images', 'delete')}
      >
        刪除
      </button>
      
      <PermissionDialog
        open={permissionDialog.open}
        message={permissionDialog.message}
        onClose={closePermissionDialog}
      />
    </>
  );
};
```

## 📝 完整範例

請參考 `src/components/ImageViewer/ImageActionsExample.js` 查看完整的實作範例。

## 🎨 權限對話框自訂

### 基本用法
```jsx
<PermissionDialog
  open={permissionDialog.open}
  message={permissionDialog.message}
  onClose={closePermissionDialog}
/>
```

### 自訂訊息
```jsx
checkPermission('images', 'delete', callback, '您沒有權限刪除圖片，僅限管理員使用');
```

## 🔐 權限管理最佳實踐

### 1. 新增使用者權限
修改 `public/user.json`：

```json
{
  "username": "newuser",
  "password": "password",
  "role": "viewer",
  "permissions": {
    "camera": {
      "view": true,
      "control": false,
      "settings": false
    },
    "detection": {
      "view": true,
      "control": false,
      "settings": false
    },
    "images": {
      "view": true,
      "download": false,
      "delete": false
    }
  }
}
```

### 2. 新增權限類型
1. 在 `user.json` 中添加新權限
2. 在 `usePermission.js` 的 `getActionName` 函數中添加中文名稱
3. 在組件中使用新權限

### 3. 角色建議

- **admin（管理員）**: 所有權限
- **operator（操作員）**: view + control 權限
- **viewer（觀察者）**: 僅 view 權限

## 🚀 進階用法

### 組合多個權限檢查

```jsx
const handleComplexAction = () => {
  if (hasPermission('camera', 'control') && hasPermission('detection', 'settings')) {
    // 需要同時擁有兩個權限
    performComplexAction();
  } else {
    alert('權限不足');
  }
};
```

### 權限檢查與 API 呼叫結合

```jsx
const handleSaveSettings = async () => {
  checkPermission('camera', 'settings', async () => {
    try {
      await saveSettingsAPI(newSettings);
      alert('設定已儲存');
    } catch (error) {
      alert('儲存失敗');
    }
  });
};
```

## 📊 權限矩陣

| 使用者 | 角色 | Camera View | Camera Control | Camera Settings | Images View | Images Download | Images Delete |
|--------|------|-------------|----------------|-----------------|-------------|-----------------|---------------|
| aini   | admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| selab  | user  | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |

## ⚠️ 注意事項

1. **前端權限檢查僅用於 UI 控制**：實際的安全性應該在後端實作
2. **權限資料儲存在 localStorage**：登出後會清除
3. **修改 user.json 後需要重新登入**：才能載入新的權限配置
4. **自訂訊息是可選的**：如果不提供，會使用預設訊息

## 🐛 常見問題

### Q: 為什麼修改權限後沒有生效？
A: 需要重新登入讓系統重新載入 user.json 的權限配置。

### Q: 如何實作更複雜的權限邏輯？
A: 可以在 `hasPermission` 函數中添加更多邏輯，或創建新的權限檢查函數。

### Q: 可以動態修改權限嗎？
A: 目前權限在登入時載入，要修改需要重新登入。未來可以實作動態更新功能。

## 📚 相關檔案

- `/public/user.json` - 使用者和權限配置
- `/src/context/AuthContext.js` - 認證和權限管理
- `/src/hooks/usePermission.js` - 權限檢查 Hook
- `/src/components/Common/PermissionDialog.js` - 權限警告對話框
- `/src/components/ImageViewer/ImageActionsExample.js` - 使用範例
