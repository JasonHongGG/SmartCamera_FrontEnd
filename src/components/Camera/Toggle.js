import React from 'react';
import { Switch } from '@mui/material';

const Toggle = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <label htmlFor={id} className="text-slate-300 text-xs sm:text-sm font-medium">
      {label}
    </label>
    <Switch
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
          },
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: '#eab308',
        },
        '& .MuiSwitch-track': {
          backgroundColor: '#64748b',
        },
      }}
    />
  </div>
);

export default Toggle;