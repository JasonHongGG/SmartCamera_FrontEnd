import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { muiTheme } from './theme';
import { AppConfigProvider } from './context/AppConfigContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavigationBar from './components/Common/NavigationBar';
import HostConfigDialog from './components/Common/HostConfigDialog';
import CameraInterface from './components/Camera/CameraInterface';
import DetectionInterface from './components/Detection/DetectionInterface';
import ImageViewer from './components/ImageViewer/ImageViewer';
import LoginPage from './components/Auth/LoginPage';
import { useAppConfig } from './context/AppConfigContext';
import './App.css';

const AppContent = () => {
  const { config, updateConfig } = useAppConfig();
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('camera');
  const [hostDialogOpen, setHostDialogOpen] = useState(false);

  const handleHostSave = (newConfig) => {
    updateConfig(newConfig);
  };

  // 顯示載入畫面
  if (loading) {
    return (
      <Box
        className="min-h-screen flex items-center justify-center"
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#eab308' }} />
      </Box>
    );
  }

  // 如果未登入，顯示登入頁面
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // eslint-disable-next-line no-unused-vars
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'camera':
        return (
          <CameraInterface 
            baseHost={config.cameraHost} 
            cameraHost={config.cameraHost}
            streamHost={config.streamHost}
            detectionHost={config.detectionHost}
          />
        );
      case 'detection':
        return <DetectionInterface />;
      default:
        return <DetectionInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavigationBar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onOpenHostDialog={() => setHostDialogOpen(true)}
        config={config}
      />
      
      <main>
        {/* {renderCurrentPage()} */}
        {/* Camera Interface - 用 CSS 控制顯示/隱藏 */}
        <div 
          className={currentPage === 'camera' ? 'block' : 'hidden'}
          style={{ display: currentPage === 'camera' ? 'block' : 'none' }}
        >
          <CameraInterface 
            baseHost={config.cameraHost} 
            cameraHost={config.cameraHost}
            streamHost={config.streamHost}
            detectionHost={config.detectionHost}
          />
        </div>

        {/* Detection Interface - 用 CSS 控制顯示/隱藏 */}
        <div 
          className={currentPage === 'detection' ? 'block' : 'hidden'}
          style={{ display: currentPage === 'detection' ? 'block' : 'none' }}
        >
          <DetectionInterface />
        </div>

        {/* Image Viewer - 用 CSS 控制顯示/隱藏 */}
        <div 
          className={currentPage === 'images' ? 'block' : 'hidden'}
          style={{ display: currentPage === 'images' ? 'block' : 'none' }}
        >
          <ImageViewer />
        </div>
      </main>

      <HostConfigDialog
        open={hostDialogOpen}
        onClose={() => setHostDialogOpen(false)}
        config={config}
        onSave={handleHostSave}
      />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppConfigProvider>
          <AppContent />
        </AppConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;