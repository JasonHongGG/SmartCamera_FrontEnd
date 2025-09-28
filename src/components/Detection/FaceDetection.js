import React from 'react';
import { Users, Activity } from 'lucide-react';
import DetectionGroup from '../Common/DetectionGroup';
import { useFaceDetection } from '../../hooks/detectionHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const FaceDetection = () => {
  const { config } = useAppConfig();
  const { state, toggleDetection } = useFaceDetection(config.detectionHost);

  return (
    <DetectionGroup
      title="Face Detection"
      icon={Users}
      enabled={state.enabled}
      onToggle={toggleDetection}
      status={state.status}
      streaming={state.streaming}
      streamUrl={`${config.detectionHost}/face/stream`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Faces Detected */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Faces Detected</p>
          </div>
          <p className="text-white font-mono text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            {state.faceCount}
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
          {state.faceNames && (
            <p className="text-white font-mono text-sm sm:text-base md:text-lg lg:text-xl font-semibold break-words mt-2">
              {state.faceNames}
            </p>
          )}
        </div>
      </div>
    </DetectionGroup>
  );
};

export default FaceDetection;