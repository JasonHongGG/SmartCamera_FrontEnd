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
import { useImageViewer } from '../../hooks/imageHooks';
import { useAppConfig } from '../../context/AppConfigContext';

const ImageViewer = () => {
  const { config } = useAppConfig();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  const {
    images,
    allImages,
    loading,
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
    selectImage,
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
    selectImage(image);
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
          <div className="flex gap-1 sm:gap-2 mt-1.5 sm:mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen(image);
              }}
              className="flex-1 py-1 sm:py-1.5 px-1 sm:px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <ZoomIn className="w-3 h-3" />
              <span className="hidden xs:inline">放大</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(image);
              }}
              className="flex-1 py-1 sm:py-1.5 px-1 sm:px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span className="hidden xs:inline">下載</span>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 flex-shrink-0">
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-lg sm:text-xl md:text-2xl truncate">警報圖片檢視器</h1>
                <p className="text-slate-300 text-xs sm:text-sm hidden sm:block">檢視偵測觸發時儲存的警報圖片</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={toggleViewMode}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-600/50 hover:bg-slate-500/70 rounded transition-colors flex items-center justify-center"
                title={viewMode === 'grid' ? '切換到列表檢視' : '切換到網格檢視'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4 sm:w-5 sm:h-5" /> : <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              <button
                onClick={toggleSortOrder}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-600/50 hover:bg-slate-500/70 rounded transition-colors flex items-center justify-center"
                title={sortOrder === 'newest' ? '切換到最舊優先' : '切換到最新優先'}
              >
                {sortOrder === 'newest' ? <SortDesc className="w-4 h-4 sm:w-5 sm:h-5" /> : <SortAsc className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              <button
                onClick={refreshImages}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
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
              尚未有任何警報圖片，或圖片檔案不存在
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
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
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
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/70 disabled:bg-slate-700/30 disabled:text-slate-500 rounded transition-colors flex items-center justify-center"
                    title="第一頁"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/70 disabled:bg-slate-700/30 disabled:text-slate-500 rounded transition-colors flex items-center justify-center"
                    title="上一頁"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

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

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded transition-colors flex items-center justify-center text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
                              : 'bg-slate-600/50 hover:bg-slate-500/70 text-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/70 disabled:bg-slate-700/30 disabled:text-slate-500 rounded transition-colors flex items-center justify-center"
                    title="下一頁"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/70 disabled:bg-slate-700/30 disabled:text-slate-500 rounded transition-colors flex items-center justify-center"
                    title="最後一頁"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
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