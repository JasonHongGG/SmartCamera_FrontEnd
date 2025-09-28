import React, { useState, useCallback, useEffect } from 'react';
import { Settings, Camera, Monitor } from 'lucide-react';
import { useCameraConnection, useCameraSettings, useCameraStream } from '../../hooks/cameraHooks';
import ConnectionStatus from './ConnectionStatus';
import StreamViewer from './StreamViewer';
import { BasicControls, ImageSettings, LEDControls } from './CameraControls';
import { 
  WhiteBalanceControls, 
  ExposureControls, 
  GainControls, 
  ImageProcessingControls, 
  OrientationControls 
} from './AdvancedControls';

const CameraInterface = ({ 
  baseHost = "http://140.116.6.62:3000", 
  cameraHost, 
  streamHost, 
  detectionHost 
}) => {
  // 使用 cameraHost 如果提供，否則使用 baseHost (向後相容)
  const activeHost = cameraHost || baseHost;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 使用自定義 hooks
  const {
    connectionStatus,
    lastError,
    testConnection,
    updateConfig,
    apiService
  } = useCameraConnection(activeHost);

  const {
    cameraSettings,
    updateSetting,
    initializeCameraSettings
  } = useCameraSettings(apiService);

  const {
    isStreaming,
    streamUrl,
    stillImageUrl,
    showStillImage,
    toggleStream,
    captureStill,
    clearStillImage
  } = useCameraStream(streamHost);

  // 設定變更處理
  const handleSettingChange = useCallback(async (key, value) => {
    console.log("Setting change:", key, "=", value);
    
    // 先更新本地狀態
    updateSetting(key, value);

    if (key === 'led_intensity') {
      // LED 強度變更不立即同步到相機
      return;
    }
    
    // 然後同步到相機
    await updateConfig(key, value);
  }, [updateSetting, updateConfig]);

  // 初始化相機設定
  const handleInitializeSettings = useCallback(async () => {
    await initializeCameraSettings();
  }, [initializeCameraSettings]);

  // 拍攝靜態圖片
  const handleCaptureStill = useCallback(() => {
    captureStill(activeHost);
  }, [captureStill, activeHost]);

  // 設定 LED 強度
  const handleSetLEDIntensity = useCallback(() => {
    updateConfig('led_intensity', cameraSettings.led_intensity);
  }, [updateConfig, cameraSettings.led_intensity]);



  // 初始化：測試連接並同步相機設定
  useEffect(() => {
    const initializeCamera = async () => {
      if (isInitialized || !apiService) return;
      
      console.log('Initializing camera connection...');
      setIsInitialized(true);
      
      const connectionResult = await testConnection();
      
      if (connectionResult.success) {
        console.log('Connection successful, initializing camera settings...');
        await initializeCameraSettings();
      }
    };

    initializeCamera();
  }, [apiService, isInitialized, testConnection, initializeCameraSettings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Connection Status */}
            <ConnectionStatus
              connectionStatus={connectionStatus}
              lastError={lastError}
              activeHost={activeHost}
              onTestConnection={testConnection}
              onInitializeSettings={handleInitializeSettings}
            />

            {/* Basic Controls */}
            <BasicControls 
              cameraSettings={cameraSettings}
              onSettingChange={handleSettingChange}
            />

            {/* Image Settings */}
            <ImageSettings 
              cameraSettings={cameraSettings}
              onSettingChange={handleSettingChange}
            />

            {/* LED Controls */}
            <LEDControls 
              cameraSettings={cameraSettings}
              onSettingChange={handleSettingChange}
              onSetLEDIntensity={handleSetLEDIntensity}
            />

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleCaptureStill}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Capture Still</span>
              </button>
              <button
                onClick={toggleStream}
                className={`w-full ${isStreaming ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-red-500/25' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg hover:shadow-emerald-500/25'} text-white py-3 sm:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200`}
              >
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isStreaming ? 'Stop Stream' : 'Start Stream'}</span>
              </button>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-2 sm:p-6 bg-slate-700/50 hover:bg-slate-700/70 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium text-base">Advanced Settings</span>
                </div>
                <div className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <WhiteBalanceControls 
                  cameraSettings={cameraSettings}
                  onSettingChange={handleSettingChange}
                />
                <ExposureControls 
                  cameraSettings={cameraSettings}
                  onSettingChange={handleSettingChange}
                />
                <GainControls 
                  cameraSettings={cameraSettings}
                  onSettingChange={handleSettingChange}
                />
                <ImageProcessingControls 
                  cameraSettings={cameraSettings}
                  onSettingChange={handleSettingChange}
                />
                <OrientationControls 
                  cameraSettings={cameraSettings}
                  onSettingChange={handleSettingChange}
                />
              </div>
            )}
          </div>

          {/* Stream Display Area */}
          <StreamViewer
            isStreaming={isStreaming}
            streamUrl={streamUrl}
            stillImageUrl={stillImageUrl}
            showStillImage={showStillImage}
            onClearStillImage={clearStillImage}
          />
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;