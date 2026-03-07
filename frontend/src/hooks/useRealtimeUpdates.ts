import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';

interface UseRealtimeUpdatesOptions {
  campaignId: string;
  enabled?: boolean;
}

export const useRealtimeUpdates = ({
  campaignId,
  enabled = true
}: UseRealtimeUpdatesOptions) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !campaignId) return;

    const socket = getSocket();

    // Entrar na sala da campanha
    socket.emit('join-campaign', campaignId);
    console.log(`📌 Joined campaign room: ${campaignId}`);

    // Listener para quando um pedido é criado
    const handleOrderCreated = (data: unknown) => {
      console.log('📦 Order created:', data);
      queryClient.refetchQueries({ queryKey: ['orders', campaignId] });
      queryClient.refetchQueries({ queryKey: ['campaign', campaignId] });
      queryClient.refetchQueries({ queryKey: ['analytics', campaignId] });
    };

    // Listener para quando um pedido é atualizado
    const handleOrderUpdated = (data: unknown) => {
      console.log('🔄 Order updated:', data);
      queryClient.refetchQueries({ queryKey: ['orders', campaignId] });
      queryClient.refetchQueries({ queryKey: ['campaign', campaignId] });
      queryClient.refetchQueries({ queryKey: ['analytics', campaignId] });
    };

    // Listener para quando um pedido é deletado
    const handleOrderDeleted = (data: unknown) => {
      console.log('🗑️ Order deleted:', data);
      queryClient.refetchQueries({ queryKey: ['orders', campaignId] });
      queryClient.refetchQueries({ queryKey: ['campaign', campaignId] });
      queryClient.refetchQueries({ queryKey: ['analytics', campaignId] });
    };

    // Listener específico para mudanças de status (pago/separado)
    const handleOrderStatusChanged = (data: unknown) => {
      console.log('✅ Order status changed:', data);
      queryClient.refetchQueries({ queryKey: ['orders', campaignId] });
      queryClient.refetchQueries({ queryKey: ['campaign', campaignId] });
      queryClient.refetchQueries({ queryKey: ['analytics', campaignId] });
    };

    // Listener para quando a campanha é atualizada
    const handleCampaignUpdated = (data: unknown) => {
      console.log('📋 Campaign updated:', data);
      queryClient.refetchQueries({ queryKey: ['campaign', campaignId] });
      queryClient.refetchQueries({ queryKey: ['orders', campaignId] });
      queryClient.refetchQueries({ queryKey: ['analytics', campaignId] });
    };

    // Registrar listeners
    socket.on('order-created', handleOrderCreated);
    socket.on('order-updated', handleOrderUpdated);
    socket.on('order-deleted', handleOrderDeleted);
    socket.on('order-status-changed', handleOrderStatusChanged);
    socket.on('campaign-updated', handleCampaignUpdated);

    // Cleanup ao desmontar
    return () => {
      console.log(`📍 Leaving campaign room: ${campaignId}`);
      socket.emit('leave-campaign', campaignId);
      socket.off('order-created', handleOrderCreated);
      socket.off('order-updated', handleOrderUpdated);
      socket.off('order-deleted', handleOrderDeleted);
      socket.off('order-status-changed', handleOrderStatusChanged);
      socket.off('campaign-updated', handleCampaignUpdated);
    };
  }, [campaignId, enabled, queryClient]);
};

