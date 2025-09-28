import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { usePolling, useAsyncOperation } from './commonHooks';
import DetectionApiService from '../services/detectionApi';

/**
 * 運動檢測 Hook
 */
export const useMotionDetection = (detectionHost) => {
  const apiService = useRef(new DetectionApiService(detectionHost)).current;
  const { execute: executeAsync } = useAsyncOperation();
  
  const [state, setState] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    lastDetection: null,
    sensitivity: 'medium'
  });

  const [customSensitivity, setCustomSensitivity] = useState({
    motionThreshold: 10000,
    alarmThreshold: 20
  });

  // API 輪詢
  const { data: motionData } = usePolling(
    () => apiService.getMotionInfo(),
    1000,
    state.enabled
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (motionData) {
      setState(prev => {
        const hasChange = prev.lastDetection !== motionData.lastDetection;
        if (!hasChange) return prev;
        
        return {
          ...prev,
          lastDetection: motionData.lastDetection || prev.lastDetection,
          status: prev.enabled ? 'Active - Monitoring' : 'Inactive'
        };
      });
    }
  }, [motionData]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      streaming: newEnabled
    }));

    try {
      const result = await executeAsync(() => apiService.toggleMotionDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Monitoring' : 'Inactive',
          streaming: !newEnabled
        }));
      }
    } catch (error) {
      console.error('Failed to toggle motion detection:', error);
    }
  }, [state.enabled, executeAsync]);

  const setSensitivity = useCallback(async (sensitivity, customValues = null) => {
    let motionThreshold = 10000;
    let alarmThreshold = 20;
    
    if (customValues) {
      motionThreshold = customValues.motionThreshold;
      alarmThreshold = customValues.alarmThreshold;
    } else {
      const sensitivityMap = {
        low: { motionThreshold: 8000, alarmThreshold: 10 },
        medium: { motionThreshold: 10000, alarmThreshold: 20 },
        high: { motionThreshold: 15000, alarmThreshold: 40 }
      };
      
      const config = sensitivityMap[sensitivity];
      if (config) {
        motionThreshold = config.motionThreshold;
        alarmThreshold = config.alarmThreshold;
      }
    }

    try {
      const result = await executeAsync(() => 
        apiService.setMotionSensitivity(motionThreshold, alarmThreshold)
      );
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          sensitivity: customValues ? 'custom' : sensitivity
        }));
        
        if (customValues) {
          setCustomSensitivity(customValues);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error setting motion sensitivity:', error);
      throw error;
    }
  }, [executeAsync]);

  // 更新 API 服務的主機地址
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
  }, [detectionHost]);

  return {
    state,
    customSensitivity,
    toggleDetection,
    setSensitivity,
    setCustomSensitivity
  };
};

/**
 * 臉部檢測 Hook
 */
export const useFaceDetection = (detectionHost) => {
  const apiService = useRef(new DetectionApiService(detectionHost)).current;
  const { execute: executeAsync } = useAsyncOperation();
  
  const [state, setState] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    faceCount: 0,
    faceNames: "",
    lastDetection: null
  });

  // API 輪詢
  const { data: faceData } = usePolling(
    () => apiService.getFaceInfo(),
    1000,
    state.enabled
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (faceData) {
      setState(prev => {
        const hasFaceCountChange = prev.faceCount !== (faceData.faceCount || 0);
        const hasFaceNamesChange = prev.faceNames !== (faceData.faceNames || prev.faceNames);
        
        if (!hasFaceCountChange && !hasFaceNamesChange) return prev;
        
        return {
          ...prev,
          faceCount: faceData.faceCount || 0,
          faceNames: faceData.faceNames || prev.faceNames,
          lastDetection: faceData.faceCount > 0 ? faceData.lastDetection : prev.lastDetection,
          status: prev.enabled ? 
            (faceData.faceCount > 0 ? `Active - ${faceData.faceCount} Face(s) Detected` : 'Active - Scanning') : 
            'Inactive'
        };
      });
    }
  }, [faceData]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      streaming: newEnabled,
      faceCount: newEnabled ? prev.faceCount : 0
    }));

    try {
      const result = await executeAsync(() => apiService.toggleFaceDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Scanning' : 'Inactive',
          streaming: !newEnabled
        }));
      }
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
    }
  }, [state.enabled, executeAsync]);

  // 更新 API 服務的主機地址
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
  }, [detectionHost]);

  return {
    state,
    toggleDetection
  };
};

