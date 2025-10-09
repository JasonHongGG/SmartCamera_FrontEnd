import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Grid3X3, 
  List, 
  RefreshCw, 
  SortDesc, 
  SortAsc,
  X,
  Download,
  Trash2,
  Calendar,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play
} from 'lucide-react';
import { IconButton, Tooltip, Select, MenuItem, FormControl } from '@mui/material';
import { useImageViewer } from '../../hooks/imageHooks';
import { useAppConfig } from '../../context/AppConfigContext';
import { usePermission } from '../../hooks/usePermission';
import PermissionDialog from '../Common/PermissionDialog';
import ConfirmDialog from '../Common/ConfirmDialog';

const ImageViewer = () => {
  const { config } = useAppConfig();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenImageLoading, setFullscreenImageLoading] = useState(false);
  const [showMotionVersion, setShowMotionVersion] = useState(false); // 是否顯示 Motion 版本
  const [motionImageData, setMotionImageData] = useState(null); // Motion 圖片資料
  const [hasMotionVersion, setHasMotionVersion] = useState(false); // 是否有 Motion 版本
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    image: null
  });
  
  const {
    images,
    allImages,
    filteredImages,
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
    refreshImages,
    deleteImage,
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
    loadMotionImage
  } = useImageViewer(config.detectionHost);

  // 權限管理
  const { checkPermission, permissionDialog, closePermissionDialog } = usePermission();

  const formatDateTime = (filename) => {
    const match = filename.match(/alarm_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
    if (match) {
      const [, date, time] = match;
      const formattedTime = time.replace(/-/g, ':');
      const dateObj = new Date(`${date}T${formattedTime}`);
      return dateObj.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
    return filename;
  };

  const handleImageClick = (image) => {
    setFullscreenImage(image);
    setShowMotionVersion(false); // 重置為原始版本
    setMotionImageData(null);
    setHasMotionVersion(false);
    
    // 預載完整尺寸圖片
    setFullscreenImageLoading(true);
    ensureImageLoaded(image, true).finally(() => {
      setFullscreenImageLoading(false);
    });
    
    // 檢查是否有 Motion 版本
    checkMotionImageExists(image.filename).then(exists => {
      setHasMotionVersion(exists);
    });
  };

  // 切換 Motion 版本
  const toggleMotionVersion = async () => {
    if (!fullscreenImage) return;
    
    if (showMotionVersion) {
      // 切回原始版本
      setShowMotionVersion(false);
      setMotionImageData(null);
    } else {
      // 載入 Motion 版本
      if (!motionImageData) {
        setFullscreenImageLoading(true);
        const result = await loadMotionImage(fullscreenImage.filename);
        setFullscreenImageLoading(false);
        
        if (result.success && result.image) {
          setMotionImageData(result.image);
          setShowMotionVersion(true);
        } else {
          alert('無法載入 Motion 版本圖片');
        }
      } else {
        setShowMotionVersion(true);
      }
    }
  };

  // 全屏模式切換到下一張圖片
  const handleNextImage = () => {
    if (!fullscreenImage) return;
    
    const currentIndex = images.findIndex(img => img.filename === fullscreenImage.filename);
    if (currentIndex !== -1 && currentIndex < images.length - 1) {
      const nextImage = images[currentIndex + 1];
      setFullscreenImage(nextImage);
      setShowMotionVersion(false); // 重置為原始版本
      setMotionImageData(null);
      setHasMotionVersion(false);
      
      setFullscreenImageLoading(true);
      ensureImageLoaded(nextImage, true).finally(() => {
        setFullscreenImageLoading(false);
      });
      
      // 檢查新圖片是否有 Motion 版本
      checkMotionImageExists(nextImage.filename).then(exists => {
        setHasMotionVersion(exists);
      });
    }
  };

  // 全屏模式切換到上一張圖片
  const handlePrevImage = () => {
    if (!fullscreenImage) return;
    
    const currentIndex = images.findIndex(img => img.filename === fullscreenImage.filename);
    if (currentIndex > 0) {
      const prevImage = images[currentIndex - 1];
      setFullscreenImage(prevImage);
      setShowMotionVersion(false); // 重置為原始版本
      setMotionImageData(null);
      setHasMotionVersion(false);
      
      setFullscreenImageLoading(true);
      ensureImageLoaded(prevImage, true).finally(() => {
        setFullscreenImageLoading(false);
      });
      
      // 檢查新圖片是否有 Motion 版本
      checkMotionImageExists(prevImage.filename).then(exists => {
        setHasMotionVersion(exists);
      });
    }
  };

  // 鍵盤快捷鍵支援 (左右箭頭)
  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setFullscreenImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenImage, images]);

  const handleDownload = async (image) => {
    checkPermission('images', 'download', async () => {
      // 確保已載入完整尺寸圖片
      await ensureImageLoaded(image, true);
      
      // 下載時使用完整尺寸
      const link = document.createElement('a');
      link.href = getImageDataUrl(image, true) || getImageDataUrl(image, false); // fallback to preview if full not available
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleDelete = async (image) => {
    checkPermission('images', 'delete', async () => {
      // 顯示確認對話框
      setDeleteConfirmDialog({
        open: true,
        image: image
      });
    });
  };

  const confirmDelete = async () => {
    const image = deleteConfirmDialog.image;
    
    // 關閉確認對話框
    setDeleteConfirmDialog({
      open: false,
      image: null
    });

    if (!image) return;

    const result = await deleteImage(image.filename);
    
    if (result.success) {
      // 如果正在全屏模式下刪除，關閉全屏
      if (fullscreenImage && fullscreenImage.filename === image.filename) {
        setFullscreenImage(null);
      }
      
      // 顯示成功訊息（可選）
      console.log('✓ 圖片已刪除:', image.filename);
    } else {
      // 顯示錯誤訊息
      alert(`刪除失敗: ${result.error}`);
      console.error('✗ 刪除圖片失敗:', result.error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmDialog({
      open: false,
      image: null
    });
  };

  // Lazy loading image component with Intersection Observer
  const LazyImage = ({ image, alt, className, onClick }) => {
    // 智能初始化：如果已經有快取資料，直接使用
    const initialImageData = getImageDataUrl(image, false);
    const [imageData, setImageData] = useState(initialImageData);
    const [isLoading, setIsLoading] = useState(!initialImageData); // 如果有快取就不載入
    const [hasError, setHasError] = useState(false);
    const imgRef = React.useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [currentFilename, setCurrentFilename] = useState(initialImageData ? image.filename : '');

    // Intersection Observer for lazy loading
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect(); // 只觸發一次
            }
          });
        },
        {
          rootMargin: '200px', // 提前 200px 開始載入
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    // 當圖片進入視圖或檔名改變時才載入 (預覽尺寸)
    useEffect(() => {
      // 如果圖片檔名沒有變化，不需要重新載入
      if (currentFilename === image.filename) {
        // 但要檢查是否有新的快取資料
        const cachedUrl = getImageDataUrl(image, false);
        if (cachedUrl && cachedUrl !== imageData) {
          setImageData(cachedUrl);
          setIsLoading(false);
        }
        return;
      }

      // 新圖片或首次載入
      if (!isVisible && !getImageDataUrl(image, false)) return;

      const loadImage = async () => {
        try {
          setCurrentFilename(image.filename);
          
          // 先檢查是否已經有快取資料 (預覽尺寸)
          const cachedUrl = getImageDataUrl(image, false);
          if (cachedUrl) {
            setImageData(cachedUrl);
            setIsLoading(false);
            return;
          }

          setIsLoading(true);
          setHasError(false);
          await ensureImageLoaded(image, false); // 載入預覽尺寸
          const dataUrl = getImageDataUrl(image, false);
          setImageData(dataUrl);
        } catch (error) {
          console.error('Failed to load image:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };

      loadImage();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image.filename, isVisible, currentFilename, imageData]); // imageData 用於檢測更新

    if (hasError) {
      return (
        <div ref={imgRef} className={`${className} bg-slate-700/50 flex items-center justify-center`}>
          <div className="text-slate-400 text-xs text-center">
            <ImageIcon className="w-6 h-6 mx-auto mb-1" />
            載入失敗
          </div>
        </div>
      );
    }

    if (isLoading || !imageData) {
      return (
        <div ref={imgRef} className={`${className} bg-slate-700/50 flex items-center justify-center`}>
          <div className="text-slate-400 text-xs text-center">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
            載入中...
          </div>
        </div>
      );
    }

    return (
      <img
        ref={imgRef}
        src={imageData}
        alt={alt}
        className={className}
        onClick={onClick}
        loading="lazy"
      />
    );
  };

  // Full size image component for fullscreen modal
  const FullSizeImage = ({ image, alt, className, isLoading }) => {
    const [displayImageData, setDisplayImageData] = useState('');
    const [currentImageFilename, setCurrentImageFilename] = useState('');

    useEffect(() => {
      // 如果是新圖片，立即顯示可用的版本
      if (currentImageFilename !== image.filename) {
        setCurrentImageFilename(image.filename);
        
        // 立即檢查是否有可用的圖片（完整或預覽）
        const fullUrl = getImageDataUrl(image, true);
        const previewUrl = getImageDataUrl(image, false);
        
        if (fullUrl) {
          setDisplayImageData(fullUrl);
        } else if (previewUrl) {
          setDisplayImageData(previewUrl);
        } else {
          // 只有在完全沒有圖片資料時才顯示載入狀態
          setDisplayImageData('');
        }
        return;
      }

      // 同一張圖片，檢查是否有更好的版本可以顯示
      const fullUrl = getImageDataUrl(image, true);
      if (fullUrl && displayImageData !== fullUrl) {
        setDisplayImageData(fullUrl);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image.filename, displayImageData, currentImageFilename]); // getImageDataUrl 是穩定的函數引用

    if (!displayImageData) {
      return (
        <div className={`${className} bg-slate-700/50 flex items-center justify-center`}>
          <div className="text-slate-400 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            載入中...
          </div>
        </div>
      );
    }

    return (
      <img
        src={displayImageData}
        alt={alt}
        className={className}
      />
    );
  };

  const ImageCard = ({ image, isGrid = true }) => (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600/50 shadow-xl backdrop-blur-sm transition-all duration-200 hover:shadow-2xl hover:border-amber-500/30 cursor-pointer ${
      isGrid ? 'p-2 sm:p-3' : 'p-3 sm:p-4 flex items-center gap-3 sm:gap-4'
    }`}>
      <div className={`relative ${isGrid ? 'aspect-video' : 'flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20'} overflow-hidden rounded-lg bg-slate-700/50`}>
        <LazyImage
          image={image}
          alt={image.filename}
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          onClick={() => handleImageClick(image)}
        />
        <div 
          className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
          onClick={() => handleImageClick(image)}
        >
          <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
      
      <div className={`${isGrid ? 'mt-1.5 sm:mt-2' : 'flex-1 min-w-0'}`}>
        <div className={`flex items-center gap-2 ${isGrid ? 'flex-col items-start' : 'justify-between'}`}>
          <div className="flex items-center gap-1 sm:gap-2 text-amber-400 text-xs">
            <Calendar className="w-3 h-3" />
            <span className={isGrid ? 'text-xs' : 'text-xs sm:text-sm'}>{formatDateTime(image.filename)}</span>
          </div>
          {!isGrid && (
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image);
                }}
                className="p-1 bg-red-600/50 hover:bg-red-500/70 rounded transition-colors"
                title="刪除圖片"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(image);
                }}
                className="p-1 bg-slate-600/50 hover:bg-slate-500/70 rounded transition-colors"
                title="下載圖片"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          )}
        </div>
        
        <div className={`text-slate-300 text-xs ${isGrid ? 'mt-1' : 'mt-1'}`}>
          <div>尺寸: {image.image_size}</div>
          <div>大小: {image.file_size}</div>
        </div>
        
        {isGrid && (
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(image);
              }}
              className="flex-1 py-1.5 px-2 sm:py-1.5 sm:px-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 min-h-[28px] h-7"
            >
              <Trash2 className="w-3 h-3" />
              <span className="inline">刪除</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(image);
              }}
              className="flex-1 py-1.5 px-2 sm:py-1.5 sm:px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 min-h-[28px] h-7"
            >
              <Download className="w-3 h-3" />
              <span className="inline">下載</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100">
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-600/50 shadow-xl backdrop-blur-sm mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-lg sm:text-xl md:text-2xl truncate">警報圖片檢視器</h1>
                <p className="text-slate-300 text-xs sm:text-sm hidden sm:block">檢視偵測觸發時儲存的警報圖片</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Tooltip title={viewMode === 'grid' ? '切換到列表檢視' : '切換到網格檢視'}>
                <IconButton
                  onClick={toggleViewMode}
                  sx={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    '@media (min-width: 640px)': {
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      minHeight: '36px',
                    },
                    bgcolor: 'rgba(71, 85, 105, 0.5)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: 'rgba(71, 85, 105, 0.7)',
                    },
                  }}
                >
                  {viewMode === 'grid' ? 
                    <List style={{ width: '14px', height: '14px' }} /> : 
                    <Grid3X3 style={{ width: '14px', height: '14px' }} />
                  }
                </IconButton>
              </Tooltip>
              
              <Tooltip title={sortOrder === 'newest' ? '切換到最舊優先' : '切換到最新優先'}>
                <IconButton
                  onClick={toggleSortOrder}
                  sx={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    '@media (min-width: 640px)': {
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      minHeight: '36px',
                    },
                    bgcolor: 'rgba(71, 85, 105, 0.5)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: 'rgba(71, 85, 105, 0.7)',
                    },
                  }}
                >
                  {sortOrder === 'newest' ? 
                    <SortDesc style={{ width: '14px', height: '14px' }} /> : 
                    <SortAsc style={{ width: '14px', height: '14px' }} />
                  }
                </IconButton>
              </Tooltip>
              
              <Tooltip title="重新載入">
                <IconButton
                  onClick={refreshImages}
                  disabled={loading}
                  sx={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    '@media (min-width: 640px)': {
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      minHeight: '36px',
                    },
                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    borderRadius: '8px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: 'rgba(245, 158, 11, 0.3)',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      color: '#fbbf24',
                    },
                  }}
                >
                  <RefreshCw style={{ 
                    width: '14px', 
                    height: '14px',
                    animation: loading ? 'spin 1s linear infinite' : 'none'
                  }} />
                </IconButton>
              </Tooltip>

              {/* Date filter */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <FormControl size="small" sx={{ minWidth: '110px', width: { xs: '110px', sm: '140px' } }}>
                  <Select
                    value={dateFilter ? dateFilter.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        setDateFilterValue(new Date(value));
                      } else {
                        clearDateFilter();
                      }
                    }}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <div className="flex items-center gap-1 w-full overflow-hidden">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[12px] sm:text-xs truncate">所有日期</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1 w-full overflow-hidden">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="text-[12px] sm:text-xs truncate">{selected}</span>
                        </div>
                      );
                    }}
                    sx={{
                      minWidth: '110px',
                      width: { xs: '110px', sm: '140px' },
                      height: '32px',
                      backgroundColor: '#374151',
                      color: 'white',
                      fontSize: '0.75rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6b7280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#eab308',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                        fontSize: '18px', // 縮小箭頭圖示
                      },
                      '& .MuiSelect-select': {
                        paddingLeft: '6px',
                        paddingRight: '28px', // 減少右側空間
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      disablePortal: false,
                      PaperProps: {
                        sx: {
                          bgcolor: '#374151',
                          border: '1px solid #6b7280',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          minWidth: '140px',
                          maxHeight: '300px',
                          '&::-webkit-scrollbar': {
                            display: 'none',
                          },
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          overflow: 'auto',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            fontSize: '0.75rem',
                            minHeight: '32px',
                            padding: '6px 12px',
                            '&:hover': {
                              bgcolor: 'rgba(245, 158, 11, 0.2)',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(245, 158, 11, 0.3)',
                              '&:hover': {
                                bgcolor: 'rgba(245, 158, 11, 0.4)',
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">所有日期</span>
                      </div>
                    </MenuItem>
                    {getAvailableDates().map((dateStr) => (
                      <MenuItem key={dateStr} value={dateStr}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{dateStr}</span>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* Face name filter */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <FormControl size="small" sx={{ minWidth: '110px', width: { xs: '110px', sm: '140px' } }}>
                  <Select
                    value={faceNameFilter || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        setFaceNameFilterValue(value);
                      } else {
                        clearFaceNameFilter();
                      }
                    }}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <div className="flex items-center gap-1 w-full overflow-hidden">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[12px] sm:text-xs truncate">所有人物</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1 w-full overflow-hidden">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="text-[12px] sm:text-xs truncate">{selected}</span>
                        </div>
                      );
                    }}
                    sx={{
                      minWidth: '110px',
                      width: { xs: '110px', sm: '140px' },
                      height: '32px',
                      backgroundColor: '#374151',
                      color: 'white',
                      fontSize: '0.75rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6b7280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#eab308',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                        fontSize: '18px', // 縮小箭頭圖示
                      },
                      '& .MuiSelect-select': {
                        paddingLeft: '6px',
                        paddingRight: '28px', // 減少右側空間
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      disablePortal: false,
                      PaperProps: {
                        sx: {
                          bgcolor: '#374151',
                          border: '1px solid #6b7280',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          minWidth: '140px',
                          maxHeight: '300px',
                          '&::-webkit-scrollbar': {
                            display: 'none',
                          },
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          overflow: 'auto',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            fontSize: '0.75rem',
                            minHeight: '32px',
                            padding: '6px 12px',
                            '&:hover': {
                              bgcolor: 'rgba(245, 158, 11, 0.2)',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'rgba(245, 158, 11, 0.3)',
                              '&:hover': {
                                bgcolor: 'rgba(245, 158, 11, 0.4)',
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">所有人物</span>
                      </div>
                    </MenuItem>
                    {availableFaceNames.map((name) => (
                      <MenuItem key={name} value={name}>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{name}</span>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* Items per page selector */}
              <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '90px' }}>
                <FormControl size="small" sx={{ minWidth: '90px', width: '90px' }}>
                  <Select
                    value={itemsPerPage}
                    onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                    sx={{
                      minWidth: '90px',
                      width: '90px',
                      height: '32px',
                      backgroundColor: '#374151',
                      color: 'white',
                      fontSize: '0.75rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6b7280',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#9ca3af',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#eab308',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'white',
                      },
                      '& .MuiSelect-select': {
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      disablePortal: false,
                      PaperProps: {
                        sx: {
                          bgcolor: '#374151',
                          border: '1px solid #6b7280',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          minWidth: '90px',
                          maxHeight: '200px',
                          // 隱藏滾動條
                          '&::-webkit-scrollbar': {
                            display: 'none',
                          },
                          scrollbarWidth: 'none', // Firefox
                          msOverflowStyle: 'none', // IE and Edge
                          overflow: 'auto',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            fontSize: '0.75rem',
                            minHeight: '32px',
                            padding: '6px 12px',
                            '&:hover': {
                              backgroundColor: '#4b5563',
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#eab308',
                              color: 'black',
                              '&:hover': {
                                backgroundColor: '#eabb2eff',
                              },
                            },
                          },
                          // 確保選單內容也隱藏滾動條
                          '& .MuiMenu-list': {
                            '&::-webkit-scrollbar': {
                              display: 'none',
                            },
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                          },
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                      getContentAnchorEl: null,
                    }}
                  >
                    <MenuItem value={5}>5 / 頁</MenuItem>
                    <MenuItem value={10}>10 / 頁</MenuItem>
                    <MenuItem value={15}>15 / 頁</MenuItem>
                    <MenuItem value={20}>20 / 頁</MenuItem>
                    <MenuItem value={25}>25 / 頁</MenuItem>
                    <MenuItem value={30}>30 / 頁</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </div>
          
          {allImages.length > 0 && (
            <div className="mt-3 sm:mt-4 text-slate-300 text-xs sm:text-sm">
              <span className="block sm:inline">
                {(dateFilter || faceNameFilter) ? (
                  <>
                    篩選結果: {filteredImages.length} 張 / 總共 {allImages.length} 張圖片
                  </>
                ) : (
                  <>
                    總共 {allImages.length} 張圖片
                  </>
                )}
                {totalPages > 1 && (
                  <span> (第 {currentPage} 頁，共 {totalPages} 頁)</span>
                )}
              </span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">每頁: {itemsPerPage} 張</span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">排序: {sortOrder === 'newest' ? '最新優先' : '最舊優先'}</span>
              <span className="hidden sm:inline"> • </span>
              <span className="block sm:inline">檢視: {viewMode === 'grid' ? '網格' : '列表'}</span>
              {dateFilter && (
                <>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline text-amber-400">
                    篩選日期: {dateFilter.toISOString().split('T')[0]}
                  </span>
                </>
              )}
              {faceNameFilter && (
                <>
                  <span className="hidden sm:inline"> • </span>
                  <span className="block sm:inline text-amber-400">
                    篩選人物: {faceNameFilter}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>載入圖片中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <div className="text-red-400 text-lg font-medium mb-2">載入失敗</div>
            <div className="text-red-300 text-sm mb-4">{error}</div>
            <button
              onClick={refreshImages}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              重新載入
            </button>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <div className="text-slate-400 text-lg font-medium mb-2">沒有找到圖片</div>
            <div className="text-slate-500 text-sm mb-4">
              尚未有任何警報圖片或圖片檔案不存在
            </div>
            <button
              onClick={refreshImages}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
            >
              重新載入
            </button>
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <>
            {/* Page Loading Indicator */}
            {pageLoading && (
              <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-3 text-amber-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>載入第 {currentPage} 頁圖片中...</span>
                </div>
              </div>
            )}

            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3'
                : 'space-y-3 sm:space-y-4'
            }>
              {images.map((image, index) => (
                <ImageCard 
                  key={`${image.filename}-${index}`} 
                  image={image} 
                  isGrid={viewMode === 'grid'} 
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:gap-4">
                {/* Pagination Info */}
                <div className="text-slate-400 text-sm text-center">
                  顯示第 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredImages.length)} 項，共 {filteredImages.length} 項
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Tooltip title="第一頁">
                    <span>
                      <IconButton
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        sx={{
                          width: '32px',
                          height: '32px',
                          minWidth: '32px',
                          minHeight: '32px',
                          '@media (min-width: 640px)': {
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                          },
                          bgcolor: 'rgba(71, 85, 105, 0.5)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            bgcolor: 'rgba(71, 85, 105, 0.7)',
                          },
                          '&:disabled': {
                            bgcolor: 'rgba(51, 65, 85, 0.3)',
                            color: 'rgba(148, 163, 184, 0.5)',
                          },
                        }}
                      >
                        <ChevronsLeft style={{ width: '16px', height: '16px' }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="上一頁">
                    <span>
                      <IconButton
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        sx={{
                          width: '32px',
                          height: '32px',
                          minWidth: '32px',
                          minHeight: '32px',
                          '@media (min-width: 640px)': {
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                          },
                          bgcolor: 'rgba(71, 85, 105, 0.5)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            bgcolor: 'rgba(71, 85, 105, 0.7)',
                          },
                          '&:disabled': {
                            bgcolor: 'rgba(51, 65, 85, 0.3)',
                            color: 'rgba(148, 163, 184, 0.5)',
                          },
                        }}
                      >
                        <ChevronLeft style={{ width: '16px', height: '16px' }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      const isActive = currentPage === pageNum;

                      return (
                        <IconButton
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          sx={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            minHeight: '32px',
                            '@media (min-width: 640px)': {
                              width: '36px',
                              height: '36px',
                              minWidth: '36px',
                              minHeight: '36px',
                            },
                            bgcolor: isActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(71, 85, 105, 0.5)',
                            color: isActive ? '#fbbf24' : '#cbd5e1',
                            borderRadius: '6px',
                            border: isActive ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                              bgcolor: isActive ? 'rgba(245, 158, 11, 0.4)' : 'rgba(71, 85, 105, 0.7)',
                            },
                          }}
                        >
                          {pageNum}
                        </IconButton>
                      );
                    })}
                  </div>

                  <Tooltip title="下一頁">
                    <span>
                      <IconButton
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        sx={{
                          width: '32px',
                          height: '32px',
                          minWidth: '32px',
                          minHeight: '32px',
                          '@media (min-width: 640px)': {
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                          },
                          bgcolor: 'rgba(71, 85, 105, 0.5)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            bgcolor: 'rgba(71, 85, 105, 0.7)',
                          },
                          '&:disabled': {
                            bgcolor: 'rgba(51, 65, 85, 0.3)',
                            color: 'rgba(148, 163, 184, 0.5)',
                          },
                        }}
                      >
                        <ChevronRight style={{ width: '16px', height: '16px' }} />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title="最後一頁">
                    <span>
                      <IconButton
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        sx={{
                          width: '32px',
                          height: '32px',
                          minWidth: '32px',
                          minHeight: '32px',
                          '@media (min-width: 640px)': {
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                          },
                          bgcolor: 'rgba(71, 85, 105, 0.5)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            bgcolor: 'rgba(71, 85, 105, 0.7)',
                          },
                          '&:disabled': {
                            bgcolor: 'rgba(51, 65, 85, 0.3)',
                            color: 'rgba(148, 163, 184, 0.5)',
                          },
                        }}
                      >
                        <ChevronsRight style={{ width: '16px', height: '16px' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}

        {/* Fullscreen Modal */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <div 
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative inline-block">
                {/* 顯示圖片：Motion 版本或原始版本 */}
                {showMotionVersion && motionImageData ? (
                  <img
                    src={`data:image/${motionImageData.type};base64,${motionImageData.data}`}
                    alt={`${fullscreenImage.filename} (Motion)`}
                    className="max-w-full max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] object-contain rounded-lg"
                  />
                ) : (
                  <FullSizeImage
                    image={fullscreenImage}
                    alt={fullscreenImage.filename}
                    className="max-w-full max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] object-contain rounded-lg"
                    isLoading={fullscreenImageLoading}
                  />
                )}
                
                {/* 關閉按鈕 */}
                <Tooltip title="關閉 (Esc)" placement="left" arrow>
                  <button
                    onClick={() => setFullscreenImage(null)}
                    className="absolute top-2 sm:top-4 right-2 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 min-w-[2rem] min-h-[2rem] sm:min-w-[2.5rem] sm:min-h-[2.5rem] bg-black/50 hover:bg-red-500/80 rounded-full transition-colors backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group z-10"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                  </button>
                </Tooltip>

                {/* 底部控制欄 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-4 rounded-b-lg">
                  {/* 圖片資訊和控制按鈕 - 三欄布局 */}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {/* 左側：圖片資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm sm:text-base">
                        {formatDateTime(fullscreenImage.filename)}
                        {showMotionVersion && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500/80 text-white text-xs rounded-full">
                            Motion
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 text-xs sm:text-sm mt-1">
                        {showMotionVersion && motionImageData 
                          ? `${motionImageData.image_size} • ${motionImageData.file_size}`
                          : `${fullscreenImage.image_size} • ${fullscreenImage.file_size}`
                        }
                        {fullscreenImageLoading && (
                          <span className="ml-2 text-amber-400">
                            <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                            載入中...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 中間：控制按鈕組 - 絕對置中 */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 absolute left-1/2 -translate-x-1/2">
                      {/* 上一張按鈕 */}
                      {(() => {
                        const currentIndex = images.findIndex(img => img.filename === fullscreenImage.filename);
                        const hasPrev = currentIndex > 0;
                        
                        return (
                          <Tooltip title="上一張" placement="top" arrow>
                            <span>
                              <button
                                onClick={handlePrevImage}
                                disabled={!hasPrev}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center group"
                              >
                                <ChevronLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  hasPrev ? 'text-white group-hover:scale-110' : 'text-white/30'
                                } transition-transform`} />
                              </button>
                            </span>
                          </Tooltip>
                        );
                      })()}

                      {/* Motion 版本切換按鈕 */}
                      {hasMotionVersion ? (
                        <Tooltip 
                          title={showMotionVersion ? "顯示原始圖片" : "顯示 Motion 版本"} 
                          placement="top" 
                          arrow
                        >
                          <button
                            onClick={toggleMotionVersion}
                            className={`px-2 sm:px-3 h-8 sm:h-9 ${
                              'bg-white/10 hover:bg-white/20 border-white/20'
                            } rounded-lg transition-all backdrop-blur-sm border flex items-center justify-center gap-1 sm:gap-1.5 group`}
                          >
                            <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              showMotionVersion ? 'text-white' : 'text-amber-400'
                            } group-hover:scale-110 transition-transform`} />
                            
                          </button>
                        </Tooltip>
                      ) : (
                        <div className="px-2 sm:px-3 h-8 sm:h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 opacity-50 cursor-not-allowed">
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
                        </div>
                      )}

                      {/* 下一張按鈕 */}
                      {(() => {
                        const currentIndex = images.findIndex(img => img.filename === fullscreenImage.filename);
                        const hasNext = currentIndex !== -1 && currentIndex < images.length - 1;
                        
                        return (
                          <Tooltip title="下一張" placement="top" arrow>
                            <span>
                              <button
                                onClick={handleNextImage}
                                disabled={!hasNext}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center group"
                              >
                                <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  hasNext ? 'text-white group-hover:scale-110' : 'text-white/30'
                                } transition-transform`} />
                              </button>
                            </span>
                          </Tooltip>
                        );
                      })()}
                    </div>

                    {/* 右側：圖片計數器 */}
                    <div className="text-slate-300 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                      {(() => {
                        const currentIndex = images.findIndex(img => img.filename === fullscreenImage.filename);
                        return `${currentIndex + 1} / ${images.length}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 權限不足提示對話框 */}
        <PermissionDialog
          open={permissionDialog.open}
          message={permissionDialog.message}
          onClose={closePermissionDialog}
        />

        {/* 刪除確認對話框 */}
        <ConfirmDialog
          open={deleteConfirmDialog.open}
          title="確認刪除"
          message={`確定要刪除圖片「${deleteConfirmDialog.image?.filename || ''}」嗎？\n此操作無法復原。`}
          confirmText="刪除"
          cancelText="取消"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      </div>
    </div>
  );
};

export default ImageViewer;