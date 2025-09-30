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
   * 獲取所有圖片列表
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
   * 獲取單張圖片
   */
  async getImage(filename) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseHost}/storage/image/${filename}`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const imageData = await response.json();
        console.log('✓ Image loaded successfully:', filename);
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
      const formattedTime = time.replace(/-/g, ':');
      return new Date(`${date}T${formattedTime}`);
    }
    return new Date(0); // fallback for invalid format
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