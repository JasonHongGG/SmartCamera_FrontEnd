import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#eab308', // yellow-500
      light: '#fbbf24', // yellow-400
      dark: '#ca8a04', // yellow-600
      contrastText: '#000000',
    },
    secondary: {
      main: '#6b7280', // gray-500
      light: '#9ca3af', // gray-400
      dark: '#374151', // gray-700
    },
    background: {
      default: '#111827', // gray-900
      paper: '#1f2937', // gray-800
    },
    text: {
      primary: '#f9fafb', // gray-50
      secondary: '#d1d5db', // gray-300
    },
    action: {
      hover: 'rgba(234, 179, 8, 0.1)',
      selected: 'rgba(234, 179, 8, 0.2)',
    },
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          color: '#eab308', // yellow-500
          height: 8,
        },
        track: {
          backgroundColor: '#eab308',
          border: 'none',
        },
        rail: {
          backgroundColor: '#374151', // gray-700
          opacity: 1,
        },
        thumb: {
          backgroundColor: '#eab308',
          border: '2px solid #ffffff',
          width: 20,
          height: 20,
          '&:hover': {
            boxShadow: '0 0 0 8px rgba(234, 179, 8, 0.16)',
          },
          '&:focus': {
            boxShadow: '0 0 0 8px rgba(234, 179, 8, 0.32)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 48,
          height: 24,
          padding: 0,
        },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(24px)',
            color: '#ffffff',
            '& + .MuiSwitch-track': {
              backgroundColor: '#eab308',
              opacity: 1,
            },
          },
        },
        thumb: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          width: 20,
          height: 20,
        },
        track: {
          borderRadius: 12,
          backgroundColor: '#6b7280', // gray-500
          opacity: 1,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#374151', // gray-700
          color: '#d1d5db', // gray-300
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4b5563', // gray-600
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#eab308', // yellow-500
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#eab308', // yellow-500
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: '#eab308',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#d97706',
          },
        },
        containedSecondary: {
          backgroundColor: '#374151',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#4b5563',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#d1d5db', // gray-300
          fontSize: '0.875rem',
          '&.Mui-focused': {
            color: '#eab308',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: '#374151',
          color: '#d1d5db',
          '&:hover': {
            backgroundColor: '#4b5563',
          },
          '&.Mui-selected': {
            backgroundColor: '#eab308',
            color: '#000000',
            '&:hover': {
              backgroundColor: '#d97706',
            },
          },
        },
      },
    },
  },
});