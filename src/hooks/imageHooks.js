import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageApiService } from '../services/imageService';

export const useImageViewer = (detectionHost) => {
  const [allImages, setAllImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]); // 篩選後的圖片
  const [images, setImages] = useState([]); // Current page images
  const [loadedImages, setLoadedImages] = useState(new Map()); // Cache for loaded image data (preview size)
  const [fullSizeImages, setFullSizeImages] = useState(new Map()); // Cache for full-size images
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // Loading state for current page
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 每頁顯示圖片數量
  const [totalPages, setTotalPages] = useState(0);
  const [dateFilter, setDateFilter] = useState(null); // 日期篩選 (Date 物件或 null)
  const [faceNameFilter, setFaceNameFilter] = useState(null); // 人名篩選 (string 或 null)
  const [availableFaceNames, setAvailableFaceNames] = useState([]); // 可用的人名列表
  const [lockedImages, setLockedImages] = useState(new Set()); // 鎖定的圖片檔名集合
  const apiServiceRef = useRef(null);
  const loadedImagesRef = useRef(loadedImages); // 使用 ref 追蹤最新的 loadedImages
  const fullSizeImagesRef = useRef(fullSizeImages); // 使用 ref 追蹤最新的 fullSizeImages
  const previousFiltersRef = useRef({ dateFilter: null, faceNameFilter: null }); // 追蹤篩選條件變化
  const MAX_CACHE_SIZE = 50; // 最多快取 50 張圖片
  const PREVIEW_WIDTH = 400; // 預覽圖片寬度

  // 同步 ref 與 state
  useEffect(() => {
    loadedImagesRef.current = loadedImages;
  }, [loadedImages]);

  useEffect(() => {
    fullSizeImagesRef.current = fullSizeImages;
  }, [fullSizeImages]);

  // Helper: 限制 cache 大小，移除最舊的項目
  const limitCacheSize = useCallback((cache, keysToKeep = []) => {
    if (cache.size <= MAX_CACHE_SIZE) return cache;
    
    const newCache = new Map();
    const entries = Array.from(cache.entries());
    
    // 優先保留要保留的 keys
    keysToKeep.forEach(key => {
      if (cache.has(key)) {
        newCache.set(key, cache.get(key));
      }
    });
    
    // 然後從最新的開始保留到達到限制
    const remainingSlots = MAX_CACHE_SIZE - newCache.size;
    entries
      .filter(([key]) => !keysToKeep.includes(key))
      .slice(-remainingSlots)
      .forEach(([key, value]) => {
        newCache.set(key, value);
      });
    
    console.log(`🗑️ Cache trimmed: ${cache.size} → ${newCache.size} items`);
    return newCache;
  }, [MAX_CACHE_SIZE]);

  // Initialize API service
  useEffect(() => {
    if (detectionHost) {
      apiServiceRef.current = new ImageApiService(detectionHost);
    }
  }, [detectionHost]);

  // 載入人名列表
  useEffect(() => {
    const loadFaceNames = async () => {
      if (!detectionHost || !apiServiceRef.current) {
        console.log('⚠️ API service not initialized yet');
        return;
      }
      
      console.log('🔍 Loading face names from API...');
      
      // 從 /storage/images/facename API 載入所有系統能偵測的人名
      // 這些人名代表系統能識別的所有人，不管目前有沒有照片
      const result = await apiServiceRef.current.getAllFaceNames();
      
      console.log('Face names API result:', result);
      
      if (result.success && result.faceNames && result.faceNames.length > 0) {
        // 排序後設定為可用的人名列表
        const sortedFaceNames = [...result.faceNames].sort();
        console.log('✅ Available face names set to:', sortedFaceNames);
        setAvailableFaceNames(sortedFaceNames);
      } else {
        // API 沒有回傳人名，設定為空陣列
        console.log('⚠️ No face names returned from API or request failed');
        setAvailableFaceNames([]);
      }
    };

    loadFaceNames();
  }, [detectionHost]); // 當 detectionHost 變化時重新載入（也就是 API service 初始化完成時）

  // 載入鎖定的圖片列表
  const loadLockedImages = useCallback(async () => {
    if (!apiServiceRef.current) {
      return;
    }
    
    console.log('🔒 Loading locked images from API...');
    const result = await apiServiceRef.current.getLockedImages();
    
    if (result.success && result.lockedImages) {
      console.log('✅ Locked images loaded:', result.lockedImages.length);
      setLockedImages(new Set(result.lockedImages));
    } else {
      console.log('⚠️ No locked images or request failed');
      setLockedImages(new Set());
    }
  }, []);

  // 當 API service 初始化後載入鎖定圖片列表
  useEffect(() => {
    if (apiServiceRef.current) {
      loadLockedImages();
    }
  }, [detectionHost, loadLockedImages]);

  // 日期和人名篩選邏輯（合併）
  useEffect(() => {
    let filtered = allImages;
    
    // 日期篩選
    if (dateFilter) {
      filtered = filtered.filter(image => {
        const imageDate = extractDateFromFilename(image.filename);
        if (!imageDate) return false;
        
        // 比較日期（只比較年月日，忽略時間）- 使用本地時間避免時區問題
        const filterYear = dateFilter.getFullYear();
        const filterMonth = dateFilter.getMonth();
        const filterDay = dateFilter.getDate();
        
        const imageYear = imageDate.getFullYear();
        const imageMonth = imageDate.getMonth();
        const imageDay = imageDate.getDate();
        
        return filterYear === imageYear && filterMonth === imageMonth && filterDay === imageDay;
      });
    }
    
    // 人名篩選
    if (faceNameFilter) {
      filtered = filtered.filter(image => 
        image.face_names && 
        Array.isArray(image.face_names) && 
        image.face_names.includes(faceNameFilter)
      );
    }
    
    setFilteredImages(filtered);
    
    // 檢查篩選條件是否改變
    const filtersChanged = 
      previousFiltersRef.current.dateFilter !== dateFilter ||
      previousFiltersRef.current.faceNameFilter !== faceNameFilter;
    
    if (filtersChanged) {
      // 篩選條件改變，重置到第一頁
      setCurrentPage(1);
      previousFiltersRef.current = { dateFilter, faceNameFilter };
    } else {
      // 只是圖片數量改變（如刪除），保持當前頁或調整到有效頁
      const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages); // 跳到最後一頁
      }
    }
  }, [allImages, dateFilter, faceNameFilter, itemsPerPage, currentPage]);

  // Helper: 從檔名提取日期
  const extractDateFromFilename = (filename) => {
    const match = filename.match(/alarm_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
    if (match) {
      const [, date, time] = match;
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute, second] = time.split('-').map(Number);
      
      // 使用本地時間創建 Date 物件，避免時區問題
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return null;
  };

  // Update pagination when filteredImages or itemsPerPage changes
  useEffect(() => {
    const total = Math.ceil(filteredImages.length / itemsPerPage);
    setTotalPages(total);
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredImages.length, itemsPerPage, currentPage]);

  // Load current page images when page changes
  useEffect(() => {
    const loadCurrentPageImages = async () => {
      // 如果沒有圖片，清空 images 並返回
      if (filteredImages.length === 0) {
        setImages([]);
        setPageLoading(false);
        return;
      }

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageImages = filteredImages.slice(startIndex, endIndex);

      // 預載下一頁的圖片
      const nextPageStartIndex = endIndex;
      const nextPageEndIndex = nextPageStartIndex + itemsPerPage;
      const nextPageImages = filteredImages.slice(nextPageStartIndex, nextPageEndIndex);

      // 檢查哪些圖片還沒有載入完整數據
      const imagesToLoad = pageImages
        .filter(img => !loadedImagesRef.current.has(img.filename))
        .map(img => img.filename);

      if (imagesToLoad.length > 0) {
        setPageLoading(true);
        
        try {
          // 使用更小的批次大小來加快初始載入
          const batchSize = 5;
          const batches = [];
          for (let i = 0; i < imagesToLoad.length; i += batchSize) {
            batches.push(imagesToLoad.slice(i, i + batchSize));
          }

          // 並發載入多個批次 (預覽尺寸)
          const results = await Promise.all(
            batches.map(batch => apiServiceRef.current.getBatchImages(batch, PREVIEW_WIDTH))
          );

          // 先建立新的 loadedImages Map
          const newLoadedImages = new Map(loadedImagesRef.current);
          results.forEach(result => {
            if (result.success) {
              result.images.forEach(image => {
                // 直接存入快取，包含 data, type, image_size, file_size
                newLoadedImages.set(image.filename, image);
              });
            }
          });
          
          // 限制 cache 大小，保留當前頁和下一頁的圖片
          const keysToKeep = [...pageImages.map(img => img.filename), ...nextPageImages.map(img => img.filename)];
          const limitedLoadedImages = limitCacheSize(newLoadedImages, keysToKeep);
          
          // 更新 loadedImages cache
          setLoadedImages(limitedLoadedImages);

          // 合併 allImages 的 metadata 和 loadedImages 的圖片資料
          setImages(prevImages => {
            const newImages = pageImages.map(metadata => {
              // 使用剛建立的 limitedLoadedImages
              const imageData = limitedLoadedImages.get(metadata.filename);
              if (imageData) {
                // 合併: metadata (filename, face_names, timestamp, type) + imageData (data, image_size, file_size)
                return {
                  ...metadata,           // 來自 /storage/images/metadata
                  data: imageData.data,  // 來自 /storage/image/batch
                  image_size: imageData.image_size,
                  file_size: imageData.file_size
                };
              }
              return metadata; // 如果還沒載入，只回傳 metadata
            });
            
            // 檢查是否真的需要更新
            if (prevImages.length === newImages.length) {
              const hasChanges = newImages.some((newImage, index) => {
                const prevImage = prevImages[index];
                return !prevImage || 
                       prevImage.filename !== newImage.filename || 
                       (!prevImage.data && newImage.data) ||
                       (prevImage.data !== newImage.data);
              });
              
              if (!hasChanges) {
                return prevImages;
              }
            }
            
            return newImages;
          });

          // 預載下一頁（在當前頁載入完成後）
          if (nextPageImages.length > 0) {
            const nextImagesToLoad = nextPageImages.filter(img => 
              !loadedImagesRef.current.has(img.filename)
            );
            
            if (nextImagesToLoad.length > 0) {
              const filenamesToLoad = nextImagesToLoad.map(img => img.filename);
              console.log('Preload next page:', filenamesToLoad);
              apiServiceRef.current.getBatchImages(filenamesToLoad, PREVIEW_WIDTH).then(result => {
                if (result.success) {
                  setLoadedImages(prev => {
                    let updated = new Map(prev);
                    result.images.forEach(image => {
                      updated.set(image.filename, image);
                    });
                    const keysToKeep = [...pageImages.map(img => img.filename), ...nextPageImages.map(img => img.filename)];
                    updated = limitCacheSize(updated, keysToKeep);
                    return updated;
                  });
                }
              }).catch(err => console.log('Preload next page failed:', err));
            }
          }
        } catch (error) {
          console.error('Failed to load page images:', error);
        } finally {
          setPageLoading(false);
        }
      } else {
        // 所有圖片都已載入，確保 pageLoading 為 false
        setPageLoading(false);
        
        // 所有圖片都已載入，直接合併數據
        setImages(prevImages => {
          const mergedImages = pageImages.map(metadata => {
            const imageData = loadedImagesRef.current.get(metadata.filename);
            if (imageData) {
              // 合併: metadata (filename, face_names, timestamp, type) + imageData (data, image_size, file_size)
              return {
                ...metadata,           // 來自 /storage/images/metadata
                data: imageData.data,  // 來自 /storage/image/batch
                image_size: imageData.image_size,
                file_size: imageData.file_size
              };
            }
            return metadata; // 如果還沒載入，只回傳 metadata
          });
          
          // 檢查是否真的需要更新
          if (prevImages.length === mergedImages.length) {
            const hasChanges = mergedImages.some((newImage, index) => {
              const prevImage = prevImages[index];
              return !prevImage || 
                     prevImage.filename !== newImage.filename || 
                     (!prevImage.data && newImage.data) ||
                     (prevImage.data !== newImage.data);
            });
            
            if (!hasChanges) {
              return prevImages;
            }
          }
          
          return mergedImages;
        });
        
        // 不在這裡預載，統一移到外面
      }
    };

    loadCurrentPageImages();
  }, [filteredImages, currentPage, itemsPerPage, limitCacheSize]); // 使用 filteredImages 而非 allImages

  // Load all images metadata (without base64 data)
  const loadImages = useCallback(async () => {
    if (!apiServiceRef.current) return;

    setLoading(true);
    setError(null);

    // 只載入元數據列表，速度很快
    const result = await apiServiceRef.current.getImageMetadata();

    if (result.success) {
      let sortedImages = result.images;
      if (sortOrder === 'oldest') {
        sortedImages = [...result.images].reverse();
      }
      setAllImages(sortedImages);
      setCurrentPage(1); // Reset to first page
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [sortOrder]);

  // Load single image details with caching (preview size)
  const loadImageDetails = useCallback(async (filename, width = PREVIEW_WIDTH) => {
    if (!apiServiceRef.current) return null;

    // 決定使用哪個 cache 和 key
    const isFullSize = width === null;
    const cache = isFullSize ? fullSizeImagesRef.current : loadedImagesRef.current;
    const cacheKey = isFullSize ? filename : filename; // 預覽版本直接用 filename

    // Check if already loaded
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = await apiServiceRef.current.getImage(filename, width);
    if (result.success) {
      // Cache the loaded image
      if (isFullSize) {
        setFullSizeImages(prev => new Map(prev.set(cacheKey, result.image)));
      } else {
        setLoadedImages(prev => new Map(prev.set(cacheKey, result.image)));
      }
      return result.image;
    }
    return null;
  }, [PREVIEW_WIDTH]);

  // Get image data URL with lazy loading (preview or full size)
  const getImageDataUrl = useCallback((image, fullSize = false) => {
    if (!image) return '';
    
    // 決定使用哪個 cache
    const cache = fullSize ? fullSizeImagesRef.current : loadedImagesRef.current;
    const cacheKey = image.filename; // 統一使用 filename 作為 key
    
    // 優先使用對應 cache 中的數據
    const cachedImage = cache.get(cacheKey);
    if (cachedImage && cachedImage.data) {
      return `data:image/${cachedImage.type};base64,${cachedImage.data}`;
    }
    
    // 如果是預覽版本且 image.data 存在，使用它（批次載入的預覽版本）
    if (!fullSize && image.data) {
      return `data:image/${image.type};base64,${image.data}`;
    }
    
    // Return a placeholder or trigger lazy loading
    return '';
  }, []);

  // Lazy load image when needed (preview or full size)
  const ensureImageLoaded = useCallback(async (image, fullSize = false) => {
    if (!image) return;
    
    const cache = fullSize ? fullSizeImagesRef.current : loadedImagesRef.current;
    const cacheKey = image.filename; // 統一使用 filename
    
    // 檢查指定大小的快取是否存在
    if (cache.has(cacheKey)) {
      return; // 已經有對應大小的快取
    }
    
    // 如果是預覽尺寸且 image.data 已存在（可能是批次載入的預覽版本），直接返回
    if (!fullSize && image.data) {
      return;
    }
    
    // 載入對應大小的圖片
    const width = fullSize ? null : PREVIEW_WIDTH;
    await loadImageDetails(image.filename, width);
  }, [loadImageDetails, PREVIEW_WIDTH]);

  // Refresh images
  const refreshImages = useCallback(() => {
    setLoadedImages(new Map()); // Clear preview cache
    setFullSizeImages(new Map()); // Clear full-size cache
    loadImages();
    loadLockedImages(); // 重新載入鎖定狀態
  }, [loadImages, loadLockedImages]);

  // Delete single image
  const deleteImage = useCallback(async (filename) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.deleteImage(filename);
    
    if (result.success) {
      // 從所有列表和快取中移除圖片
      setAllImages(prev => prev.filter(img => img.filename !== filename));
      setLoadedImages(prev => {
        const newMap = new Map(prev);
        newMap.delete(filename);
        return newMap;
      });
      setFullSizeImages(prev => {
        const newMap = new Map(prev);
        newMap.delete(filename);
        return newMap;
      });
    }
    
    return result;
  }, []);

  // Delete multiple images
  const deleteImages = useCallback(async (filenames) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.deleteImages(filenames);
    
    if (result.success && result.deleted) {
      // 從所有列表和快取中移除成功刪除的圖片
      const deletedSet = new Set(result.deleted);
      setAllImages(prev => prev.filter(img => !deletedSet.has(img.filename)));
      setLoadedImages(prev => {
        const newMap = new Map(prev);
        result.deleted.forEach(filename => newMap.delete(filename));
        return newMap;
      });
      setFullSizeImages(prev => {
        const newMap = new Map(prev);
        result.deleted.forEach(filename => newMap.delete(filename));
        return newMap;
      });
    }
    
    return result;
  }, []);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  }, []);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  // Pagination functions
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Change items per page
  const changeItemsPerPage = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Set date filter
  const setDateFilterValue = useCallback((date) => {
    setDateFilter(date);
  }, []);

  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setDateFilter(null);
  }, []);

  // Set face name filter
  const setFaceNameFilterValue = useCallback((faceName) => {
    setFaceNameFilter(faceName);
  }, []);

  // Clear face name filter
  const clearFaceNameFilter = useCallback(() => {
    setFaceNameFilter(null);
  }, []);

  // Get unique dates from all images
  const getAvailableDates = useCallback(() => {
    const dateSet = new Set();
    allImages.forEach(image => {
      const date = extractDateFromFilename(image.filename);
      if (date) {
        // 使用本地時間格式化日期，避免 toISOString() 的 UTC 轉換
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        dateSet.add(dateStr);
      }
    });
    return Array.from(dateSet).sort().reverse(); // 最新的日期在前
  }, [allImages]);

  // Check if motion version exists for an image
  const checkMotionImageExists = useCallback(async (filename) => {
    if (!apiServiceRef.current) return false;
    
    const result = await apiServiceRef.current.checkMotionImageExists(filename);
    return result.success && result.exists;
  }, []);

  // Load motion version of an image
  const loadMotionImage = useCallback(async (filename) => {
    if (!apiServiceRef.current) {
      return { success: false, error: 'API service not initialized' };
    }
    
    const result = await apiServiceRef.current.getMotionImage(filename);
    return result;
  }, []);

  // Lock images
  const lockImages = useCallback(async (filenames) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.lockImages(filenames);
    
    if (result.success && result.locked) {
      // 更新 lockedImages state
      setLockedImages(prev => {
        const newSet = new Set(prev);
        result.locked.forEach(filename => newSet.add(filename));
        return newSet;
      });
    }
    
    return result;
  }, []);

  // Unlock images
  const unlockImages = useCallback(async (filenames) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.unlockImages(filenames);
    
    if (result.success && result.unlocked) {
      // 更新 lockedImages state
      setLockedImages(prev => {
        const newSet = new Set(prev);
        result.unlocked.forEach(filename => newSet.delete(filename));
        return newSet;
      });
    }
    
    return result;
  }, []);

  // Batch delete by date range
  const batchDeleteByDateRange = useCallback(async (startDate, endDate) => {
    if (!apiServiceRef.current) return { success: false, error: 'API service not initialized' };

    const result = await apiServiceRef.current.batchDeleteByDateRange(startDate, endDate);
    
    if (result.success && result.deleted) {
      // 從所有列表和快取中移除成功刪除的圖片
      const deletedSet = new Set(result.deleted);
      setAllImages(prev => prev.filter(img => !deletedSet.has(img.filename)));
      setLoadedImages(prev => {
        const newMap = new Map(prev);
        result.deleted.forEach(filename => newMap.delete(filename));
        return newMap;
      });
      setFullSizeImages(prev => {
        const newMap = new Map(prev);
        result.deleted.forEach(filename => newMap.delete(filename));
        return newMap;
      });
    }
    
    return result;
  }, []);

  // Auto-refresh on mount
  useEffect(() => {
    if (apiServiceRef.current) {
      loadImages();
    }
  }, [loadImages]);

  return {
    images,
    allImages,
    filteredImages,
    loadedImages,
    fullSizeImages,
    loading,
    pageLoading,
    error,
    viewMode,
    sortOrder,
    currentPage,
    totalPages,
    itemsPerPage,
    dateFilter,
    faceNameFilter,
    availableFaceNames,
    lockedImages,
    loadImages,
    loadImageDetails,
    refreshImages,
    deleteImage,
    deleteImages,
    lockImages,
    unlockImages,
    batchDeleteByDateRange,
    toggleSortOrder,
    toggleViewMode,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeItemsPerPage,
    setDateFilterValue,
    clearDateFilter,
    setFaceNameFilterValue,
    clearFaceNameFilter,
    getAvailableDates,
    getImageDataUrl,
    ensureImageLoaded,
    checkMotionImageExists,
    loadMotionImage,
    apiService: apiServiceRef.current
  };
};