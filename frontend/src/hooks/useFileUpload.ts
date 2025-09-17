import { useState, useCallback, useRef } from 'react';

interface FileUploadOptions {
  accept?: string;
  maxSize?: number; // in bytes
  allowMultiple?: boolean;
  onFileSelect?: (files: File[]) => void;
  onError?: (error: string) => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowMultiple = false,
    onFileSelect,
    onError
  } = options;

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    if (accept && !accept.includes(file.type) && !accept.includes('*')) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  }, [maxSize, accept]);

  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(''); // No preview for non-image files
      }
    });
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    const validFiles: FileWithPreview[] = [];
    let hasError = false;

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        if (onError) onError(validationError);
        hasError = true;
        break;
      }

      const preview = await createPreview(file);
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = preview;
      validFiles.push(fileWithPreview);

      if (!allowMultiple) break; // Only process first file if multiple not allowed
    }

    if (!hasError) {
      setError(null);
      setFiles(allowMultiple ? [...files, ...validFiles] : validFiles);
      if (onFileSelect) onFileSelect(validFiles);
    }
  }, [files, allowMultiple, validateFile, createPreview, onFileSelect, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setFiles(files.filter((_, i) => i !== index));
  }, [files]);

  const clearFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setError(null);
  }, [files]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    files,
    error,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    removeFile,
    clearFiles,
    openFileDialog,
    formatFileSize,
    hasFiles: files.length > 0
  };
};