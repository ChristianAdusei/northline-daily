import { NextResponse } from "next/server";

import { ensureArticlesSeeded, listStoredArticles } from "@/lib/news-store";
import { serializeArticle } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/articles — fetch live articles from MongoDB. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number(searchParams.get("limit") || "10") || 10,
      50
    );

    let articles = await listStoredArticles(limit);
    if (articles.length === 0) {
      articles = await ensureArticlesSeeded();
    }

    return NextResponse.json({
      ok: true,
      source: "mongodb",
      count: articles.length,
      articles: articles.slice(0, limit).map(serializeArticle),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
