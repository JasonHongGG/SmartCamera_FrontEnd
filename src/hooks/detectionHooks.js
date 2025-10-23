import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { usePolling, useAsyncOperation } from './commonHooks';
import DetectionApiService from '../services/detectionService';

/**
 * 運動檢測 Hook
 */
export const useMotionDetection = (detectionHost, isExpanded = false) => {
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

  // API 輪詢 - 只在展開時輪詢
  const { data: motionData } = usePolling(
    () => apiService.getMotionInfo(),
    1000,
    isExpanded  // 只在展開時輪詢
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (motionData) {
      const data = motionData;
      setState(prev => {
        const hasEnabledChange = prev.enabled !== (data.enabled ?? prev.enabled);
        const hasLastDetectionChange = prev.lastDetection !== (data.lastDetection || prev.lastDetection);
        
        if (!hasEnabledChange && !hasLastDetectionChange) return prev;
        
        const newEnabled = data.enabled ?? prev.enabled;
        
        return {
          ...prev,
          enabled: newEnabled,
          lastDetection: data.lastDetection || prev.lastDetection,
          status: newEnabled ? 'Active - Monitoring' : 'Disabled'
        };
      });
    }
  }, [motionData]);

  // 當展開狀態變化時，更新 streaming 狀態
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      streaming: isExpanded
    }));
  }, [isExpanded]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive'
    }));

    try {
      const result = await executeAsync(() => apiService.toggleMotionDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Monitoring' : 'Inactive'
        }));
      }
    } catch (error) {
      console.error('Failed to toggle motion detection:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.enabled, executeAsync]);

  const setSensitivity = useCallback(async (sensitivity, customValues = null) => {
    console.log('setSensitivity called with:', { sensitivity, customValues });
    
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

    console.log('Calculated thresholds:', { motionThreshold, alarmThreshold });

    try {
      const result = await executeAsync(() => 
        apiService.setMotionSensitivity(motionThreshold, alarmThreshold)
      );
      
      console.log('API result:', result);
      
      if (result.success) {
        const newSensitivity = customValues ? 'custom' : sensitivity;
        console.log('Updating state with sensitivity:', newSensitivity);
        
        setState(prev => ({
          ...prev,
          sensitivity: newSensitivity
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeAsync]);

  // 更新 API 服務的主機地址，並重新同步狀態
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
    
    // 初始化或 host 變更時，同步當前狀態
    const syncInitialState = async () => {
      try {
        const result = await apiService.getMotionInfo();
        if (result.success && result.data) {
          const data = result.data;
          setState(prev => ({
            ...prev,
            enabled: data.enabled ?? prev.enabled,
            lastDetection: data.lastDetection || prev.lastDetection,
            status: data.enabled ? 'Active - Monitoring' : 'Disabled'
          }));
        }
      } catch (error) {
        console.error('Failed to sync initial motion detection state:', error);
      }
    };
    
    syncInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
export const useFaceDetection = (detectionHost, isExpanded = false) => {
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

  // API 輪詢 - 只在展開時輪詢
  const { data: faceData } = usePolling(
    () => apiService.getFaceInfo(),
    1000,
    isExpanded  // 只在展開時輪詢
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (faceData) {
      const data = faceData;
      setState(prev => {
        const hasEnabledChange = prev.enabled !== (data.enabled ?? prev.enabled);
        const hasFaceCountChange = prev.faceCount !== (data.faceCount || 0);
        const hasFaceNamesChange = prev.faceNames !== (data.faceNames || prev.faceNames);
        
        if (!hasEnabledChange && !hasFaceCountChange && !hasFaceNamesChange) return prev;
        
        const newEnabled = data.enabled ?? prev.enabled;
        
        return {
          ...prev,
          enabled: newEnabled,
          faceCount: data.faceCount || 0,
          faceNames: data.faceNames || prev.faceNames,
          lastDetection: data.faceCount > 0 ? data.lastDetection : prev.lastDetection,
          status: newEnabled ? 
            (data.faceCount > 0 ? `Active - ${data.faceCount} Face(s) Detected` : 'Active - Scanning') : 
            'Disabled'
        };
      });
    }
  }, [faceData]);

  // 當展開狀態變化時，更新 streaming 狀態
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      streaming: isExpanded
    }));
  }, [isExpanded]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      faceCount: newEnabled ? prev.faceCount : 0
    }));

    try {
      const result = await executeAsync(() => apiService.toggleFaceDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Scanning' : 'Inactive'
        }));
      }
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.enabled, executeAsync]);

  // 更新 API 服務的主機地址，並重新同步狀態
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
    
    // 初始化或 host 變更時，同步當前狀態
    const syncInitialState = async () => {
      try {
        const result = await apiService.getFaceInfo();
        if (result.success && result.data) {
          const data = result.data;
          setState(prev => ({
            ...prev,
            enabled: data.enabled ?? prev.enabled,
            faceCount: data.faceCount || 0,
            faceNames: data.faceNames || prev.faceNames,
            lastDetection: data.faceCount > 0 ? data.lastDetection : prev.lastDetection,
            status: data.enabled ? 
              (data.faceCount > 0 ? `Active - ${data.faceCount} Face(s) Detected` : 'Active - Scanning') : 
              'Disabled'
          }));
        }
      } catch (error) {
        console.error('Failed to sync initial face detection state:', error);
      }
    };
    
    syncInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectionHost]);

  return {
    state,
    toggleDetection
  };
};

