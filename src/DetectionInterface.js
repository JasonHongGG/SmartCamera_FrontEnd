import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Settings, Monitor, Activity, Users, GitMerge, Play, Square, Trash2, MousePointer, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Switch,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';

const CameraDetectionInterface = ({ baseHost = "http://localhost:4000", cameraHost, detectionHost }) => {
  // 使用 detectionHost 如果提供，否則使用 baseHost (向後相容)
  const activeHost = detectionHost || baseHost;
  // Detection states
  const [motionDetection, setMotionDetection] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    lastDetection: null,
    sensitivity: 'medium' // 新增敏感度設定: 'low', 'medium', 'high'
  });

  // 自定義設定狀態
  const [customSensitivity, setCustomSensitivity] = useState({
    motionThreshold: 10000,
    alarmThreshold: 20
  });

  const [faceDetection, setFaceDetection] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    faceCount: 0,
    faceNames: "",
    lastDetection: null
  });

  const [crosslineDetection, setCrosslineDetection] = useState({
    enabled: false,
    streaming: false,
    status: 'Inactive',
    lines: [],
    crossingEvent: "",
    lastDetection: "No recent activity",
    isDragging: false,
    dragTarget: null, // { lineId, point: 'start' | 'end' }
    hoveredPoint: null // { lineId, point: 'start' | 'end' }
  });

  // 控制 Interactive Line Editing 區塊的顯示/隱藏
  const [isLineEditingExpanded, setIsLineEditingExpanded] = useState(false);

  // 儲存真實圖片座標的線段資料
  const [realImageLines, setRealImageLines] = useState([]);

  // 即時座標追蹤（拖拽時顯示）
  const [liveCoordinates, setLiveCoordinates] = useState(null);

  // 真實圖片尺寸（用於計算真實像素座標）
  const [realImageSize, setRealImageSize] = useState({ width: 640, height: 480 });

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const faceInfoIntervalRef = useRef(null); // 新增：用於儲存face info定時器的引用
  const motionInfoIntervalRef = useRef(null); // 新增：用於儲存motion info定時器的引用
  const crosslineInfoIntervalRef = useRef(null); // 新增：用於儲存crossline info定時器的引用
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
  
  // 圖片在瀏覽器中的實際顯示尺寸
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 640, height: 480 });

  // 使用 useCallback 來記憶 onLoad 處理器
  const handleImageLoad = useCallback((e) => {
    const naturalWidth = e.target.naturalWidth || 640;
    const naturalHeight = e.target.naturalHeight || 480;
    
    // 獲取圖片在瀏覽器中的實際顯示尺寸
    const displayWidth = e.target.width || e.target.offsetWidth || 640;
    const displayHeight = e.target.height || e.target.offsetHeight || 480;
    
    // 更新 canvas 尺寸為圖片的自然尺寸
    setCanvasSize(prev => {
      if (prev.width !== naturalWidth || prev.height !== naturalHeight) {
        console.log(`Canvas size (natural): ${prev.width}x${prev.height} -> ${naturalWidth}x${naturalHeight}`);
        return { width: naturalWidth, height: naturalHeight };
      }
      return prev;
    });
    
    // 更新真實圖片尺寸為圖片的自然尺寸
    setRealImageSize(prev => {
      if (prev.width !== naturalWidth || prev.height !== naturalHeight) {
        console.log(`Real image size: ${naturalWidth}x${naturalHeight}`);
        return { width: naturalWidth, height: naturalHeight };
      }
      return prev;
    });
    
    // 更新顯示尺寸為圖片在瀏覽器中的實際尺寸
    setDisplayedImageSize(prev => {
      if (prev.width !== displayWidth || prev.height !== displayHeight) {
        console.log(`Displayed image size: ${displayWidth}x${displayHeight}`);
        return { width: displayWidth, height: displayHeight };
      }
      return prev;
    });
  }, []);

  // 計算圖片在 canvas 中的偏移量和縮放比例
  const getImageTransformation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
    
    const canvasRect = canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    
    // 計算圖片在 canvas 中的實際顯示尺寸（保持比例）
    const imageAspectRatio = displayedImageSize.width / displayedImageSize.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageAspectRatio > canvasAspectRatio) {
      // 圖片比較寬，以寬度為準
      displayWidth = canvasWidth;
      displayHeight = canvasWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (canvasHeight - displayHeight) / 2;
    } else {
      // 圖片比較高，以高度為準
      displayWidth = canvasHeight * imageAspectRatio;
      displayHeight = canvasHeight;
      offsetX = (canvasWidth - displayWidth) / 2;
      offsetY = 0;
    }
    
    return {
      offsetX,
      offsetY,
      scaleX: displayWidth / realImageSize.width,
      scaleY: displayHeight / realImageSize.height,
      displayWidth,
      displayHeight
    };
  }, [displayedImageSize, realImageSize]);

  // 同步真實圖片座標並發送到 server
  const syncLinesToServer = useCallback(async (lines) => {
    try {
      // 直接使用 Real Image 座標 (已經是實際像素座標)
      const realImageLines = lines.map(line => ({
        id: line.id,
        startX: Math.round(line.startX),   // Real Image X 座標 (像素)
        startY: Math.round(line.startY),   // Real Image Y 座標 (像素)
        endX: Math.round(line.endX),       // Real Image X 座標 (像素)
        endY: Math.round(line.endY),       // Real Image Y 座標 (像素)
        color: line.color
      }));

      // 如果需要歸一化座標 (0-1)，可以這樣做：
      const normalizedLines = lines.map(line => ({
        // id: line.id,
        startX: line.startX / realImageSize.width,   // 歸一化 X 座標 (0-1)
        startY: line.startY / realImageSize.height,  // 歸一化 Y 座標 (0-1)
        endX: line.endX / realImageSize.width,       // 歸一化 X 座標 (0-1)
        endY: line.endY / realImageSize.height,      // 歸一化 Y 座標 (0-1)
        // color: line.color
      }));

      // 更新本地的歸一化座標記錄
      setRealImageLines(normalizedLines);

      // 發送到 Flask server - 使用 Real Image 像素座標
      const response = await fetch(`${activeHost}/crossline/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lines: realImageLines,  // 使用實際像素座標
          image_width: realImageSize.width,   // 真實圖片寬度
          image_height: realImageSize.height  // 真實圖片高度
        })
      });

      if (response.ok) {
        console.log('Lines synced to server successfully:', realImageLines);
        console.log('Image dimensions:', { width: realImageSize.width, height: realImageSize.height });
      } else {
        console.error('Failed to sync lines to server:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing lines to server:', error);
    }
  }, [activeHost, realImageSize]);

  // 新增垂直線的函數
  const addVerticalLine = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!crosslineDetection.enabled) return;
    
    const centerX = canvasSize.width / 2;
    const margin = 20; // 距離邊界的間距
    
    const newLine = {
      id: Date.now(),
      startX: centerX,
      startY: margin,
      endX: centerX,
      endY: canvasSize.height - margin,
      color: '#ef4444'
    };

    setCrosslineDetection(prev => {
      const updatedLines = [...prev.lines, newLine];
      // 異步同步到 server
      syncLinesToServer(updatedLines);
      return {
        ...prev,
        lines: updatedLines
      };
    });
  };

  // 檢查滑鼠是否在端點附近
  const getPointAtPosition = (x, y) => {
    const tolerance = 15; // 端點檢測範圍
    
    for (const line of crosslineDetection.lines) {
      // 檢查起始點
      const startDist = Math.sqrt(Math.pow(x - line.startX, 2) + Math.pow(y - line.startY, 2));
      if (startDist <= tolerance) {
        return { lineId: line.id, point: 'start' };
      }
      
      // 檢查結束點
      const endDist = Math.sqrt(Math.pow(x - line.endX, 2) + Math.pow(y - line.endY, 2));
      if (endDist <= tolerance) {
        return { lineId: line.id, point: 'end' };
      }
    }
    return null;
  };

  // Canvas 滑鼠事件處理
  const handleCanvasMouseDown = (e) => {
    if (!crosslineDetection.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const transformation = getImageTransformation();
    
    // 獲取 canvas 座標
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // 轉換為圖片座標
    const imageX = (canvasX - transformation.offsetX) / transformation.scaleX;
    const imageY = (canvasY - transformation.offsetY) / transformation.scaleY;
    
    // 檢查是否在圖片範圍內
    if (imageX < 0 || imageX > realImageSize.width || imageY < 0 || imageY > realImageSize.height) {
      return;
    }

    const pointAt = getPointAtPosition(imageX, imageY);
    
    if (pointAt) {
      setCrosslineDetection(prev => ({
        ...prev,
        isDragging: true,
        dragTarget: pointAt
      }));
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!crosslineDetection.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const transformation = getImageTransformation();
    
    // 獲取 canvas 座標
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // 轉換為圖片座標
    const imageX = (canvasX - transformation.offsetX) / transformation.scaleX;
    const imageY = (canvasY - transformation.offsetY) / transformation.scaleY;
    
    // 檢查是否在圖片範圍內
    if (imageX < 0 || imageX > realImageSize.width || imageY < 0 || imageY > realImageSize.height) {
      if (crosslineDetection.isDragging) {
        // 如果正在拖拽但超出範圍，限制在邊界內
        const clampedX = Math.max(0, Math.min(realImageSize.width, imageX));
        const clampedY = Math.max(0, Math.min(realImageSize.height, imageY));
        updateDragPosition(clampedX, clampedY);
      }
      return;
    }

    if (crosslineDetection.isDragging && crosslineDetection.dragTarget) {
      updateDragPosition(imageX, imageY);
    } else {
      // 清除實時座標顯示（非拖拽狀態）
      setLiveCoordinates(null);
      
      // 檢查 hover 狀態
      const pointAt = getPointAtPosition(imageX, imageY);
      setCrosslineDetection(prev => ({
        ...prev,
        hoveredPoint: pointAt
      }));
    }
  };
  
  // 輔助函數：更新拖拽位置
  const updateDragPosition = (imageX, imageY) => {
    const { lineId, point } = crosslineDetection.dragTarget;
    
    // 更新實時座標顯示
    const transformation = getImageTransformation();
    const displayX = Math.round(imageX * transformation.scaleX + transformation.offsetX);
    const displayY = Math.round(imageY * transformation.scaleY + transformation.offsetY);
    
    setLiveCoordinates({
      type: 'dragging',
      lineId,
      point,
      canvasX: Math.round(imageX),
      canvasY: Math.round(imageY),
      displayX,
      displayY
    });
    
    setCrosslineDetection(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          if (point === 'start') {
            return { ...line, startX: imageX, startY: imageY };
          } else {
            return { ...line, endX: imageX, endY: imageY };
          }
        }
        return line;
      })
    }));
  };

  const handleCanvasMouseUp = (e) => {
    if (!crosslineDetection.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    // 清除實時座標顯示
    setLiveCoordinates(null);
    
    // 如果正在拖拽，結束拖拽並同步到 server
    if (crosslineDetection.isDragging) {
      setCrosslineDetection(prev => {
        // 同步當前線段狀態到 server
        syncLinesToServer(prev.lines);
        return {
          ...prev,
          isDragging: false,
          dragTarget: null
        };
      });
    } else {
      setCrosslineDetection(prev => ({
        ...prev,
        isDragging: false,
        dragTarget: null
      }));
    }
  };

  // 立即重繪函數 - 高清晰度紅色端點樣式
  const drawLinesImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const transformation = getImageTransformation();
    
    // 獲取畫布的顯示尺寸
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // 設置實際畫布尺寸（考慮設備像素比）
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // 縮放上下文以匹配設備像素比
    ctx.scale(dpr, dpr);
    
    // 設置畫布 CSS 尺寸
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // 啟用抗鋸齒和高品質渲染
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 清除畫布
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // 繪製線段
    crosslineDetection.lines.forEach(line => {
      const isStartHovered = crosslineDetection.hoveredPoint?.lineId === line.id && 
                            crosslineDetection.hoveredPoint?.point === 'start';
      const isEndHovered = crosslineDetection.hoveredPoint?.lineId === line.id && 
                          crosslineDetection.hoveredPoint?.point === 'end';
      const isStartDragging = crosslineDetection.dragTarget?.lineId === line.id && 
                             crosslineDetection.dragTarget?.point === 'start';
      const isEndDragging = crosslineDetection.dragTarget?.lineId === line.id && 
                            crosslineDetection.dragTarget?.point === 'end';
      
      // 將圖片座標轉換為 canvas 顯示座標
      const startX = line.startX * transformation.scaleX + transformation.offsetX;
      const startY = line.startY * transformation.scaleY + transformation.offsetY;
      const endX = line.endX * transformation.scaleX + transformation.offsetX;
      const endY = line.endY * transformation.scaleY + transformation.offsetY;
      
      // 繪製線段 - 始終保持紅色
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 繪製起始端點 - 無外框
      const startRadius = isStartHovered || isStartDragging ? 10 : 8;
      const startColor = isStartDragging ? '#fbbf24' : (isStartHovered ? '#f59e0b' : '#ef4444');
      
      ctx.beginPath();
      ctx.arc(startX, startY, startRadius, 0, 2 * Math.PI);
      ctx.fillStyle = startColor;
      ctx.fill();
      
      // 繪製結束端點 - 無外框
      const endRadius = isEndHovered || isEndDragging ? 10 : 8;
      const endColor = isEndDragging ? '#fbbf24' : (isEndHovered ? '#f59e0b' : '#ef4444');
      
      ctx.beginPath();
      ctx.arc(endX, endY, endRadius, 0, 2 * Math.PI);
      ctx.fillStyle = endColor;
      ctx.fill();
    });
  }, [crosslineDetection, getImageTransformation]);

  // Draw lines on canvas
  const drawLines = useCallback(() => {
    // 取消之前的動畫框架請求
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // 安排新的重繪
    animationFrameRef.current = requestAnimationFrame(() => {
      drawLinesImmediate();
      animationFrameRef.current = null;
    });
  }, [drawLinesImmediate]);

  // 統一的重繪機制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawLines();
    }
  }, [drawLines, canvasSize]);

  // 清理動畫框架和定時器
  useEffect(() => {
    // 防止意外滾動的保護
    const preventScrollJump = (e) => {
      // 如果是鍵盤事件可能導致滾動，阻止它
      if (e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
        const activeElement = document.activeElement;
        // 只有當焦點不在輸入框時才阻止
        if (activeElement && !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', preventScrollJump);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 清理face info定時器
      if (faceInfoIntervalRef.current) {
        clearInterval(faceInfoIntervalRef.current);
      }
      // 清理motion info定時器
      if (motionInfoIntervalRef.current) {
        clearInterval(motionInfoIntervalRef.current);
      }
      // 清理crossline info定時器
      if (crosslineInfoIntervalRef.current) {
        clearInterval(crosslineInfoIntervalRef.current);
      }
      document.removeEventListener('keydown', preventScrollJump);
    };
  }, []);

  // Control functions
  // 獲取運動檢測資訊的函數
  const fetchMotionInfo = useCallback(async () => {
    try {
      const response = await fetch(`${activeHost}/motion/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const motionInfo = await response.json();

        console.log("!!!!!!!!!!!!!!!", motionInfo);

        // 使用 setMotionDetection 的回調形式來獲取最新狀態
        setMotionDetection(prev => {
          // 在這裡比較最新的狀態值
          if (prev.lastDetection === motionInfo.lastDetection) {
            console.log("lastDetection 沒有變化，跳過更新");
            return prev; // 返回原狀態，不觸發重新渲染
          }

          console.log("lastDetection 有變化，更新狀態", {
            old: prev.lastDetection,
            new: motionInfo.lastDetection
          });

          return {
            ...prev,
            lastDetection: motionInfo.lastDetection || prev.lastDetection,
            status: prev.enabled ? 'Active - Monitoring' : 'Inactive'
          };
        });
        
        console.log('Motion info updated:', motionInfo);
      } else {
        console.warn('Failed to fetch motion info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching motion info:', error);
    }
  }, [activeHost]);

  // 啟動定期獲取運動檢測資訊
  const startMotionInfoPolling = useCallback(() => {
    if (motionInfoIntervalRef.current) {
      clearInterval(motionInfoIntervalRef.current);
    }
    
    // 立即獲取一次
    fetchMotionInfo();
    
    // 每秒獲取一次運動檢測資訊
    motionInfoIntervalRef.current = setInterval(fetchMotionInfo, 1000);
    console.log('Started motion info polling');
  }, [fetchMotionInfo]);

  // 停止定期獲取運動檢測資訊
  const stopMotionInfoPolling = useCallback(() => {
    if (motionInfoIntervalRef.current) {
      clearInterval(motionInfoIntervalRef.current);
      motionInfoIntervalRef.current = null;
      console.log('Stopped motion info polling');
    }
  }, []);

  // 設定運動檢測敏感度
  const setMotionSensitivity = useCallback(async (sensitivity, customValues = null) => {
    try {
      let motionThreshold = 10000; // Default for Medium
      let alarmThreshold = 20;     // Default for Medium
      
      if (customValues) {
        // 使用自定義數值
        motionThreshold = customValues.motionThreshold;
        alarmThreshold = customValues.alarmThreshold;
      } else {
        // 使用預設值
        if (sensitivity === "low") {
          motionThreshold = 8000;
          alarmThreshold = 10;
        }
        else if (sensitivity === "medium") {
          motionThreshold = 10000;
          alarmThreshold = 20;
        }
        else if (sensitivity === "high") {
          motionThreshold = 15000;
          alarmThreshold = 40;
        }
      }

      const response = await fetch(`${activeHost}/motion/sensitivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion_threshold: motionThreshold, alarm_threshold: alarmThreshold})
      });
      
      if (response.ok) {
        setMotionDetection(prev => ({
          ...prev,
          sensitivity: customValues ? 'custom' : sensitivity
        }));
        
        if (customValues) {
          setCustomSensitivity(customValues);
        }
        
        console.log(`Motion sensitivity set to: ${customValues ? 'custom' : sensitivity}`, { motionThreshold, alarmThreshold });
      } else {
        console.error('Failed to set motion sensitivity:', response.statusText);
      }
    } catch (error) {
      console.error('Error setting motion sensitivity:', error);
    }
  }, [activeHost]);

  const toggleMotionDetection = async () => {
    const newEnabled = !motionDetection.enabled;
    setMotionDetection(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      streaming: newEnabled
    }));
    
    // API call to backend
    try {
      await fetch(`${activeHost}/detection/motion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });
      
      if (newEnabled) {
        // 啟動時開始定期獲取motion info
        setTimeout(() => {
          setMotionDetection(prev => ({ ...prev, status: 'Active - Monitoring' }));
          startMotionInfoPolling(); // 開始定期獲取運動檢測資訊
        }, 2000);
      } else {
        // 關閉時停止定期獲取motion info
        stopMotionInfoPolling();
      }
    } catch (error) {
      console.error('Failed to toggle motion detection:', error);
    }
  };

  // 獲取臉部檢測資訊的函數
  const fetchFaceInfo = useCallback(async () => {
    try {
      const response = await fetch(`${activeHost}/face/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const faceInfo = await response.json();

        // 使用 setFaceDetection 的回調形式來獲取最新狀態
        setFaceDetection(prev => {
          // 在這裡比較最新的狀態值
          if (prev.faceCount === faceInfo.faceCount && prev.faceNames === faceInfo.faceNames) {
            console.log("Face info 沒有變化，跳過更新");
            return prev; // 返回原狀態，不觸發重新渲染
          }

          console.log("Face info 有變化，更新狀態", {
            oldCount: prev.faceCount,
            newCount: faceInfo.faceCount,
            oldNames: prev.faceNames,
            newNames: faceInfo.faceNames
          });

          return {
            ...prev,
            faceCount: faceInfo.faceCount || 0,
            faceNames: faceInfo.faceNames || prev.faceNames,
            lastDetection: faceInfo.faceCount > 0 ? faceInfo.lastDetection : prev.lastDetection,
            status: prev.enabled ? (faceInfo.faceCount > 0 ? `Active - ${faceInfo.faceCount} Face(s) Detected` : 'Active - Scanning') : 'Inactive'
          };
        });
        
        console.log('Face info updated:', faceInfo);
      } else {
        console.warn('Failed to fetch face info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching face info:', error);
    }
  }, [activeHost]);

  // 啟動定期獲取臉部資訊
  const startFaceInfoPolling = useCallback(() => {
    if (faceInfoIntervalRef.current) {
      clearInterval(faceInfoIntervalRef.current);
    }
    
    // 立即獲取一次
    fetchFaceInfo();
    
    // 每秒獲取一次臉部資訊
    faceInfoIntervalRef.current = setInterval(fetchFaceInfo, 1000);
    console.log('Started face info polling');
  }, [fetchFaceInfo]);

  // 停止定期獲取臉部資訊
  const stopFaceInfoPolling = useCallback(() => {
    if (faceInfoIntervalRef.current) {
      clearInterval(faceInfoIntervalRef.current);
      faceInfoIntervalRef.current = null;
      console.log('Stopped face info polling');
    }
  }, []);

  // 獲取 Crossline 檢測資訊的函數
  const fetchCrosslineInfo = useCallback(async () => {
    try {
      const response = await fetch(`${activeHost}/crossline/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const crosslineInfo = await response.json();

        // 使用 setCrosslineDetection 的回調形式來獲取最新狀態
        setCrosslineDetection(prev => {
          // 在這裡比較最新的狀態值
          if (prev.crossingEvent === crosslineInfo.crossingEvent && prev.lastDetection === crosslineInfo.lastDetection) {
            console.log("Crossline events 沒有變化，跳過更新");
            return prev; // 返回原狀態，不觸發重新渲染
          }

          return {
            ...prev,
            crossingEvent: crosslineInfo.crossingEvent || prev.crossingEvent,
            lastDetection: crosslineInfo.lastDetection || prev.lastDetection,
            status: prev.enabled ? 'Active - Monitoring' : 'Inactive'
          };
        });
        
        console.log('Crossline info updated:', crosslineInfo);
      } else {
        console.warn('Failed to fetch crossline info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching crossline info:', error);
    }
  }, [activeHost]);

  // 啟動定期獲取 Crossline 資訊
  const startCrosslineInfoPolling = useCallback(() => {
    if (crosslineInfoIntervalRef.current) {
      clearInterval(crosslineInfoIntervalRef.current);
    }
    
    // 立即獲取一次
    fetchCrosslineInfo();
    
    // 每秒獲取一次 Crossline 資訊
    crosslineInfoIntervalRef.current = setInterval(fetchCrosslineInfo, 1000);
    console.log('Started crossline info polling');
  }, [fetchCrosslineInfo]);

  // 停止定期獲取 Crossline 資訊
  const stopCrosslineInfoPolling = useCallback(() => {
    if (crosslineInfoIntervalRef.current) {
      clearInterval(crosslineInfoIntervalRef.current);
      crosslineInfoIntervalRef.current = null;
      console.log('Stopped crossline info polling');
    }
  }, []);

  const toggleFaceDetection = async () => {
    const newEnabled = !faceDetection.enabled;
    setFaceDetection(prev => ({
      ...prev,
      enabled: newEnabled,
      status: newEnabled ? 'Initializing...' : 'Inactive',
      streaming: newEnabled,
      faceCount: newEnabled ? prev.faceCount : 0
    }));
    
    try {
      await fetch(`${activeHost}/detection/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });
      
      if (newEnabled) {
        // 啟動時開始定期獲取face info
        setTimeout(() => {
          setFaceDetection(prev => ({ ...prev, status: 'Active - Scanning' }));
          startFaceInfoPolling(); // 開始定期獲取臉部資訊
        }, 2000);
      } else {
        // 關閉時停止定期獲取face info
        stopFaceInfoPolling();
      }
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
    }
  };

  const toggleCrosslineDetection = async () => {
    const currentEnabled = crosslineDetection.enabled;
    const newEnabled = !currentEnabled;
    
    console.log(`Toggling crossline detection from ${currentEnabled} to ${newEnabled}`);
    
    // 立即更新 UI 狀態
    setCrosslineDetection(prev => {
      console.log(`Previous state: enabled=${prev.enabled}, new state: enabled=${newEnabled}`);
      return {
        ...prev,
        enabled: newEnabled,
        status: newEnabled ? 'Initializing...' : 'Inactive',
        streaming: newEnabled,
        // 如果關閉，清除繪製狀態
        isDrawing: newEnabled ? prev.isDrawing : false,
        currentLine: newEnabled ? prev.currentLine : null
      };
    });
    
    try {
      await fetch(`${activeHost}/detection/crossline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });
      
      if (newEnabled) {
        // 啟動時開始定期獲取crossline info
        setTimeout(() => {
          setCrosslineDetection(prev => ({ ...prev, status: 'Active - Monitoring' }));
          startCrosslineInfoPolling(); // 開始定期獲取 Crossline 資訊
        }, 2000);
      } else {
        // 關閉時停止定期獲取crossline info
        stopCrosslineInfoPolling();
      }
    } catch (error) {
      console.error('Failed to toggle crossline detection:', error);
    }
  };

  const clearLines = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setCrosslineDetection(prev => {
      // 同步清空的線段狀態到 server
      syncLinesToServer([]);
      return {
        ...prev,
        lines: [],
      };
    });
  };

  const Toggle = ({ id, label, checked, onChange }) => {
    const handleChange = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newChecked = e.target.checked;
      console.log(`Toggle ${id}: ${checked} -> ${newChecked}`);
      onChange(newChecked);
    };

    return (
      <div className="flex items-center">
        <Switch
          id={id}
          checked={checked}
          onChange={handleChange}
          size="medium"
        />
        <label htmlFor={id} className="ml-3 text-white text-sm font-medium">
          {label}
        </label>
      </div>
    );
  };

  const DetectionGroup = ({ title, icon: Icon, enabled, onToggle, status, children, streaming, streamUrl }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-600/50 shadow-2xl backdrop-blur-md hover:shadow-slate-700/20 transition-all duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl tracking-tight break-words">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-500'} transition-all duration-300 flex-shrink-0`}></div>
              <span className="text-slate-400 text-xs sm:text-sm truncate">{status}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Toggle
            id={`${title.toLowerCase().replace(' ', '-')}-toggle`}
            label="Enable"
            checked={enabled}
            onChange={onToggle}
          />
        </div>
      </div>

      {/* Children Content */}
      <div className="mb-6 sm:mb-8">
        {children}
      </div>

      {/* Stream Display */}
      <div className="bg-gradient-to-br from-slate-700/40 to-slate-600/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-slate-500/30 shadow-inner">    
        <div className="bg-slate-800/60 rounded-xl sm:rounded-2xl min-h-[200px] sm:min-h-[280px] relative overflow-hidden border border-slate-500/40 shadow-inner">
          {streaming && enabled ? (
            <div className="flex justify-center items-center w-full h-full">
              <img
                src={streamUrl}
                alt={`${title} stream`}
                className="max-w-full max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] w-auto h-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] sm:h-[280px] text-center text-slate-400 p-4">
              <div className="space-y-3 sm:space-y-4 max-w-xs">
                <div className="p-3 sm:p-4 bg-slate-700/50 rounded-xl sm:rounded-2xl border border-slate-600/30">
                  <Monitor className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 opacity-60" />
                  <p className="text-base sm:text-lg font-medium break-words">
                    {enabled ? 'Initializing Detection...' : 'Detection System Disabled'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2 break-words">
                    {enabled ? 'Please wait while the system starts up' : 'Enable detection to view live feed'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 移除了原本的 header 部分，只返回內容
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100"
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none' // 防止自動滾動錨點
      }}
    >
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Motion Detection */}
        <DetectionGroup
          title="Motion Detection"
          icon={Activity}
          enabled={motionDetection.enabled}
          onToggle={toggleMotionDetection}
          status={motionDetection.status}
          streaming={motionDetection.streaming}
          streamUrl={`${activeHost}/motion/stream`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Last Detection</p>
              </div>
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                {motionDetection.lastDetection || 'No recent activity'}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Sensitivity Level</p>
              </div>
              <FormControl size="small" fullWidth>
                <Select
                  value={motionDetection.sensitivity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMotionDetection(prev => ({ ...prev, sensitivity: value }));
                    if (value !== 'custom') {
                      setMotionSensitivity(value);
                    }
                  }}
                  disabled={!motionDetection.enabled}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(251, 191, 36, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(251, 191, 36, 0.8)',
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(251, 191, 36, 0.8)',
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(148, 163, 184, 0.5)',
                    },
                    '&.Mui-disabled .MuiSelect-icon': {
                      color: 'rgba(148, 163, 184, 0.3)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgb(51, 65, 85)',
                        '& .MuiMenuItem-root': {
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(251, 191, 36, 0.1)',
                          },
                          '&.Mui-selected': {
                            color: 'white',
                            bgcolor: 'rgba(251, 191, 36, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(251, 191, 36, 0.3)',
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Low
                    </span>
                  </MenuItem>
                  <MenuItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      Medium
                    </span>
                  </MenuItem>
                  <MenuItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      High
                    </span>
                  </MenuItem>
                  <MenuItem value="custom">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      Custom
                    </span>
                  </MenuItem>
                </Select>
              </FormControl>
              
              {/* Custom Sensitivity Settings - Only show when 'custom' is selected */}
              {motionDetection.sensitivity === 'custom' && (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600/30 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-amber-400" />
                    <h4 className="text-amber-400 font-semibold text-sm">Custom Settings</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1">
                        Motion Threshold
                      </label>
                      <input
                        type="number"
                        value={customSensitivity.motionThreshold}
                        onChange={(e) => setCustomSensitivity(prev => ({
                          ...prev,
                          motionThreshold: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
                        min="0"
                        max="50000"
                        disabled={!motionDetection.enabled}
                      />
                      <p className="text-slate-500 text-xs mt-1">Range: 0-50000 (Higher = less sensitive)</p>
                    </div>
                    
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1">
                        Alarm Threshold
                      </label>
                      <input
                        type="number"
                        value={customSensitivity.alarmThreshold}
                        onChange={(e) => setCustomSensitivity(prev => ({
                          ...prev,
                          alarmThreshold: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none"
                        min="0"
                        max="100"
                        disabled={!motionDetection.enabled}
                      />
                      <p className="text-slate-500 text-xs mt-1">Range: 0-100 (Higher = more frames required)</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMotionSensitivity('custom', customSensitivity);
                      }}
                      disabled={!motionDetection.enabled}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        !motionDetection.enabled
                          ? 'bg-slate-600/60 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-lg'
                      }`}
                    >
                      Apply Custom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DetectionGroup>

        {/* Face Detection */}
        <DetectionGroup
          title="Face Detection"
          icon={Users}
          enabled={faceDetection.enabled}
          onToggle={toggleFaceDetection}
          status={faceDetection.status}
          streaming={faceDetection.streaming}
          streamUrl={`${activeHost}/face/stream`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Faces Detected</p>
              </div>
              <p className="text-white font-mono text-2xl sm:text-4xl font-bold">
                {faceDetection.faceCount}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Last Detection</p>
              </div>
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                {faceDetection.lastDetection || 'No recent activity'}
              </p>
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                {faceDetection.faceNames || ''}
              </p>
            </div>
          </div>
        </DetectionGroup>

        {/* Crossline Detection */}
        <DetectionGroup
          title="Crossline Detection"
          icon={GitMerge}
          enabled={crosslineDetection.enabled}
          onToggle={toggleCrosslineDetection}
          status={crosslineDetection.status}
          streaming={crosslineDetection.streaming}
          streamUrl={`${activeHost}/crossline/stream`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <GitMerge className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Active Lines</p>
              </div>
              <p className="text-white font-mono text-2xl sm:text-4xl font-bold">
                {crosslineDetection.lines.length}
              </p>
            </div>
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Crossing Events</p>
              </div>
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                {crosslineDetection.lastDetection}
              </p> 
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                {crosslineDetection.crossingEvent}
              </p>
              <p className="text-white font-mono text-lg sm:text-xl font-semibold break-words">
                Cross Line Detected!
              </p> 
            </div>
            <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <p className="text-slate-300 font-medium text-sm sm:text-base">Line Controls</p>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={addVerticalLine}
                  disabled={!crosslineDetection.enabled}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    !crosslineDetection.enabled
                      ? 'bg-slate-600/60 text-slate-400 cursor-not-allowed border border-slate-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-500 text-slate-900 shadow-lg hover:shadow-amber-400/30 border border-amber-400/30 font-bold'
                  }`}
                >
                  <GitMerge className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Vertical Line</span>
                  <span className="sm:hidden">Add Line</span>
                </button>
                <button
                  onClick={clearLines}
                  disabled={!crosslineDetection.enabled || crosslineDetection.lines.length === 0}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    !crosslineDetection.enabled || crosslineDetection.lines.length === 0
                      ? 'bg-slate-600/60 text-slate-400 cursor-not-allowed border border-slate-500/30'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/30 border border-red-400/30 font-bold'
                  }`}
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Clear All Lines</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Overlay */}
          {crosslineDetection.enabled && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-br from-slate-700/40 to-slate-600/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm border border-slate-500/30 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                    <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  </div>
                  <h4 className="text-white font-semibold text-base sm:text-lg lg:text-xl">Interactive Line Editing</h4>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                    <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-amber-400 font-semibold text-xs sm:text-sm">Drag Endpoints to Adjust</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsLineEditingExpanded(!isLineEditingExpanded);
                    }}
                    className="p-2 sm:p-2.5 bg-slate-600/50 hover:bg-slate-600/70 rounded-lg border border-slate-500/30 hover:border-slate-400/50 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                  >
                    {isLineEditingExpanded ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Collapsible Content */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isLineEditingExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="bg-slate-800/60 rounded-lg sm:rounded-2xl relative overflow-hidden border border-slate-500/40 shadow-2xl">
                  <div className="flex justify-center items-center w-full h-full min-h-[500px]">
                    {/* Background stream */}
                    <img
                      src={`${activeHost}/crossline/stream`}
                      alt="Crossline detection stream"
                      className="max-w-full max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] w-auto h-auto object-contain"
                      crossOrigin="anonymous"
                      onLoad={handleImageLoad}
                    />
                  </div>
                  
                  {/* Interactive canvas overlay */}
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      // 只有在啟用時且沒有正在進行其他操作時才攔截事件
                      pointerEvents: crosslineDetection.enabled ? 'auto' : 'none',
                      zIndex: 1,
                      cursor: crosslineDetection.enabled ? 
                        (crosslineDetection.hoveredPoint ? 'grab' : 
                         crosslineDetection.isDragging ? 'grabbing' : 'default') : 'default',
                      // 防止文字選取和拖拉
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      // 防止觸摸設備上的選取
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // 清除 hover 狀態和結束拖拉
                      setCrosslineDetection(prev => ({
                        ...prev,
                        hoveredPoint: null,
                        isDragging: false,
                        dragTarget: null
                      }));
                      setLiveCoordinates(null);
                    }}
                  />
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 lg:p-5 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-600/30">
                  <div className="space-y-2">
                    <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed break-words">
                      {crosslineDetection.enabled ? 
                        `🎯 Click "Add Vertical Line" to create a new detection line, then drag the endpoints to position it. Lines: ${crosslineDetection.lines.length} | Status: ${crosslineDetection.isDragging ? 'Adjusting Position' : 'Ready'}` : 
                        '🔒 Enable crossline detection to start adding warning lines'
                      }
                    </p>
                    
                    {/* 座標顯示區域 */}
                    {crosslineDetection.enabled && crosslineDetection.lines.length > 0 && (
                      <div className="border-t border-slate-600/30 pt-2">
                        <h4 className="text-amber-400 text-xs sm:text-sm font-medium mb-1">📍 Line Coordinates:</h4>
                        <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                          Real Image: Actual image pixels | Canvas Display: Browser canvas position | Normalized: Server coordinates (0-1)
                        </p>
                        
                        {/* 實時拖拽座標顯示 */}
                        {liveCoordinates && (
                          <div className="mb-2 p-2 bg-orange-900/30 border border-orange-500/50 rounded text-xs font-mono">
                            <span className="text-orange-400 font-bold">🔄 Live Dragging:</span>
                            <span className="text-white ml-2">
                              Line {crosslineDetection.lines.findIndex(l => l.id === liveCoordinates.lineId) + 1} - 
                              {liveCoordinates.point === 'start' ? ' Start Point' : ' End Point'}:
                            </span>
                            <div className="mt-1 flex flex-wrap gap-4 text-xs">
                              <span className="text-orange-300">
                                Real Image: ({liveCoordinates.canvasX}, {liveCoordinates.canvasY})
                              </span>
                              <span className="text-green-300">
                                Canvas Display: ({liveCoordinates.displayX}, {liveCoordinates.displayY})
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {crosslineDetection.lines.map((line, index) => {
                            const realLine = realImageLines[index];
                            const transformation = getImageTransformation();
                            
                            // 計算 Canvas Display 座標（考慮圖片置中和縮放）
                            const displayStartX = Math.round(line.startX * transformation.scaleX + transformation.offsetX);
                            const displayStartY = Math.round(line.startY * transformation.scaleY + transformation.offsetY);
                            const displayEndX = Math.round(line.endX * transformation.scaleX + transformation.offsetX);
                            const displayEndY = Math.round(line.endY * transformation.scaleY + transformation.offsetY);
                            
                            return (
                              <div key={index} className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2 rounded border border-slate-700/50 hover:bg-slate-900/70 transition-colors duration-200">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-300 font-bold">Line {index + 1}:</span>
                                  </div>
                                  <div className="pl-2 space-y-1">
                                    <div className="text-slate-300">
                                      Real Image: ({line.startX.toFixed(0)}, {line.startY.toFixed(0)}) → ({line.endX.toFixed(0)}, {line.endY.toFixed(0)})
                                    </div>
                                    <div className="text-green-400">
                                      Canvas Display: ({displayStartX}, {displayStartY}) → ({displayEndX}, {displayEndY})
                                    </div>
                                    {realLine && (
                                      <div className="text-blue-400">
                                        Normalized: ({realLine.startX.toFixed(3)}, {realLine.startY.toFixed(3)}) → ({realLine.endX.toFixed(3)}, {realLine.endY.toFixed(3)})
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Collapsed State Info */}
              {!isLineEditingExpanded && (
                <div className="p-3 sm:p-4 bg-slate-800/40 rounded-lg border border-slate-600/20">
                  <p className="text-slate-400 text-xs sm:text-sm text-center">
                    📐 Click the expand button above to open line editing interface | Lines: {crosslineDetection.lines.length}
                  </p>
                </div>
              )}
            </div>
          )}
          
        </DetectionGroup>
        </div>
      </div>
    </div>
  );
};

export default CameraDetectionInterface;