import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraApiService, CAMERA_DEFAULTS } from '../services/cameraService';

export const useCameraConnection = (cameraHost) => {
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [lastError, setLastError] = useState(null);
  const apiServiceRef = useRef(null);

  // Initialize API service
  useEffect(() => {
    if (cameraHost) {
      apiServiceRef.current = new CameraApiService(cameraHost);
    }
  }, [cameraHost]);

  const testConnection = useCallback(async () => {
    if (!apiServiceRef.current) return;

    setConnectionStatus('unknown');
    const result = await apiServiceRef.current.testConnection();
    
    if (result.success) {
      setConnectionStatus('connected');
      setLastError(null);
    } else {
      setConnectionStatus('disconnected');
      setLastError(result.error);
    }
    
    return result;
  }, []);

  const updateConfig = useCallback(async (key, value) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.updateConfig(key, value);
    
    if (result.success) {
      setConnectionStatus('connected');
      setLastError(null);
    } else {
      setConnectionStatus('disconnected');
      setLastError(result.error);
    }
    
    return result;
  }, []);

  return {
    connectionStatus,
    lastError,
    testConnection,
    updateConfig,
    apiService: apiServiceRef.current
  };
};

export const useCameraSettings = (apiService) => {
  const [cameraSettings, setCameraSettings] = useState(CAMERA_DEFAULTS);

  const initializeCameraSettings = useCallback(async () => {
    if (!apiService) return { success: false, error: 'API service not available' };

    const result = await apiService.initializeCameraSettings();
    
    if (result.success) {
      setCameraSettings(result.settings);
    }
    
    return result;
  }, [apiService]);

  const updateSetting = useCallback((key, value) => {
    setCameraSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return {
    cameraSettings,
    setCameraSettings,
    updateSetting,
    initializeCameraSettings
  };
};

export const useCameraStream = (streamHost) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [stillImageUrl, setStillImageUrl] = useState('');
  const [showStillImage, setShowStillImage] = useState(false);

  useEffect(() => {
    setStreamUrl(streamHost);
  }, [streamHost]);

  const toggleStream = useCallback(() => {
    setIsStreaming(prev => !prev);
  }, []);

  const captureStill = useCallback((cameraHost) => {
    if (cameraHost) {
      const apiService = new CameraApiService(cameraHost);
      setStillImageUrl(apiService.getCaptureUrl());
      setShowStillImage(true);
    }
  }, []);

  const clearStillImage = useCallback(() => {
    setShowStillImage(false);
    setStillImageUrl('');
  }, []);

  return {
    isStreaming,
    streamUrl,
    stillImageUrl,
    showStillImage,
    toggleStream,
    captureStill,
    clearStillImage
  };
};