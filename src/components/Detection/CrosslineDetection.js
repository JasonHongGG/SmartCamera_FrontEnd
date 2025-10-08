import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GitMerge, Settings, Activity, Trash2, MousePointer, ChevronDown, ChevronUp } from 'lucide-react';
import DetectionGroup from '../Common/DetectionGroup';
import { useCrosslineDetection } from '../../hooks/detectionHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const CrosslineDetection = () => {
  const { config } = useAppConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    state,
    setState,
    realImageLines,
    // eslint-disable-next-line no-unused-vars
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
    clearLines,
    startStreaming,
    stopStreaming
  } = useCrosslineDetection(config.detectionHost, isExpanded);

  const [isLineEditingExpanded, setIsLineEditingExpanded] = useState(false);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 處理展開事件
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  // 處理收合事件
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // 圖片載入處理
  const handleImageLoad = useCallback((e) => {
    const naturalWidth = e.target.naturalWidth || 640;
    const naturalHeight = e.target.naturalHeight || 480;
    
    const container = e.target.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const imageAspect = naturalWidth / naturalHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let actualDisplayWidth, actualDisplayHeight;
    
    if (imageAspect > containerAspect) {
      actualDisplayWidth = containerWidth;
      actualDisplayHeight = containerWidth / imageAspect;
    } else {
      actualDisplayHeight = containerHeight;
      actualDisplayWidth = containerHeight * imageAspect;
    }
    
    setCanvasSize({ width: naturalWidth, height: naturalHeight });
    setRealImageSize({ width: naturalWidth, height: naturalHeight });
    setDisplayedImageSize({ width: actualDisplayWidth, height: actualDisplayHeight });
  }, [setCanvasSize, setRealImageSize, setDisplayedImageSize]);

  // 計算圖片變換
  const getImageTransformation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };
    
    const canvasRect = canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    
    const imageAspectRatio = displayedImageSize.width / displayedImageSize.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageAspectRatio > canvasAspectRatio) {
      displayWidth = canvasWidth;
      displayHeight = canvasWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (canvasHeight - displayHeight) / 2;
    } else {
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

  // 檢查滑鼠位置
  const getPointAtPosition = useCallback((x, y) => {
    const tolerance = 15;
    
    for (const line of state.lines) {
      const startDist = Math.sqrt(Math.pow(x - line.startX, 2) + Math.pow(y - line.startY, 2));
      if (startDist <= tolerance) {
        return { lineId: line.id, point: 'start' };
      }
      
      const endDist = Math.sqrt(Math.pow(x - line.endX, 2) + Math.pow(y - line.endY, 2));
      if (endDist <= tolerance) {
        return { lineId: line.id, point: 'end' };
      }
    }
    return null;
  }, [state.lines]);

  // Canvas 滑鼠事件處理
  const handleCanvasMouseDown = useCallback((e) => {
    if (!state.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const transformation = getImageTransformation();
    
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const imageX = (canvasX - transformation.offsetX) / transformation.scaleX;
    const imageY = (canvasY - transformation.offsetY) / transformation.scaleY;
    
    if (imageX < 0 || imageX > realImageSize.width || imageY < 0 || imageY > realImageSize.height) {
      return;
    }

    const pointAt = getPointAtPosition(imageX, imageY);
    
    if (pointAt) {
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragTarget: pointAt
      }));
    }
  }, [state.enabled, getImageTransformation, realImageSize, getPointAtPosition, setState]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!state.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const transformation = getImageTransformation();
    
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const imageX = (canvasX - transformation.offsetX) / transformation.scaleX;
    const imageY = (canvasY - transformation.offsetY) / transformation.scaleY;
    
    if (imageX < 0 || imageX > realImageSize.width || imageY < 0 || imageY > realImageSize.height) {
      if (state.isDragging) {
        const clampedX = Math.max(0, Math.min(realImageSize.width, imageX));
        const clampedY = Math.max(0, Math.min(realImageSize.height, imageY));
        updateDragPosition(clampedX, clampedY);
      }
      return;
    }

    if (state.isDragging && state.dragTarget) {
      updateDragPosition(imageX, imageY);
    } else {
      setLiveCoordinates(null);
      
      const pointAt = getPointAtPosition(imageX, imageY);
      setState(prev => ({
        ...prev,
        hoveredPoint: pointAt
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.enabled, state.isDragging, state.dragTarget, getImageTransformation, realImageSize, getPointAtPosition, setState, setLiveCoordinates]);
  
  const updateDragPosition = useCallback((imageX, imageY) => {
    if (!state.dragTarget) return;
    
    const { lineId, point } = state.dragTarget;
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
    
    setState(prev => ({
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
  }, [state.dragTarget, getImageTransformation, setLiveCoordinates, setState]);

  const handleCanvasMouseUp = useCallback((e) => {
    if (!state.enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    setLiveCoordinates(null);
    
    if (state.isDragging) {
      setState(prev => {
        syncLinesToServer(prev.lines);
        return {
          ...prev,
          isDragging: false,
          dragTarget: null
        };
      });
    } else {
      setState(prev => ({
        ...prev,
        isDragging: false,
        dragTarget: null
      }));
    }
  }, [state.enabled, state.isDragging, setLiveCoordinates, setState, syncLinesToServer]);

  // Canvas 繪製
  const drawLinesImmediate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const transformation = getImageTransformation();
    
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    ctx.scale(dpr, dpr);
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    state.lines.forEach(line => {
      const isStartHovered = state.hoveredPoint?.lineId === line.id && state.hoveredPoint?.point === 'start';
      const isEndHovered = state.hoveredPoint?.lineId === line.id && state.hoveredPoint?.point === 'end';
      const isStartDragging = state.dragTarget?.lineId === line.id && state.dragTarget?.point === 'start';
      const isEndDragging = state.dragTarget?.lineId === line.id && state.dragTarget?.point === 'end';
      
      const startX = line.startX * transformation.scaleX + transformation.offsetX;
      const startY = line.startY * transformation.scaleY + transformation.offsetY;
      const endX = line.endX * transformation.scaleX + transformation.offsetX;
      const endY = line.endY * transformation.scaleY + transformation.offsetY;
      
      // 繪製線段
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 繪製端點
      const startRadius = isStartHovered || isStartDragging ? 10 : 8;
      const startColor = isStartDragging ? '#fbbf24' : (isStartHovered ? '#f59e0b' : '#ef4444');
      
      ctx.beginPath();
      ctx.arc(startX, startY, startRadius, 0, 2 * Math.PI);
      ctx.fillStyle = startColor;
      ctx.fill();
      
      const endRadius = isEndHovered || isEndDragging ? 10 : 8;
      const endColor = isEndDragging ? '#fbbf24' : (isEndHovered ? '#f59e0b' : '#ef4444');
      
      ctx.beginPath();
      ctx.arc(endX, endY, endRadius, 0, 2 * Math.PI);
      ctx.fillStyle = endColor;
      ctx.fill();
    });
  }, [state.lines, state.hoveredPoint, state.dragTarget, getImageTransformation]);

  const drawLines = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      drawLinesImmediate();
      animationFrameRef.current = null;
    });
  }, [drawLinesImmediate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawLines();
    }
  }, [drawLines, canvasSize]);

  // 清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <DetectionGroup
      title="Crossline Detection"
      icon={GitMerge}
      enabled={state.enabled}
      onToggle={toggleDetection}
      status={state.status}
      streaming={state.streaming}
      streamUrl={`${config.detectionHost}/crossline/stream`}
      onExpand={handleExpand}
      onCollapse={handleCollapse}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Lines */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <GitMerge className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Active Lines</p>
          </div>
          <p className="text-white font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            {state.lines.length}
          </p>
        </div>

        {/* Crossing Events */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Crossing Events</p>
          </div>
          <div className="space-y-1">
            <p className="text-white font-mono text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words">
              {state.lastDetection}
            </p>
            {state.crossingEvent && (
              <p className="text-white font-mono text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words">
                {state.crossingEvent}
              </p>
            )}
          </div>
        </div>

        {/* Line Controls */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Line Controls</p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={addVerticalLine}
              disabled={!state.enabled}
              className={`w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !state.enabled
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
              disabled={!state.enabled || state.lines.length === 0}
              className={`w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 ${
                !state.enabled || state.lines.length === 0
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
      {state.enabled && (
        <div className="mt-4 sm:mt-6 md:mt-8 bg-gradient-to-br from-slate-700/40 to-slate-600/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 backdrop-blur-sm border border-slate-500/30 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                <MousePointer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
              </div>
              <h4 className="text-white font-semibold text-sm sm:text-base md:text-lg lg:text-xl">Interactive Line Editing</h4>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 font-semibold text-xs sm:text-sm hidden sm:inline">Drag Endpoints to Adjust</span>
                <span className="text-amber-400 font-semibold text-xs sm:hidden">Drag to Edit</span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsLineEditingExpanded(!isLineEditingExpanded);
                }}
                className="p-1.5 sm:p-2 md:p-2.5 bg-slate-600/50 hover:bg-slate-600/70 rounded-lg border border-slate-500/30 hover:border-slate-400/50 transition-all duration-200 flex items-center justify-center flex-shrink-0"
              >
                {isLineEditingExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-300" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-300" />
                )}
              </button>
            </div>
          </div>
          
          {/* Collapsible Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isLineEditingExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-slate-800/60 rounded-lg sm:rounded-xl md:rounded-2xl relative overflow-hidden border border-slate-500/40 shadow-2xl">
              <div className="flex justify-center items-center w-full h-[250px] xs:h-[300px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px]">
                {/* Background stream */}
                <img
                  src={`${config.detectionHost}/crossline/stream`}
                  alt="Crossline detection stream"
                  className="w-full h-full object-contain"
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
                  pointerEvents: state.enabled ? 'auto' : 'none',
                  zIndex: 1,
                  cursor: state.enabled ? 
                    (state.hoveredPoint ? 'grab' : 
                     state.isDragging ? 'grabbing' : 'default') : 'default',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setState(prev => ({
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
                  {state.enabled ? 
                    `🎯 Click "Add Vertical Line" to create a new detection line, then drag the endpoints to position it. Lines: ${state.lines.length} | Status: ${state.isDragging ? 'Adjusting Position' : 'Ready'}` : 
                    '🔒 Enable crossline detection to start adding warning lines'
                  }
                </p>
                
                {/* 座標顯示區域 */}
                {state.enabled && state.lines.length > 0 && (
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
                          Line {state.lines.findIndex(l => l.id === liveCoordinates.lineId) + 1} - 
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
                    
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {state.lines.map((line, index) => {
                        const realLine = realImageLines[index];
                        const transformation = getImageTransformation();
                        
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
                📐 Click the expand button above to open line editing interface | Lines: {state.lines.length}
              </p>
            </div>
          )}
        </div>
      )}
    </DetectionGroup>
  );
};

export default CrosslineDetection;