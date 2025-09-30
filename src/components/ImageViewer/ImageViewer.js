import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Grid3X3, 
  List, 
  RefreshCw, 
  SortDesc, 
  SortAsc,
  X,
  ZoomIn,
  Download,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { IconButton, Tooltip, Select, MenuItem, FormControl } from '@mui/material';
import { useImageViewer } from '../../hooks/imageHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const ImageViewer = () => {
  const { config } = useAppConfig();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  const {
    images,
    allImages,
    loading,
    pageLoading,
    error,
    viewMode,
    sortOrder,
    currentPage,
    totalPages,
    itemsPerPage,
    refreshImages,
    toggleSortOrder,
    toggleViewMode,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeItemsPerPage,
    getImageDataUrl,
    ensureImageLoaded
  } = useImageViewer(config.detectionHost);

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
  };

  const handleFullscreen = (image) => {
    setFullscreenImage(image);
  };

  const handleDownload = (image) => {
    const link = document.createElement('a');
    link.href = getImageDataUrl(image);
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lazy loading image component
  const LazyImage = ({ image, alt, className, onClick }) => {
    const [imageData, setImageData] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const loadImage = async () => {
        try {
          setIsLoading(true);
          setHasError(false);
          await ensureImageLoaded(image);
          const dataUrl = getImageDataUrl(image);
          setImageData(dataUrl);
        } catch (error) {
          console.error('Failed to load image:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };

      loadImage();
    }, [image]);

    if (hasError) {
      return (
        <div className={`${className} bg-slate-700/50 flex items-center justify-center`}>
          <div className="text-slate-400 text-xs text-center">
            <ImageIcon className="w-6 h-6 mx-auto mb-1" />
            載入失敗
          </div>
        </div>
      );
    }

    if (isLoading || !imageData) {
      return (
        <div className={`${className} bg-slate-700/50 flex items-center justify-center`}>
          <div className="text-slate-400 text-xs text-center">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1" />
            載入中...
          </div>
        </div>
      );
    }

    return (
      <img
        src={imageData}
        alt={alt}
        className={className}
        onClick={onClick}
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
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
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
                  handleFullscreen(image);
                }}
                className="p-1 bg-slate-600/50 hover:bg-slate-500/70 rounded transition-colors"
                title="放大檢視"
              >
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
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
                handleFullscreen(image);
              }}
              className="flex-1 py-1.5 px-2 sm:py-1.5 sm:px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 min-h-[28px] h-7"
            >
              <ZoomIn className="w-3 h-3" />
              <span className="inline">放大</span>
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
            
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
                總共 {allImages.length} 張圖片
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
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Pagination Info */}
                <div className="text-slate-400 text-sm">
                  顯示第 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allImages.length)} 項，共 {allImages.length} 項
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
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="relative max-w-7xl max-h-full w-full">
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute -top-10 sm:-top-12 right-0 p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              
              <LazyImage
                image={fullscreenImage}
                alt={fullscreenImage.filename}
                className="max-w-full max-h-full object-contain rounded-lg mx-auto block"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 rounded-b-lg">
                <div className="text-white font-medium text-sm sm:text-base">{formatDateTime(fullscreenImage.filename)}</div>
                <div className="text-slate-300 text-xs sm:text-sm mt-1">
                  {fullscreenImage.image_size} • {fullscreenImage.file_size}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;