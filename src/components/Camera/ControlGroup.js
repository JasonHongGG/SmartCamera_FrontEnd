import React from 'react';

const ControlGroup = ({ title, icon: Icon, children }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm">
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
      <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
      </div>
      <h3 className="text-white font-semibold text-base sm:text-lg">{title}</h3>
    </div>
    <div className="space-y-3 sm:space-y-4 md:space-y-5">
      {children}
    </div>
  </div>
);

export default ControlGroup;