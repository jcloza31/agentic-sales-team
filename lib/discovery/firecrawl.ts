import "server-only";

export function isFirecrawlConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY);
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface RawResult {
  title?: string;
  url?: string;
  link?: string;
  description?: string;
  markdown?: string;
  metadata?: { title?: string; sourceURL?: string; description?: string };
}

// A web-search call for brand discovery — runs inside a Node API route,
// not the batch jobs runner (see app/api/scrape/route.ts).
export async function firecrawlSearch(query: string, limit = 8): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ query, limit }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    // Firecrawl's /v2/search nests organic results under data.web (not a
    // bare array at data.data) — fall back to other shapes defensively.
    const items: RawResult[] = data?.data?.web ?? data?.data ?? data?.results ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((it) => ({
      title: it.title ?? it.metadata?.title ?? "",
      url: it.url ?? it.link ?? it.metadata?.sourceURL ?? "",
      description: it.description ?? it.metadata?.description ?? (typeof it.markdown === "string" ? it.markdown.slice(0, 300) : ""),
    }));
  } finally {
    clearTimeout(timeout);
  }
}
