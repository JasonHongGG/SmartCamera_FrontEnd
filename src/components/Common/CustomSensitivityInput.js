import React from 'react';

const CustomSensitivityInput = React.memo(({ 
  label, 
  defaultValue,
  onChange, 
  min, 
  max, 
  disabled, 
  description,
  inputRef 
}) => (
  <div>
    <label className="block text-slate-300 text-xs font-medium mb-1">
      {label}
    </label>
    <input
      ref={inputRef}
      type="number"
      defaultValue={defaultValue}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      min={min}
      max={max}
      disabled={disabled}
    />
    <p className="text-slate-500 text-xs mt-1">{description}</p>
  </div>
));

CustomSensitivityInput.displayName = 'CustomSensitivityInput';

export default CustomSensitivityInput;