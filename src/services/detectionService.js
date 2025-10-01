/**
 * Detection API Service
 * 處理所有檢測相關的 API 調用
 */

class DetectionApiService {
  constructor(baseHost) {
    this.baseHost = baseHost;
  }

  /**
   * 切換運動檢測
   */
  async toggleMotionDetection(enabled) {
    try {
      const response = await fetch(`${this.baseHost}/detection/motion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        return { success: true, enabled };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to toggle motion detection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取運動檢測資訊
   */
  async getMotionInfo() {
    try {
      const response = await fetch(`${this.baseHost}/motion/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching motion info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 設定運動檢測敏感度
   */
  async setMotionSensitivity(motionThreshold, alarmThreshold) {
    try {
      const response = await fetch(`${this.baseHost}/motion/sensitivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          motion_threshold: motionThreshold, 
          alarm_threshold: alarmThreshold
        })
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error setting motion sensitivity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 切換臉部檢測
   */
  async toggleFaceDetection(enabled) {
    try {
      const response = await fetch(`${this.baseHost}/detection/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        return { success: true, enabled };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取臉部檢測資訊
   */
  async getFaceInfo() {
    try {
      const response = await fetch(`${this.baseHost}/face/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching face info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 切換跨線檢測
   */
  async toggleCrosslineDetection(enabled) {
    try {
      const response = await fetch(`${this.baseHost}/detection/crossline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        return { success: true, enabled };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to toggle crossline detection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取跨線檢測資訊
   */
  async getCrosslineInfo() {
    try {
      const response = await fetch(`${this.baseHost}/crossline/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching crossline info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 同步線段到服務器
   */
  async syncLinesToServer(lines, imageWidth, imageHeight) {
    try {
      const realImageLines = lines.map(line => ({
        id: line.id,
        startX: Math.round(line.startX),
        startY: Math.round(line.startY),
        endX: Math.round(line.endX),
        endY: Math.round(line.endY),
        color: line.color
      }));

      const response = await fetch(`${this.baseHost}/crossline/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lines: realImageLines,
          image_width: imageWidth,
          image_height: imageHeight
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error syncing lines to server:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 切換 Pipeline 檢測
   */
  async togglePipelineDetection(enabled) {
    try {
      const response = await fetch(`${this.baseHost}/detection/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        return { success: true, enabled };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to toggle pipeline detection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取 Pipeline 檢測資訊
   */
  async getPipelineInfo() {
    try {
      const response = await fetch(`${this.baseHost}/pipeline/info`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching pipeline info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新基礎主機地址
   */
  updateBaseHost(newHost) {
    this.baseHost = newHost;
  }
}

export default DetectionApiService;