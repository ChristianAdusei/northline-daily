import { getDb } from "@/lib/mongodb";
import {
  COLLECTIONS,
  type ArticleDocument,
  type ChatDocument,
} from "@/lib/db/schema";
import { setupDatabaseSchema } from "@/lib/db/setup-schema";

export async function getArticlesCollection() {
  const db = await getDb();
  return db.collection<ArticleDocument>(COLLECTIONS.articles);
}

export async function getChatsCollection() {
  const db = await getDb();
  return db.collection<ChatDocument>(COLLECTIONS.chats);
}

export { setupDatabaseSchema, COLLECTIONS };
