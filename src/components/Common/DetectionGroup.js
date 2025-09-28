import React from 'react';
import { Monitor } from 'lucide-react';
import Toggle from './Toggle';

const DetectionGroup = ({ 
  title, 
  icon: Icon, 
  enabled, 
  onToggle, 
  status, 
  children, 
  streaming, 
  streamUrl,
  disabled = false 
}) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-600/50 shadow-2xl backdrop-blur-md hover:shadow-slate-700/20 transition-all duration-300">
    {/* Header Section */}
    <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-2 sm:gap-3 md:gap-4">
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
      <div className="flex-shrink-0">
        <Toggle
          id={`${title.toLowerCase().replace(' ', '-')}-toggle`}
          label="Enable"
          checked={enabled}
          onChange={onToggle}
          disabled={disabled}
        />
      </div>
    </div>

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
        ) : (
          <div className="flex items-center justify-center h-full text-center text-slate-400 p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3 md:space-y-4 max-w-xs">
              <div className="p-2 sm:p-3 md:p-4 bg-slate-700/50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-600/30">
                <Monitor className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-1 sm:mb-2 md:mb-3 opacity-60" />
                <p className="text-sm sm:text-base md:text-lg font-medium break-words">
                  {enabled ? 'Initializing Detection...' : 'Detection System Disabled'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 md:mt-2 break-words">
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

export default DetectionGroup;