import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Upload, Camera, FileImage, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { submitImageContribution, getImageProcessingStatus, retryImageProcessing } from '../services/api';
import { useTranslation } from 'react-i18next';
import './ImageContributionUpload.css';

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
  id: string;
  timestamp: Date;
}

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
  
  // Use stable counter for image IDs to prevent re-renders
  const imageIdCounterRef = useRef(1);
  
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
      id: `img-upload-${imageIdCounterRef.current++}`,
      timestamp: new Date()
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  }, []);

  const filteredAndSortedImages = useMemo(() => {
    let filtered = uploadedImages.filter(image => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const fileName = image.file.name.toLowerCase();
        if (!fileName.includes(query)) return false;
      }

      if (filters.status.length > 0) {
        const status = image.status || 'pending';
        if (!filters.status.includes(status)) return false;
      }

      if (filters.fileType.length > 0) {
        const fileType = image.file.type.split('/')[1];
        if (!filters.fileType.includes(fileType)) return false;
      }

      return true;
    });

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

  const availableFileTypes = useMemo(() => {
    const types = [...new Set(uploadedImages.map(img => img.file.type.split('/')[1]))];
    return types;
  }, [uploadedImages]);

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
    const image = uploadedImages.find(img => img.id === imageId);
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

        if (statusResponse.status && !['PROCESSING', 'PENDING'].includes(statusResponse.status)) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
      }
    }, 3000);

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
              {t('contribution.imageUpload.title', 'Image Upload')}
            </h2>
          </div>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {t('contribution.imageUpload.description', 
              'Upload clear photos of bus schedules, timetables, or route information. We will process and extract the schedule data for you.')}
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