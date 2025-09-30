import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageApiService } from '../services/imageService';

export const useImageViewer = (detectionHost) => {
  const [allImages, setAllImages] = useState([]);
  const [images, setImages] = useState([]); // Current page images
  const [loadedImages, setLoadedImages] = useState(new Map()); // Cache for loaded image data
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // Loading state for current page
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 每頁顯示圖片數量
  const [totalPages, setTotalPages] = useState(0);
  const apiServiceRef = useRef(null);

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

      // 檢查哪些圖片還沒有載入完整數據
      const imagesToLoad = pageImages
        .filter(img => !loadedImages.has(img.filename))
        .map(img => img.filename);

      if (imagesToLoad.length > 0) {
        setPageLoading(true);
        
        try {
          const result = await apiServiceRef.current.getBatchImages(imagesToLoad);
          if (result.success) {
            // 更新 loadedImages cache
            const newLoadedImages = new Map(loadedImages);
            result.images.forEach(image => {
              newLoadedImages.set(image.filename, image);
            });
            setLoadedImages(newLoadedImages);

            // 合併元數據和圖片數據
            const mergedImages = pageImages.map(metadata => {
              const imageData = newLoadedImages.get(metadata.filename);
              return imageData ? { ...metadata, ...imageData } : metadata;
            });
            setImages(mergedImages);
          }
        } catch (error) {
          console.error('Failed to load page images:', error);
        } finally {
          setPageLoading(false);
        }
      } else {
        // 所有圖片都已載入，直接合併數據
        const mergedImages = pageImages.map(metadata => {
          const imageData = loadedImages.get(metadata.filename);
          return imageData ? { ...metadata, ...imageData } : metadata;
        });
        setImages(mergedImages);
      }
    };

    loadCurrentPageImages();
  }, [allImages, currentPage, itemsPerPage, loadedImages]);

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

  // Load single image details with caching
  const loadImageDetails = useCallback(async (filename) => {
    if (!apiServiceRef.current) return null;

    // Check if already loaded
    if (loadedImages.has(filename)) {
      return loadedImages.get(filename);
    }

    const result = await apiServiceRef.current.getImage(filename);
    if (result.success) {
      // Cache the loaded image
      setLoadedImages(prev => new Map(prev.set(filename, result.image)));
      return result.image;
    }
    return null;
  }, [loadedImages]);

  // Get image data URL with lazy loading
  const getImageDataUrl = useCallback((image) => {
    if (!image) return '';
    
    // If we have the full data, use it directly
    if (image.data) {
      return `data:image/${image.type};base64,${image.data}`;
    }
    
    // If we have cached data, use it
    const cachedImage = loadedImages.get(image.filename);
    if (cachedImage && cachedImage.data) {
      return `data:image/${cachedImage.type};base64,${cachedImage.data}`;
    }
    
    // Return a placeholder or trigger lazy loading
    return '';
  }, [loadedImages]);

  // Lazy load image when needed
  const ensureImageLoaded = useCallback(async (image) => {
    if (!image || image.data || loadedImages.has(image.filename)) {
      return;
    }
    
    await loadImageDetails(image.filename);
  }, [loadImageDetails, loadedImages]);

  // Refresh images
  const refreshImages = useCallback(() => {
    setLoadedImages(new Map()); // Clear cache
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