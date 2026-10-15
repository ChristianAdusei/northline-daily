import type { ArticleDocument } from "@/lib/db/schema";

/** JSON-safe article shape for API responses and the frontend. */
export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  publisherName: string;
  publisherLogo: string;
  authorName: string;
  datePosted: string;
  quickSummary: string;
  detailedSummary: string;
  whyItMatters: string;
  sourceUrl: string;
  originalContent: string;
  category: ArticleDocument["category"];
  createdAt: string;
  updatedAt: string;
};

export function serializeArticle(article: ArticleDocument): PublicArticle {
  return {
    id: String(article._id),
    slug: article.slug,
    title: article.title,
    coverImage: article.coverImage,
    publisherName: article.publisherName,
    publisherLogo: article.publisherLogo,
    authorName: article.authorName,
    datePosted:
      article.datePosted instanceof Date
        ? article.datePosted.toISOString()
        : String(article.datePosted),
    quickSummary: article.quickSummary,
    detailedSummary: article.detailedSummary,
    whyItMatters: article.whyItMatters,
    sourceUrl: article.sourceUrl,
    originalContent: article.originalContent,
    category: article.category,
    createdAt:
      article.createdAt instanceof Date
        ? article.createdAt.toISOString()
        : String(article.createdAt),
    updatedAt:
      article.updatedAt instanceof Date
        ? article.updatedAt.toISOString()
        : String(article.updatedAt),
  };
}

/** Convert PublicArticle back into the shape UI components expect. */
export function toUiArticle(article: PublicArticle): ArticleDocument {
  return {
    _id: undefined,
    slug: article.slug,
    title: article.title,
    coverImage: article.coverImage,
    publisherName: article.publisherName,
    publisherLogo: article.publisherLogo,
    authorName: article.authorName,
    datePosted: new Date(article.datePosted),
    quickSummary: article.quickSummary,
    detailedSummary: article.detailedSummary,
    whyItMatters: article.whyItMatters,
    sourceUrl: article.sourceUrl,
    originalContent: article.originalContent,
    category: article.category,
    createdAt: new Date(article.createdAt),
    updatedAt: new Date(article.updatedAt),
  };
}
