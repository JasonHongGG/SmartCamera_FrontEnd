import './App.css';

import React, { useState } from 'react';
import { Camera, Activity, Settings, Globe } from 'lucide-react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Button, AppBar, Toolbar, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { muiTheme } from './theme';
import CameraInterface from './CameraInterface';
import CameraDetectionInterface from './DetectionInterface';

const App = () => {
  const [currentPage, setCurrentPage] = useState('camera'); // 'camera' 或 'detection'
  const [cameraHost, setCameraHost] = useState("http://140.116.6.62:3000");
  const [detectionHost, setDetectionHost] = useState("http://localhost:4000");
  const [hostDialogOpen, setHostDialogOpen] = useState(false);
  const [tempCameraHost, setTempCameraHost] = useState(cameraHost);
  const [tempDetectionHost, setTempDetectionHost] = useState(detectionHost);

  const navigationItems = [
    {
      id: 'camera',
      label: 'Camera Control',
      icon: Camera,
      component: CameraInterface
    },
    {
      id: 'detection',
      label: 'Detection Systems',
      icon: Activity,
      component: CameraDetectionInterface
    }
  ];

  const currentItem = navigationItems.find(item => item.id === currentPage);
  const CurrentComponent = currentItem?.component;

  const handleHostChange = () => {
    setCameraHost(tempCameraHost);
    setDetectionHost(tempDetectionHost);
    setHostDialogOpen(false);
  };

  const openHostDialog = () => {
    setTempCameraHost(cameraHost);
    setTempDetectionHost(detectionHost);
    setHostDialogOpen(true);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Navigation Header */}
        <AppBar position="static" sx={{ bgcolor: '#1f2937', borderBottom: '1px solid #374151' }}>
          <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
              <Typography 
                variant="h6" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'white',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Camera Control System
              </Typography>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
              {/* Host Settings Button */}
              <IconButton
                onClick={openHostDialog}
                sx={{
                  color: '#d1d5db',
                  '&:hover': { 
                    bgcolor: '#374151' 
                  },
                  p: { xs: 1, sm: 1.5 }
                }}
                title="Change Host Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </IconButton>
              
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    variant={isActive ? "contained" : "outlined"}
                    sx={{
                      minWidth: { xs: 'auto', sm: '120px', md: '140px' },
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 1, sm: 2 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, sm: 1 },
                      bgcolor: isActive ? '#eab308' : 'transparent',
                      color: isActive ? '#000000' : '#d1d5db',
                      borderColor: isActive ? '#eab308' : '#4b5563',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': {
                        bgcolor: isActive ? '#e9be3cff' : '#374151',
                        borderColor: isActive ? '#e9be3cff' : '#6b7280',
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline font-medium">{item.label}</span>
                    <span className="sm:hidden font-medium">
                      {item.id === 'camera' ? 'Camera' : 'Detection'}
                    </span>
                  </Button>
                );
              })}
            </div>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <div className="relative">
          {/* Page Indicator */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300 text-sm font-medium">
                Current: {currentItem?.label}
              </span>
            </div>
          </div>

          {/* Render Current Component */}
          {CurrentComponent && (
            <CurrentComponent 
              baseHost={currentPage === 'camera' ? cameraHost : detectionHost}
              cameraHost={cameraHost}
              detectionHost={detectionHost}
            />
          )}
        </div>

        {/* Host Settings Dialog */}
        <Dialog
          open={hostDialogOpen}
          onClose={() => setHostDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#1f2937',
              color: '#f3f4f6'
            }
          }}
        >
          <DialogTitle sx={{ color: '#f3f4f6', borderBottom: '1px solid #374151' }}>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-yellow-500" />
              <span>Host Settings</span>
            </div>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <div className="space-y-4">
              <TextField
                autoFocus
                margin="dense"
                label="Camera Host URL"
                type="url"
                fullWidth
                variant="outlined"
                value={tempCameraHost}
                onChange={(e) => setTempCameraHost(e.target.value)}
                placeholder="http://140.116.6.62:3000"
                helperText="Enter the URL for the camera control system"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f3f4f6',
                    '& fieldset': { borderColor: '#6b7280' },
                    '&:hover fieldset': { borderColor: '#9ca3af' },
                    '&.Mui-focused fieldset': { borderColor: '#eab308' },
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#9ca3af',
                    '&.Mui-focused': { color: '#eab308' }
                  },
                  '& .MuiFormHelperText-root': { color: '#9ca3af' }
                }}
              />
              
              <TextField
                margin="dense"
                label="Detection Host URL"
                type="url"
                fullWidth
                variant="outlined"
                value={tempDetectionHost}
                onChange={(e) => setTempDetectionHost(e.target.value)}
                placeholder="http://localhost:4000"
                helperText="Enter the URL for the detection system"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f3f4f6',
                    '& fieldset': { borderColor: '#6b7280' },
                    '&:hover fieldset': { borderColor: '#9ca3af' },
                    '&.Mui-focused fieldset': { borderColor: '#eab308' },
                  },
                  '& .MuiInputLabel-root': { 
                    color: '#9ca3af',
                    '&.Mui-focused': { color: '#eab308' }
                  },
                  '& .MuiFormHelperText-root': { color: '#9ca3af' }
                }}
              />
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #374151' }}>
            <Button
              onClick={() => setHostDialogOpen(false)}
              sx={{ color: '#9ca3af' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleHostChange}
              variant="contained"
              sx={{
                bgcolor: '#eab308',
                color: '#000',
                '&:hover': { bgcolor: '#d97706' }
              }}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>

        {/* Footer Status */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-sm">System Active</span>
              </div>
              <div className="text-gray-500 text-sm">
                Camera: {cameraHost} | Detection: {detectionHost}
              </div>
            </div>
            <div className="text-gray-500 text-xs">
              Camera Control System v1.0
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;