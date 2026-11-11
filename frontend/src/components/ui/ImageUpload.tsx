import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File) => void;
  onImageRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
  acceptPdf?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  maxSizeMB = 5,
  className = '',
  disabled = false,
  acceptPdf = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfName, setPdfName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImageUrl changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
    if (currentImageUrl) {
      const looksLikePdf = currentImageUrl.toLowerCase().includes('.pdf') || currentImageUrl.toLowerCase().includes('application/pdf');
      setIsPdf(looksLikePdf);
    } else {
      setIsPdf(false);
    }
  }, [currentImageUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validTypes = acceptPdf ? [...validImageTypes, 'application/pdf'] : validImageTypes;

    if (!validTypes.includes(file.type)) {
      setError(acceptPdf
        ? 'Apenas imagens (JPEG, PNG, WebP) ou PDF são permitidos'
        : 'Apenas imagens (JPEG, PNG, WebP) são permitidas');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`O arquivo deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    setError('');

    if (file.type === 'application/pdf') {
      setIsPdf(true);
      setPdfName(file.name);
      setPreviewUrl('pdf');
    } else {
      setIsPdf(false);
      setPdfName('');
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Call parent callback
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setIsPdf(false);
    setPdfName('');
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

  const acceptAttr = acceptPdf
    ? 'image/jpeg,image/jpg,image/png,image/webp,application/pdf'
    : 'image/jpeg,image/jpg,image/png,image/webp';

  const hasPreview = !!previewUrl;

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {hasPreview ? (
        <div className="relative w-full rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
          {isPdf ? (
            <div className="flex items-center gap-3 p-4">
              <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {pdfName || 'Comprovante.pdf'}
                </p>
                <p className="text-xs text-gray-500">PDF selecionado</p>
              </div>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto aspect-video md:aspect-[2/1] object-cover"
            />
          )}
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              title="Remover arquivo"
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
              Clique para enviar arquivo
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              {acceptPdf ? `JPEG, PNG, WebP ou PDF • Máximo ${maxSizeMB}MB` : `JPEG, PNG ou WebP • Máximo ${maxSizeMB}MB`}
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

