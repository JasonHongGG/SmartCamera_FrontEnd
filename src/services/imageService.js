// Image storage service
class ImageApiService {
  constructor(baseHost) {
    this.baseHost = baseHost;
    this.timeout = 10000;
  }

  updateBaseHost(newHost) {
    this.baseHost = newHost;
  }

  /**
   * 獲取所有圖片列表 (包含完整數據)
   */
  async getAllImages() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseHost}/storage/images`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const images = await response.json();
        console.log('✓ Images loaded successfully:', images.length);
        return { success: true, images: this.sortImagesByDate(images) };
      } else {
        console.warn(`⚠ Failed to load images: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error('✗ Failed to load images:', error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 獲取圖片列表元數據 (包含人臉識別資訊)
   */
  async getImageMetadata() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseHost}/storage/images/metadata`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const metadata = await response.json();
        console.log('✓ Image metadata loaded successfully:', metadata.length);
        
        // 後端只回傳 filename 和 facenames (注意：後端是全小寫無底線)
        // 前端需要自己計算 timestamp 和 type
        const enrichedMetadata = metadata.map(item => ({
          filename: item.filename,
          face_names: item.facenames || [],  // 後端欄位是 facenames，前端統一為 face_names
          timestamp: this.extractTimeFromFilename(item.filename),  // 前端計算
          type: this.getTypeFromFilename(item.filename)  // 前端計算
        }));
        
        return { success: true, images: this.sortImagesByDate(enrichedMetadata) };
      } else {
        console.warn(`⚠ Failed to load metadata: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error('✗ Failed to load image metadata:', error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 獲取所有人名列表
   */
  async getAllFaceNames() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseHost}/storage/images/facename`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const faceNames = await response.json();
        console.log('✓ Face names loaded successfully:', faceNames.length);
        return { success: true, faceNames };
      } else {
        console.warn(`⚠ Failed to load face names: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error('✗ Failed to load face names:', error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 批次獲取圖片數據
   * @param {string[]} filenames - 圖片檔名陣列
   * @param {number|null} width - 目標寬度，null 為原始大小
   */
  async getBatchImages(filenames, width = null) {
    try {
      // 根據圖片數量動態調整 timeout
      const timeoutDuration = Math.max(this.timeout, filenames.length * 500);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      // 準備請求 body
      const requestBody = { filenames };
      if (width !== null) {
        requestBody.width = width;
      }

      // 使用 POST 方法發送 JSON body
      const response = await fetch(`${this.baseHost}/storage/image/batch`, {
        signal: controller.signal,
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const images = await response.json();
        const sizeInfo = width ? ` (${width}px width)` : ' (original size)';
        console.log(`✓ Batch loaded ${images.length}/${filenames.length} images${sizeInfo}`);
        return { success: true, images };
      } else {
        console.warn(`⚠ Failed to load batch images: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error('✗ Failed to load batch images:', error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Batch load timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 獲取單張圖片
   * @param {string} filename - 圖片檔名
   * @param {number|null} width - 目標寬度，null 為原始大小
   */
  async getImage(filename, width = null) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // 構建 URL，如果有 width 參數則加入 query string
      let url = `${this.baseHost}/storage/image/${filename}`;
      if (width !== null) {
        url += `?width=${width}`;
      }

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const imageData = await response.json();
        const sizeInfo = width ? ` (${width}px width)` : ' (original size)';
        console.log(`✓ Image loaded successfully: ${filename}${sizeInfo}`);
        return { success: true, image: imageData };
      } else {
        console.warn(`⚠ Failed to load image ${filename}: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error(`✗ Failed to load image ${filename}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 刪除單個圖片
   * @param {string} filename - 要刪除的圖片檔名
   */
  async deleteImage(filename) {
    // 使用批量刪除 API 來刪除單個圖片
    return this.deleteImages([filename]);
  }

  /**
   * 批量刪除圖片
   * @param {string[]} filenames - 要刪除的圖片檔名陣列
   */
  async deleteImages(filenames) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseHost}/storage/images/delete`, {
        signal: controller.signal,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          confirm: true,
          filenames: filenames
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log(`✓ Images deleted successfully:`, result);
        
        // 如果是單個圖片，返回簡化格式以保持向後兼容
        if (filenames.length === 1) {
          return { 
            success: result.deleted_count > 0, 
            filename: filenames[0],
            message: result.deleted_count > 0 ? 'Image deleted successfully' : 'Image not found'
          };
        }
        
        // 批量刪除返回完整結果
        return { 
          success: true, 
          deleted: result.deleted,
          failed: result.failed,
          deleted_count: result.deleted_count,
          failed_count: result.failed_count
        };
      } else {
        console.warn(`⚠ Failed to delete images: ${response.status}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      console.error(`✗ Failed to delete images:`, error.message);
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Delete request timed out';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${this.baseHost}`;
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 根據檔名中的時間戳排序圖片 (最新的在前)
   */
  sortImagesByDate(images) {
    return images.sort((a, b) => {
      const timeA = this.extractTimeFromFilename(a.filename);
      const timeB = this.extractTimeFromFilename(b.filename);
      return new Date(timeB) - new Date(timeA);
    });
  }

  /**
   * 從檔名中提取時間戳
   * 格式: alarm_2025-09-28_21-42-51
   */
  extractTimeFromFilename(filename) {
    const match = filename.match(/alarm_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
    if (match) {
      const [, date, time] = match;
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute, second] = time.split('-').map(Number);
      
      // 使用本地時間創建 Date 物件，避免時區問題
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return new Date(0); // fallback for invalid format
  
  }

  /**
   * 從檔名中提取檔案類型
   */
  getTypeFromFilename(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const typeMap = {
      'jpg': 'jpeg',
      'jpeg': 'jpeg',
      'png': 'png',
      'gif': 'gif',
      'bmp': 'bmp'
    };
    return typeMap[extension] || 'jpeg';
  }

  /**
   * 格式化時間顯示
   */
  formatDateTime(filename) {
    const date = this.extractTimeFromFilename(filename);
    if (date.getTime() === 0) return filename;
    
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
}

export { ImageApiService };