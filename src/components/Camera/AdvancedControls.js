import React from 'react';
import { Sun, Eye, Focus, RotateCcw, BarChart } from 'lucide-react';
import ControlGroup from './ControlGroup';
import Toggle from './Toggle';
import Slider from './Slider';
import CustomSelect from './CustomSelect';

const WhiteBalanceControls = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="White Balance" icon={Sun}>
      <Toggle
        id="awb"
        label="Auto White Balance"
        checked={cameraSettings.awb}
        onChange={(value) => onSettingChange('awb', value)}
      />
      <Toggle
        id="awb_gain"
        label="AWB Gain"
        checked={cameraSettings.awb_gain}
        onChange={(value) => onSettingChange('awb_gain', value)}
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
        onChange={(value) => onSettingChange('wb_mode', value)}
      />
    </ControlGroup>
  );
};

const ExposureControls = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="Exposure Control" icon={Eye}>
      <Toggle
        id="aec"
        label="AEC Sensor"
        checked={cameraSettings.aec}
        onChange={(value) => onSettingChange('aec', value)}
      />
      <Toggle
        id="aec2"
        label="AEC DSP"
        checked={cameraSettings.aec2}
        onChange={(value) => onSettingChange('aec2', value)}
      />
      <Slider
        id="ae_level"
        label="AE Level"
        value={cameraSettings.ae_level}
        min={-2}
        max={2}
        onChange={(value) => onSettingChange('ae_level', value)}
      />
      <Slider
        id="aec_value"
        label="Exposure"
        value={cameraSettings.aec_value}
        min={0}
        max={1200}
        onChange={(value) => onSettingChange('aec_value', value)}
      />
    </ControlGroup>
  );
};

const GainControls = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="Gain Control" icon={BarChart}>
      <Toggle
        id="agc"
        label="AGC"
        checked={cameraSettings.agc}
        onChange={(value) => onSettingChange('agc', value)}
      />
      <Slider
        id="gainceiling"
        label="Gain Ceiling"
        value={cameraSettings.gainceiling}
        min={0}
        max={6}
        onChange={(value) => onSettingChange('gainceiling', value)}
      />
    </ControlGroup>
  );
};

const ImageProcessingControls = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="Image Processing" icon={Focus}>
      <Toggle
        id="bpc"
        label="BPC"
        checked={cameraSettings.bpc}
        onChange={(value) => onSettingChange('bpc', value)}
      />
      <Toggle
        id="wpc"
        label="WPC"
        checked={cameraSettings.wpc}
        onChange={(value) => onSettingChange('wpc', value)}
      />
      <Toggle
        id="raw_gma"
        label="Raw GMA"
        checked={cameraSettings.raw_gma}
        onChange={(value) => onSettingChange('raw_gma', value)}
      />
      <Toggle
        id="lenc"
        label="Lens Correction"
        checked={cameraSettings.lenc}
        onChange={(value) => onSettingChange('lenc', value)}
      />
    </ControlGroup>
  );
};

const OrientationControls = ({ cameraSettings, onSettingChange }) => {
  return (
    <ControlGroup title="Image Orientation" icon={RotateCcw}>
      <Toggle
        id="hmirror"
        label="H-Mirror"
        checked={cameraSettings.hmirror}
        onChange={(value) => onSettingChange('hmirror', value)}
      />
      <Toggle
        id="vflip"
        label="V-Flip"
        checked={cameraSettings.vflip}
        onChange={(value) => onSettingChange('vflip', value)}
      />
      <Toggle
        id="dcw"
        label="DCW (Downsize EN)"
        checked={cameraSettings.dcw}
        onChange={(value) => onSettingChange('dcw', value)}
      />
      <Toggle
        id="colorbar"
        label="Color Bar"
        checked={cameraSettings.colorbar}
        onChange={(value) => onSettingChange('colorbar', value)}
      />
    </ControlGroup>
  );
};

export { 
  WhiteBalanceControls, 
  ExposureControls, 
  GainControls, 
  ImageProcessingControls, 
  OrientationControls 
};