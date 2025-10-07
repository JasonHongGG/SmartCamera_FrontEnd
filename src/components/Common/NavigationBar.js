import React, { useState } from 'react';
import { Camera, Activity, Settings, Image, LogOut, User } from 'lucide-react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = ({ 
  currentPage, 
  onPageChange, 
  onOpenHostDialog,
  config 
}) => {
  const { currentUser, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const navigationItems = [
    {
      id: 'camera',
      label: 'Camera Control',
      icon: Camera
    },
    {
      id: 'detection',
      label: 'Detection Systems',
      icon: Activity
    },
    {
      id: 'images',
      label: 'Image Viewer',
      icon: Image
    }
  ];

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
      }}
    >
      <Toolbar 
        className="flex items-center"
        sx={{ 
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="p-1.5 sm:p-2 rounded-lg">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
          </div>
          <Typography 
            variant="h6" 
            component="div" 
            className="text-white font-black tracking-tight"
            sx={{ 
              fontWeight: 900,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Camera Control System
          </Typography>
          <Typography 
            variant="subtitle1" 
            component="div" 
            className="text-white font-black tracking-tight"
            sx={{ 
              fontWeight: 900,
              fontSize: '0.875rem',
              display: { xs: 'block', sm: 'none' }
            }}
          >
            Camera System
          </Typography>
        </div>

        {/* Center: Spacer */}
        <div className="flex-1 min-w-2"></div>

        {/* Mobile: Compact Layout */}
        <div className="flex items-center gap-0.5 sm:hidden">
          {/* User Menu Button - Mobile */}
          <IconButton
            onClick={handleUserMenuOpen}
            size="small"
            sx={{
              border: '1px solid rgba(234, 179, 8, 0.5)',
              borderRadius: '50% !important',
              width: '32px !important',
              height: '32px !important',
              minWidth: '32px !important',
              minHeight: '32px !important',
              maxWidth: '32px !important',
              maxHeight: '32px !important',
              padding: '0 !important',
              bgcolor: 'rgba(234, 179, 8, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(234, 179, 8, 0.2)',
              }
            }}
          >
            <User className="w-3.5 h-3.5 text-yellow-400" />
          </IconButton>

          <IconButton
            onClick={onOpenHostDialog}
            size="small"
            sx={{
              border: '1px solid rgba(255, 255, 254, 0.3)',
              borderRadius: '50% !important', // 強制保持圓形
              width: '32px !important',
              height: '32px !important',
              minWidth: '32px !important',
              minHeight: '32px !important',
              maxWidth: '32px !important',
              maxHeight: '32px !important',
              padding: '0 !important',
              '&:hover': {
                bgcolor: 'rgba(189, 189, 189, 0.2)',
              }
            }}
          >
            <Settings className="w-3.5 h-3.5" />
          </IconButton>
          
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <IconButton
                key={item.id}
                onClick={() => onPageChange(item.id)}
                size="small"
                sx={{
                  bgcolor: isActive ? '#eab308' : 'transparent',
                  color: isActive ? '#000000' : '#d1d5db',
                  border: `1px solid ${isActive ? '#eab308' : '#4b5563'}`,
                  borderRadius: '6px !important', // 稍微小一點的圓角
                  width: '32px !important',
                  height: '32px !important',
                  minWidth: '32px !important',
                  minHeight: '32px !important',
                  maxWidth: '32px !important',
                  maxHeight: '32px !important',
                  padding: '0 !important',
                  '&:hover': {
                    bgcolor: isActive ? '#e9be3cff' : '#374151',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </IconButton>
            );
          })}
        </div>

        {/* Desktop: Full Layout */}
        <div className="hidden sm:flex items-center gap-2 md:gap-3">
          {/* User Menu Button - Desktop */}
          <IconButton
            onClick={handleUserMenuOpen}
            size="medium"
            sx={{
              border: '1px solid rgba(234, 179, 8, 0.5)',
              bgcolor: 'rgba(234, 179, 8, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(234, 179, 8, 0.2)',
              }
            }}
          >
            <User className="w-5 h-5 text-yellow-400" />
          </IconButton>

          {/* Host Configuration */}
          <IconButton
            onClick={onOpenHostDialog}
            size="medium"
            sx={{
              border: '1px solid rgba(255, 255, 254, 0.3)',
              '&:hover': {
                bgcolor: 'rgba(189, 189, 189, 0.2)',
              }
            }}
          >
            <Settings className="w-5 h-5" />
          </IconButton>

          {/* Navigation Buttons */}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                variant="outlined"
                size="medium"
                startIcon={<Icon className="w-4 h-4 md:w-5 md:h-5" />}
                sx={{
                  minWidth: { sm: '90px', md: '110px' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: { sm: 0.5, md: 0.8 },
                  bgcolor: isActive ? '#eab308' : 'transparent',
                  color: isActive ? '#000000' : '#d1d5db',
                  borderColor: isActive ? '#eab308' : '#4b5563',
                  fontSize: { sm: '0.75rem', md: '0.875rem' },
                  py: { sm: 0.8, md: 1.2 },
                  px: { sm: 1.5, md: 2.5 },
                  '&:hover': {
                    bgcolor: isActive ? '#e9be3cff' : '#374151',
                    borderColor: isActive ? '#e9be3cff' : '#6b7280',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <span className="font-medium">
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        disableScrollLock
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 240,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 179, 8, 0.1)',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            padding: 0
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiList-root': {
            py: 0,
            padding: 0
          }
        }}
        slotProps={{
          root: {
            slotProps: {
              backdrop: {
                sx: {
                  backgroundColor: 'transparent'
                }
              }
            }
          }
        }}
      >
        {/* User Info and Logout Section */}
        <Box 
          sx={{ 
            px: 2.5, 
            py: 2,
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(234, 179, 8, 0.3)',
                flexShrink: 0
              }}
            >
              <User className="w-5 h-5 text-gray-900" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#9ca3af', 
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600
                }}
              >
                當前使用者
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#f9fafb', 
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  lineHeight: 1.3,
                  mt: 0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {currentUser?.username}
              </Typography>
            </Box>
          </Box>

          {/* Logout Button */}
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <LogOut className="w-4 h-4 text-red-400" />
          </IconButton>
        </Box>
      </Menu>
    </AppBar>
  );
};

export default NavigationBar;