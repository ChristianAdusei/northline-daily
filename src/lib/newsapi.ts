export type NewsApiSource = {
  id: string | null;
  name: string;
};

export type NewsApiArticle = {
  source: NewsApiSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
};

export type NewsApiResponse = {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
  sources?: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    language: string;
    country: string;
  }>;
  code?: string;
  message?: string;
};

const NEWS_API_BASE = "https://newsapi.org/v2";

function getApiKey() {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    throw new Error("NEWS_API_KEY is not set");
  }
  return key;
}

async function newsFetch(
  path: string,
  params: Record<string, string | undefined>
): Promise<NewsApiResponse> {
  const url = new URL(`${NEWS_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set("apiKey", getApiKey());

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const data = (await response.json()) as NewsApiResponse;

  if (!response.ok || data.status === "error") {
    throw new Error(data.message ?? `News API request failed (${response.status})`);
  }

  return data;
}

/** /everything — e.g. Apple articles from today, sorted by popularity */
export async function fetchEverything(options: {
  q: string;
  from?: string;
  to?: string;
  sortBy?: "relevancy" | "popularity" | "publishedAt";
  language?: string;
  pageSize?: number;
  domains?: string;
  excludeDomains?: string;
  sources?: string;
}) {
  return newsFetch("/everything", {
    q: options.q,
    from: options.from,
    to: options.to,
    sortBy: options.sortBy ?? "popularity",
    language: options.language ?? "en",
    pageSize: String(options.pageSize ?? 20),
    domains: options.domains,
    excludeDomains: options.excludeDomains,
    sources: options.sources,
  });
}

/** /top-headlines — live headlines by country/category or source */
export async function fetchTopHeadlines(options: {
  country?: string;
  category?: string;
  sources?: string;
  q?: string;
  pageSize?: number;
}) {
  return newsFetch("/top-headlines", {
    country: options.country,
    category: options.category,
    sources: options.sources,
    q: options.q,
    pageSize: String(options.pageSize ?? 20),
  });
}

/** /top-headlines/sources — list publishers available for headlines */
export async function fetchSources(options?: {
  category?: string;
  language?: string;
  country?: string;
}) {
  return newsFetch("/top-headlines/sources", {
    category: options?.category,
    language: options?.language,
    country: options?.country,
  });
}

export function todayIsoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
