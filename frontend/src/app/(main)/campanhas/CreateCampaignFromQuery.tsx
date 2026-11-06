'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NewCampaignModal } from '@/components/NewCampaignModal';
import { CREATE_CAMPAIGN_QUERY_PARAM } from '@/lib/campaignLinks';

// Abre o formulário de nova campanha quando a URL chega com ?create=true (ex.: botões da home)
export function CreateCampaignFromQuery() {
  const searchParams = useSearchParams();
  const { isLoading, requireAuth } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasHandledQuery = useRef(false);
  const shouldOpen = searchParams.get(CREATE_CAMPAIGN_QUERY_PARAM) === 'true';

  useEffect(() => {
    // Espera o auth carregar para não pedir login de quem já está logado
    if (!shouldOpen || isLoading || hasHandledQuery.current) return;
    hasHandledQuery.current = true;

    // Remove o parâmetro para o modal não reabrir ao recarregar ou voltar
    const url = new URL(window.location.href);
    url.searchParams.delete(CREATE_CAMPAIGN_QUERY_PARAM);
    window.history.replaceState(null, '', url);

    requireAuth(() => setIsModalOpen(true));
  }, [shouldOpen, isLoading, requireAuth]);

  return (
    <NewCampaignModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
  );
}
