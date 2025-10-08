import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

/**
 * 確認對話框組件
 * @param {boolean} open - 是否顯示對話框
 * @param {string} title - 對話框標題
 * @param {string} message - 確認訊息
 * @param {string} confirmText - 確認按鈕文字
 * @param {string} cancelText - 取消按鈕文字
 * @param {Function} onConfirm - 確認時的回調函數
 * @param {Function} onCancel - 取消時的回調函數
 */
const ConfirmDialog = ({ 
  open, 
  title = '確認操作', 
  message, 
  confirmText = '確定',
  cancelText = '取消',
  onConfirm, 
  onCancel 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      disableScrollLock={true}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2.5,
          pt: 3,
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)'
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: '#f9fafb',
            fontWeight: 700,
            fontSize: '1.125rem'
          }}
        >
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          pt: '20px !important',
          pb: '24px !important', 
          px: '24px !important' 
        }}
      >
        <Typography
          sx={{
            color: '#d1d5db',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            textAlign: 'center'
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 2 }}>
        <Button
          onClick={onCancel}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'rgba(100, 116, 139, 0.15)',
            color: '#cbd5e1',
            fontWeight: 600,
            py: 1.2,
            border: '1px solid rgba(100, 116, 139, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(100, 116, 139, 0.25)',
              border: '1px solid rgba(100, 116, 139, 0.5)'
            },
            textTransform: 'none',
            fontSize: '0.9375rem'
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'rgba(239, 68, 68, 0.15)',
            color: '#ffffff',
            fontWeight: 600,
            py: 1.2,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)'
            },
            textTransform: 'none',
            fontSize: '0.9375rem'
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
