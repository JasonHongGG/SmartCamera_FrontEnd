import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { muiTheme } from './theme';
import { AppConfigProvider } from './context/AppConfigContext';
import NavigationBar from './components/Common/NavigationBar';
import HostConfigDialog from './components/Common/HostConfigDialog';
import CameraInterface from './components/Camera/CameraInterface';
import DetectionInterface from './components/Detection/DetectionInterface';
import ImageViewer from './components/ImageViewer/ImageViewer';
import { useAppConfig } from './context/AppConfigContext';
import './App.css';

const AppContent = () => {
  const { config, updateConfig } = useAppConfig();
  const [currentPage, setCurrentPage] = useState('camera');
  const [hostDialogOpen, setHostDialogOpen] = useState(false);

  const handleHostSave = (newConfig) => {
    updateConfig(newConfig);
  };

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
      <AppConfigProvider>
        <AppContent />
      </AppConfigProvider>
    </ThemeProvider>
  );
};

export default App;