import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";

import { getChatsCollection } from "@/lib/db/collections";
import type { ChatDocument, ChatMessageDocument } from "@/lib/db/schema";

export async function getOrCreateChatSession(options: {
  sessionId?: string;
  articleId: string;
  articleTitle: string;
}) {
  if (!ObjectId.isValid(options.articleId)) {
    throw new Error("Invalid articleId");
  }

  const collection = await getChatsCollection();
  const articleObjectId = new ObjectId(options.articleId);
  const sessionId = options.sessionId?.trim() || randomUUID();
  const existing = await collection.findOne({
    sessionId,
    articleId: articleObjectId,
  });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const doc: ChatDocument = {
    sessionId,
    articleId: articleObjectId,
    messages: [],
    articleTitle: options.articleTitle,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function appendChatMessages(options: {
  sessionId: string;
  articleId: string;
  messages: ChatMessageDocument[];
}) {
  if (!ObjectId.isValid(options.articleId)) {
    throw new Error("Invalid articleId");
  }

  const collection = await getChatsCollection();
  await collection.updateOne(
    {
      sessionId: options.sessionId,
      articleId: new ObjectId(options.articleId),
    },
    {
      $push: { messages: { $each: options.messages } },
      $set: { updatedAt: new Date() },
    }
  );
}
