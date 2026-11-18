/**
 * Lecture du contenu Sanity via l'API HTTP (pas de dépendance npm).
 * Actif uniquement si SANITY_PROJECT_ID est défini.
 */
const API_VERSION = "2024-10-01";

export function sanityConfig(env: Record<string, string | undefined> = process.env) {
  const projectId = env.SANITY_PROJECT_ID;
  if (!projectId) return null;
  return { projectId, dataset: env.SANITY_DATASET || "production" };
}

export async function sanityQuery<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const config = sanityConfig();
  if (!config) throw new Error("Sanity n'est pas configuré (SANITY_PROJECT_ID manquant).");
  const url = new URL(
    `https://${config.projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${config.dataset}`,
  );
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }
  const response = await fetch(url, { next: { revalidate: 60, tags: ["sanity"] } });
  if (!response.ok) {
    throw new Error(`Sanity a répondu ${response.status} pour la requête ${query.slice(0, 60)}…`);
  }
  const json = (await response.json()) as { result: T };
  return json.result;
}
