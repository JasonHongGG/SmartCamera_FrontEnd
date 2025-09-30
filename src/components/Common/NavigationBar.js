import React from 'react';
import { Camera, Activity, Settings, Globe, Image } from 'lucide-react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';

const NavigationBar = ({ 
  currentPage, 
  onPageChange, 
  onOpenHostDialog,
  config 
}) => {
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
    </AppBar>
  );
};

export default NavigationBar;