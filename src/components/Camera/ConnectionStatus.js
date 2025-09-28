import React from 'react';

const ConnectionStatus = ({ 
  connectionStatus, 
  lastError, 
  activeHost, 
  onTestConnection, 
  onInitializeSettings 
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3 justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'disconnected' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="text-white font-medium text-sm sm:text-base whitespace-nowrap">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'disconnected' ? 'Disconnected' :
             'Connecting...'}
          </span>
          <span className="text-slate-400 text-xs sm:text-sm truncate min-w-0">
            ({activeHost})
          </span>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={onTestConnection}
            className="px-2 py-1 sm:px-3 sm:py-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-xs sm:text-sm flex-shrink-0"
          >
            Test
          </button>
          {connectionStatus === 'connected' && (
            <button
              onClick={onInitializeSettings}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-xs sm:text-sm flex-shrink-0"
            >
              Sync
            </button>
          )}
        </div>
      </div>
      {lastError && (
        <div className="mt-2 text-red-400 text-sm">
          {lastError}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;