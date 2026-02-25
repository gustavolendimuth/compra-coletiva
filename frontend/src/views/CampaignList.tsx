import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { campaignApi } from "@/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import {
  CampaignCard,
  CampaignFilters,
  CampaignFiltersState,
  CampaignGridSkeleton,
} from "@/components/campaign";
import { Card } from "@/components/ui";

export default function CampaignList() {
  const [search, setSearch] = useState("");
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
    queryKey: ["campaigns", debouncedSearch, filters],
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
        <h1 className="font-display text-3xl font-bold text-sky-900">
          Campanhas
        </h1>
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-sky-900 mb-2">
              Erro ao carregar campanhas
            </h3>
            <p className="text-sky-600/60 mb-6">
              {error instanceof Error
                ? error.message
                : "Tente novamente mais tarde"}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-2xl font-medium shadow-sm shadow-sky-300/30 hover:shadow-md hover:shadow-sky-300/40 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
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
        <h1 className="font-display text-3xl font-bold text-sky-900">
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
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-amber-100 to-sky-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-sky-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-sky-900 mb-2">
              {debouncedSearch || Object.keys(filters).length > 0
                ? "Nenhuma campanha encontrada"
                : "Nenhuma campanha criada"}
            </h3>
            <p className="text-sky-600/60 max-w-sm mx-auto">
              {debouncedSearch || Object.keys(filters).length > 0
                ? "Tente ajustar os filtros ou termos de busca"
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
                  <div className="flex items-center gap-2 text-sky-500/60">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm font-medium">Carregando mais campanhas...</span>
                  </div>
                )}
                {!hasNextPage &&
                  campaigns.length > 0 &&
                  !suggestions.length && (
                    <p className="text-sm text-sky-400/60">
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
                <div className="flex-1 border-t border-sky-100"></div>
                <div className="flex items-center gap-2 text-sky-600/60">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a7 7 0 015.45 11.43L17 20H7l-.45-6.57A7 7 0 0112 2zm0 2a5 5 0 00-3.89 8.14L8.5 18h7l.39-5.86A5 5 0 0012 4zm-1 14h2v2h-2v-2z"/>
                  </svg>
                  <span className="text-sm font-medium">
                    {campaigns.length === 0
                      ? "Você pode gostar destas campanhas"
                      : "Campanhas relacionadas"}
                  </span>
                </div>
                <div className="flex-1 border-t border-sky-100"></div>
              </div>

              {/* Grid de sugestões com visual diferenciado */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                {suggestions.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {/* Mensagem após sugestões */}
              {campaigns.length === 0 && (
                <p className="text-center text-sm text-sky-400/60 mt-6">
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
