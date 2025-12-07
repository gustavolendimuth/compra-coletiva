import {
  Package,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card } from "@/components/ui";
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
  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-600" />
    );
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary-600" />
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
            <p className="text-gray-500">Nenhum produto cadastrado</p>
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
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Nome</span>
                {renderSortIcon("name")}
              </button>
              <button
                onClick={() => onSort("price")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "price"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Preço</span>
                {renderSortIcon("price")}
              </button>
              <button
                onClick={() => onSort("weight")}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  sortField === "weight"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                    <h3 className="font-semibold text-gray-900">
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
                          onClick={() => {
                            if (
                              confirm(
                                "Tem certeza que deseja remover este produto?"
                              )
                            ) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          title="Remover produto"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Preço: </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Peso: </span>
                      <span className="font-medium text-gray-900">
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
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Produto</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("price")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Preço</span>
                        {renderSortIcon("price")}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSort("weight")}
                    >
                      <div className="flex items-center gap-2">
                        <span>Peso</span>
                        {renderSortIcon("weight")}
                      </div>
                    </th>
                    {isActive && canEditCampaign && (
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedProducts?.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
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
                              onClick={() => {
                                if (
                                  confirm(
                                    "Tem certeza que deseja remover este produto?"
                                  )
                                ) {
                                  onDeleteProduct(product.id);
                                }
                              }}
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
    </div>
  );
}
