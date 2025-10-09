import React from 'react';
import { Camera, Sliders, Zap } from 'lucide-react';
import ControlGroup from './ControlGroup';
import Toggle from './Toggle';
import Slider from './Slider';
import CustomSelect from './CustomSelect';
import { useAuth } from '../../context/AuthContext';

const BasicControls = ({ cameraSettings, onSettingChange }) => {
  const { hasPermission } = useAuth();
  
  return (
    <ControlGroup title="Camera Controls" icon={Camera}>
      {hasPermission('camera', 'settings') && (
        <Toggle
          id="camera_open"
          label="Camera Open"
          checked={cameraSettings.camera_open}
          onChange={(value) => onSettingChange('camera_open', value)}
        />
      )}
      <Toggle
        id="light_bulb" 
        label="Light Bulb"
        checked={cameraSettings.light_bulb}
        onChange={(value) => onSettingChange('light_bulb', value)}
      />
      {hasPermission('camera', 'settings') && (
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
          onChange={(value) => onSettingChange('framesize', value)}
        />
      )}
      <Slider
        id="quality"
        label="Quality"
        value={cameraSettings.quality}
        min={4}
        max={63}
        onChange={(value) => onSettingChange('quality', value)}
      />
    </ControlGroup>
  );
};

const ImageSettings = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="Image Settings" icon={Sliders}>
      <Slider
        id="brightness"
        label="Brightness"
        value={cameraSettings.brightness}
        min={-2}
        max={2}
        onChange={(value) => onSettingChange('brightness', value)}
      />
      <Slider
        id="contrast"
        label="Contrast"
        value={cameraSettings.contrast}
        min={-2}
        max={2}
        onChange={(value) => onSettingChange('contrast', value)}
      />
      <Slider
        id="saturation"
        label="Saturation"
        value={cameraSettings.saturation}
        min={-2}
        max={2}
        onChange={(value) => onSettingChange('saturation', value)}
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
        onChange={(value) => onSettingChange('special_effect', value)}
      />
    </ControlGroup>
  );
};

const LEDControls = ({ cameraSettings, onSettingChange, onSetLEDIntensity }) => {
  return (
    <ControlGroup title="LED Control" icon={Zap}>
      <div className="space-y-2">
        <Slider
          id="led_intensity"
          label="LED Intensity"
          value={cameraSettings.led_intensity}
          min={0}
          max={255}
          onChange={(value) => onSettingChange('led_intensity', value)}
        />
        <button
          onClick={onSetLEDIntensity}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-400 hover:from-amber-300 hover:to-amber-300 text-slate-900 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base mt-3 sm:mt-4 transition-all duration-200 shadow-lg hover:shadow-amber-400/25"
        >
          Set LED Intensity
        </button>
      </div>
    </ControlGroup>
  );
};

export { BasicControls, ImageSettings, LEDControls };