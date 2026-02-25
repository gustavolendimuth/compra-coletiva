import { useState } from "react";
import {
  Package,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, ConfirmModal } from "@/components/ui";
import IconButton from "@/components/IconButton";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/api";

interface ProductsTabProps {
  products: Product[];
  sortedProducts: Product[];
  isActive: boolean;
  canEditCampaign: boolean;
  sortField: "name" | "price" | "weight";
  sortDirection: "asc" | "desc";
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSort: (field: "name" | "price" | "weight") => void;
}

export function ProductsTab({
  products,
  sortedProducts,
  isActive,
  canEditCampaign,
  sortField,
  sortDirection,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onSort,
}: ProductsTabProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-sky-300" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-sky-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-sky-600" />
    );
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="font-display text-2xl font-bold text-sky-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </span>
          Produtos
        </h2>
        {isActive && canEditCampaign && (
          <IconButton
            size="sm"
            icon={<Package className="w-4 h-4" />}
            onClick={onAddProduct}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            Adicionar Produto
          </IconButton>
        )}
      </div>

      {products && products.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-sky-600">Nenhum produto cadastrado</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile: Sorting Controls */}
          <div className="md:hidden mb-3">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => onSort("name")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "name"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-sky-50/60 text-sky-700 hover:bg-sky-100/60"
                }`}
              >
                <span>Nome</span>
                {renderSortIcon("name")}
              </button>
              <button
                onClick={() => onSort("price")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "price"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-sky-50/60 text-sky-700 hover:bg-sky-100/60"
                }`}
              >
                <span>Preço</span>
                {renderSortIcon("price")}
              </button>
              <button
                onClick={() => onSort("weight")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "weight"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-sky-50/60 text-sky-700 hover:bg-sky-100/60"
                }`}
              >
                <span>Peso</span>
                {renderSortIcon("weight")}
              </button>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="space-y-2 md:hidden">
            {sortedProducts?.map((product) => (
              <Card key={product.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sky-900">
                      {product.name}
                    </h3>
                    {isActive && canEditCampaign && (
                      <div className="flex gap-1 flex-shrink-0">
                        <IconButton
                          size="sm"
                          variant="secondary"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => onEditProduct(product)}
                          title="Editar produto"
                        />
                        <IconButton
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteClick(product)}
                          title="Remover produto"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-sky-600">Preço:</span>
                      <span className="font-medium text-sky-900">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sky-600">Peso:</span>
                      <span className="font-medium text-sky-900">
                        {product.weight}g
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-sky-800 cursor-pointer hover:bg-sky-50/40 transition-colors"
                      onClick={() => onSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Produto</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-sky-800 cursor-pointer hover:bg-sky-50/40 transition-colors"
                      onClick={() => onSort("price")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Preço</span>
                        {renderSortIcon("price")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-sky-800 cursor-pointer hover:bg-sky-50/40 transition-colors"
                      onClick={() => onSort("weight")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Peso</span>
                        {renderSortIcon("weight")}
                      </div>
                    </th>
                    {isActive && canEditCampaign && (
                      <th className="px-4 py-3 text-right text-sm font-medium text-sky-800">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedProducts?.map((product) => (
                    <tr key={product.id} className="hover:bg-sky-50/30">
                      <td className="px-4 py-3 text-sm text-sky-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-sky-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-sky-900">
                        {product.weight}g
                      </td>
                      {isActive && canEditCampaign && (
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <IconButton
                              size="sm"
                              variant="secondary"
                              icon={<Edit className="w-4 h-4" />}
                              onClick={() => onEditProduct(product)}
                              title="Editar produto"
                            />
                            <IconButton
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => handleDeleteClick(product)}
                              title="Remover produto"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Produto"
        message={
          productToDelete ? (
            <>
              <p>Tem certeza que deseja remover o produto <strong>{productToDelete.name}</strong>?</p>
              <p className="mt-2 text-sm text-sky-600">Esta ação não pode ser desfeita.</p>
            </>
          ) : (
            ""
          )
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
