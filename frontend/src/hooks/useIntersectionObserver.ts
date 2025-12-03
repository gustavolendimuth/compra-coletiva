import { useRef, useEffect, useCallback } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** Se true, o observer não será ativado */
  disabled?: boolean;
}

/**
 * Hook para observar quando um elemento entra na viewport.
 * Útil para implementar infinite scroll.
 *
 * @param callback - Função a ser chamada quando o elemento entrar na viewport
 * @param options - Opções do IntersectionObserver + flag disabled
 * @returns Ref para anexar ao elemento a ser observado
 *
 * @example
 * const loadMoreRef = useIntersectionObserver(() => {
 *   if (hasNextPage && !isFetchingNextPage) {
 *     fetchNextPage();
 *   }
 * }, { disabled: !hasNextPage });
 *
 * return (
 *   <>
 *     <CampaignGrid campaigns={campaigns} />
 *     <div ref={loadMoreRef} className="h-10" />
 *   </>
 * );
 */
export function useIntersectionObserver(
  callback: () => void,
  options?: UseIntersectionObserverOptions
) {
  const { disabled, ...observerOptions } = options ?? {};
  const ref = useRef<HTMLDivElement>(null);

  // Memorizar callback para evitar recriação desnecessária do observer
  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (disabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          memoizedCallback();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Carregar um pouco antes de chegar ao fim
        threshold: 0,
        ...observerOptions
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [memoizedCallback, disabled, observerOptions]);

  return ref;
}
