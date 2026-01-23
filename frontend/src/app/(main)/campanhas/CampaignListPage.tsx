'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Package, RefreshCw, Lightbulb, Megaphone } from 'lucide-react';
import { campaignApi } from '@/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import {
  CampaignCard,
  CampaignFilters,
  CampaignFiltersState,
  CampaignGridSkeleton,
} from '@/components/campaign';
import { Card } from '@/components/ui';

export function CampaignListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CampaignFiltersState>({});
  const debouncedSearch = useDebounce(search, 300);

  // Query com infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['campaigns', debouncedSearch, filters],
    queryFn: ({ pageParam }) =>
      campaignApi.list({
        cursor: pageParam,
        limit: 12,
        search: debouncedSearch || undefined,
        status: filters.status,
        creatorId: filters.creatorId,
        fromSellers: filters.fromSellers,
        similarProducts: filters.similarProducts,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Ref para trigger do infinite scroll
  const loadMoreRef = useIntersectionObserver(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { disabled: !hasNextPage || isFetchingNextPage }
  );

  // Flatten das páginas de campanhas
  const campaigns = data?.pages.flatMap((page) => page.data) ?? [];
  const suggestions = data?.pages[0]?.suggestions ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Estado de erro
  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary-600" />
          Campanhas
        </h1>
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro ao carregar campanhas
            </h3>
            <p className="text-gray-500 mb-4">
              {error instanceof Error
                ? error.message
                : 'Tente novamente mais tarde'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary-600" />
          Campanhas
        </h1>
      </div>

      {/* Filtros */}
      <CampaignFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        total={isLoading ? undefined : total}
      />

      {/* Loading inicial */}
      {isLoading ? (
        <CampaignGridSkeleton count={6} />
      ) : campaigns.length === 0 && suggestions.length === 0 ? (
        // Estado vazio sem sugestões
        <Card>
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearch || Object.keys(filters).length > 0
                ? 'Nenhuma campanha encontrada'
                : 'Nenhuma campanha criada'}
            </h3>
            <p className="text-gray-500">
              {debouncedSearch || Object.keys(filters).length > 0
                ? 'Tente ajustar os filtros ou termos de busca'
                : 'Use o botão "Nova Campanha" na barra superior para criar sua primeira campanha de compra coletiva'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Grid de campanhas */}
          {campaigns.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {/* Trigger para infinite scroll */}
              <div
                ref={loadMoreRef}
                className="h-16 flex items-center justify-center"
              >
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Carregando mais campanhas...</span>
                  </div>
                )}
                {!hasNextPage &&
                  campaigns.length > 0 &&
                  !suggestions.length && (
                    <p className="text-sm text-gray-400">
                      Todas as campanhas foram carregadas
                    </p>
                  )}
              </div>
            </>
          )}

          {/* Sugestões (quando não há resultados ou poucos resultados) */}
          {suggestions.length > 0 && (
            <div className="mt-8">
              {/* Divisor com texto */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Lightbulb className="w-5 h-5" />
                  <span className="font-medium">
                    {campaigns.length === 0
                      ? 'Você pode gostar destas campanhas'
                      : 'Campanhas relacionadas'}
                  </span>
                </div>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Grid de sugestões com visual diferenciado */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                {suggestions.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {/* Mensagem após sugestões */}
              {campaigns.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-6">
                  Não encontrou o que procurava? Tente ajustar os termos de
                  busca
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
