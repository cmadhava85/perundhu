import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Upload, Camera, FileImage, AlertCircle, CheckCircle, Clock, RefreshCw, Copy } from 'lucide-react';
import { submitImageContribution, getImageProcessingStatus, retryImageProcessing, ApiError } from '../services/api';
import { getRecaptchaToken } from '../services/recaptchaService';
import { useTranslation } from 'react-i18next';
import './ImageContributionUpload.css';

interface ImageContributionUploadProps {
  onSuccess?: (contributionId: string) => void;
  onError?: (error: string) => void;
}

// Type alias for upload error types
type UploadErrorType = 'duplicate' | 'rate-limit' | 'general';

interface UploadedImage {
  file: File;
  preview: string;
  contributionId?: string;
  status?: string;
  processing?: boolean;
  error?: string;
  errorType?: UploadErrorType;
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
type _ViewMode = 'grid' | 'list' | 'compact';

const ImageContributionUpload: React.FC<ImageContributionUploadProps> = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [routeName, setRouteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Bot detection field
  
  // Use stable counter for image IDs to prevent re-renders
  const imageIdCounterRef = useRef(1);
  
  // RIA Enhancement State - removed unused viewMode and showFilters
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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
    const filtered = uploadedImages.filter(image => {
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
          case 'name': {
            result = a.file.name.localeCompare(b.file.name);
            break;
          }
          case 'size': {
            result = a.file.size - b.file.size;
            break;
          }
          case 'date': {
            result = a.timestamp.getTime() - b.timestamp.getTime();
            break;
          }
          case 'status': {
            const statusA = a.status || 'pending';
            const statusB = b.status || 'pending';
            result = statusA.localeCompare(statusB);
            break;
          }
        }
        
        return sortOrder === 'desc' ? -result : result;
      });

