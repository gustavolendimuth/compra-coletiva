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
  DollarSign,
  Search,
  Truck
} from 'lucide-react';
import {
  campaignApi,
  productApi,
  orderApi,
  analyticsApi,
  Order,
  Product
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Card from '@/components/Card';
import Modal from '@/components/Modal';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'shipping'>('overview');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    weight: 0
  });

  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: 0,
    weight: 0
  });

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    items: [{ productId: '', quantity: 1 }]
  });

  const [editOrderForm, setEditOrderForm] = useState({
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
    enabled: !!id && activeTab === 'overview'
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

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Partial<Product> }) =>
      productApi.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', id] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Produto atualizado!');
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error('Erro ao atualizar produto')
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

  const updateOrderWithItemsMutation = useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: string;
      data: { customerName?: string; items?: Array<{ productId: string; quantity: number }> }
    }) => orderApi.updateWithItems(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', id] });
      toast.success('Pedido atualizado!');
      setIsEditOrderModalOpen(false);
      setEditingOrder(null);
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

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProductMutation.mutate({
      productId: editingProduct.id,
      data: {
        name: editProductForm.name,
        price: editProductForm.price,
        weight: editProductForm.weight
      }
    });
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

  const handleEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const validItems = editOrderForm.items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }

    updateOrderWithItemsMutation.mutate({
      orderId: editingOrder.id,
      data: {
        customerName: editOrderForm.customerName,
        items: validItems
      }
    });
  };

  // Filtra pedidos baseado na busca
  const filteredOrders = orders?.filter(order =>
    order.customerName.toLowerCase().includes(orderSearch.toLowerCase())
  );

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

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-gray-600">{campaign.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'overview'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Visão Geral</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'orders'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <ShoppingBag className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Pedidos</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'products'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Package className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Produtos</span>
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center justify-center gap-2 px-3 py-2 font-medium transition-colors flex-1 md:flex-initial ${activeTab === 'shipping'
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          <Truck className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Frete</span>
        </button>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Botões de Ação Principais */}
          <div className="flex gap-2 justify-center flex-wrap">
            <IconButton
              size="sm"
              icon={<Package className="w-4 h-4" />}
              onClick={() => setIsProductModalOpen(true)}
              className="text-xs sm:text-sm"
            >
              Adicionar Produto
            </IconButton>
            <IconButton
              size="sm"
              icon={<ShoppingBag className="w-4 h-4" />}
              onClick={() => setIsOrderModalOpen(true)}
              className="text-xs sm:text-sm"
            >
              Adicionar Pedido
            </IconButton>
          </div>

          {/* Cards de Resumo */}
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

          {/* Detalhes por Produto e Cliente */}
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
                      <span className={`px-2 py-0.5 text-xs rounded-full ${item.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4 gap-2">
            <h2 className="text-xl font-semibold">Produtos</h2>
            <IconButton
              size="sm"
              icon={<Package className="w-4 h-4" />}
              onClick={() => setIsProductModalOpen(true)}
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Adicionar Produto
            </IconButton>
          </div>

          {products && products.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-2 md:hidden">
                {products?.map((product) => (
                  <Card key={product.id}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <div className="flex gap-1 flex-shrink-0">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => {
                              setEditingProduct(product);
                              setEditProductForm({
                                name: product.name,
                                price: product.price,
                                weight: product.weight
                              });
                              setIsEditProductModalOpen(true);
                            }}
                            title="Editar produto"
                          />
                          <IconButton
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este produto?')) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            title="Remover produto"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Preço: </span>
                          <span className="font-medium text-gray-900">{formatCurrency(product.price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Peso: </span>
                          <span className="font-medium text-gray-900">{product.weight}g</span>
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Produto</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Preço</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Peso</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products?.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.weight}g</td>
                          <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                            <div className="flex gap-1 justify-end">
                              <IconButton
                                size="sm"
                                variant="ghost"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => {
                                  setEditingProduct(product);
                                  setEditProductForm({
                                    name: product.name,
                                    price: product.price,
                                    weight: product.weight
                                  });
                                  setIsEditProductModalOpen(true);
                                }}
                                title="Editar produto"
                              />
                              <IconButton
                                size="sm"
                                variant="danger"
                                icon={<Trash2 className="w-4 h-4" />}
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover este produto?')) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                title="Remover produto"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div className="mb-4 space-y-3">
            <div className="flex justify-between items-center gap-2">
              <h2 className="text-xl font-semibold">Pedidos</h2>
              <IconButton
                size="sm"
                icon={<ShoppingBag className="w-4 h-4" />}
                onClick={() => setIsOrderModalOpen(true)}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                Adicionar Pedido
              </IconButton>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {filteredOrders && filteredOrders.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {orderSearch ? 'Nenhum pedido encontrado' : 'Nenhum pedido criado'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredOrders?.map((order) => (
                <Card key={order.id} className="py-3">
                  <div className="flex flex-col gap-3">
                    {/* Linha 1: Nome, status e ações */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {order.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                        <h3 className="font-semibold text-gray-900 truncate">{order.customerName}</h3>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-1 flex-shrink-0">
                        <IconButton
                          size="sm"
                          variant={order.isPaid ? 'primary' : 'ghost'}
                          icon={order.isPaid ? <Check className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                          onClick={() =>
                            updateOrderMutation.mutate({
                              orderId: order.id,
                              data: { isPaid: !order.isPaid }
                            })
                          }
                          title={order.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                        />
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => {
                            setEditingOrder(order);
                            setEditOrderForm({
                              customerName: order.customerName,
                              items: order.items.map(item => ({
                                productId: item.product.id,
                                quantity: item.quantity
                              }))
                            });
                            setIsEditOrderModalOpen(true);
                          }}
                          title="Editar pedido"
                        />
                        <IconButton
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => {
                            if (confirm('Tem certeza que deseja remover este pedido?')) {
                              deleteOrderMutation.mutate(order.id);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Linha 2: Produtos (sempre visível, sem truncar) */}
                    <p className="text-xs text-gray-500">
                      {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                    </p>

                    {/* Linha 3: Valores */}
                    <div className="flex items-center gap-3 text-sm justify-between sm:justify-start">
                      <div className="text-center sm:text-left">
                        <div className="text-gray-500 text-xs">Subtotal</div>
                        <div className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-gray-500 text-xs">Frete</div>
                        <div className="font-medium text-gray-900">{formatCurrency(order.shippingFee)}</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-gray-500 text-xs">Total</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(order.total)}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div>
          <div className="max-w-2xl mx-auto">
            <Card>
              <div className="text-center mb-6">
                <Truck className="w-16 h-16 mx-auto text-primary-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Frete Total da Campanha</h2>
                <p className="text-gray-600">
                  O frete será distribuído proporcionalmente ao peso de cada pedido
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                <div className="text-sm text-gray-500 mb-2">Valor Total do Frete</div>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {formatCurrency(campaign.shippingCost)}
                </div>
                <IconButton
                  icon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    setShippingCost(campaign.shippingCost);
                    setIsShippingModalOpen(true);
                  }}
                >
                  Editar Frete
                </IconButton>
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Como funciona a distribuição?</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>O frete é calculado com base no peso total de cada pedido</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>Pedidos mais pesados pagam proporcionalmente mais frete</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>A distribuição é recalculada automaticamente quando há mudanças nos pedidos</span>
                    </li>
                  </ul>
                </div>
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
            <Button type="submit" disabled={createProductMutation.isPending} className="flex-1 whitespace-nowrap">
              {createProductMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProductModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Produto */}
      <Modal
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        title="Editar Produto"
      >
        <form onSubmit={handleEditProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              value={editProductForm.name}
              onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
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
              value={editProductForm.price}
              onChange={(e) => setEditProductForm({ ...editProductForm, price: parseFloat(e.target.value) || 0 })}
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
              value={editProductForm.weight}
              onChange={(e) => setEditProductForm({ ...editProductForm, weight: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateProductMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateProductMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="whitespace-nowrap"
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
                  <IconButton
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      const newItems = orderForm.items.filter((_, i) => i !== index);
                      setOrderForm({ ...orderForm, items: newItems });
                    }}
                  />
                )}
              </div>
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setOrderForm({
                  ...orderForm,
                  items: [...orderForm.items, { productId: '', quantity: 1 }]
                });
              }}
            >
              Adicionar Produto
            </IconButton>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={createOrderMutation.isPending} className="flex-1 whitespace-nowrap">
              {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOrderModalOpen(false)}
              className="whitespace-nowrap"
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
            <Button type="submit" disabled={updateShippingMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateShippingMutation.isPending ? 'Atualizando...' : 'Atualizar Frete'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShippingModalOpen(false)}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Pedido */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        }}
        title="Editar Pedido"
      >
        <form onSubmit={handleEditOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={editOrderForm.customerName}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produtos *
            </label>
            {editOrderForm.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  required
                  value={item.productId}
                  onChange={(e) => {
                    const newItems = [...editOrderForm.items];
                    newItems[index].productId = e.target.value;
                    setEditOrderForm({ ...editOrderForm, items: newItems });
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
                    const newItems = [...editOrderForm.items];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setEditOrderForm({ ...editOrderForm, items: newItems });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Qtd"
                />
                {editOrderForm.items.length > 1 && (
                  <IconButton
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      const newItems = editOrderForm.items.filter((_, i) => i !== index);
                      setEditOrderForm({ ...editOrderForm, items: newItems });
                    }}
                  />
                )}
              </div>
            ))}
            <IconButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditOrderForm({
                  ...editOrderForm,
                  items: [...editOrderForm.items, { productId: '', quantity: 1 }]
                });
              }}
            >
              Adicionar Produto
            </IconButton>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateOrderWithItemsMutation.isPending} className="flex-1 whitespace-nowrap">
              {updateOrderWithItemsMutation.isPending ? 'Atualizando...' : 'Atualizar Pedido'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditOrderModalOpen(false);
                setEditingOrder(null);
              }}
              className="whitespace-nowrap"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
