import { useState, useEffect, useCallback, useRef } from 'react';
import { ImageApiService } from '../services/imageService';

export const useImageViewer = (detectionHost) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const apiServiceRef = useRef(null);

  // Initialize API service
  useEffect(() => {
    if (detectionHost) {
      apiServiceRef.current = new ImageApiService(detectionHost);
    }
  }, [detectionHost]);

  // Load all images
  const loadImages = useCallback(async () => {
    if (!apiServiceRef.current) return;

    setLoading(true);
    setError(null);

    const result = await apiServiceRef.current.getAllImages();

    if (result.success) {
      let sortedImages = result.images;
      if (sortOrder === 'oldest') {
        sortedImages = [...result.images].reverse();
      }
      setImages(sortedImages);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [sortOrder]);

  // Load single image details
  const loadImageDetails = useCallback(async (filename) => {
    if (!apiServiceRef.current) return null;

    const result = await apiServiceRef.current.getImage(filename);
    return result.success ? result.image : null;
  }, []);

  // Refresh images
  const refreshImages = useCallback(() => {
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

  // Select image for detailed view
  const selectImage = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  // Clear selected image
  const clearSelection = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Format image data URL
  const getImageDataUrl = useCallback((image) => {
    if (!image || !image.data) return '';
    return `data:image/${image.type};base64,${image.data}`;
  }, []);

  // Auto-refresh on mount
  useEffect(() => {
    if (apiServiceRef.current) {
      loadImages();
    }
  }, [loadImages]);

  return {
    images,
    loading,
    error,
    selectedImage,
    viewMode,
    sortOrder,
    loadImages,
    loadImageDetails,
    refreshImages,
    toggleSortOrder,
    toggleViewMode,
    selectImage,
    clearSelection,
    getImageDataUrl,
    apiService: apiServiceRef.current
  };
};