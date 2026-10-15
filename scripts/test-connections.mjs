import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function testNews() {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error("NEWS_API_KEY missing");

  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const everythingUrl = new URL("https://newsapi.org/v2/everything");
  everythingUrl.searchParams.set("q", "Apple");
  everythingUrl.searchParams.set("from", from);
  everythingUrl.searchParams.set("to", today);
  everythingUrl.searchParams.set("sortBy", "popularity");
  everythingUrl.searchParams.set("pageSize", "3");
  everythingUrl.searchParams.set("apiKey", key);

  const everythingRes = await fetch(everythingUrl);
  const everything = await everythingRes.json();
  if (everything.status !== "ok") {
    throw new Error(`everything: ${everything.message || everythingRes.status}`);
  }

  const headlinesUrl = new URL("https://newsapi.org/v2/top-headlines");
  headlinesUrl.searchParams.set("country", "us");
  headlinesUrl.searchParams.set("pageSize", "3");
  headlinesUrl.searchParams.set("apiKey", key);
  const headlinesRes = await fetch(headlinesUrl);
  const headlines = await headlinesRes.json();
  if (headlines.status !== "ok") {
    throw new Error(`top-headlines: ${headlines.message || headlinesRes.status}`);
  }

  const bbcUrl = new URL("https://newsapi.org/v2/top-headlines");
  bbcUrl.searchParams.set("sources", "bbc-news");
  bbcUrl.searchParams.set("pageSize", "2");
  bbcUrl.searchParams.set("apiKey", key);
  const bbcRes = await fetch(bbcUrl);
  const bbc = await bbcRes.json();
  if (bbc.status !== "ok") {
    throw new Error(`bbc-news: ${bbc.message || bbcRes.status}`);
  }

  const sourcesUrl = new URL("https://newsapi.org/v2/top-headlines/sources");
  sourcesUrl.searchParams.set("language", "en");
  sourcesUrl.searchParams.set("country", "us");
  sourcesUrl.searchParams.set("apiKey", key);
  const sourcesRes = await fetch(sourcesUrl);
  const sources = await sourcesRes.json();
  if (sources.status !== "ok") {
    throw new Error(`sources: ${sources.message || sourcesRes.status}`);
  }

  return {
    everythingTotal: everything.totalResults,
    everythingSample: everything.articles?.[0]?.title,
    headlinesTotal: headlines.totalResults,
    headlinesSample: headlines.articles?.[0]?.title,
    bbcSample: bbc.articles?.[0]?.title,
    sourcesCount: sources.sources?.length,
  };
}

async function testMongo() {
  const { MongoClient } = await import("mongodb");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "northline");
    const ping = await db.command({ ping: 1 });
    return ping;
  } finally {
    await client.close();
  }
}

async function testGemini() {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const modelName = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(
    "Reply with exactly the word GEMINI_OK and nothing else."
  );
  return {
    model: modelName,
    reply: result.response.text().trim(),
  };
}

async function main() {
  console.log("Testing connections...\n");

  try {
    const news = await testNews();
    console.log("✓ News API OK");
    console.log(JSON.stringify(news, null, 2));
  } catch (error) {
    console.error("✗ News API FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }

  console.log("");

  try {
    const mongo = await testMongo();
    console.log("✓ MongoDB OK");
    console.log(JSON.stringify(mongo, null, 2));
  } catch (error) {
    console.error("✗ MongoDB FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }

  console.log("");

  try {
    const gemini = await testGemini();
    console.log("✓ Gemini OK");
    console.log(JSON.stringify(gemini, null, 2));
  } catch (error) {
    console.error("✗ Gemini FAILED");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

main();
