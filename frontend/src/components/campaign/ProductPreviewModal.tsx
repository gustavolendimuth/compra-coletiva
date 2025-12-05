import { useEffect } from 'react';
import { X, Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductPreview as ProductPreviewType } from '@/api';
import { formatCurrency } from '@/lib/utils';

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  products: ProductPreviewType[];
  totalCount: number;
}

export function ProductPreviewModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  products,
  totalCount
}: ProductPreviewModalProps) {
  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Impedir propagação de clique para não navegar para a campanha
  const handleModalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleModalClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {campaignName}
            </h2>
            <p className="text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? 'produto' : 'produtos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product List */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Nenhum produto cadastrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-lg font-semibold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with link to campaign */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4">
          <Link
            to={`/campaigns/${campaignId}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Ver campanha completa</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
