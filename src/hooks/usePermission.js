import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * 自訂 Hook 用於權限檢查和顯示無權限警告
 * @returns {Object} 包含權限檢查函數和警告對話框狀態
 */
export const usePermission = () => {
  const { hasPermission } = useAuth();
  const [permissionDialog, setPermissionDialog] = useState({
    open: false,
    message: ''
  });

  /**
   * 檢查權限並在沒有權限時顯示警告
   * @param {string} module - 模組名稱 (camera, detection, images)
   * @param {string} action - 動作名稱 (view, control, settings, download, delete)
   * @param {Function} callback - 有權限時執行的回調函數
   * @param {string} customMessage - 自訂警告訊息（可選）
   */
  const checkPermission = (module, action, callback, customMessage = null) => {
    if (hasPermission(module, action)) {
      // 有權限，執行回調函數
      if (callback) callback();
      return true;
    } else {
      // 沒有權限，顯示警告對話框
      const message = customMessage || `您沒有權限執行此操作（${getActionName(action)}）`;
      setPermissionDialog({
        open: true,
        message
      });
      return false;
    }
  };

  /**
   * 關閉權限警告對話框
   */
  const closePermissionDialog = () => {
    setPermissionDialog({
      open: false,
      message: ''
    });
  };

  /**
   * 取得動作的中文名稱
   */
  const getActionName = (action) => {
    const actionNames = {
      view: '查看',
      control: '控制',
      settings: '設定',
      download: '下載',
      delete: '刪除'
    };
    return actionNames[action] || action;
  };

  return {
    checkPermission,
    permissionDialog,
    closePermissionDialog,
    hasPermission
  };
};
