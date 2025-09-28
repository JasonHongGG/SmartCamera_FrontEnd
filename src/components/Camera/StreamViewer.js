import React from 'react';
import { Monitor, Camera } from 'lucide-react';
import { Button } from '@mui/material';

const StreamViewer = ({ 
  isStreaming, 
  streamUrl, 
  stillImageUrl, 
  showStillImage, 
  onClearStillImage 
}) => {
  return (
    <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
      {/* Stream Container */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600 shadow-xl backdrop-blur-sm">
        <div className="flex items-center mb-3 sm:mb-4">
          <h3 className="text-white font-semibold text-base sm:text-lg">Live Stream</h3>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl min-h-[200px] sm:min-h-[250px] md:min-h-[300px] p-2 sm:p-3 md:p-4 backdrop-blur-sm border border-slate-600/30">
          {isStreaming ? (
            <div className="relative w-full h-full min-h-[180px] sm:min-h-[220px] md:min-h-[250px]">
              <img
                src={`${streamUrl}/stream`}
                alt="Live stream"
                className="w-full h-full object-contain rounded-lg"
                crossOrigin="anonymous"
              />
              <a
                href={`${streamUrl}/stream`}
                download="stream_capture.jpg"
                className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-500 hover:bg-amber-600 text-black px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
              >
                Save
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center text-center text-slate-400 h-[180px] sm:h-[220px] md:h-[250px]">
              <div>
                <Monitor className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                <h4 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Stream Not Active</h4>
                <p className="text-xs sm:text-sm">Click "Start Stream" to begin live feed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Still Image Container */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-white font-semibold text-base sm:text-lg">Captured Images</h3>
          <div className="flex gap-2">
            {showStillImage && (
              <Button 
                onClick={onClearStillImage}
                variant="outlined"
                size="small"
                sx={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  minWidth: { xs: '100%', sm: '70px' },
                  height: { xs: 'auto', sm: '36px' },
                  '&:hover': {
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    bgcolor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                Clear Image
              </Button>
            )}
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg sm:rounded-xl min-h-[200px] sm:min-h-[250px] md:min-h-[300px] p-2 sm:p-3 md:p-4 backdrop-blur-sm border border-slate-600/30">
          {showStillImage ? (
            <div className="relative w-full h-full min-h-[180px] sm:min-h-[220px] md:min-h-[250px]">
              <img
                src={stillImageUrl}
                alt="Captured still"
                className="w-full h-full object-contain rounded-lg"
                crossOrigin="anonymous"
              />
              <a
                href={stillImageUrl}
                download="still_capture.jpg"
                className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-500 hover:bg-amber-600 text-black px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
              >
                Save
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center text-center text-slate-400 h-[180px] sm:h-[220px] md:h-[250px]">
              <div>
                <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                <h4 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Captured Image</h4>
                <p className="text-xs sm:text-sm">Click "Capture Still" to take a photo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;