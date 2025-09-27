import './App.css';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Settings, Monitor, Sliders, Zap, Sun, Contrast, Palette, Eye, Focus, RotateCcw, FlipVertical, Grid, BarChart } from 'lucide-react';
import { 
  Slider as MuiSlider, 
  Switch, 
  Select, 
  MenuItem, 
  FormControl
} from '@mui/material';

const CameraInterface = ({ baseHost = "http://140.116.6.62:3000", cameraHost, streamHost, detectionHost }) => {
  // 使用 cameraHost 如果提供，否則使用 baseHost (向後相容)
  const activeHost = cameraHost || baseHost;
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // 'connected', 'disconnected', 'unknown'
  const [lastError, setLastError] = useState(null);
  const [cameraSettings, setCameraSettings] = useState({
    camera_open: true,
    light_bulb: true,
    framesize: '13',
    quality: 10,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    special_effect: '0',
    awb: true,
    awb_gain: true,
    wb_mode: '0',
    aec: true,
    aec2: true,
    ae_level: 0,
    aec_value: 204,
    agc: true,
    gainceiling: 0,
    bpc: false,
    wpc: true,
    raw_gma: true,
    lenc: true,
    hmirror: true,
    vflip: true,
    dcw: true,
    colorbar: false,
    led_intensity: 0
  });
  const [streamUrl, setStreamUrl] = useState('');
  const [stillImageUrl, setStillImageUrl] = useState('');
  const [showStillImage, setShowStillImage] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [showHostConfig, setShowHostConfig] = useState(false);

  // Initialize URLs
  useEffect(() => {
    setStreamUrl(streamHost);
  }, [streamHost]);

  const updateConfig = useCallback(async (key, value, retryCount = 3) => {
    const timeout = 5000; // 5 second timeout
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        console.log(`Sending request to ${activeHost}/control?var=${key}&val=${value}`);
        const response = await fetch(`${activeHost}/control?var=${key}&val=${value}`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✓ Updated ${key} to ${value}, status: ${response.status}`);
          setConnectionStatus('connected');
          setLastError(null);
          return true;
        } else {
          console.warn(`⚠ Server responded with status ${response.status} for ${key}=${value}`);
          setConnectionStatus('disconnected');
          setLastError(`Server error: ${response.status}`);
          return false;
        }
      } catch (error) {
        console.error(`✗ Attempt ${attempt}/${retryCount} failed for ${key}=${value}:`, error.message);
        
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = `Request timed out after ${timeout}ms`;
          console.error(`⏱ ${errorMessage}`);
        } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT') || error.message.includes('Failed to fetch')) {
          errorMessage = `Connection failed - Check if camera server is running at ${activeHost}`;
          console.error(`🔌 ${errorMessage}`);
        }
        
        setConnectionStatus('disconnected');
        setLastError(errorMessage);
        
        // If this is the last attempt, don't retry
        if (attempt === retryCount) {
          console.error(`❌ All ${retryCount} attempts failed for ${key}=${value}`);
          return false;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    return false;
  }, [activeHost]);

  // Initialize camera settings from server
  const initializeCameraSettings = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      console.log(`Fetching camera status from ${activeHost}/status`);
      const response = await fetch(`${activeHost}/status`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('✓ Camera status fetched successfully:', statusData);
        
        // Map server response to our camera settings state
        const mappedSettings = {
          camera_open: Boolean(statusData.camera_open || 0),
          light_bulb: Boolean(statusData.light_bulb || 0),
          framesize: String(statusData.framesize || '10'),
          quality: statusData.quality || 10,
          brightness: statusData.brightness || 0,
          contrast: statusData.contrast || 0,
          saturation: statusData.saturation || 0,
          special_effect: String(statusData.special_effect || '0'),
          awb: Boolean(statusData.awb || 1),
          awb_gain: Boolean(statusData.awb_gain || 1),
          wb_mode: String(statusData.wb_mode || '0'),
          aec: Boolean(statusData.aec || 1),
          aec2: Boolean(statusData.aec2 || 0),
          ae_level: statusData.ae_level || 0,
          aec_value: statusData.aec_value || 204,
          agc: Boolean(statusData.agc || 1),
          gainceiling: statusData.gainceiling || 0,
          bpc: Boolean(statusData.bpc || 0),
          wpc: Boolean(statusData.wpc || 1),
          raw_gma: Boolean(statusData.raw_gma || 1),
          lenc: Boolean(statusData.lenc || 1),
          hmirror: Boolean(statusData.hmirror || 0),
          vflip: Boolean(statusData.vflip || 0), // Default for vflip since not in response
          dcw: Boolean(statusData.dcw || 1),
          colorbar: Boolean(statusData.colorbar || 0),
          led_intensity: statusData.led_intensity || 0
        };
        
        setCameraSettings(mappedSettings);
        console.log('✓ Camera settings initialized:', mappedSettings);
        return true;
      } else {
        console.warn(`⚠ Status request failed with status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('✗ Failed to initialize camera settings:', error.message);
      return false;
    }
  }, [activeHost]);

  // Test connection to camera
  const testConnection = useCallback(async () => {
    setConnectionStatus('unknown');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${activeHost}/testConnection`, {
        signal: controller.signal,
        method: 'GET',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setConnectionStatus('connected');
        setLastError(null);
        console.log('✓ Camera connection test successful');
        
        // Initialize camera settings after successful connection
        await initializeCameraSettings();
      } else {
        setConnectionStatus('disconnected');
        setLastError(`Server error: ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      if (error.name === 'AbortError') {
        setLastError('Connection timeout');
      } else {
        setLastError('Connection failed');
      }
      console.error('✗ Camera connection test failed:', error.message);
    }
  }, [activeHost, initializeCameraSettings]);

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const handleSettingChange = (key, value) => {
    setCameraSettings(prev => ({ ...prev, [key]: value }));

    // led_intensity is set only when "Set LED Intensity" button is clicked
    if (key === 'led_intensity') return;
    
    console.log("key", key)
    console.log("value", value)
    updateConfig(key, value);
  };

  const toggleStream = () => {
    if (isStreaming) {
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
    }
  };

  const captureStill = async () => {
    try {
      setStillImageUrl(`${activeHost}/capture?_cb=${Date.now()}`);
      setShowStillImage(true);
    } catch (error) {
      console.error('Failed to capture still:', error);
    }
  };

  const setLEDIntensity = () => {
    updateConfig('led_intensity', cameraSettings.led_intensity);
  };

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

  const Toggle = ({ id, label, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-slate-300 text-xs sm:text-sm font-medium">
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        size="medium"
      />
    </div>
  );

  const Slider = ({ id, label, value, min, max, onChange }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isDragging, setIsDragging] = useState(false);

    // 同步外部值變化（僅在非拖拉狀態時）
    useEffect(() => {
      if (!isDragging) {
        setLocalValue(value);
      }
    }, [value, isDragging]);

    const handleChange = (event, newValue) => {
      // 拖拉期間：只更新本地狀態，不觸發全域更新
      setLocalValue(newValue);
      if (!isDragging) {
        setIsDragging(true);
      }
    };

    const handleChangeCommitted = (event, newValue) => {
      // 拖拉完成：更新全域狀態
      setLocalValue(newValue);
      onChange(newValue);
      setIsDragging(false);
    };

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="text-slate-300 text-xs sm:text-sm font-medium">
            {label}
          </label>
          <span className="bg-amber-400 text-black px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-mono font-semibold min-w-[50px] sm:min-w-[60px] text-center">
            {localValue}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-slate-500 text-xs min-w-[15px] sm:min-w-[20px]">{min}</span>
          <MuiSlider
            id={id}
            value={localValue}
            min={min}
            max={max}
            onChange={handleChange}
            onChangeCommitted={handleChangeCommitted}
            sx={{ flex: 1 }}
          />
          <span className="text-slate-500 text-xs min-w-[15px] sm:min-w-[20px]">{max}</span>
        </div>
      </div>
    );
  };

  const CustomSelect = ({ id, label, value, options, onChange }) => (
    <div className="space-y-2">
      <label className="text-slate-300 text-xs sm:text-sm font-medium">
        {label}
      </label>
      <FormControl fullWidth size="small">
        <Select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: '#334155',
                border: '1px solid #475569',
                '& .MuiMenuItem-root': {
                  backgroundColor: '#334155',
                  color: '#e2e8f0',
                  '&:hover': {
                    backgroundColor: '#475569',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#eab308',
                    color: '#000000',
                    '&:hover': {
                      backgroundColor: '#eabb2eff',
                    },
                  },
                },
              },
            },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Connection Status */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 sm:gap-3 justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'disconnected' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`}></div>
                  <span className="text-white font-medium text-sm sm:text-base whitespace-nowrap">
                    {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'disconnected' ? 'Disconnected' :
                     'Connecting...'}
                  </span>
                  <span className="text-slate-400 text-xs sm:text-sm truncate min-w-0">
                    ({activeHost})
                  </span>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={testConnection}
                    className="px-2 py-1 sm:px-3 sm:py-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-xs sm:text-sm flex-shrink-0"
                  >
                    Test
                  </button>
                  {connectionStatus === 'connected' && (
                    <button
                      onClick={initializeCameraSettings}
                      className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-xs sm:text-sm flex-shrink-0"
                    >
                      Sync
                    </button>
                  )}
                </div>
              </div>
              {lastError && (
                <div className="mt-2 text-red-400 text-sm">
                  {lastError}
                </div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2 justify-between mb-2">
                    <span className="text-amber-400 text-sm font-medium">Troubleshooting</span>
                    <button
                      onClick={() => setShowHostConfig(!showHostConfig)}
                      className="text-amber-400 text-xs hover:text-amber-300 flex-shrink-0"
                    >
                      {showHostConfig ? 'Hide' : 'Configure Host'}
                    </button>
                  </div>
                  <div className="text-slate-300 text-xs space-y-1">
                    <div>• Check if camera server is running</div>
                    <div>• Verify IP address and port</div>
                    <div>• Check firewall settings</div>
                  </div>
                  {showHostConfig && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={customHost}
                        onChange={(e) => setCustomHost(e.target.value)}
                        placeholder="e.g., http://192.168.1.100:3000"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={() => {
                          if (customHost) {
                            window.location.reload();
                          }
                        }}
                        className="w-full px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-sm"
                      >
                        Use Custom Host
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          {/* Main Controls */}
          <ControlGroup title="Camera Controls" icon={Camera}>
            <Toggle
              id="camera_open"
              label="Camera Open"
              checked={cameraSettings.camera_open}
              onChange={(value) => handleSettingChange('camera_open', value)}
            />
            <Toggle
              id="light_bulb"
              label="Light Bulb"
              checked={cameraSettings.light_bulb}
              onChange={(value) => handleSettingChange('light_bulb', value)}
            />
            <CustomSelect
              id="framesize"
              label="Resolution"
              value={cameraSettings.framesize}
              options={[
                { value: '15', label: 'UXGA(1600x1200)' },
                { value: '14', label: 'SXGA(1280x1024)' },
                { value: '13', label: 'HD(1280x720)' },
                { value: '12', label: 'XGA(1024x768)' },
                { value: '11', label: 'SVGA(800x600)' },
                { value: '10', label: 'VGA(640x480)' },
                { value: '9', label: 'HVGA(480x320)' },
                { value: '8', label: 'CIF(400x296)' },
                { value: '6', label: 'QVGA(320x240)' },
                { value: '5', label: '240x240' },
                { value: '4', label: 'HQVGA(240x176)' },
                { value: '3', label: 'QCIF(176x144)' },
                { value: '2', label: '128x128' },
                { value: '1', label: 'QQVGA(160x120)' },
                { value: '0', label: '96x96' }
              ]}
              onChange={(value) => handleSettingChange('framesize', value)}
            />
            <Slider
              id="quality"
              label="Quality"
              value={cameraSettings.quality}
              min={4}
              max={63}
              onChange={(value) => handleSettingChange('quality', value)}
            />
          </ControlGroup>

          {/* Image Settings */}
          <ControlGroup title="Image Settings" icon={Sliders}>
            <Slider
              id="brightness"
              label="Brightness"
              value={cameraSettings.brightness}
              min={-2}
              max={2}
              onChange={(value) => handleSettingChange('brightness', value)}
            />
            <Slider
              id="contrast"
              label="Contrast"
              value={cameraSettings.contrast}
              min={-2}
              max={2}
              onChange={(value) => handleSettingChange('contrast', value)}
            />
            <Slider
              id="saturation"
              label="Saturation"
              value={cameraSettings.saturation}
              min={-2}
              max={2}
              onChange={(value) => handleSettingChange('saturation', value)}
            />
            <CustomSelect
              id="special_effect"
              label="Special Effect"
              value={cameraSettings.special_effect}
              options={[
                { value: '0', label: 'No Effect' },
                { value: '1', label: 'Negative' },
                { value: '2', label: 'Grayscale' },
                { value: '3', label: 'Red Tint' },
                { value: '4', label: 'Green Tint' },
                { value: '5', label: 'Blue Tint' },
                { value: '6', label: 'Sepia' }
              ]}
              onChange={(value) => handleSettingChange('special_effect', value)}
            />
          </ControlGroup>

          {/* LED Control */}
          <ControlGroup title="LED Control" icon={Zap}>
            <div className="space-y-2">
              <Slider
                id="led_intensity"
                label="LED Intensity"
                value={cameraSettings.led_intensity}
                min={0}
                max={255}
                onChange={(value) => handleSettingChange('led_intensity', value)}
              />
              <button
                onClick={setLEDIntensity}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-400 hover:from-amber-300 hover:to-amber-300 text-slate-900 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base mt-3 sm:mt-4 transition-all duration-200 shadow-lg hover:shadow-amber-400/25"
              >
                Set LED Intensity
              </button>
            </div>
          </ControlGroup>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={captureStill}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Capture Still</span>
            </button>
            <button
              onClick={toggleStream}
              className={`w-full ${isStreaming ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-red-500/25' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg hover:shadow-emerald-500/25'} text-white py-3 sm:py-4 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200`}
            >
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isStreaming ? 'Stop Stream' : 'Start Stream'}</span>
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-500 hover:to-slate-500 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg border border-slate-500/30"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <ControlGroup title="Auto White Balance" icon={Sun}>
                <Toggle
                  id="awb"
                  label="AWB"
                  checked={cameraSettings.awb}
                  onChange={(value) => handleSettingChange('awb', value)}
                />
                <Toggle
                  id="awb_gain"
                  label="AWB Gain"
                  checked={cameraSettings.awb_gain}
                  onChange={(value) => handleSettingChange('awb_gain', value)}
                />
                <CustomSelect
                  id="wb_mode"
                  label="WB Mode"
                  value={cameraSettings.wb_mode}
                  options={[
                    { value: '0', label: 'Auto' },
                    { value: '1', label: 'Sunny' },
                    { value: '2', label: 'Cloudy' },
                    { value: '3', label: 'Office' },
                    { value: '4', label: 'Home' }
                  ]}
                  onChange={(value) => handleSettingChange('wb_mode', value)}
                />
              </ControlGroup>

              <ControlGroup title="Exposure Control" icon={Eye}>
                <Toggle
                  id="aec"
                  label="AEC Sensor"
                  checked={cameraSettings.aec}
                  onChange={(value) => handleSettingChange('aec', value)}
                />
                <Toggle
                  id="aec2"
                  label="AEC DSP"
                  checked={cameraSettings.aec2}
                  onChange={(value) => handleSettingChange('aec2', value)}
                />
                <Slider
                  id="ae_level"
                  label="AE Level"
                  value={cameraSettings.ae_level}
                  min={-2}
                  max={2}
                  onChange={(value) => handleSettingChange('ae_level', value)}
                />
                <Slider
                  id="aec_value"
                  label="Exposure"
                  value={cameraSettings.aec_value}
                  min={0}
                  max={1200}
                  onChange={(value) => handleSettingChange('aec_value', value)}
                />
              </ControlGroup>

              <ControlGroup title="Gain Control" icon={BarChart}>
                <Toggle
                  id="agc"
                  label="AGC"
                  checked={cameraSettings.agc}
                  onChange={(value) => handleSettingChange('agc', value)}
                />
                <Slider
                  id="gainceiling"
                  label="Gain Ceiling"
                  value={cameraSettings.gainceiling}
                  min={0}
                  max={6}
                  onChange={(value) => handleSettingChange('gainceiling', value)}
                />
              </ControlGroup>

              <ControlGroup title="Image Processing" icon={Focus}>
                <Toggle
                  id="bpc"
                  label="BPC"
                  checked={cameraSettings.bpc}
                  onChange={(value) => handleSettingChange('bpc', value)}
                />
                <Toggle
                  id="wpc"
                  label="WPC"
                  checked={cameraSettings.wpc}
                  onChange={(value) => handleSettingChange('wpc', value)}
                />
                <Toggle
                  id="raw_gma"
                  label="Raw GMA"
                  checked={cameraSettings.raw_gma}
                  onChange={(value) => handleSettingChange('raw_gma', value)}
                />
                <Toggle
                  id="lenc"
                  label="Lens Correction"
                  checked={cameraSettings.lenc}
                  onChange={(value) => handleSettingChange('lenc', value)}
                />
              </ControlGroup>

              <ControlGroup title="Image Orientation" icon={RotateCcw}>
                <Toggle
                  id="hmirror"
                  label="H-Mirror"
                  checked={cameraSettings.hmirror}
                  onChange={(value) => handleSettingChange('hmirror', value)}
                />
                <Toggle
                  id="vflip"
                  label="V-Flip"
                  checked={cameraSettings.vflip}
                  onChange={(value) => handleSettingChange('vflip', value)}
                />
                <Toggle
                  id="dcw"
                  label="DCW (Downsize EN)"
                  checked={cameraSettings.dcw}
                  onChange={(value) => handleSettingChange('dcw', value)}
                />
                <Toggle
                  id="colorbar"
                  label="Color Bar"
                  checked={cameraSettings.colorbar}
                  onChange={(value) => handleSettingChange('colorbar', value)}
                />
              </ControlGroup>
            </div>
          )}
          </div>

          {/* Display Area - Two separate containers */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Stream Container */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-semibold text-base sm:text-lg">Live Stream</h3>
                <div className="flex gap-2">
                  {isStreaming && (
                    <button
                      onClick={() => setIsStreaming(false)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                    >
                      Stop Stream
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg sm:rounded-xl min-h-[200px] sm:min-h-[250px] md:min-h-[300px] p-2 sm:p-3 md:p-4 backdrop-blur-sm border border-slate-600/30">
                {isStreaming ? (
                  <div className="relative w-full h-full min-h-[180px] sm:min-h-[220px] md:min-h-[250px]">
                    <img
                      src={`${streamUrl}/stream`}
                      alt="Live stream"
                      className="w-full h-full object-contain rounded-lg"
                      crossOrigin="anonymous"
                    />
                    <a
                      href={`${streamUrl}/stream`}
                      download="stream_capture.jpg"
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-500 hover:bg-amber-600 text-black px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
                    >
                      Save
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-center text-slate-400 h-[180px] sm:h-[220px] md:h-[250px]">
                    <div>
                      <Monitor className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                      <h4 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Stream Not Active</h4>
                      <p className="text-xs sm:text-sm">Click "Start Stream" to begin live feed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Still Image Container */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-white font-semibold text-base sm:text-lg">Captured Images</h3>
                <div className="flex gap-2">
                  {showStillImage && (
                    <button
                      onClick={() => setShowStillImage(false)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg sm:rounded-xl min-h-[200px] sm:min-h-[250px] md:min-h-[300px] p-2 sm:p-3 md:p-4 backdrop-blur-sm border border-slate-600/30">
                {showStillImage ? (
                  <div className="relative w-full h-full min-h-[180px] sm:min-h-[220px] md:min-h-[250px]">
                    <img
                      src={stillImageUrl}
                      alt="Captured still"
                      className="w-full h-full object-contain rounded-lg"
                      crossOrigin="anonymous"
                    />
                    <a
                      href={stillImageUrl}
                      download="still_capture.jpg"
                      className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-amber-500 hover:bg-amber-600 text-black px-2 py-1 sm:px-3 sm:py-1 rounded text-xs font-medium transition-all duration-200 shadow-lg hover:shadow-amber-500/25"
                    >
                      Save
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-center text-slate-400 h-[180px] sm:h-[220px] md:h-[250px]">
                    <div>
                      <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 opacity-50" />
                      <h4 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No Captured Image</h4>
                      <p className="text-xs sm:text-sm">Click "Capture Still" to take a photo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;