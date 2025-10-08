import React, { useState } from 'react';
import { Monitor, ChevronDown } from 'lucide-react';
import Toggle from './Toggle';
import { useAuth } from '../../context/AuthContext';

const DetectionGroup = ({ 
  title, 
  icon: Icon, 
  enabled, 
  onToggle, 
  status, 
  children, 
  streaming, 
  streamUrl,
  disabled = false,
  onExpand,
  onCollapse
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { hasPermission } = useAuth();
  const canControlSettings = hasPermission('detection', 'settings');

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // 通知父組件展開/收合狀態變化
    if (newExpanded && onExpand) {
      onExpand();
    } else if (!newExpanded && onCollapse) {
      onCollapse();
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-600/50 shadow-2xl backdrop-blur-md hover:shadow-slate-700/20 transition-all duration-300">
      {/* Collapsible Header */}
      <div 
        className="p-3 sm:p-4 md:p-6 lg:p-8 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-amber-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight break-words">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <div 
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                    enabled ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-500'
                  } transition-all duration-300 flex-shrink-0`}
                />
                <span className="text-slate-400 text-xs sm:text-sm truncate">{status}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Toggle 開關 - 只有有權限的用戶才能看到 */}
            {canControlSettings && (
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle
                  id={`${title.toLowerCase().replace(' ', '-')}-toggle`}
                  label=""
                  checked={enabled}
                  onChange={onToggle}
                  disabled={disabled}
                />
              </div>
            )}
            
            {/* 展開/收合圖示 */}
            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8">
          {/* Children Content */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            {children}
          </div>

          {/* Stream Display */}
          <div className="bg-gradient-to-br from-slate-700/40 to-slate-600/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 backdrop-blur-sm border border-slate-500/30 shadow-inner">    
            <div className="bg-slate-800/60 rounded-lg sm:rounded-xl md:rounded-2xl h-[200px] sm:h-[280px] md:h-[360px] lg:h-[480px] relative overflow-hidden border border-slate-500/40 shadow-inner">
              {streaming && enabled ? (
                <div className="flex justify-center items-center w-full h-full">
                  <img
                    src={streamUrl}
                    alt={`${title} stream`}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : streaming && !enabled ? (
                // 展開但功能未啟用
                <div className="flex items-center justify-center h-full text-center text-slate-400 p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-xs">
                    <div className="p-2 sm:p-3 md:p-4 bg-slate-700/50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-600/30">
                      <Monitor className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-2 md:mb-3 opacity-60" />
                      <p className="text-sm sm:text-base md:text-lg font-medium break-words text-amber-400">
                        Detection System Disabled
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 md:mt-2 break-words">
                        {canControlSettings 
                          ? 'Enable detection above to start monitoring'
                          : 'This detection feature is currently disabled. Please contact an administrator to enable it.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // 正在初始化
                <div className="flex items-center justify-center h-full text-center text-slate-400 p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-xs">
                    <div className="p-2 sm:p-3 md:p-4 bg-slate-700/50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-600/30">
                      <Monitor className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-2 md:mb-3 opacity-60" />
                      <p className="text-sm sm:text-base md:text-lg font-medium break-words">
                        Initializing Detection...
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 md:mt-2 break-words">
                        Please wait while the system starts up
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionGroup;