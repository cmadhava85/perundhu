import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormTextArea } from "../ui/FormTextArea";
import './SimpleImageForm.css';

interface ImageFormData {
  description: string;
}

interface SimpleImageFormProps {
  onSubmit: (data: ImageFormData, file: File) => void;
}

export const SimpleImageForm: React.FC<SimpleImageFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit({ description }, file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Clean up previous preview URL
      return () => URL.revokeObjectURL(url);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="image-form">
      <div className="upload-section">
        <div className="upload-header">
          <h3 className="upload-title">
            <span className="upload-icon">📷</span>
            {t('contribution.selectImage', 'Select Schedule Image')}
          </h3>
          <p className="upload-subtitle">
            {t('contribution.imageHint', 'Upload clear photos of bus schedules, route maps, or timetables')}
          </p>
        </div>

        {!file ? (
          <div className="file-upload-area">
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
              required
            />
            <label htmlFor="imageFile" className="file-upload-label">
              <div className="upload-content">
                <div className="upload-graphic">
                  <span className="upload-graphic-icon">📸</span>
                </div>
                <div className="upload-text">
                  <span className="upload-primary-text">
                    {t('upload.clickToSelect', 'Click to select image')}
                  </span>
                  <span className="upload-secondary-text">
                    {t('upload.supportedFormats', 'JPEG, PNG, WebP up to 10MB')}
                  </span>
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="file-preview">
            <div className="preview-header">
              <h4 className="preview-title">Selected Image</h4>
              <button type="button" onClick={removeFile} className="remove-file-btn">
                <span className="remove-icon">✕</span>
              </button>
            </div>
            
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" className="preview-image" />
              </div>
            )}
            
            <div className="file-info">
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <FormTextArea
        id="description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        label={t('contribution.description', 'Description (optional)')}
        placeholder={t('contribution.descriptionPlaceholder', 'Describe the image or any additional details...')}
        hint={t('contribution.descriptionHint', 'Help others understand what the image shows')}
        rows={3}
      />
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="submit-button modern-submit-btn"
          disabled={!file}
        >
          <div className="submit-btn-content">
            <span className="submit-icon">📷</span>
            <span className="submit-text">{t('contribution.submitImage', 'Submit Schedule Image')}</span>
            <span className="submit-arrow">→</span>
          </div>
        </button>
      </div>
    </form>
  );
};