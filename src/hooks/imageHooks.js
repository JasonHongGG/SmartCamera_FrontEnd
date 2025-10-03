import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageApiService } from '../services/imageService';

export const useImageViewer = (detectionHost) => {
  const [allImages, setAllImages] = useState([]);
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
  const apiServiceRef = useRef(null);
  const loadedImagesRef = useRef(loadedImages); // 使用 ref 追蹤最新的 loadedImages
  const fullSizeImagesRef = useRef(fullSizeImages); // 使用 ref 追蹤最新的 fullSizeImages
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

  // Update pagination when allImages or itemsPerPage changes
  useEffect(() => {
    const total = Math.ceil(allImages.length / itemsPerPage);
    setTotalPages(total);
    
    // Reset to page 1 if current page exceeds total pages
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [allImages.length, itemsPerPage, currentPage]);

  // Load current page images when page changes
  useEffect(() => {
    const loadCurrentPageImages = async () => {
      if (allImages.length === 0) return;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageImages = allImages.slice(startIndex, endIndex);

      // 預載下一頁的圖片
      const nextPageStartIndex = endIndex;
      const nextPageEndIndex = nextPageStartIndex + itemsPerPage;
      const nextPageImages = allImages.slice(nextPageStartIndex, nextPageEndIndex);

      // 檢查哪些圖片還沒有載入完整數據
      const imagesToLoad = pageImages
        .filter(img => !loadedImagesRef.current.has(img.filename))
        .map(img => img.filename);

      // 預載下一頁（但不阻塞當前頁）
      const nextImagesToLoad = nextPageImages
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

          // 更新 loadedImages cache 並補充原始 metadata
          setLoadedImages(prev => {
            let newLoadedImages = new Map(prev);
            results.forEach(result => {
              if (result.success) {
                result.images.forEach(image => {
                  newLoadedImages.set(image.filename, image);
                  
                  // 同時更新 allImages 中對應項目的 metadata
                  setAllImages(prevAll => prevAll.map(item => {
                    if (item.filename === image.filename) {
                      return {
                        ...item,
                        image_size: item.image_size || image.image_size,
                        file_size: item.file_size || image.file_size,
                        type: item.type || image.type
                      };
                    }
                    return item;
                  }));
                });
              }
            });
            
            // 限制 cache 大小，保留當前頁和下一頁的圖片
            const keysToKeep = [...pageImages.map(img => img.filename), ...nextPageImages.map(img => img.filename)];
            newLoadedImages = limitCacheSize(newLoadedImages, keysToKeep);
            return newLoadedImages;
          });

          // 合併元數據和圖片數據 - 保留原始 metadata，補充缺失的資訊
          setImages(prevImages => {
            const newImages = pageImages.map(metadata => {
              const imageData = loadedImagesRef.current.get(metadata.filename) || results.find(r => r.success)?.images.find(img => img.filename === metadata.filename);
              if (imageData) {
                // 保留原始的 metadata，補充圖片 data 和缺失的資訊
                return {
                  ...metadata,
                  data: imageData.data,
                  type: imageData.type || metadata.type,
                  image_size: metadata.image_size || imageData.image_size,
                  file_size: metadata.file_size || imageData.file_size
                };
              }
              return metadata;
            });
            
            // 檢查是否真的需要更新 - 比較內容而不是引用
            if (prevImages.length === newImages.length) {
              const hasChanges = newImages.some((newImage, index) => {
                const prevImage = prevImages[index];
                return !prevImage || 
                       prevImage.filename !== newImage.filename || 
                       (!prevImage.data && newImage.data) ||
                       (prevImage.data !== newImage.data);
              });
              
              if (!hasChanges) {
                return prevImages; // 保持原有引用，避免重新渲染
              }
            }
            
            return newImages;
          });

          // 背景預載下一頁（不等待）(預覽尺寸)
          if (nextImagesToLoad.length > 0) {
            apiServiceRef.current.getBatchImages(nextImagesToLoad, PREVIEW_WIDTH).then(result => {
              if (result.success) {
                setLoadedImages(prev => {
                  let updated = new Map(prev);
                  result.images.forEach(image => {
                    updated.set(image.filename, image);
                  });
                  // 限制 cache 大小
                  const keysToKeep = [...pageImages.map(img => img.filename), ...nextPageImages.map(img => img.filename)];
                  updated = limitCacheSize(updated, keysToKeep);
                  return updated;
                });
              }
            }).catch(err => console.log('Preload next page failed:', err));
          }
        } catch (error) {
          console.error('Failed to load page images:', error);
        } finally {
          setPageLoading(false);
        }
      } else {
        // 所有圖片都已載入，確保 pageLoading 為 false
        setPageLoading(false);
        
        // 所有圖片都已載入，直接合併數據 - 但要檢查是否真的需要更新
        setImages(prevImages => {
          const mergedImages = pageImages.map(metadata => {
            const imageData = loadedImagesRef.current.get(metadata.filename);
            if (imageData) {
              // 保留原始的 metadata，補充圖片 data 和缺失的資訊
              return {
                ...metadata,
                data: imageData.data,
                type: imageData.type || metadata.type,
                image_size: metadata.image_size || imageData.image_size,
                file_size: metadata.file_size || imageData.file_size
              };
            }
            return metadata;
          });
          
          // 檢查是否真的需要更新 - 比較內容而不是引用
          if (prevImages.length === mergedImages.length) {
            const hasChanges = mergedImages.some((newImage, index) => {
              const prevImage = prevImages[index];
              return !prevImage || 
                     prevImage.filename !== newImage.filename || 
                     (!prevImage.data && newImage.data) ||
                     (prevImage.data !== newImage.data);
            });
            
            if (!hasChanges) {
              return prevImages; // 保持原有引用，避免重新渲染
            }
          }
          
          return mergedImages;
        });
        
        // 仍然預載下一頁 (預覽尺寸)
        if (nextImagesToLoad.length > 0) {
          apiServiceRef.current.getBatchImages(nextImagesToLoad, PREVIEW_WIDTH).then(result => {
            if (result.success) {
              setLoadedImages(prev => {
                let updated = new Map(prev);
                result.images.forEach(image => {
                  updated.set(image.filename, image);
                });
                // 限制 cache 大小
                const keysToKeep = [...pageImages.map(img => img.filename), ...nextPageImages.map(img => img.filename)];
                updated = limitCacheSize(updated, keysToKeep);
                return updated;
              });
            }
          }).catch(err => console.log('Preload next page failed:', err));
        }
      }
    };

    loadCurrentPageImages();
  }, [allImages, currentPage, itemsPerPage, limitCacheSize]); // 移除 loadedImages 依賴

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
    
    // If we have the full data, use it directly
    if (image.data) {
      return `data:image/${image.type};base64,${image.data}`;
    }
    
    // If we have cached data, use it
    const cachedImage = cache.get(cacheKey);
    if (cachedImage && cachedImage.data) {
      return `data:image/${cachedImage.type};base64,${cachedImage.data}`;
    }
    
    // Return a placeholder or trigger lazy loading
    return '';
  }, []);

  // Lazy load image when needed (preview or full size)
  const ensureImageLoaded = useCallback(async (image, fullSize = false) => {
    if (!image) return;
    
    const cache = fullSize ? fullSizeImagesRef.current : loadedImagesRef.current;
    const cacheKey = image.filename; // 統一使用 filename
    
    // 如果已經有數據或已經快取，直接返回
    if (image.data || cache.has(cacheKey)) {
      return;
    }
    
    const width = fullSize ? null : PREVIEW_WIDTH;
    await loadImageDetails(image.filename, width);
  }, [loadImageDetails, PREVIEW_WIDTH]);

  // Refresh images
  const refreshImages = useCallback(() => {
    setLoadedImages(new Map()); // Clear preview cache
    setFullSizeImages(new Map()); // Clear full-size cache
    loadImages();
  }, [loadImages]);

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

  // Auto-refresh on mount
  useEffect(() => {
    if (apiServiceRef.current) {
      loadImages();
    }
  }, [loadImages]);

  return {
    images,
    allImages,
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
    loadImages,
    loadImageDetails,
    refreshImages,
    toggleSortOrder,
    toggleViewMode,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeItemsPerPage,
    getImageDataUrl,
    ensureImageLoaded,
    apiService: apiServiceRef.current
  };
};