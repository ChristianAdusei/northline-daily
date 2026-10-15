import type { Db } from "mongodb";

import { articlesValidator, chatsValidator } from "@/lib/db/setup-schema";
import { COLLECTIONS } from "@/lib/db/schema";

/** Keep Atlas validators in sync with the app schema (non-destructive). */
export async function ensureLiveValidators(db: Db) {
  const names = await db.listCollections().toArray();
  const existing = new Set(names.map((item) => item.name));

  if (!existing.has(COLLECTIONS.articles)) {
    await db.createCollection(COLLECTIONS.articles, {
      validator: articlesValidator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await db.command({
      collMod: COLLECTIONS.articles,
      validator: articlesValidator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  if (!existing.has(COLLECTIONS.chats)) {
    await db.createCollection(COLLECTIONS.chats, {
      validator: chatsValidator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await db.command({
      collMod: COLLECTIONS.chats,
      validator: chatsValidator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }
}
