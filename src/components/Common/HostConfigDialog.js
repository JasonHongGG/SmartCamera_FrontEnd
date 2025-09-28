import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button,
  Box,
  Typography
} from '@mui/material';
import { Settings, Globe } from 'lucide-react';

const HostConfigDialog = ({ 
  open, 
  onClose, 
  config, 
  onSave 
}) => {
  const [tempConfig, setTempConfig] = useState(config);

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  const handleReset = () => {
    setTempConfig(config);
  };

  React.useEffect(() => {
    if (open) {
      setTempConfig(config);
    }
  }, [open, config]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: { xs: '12px', sm: '16px' },
          margin: { xs: 2, sm: 3 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: '600px', md: '700px' },
          width: '100%',
          maxHeight: { xs: 'calc(100vh - 64px)', sm: '90vh' },
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          color: 'white', 
          pb: { xs: 1, sm: 2 },
          px: { xs: 3, sm: 4 },
          pt: { xs: 3, sm: 4 }
        }}
      >
        <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2 }}>
          <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <Typography 
            variant="h6" 
            component="div" 
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Host Configuration
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent 
        sx={{ 
          color: 'white',
          px: { xs: 3, sm: 4 },
          py: { xs: 2, sm: 3 },
          '&:first-of-type': {
            paddingTop: { xs: 2, sm: 3 }
          }
        }}
      >
        <Box display="flex" flexDirection="column" gap={{ xs: 2.5, sm: 3.5 }} mt={0}>
          <TextField
            label="Camera Host"
            value={tempConfig.cameraHost}
            onChange={(e) => setTempConfig(prev => ({ 
              ...prev, 
              cameraHost: e.target.value 
            }))}
            fullWidth
            variant="outlined"
            placeholder="e.g., http://192.168.1.100:3000"
            sx={{
              '& .MuiInputLabel-root': { color: '#cbd5e1' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(251, 191, 36, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#eab308' }
              }
            }}
          />
          
          <TextField
            label="Detection Host"
            value={tempConfig.detectionHost}
            onChange={(e) => setTempConfig(prev => ({ 
              ...prev, 
              detectionHost: e.target.value 
            }))}
            fullWidth
            variant="outlined"
            placeholder="e.g., http://localhost:5000"
            sx={{
              '& .MuiInputLabel-root': { color: '#cbd5e1' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(251, 191, 36, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#eab308' }
              }
            }}
          />
          
          <TextField
            label="Stream Host"
            value={tempConfig.streamHost}
            onChange={(e) => setTempConfig(prev => ({ 
              ...prev, 
              streamHost: e.target.value 
            }))}
            fullWidth
            variant="outlined"
            placeholder="e.g., http://192.168.1.100:3001"
            sx={{
              '& .MuiInputLabel-root': { color: '#cbd5e1' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(251, 191, 36, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#eab308' }
              }
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          px: { xs: 3, sm: 4 }, 
          py: { xs: 2.5, sm: 3 },
          gap: { xs: 0.1, sm: 0.2 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          mt: 1
        }}
      >
        <Button 
          onClick={handleReset}
          variant="outlined"
          size="small"
          sx={{
            color: '#94a3b8',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 2, sm: 2.5 },
            py: { xs: 0.5, sm: 0.75 },
            minWidth: { xs: '100%', sm: '70px' },
            height: { xs: 'auto', sm: '36px' },
            '&:hover': {
              borderColor: 'rgba(148, 163, 184, 0.5)',
              bgcolor: 'rgba(148, 163, 184, 0.1)'
            }
          }}
        >
          Reset
        </Button>
        <Button 
          onClick={onClose}
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
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          size="small"
          sx={{
            bgcolor: '#eab308',
            color: 'black',
            fontWeight: 'bold',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 2, sm: 2.5 },
            py: { xs: 0.5, sm: 0.75 },
            minWidth: { xs: '100%', sm: '70px' },
            height: { xs: 'auto', sm: '36px' },
            '&:hover': {
              bgcolor: '#d97706'
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HostConfigDialog;