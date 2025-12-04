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
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
      {/* Enhanced Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Camera style={{ width: '2rem', height: '2rem', marginRight: '0.75rem', color: '#2563eb' }} />
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {t('contribution.imageUpload.title', 'Upload Bus Schedule Image')}
            </h2>
          </div>
          <p style={{ 
            color: '#4b5563', 
            fontSize: '1rem', 
            marginBottom: '2rem', 
            maxWidth: '48rem', 
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            {t('contribution.imageUpload.description', 
              'Upload clear photos of bus schedules, timetables, or route information. Our AI will automatically extract the schedule data for you.')}
          </p>
          
          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1.5rem', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: '#2563eb' }}>
                {uploadedImages.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Total Images</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: '#059669' }}>
                {uploadedImages.filter(img => img.status === 'PROCESSED').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Processed</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: '#d97706' }}>
                {uploadedImages.filter(img => img.processing).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Processing</div>
            </div>
          </div>
          
          {/* Form Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            maxWidth: '64rem',
            margin: '0 auto 2rem auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151'
              }}>
                {t('contribution.imageUpload.descriptionLabel', 'Description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bus schedule at Kochi bus stand"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151'
              }}>
                {t('contribution.imageUpload.location', 'Location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kochi, Ernakulam"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151'
              }}>
                {t('contribution.imageUpload.routeName', 'Route Name (Optional)')}
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Kochi-Alappuzha"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Upload Area */}
      <div style={{ marginBottom: '2rem' }}>
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
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: isDragActive ? '#eff6ff' : 'transparent',
            transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isDragActive ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none'
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
          <Upload style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem auto',
            display: 'block',
            color: isDragActive ? '#2563eb' : '#9ca3af'
          }} />
          {isDragActive ? (
            <div>
              <p style={{ 
                color: '#2563eb', 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem' 
              }}>
                Drop the images here!
              </p>
              <p style={{ color: '#60a5fa', fontSize: '0.875rem' }}>
                Release to upload your files
              </p>
            </div>
          ) : (
            <div>
              <p style={{ 
                color: '#374151', 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem' 
              }}>
                Drag & drop bus schedule images here
              </p>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                or click to select files from your device
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Supports JPEG, PNG, WebP, GIF up to 10MB each
              </p>
            </div>
          )}
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
                    {getStatusIcon(image.status, image.processing, image.error)}
                    <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                      {getStatusText(image.status, image.processing, image.error)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!image.contributionId && !image.processing && (
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

      {/* Processing Information */}
      <div style={{
        marginTop: '2rem',
        background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
        border: '1px solid #bfdbfe',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <h4 style={{ 
          fontWeight: '600', 
          color: '#1e40af', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          fontSize: '1rem'
        }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
          AI Processing Information
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1rem'
        }}>
          <div>
            <ul style={{ fontSize: '0.875rem', color: '#1e40af', listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <CheckCircle style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem', 
                  marginTop: '0.125rem',
                  color: '#059669',
                  flexShrink: 0
                }} />
                <span>Automatic extraction of bus numbers, routes, and timing information</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <CheckCircle style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem', 
                  marginTop: '0.125rem',
                  color: '#059669',
                  flexShrink: 0
                }} />
                <span>High-confidence extractions are processed automatically</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <Clock style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem', 
                  marginTop: '0.125rem',
                  color: '#d97706',
                  flexShrink: 0
                }} />
                <span>Processing typically takes 2-4 hours depending on image quality</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <CheckCircle style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem', 
                  marginTop: '0.125rem',
                  color: '#059669',
                  flexShrink: 0
                }} />
                <span>You'll be notified when processing is complete</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                <AlertCircle style={{ 
                  width: '1rem', 
                  height: '1rem', 
                  marginRight: '0.5rem', 
                  marginTop: '0.125rem',
                  color: '#2563eb',
                  flexShrink: 0
                }} />
                <span>Clear, well-lit images produce the best results</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageContributionUpload;