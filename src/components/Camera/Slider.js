import React from 'react';
import { Slider as MuiSlider } from '@mui/material';

const Slider = ({ id, label, value, min, max, onChange }) => (
  <div className="space-y-2 sm:space-y-3">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-slate-300 text-xs sm:text-sm font-medium">
        {label}
      </label>
      <span className="bg-amber-400 text-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-mono font-semibold min-w-[50px] sm:min-w-[60px] text-center">
        {value}
      </span>
    </div>
    <MuiSlider
      id={id}
      value={value}
      onChange={(e, newValue) => onChange(newValue)}
      min={min}
      max={max}
      sx={{
        color: '#eab308',
        '& .MuiSlider-thumb': {
          backgroundColor: '#eab308',
          border: '2px solid #fbbf24',
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0px 0px 0px 8px rgba(234, 179, 8, 0.16)',
          },
        },
        '& .MuiSlider-track': {
          backgroundColor: '#eab308',
        },
        '& .MuiSlider-rail': {
          backgroundColor: '#64748b',
        },
      }}
    />
  </div>
);

export default Slider;