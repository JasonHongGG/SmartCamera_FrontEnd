import React from 'react';
import { Select, MenuItem, FormControl } from '@mui/material';

const CustomSelect = ({ id, label, value, options, onChange }) => (
  <div className="space-y-2 sm:space-y-3">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-slate-300 text-xs sm:text-sm font-medium">
        {label}
      </label>
      <span className="bg-amber-400 text-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-mono font-semibold min-w-[50px] sm:min-w-[60px] text-center">
        {value}
      </span>
    </div>
    <FormControl fullWidth size="small">
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          backgroundColor: '#374151',
          color: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6b7280',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#eab308',
          },
          '& .MuiSvgIcon-root': {
            color: 'white',
          },
          '& .MuiSelect-select': {
            padding: '8px 14px',
          },
        }}
        MenuProps={{
          disableScrollLock: true,
          disablePortal: false,
          PaperProps: {
            sx: {
              bgcolor: '#374151',
              border: '1px solid #6b7280',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              maxHeight: '200px',
              // 隱藏滾動條
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE and Edge
              overflow: 'auto',
              '& .MuiMenuItem-root': {
                color: 'white',
                padding: '8px 14px',
                minHeight: '36px',
                '&:hover': {
                  backgroundColor: '#4b5563',
                },
                '&.Mui-selected': {
                  backgroundColor: '#eab308',
                  color: 'black',
                  '&:hover': {
                    backgroundColor: '#eabb2eff',
                  },
                },
              },
              // 確保選單內容也隱藏滾動條
              '& .MuiMenu-list': {
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              },
            },
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          getContentAnchorEl: null,
        }}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </div>
);

export default CustomSelect;