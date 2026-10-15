import { ObjectId, type Collection } from "mongodb";

import { selectAndSummarizeAiTechNews } from "@/lib/ai-news";
import { mapNewsApiArticle, slugifyArticle } from "@/lib/articles";
import { getArticlesCollection } from "@/lib/db/collections";
import { ensureLiveValidators } from "@/lib/db/ensure-validators";
import type { ArticleDocument } from "@/lib/db/schema";
import { getDb } from "@/lib/mongodb";
import {
  fetchEverything,
  type NewsApiArticle,
  todayIsoDate,
} from "@/lib/newsapi";
import {
  AI_TECH_QUERY,
  TOP_TECH_DOMAINS,
} from "@/lib/tech-publishers";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";
const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1611162616471-46b023ceafbb?auto=format&fit=crop&w=128&q=80";

async function ensureSlugIndex(collection: Collection<ArticleDocument>) {
  const indexes = await collection.indexes();
  const slugIndex = indexes.find(
    (index) => index.name === "slug_1" || index.key?.slug === 1
  );

  if (slugIndex?.name) {
    await collection.dropIndex(slugIndex.name);
  }

  await collection.createIndex({ slug: 1 }, { name: "slug_1", unique: true });
}

function dedupeCandidates(articles: NewsApiArticle[]) {
  const seen = new Set<string>();
  const unique: NewsApiArticle[] = [];

  for (const article of articles) {
    if (!article.title || !article.url || article.title === "[Removed]") {
      continue;
    }
    const key = article.url.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }

  return unique;
}

function sanitizeHttpUrl(value: string, fallback: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}

/** Ensure every field satisfies the MongoDB JSON schema before insert. */
function sanitizeArticle(article: ArticleDocument): ArticleDocument {
  const now = new Date();
  const sourceUrl = sanitizeHttpUrl(article.sourceUrl, "");
  if (!sourceUrl) {
    throw new Error(`Invalid sourceUrl for article: ${article.title}`);
  }

  return {
    slug: (article.slug || slugifyArticle(article.title, sourceUrl)).trim(),
    title: article.title.trim() || "Untitled article",
    coverImage: sanitizeHttpUrl(article.coverImage, FALLBACK_IMAGE),
    publisherName: article.publisherName.trim() || "Unknown publisher",
    publisherLogo: sanitizeHttpUrl(article.publisherLogo, FALLBACK_LOGO),
    authorName: article.authorName.trim() || "Staff",
    datePosted:
      article.datePosted instanceof Date &&
      !Number.isNaN(article.datePosted.getTime())
        ? article.datePosted
        : now,
    quickSummary: article.quickSummary?.trim() || "Summary unavailable.",
    detailedSummary:
      article.detailedSummary?.trim() ||
      article.quickSummary?.trim() ||
      "Detailed summary unavailable.",
    whyItMatters:
      article.whyItMatters?.trim() ||
      "This story is relevant to AI and technology readers.",
    sourceUrl,
    originalContent:
      article.originalContent?.trim() ||
      article.detailedSummary?.trim() ||
      article.quickSummary?.trim() ||
      "Original content unavailable.",
    category: article.category,
    createdAt:
      article.createdAt instanceof Date &&
      !Number.isNaN(article.createdAt.getTime())
        ? article.createdAt
        : now,
    updatedAt: now,
  };
}

/** Fetch from top tech publishers, AI-select 10 AI/tech stories, write Gemini summaries to MongoDB. */
export async function syncNewsFeeds() {
  const db = await getDb();
  await ensureLiveValidators(db);

  const today = todayIsoDate();
  const from = todayIsoDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  const domains = TOP_TECH_DOMAINS.join(",");

  const sourced = await fetchEverything({
    q: AI_TECH_QUERY,
    domains,
    from,
    to: today,
    sortBy: "popularity",
    language: "en",
    pageSize: 40,
  });

  const candidates = dedupeCandidates(sourced.articles ?? []);
  if (candidates.length === 0) {
    throw new Error(
      "No articles returned from top tech publishers. Try syncing again later."
    );
  }

  const selected = await selectAndSummarizeAiTechNews(candidates, 10);
  const processed: ArticleDocument[] = [];
  const seenSlugs = new Set<string>();

  for (const pick of selected) {
    const raw = candidates[pick.index];
    if (!raw) continue;

    const mapped = mapNewsApiArticle(raw, { category: pick.category });
    if (!mapped) continue;

    mapped.slug = slugifyArticle(mapped.title, mapped.sourceUrl);
    mapped.quickSummary = pick.quickSummary;
    mapped.detailedSummary = pick.detailedSummary;
    mapped.whyItMatters = pick.whyItMatters;

    const clean = sanitizeArticle(mapped);
    if (seenSlugs.has(clean.slug)) continue;
    seenSlugs.add(clean.slug);
    processed.push(clean);
  }

  if (processed.length === 0) {
    throw new Error("Gemini selection produced no valid articles.");
  }

  const collection = await getArticlesCollection();
  await ensureSlugIndex(collection);

  // Replace feed with fully valid documents (avoids partial upsert validation issues).
  await collection.deleteMany({});
  const result = await collection.insertMany(processed, { ordered: false });

  return {
    upserted: result.insertedCount,
    curated: result.insertedCount,
    candidateCount: candidates.length,
    publishers: TOP_TECH_DOMAINS,
    totalResults: sourced.totalResults ?? 0,
  };
}

export async function listStoredArticles(limit = 24) {
  const collection = await getArticlesCollection();
  return collection.find({}).sort({ datePosted: -1 }).limit(limit).toArray();
}

export async function getStoredArticleById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getArticlesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function getStoredArticleBySlug(slug: string) {
  const collection = await getArticlesCollection();
  return collection.findOne({ slug });
}

export async function ensureArticlesSeeded() {
  const collection = await getArticlesCollection();
  const count = await collection.countDocuments();
  if (count === 0) {
    await syncNewsFeeds();
  }
  return listStoredArticles(10);
}
