import React, { useState, useCallback } from 'react';
import { Upload, Camera, FileImage, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
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
}

const ImageContributionUpload: React.FC<ImageContributionUploadProps> = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [routeName, setRouteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const acceptedFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isImage && isValidSize;
    });

    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      processing: false
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
  }, []);

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
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const submitImage = async (imageIndex: number) => {
    const image = uploadedImages[imageIndex];
    if (!image.file) return;

    setUploadedImages(prev => 
      prev.map((img, idx) => 
        idx === imageIndex ? { ...img, processing: true, error: undefined } : img
      )
    );

    try {
      const formData = new FormData();
      formData.append('image', image.file);
      formData.append('description', description || 'Bus schedule image');
      formData.append('location', location);
      formData.append('routeName', routeName);

      const response = await submitImageContribution(formData);

      if (response.success) {
        setUploadedImages(prev =>
          prev.map((img, idx) =>
            idx === imageIndex
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
        pollProcessingStatus(response.contributionId, imageIndex);
        
        onSuccess?.(response.contributionId);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadedImages(prev =>
        prev.map((img, idx) =>
          idx === imageIndex
            ? { ...img, processing: false, error: errorMessage }
            : img
        )
      );
      
      onError?.(errorMessage);
    }
  };

  const pollProcessingStatus = async (contributionId: string, imageIndex: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await getImageProcessingStatus(contributionId);
        
        setUploadedImages(prev =>
          prev.map((img, idx) =>
            idx === imageIndex
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

  const retryProcessing = async (contributionId: string, imageIndex: number) => {
    try {
      setUploadedImages(prev =>
        prev.map((img, idx) =>
          idx === imageIndex ? { ...img, processing: true, error: undefined } : img
        )
      );

      const response = await retryImageProcessing(contributionId);
      
      if (response.success) {
        // Restart polling
        pollProcessingStatus(contributionId, imageIndex);
      } else {
        throw new Error(response.message || 'Retry failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      
      setUploadedImages(prev =>
        prev.map((img, idx) =>
          idx === imageIndex
            ? { ...img, processing: false, error: errorMessage }
            : img
        )
      );
    }
  };

  const submitAllImages = async () => {
    setIsSubmitting(true);
    
    try {
      const pendingImages = uploadedImages
        .map((img, index) => ({ img, index }))
        .filter(({ img }) => !img.contributionId && !img.processing);

      for (const { index } of pendingImages) {
        await submitImage(index);
        // Small delay between uploads to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Camera className="w-6 h-6 mr-2" />
          {t('contribution.imageUpload.title', 'Upload Bus Schedule Images')}
        </h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {t('contribution.imageUpload.description', 
              'Upload clear photos of bus schedules, timetables, or route information. Our AI will extract the schedule data automatically.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('contribution.imageUpload.description', 'Description')}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bus schedule at Kochi bus stand"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('contribution.imageUpload.location', 'Location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Kochi, Ernakulam"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('contribution.imageUpload.routeName', 'Route Name (Optional)')}
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Kochi-Alappuzha"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop bus schedule images here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG, PNG, WebP, GIF up to 10MB each
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      disabled={image.processing}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {image.file.name}
                      </span>
                      {getStatusIcon(image.status, image.processing, image.error)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {getStatusText(image.status, image.processing, image.error)}
                    </p>
                    
                    <div className="flex space-x-2">
                      {!image.contributionId && !image.processing && (
                        <button
                          onClick={() => submitImage(index)}
                          className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Upload
                        </button>
                      )}
                      
                      {image.status === 'PROCESSING_FAILED' && image.contributionId && (
                        <button
                          onClick={() => retryProcessing(image.contributionId!, index)}
                          className="flex-1 bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                          disabled={image.processing}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {uploadedImages.some(img => !img.contributionId && !img.processing) && (
              <div className="mt-4 text-center">
                <button
                  onClick={submitAllImages}
                  disabled={isSubmitting}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading All...' : 'Upload All Images'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">AI Processing Information</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Our AI will automatically extract bus numbers, routes, and timing information</li>
            <li>• High-confidence extractions are processed automatically</li>
            <li>• Medium/low confidence extractions are marked for manual review</li>
            <li>• Processing typically takes 2-4 hours depending on image quality</li>
            <li>• You'll be notified when processing is complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageContributionUpload;