import { Order } from '@/api';

// Helper function para normalizar strings (remover acentos)
export const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helper function para obter o nome de exibição do cliente
export const getCustomerDisplayName = (order: Order): string => {
  return order.customer.name;
};
