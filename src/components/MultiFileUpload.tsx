import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MultiFileUploadProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: string[];
  maxFiles?: number;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ 
  onFilesChange, 
  initialFiles = [], 
  maxFiles = 10 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialFiles);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrls(initialFiles);
  }, [initialFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
    
    // Создаем превью URL для новых файлов
    const newPreviewUrls = [...previewUrls];
    selectedFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    });
    
    setFiles(newFiles);
    setPreviewUrls(newPreviewUrls.slice(0, maxFiles));
    onFilesChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Очищаем URL.createObjectURL для удаленных файлов
    if (files[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setFiles(newFiles);
    setPreviewUrls(newPreviewUrls);
    onFilesChange(newFiles);
    
    if (currentIndex >= newPreviewUrls.length && newPreviewUrls.length > 0) {
      setCurrentIndex(newPreviewUrls.length - 1);
    }
  };

  const nextFile = () => {
    setCurrentIndex((prev) => (prev + 1) % previewUrls.length);
  };

  const prevFile = () => {
    setCurrentIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />
      
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={previewUrls.length >= maxFiles}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <Upload className="w-5 h-5" />
        <span>Загрузить фото</span>
      </button>

      {previewUrls.length > 0 && (
        <div className="relative">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="relative">
              <img
                src={previewUrls[currentIndex]}
                alt={`Preview ${currentIndex + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              {previewUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevFile}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextFile}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={() => removeFile(currentIndex)}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {previewUrls.length}
              </div>
            </div>

            {/* Миниатюры */}
            {previewUrls.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto">
                {previewUrls.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentIndex ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        {previewUrls.length} / {maxFiles} фото загружено
      </div>
    </div>
  );
};

export default MultiFileUpload;
