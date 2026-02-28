import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  maxSizeMB = 5,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Apenas imagens (JPEG, PNG, WebP) são permitidas');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`A imagem deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call parent callback
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="relative w-full aspect-video md:aspect-[2/1] rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="w-full aspect-video md:aspect-[2/1] border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-3 bg-white rounded-full border-2 border-gray-300">
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm md:text-base font-medium text-gray-700 mb-1">
              Clique para adicionar imagem
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              JPEG, PNG ou WebP • Máximo {maxSizeMB}MB
            </p>
          </div>
          <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}


