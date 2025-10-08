import React, { useState, useCallback, useRef } from 'react';
import { Activity, Settings } from 'lucide-react';
import { Select, MenuItem, FormControl } from '@mui/material';
import DetectionGroup from '../Common/DetectionGroup';
import CustomSensitivityInput from '../Common/CustomSensitivityInput';
import StatusButton from '../Common/StatusButton';
import { useMotionDetection } from '../../hooks/detectionHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const MotionDetection = () => {
  const { config } = useAppConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    state, 
    customSensitivity, 
    toggleDetection, 
    setSensitivity,
    setCustomSensitivity 
  } = useMotionDetection(config.detectionHost, isExpanded);

  // 本地輸入狀態管理（使用 ref 避免重新渲染）
  const localMotionThreshold = useRef(customSensitivity.motionThreshold);
  const localAlarmThreshold = useRef(customSensitivity.alarmThreshold);
  const motionThresholdRef = useRef(null);
  const alarmThresholdRef = useRef(null);

  const [applyCustomStatus, setApplyCustomStatus] = useState('idle');

  // 輸入處理函數
  const handleMotionThresholdChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    localMotionThreshold.current = value;
  }, []);

  const handleAlarmThresholdChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    localAlarmThreshold.current = value;
  }, []);

  // Apply Custom 按鈕處理
  const handleApplyCustom = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setApplyCustomStatus('loading');
    
    try {
      const currentValues = {
        motionThreshold: localMotionThreshold.current,
        alarmThreshold: localAlarmThreshold.current
      };
      
      await setSensitivity('custom', currentValues);
      setApplyCustomStatus('success');
      setTimeout(() => setApplyCustomStatus('idle'), 3000);
    } catch (error) {
      setApplyCustomStatus('error');
      setTimeout(() => setApplyCustomStatus('idle'), 3000);
    }
  }, [setSensitivity]);

  // 敏感度選擇處理
  const handleSensitivityChange = useCallback(async (e) => {
    const value = e.target.value;
    console.log('Sensitivity change attempt:', value, 'Current state:', state.sensitivity);
    
    try {
      if (value === 'custom') {
        // 對於 custom 值，我們需要調用 setSensitivity 來更新狀態
        // 使用當前的 custom 值
        const currentCustomValues = {
          motionThreshold: localMotionThreshold.current,
          alarmThreshold: localAlarmThreshold.current
        };
        console.log('Setting custom sensitivity with values:', currentCustomValues);
        await setSensitivity('custom', currentCustomValues);
      } else {
        console.log('Setting predefined sensitivity:', value);
        await setSensitivity(value);
      }
      console.log('Sensitivity change successful');
    } catch (error) {
      console.error('Failed to set sensitivity:', error);
    }
  }, [setSensitivity, state.sensitivity]);

  // 處理展開事件
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  // 處理收合事件
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <DetectionGroup
      title="Motion Detection"
      icon={Activity}
      enabled={state.enabled}
      onToggle={toggleDetection}
      status={state.status}
      streaming={state.streaming}
      streamUrl={`${config.detectionHost}/motion/stream`}
      onExpand={handleExpand}
      onCollapse={handleCollapse}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
        </div>

        {/* Sensitivity Level */}
        <div className="group bg-gradient-to-br from-slate-600/40 to-slate-700/40 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-500/30 backdrop-blur-sm hover:border-slate-400/50 transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 md:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <p className="text-slate-300 font-medium text-xs sm:text-sm md:text-base">Sensitivity Level</p>
          </div>
          
          <FormControl size="small" fullWidth>
            <Select
              value={state.sensitivity}
              onChange={handleSensitivityChange}
              // disabled={!state.enabled}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(251, 191, 36, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(251, 191, 36, 0.8)',
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(251, 191, 36, 0.8)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(148, 163, 184, 0.5)',
                },
                '&.Mui-disabled .MuiSelect-icon': {
                  color: 'rgba(148, 163, 184, 0.3)',
                },
              }}
              MenuProps={{
                disableScrollLock: true,
                disablePortal: false,
                PaperProps: {
                  sx: {
                    bgcolor: 'rgb(51, 65, 85)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
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
                      padding: '8px 16px',
                      minHeight: '40px',
                      '&:hover': {
                        bgcolor: 'rgba(251, 191, 36, 0.1)',
                      },
                      '&.Mui-selected': {
                        color: 'white',
                        bgcolor: 'rgba(251, 191, 36, 0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(251, 191, 36, 0.3)',
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
              <MenuItem value="low">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Low
                </span>
              </MenuItem>
              <MenuItem value="medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  Medium
                </span>
              </MenuItem>
              <MenuItem value="high">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  High
                </span>
              </MenuItem>
              <MenuItem value="custom">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  Custom
                </span>
              </MenuItem>
            </Select>
          </FormControl>
          
          {/* Custom Sensitivity Settings */}
          {state.sensitivity === 'custom' && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-600/30 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <h4 className="text-amber-400 font-semibold text-xs sm:text-sm">Custom Settings</h4>
              </div>
              
              <div className="space-y-3">
                <CustomSensitivityInput
                  label="Motion Threshold"
                  defaultValue={customSensitivity.motionThreshold}
                  onChange={handleMotionThresholdChange}
                  min="0"
                  max="50000"
                  disabled={!state.enabled}
                  description="Range: 0-50000 (Higher = less sensitive)"
                  inputRef={motionThresholdRef}
                />
                
                <CustomSensitivityInput
                  label="Alarm Threshold"
                  defaultValue={customSensitivity.alarmThreshold}
                  onChange={handleAlarmThresholdChange}
                  min="0"
                  max="100"
                  disabled={!state.enabled}
                  description="Range: 0-100 (Higher = more frames required)"
                  inputRef={alarmThresholdRef}
                />
              </div>
              
              <div className="flex gap-2 pt-1 sm:pt-2">
                <StatusButton
                  onClick={handleApplyCustom}
                  disabled={!state.enabled}
                  status={applyCustomStatus}
                  loadingText="Applying..."
                  successText="Applied!"
                  errorText="Failed"
                  className="flex-1"
                >
                  Apply Custom
                </StatusButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </DetectionGroup>
  );
};

export default MotionDetection;