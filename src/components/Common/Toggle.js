import React from 'react';
import { Switch } from '@mui/material';

const Toggle = ({ id, label, checked, onChange, disabled = false }) => {
  const handleChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newChecked = e.target.checked;
    onChange(newChecked);
  };

  return (
    <div className="flex items-center">
      <Switch
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        size="medium"
        sx={{
          transform: 'scale(0.8)',
          '@media (min-width: 640px)': {
            transform: 'scale(1)',
          }
        }}
      />
      <label 
        htmlFor={id} 
        className={`ml-2 sm:ml-3 text-white text-xs sm:text-sm font-medium ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default Toggle;