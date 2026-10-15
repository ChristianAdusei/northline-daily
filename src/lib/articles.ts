import { createHash } from "crypto";

import type { NewsApiArticle } from "@/lib/newsapi";
import {
  ARTICLE_CATEGORIES,
  type ArticleCategory,
  type ArticleDocument,
} from "@/lib/db/schema";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";

const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1611162616471-46b023ceafbb?auto=format&fit=crop&w=128&q=80";

/** Accept real publisher image URLs (query strings, CDNs, etc.). */
function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ensureUrl(value: string | null | undefined, fallback: string) {
  const candidate = value?.trim();
  if (candidate && isHttpUrl(candidate)) {
    return candidate;
  }
  return fallback;
}

export function isArticleCategory(value: string): value is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

export function inferCategory(text: string): ArticleCategory {
  const value = text.toLowerCase();
  if (/\bfunding\b|raises \$|series [a-d]\b|venture capital|\bseed round\b/.test(value)) {
    return "Funding";
  }
  if (/\bstart-?ups?\b/.test(value)) {
    return "Startups";
  }
  if (
    /machine learning|\bml\b|neural net|deep learning|computer vision/.test(
      value
    )
  ) {
    return "Machine Learning";
  }
  if (
    /\bai\b|artificial intelligence|openai|anthropic|gemini|chatgpt|llm\b/.test(
      value
    )
  ) {
    return "AI";
  }
  return "Technology";
}

/** Stable unique slug from title + source URL (avoids null/duplicate slug index errors). */
export function slugifyArticle(title: string, sourceUrl: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 8);
  return `${base || "article"}-${hash}`;
}

export function mapNewsApiArticle(
  article: NewsApiArticle,
  options?: { category?: ArticleCategory }
): ArticleDocument | null {
  if (!article.title || !article.url || article.title === "[Removed]") {
    return null;
  }

  const sourceUrl = ensureUrl(article.url, "");
  if (!sourceUrl) {
    return null;
  }

  const title = article.title.trim();
  const originalContent = [
    article.description?.trim(),
    article.content?.replace(/\s*\[\+\d+\schars\]\s*$/i, "").trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  const now = new Date();
  const datePosted = new Date(article.publishedAt);
  const category =
    options?.category ??
    inferCategory(
      `${article.title} ${article.description ?? ""} ${article.content ?? ""}`
    );

  const quickSummary =
    article.description?.trim() ||
    `Coverage from ${article.source.name || "the publisher"}.`;

  return {
    slug: slugifyArticle(title, sourceUrl),
    title,
    coverImage: ensureUrl(article.urlToImage, FALLBACK_IMAGE),
    publisherName: article.source.name?.trim() || "Unknown publisher",
    publisherLogo: FALLBACK_LOGO,
    authorName: article.author?.trim() || article.source.name || "Staff",
    datePosted: Number.isNaN(datePosted.getTime()) ? now : datePosted,
    quickSummary,
    detailedSummary: originalContent || quickSummary,
    whyItMatters:
      "This story is relevant to readers following technology and market developments.",
    sourceUrl,
    originalContent: originalContent || quickSummary,
    category,
    createdAt: now,
    updatedAt: now,
  };
}

export function formatArticleDate(date: string | Date): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function estimateReadTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}
