import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Camera, FileImage, AlertCircle, CheckCircle, Clock, RefreshCw, Filter, Search, Grid, List, Trash2, Eye } from 'lucide-react';
import { submitImageContribution, getImageProcessingStatus, retryImageProcessing } from '../services/api';
import { useTranslation } from 'react-i18next';

interface ImageContributionUploadProps {
  onSuccess?: (contributionId: string) => void;
  onError?: (error: string) => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  contributionId?: string;
  status?: string;
  processing?: boolean;
  error?: string;
  id: string; // For RIA features
  timestamp: Date; // When uploaded
}

// Enhanced filtering options for RIA
interface FilterOptions {
  status: string[];
  fileType: string[];
  uploadDate: string;
  searchQuery: string;
}

type SortOption = 'name' | 'size' | 'date' | 'status';
type ViewMode = 'grid' | 'list' | 'compact';

const ImageContributionUpload: React.FC<ImageContributionUploadProps> = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [routeName, setRouteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // RIA Enhancement State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    fileType: [],
    uploadDate: '',
    searchQuery: ''
  });

  // Enhanced file handling with metadata
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const acceptedFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isImage && isValidSize;
    });

    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      processing: false,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  }, []);

  // Advanced filtering and sorting logic
  const filteredAndSortedImages = useMemo(() => {
    let filtered = uploadedImages.filter(image => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const fileName = image.file.name.toLowerCase();
        if (!fileName.includes(query)) return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const status = image.status || 'pending';
        if (!filters.status.includes(status)) return false;
      }

      // File type filter
      if (filters.fileType.length > 0) {
        const fileType = image.file.type.split('/')[1];
        if (!filters.fileType.includes(fileType)) return false;
      }

      return true;
    });

    // Sort images
    filtered.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'name':
          result = a.file.name.localeCompare(b.file.name);
          break;
        case 'size':
          result = a.file.size - b.file.size;
          break;
        case 'date':
          result = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'status':
          const statusA = a.status || 'pending';
          const statusB = b.status || 'pending';
          result = statusA.localeCompare(statusB);
          break;
      }
      
      return sortOrder === 'desc' ? -result : result;
    });

    return filtered;
  }, [uploadedImages, filters, sortBy, sortOrder]);

  // Get unique file types for filter options
  const availableFileTypes = useMemo(() => {
    const types = [...new Set(uploadedImages.map(img => img.file.type.split('/')[1]))];
    return types;
  }, [uploadedImages]);

  // Get available statuses for filter options
  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(uploadedImages.map(img => img.status || 'pending'))];
    return statuses;
  }, [uploadedImages]);

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      fileType: [],
      uploadDate: '',
      searchQuery: ''
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const removeImageById = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const submitImage = async (imageId: string) => {
    const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
    const image = uploadedImages[imageIndex];
    if (!image?.file) return;

    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, processing: true, error: undefined } : img
      )
    );

    try {
      const contributionData = {
        busName: routeName || 'Unknown Bus',
        busNumber: 'N/A',
        fromLocationName: location || 'Unknown',
        toLocationName: 'Unknown',
        notes: description || 'Bus schedule image'
      };

      const response = await submitImageContribution(contributionData, image.file);

      if (response.success) {
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? {
                  ...img,
                  processing: false,
                  contributionId: response.contributionId,
                  status: response.status
                }
              : img
          )
        );

        // Start polling for processing status
        pollProcessingStatus(response.contributionId, imageId);
        
        onSuccess?.(response.contributionId);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, processing: false, error: errorMessage }
            : img
        )
      );
      
      onError?.(errorMessage);
    }
  };

  const pollProcessingStatus = async (contributionId: string, imageId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await getImageProcessingStatus(contributionId);
        
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === imageId
              ? { ...img, status: statusResponse.status }
              : img
          )
        );

        // Stop polling when processing is complete
        if (statusResponse.status && !['PROCESSING', 'PENDING'].includes(statusResponse.status)) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  };

  const retryProcessing = async (contributionId: string, imageId: string) => {
    try {
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, processing: true, error: undefined } : img
        )
      );

      const response = await retryImageProcessing(contributionId);
      
      if (response.success) {
        // Restart polling
        pollProcessingStatus(contributionId, imageId);
      } else {
        throw new Error(response.message || 'Retry failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, processing: false, error: errorMessage }
            : img
        )
      );
    }
  };

  const submitAllImages = async () => {
    setIsSubmitting(true);
    
    try {
      const pendingImages = uploadedImages.filter(img => !img.contributionId && !img.processing);

      for (const image of pendingImages) {
        await submitImage(image.id);
        // Small delay between uploads to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status?: string, processing?: boolean, error?: string) => {
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (processing) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    
    switch (status) {
      case 'PROCESSED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'MANUAL_REVIEW_NEEDED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'PROCESSING_FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileImage className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status?: string, processing?: boolean, error?: string) => {
    if (error) return `Error: ${error}`;
    if (processing) return 'Uploading...';
    
    switch (status) {
      case 'PROCESSED':
        return 'Successfully processed with AI';
      case 'PROCESSING':
        return 'Processing with AI/OCR...';
      case 'MANUAL_REVIEW_NEEDED':
        return 'Needs manual review';
      case 'LOW_CONFIDENCE_OCR':
        return 'Low confidence - manual review needed';
      case 'PROCESSING_FAILED':
        return 'Processing failed';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Enhanced Header */}
      <div className="enhanced-header">
        <div className="header-content">
          <div className="flex items-center justify-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <Camera className="w-8 h-8 mr-3 text-blue-600" />
              {t('contribution.imageUpload.title', 'AI-Powered Image Upload')}
            </h2>
          </div>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {t('contribution.imageUpload.description', 
              'Upload clear photos of bus schedules, timetables, or route information. Our AI will extract the schedule data automatically.')}
          </p>
          
          {/* Stats */}
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value text-blue-600">{uploadedImages.length}</div>
              <div className="stat-label">Total Images</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-green-600">
                {uploadedImages.filter(img => img.status === 'PROCESSED').length}
              </div>
              <div className="stat-label">Processed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-yellow-600">
                {uploadedImages.filter(img => img.processing).length}
              </div>
              <div className="stat-label">Processing</div>
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="form-fields-container">
            <div className="form-field">
              <label>
                {t('contribution.imageUpload.description', 'Description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bus schedule at Kochi bus stand"
              />
            </div>
            
            <div className="form-field">
              <label>
                {t('contribution.imageUpload.location', 'Location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kochi, Ernakulam"
              />
            </div>
            
            <div className="form-field">
              <label>
                {t('contribution.imageUpload.routeName', 'Route Name (Optional)')}
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Kochi-Alappuzha"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Area */}
      <div className="mb-8">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload className={`w-16 h-16 mx-auto mb-4 transition-colors ${
            isDragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          {isDragActive ? (
            <div>
              <p className="text-blue-600 text-xl font-semibold mb-2">Drop the images here!</p>
              <p className="text-blue-500">Release to upload your files</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 text-xl font-semibold mb-2">
                Drag & drop bus schedule images here
              </p>
              <p className="text-gray-600 mb-4">
                or click to select files from your device
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG, PNG, WebP, GIF up to 10MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Images Management */}
      {uploadedImages.length > 0 && (
        <div className="mt-8">
          {/* Control Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileImage className="w-6 h-6 mr-2 text-blue-600" />
                Uploaded Images ({filteredAndSortedImages.length})
              </h3>
              
              {/* View Controls */}
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['grid', 'list', 'compact'] as ViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === mode
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode === 'grid' && <Grid className="w-4 h-4" />}
                      {mode === 'list' && <List className="w-4 h-4" />}
                      {mode === 'compact' && '☰'}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showFilters
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2 inline" />
                  Filters
                </button>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {(['name', 'size', 'date', 'status'] as SortOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)} {getSortIcon(option)}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="space-y-2">
                      {availableStatuses.map(status => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              const newStatuses = e.target.checked
                                ? [...filters.status, status]
                                : filters.status.filter(s => s !== status);
                              handleFilterChange('status', newStatuses);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                    <div className="space-y-2">
                      {availableFileTypes.map(type => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.fileType.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...filters.fileType, type]
                                : filters.fileType.filter(t => t !== type);
                              handleFilterChange('fileType', newTypes);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{type.toUpperCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Date</label>
                    <input
                      type="date"
                      value={filters.uploadDate}
                      onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Images Display */}
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : ''}
            ${viewMode === 'list' ? 'space-y-4' : ''}
            ${viewMode === 'compact' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}
          `}>
            {filteredAndSortedImages.map((image) => (
              <div key={image.id} className={`
                bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl
                ${viewMode === 'list' ? 'flex' : 'block'}
                ${viewMode === 'compact' ? 'h-32' : ''}
              `}>
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className={`
                      object-cover cursor-pointer
                      ${viewMode === 'grid' ? 'w-full h-48' : ''}
                      ${viewMode === 'list' ? 'w-full h-full' : ''}
                      ${viewMode === 'compact' ? 'w-full h-32' : ''}
                    `}
                  />
                  <button
                    onClick={() => removeImageById(image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    disabled={image.processing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Status Overlay */}
                  <div className="absolute bottom-2 left-2">
                    {getStatusIcon(image.status, image.processing, image.error)}
                  </div>
                </div>
                
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {image.file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(image.file.size)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {getStatusText(image.status, image.processing, image.error)}
                  </p>
                  
                  <div className="flex space-x-2">
                    {!image.contributionId && !image.processing && (
                      <button
                        onClick={() => submitImage(image.id)}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Upload
                      </button>
                    )}
                    
                    {image.status === 'PROCESSING_FAILED' && image.contributionId && (
                      <button
                        onClick={() => retryProcessing(image.contributionId!, image.id)}
                        className="flex-1 bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors"
                        disabled={image.processing}
                      >
                        Retry
                      </button>
                    )}
                    
                    <button
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Actions */}
          {uploadedImages.some(img => !img.contributionId && !img.processing) && (
            <div className="mt-6 text-center">
              <button
                onClick={submitAllImages}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 mr-2 inline animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 mr-2 inline" />
                )}
                {isSubmitting ? 'Uploading All...' : 'Upload All Images'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing Information */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          AI Processing Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
              Automatic extraction of bus numbers, routes, and timing information
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
              High-confidence extractions are processed automatically
            </li>
            <li className="flex items-start">
              <Clock className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" />
              Medium/low confidence extractions are marked for manual review
            </li>
          </ul>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <Clock className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" />
              Processing typically takes 2-4 hours depending on image quality
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
              You'll be notified when processing is complete
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
              Clear, well-lit images produce the best results
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageContributionUpload;