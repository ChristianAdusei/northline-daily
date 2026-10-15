import { config } from "dotenv";
import { resolve } from "path";
import { MongoClient } from "mongodb";

config({ path: resolve(process.cwd(), ".env.local") });

const ARTICLE_CATEGORIES = [
  "AI",
  "Technology",
  "Startups",
  "Funding",
  "Machine Learning",
];

const URL_PATTERN = "^https?:\\/\\/.+";

const articlesValidator = {
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
      slug: { bsonType: "string", minLength: 1 },
      title: { bsonType: "string", minLength: 1 },
      coverImage: { bsonType: "string", pattern: URL_PATTERN },
      publisherName: { bsonType: "string", minLength: 1 },
      publisherLogo: { bsonType: "string", pattern: URL_PATTERN },
      authorName: { bsonType: "string", minLength: 1 },
      datePosted: { bsonType: "date" },
      quickSummary: { bsonType: "string" },
      detailedSummary: { bsonType: "string" },
      whyItMatters: { bsonType: "string" },
      sourceUrl: { bsonType: "string", pattern: URL_PATTERN },
      originalContent: { bsonType: "string" },
      category: { enum: ARTICLE_CATEGORIES },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

const chatsValidator = {
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
      sessionId: { bsonType: "string", minLength: 1 },
      articleId: { bsonType: "objectId" },
      messages: {
        bsonType: "array",
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
      articleTitle: { bsonType: "string", minLength: 1 },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function ensureCollection(db, name, validator) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
    return { name, action: "created" };
  }

  const count = await db.collection(name).countDocuments();
  if (count > 0) {
    console.log(`Clearing ${count} legacy document(s) from "${name}"...`);
    await db.collection(name).deleteMany({});
  }

  await db.command({
    collMod: name,
    validator,
    validationLevel: "strict",
    validationAction: "error",
  });
  return { name, action: "updated" };
}

async function resetIndexes(collection) {
  const indexes = await collection.indexes();
  for (const index of indexes) {
    if (index.name && index.name !== "_id_") {
      await collection.dropIndex(index.name);
    }
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "northline";
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env.local");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  console.log(`Connected to MongoDB database: ${dbName}`);

  const articlesResult = await ensureCollection(db, "articles", articlesValidator);
  const chatsResult = await ensureCollection(db, "chats", chatsValidator);
  console.log("Collections:", articlesResult, chatsResult);

  const articles = db.collection("articles");
  const chats = db.collection("chats");

  await resetIndexes(articles);
  await resetIndexes(chats);

  await articles.createIndexes([
    { key: { sourceUrl: 1 }, name: "sourceUrl_unique", unique: true },
    { key: { slug: 1 }, name: "slug_1", unique: true },
    { key: { category: 1, datePosted: -1 }, name: "category_datePosted" },
    { key: { datePosted: -1 }, name: "datePosted_desc" },
    { key: { createdAt: -1 }, name: "createdAt_desc" },
  ]);

  await chats.createIndexes([
    { key: { sessionId: 1 }, name: "sessionId" },
    { key: { sessionId: 1, createdAt: -1 }, name: "sessionId_createdAt" },
    { key: { articleId: 1, createdAt: -1 }, name: "articleId_createdAt" },
  ]);

  // Validation smoke tests
  const now = new Date();
  const sampleArticle = {
    slug: "schema-setup-verification-article",
    title: "Schema setup verification article",
    coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
    publisherName: "Northline",
    publisherLogo: "https://images.unsplash.com/photo-1611162616471-46b023ceafbb",
    authorName: "Schema Bot",
    datePosted: now,
    quickSummary: "Setup check",
    detailedSummary: "Confirms articles validator accepts a valid document.",
    whyItMatters: "Proves MongoDB schema enforcement is active.",
    sourceUrl: "https://example.com/schema-setup-verification",
    originalContent: "Original content for schema verification.",
    category: "Technology",
    createdAt: now,
    updatedAt: now,
  };

  await articles.deleteOne({ sourceUrl: sampleArticle.sourceUrl });
  const insertArticle = await articles.insertOne(sampleArticle);
  console.log("Articles validation insert: OK", String(insertArticle.insertedId));

  const sampleChat = {
    sessionId: "schema-setup-session",
    articleId: insertArticle.insertedId,
    messages: [
      {
        id: "m1",
        text: "Hello from schema setup",
        isUser: true,
        timestamp: now,
      },
      {
        id: "m2",
        text: "Schema looks good",
        isUser: false,
        timestamp: now,
      },
    ],
    articleTitle: sampleArticle.title,
    createdAt: now,
    updatedAt: now,
  };

  await chats.deleteMany({ sessionId: sampleChat.sessionId });
  const insertChat = await chats.insertOne(sampleChat);
  console.log("Chats validation insert: OK", String(insertChat.insertedId));

  // Cleanup verification docs
  await chats.deleteOne({ _id: insertChat.insertedId });
  await articles.deleteOne({ _id: insertArticle.insertedId });

  console.log("\nArticles indexes:");
  console.log(await articles.indexes());
  console.log("\nChats indexes:");
  console.log(await chats.indexes());

  console.log("\nDatabase schema setup complete.");
  await client.close();
}

main().catch((error) => {
  console.error("Schema setup failed:", error);
  process.exit(1);
});
