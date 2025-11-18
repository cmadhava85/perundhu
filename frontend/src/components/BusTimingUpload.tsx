import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import busTimingService from '../services/busTimingService';
import type { TimingImageContribution } from '../types/busTimingTypes';

interface BusTimingUploadProps {
  onUploadSuccess?: (contribution: TimingImageContribution) => void;
  onUploadError?: (error: Error) => void;
}

const BusTimingUpload: React.FC<BusTimingUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originLocation, setOriginLocation] = useState('');
  const [originLocationTamil, setOriginLocationTamil] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    if (!originLocation.trim()) {
      setError('Please enter the origin location');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const contribution = await busTimingService.uploadTimingImage(
        selectedFile,
        originLocation.trim(),
        originLocationTamil.trim() || undefined,
        description.trim() || undefined
      );

      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setOriginLocation('');
      setOriginLocationTamil('');
      setDescription('');

      if (onUploadSuccess) {
        onUploadSuccess(contribution);
      }

      // Reset success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(new Error(errorMessage));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOriginLocation('');
    setOriginLocationTamil('');
    setDescription('');
    setError(null);
    setUploadSuccess(false);
  };

  return (
    <div className="bus-timing-upload" style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1F2937',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '32px' }}>🚌</span>
          {t('busTimings.upload.title', 'Upload Bus Timing Board')}
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#6B7280',
          margin: 0,
        }}>
          {t('busTimings.upload.description', 'Share bus timing boards from bus stands to help other travelers')}
        </p>
      </div>

      {/* Example Images */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.1)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#1E40AF',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>💡</span>
          {t('busTimings.upload.tip', 'Tip: Clear photos of official bus timing boards work best')}
        </div>
        <ul style={{
          fontSize: '12px',
          color: '#3B82F6',
          margin: '8px 0 0 20px',
          padding: 0,
        }}>
          <li>Take photos in good lighting</li>
          <li>Ensure text is clear and readable</li>
          <li>Include the origin location name</li>
          <li>Capture all timing columns (morning, afternoon, night)</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}>
            {t('busTimings.upload.image', 'Bus Timing Board Image')} *
          </label>
          
          <div style={{
            border: '2px dashed rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            background: previewUrl ? '#F9FAFB' : 'linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#3B82F6';
              e.currentTarget.style.background = '#EFF6FF';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const fakeEvent = {
                  target: { files: [file] }
                } as any;
                handleFileSelect(fakeEvent);
              }
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%)';
            }}
          >
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  PNG, JPG up to 10MB
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Origin Location */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}>
            {t('busTimings.upload.origin', 'Origin Location (English)')} *
          </label>
          <input
            type="text"
            value={originLocation}
            onChange={(e) => setOriginLocation(e.target.value)}
            placeholder="e.g., Sivakasi, Madurai, Chennai"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              border: '1.5px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '10px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        {/* Origin Location Tamil */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}>
            {t('busTimings.upload.originTamil', 'Origin Location (Tamil)')}
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#6B7280', marginLeft: '8px' }}>
              (Optional)
            </span>
          </label>
          <input
            type="text"
            value={originLocationTamil}
            onChange={(e) => setOriginLocationTamil(e.target.value)}
            placeholder="e.g., சிவகாசி, மதுரை, சென்னை"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              border: '1.5px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '10px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
          }}>
            {t('busTimings.upload.description', 'Additional Notes')}
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#6B7280', marginLeft: '8px' }}>
              (Optional)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional information about this timing board..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              border: '1.5px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '10px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontSize: '14px', color: '#DC2626' }}>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div style={{
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ fontSize: '14px', color: '#16A34A' }}>
              {t('busTimings.upload.success', 'Upload successful! Your contribution is pending review.')}
            </span>
          </div>
        )}

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={isUploading || !selectedFile || !originLocation.trim()}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: isUploading || !selectedFile || !originLocation.trim()
                ? '#D1D5DB'
                : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isUploading || !selectedFile || !originLocation.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {isUploading ? (
              <>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}></span>
                {t('busTimings.upload.uploading', 'Uploading...')}
              </>
            ) : (
              <>
                <span>📤</span>
                {t('busTimings.upload.submit', 'Submit Contribution')}
              </>
            )}
          </button>

          {(selectedFile || originLocation || description) && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '14px 24px',
                background: '#FFFFFF',
                color: '#6B7280',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {t('busTimings.upload.reset', 'Reset')}
            </button>
          )}
        </div>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BusTimingUpload;
