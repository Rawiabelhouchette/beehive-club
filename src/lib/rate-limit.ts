/**
 * Limite simple en mémoire : N requêtes par fenêtre glissante et par clé (adresse IP).
 * Suffisant pour freiner les robots sur un formulaire ; sur plusieurs instances,
 * remplacez par un compteur partagé (ex. Upstash Redis).
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now: number = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return true;
  };
}
