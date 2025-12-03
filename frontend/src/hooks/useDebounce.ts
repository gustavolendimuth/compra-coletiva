import { useState, useEffect } from 'react';

/**
 * Hook que retorna um valor com debounce.
 * Útil para evitar chamadas excessivas de API durante digitação.
 *
 * @param value - O valor a ser "debounced"
 * @param delay - O tempo de delay em milissegundos (default: 300ms)
 * @returns O valor com debounce aplicado
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // Esta chamada só acontece 300ms após o usuário parar de digitar
 *   api.search(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
