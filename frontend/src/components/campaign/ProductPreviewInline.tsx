import { useState } from 'react';
import { Eye } from 'lucide-react';
import { ProductPreview as ProductPreviewType } from '@/api';
import { formatCurrency } from '@/lib/utils';
import { ProductPreviewModal } from './ProductPreviewModal';

interface ProductPreviewInlineProps {
  products: ProductPreviewType[];
  totalCount: number;
  campaignSlug: string;
  campaignName: string;
  allProducts?: ProductPreviewType[]; // Todos os produtos para o modal (opcional)
}

export function ProductPreviewInline({
  products,
  totalCount,
  campaignSlug,
  campaignName,
  allProducts
}: ProductPreviewInlineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  if (products.length === 0) {
    return (
      <div className="py-3 text-center text-sm text-gray-400 bg-gray-50 rounded-lg">
        Nenhum produto cadastrado
      </div>
    );
  }

  const remaining = totalCount - products.length;
  const productsForModal = allProducts || products;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {/* Preview de até 3 produtos */}
        {products.slice(0, 3).map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-20 p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
          >
            <p className="text-xs text-gray-700 font-medium line-clamp-2 h-8 leading-tight">
              {product.name}
            </p>
            <p className="text-xs text-primary-600 font-semibold mt-1">
              {formatCurrency(product.price)}
            </p>
          </div>
        ))}

        {/* Botão para ver todos os produtos */}
        {totalCount > 0 && (
          <button
            onClick={handleOpenModal}
            className="flex-shrink-0 w-20 p-2 bg-primary-50 rounded-lg border border-primary-200 flex flex-col items-center justify-center gap-1 hover:bg-primary-100 hover:border-primary-300 transition-colors group"
          >
            <Eye className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
            <span className="text-xs font-medium text-primary-600">
              {remaining > 0 ? `+${remaining}` : 'Ver'}
            </span>
          </button>
        )}
      </div>

      {/* Modal com todos os produtos */}
      <ProductPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignSlug={campaignSlug}
        campaignName={campaignName}
        products={productsForModal}
        totalCount={totalCount}
      />
    </>
  );
}