/**
 * 跨線檢測 Hook
 */
export const useCrosslineDetection = (detectionHost) => {
  const apiService = useRef(new DetectionApiService(detectionHost)).current;
  const { execute: executeAsync } = useAsyncOperation();
  
  const [state, setState] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    lines: [],
    crossingEvent: "",
    lastDetection: "No recent activity",
    isDragging: false,
    dragTarget: null,
    hoveredPoint: null
  });

  const [realImageLines, setRealImageLines] = useState([]);
  const [liveCoordinates, setLiveCoordinates] = useState(null);
  const [realImageSize, setRealImageSize] = useState({ width: 640, height: 480 });
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 640, height: 480 });
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  // API 輪詢
  const { data: crosslineData } = usePolling(
    () => apiService.getCrosslineInfo(),
    1000,
    state.enabled
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (crosslineData) {
      setState(prev => {
        const hasCrossingEventChange = prev.crossingEvent !== (crosslineData.crossingEvent || prev.crossingEvent);
        const hasLastDetectionChange = prev.lastDetection !== (crosslineData.lastDetection || prev.lastDetection);
        
        if (!hasCrossingEventChange && !hasLastDetectionChange) return prev;
        
        return {
          ...prev,
          crossingEvent: crosslineData.crossingEvent || prev.crossingEvent,
          lastDetection: crosslineData.lastDetection || prev.lastDetection,
          status: prev.enabled ? 'Active - Monitoring' : 'Inactive'
        };
      });
    }
  }, [crosslineData]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      streaming: newEnabled,
      isDrawing: newEnabled ? prev.isDrawing : false,
      currentLine: newEnabled ? prev.currentLine : null
    }));

    try {
      const result = await executeAsync(() => apiService.toggleCrosslineDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Monitoring' : 'Inactive',
          streaming: !newEnabled
        }));
      }
    } catch (error) {
      console.error('Failed to toggle crossline detection:', error);
    }
  }, [state.enabled, executeAsync]);

  const syncLinesToServer = useCallback(async (lines) => {
    try {
      const result = await apiService.syncLinesToServer(lines, realImageSize.width, realImageSize.height);
      if (result.success) {
        // 更新歸一化座標記錄
        const normalizedLines = lines.map(line => ({
          startX: line.startX / realImageSize.width,
          startY: line.startY / realImageSize.height,
          endX: line.endX / realImageSize.width,
          endY: line.endY / realImageSize.height,
        }));
        setRealImageLines(normalizedLines);
      }
      return result;
    } catch (error) {
      console.error('Error syncing lines to server:', error);
      return { success: false, error: error.message };
    }
  }, [realImageSize]);

  const addVerticalLine = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!state.enabled) return;
    
    const centerX = canvasSize.width / 2;
    const margin = 20;
    
    const newLine = {
      id: Date.now(),
      startX: centerX,
      startY: margin,
      endX: centerX,
      endY: canvasSize.height - margin,
      color: '#ef4444'
    };

    setState(prev => {
      const updatedLines = [...prev.lines, newLine];
      // 異步同步到 server
      syncLinesToServer(updatedLines);
      return {
        ...prev,
        lines: updatedLines
      };
    });
  }, [state.enabled, canvasSize, syncLinesToServer]);

  const clearLines = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setState(prev => {
      // 同步清空的線段狀態到 server
      syncLinesToServer([]);
      return {
        ...prev,
        lines: [],
      };
    });
  }, [syncLinesToServer]);

  // 更新 API 服務的主機地址
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
  }, [detectionHost]);

  return {
    state,
    setState,
    realImageLines,
    setRealImageLines,
    liveCoordinates,
    setLiveCoordinates,
    realImageSize,
    setRealImageSize,
    displayedImageSize,
    setDisplayedImageSize,
    canvasSize,
    setCanvasSize,
    toggleDetection,
    syncLinesToServer,
    addVerticalLine,
    clearLines
  };
};