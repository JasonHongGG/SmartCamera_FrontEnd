import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Workflow, Activity, Users, Settings, Trash2, MousePointer, ChevronDown, ChevronUp, GitMerge } from 'lucide-react';
import DetectionGroup from '../Common/DetectionGroup';
import { usePipelineDetection } from '../../hooks/detectionHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const PipelineDetection = () => {
  const { config } = useAppConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    state,
    setState,
    // eslint-disable-next-line no-unused-vars
    realImageLines,
    // eslint-disable-next-line no-unused-vars
    setRealImageLines,
    liveCoordinates,
    setLiveCoordinates,
    realImageSize,
    setRealImageSize,
    displayedImageSize,
    setDisplayedImageSize,
    // eslint-disable-next-line no-unused-vars
    canvasSize,
    setCanvasSize,
    toggleDetection,
    syncLinesToServer,
    addVerticalLine,
    clearLines
  } = usePipelineDetection(config.detectionHost, isExpanded);

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
    
    const scaleX = displayWidth / realImageSize.width;
    const scaleY = displayHeight / realImageSize.height;
    
    return { offsetX, offsetY, scaleX, scaleY };
  }, [displayedImageSize, realImageSize]);

  // Canvas 鼠標事件處理
  const handleCanvasMouseDown = useCallback((e) => {
    if (!state.enabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const transformation = getImageTransformation();
    const imageX = (mouseX - transformation.offsetX) / transformation.scaleX;
    const imageY = (mouseY - transformation.offsetY) / transformation.scaleY;
    
    const TOUCH_RADIUS = 15 / Math.min(transformation.scaleX, transformation.scaleY);
    
    for (const line of state.lines) {
      const distToStart = Math.sqrt(
        Math.pow(imageX - line.startX, 2) + Math.pow(imageY - line.startY, 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(imageX - line.endX, 2) + Math.pow(imageY - line.endY, 2)
      );
      
      if (distToStart < TOUCH_RADIUS) {
        setState(prev => ({
          ...prev,
          isDragging: true,
          dragTarget: { lineId: line.id, point: 'start' }
        }));
        return;
      }
      
      if (distToEnd < TOUCH_RADIUS) {
        setState(prev => ({
          ...prev,
          isDragging: true,
          dragTarget: { lineId: line.id, point: 'end' }
        }));
        return;
      }
    }
  }, [state.enabled, state.lines, getImageTransformation, setState]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!state.enabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const transformation = getImageTransformation();
    const imageX = (mouseX - transformation.offsetX) / transformation.scaleX;
    const imageY = (mouseY - transformation.offsetY) / transformation.scaleY;
    
    if (state.isDragging && state.dragTarget) {
      const clampedX = Math.max(0, Math.min(realImageSize.width, imageX));
      const clampedY = Math.max(0, Math.min(realImageSize.height, imageY));
      
      const { lineId, point } = state.dragTarget;
      
      // 更新線段位置
      setState(prev => ({
        ...prev,
        lines: prev.lines.map(line => {
          if (line.id === lineId) {
            if (point === 'start') {
              return { ...line, startX: clampedX, startY: clampedY };
            } else {
              return { ...line, endX: clampedX, endY: clampedY };
            }
          }
          return line;
        })
      }));
      
      // 更新即時座標顯示
      setLiveCoordinates({
        real: { x: clampedX, y: clampedY },
        canvas: { x: mouseX, y: mouseY },
        normalized: { 
          x: clampedX / realImageSize.width, 
          y: clampedY / realImageSize.height 
        }
      });
      
      return;
    }
    
    const TOUCH_RADIUS = 15 / Math.min(transformation.scaleX, transformation.scaleY);
    let foundPoint = null;
    
    for (const line of state.lines) {
      const distToStart = Math.sqrt(
        Math.pow(imageX - line.startX, 2) + Math.pow(imageY - line.startY, 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(imageX - line.endX, 2) + Math.pow(imageY - line.endY, 2)
      );
      
      if (distToStart < TOUCH_RADIUS) {
        foundPoint = { lineId: line.id, point: 'start' };
        break;
      }
      
      if (distToEnd < TOUCH_RADIUS) {
        foundPoint = { lineId: line.id, point: 'end' };
        break;
      }
    }
    
    setState(prev => ({
      ...prev,
      hoveredPoint: foundPoint
    }));
    
    // 更新即時座標顯示（非拖拽狀態）
    if (!state.isDragging) {
      setLiveCoordinates({
        real: { x: Math.max(0, Math.min(realImageSize.width, imageX)), y: Math.max(0, Math.min(realImageSize.height, imageY)) },
        canvas: { x: mouseX, y: mouseY },
        normalized: { 
          x: Math.max(0, Math.min(1, imageX / realImageSize.width)), 
          y: Math.max(0, Math.min(1, imageY / realImageSize.height)) 
        }
      });
    }
  }, [state.enabled, state.isDragging, state.dragTarget, state.lines, realImageSize, getImageTransformation, setState, setLiveCoordinates]);

  const handleCanvasMouseUp = useCallback((e) => {
    if (!state.enabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (state.isDragging) {
      syncLinesToServer(state.lines);
    }
    
    setState(prev => ({
      ...prev,
      isDragging: false,
      dragTarget: null
    }));
    setLiveCoordinates(null);
  }, [state.enabled, state.isDragging, state.lines, syncLinesToServer, setState, setLiveCoordinates]);

  // 繪製 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state.enabled) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // 設置高解析度顯示
      const dpr = window.devicePixelRatio || 1;
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
      
      const transformation = getImageTransformation();
      
      state.lines.forEach(line => {
        const isStartHovered = state.hoveredPoint?.lineId === line.id && state.hoveredPoint?.point === 'start';
        const isEndHovered = state.hoveredPoint?.lineId === line.id && state.hoveredPoint?.point === 'end';
        const isStartDragging = state.dragTarget?.lineId === line.id && state.dragTarget?.point === 'start';
        const isEndDragging = state.dragTarget?.lineId === line.id && state.dragTarget?.point === 'end';
        
        // 將真實圖片座標轉換為顯示座標
        const startX = line.startX * transformation.scaleX + transformation.offsetX;
        const startY = line.startY * transformation.scaleY + transformation.offsetY;
        const endX = line.endX * transformation.scaleX + transformation.offsetX;
        const endY = line.endY * transformation.scaleY + transformation.offsetY;
        
        // 繪製線段
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = line.color || '#EAB308';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 繪製起點
        const startRadius = isStartHovered || isStartDragging ? 10 : 8;
        const startColor = isStartDragging ? '#FCD34D' : (isStartHovered ? '#FBBF24' : '#EAB308');
        
        ctx.beginPath();
        ctx.arc(startX, startY, startRadius, 0, 2 * Math.PI);
        ctx.fillStyle = startColor;
        ctx.fill();
        
        // 繪製終點
        const endRadius = isEndHovered || isEndDragging ? 10 : 8;
        const endColor = isEndDragging ? '#FCD34D' : (isEndHovered ? '#FBBF24' : '#EAB308');
        
        ctx.beginPath();
        ctx.arc(endX, endY, endRadius, 0, 2 * Math.PI);
        ctx.fillStyle = endColor;
        ctx.fill();
      });
    };
    
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.enabled, state.lines, state.hoveredPoint, state.dragTarget, getImageTransformation]);

  return (
    <DetectionGroup
      title="Pipeline Detection"
      icon={Workflow}
      enabled={state.enabled}
      onToggle={toggleDetection}
      status={state.status}
      streaming={state.streaming}
      streamUrl={`${config.detectionHost}/pipeline/stream`}
      onExpand={handleExpand}
      onCollapse={handleCollapse}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Person Count */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Person Count</p>
          </div>
          <p className="text-white font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            {state.personCount}
          </p>
        </div>

        {/* Last Detection */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Last Detection</p>
          </div>
          <p className="text-white font-mono text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words">
            {state.lastDetection || 'No recent activity'}
          </p>
          {state.personNames && (
            <p className="text-white font-mono text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words mt-2">
              {state.personNames}
            </p>
          )}
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

      {/* Interactive Line Editing Section */}
      {state.enabled && (
        <div className="mt-4 sm:mt-6 group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300 overflow-hidden">
          <button
            onClick={() => setIsLineEditingExpanded(!isLineEditingExpanded)}
            className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between hover:bg-slate-600/20 transition-colors duration-200"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                <MousePointer className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
              </div>
              <span className="text-slate-200 font-semibold text-xs sm:text-sm md:text-base">
                Interactive Line Editing
              </span>
            {state.lines.length > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs sm:text-sm font-medium border border-amber-400/30">
                {state.lines.length} {state.lines.length === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>
          {isLineEditingExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          )}
        </button>

        {isLineEditingExpanded && (
          <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
            {/* Stream and Canvas */}
            <div className="bg-slate-800/60 rounded-lg sm:rounded-xl md:rounded-2xl relative overflow-hidden border border-slate-500/40 shadow-2xl">
              <div className="flex justify-center items-center w-full h-[250px] xs:h-[300px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px]">
                <img
                  src={`${config.detectionHost}/pipeline/stream`}
                  alt="Pipeline Detection Stream"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoad}
                />
              </div>
              <canvas
                ref={canvasRef}
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
                     state.isDragging ? 'grabbing' : 'crosshair') : 'not-allowed'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>

            {/* Coordinate Information */}
            {liveCoordinates && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="bg-slate-700/50 rounded-lg p-2 sm:p-3 border border-slate-500/30">
                  <p className="text-slate-400 font-medium mb-1">Real Image</p>
                  <p className="text-white font-mono">
                    ({Math.round(liveCoordinates.real.x)}, {Math.round(liveCoordinates.real.y)})
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 sm:p-3 border border-slate-500/30">
                  <p className="text-slate-400 font-medium mb-1">Canvas Display</p>
                  <p className="text-white font-mono">
                    ({Math.round(liveCoordinates.canvas.x)}, {Math.round(liveCoordinates.canvas.y)})
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 sm:p-3 border border-slate-500/30">
                  <p className="text-slate-400 font-medium mb-1">Normalized</p>
                  <p className="text-white font-mono">
                    ({liveCoordinates.normalized.x.toFixed(3)}, {liveCoordinates.normalized.y.toFixed(3)})
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {state.lines.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-2 sm:p-3">
                <p className="text-amber-300 text-xs sm:text-sm">
                  💡 <span className="font-semibold">Tip:</span> Drag the endpoints of the lines to adjust their positions.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      )}
    </DetectionGroup>
  );
};

export default PipelineDetection;
