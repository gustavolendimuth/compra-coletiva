/**
 * Cache em memória com limite de entradas e expiração por idade.
 * Acima do limite remove a entrada mais antiga (ordem de inserção do Map).
 */
export class BoundedTtlCache<K, V> {
  private readonly entries = new Map<K, { value: V; storedAt: number }>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: { maxEntries: number; ttlMs: number }) {
    this.maxEntries = options.maxEntries;
    this.ttlMs = options.ttlMs;
  }

  get size(): number {
    return this.entries.size;
  }

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.storedAt > this.ttlMs) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    // Reinsere para a chave ir para o fim da ordem
    this.entries.delete(key);
    this.entries.set(key, { value, storedAt: Date.now() });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as K;
      this.entries.delete(oldestKey);
    }
  }
}
