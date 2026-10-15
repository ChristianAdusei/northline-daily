import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return uri;
}

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(getUri());
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getMongoClient() {
  return getClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "northline");
}

export async function pingMongo() {
  const db = await getDb();
  const result = await db.command({ ping: 1 });
  return result;
}
