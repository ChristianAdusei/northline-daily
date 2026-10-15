import "server-only";

import {
  ensureArticlesSeeded,
  getStoredArticleById,
  getStoredArticleBySlug,
  listStoredArticles,
} from "@/lib/news-store";
import {
  serializeArticle,
  type PublicArticle,
} from "@/lib/serialize";

/**
 * Frontend → MongoDB via the data layer.
 * Reads live articles only; seeds once if the collection is empty.
 */
export async function fetchArticlesFromApi(
  limit = 10
): Promise<PublicArticle[]> {
  const existing = await listStoredArticles(limit);
  if (existing.length > 0) {
    return existing.map(serializeArticle);
  }

  const seeded = await ensureArticlesSeeded();
  return seeded.slice(0, limit).map(serializeArticle);
}

export async function fetchArticleFromApi(
  slug: string
): Promise<PublicArticle | null> {
  const article =
    (await getStoredArticleBySlug(slug)) ??
    (await getStoredArticleById(slug));

  return article ? serializeArticle(article) : null;
}
