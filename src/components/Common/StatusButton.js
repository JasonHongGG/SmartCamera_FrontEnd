import React from 'react';

const StatusButton = ({ 
  onClick, 
  disabled = false, 
  status = 'idle', // 'idle', 'loading', 'success', 'error'
  children,
  className = '',
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error'
}) => {
  const getButtonStyles = () => {
    const baseStyles = 'px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative overflow-hidden';
    
    if (disabled || status === 'loading') {
      return `${baseStyles} bg-slate-600/60 text-slate-400 cursor-not-allowed`;
    }
    
    switch (status) {
      case 'success':
        return `${baseStyles} bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg`;
      case 'error':
        return `${baseStyles} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg`;
      default:
        return `${baseStyles} bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black shadow-lg cursor-pointer`;
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span>{loadingText}</span>
          </>
        );
      case 'success':
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successText}</span>
          </>
        );
      case 'error':
        return (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{errorText}</span>
          </>
        );
      default:
        return children;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'loading'}
      className={`${getButtonStyles()} ${className}`}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 bg-amber-500/20 animate-pulse"></div>
      )}
      <span className="relative flex items-center justify-center gap-1">
        {getButtonContent()}
      </span>
    </button>
  );
};

export default StatusButton;