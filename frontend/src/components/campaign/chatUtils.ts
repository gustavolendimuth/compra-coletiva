/**
 * Shared utilities for chat components
 * Provides formatting and time calculation helpers
 */

/**
 * Format time relative to now (e.g., "5min atrás", "2h atrás")
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR');
};

/**
 * Format time as HH:MM
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format date as "Hoje", "Ontem", or DD/MM/YYYY
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};

/**
 * Get account age formatted (e.g., "5h", "3d", "2m")
 */
export const getAccountAge = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
};

/**
 * Get spam score color classes
 */
export const getSpamScoreColor = (score: number): string => {
  if (score < 30) return 'text-green-600 bg-green-100';
  if (score < 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};
