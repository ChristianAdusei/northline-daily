import type { ObjectId } from "mongodb";

export const ARTICLE_CATEGORIES = [
  "AI",
  "Technology",
  "Startups",
  "Funding",
  "Machine Learning",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type ArticleDocument = {
  _id?: ObjectId;
  slug: string;
  title: string;
  coverImage: string;
  publisherName: string;
  publisherLogo: string;
  authorName: string;
  datePosted: Date;
  quickSummary: string;
  detailedSummary: string;
  whyItMatters: string;
  sourceUrl: string;
  originalContent: string;
  category: ArticleCategory;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageDocument = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export type ChatDocument = {
  _id?: ObjectId;
  sessionId: string;
  articleId: ObjectId;
  messages: ChatMessageDocument[];
  articleTitle: string;
  createdAt: Date;
  updatedAt: Date;
};

export const COLLECTIONS = {
  articles: "articles",
  chats: "chats",
} as const;
