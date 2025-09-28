// Camera API service layer
const CAMERA_DEFAULTS = {
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
};

class CameraApiService {
  constructor(baseHost) {
    this.baseHost = baseHost;
    this.timeout = 5000;
  }

  updateBaseHost(newHost) {
    this.baseHost = newHost;
  }

  async updateConfig(key, value, retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        console.log(`Sending request to ${this.baseHost}/control?var=${key}&val=${value}`);
        const response = await fetch(`${this.baseHost}/control?var=${key}&val=${value}`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✓ Updated ${key} to ${value}, status: ${response.status}`);
          return { success: true };
        } else {
          console.warn(`⚠ Server responded with status ${response.status} for ${key}=${value}`);
          return { success: false, error: `Server error: ${response.status}` };
        }
      } catch (error) {
        console.error(`✗ Attempt ${attempt}/${retryCount} failed for ${key}=${value}:`, error.message);
        
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
          errorMessage = `Request timed out after ${this.timeout}ms`;
        } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT') || error.message.includes('Failed to fetch')) {
          errorMessage = `Connection failed - Check if camera server is running at ${this.baseHost}`;
        }

        if (attempt === retryCount) {
          return { success: false, error: errorMessage };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async initializeCameraSettings() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseHost}/status`, {
        signal: controller.signal,
        method: 'GET',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('✓ Received camera status:', statusData);
        
        const mappedSettings = {
          camera_open: Boolean(statusData.camera_open),
          light_bulb: Boolean(statusData.light_bulb),
          framesize: String(statusData.framesize ?? 13),
          quality: statusData.quality ?? 10,
          brightness: statusData.brightness ?? 0,
          contrast: statusData.contrast ?? 0,
          saturation: statusData.saturation ?? 0,
          special_effect: String(statusData.special_effect ?? 0),
          awb: Boolean(statusData.awb),
          awb_gain: Boolean(statusData.awb_gain),
          wb_mode: String(statusData.wb_mode ?? 0),
          aec: Boolean(statusData.aec),
          aec2: Boolean(statusData.aec2),
          ae_level: statusData.ae_level ?? 0,  
          aec_value: statusData.aec_value ?? 204,
          agc: Boolean(statusData.agc),
          gainceiling: statusData.gainceiling ?? 0,
          bpc: Boolean(statusData.bpc),
          wpc: Boolean(statusData.wpc),
          raw_gma: Boolean(statusData.raw_gma),
          lenc: Boolean(statusData.lenc),
          hmirror: Boolean(statusData.hmirror),
          vflip: Boolean(statusData.vflip),
          dcw: Boolean(statusData.dcw),
          colorbar: Boolean(statusData.colorbar),
          led_intensity: statusData.led_intensity ?? 0
        };
        
        console.log('✓ Camera settings initialized:', mappedSettings);
        return { success: true, settings: mappedSettings };
      } else {
        console.warn(`⚠ Status request failed with status ${response.status}`);
        return { success: false, error: `Status request failed: ${response.status}` };
      }
    } catch (error) {
      console.error('✗ Failed to initialize camera settings:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.baseHost}/testConnection`, {
        signal: controller.signal,
        method: 'GET',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✓ Camera connection test successful');
        return { success: true };
      } else {
        console.warn(`⚠ Connection test failed with status ${response.status}`);
        return { success: false, error: `Connection test failed: ${response.status}` };
      }
    } catch (error) {
      console.error('✗ Connection test failed:', error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Connection test timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach camera server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  getCaptureUrl() {
    return `${this.baseHost}/capture?_cb=${Date.now()}`;
  }
}

export { CameraApiService, CAMERA_DEFAULTS };