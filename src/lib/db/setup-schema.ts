import type { Db } from "mongodb";

import { ARTICLE_CATEGORIES, COLLECTIONS } from "@/lib/db/schema";

const URL_PATTERN = "^https?:\\/\\/.+";

export const articlesValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "slug",
      "title",
      "coverImage",
      "publisherName",
      "publisherLogo",
      "authorName",
      "datePosted",
      "quickSummary",
      "detailedSummary",
      "whyItMatters",
      "sourceUrl",
      "originalContent",
      "category",
      "createdAt",
      "updatedAt",
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      slug: {
        bsonType: "string",
        minLength: 1,
        description: "Unique URL slug — required",
      },
      title: {
        bsonType: "string",
        minLength: 1,
        description: "Article title — required",
      },
      coverImage: {
        bsonType: "string",
        pattern: URL_PATTERN,
        description: "Cover image URL — required",
      },
      publisherName: {
        bsonType: "string",
        minLength: 1,
        description: "Publisher name — required",
      },
      publisherLogo: {
        bsonType: "string",
        pattern: URL_PATTERN,
        description: "Publisher logo URL — required",
      },
      authorName: {
        bsonType: "string",
        minLength: 1,
        description: "Author name — required",
      },
      datePosted: {
        bsonType: "date",
        description: "Original publish date — required",
      },
      quickSummary: {
        bsonType: "string",
        description: "Short AI summary — required",
      },
      detailedSummary: {
        bsonType: "string",
        description: "Longer AI summary — required",
      },
      whyItMatters: {
        bsonType: "string",
        description: "AI why-it-matters blurb — required",
      },
      sourceUrl: {
        bsonType: "string",
        pattern: URL_PATTERN,
        description: "Canonical source URL — required, unique",
      },
      originalContent: {
        bsonType: "string",
        description: "Original article text/snippet — required",
      },
      category: {
        enum: [...ARTICLE_CATEGORIES],
        description: "Constrained category enum — required",
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

export const chatsValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "sessionId",
      "articleId",
      "messages",
      "articleTitle",
      "createdAt",
      "updatedAt",
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      sessionId: {
        bsonType: "string",
        minLength: 1,
        description: "Chat session id — required",
      },
      articleId: {
        bsonType: "objectId",
        description: "Reference to articles._id — required",
      },
      messages: {
        bsonType: "array",
        description: "Conversation history — required",
        items: {
          bsonType: "object",
          required: ["id", "text", "isUser", "timestamp"],
          additionalProperties: false,
          properties: {
            id: { bsonType: "string", minLength: 1 },
            text: { bsonType: "string", minLength: 1 },
            isUser: { bsonType: "bool" },
            timestamp: { bsonType: "date" },
          },
        },
      },
      articleTitle: {
        bsonType: "string",
        minLength: 1,
        description: "Denormalized article title — required",
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function ensureCollection(
  db: Db,
  name: string,
  validator: Record<string, unknown>
) {
  const existing = await db.listCollections({ name }).toArray();

  if (existing.length === 0) {
    await db.createCollection(name, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
    return { name, action: "created" as const };
  }

  // Replace incompatible legacy docs before attaching strict validation.
  await db.collection(name).deleteMany({});
  await db.command({
    collMod: name,
    validator,
    validationLevel: "strict",
    validationAction: "error",
  });
  return { name, action: "updated" as const };
}

export async function setupDatabaseSchema(db: Db) {
  const articles = await ensureCollection(
    db,
    COLLECTIONS.articles,
    articlesValidator
  );
  const chats = await ensureCollection(db, COLLECTIONS.chats, chatsValidator);

  const articlesCol = db.collection(COLLECTIONS.articles);
  const chatsCol = db.collection(COLLECTIONS.chats);

  // Drop legacy indexes that conflict with the new schema (e.g. slug_1).
  const articleIndexes = await articlesCol.indexes();
  for (const index of articleIndexes) {
    if (index.name && index.name !== "_id_") {
      await articlesCol.dropIndex(index.name);
    }
  }
  const chatIndexes = await chatsCol.indexes();
  for (const index of chatIndexes) {
    if (index.name && index.name !== "_id_") {
      await chatsCol.dropIndex(index.name);
    }
  }

  await articlesCol.createIndexes([
    {
      key: { sourceUrl: 1 },
      name: "sourceUrl_unique",
      unique: true,
    },
    {
      key: { slug: 1 },
      name: "slug_1",
      unique: true,
    },
    {
      key: { category: 1, datePosted: -1 },
      name: "category_datePosted",
    },
    {
      key: { datePosted: -1 },
      name: "datePosted_desc",
    },
    {
      key: { createdAt: -1 },
      name: "createdAt_desc",
    },
  ]);

  await chatsCol.createIndexes([
    {
      key: { sessionId: 1 },
      name: "sessionId",
    },
    {
      key: { sessionId: 1, createdAt: -1 },
      name: "sessionId_createdAt",
    },
    {
      key: { articleId: 1, createdAt: -1 },
      name: "articleId_createdAt",
    },
  ]);

  return {
    collections: [articles, chats],
    indexes: {
      articles: await articlesCol.indexes(),
      chats: await chatsCol.indexes(),
    },
  };
}
