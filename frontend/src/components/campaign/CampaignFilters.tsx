import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { ProximitySearch } from "./ProximitySearch";

export type CampaignStatusFilter =
  | "ACTIVE"
  | "CLOSED"
  | "SENT"
  | "ARCHIVED"
  | undefined;
export type CampaignQuickFilter =
  | "all"
  | "mine"
  | "fromSellers"
  | "similarProducts";

export interface CampaignFiltersState {
  status?: CampaignStatusFilter;
  creatorId?: string;
  fromSellers?: boolean;
  similarProducts?: boolean;
}

interface CampaignFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CampaignFiltersState;
  onFiltersChange: (filters: CampaignFiltersState) => void;
  total?: number;
  onProximitySearch?: (zipCode: string, maxDistance: number) => void;
  onProximityClear?: () => void;
  isProximityActive?: boolean;
}

const statusOptions = [
  { value: undefined, label: "Todos os status" },
  { value: "ACTIVE" as const, label: "Ativas" },
  { value: "CLOSED" as const, label: "Fechadas" },
  { value: "SENT" as const, label: "Enviadas" },
  { value: "ARCHIVED" as const, label: "Arquivadas" },
];

export function CampaignFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  total,
  onProximitySearch,
  onProximityClear,
  isProximityActive = false,
}: CampaignFiltersProps) {
  const { user } = useAuth();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Determinar qual filtro rápido está ativo
  const getActiveQuickFilter = (): CampaignQuickFilter => {
    if (filters.fromSellers) return "fromSellers";
    if (filters.similarProducts) return "similarProducts";
    if (filters.creatorId === user?.id) return "mine";
    return "all";
  };

  const activeQuickFilter = getActiveQuickFilter();

  // Handler para filtros rápidos
  const handleQuickFilter = (filter: CampaignQuickFilter) => {
    const newFilters: CampaignFiltersState = { status: filters.status };

    switch (filter) {
      case "mine":
        if (user) newFilters.creatorId = user.id;
        break;
      case "fromSellers":
        newFilters.fromSellers = true;
        break;
      case "similarProducts":
        newFilters.similarProducts = true;
        break;
      // 'all' não adiciona nenhum filtro extra
    }

    onFiltersChange(newFilters);
  };

  // Handler para filtro de status
  const handleStatusChange = (status: CampaignStatusFilter) => {
    onFiltersChange({ ...filters, status });
    setIsStatusOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedStatus = statusOptions.find(
    (opt) => opt.value === filters.status
  );

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-sky-400 z-10" />
        <Input
          type="text"
          placeholder="Buscar campanhas ou produtos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-12 py-3 rounded-xl shadow-sm transition-shadow hover:shadow-md"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors p-1 rounded-full hover:bg-sky-50 z-10"
            title="Limpar busca"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtros rápidos e status */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Filtros rápidos (tabs) */}
        <div className="flex gap-2 overflow-x-auto pb-3 sm:pb-0 scrollbar-thin scrollbar-thumb-sky-200 scrollbar-track-transparent hover:scrollbar-thumb-sky-300">
          <QuickFilterButton
            active={activeQuickFilter === "all"}
            onClick={() => handleQuickFilter("all")}
          >
            Todas
          </QuickFilterButton>

          {user && (
            <>
              <QuickFilterButton
                active={activeQuickFilter === "mine"}
                onClick={() => handleQuickFilter("mine")}
              >
                Minhas
              </QuickFilterButton>

              <QuickFilterButton
                active={activeQuickFilter === "fromSellers"}
                onClick={() => handleQuickFilter("fromSellers")}
              >
                Vendedores conhecidos
              </QuickFilterButton>

              <QuickFilterButton
                active={activeQuickFilter === "similarProducts"}
                onClick={() => handleQuickFilter("similarProducts")}
              >
                Produtos similares
              </QuickFilterButton>
            </>
          )}
        </div>

        {/* Status dropdown + Total */}
        <div className="flex items-center gap-3">
          {/* Contador */}
          {total !== undefined && (
            <span className="text-sm text-sky-500/60 whitespace-nowrap font-medium">
              {total} {total === 1 ? "campanha" : "campanhas"}
            </span>
          )}

          {/* Status dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-sky-200/70 rounded-2xl text-sm font-medium text-sky-800 hover:bg-sky-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{selectedStatus?.label || "Status"}</span>
              <svg
                className={`w-4 h-4 text-sky-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-sky-100 rounded-2xl shadow-lg shadow-sky-100/50 z-10 py-2 overflow-hidden">
                {statusOptions.map((option) => (
                  <button
                    key={option.value ?? "all"}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filters.status === option.value
                        ? "text-sky-700 font-medium bg-sky-50"
                        : "text-sky-800/70 hover:bg-sky-50/60"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Busca por proximidade */}
      {onProximitySearch && onProximityClear && (
        <ProximitySearch
          onSearch={onProximitySearch}
          onClear={onProximityClear}
          isActive={isProximityActive}
        />
      )}
    </div>
  );
}

interface QuickFilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function QuickFilterButton({
  active,
  onClick,
  children,
}: QuickFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-300/30"
          : "bg-white/80 text-sky-700 border border-sky-200/60 hover:bg-sky-50 hover:border-sky-300"
      }`}
    >
      {children}
    </button>
  );
}
