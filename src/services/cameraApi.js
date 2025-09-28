/**
 * Camera API Service
 * 處理所有相機相關的 API 調用
 */

class CameraApiService {
  constructor(baseHost) {
    this.baseHost = baseHost;
  }

  /**
   * 更新相機配置
   */
  async updateConfig(key, value, retryCount = 3) {
    const timeout = 5000;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.baseHost}/control?var=${key}&val=${value}`, {
          signal: controller.signal,
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✓ Config updated: ${key}=${value}`);
          return { success: true };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`⚠ Attempt ${attempt}/${retryCount} failed for ${key}=${value}:`, error.message);
        
        if (attempt === retryCount) {
          console.error(`✗ All ${retryCount} attempts failed for ${key}=${value}`);
          return { success: false, error: error.message };
        }
        
        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * 測試連接
   */
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseHost}/status`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { connected: true, status: 'connected' };
      } else {
        return { connected: false, status: 'disconnected', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { connected: false, status: 'disconnected', error: error.message };
    }
  }

  /**
   * 更新基礎主機地址
   */
  updateBaseHost(newHost) {
    this.baseHost = newHost;
  }
}

export default CameraApiService;