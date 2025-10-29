import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Plus,
  Package,
  ShoppingBag,
  TrendingUp,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import {
  campaignApi,
  productApi,
  orderApi,
  analyticsApi,
  Product,
  Order
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'analytics'>('products');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    weight: 0
  });

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    items: [{ productId: '', quantity: 1 }]
  });

  const [shippingCost, setShippingCost] = useState(0);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.getById(id!),
    enabled: !!id
  });

  const { data: products } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getByCampaign(id!),
    enabled: !!id
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getByCampaign(id!),
    enabled: !!id
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => analyticsApi.getByCampaign(id!),
    enabled: !!id && activeTab === 'analytics'
  });

  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      toast.success('Produto adicionado!');
      setIsProductModalOpen(false);
      setProductForm({ name: '', price: 0, weight: 0 });
    },
    onError: () => toast.error('Erro ao adicionar produto')
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      toast.success('Produto removido!');
    },
    onError: () => toast.error('Erro ao remover produto')
  });

  const createOrderMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido criado!');
      setIsOrderModalOpen(false);
      setOrderForm({ customerName: '', items: [{ productId: '', quantity: 1 }] });
    },
    onError: () => toast.error('Erro ao criar pedido')
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Partial<Order> }) =>
      orderApi.update(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar pedido')
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido removido!');
    },
    onError: () => toast.error('Erro ao remover pedido')
  });

  const updateShippingMutation = useMutation({
    mutationFn: (cost: number) => campaignApi.update(id!, { shippingCost: cost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Frete atualizado!');
      setIsShippingModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar frete')
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({ ...productForm, campaignId: id! });
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderForm.items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }
    createOrderMutation.mutate({
      campaignId: id!,
      customerName: orderForm.customerName,
      items: validItems
    });
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateShippingMutation.mutate(shippingCost);
  };

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/campaigns" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-gray-600">{campaign.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Frete Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(campaign.shippingCost)}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShippingCost(campaign.shippingCost);
                setIsShippingModalOpen(true);
              }}
              className="mt-2"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar Frete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'products'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Produtos
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 inline mr-2" />
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Resumo
        </button>
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Produtos</h2>
            <Button onClick={() => setIsProductModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Produto
            </Button>
          </div>

          {products && products.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Produto</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Preço</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Peso (g)</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products?.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.weight}g</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este produto?')) {
                              deleteProductMutation.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pedidos</h2>
            <Button onClick={() => setIsOrderModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Novo Pedido
            </Button>
          </div>

          {orders && orders.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum pedido criado</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders?.map((order) => (
                <Card key={order.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.customerName}</h3>
                      <p className="text-sm text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={order.isPaid ? 'primary' : 'ghost'}
                        onClick={() =>
                          updateOrderMutation.mutate({
                            orderId: order.id,
                            data: { isPaid: !order.isPaid }
                          })
                        }
                        title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        {order.isPaid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este pedido?')) {
                            deleteOrderMutation.mutate(order.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="text-gray-900">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="text-gray-900">{formatCurrency(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.isPaid ? 'Pago' : 'Não Pago'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total de Itens</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.totalQuantity}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total sem Frete</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.totalWithoutShipping)}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total com Frete</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.totalWithShipping)}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Pago</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(analytics.totalPaid)}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">Total Não Pago</div>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(analytics.totalUnpaid)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Por Produto</h3>
              <div className="space-y-2">
                {analytics.byProduct.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-gray-600">{item.productName}</span>
                    <span className="font-medium text-gray-900">{item.quantity} unidades</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Por Cliente</h3>
              <div className="space-y-2">
                {analytics.byCustomer.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600">{item.customerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        item.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Produto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Adicionar Produto"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso (gramas) *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={productForm.weight}
              onChange={(e) => setProductForm({ ...productForm, weight: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createProductMutation.isPending} className="flex-1">
              {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Pedido */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Novo Pedido"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={orderForm.customerName}
              onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produtos *
            </label>
            {orderForm.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...orderForm.items];
                    newItems[index].productId = e.target.value;
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Selecione um produto</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...orderForm.items];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {orderForm.items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const newItems = orderForm.items.filter((_, i) => i !== index);
                      setOrderForm({ ...orderForm, items: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOrderForm({
                  ...orderForm,
                  items: [...orderForm.items, { productId: '', quantity: 1 }]
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Produto
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createOrderMutation.isPending} className="flex-1">
              {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOrderModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Frete */}
      <Modal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        title="Editar Frete Total"
      >
        <form onSubmit={handleUpdateShipping} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do Frete Total (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              O frete será distribuído proporcionalmente ao peso de cada pedido.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateShippingMutation.isPending} className="flex-1">
              {updateShippingMutation.isPending ? 'Atualizando...' : 'Atualizar Frete'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShippingModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
