/**
 * 應用程式常量定義
 */

// API 端點
export const API_ENDPOINTS = {
  CAMERA: {
    CONTROL: '/control',
    STATUS: '/status',
    CAPTURE: '/capture'
  },
  DETECTION: {
    MOTION: '/detection/motion',
    FACE: '/detection/face',
    CROSSLINE: '/detection/crossline'
  },
  INFO: {
    MOTION: '/motion/info',
    FACE: '/face/info',
    CROSSLINE: '/crossline/info'
  },
  STREAMS: {
    MOTION: '/motion/stream',
    FACE: '/face/stream',
    CROSSLINE: '/crossline/stream'
  },
  SENSITIVITY: '/motion/sensitivity',
  CROSSLINE_LINES: '/crossline/lines'
};

// 預設配置
export const DEFAULT_CONFIG = {
  CAMERA_HOST: "http://140.116.6.62:3000",
  DETECTION_HOST: "/api",
  STREAM_HOST: "http://140.116.6.62:3001"
};

// 敏感度預設值
export const SENSITIVITY_PRESETS = {
  LOW: {
    motionThreshold: 8000,
    alarmThreshold: 10
  },
  MEDIUM: {
    motionThreshold: 10000,
    alarmThreshold: 20
  },
  HIGH: {
    motionThreshold: 15000,
    alarmThreshold: 40
  }
};

// 輪詢間隔（毫秒）
export const POLLING_INTERVALS = {
  DETECTION_INFO: 1000,
  CONNECTION_TEST: 5000
};

// 操作狀態
export const OPERATION_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// 檢測狀態
export const DETECTION_STATUS = {
  INACTIVE: 'Inactive',
  INITIALIZING: 'Initializing...',
  ACTIVE_MONITORING: 'Active - Monitoring',
  ACTIVE_SCANNING: 'Active - Scanning'
};

// 相機設定範圍
export const CAMERA_RANGES = {
  QUALITY: { min: 4, max: 63 },
  BRIGHTNESS: { min: -2, max: 2 },
  CONTRAST: { min: -2, max: 2 },
  SATURATION: { min: -2, max: 2 },
  AE_LEVEL: { min: -2, max: 2 },
  AEC_VALUE: { min: 0, max: 1200 },
  GAINCEILING: { min: 0, max: 6 },
  LED_INTENSITY: { min: 0, max: 255 }
};

// 解析度選項
export const FRAME_SIZE_OPTIONS = [
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
];

// 錯誤訊息
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Connection failed',
  TIMEOUT: 'Request timeout',
  INVALID_RESPONSE: 'Invalid response from server',
  NETWORK_ERROR: 'Network error occurred'
};