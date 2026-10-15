import { NextResponse } from "next/server";

import { pingGemini } from "@/lib/gemini";
import { pingMongo } from "@/lib/mongodb";
import {
  fetchEverything,
  fetchSources,
  fetchTopHeadlines,
  todayIsoDate,
} from "@/lib/newsapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<
    string,
    { ok: boolean; detail?: unknown; error?: string }
  > = {};

  try {
    const today = todayIsoDate();
    const everythingFrom = todayIsoDate(
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    );
    const apple = await fetchEverything({
      q: "Apple",
      from: everythingFrom,
      to: today,
      sortBy: "popularity",
      pageSize: 3,
    });
    results.newsEverything = {
      ok: true,
      detail: {
        endpoint: "/everything",
        query: "Apple",
        from: everythingFrom,
        to: today,
        sortBy: "popularity",
        totalResults: apple.totalResults,
        sampleTitles: (apple.articles ?? []).slice(0, 3).map((a) => a.title),
      },
    };
  } catch (error) {
    results.newsEverything = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const headlines = await fetchTopHeadlines({
      country: "us",
      pageSize: 3,
    });
    results.newsTopHeadlines = {
      ok: true,
      detail: {
        endpoint: "/top-headlines",
        country: "us",
        totalResults: headlines.totalResults,
        sampleTitles: (headlines.articles ?? [])
          .slice(0, 3)
          .map((a) => a.title),
      },
    };
  } catch (error) {
    results.newsTopHeadlines = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const bbc = await fetchTopHeadlines({
      sources: "bbc-news",
      pageSize: 2,
    });
    results.newsBbcSource = {
      ok: true,
      detail: {
        endpoint: "/top-headlines?sources=bbc-news",
        totalResults: bbc.totalResults,
        sampleTitles: (bbc.articles ?? []).slice(0, 2).map((a) => a.title),
      },
    };
  } catch (error) {
    results.newsBbcSource = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const sources = await fetchSources({ language: "en", country: "us" });
    results.newsSources = {
      ok: true,
      detail: {
        endpoint: "/top-headlines/sources",
        count: sources.sources?.length ?? 0,
        sample: (sources.sources ?? []).slice(0, 5).map((s) => s.id),
      },
    };
  } catch (error) {
    results.newsSources = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const ping = await pingMongo();
    results.mongodb = { ok: true, detail: ping };
  } catch (error) {
    results.mongodb = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const text = await pingGemini();
    results.gemini = { ok: true, detail: { reply: text } };
  } catch (error) {
    results.gemini = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const ok = Object.values(results).every((result) => result.ok);

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      results,
    },
    { status: ok ? 200 : 503 }
  );
}
