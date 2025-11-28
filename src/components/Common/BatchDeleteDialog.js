import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField
} from '@mui/material';
import { Trash2, Calendar } from 'lucide-react';

/**
 * 批量刪除對話框組件
 * @param {boolean} open - 是否顯示對話框
 * @param {Function} onConfirm - 確認時的回調函數，傳入 (startDate, endDate)
 * @param {Function} onCancel - 取消時的回調函數
 * @param {Set} lockedImages - 鎖定的圖片集合
 */
const BatchDeleteDialog = ({ 
  open, 
  onConfirm, 
  onCancel,
  lockedImages = new Set()
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // 驗證日期
    if (!startDate || !endDate) {
      setError('請選擇開始和結束日期');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError('開始日期不能晚於結束日期');
      return;
    }

    setError('');
    onConfirm(startDate, endDate);
    
    // 重置表單
    setStartDate('');
    setEndDate('');
  };

  const handleCancel = () => {
    setError('');
    setStartDate('');
    setEndDate('');
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
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
          <Trash2 className="w-5 h-5 text-red-400" />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: '#f9fafb',
            fontWeight: 700,
            fontSize: '1.125rem'
          }}
        >
          批量刪除照片
        </Typography>
      </DialogTitle>

      <DialogContent 
        sx={{ 
          pt: '24px !important',
          pb: '24px !important', 
          px: '24px !important' 
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              color: '#d1d5db',
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              mb: 3
            }}
          >
            選擇日期範圍來批量刪除照片。被鎖定的照片將會被跳過，不會被刪除。
          </Typography>

          {lockedImages.size > 0 && (
            <Box
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                p: 2,
                mb: 3
              }}
            >
              <Typography
                sx={{
                  color: '#86efac',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                🔒 目前有 {lockedImages.size} 張照片已被鎖定，將不會被刪除
              </Typography>
            </Box>
          )}

          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 2 }, 
              alignItems: { xs: 'stretch', sm: 'center' }
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  mb: 1,
                  fontWeight: 600
                }}
              >
                開始日期
              </Typography>
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Calendar className="w-4 h-4 text-yellow-400 mr-2" />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(55, 65, 81, 0.6)', // gray-700 半透明
                    color: '#f9fafb',
                    border: '1px solid rgba(107, 114, 128, 0.3)', // gray-500
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(55, 65, 81, 0.8)',
                      border: '1px solid rgba(234, 179, 8, 0.4)', // yellow-500
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(55, 65, 81, 0.9)',
                      border: '1px solid rgba(234, 179, 8, 0.6)', // yellow-500
                      boxShadow: '0 0 0 3px rgba(234, 179, 8, 0.1)',
                    },
                    '& fieldset': {
                      border: 'none',
                    }
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark',
                    fontSize: { xs: '16px', sm: 'inherit' }, // 防止 iOS 縮放
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.7) sepia(1) saturate(5) hue-rotate(10deg)', // 黃色調
                    cursor: 'pointer',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                    }
                  }
                }}
              />
            </Box>

            <Typography
              sx={{
                color: '#64748b',
                fontSize: '1rem',
                mt: { xs: 0, sm: 3 },
                textAlign: 'center',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              ~
            </Typography>

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: '#cbd5e1',
                  fontSize: '0.875rem',
                  mb: 1,
                  fontWeight: 600
                }}
              >
                結束日期
              </Typography>
              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Calendar className="w-4 h-4 text-yellow-400 mr-2" />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(55, 65, 81, 0.6)', // gray-700 半透明
                    color: '#f9fafb',
                    border: '1px solid rgba(107, 114, 128, 0.3)', // gray-500
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(55, 65, 81, 0.8)',
                      border: '1px solid rgba(234, 179, 8, 0.4)', // yellow-500
                    },
                    '&.Mui-focused': {
                      bgcolor: 'rgba(55, 65, 81, 0.9)',
                      border: '1px solid rgba(234, 179, 8, 0.6)', // yellow-500
                      boxShadow: '0 0 0 3px rgba(234, 179, 8, 0.1)',
                    },
                    '& fieldset': {
                      border: 'none',
                    }
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark',
                    fontSize: { xs: '16px', sm: 'inherit' }, // 防止 iOS 縮放
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(0.7) sepia(1) saturate(5) hue-rotate(10deg)', // 黃色調
                    cursor: 'pointer',
                    opacity: 0.8,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                    }
                  }
                }}
              />
            </Box>
          </Box>

          {error && (
            <Typography
              sx={{
                color: '#f87171',
                fontSize: '0.875rem',
                mt: 2,
                textAlign: 'center'
              }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 }, 
          pt: 0, 
          gap: { xs: 1.5, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' }
        }}
      >
        <Button
          onClick={handleCancel}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'rgba(100, 116, 139, 0.15)',
            color: '#cbd5e1',
            fontWeight: 600,
            py: { xs: 1, sm: 1.2 },
            border: '1px solid rgba(100, 116, 139, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(100, 116, 139, 0.25)',
              border: '1px solid rgba(100, 116, 139, 0.5)'
            },
            textTransform: 'none',
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            minWidth: 0
          }}
        >
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'rgba(239, 68, 68, 0.15)',
            color: '#ffffff',
            fontWeight: 600,
            py: { xs: 1, sm: 1.2 },
            border: '1px solid rgba(239, 68, 68, 0.3)',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.5)'
            },
            textTransform: 'none',
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            minWidth: 0
          }}
        >
          確定刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchDeleteDialog;