    return filtered;
  }, [uploadedImages, filters, sortBy, sortOrder]);

  const _availableFileTypes = useMemo(() => {
    const types = [...new Set(uploadedImages.map(img => img.file.type.split('/')[1]))];
    return types;
  }, [uploadedImages]);

  const _availableStatuses = useMemo(() => {
    const statuses = [...new Set(uploadedImages.map(img => img.status || 'pending'))];
    return statuses;
  }, [uploadedImages]);

  const _handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const _getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const _handleFilterChange = (filterType: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const _clearFilters = () => {
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
        img.id === imageId ? { ...img, processing: true, error: undefined, errorType: undefined } : img
      )
    );

    try {
      // Get reCAPTCHA token for spam protection
      const captchaToken = await getRecaptchaToken('image_upload');
      
      const contributionData = {
        busName: routeName || 'Unknown Bus',
        busNumber: 'N/A',
        fromLocationName: location || 'Unknown',
        toLocationName: 'Unknown',
        notes: description || 'Bus schedule image',
        website: honeypot, // Honeypot for bot detection
        captchaToken
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
      let errorMessage = t('contribution.imageUpload.uploadError');
      let errorType: UploadErrorType = 'general';
      
      // Check for specific error types
      if (error instanceof ApiError) {
        if (error.status === 409) {
          // Duplicate image detected
          errorMessage = t('contribution.imageUpload.duplicateError');
          errorType = 'duplicate';
        } else if (error.status === 429) {
          // Rate limit exceeded
          errorMessage = t('contribution.imageUpload.rateLimitError');
          errorType = 'rate-limit';
        } else {
          errorMessage = error.userMessage || error.message || t('contribution.imageUpload.uploadError');
        }
      } else if (error instanceof Error) {
        // Check if error message contains duplicate-related keywords
        if (error.message.toLowerCase().includes('duplicate')) {
          errorMessage = t('contribution.imageUpload.duplicateError');
          errorType = 'duplicate';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === imageId
            ? { ...img, processing: false, error: errorMessage, errorType }
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
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status?: string, processing?: boolean, error?: string, errorType?: UploadErrorType) => {
    if (error) {
      if (errorType === 'duplicate') {
        return <Copy className="w-4 h-4 text-orange-500" />;
      }
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
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

  const getStatusText = (status?: string, processing?: boolean, error?: string, errorType?: UploadErrorType) => {
    if (error) {
      if (errorType === 'duplicate') {
        return t('contribution.imageUpload.duplicateErrorTitle', 'Duplicate Image Detected');
      }
      return error;
    }
    if (processing) return t('common.uploading', 'Uploading...');
    
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
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem' }}>
      {/* Compact Header */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {t('contribution.imageUpload.title', 'Upload Bus Schedule Image')}
            </h2>
          </div>
          {/* Inline Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <span style={{ 
              background: '#eff6ff', 
              color: '#2563eb', 
              padding: '0.25rem 0.625rem', 
              borderRadius: '1rem',
              fontWeight: '500'
            }}>
              {uploadedImages.length} {t('contribution.imageUpload.imageCount', 'images')}
            </span>
            <span style={{ 
              background: '#ecfdf5', 
              color: '#059669', 
              padding: '0.25rem 0.625rem', 
              borderRadius: '1rem',
              fontWeight: '500'
            }}>
              {uploadedImages.filter(img => img.status === 'PROCESSED').length} {t('contribution.imageUpload.processedCount', 'processed')}
            </span>
            {uploadedImages.filter(img => img.processing).length > 0 && (
              <span style={{ 
                background: '#fffbeb', 
                color: '#d97706', 
                padding: '0.25rem 0.625rem', 
                borderRadius: '1rem',
                fontWeight: '500'
              }}>
                {uploadedImages.filter(img => img.processing).length} processing
              </span>
            )}
          </div>
        </div>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '0.8125rem', 
          margin: '0.5rem 0 0 2rem',
          lineHeight: '1.4'
        }}>
          {t('contribution.imageUpload.descriptionShort', 
            'Upload photos of bus schedules.')}
        </p>
      </div>
          
      {/* Compact Form Fields - Single Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '140px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            {t('contribution.imageUpload.descriptionLabel', 'Description')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('contribution.imageUpload.descriptionPlaceholder', 'e.g., Bus schedule at Kochi')}
            style={{
              width: '100%',
              padding: '0.5rem 0.625rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            {t('contribution.imageUpload.location', 'Location')}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('contribution.imageUpload.locationPlaceholder', 'e.g., Kochi')}
            style={{
              width: '100%',
              padding: '0.5rem 0.625rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ flex: '1', minWidth: '120px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            {t('contribution.imageUpload.routeNameShort', 'Route (Optional)')}
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder={t('contribution.imageUpload.routeNamePlaceholder', 'e.g., Kochi-Alappuzha')}
            style={{
              width: '100%',
              padding: '0.5rem 0.625rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>
      
      {/* Honeypot field - hidden from users, visible to bots */}
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website-img">Website</label>
        <input
          type="text"
          id="website-img"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Compact Upload Area */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('file-input')?.click();
            }
          }}
          role="button"
          tabIndex={0}
          style={{
            border: '2px dashed',
            borderColor: isDragActive ? '#3b82f6' : '#d1d5db',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: isDragActive ? '#eff6ff' : '#fafafa',
          }}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Upload style={{
              width: '2.5rem',
              height: '2.5rem',
              color: isDragActive ? '#2563eb' : '#9ca3af'
            }} />
            <div style={{ textAlign: 'left' }}>
              {isDragActive ? (
                <p style={{ color: '#2563eb', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                  {t('contribution.imageUpload.dropHere', 'Drop images here!')}
                </p>
              ) : (
                <>
                  <p style={{ color: '#374151', fontSize: '0.9375rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                    {t('contribution.imageUpload.dragDropTitle', 'Drag & drop bus schedule images here')}
                  </p>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.75rem' }}>
                    {t('contribution.imageUpload.dragDropHint', 'or click to select • JPEG, PNG, WebP up to 10MB')}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Images Display */}
      {uploadedImages.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FileImage style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
              Uploaded Images ({uploadedImages.length})
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {filteredAndSortedImages.map((image) => (
              <div
                key={image.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ position: 'relative', paddingTop: '75%', backgroundColor: '#f3f4f6' }}>
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <div style={{ padding: '1rem' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {image.file.name}
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280',
                    marginBottom: '0.75rem'
                  }}>
                    {formatFileSize(image.file.size)}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    {getStatusIcon(image.status, image.processing, image.error, image.errorType)}
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: image.errorType === 'duplicate' ? '#ea580c' : '#4b5563',
                      fontWeight: image.error ? '600' : '400'
                    }}>
                      {getStatusText(image.status, image.processing, image.error, image.errorType)}
                    </span>
                  </div>

                  {/* Show error message for duplicate images */}
                  {image.error && image.errorType === 'duplicate' && (
                    <div style={{
                      padding: '0.5rem',
                      marginBottom: '0.75rem',
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: '#9a3412'
                    }}>
                      {image.error}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!image.contributionId && !image.processing && !image.errorType && (
                      <button
                        onClick={() => submitImage(image.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Upload
                      </button>
                    )}
                    
                    {image.error && image.contributionId && (
                      <button
                        onClick={() => retryProcessing(image.contributionId!, image.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#d97706',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} />
                        Retry
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeImageById(image.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Submit All Button */}
          {uploadedImages.some(img => !img.contributionId && !img.processing) && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
              borderRadius: '0.75rem',
              border: '1px solid #bfdbfe'
            }}>
              <button
                onClick={submitAllImages}
                disabled={isSubmitting}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Upload style={{ width: '1.25rem', height: '1.25rem' }} />
                {isSubmitting ? 'Uploading...' : `Upload All (${uploadedImages.filter(img => !img.contributionId && !img.processing).length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageContributionUpload;