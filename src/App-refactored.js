import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { muiTheme } from './theme';
import { AppConfigProvider } from './context/AppConfigContext';
import NavigationBar from './components/Common/NavigationBar';
import HostConfigDialog from './components/Common/HostConfigDialog';
import CameraInterface from './CameraInterface'; // 暫時保留舊的
import DetectionInterface from './components/Detection/DetectionInterface';
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
        {renderCurrentPage()}
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