/**
 * 跨線檢測 Hook
 */
export const useCrosslineDetection = (detectionHost, isExpanded = false) => {
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

  // API 輪詢 - 只在展開時輪詢
  const { data: crosslineData } = usePolling(
    () => apiService.getCrosslineInfo(),
    1000,
    isExpanded  // 只在展開時輪詢
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (crosslineData) {
      const data = crosslineData;
      setState(prev => {
        const hasEnabledChange = prev.enabled !== (data.enabled ?? prev.enabled);
        const hasCrossingEventChange = prev.crossingEvent !== (data.crossingEvent || prev.crossingEvent);
        const hasLastDetectionChange = prev.lastDetection !== (data.lastDetection || prev.lastDetection);
        
        if (!hasEnabledChange && !hasCrossingEventChange && !hasLastDetectionChange) return prev;
        
        const newEnabled = data.enabled ?? prev.enabled;
        
        return {
          ...prev,
          enabled: newEnabled,
          crossingEvent: data.crossingEvent || prev.crossingEvent,
          lastDetection: data.lastDetection || prev.lastDetection,
          status: newEnabled ? 'Active - Monitoring' : 'Disabled'
        };
      });
    }
  }, [crosslineData]);

  // 當展開狀態變化時，更新 streaming 狀態
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      streaming: isExpanded
    }));
  }, [isExpanded]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Disabled',
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
          status: !newEnabled ? 'Active - Monitoring' : 'Disabled'
        }));
      }
    } catch (error) {
      console.error('Failed to toggle crossline detection:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 更新 API 服務的主機地址，並重新同步狀態
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
    
    // 初始化或 host 變更時，同步當前狀態
    const syncInitialState = async () => {
      try {
        const result = await apiService.getCrosslineInfo();
        if (result.success && result.data) {
          const data = result.data;
          setState(prev => ({
            ...prev,
            enabled: data.enabled ?? prev.enabled,
            crossingEvent: data.crossingEvent || prev.crossingEvent,
            lastDetection: data.lastDetection || prev.lastDetection,
            status: data.enabled ? 'Active - Monitoring' : 'Disabled'
          }));
        }
      } catch (error) {
        console.error('Failed to sync initial crossline detection state:', error);
      }
    };
    
    syncInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/**
 * Pipeline 檢測 Hook
 */
export const usePipelineDetection = (detectionHost, isExpanded = false) => {
  const apiService = useRef(new DetectionApiService(detectionHost)).current;
  const { execute: executeAsync } = useAsyncOperation();
  
  const [state, setState] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    personCount: 0,
    personNames: "",
    lastDetection: null,
    personInRoom: "",
    lines: [],
    isDragging: false,
    dragTarget: null,
    hoveredPoint: null
  });

  const [realImageLines, setRealImageLines] = useState([]);
  const [liveCoordinates, setLiveCoordinates] = useState(null);
  const [realImageSize, setRealImageSize] = useState({ width: 640, height: 480 });
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 640, height: 480 });
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  // API 輪詢 - 只在展開時輪詢
  const { data: pipelineData } = usePolling(
    () => apiService.getPipelineInfo(),
    1000,
    isExpanded  // 只在展開時輪詢
  );

  // 更新狀態當收到新數據時
  React.useEffect(() => {
    if (pipelineData) {
      const data = pipelineData;
      setState(prev => {
        const hasEnabledChange = prev.enabled !== (data.enabled ?? prev.enabled);
        const hasPersonCountChange = prev.personCount !== (data.personCount || 0);
        const hasPersonNamesChange = prev.personNames !== (data.personNames || prev.personNames);
        const hasPersonInRoomChange = prev.personInRoom !== (data.personInRoom ?? prev.personInRoom);

        if (!hasEnabledChange && !hasPersonCountChange && !hasPersonNamesChange && !hasPersonInRoomChange) return prev;

        const newEnabled = data.enabled ?? prev.enabled;
        
        return {
          ...prev,
          enabled: newEnabled,
          personCount: data.personCount || 0,
          personNames: data.personNames || prev.personNames,
          personInRoom: data.personInRoom ?? prev.personInRoom,
          lastDetection: data.personCount > 0 ? data.lastDetection : prev.lastDetection,
          status: newEnabled ? 
            (data.personCount > 0 ? `Active - ${data.personCount} Person(s) Detected` : 'Active - Scanning') : 
            'Disabled'
        };
      });
    }
  }, [pipelineData]);

  // 當展開狀態變化時，更新 streaming 狀態
  React.useEffect(() => {
    setState(prev => ({
      ...prev,
      streaming: isExpanded
    }));
  }, [isExpanded]);

  const toggleDetection = useCallback(async () => {
    const newEnabled = !state.enabled;
    setState(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Disabled',
      personCount: newEnabled ? prev.personCount : 0,
      personInRoom: newEnabled ? prev.personInRoom : ''
    }));

    try {
      const result = await executeAsync(() => apiService.togglePipelineDetection(newEnabled));
      if (!result.success) {
        // 回滾狀態
        setState(prev => ({
          ...prev,
          enabled: !newEnabled,
          status: !newEnabled ? 'Active - Scanning' : 'Disabled'
        }));
      }
    } catch (error) {
      console.error('Failed to toggle pipeline detection:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.enabled, executeAsync]);

  const syncLinesToServer = useCallback(async (lines) => {
    try {
      const result = await apiService.syncLinesToServer(lines, realImageSize.width, realImageSize.height, 'pipeline');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 更新 API 服務的主機地址，並重新同步狀態
  React.useEffect(() => {
    apiService.updateBaseHost(detectionHost);
    
    // 初始化或 host 變更時，同步當前狀態
    const syncInitialState = async () => {
      try {
        const result = await apiService.getPipelineInfo();
        if (result.success && result.data) {
          const data = result.data;
          setState(prev => ({
            ...prev,
            enabled: data.enabled ?? prev.enabled,
            personCount: data.personCount || 0,
            personNames: data.personNames || prev.personNames,
            lastDetection: data.personCount > 0 ? data.lastDetection : prev.lastDetection,
            personInRoom: data.personInRoom || prev.personInRoom,
            status: data.enabled ? 
              (data.personCount > 0 ? `Active - ${data.personCount} Person(s) Detected` : 'Active - Scanning') : 
              'Disabled'
          }));
        }
      } catch (error) {
        console.error('Failed to sync initial pipeline detection state:', error);
      }
    };
    
    syncInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
