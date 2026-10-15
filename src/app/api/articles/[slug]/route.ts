import { NextResponse } from "next/server";

import {
  getStoredArticleById,
  getStoredArticleBySlug,
} from "@/lib/news-store";
import { serializeArticle } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

/** GET /api/articles/[slug] — fetch one article from MongoDB. */
export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const article =
      (await getStoredArticleBySlug(slug)) ??
      (await getStoredArticleById(slug));

    if (!article) {
      return NextResponse.json(
        { ok: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: "mongodb",
      article: serializeArticle(article),
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
