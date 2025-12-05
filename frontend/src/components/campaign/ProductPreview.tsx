import { ProductPreview as ProductPreviewType } from '@/api';
import { ProductPreviewInline } from './ProductPreviewInline';

export type ProductPreviewVariant = 'inline' | 'expandable';

interface ProductPreviewProps {
  products: ProductPreviewType[];
  totalCount: number;
  campaignId: string;
  campaignName: string;
  allProducts?: ProductPreviewType[];
  variant?: ProductPreviewVariant;
}

/**
 * Componente de abstração para preview de produtos.
 * Permite trocar facilmente a implementação entre diferentes variantes.
 *
 * @param variant - 'inline' (default) mostra produtos em linha com modal, 'expandable' (futuro) expande ao clicar
 */
export function ProductPreview({
  products,
  totalCount,
  campaignId,
  campaignName,
  allProducts
}: ProductPreviewProps) {
  // Por enquanto, apenas a variante inline está implementada
  // Quando implementar expandable, adicionar aqui:
  // if (variant === 'expandable') {
  //   return <ProductPreviewExpand products={products} totalCount={totalCount} />;
  // }

  return (
    <ProductPreviewInline
      products={products}
      totalCount={totalCount}
      campaignId={campaignId}
      campaignName={campaignName}
      allProducts={allProducts}
    />
  );
}
