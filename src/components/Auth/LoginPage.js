import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Camera, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('請輸入帳號和密碼');
      return;
    }

    setLoading(true);
    
    const result = await login(username, password);
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || '登入失敗');
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      className="min-h-screen flex items-center justify-center"
      sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(234, 179, 8, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(234, 179, 8, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: '440px',
          width: '90%',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo and Title */}
        <Box className="flex flex-col items-center mb-6">
          <Box
            className="mb-4 p-3 rounded-xl"
            sx={{
              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
              boxShadow: '0 8px 16px rgba(234, 179, 8, 0.3)'
            }}
          >
            <Camera className="w-12 h-12 text-gray-900" />
          </Box>
          <Typography 
            variant="h4" 
            component="h1" 
            className="font-black text-white text-center"
            sx={{ 
              fontWeight: 900,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'visible',
              mb: 1.5
            }}
          >
            Camera System
          </Typography>
          <Typography 
            variant="body1" 
            className="text-gray-400 text-center"
            sx={{ 
              fontWeight: 400,
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              letterSpacing: '0.01em',
              opacity: 0.85
            }}
          >
            請登入以繼續使用系統
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              '& .MuiAlert-icon': {
                color: '#f87171'
              }
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Box className="space-y-4">
            {/* Username Field */}
            <TextField
              fullWidth
              label="帳號"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="請輸入帳號"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <User className="w-5 h-5 text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(8px)',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#eab308',
                    borderWidth: '2px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#eab308'
                }
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="密碼"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="請輸入密碼"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={loading}
                      sx={{
                        color: '#9ca3af',
                        '&:hover': {
                          color: '#d1d5db'
                        }
                      }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(8px)',
                  '& fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(148, 163, 184, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#eab308',
                    borderWidth: '2px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#eab308'
                }
              }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: '#eab308',
                color: '#000000',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(234, 179, 8, 0.4)',
                '&:hover': {
                  bgcolor: '#e9bc35ff',
                  boxShadow: '0 6px 16px rgba(234, 179, 8, 0.5)'
                },
                '&:disabled': {
                  bgcolor: '#4b5563',
                  color: '#9ca3af'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#000000' }} />
              ) : (
                '登入'
              )}
            </Button>
          </Box>
        </form>

        {/* Footer Info */}
        <Box className="mt-6 text-center">
          <Typography 
            variant="caption" 
            className="text-gray-500"
            sx={{ fontSize: '0.75rem' }}
          >
            預設帳號: selab / 61035
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
