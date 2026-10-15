import Link from "next/link";
import { MessageSquareText } from "lucide-react";

import { NewsCard } from "@/components/news-card";
import { SyncNewsButton } from "@/components/sync-news-button";
import { buttonVariants } from "@/components/ui/button";
import { fetchArticlesFromApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await fetchArticlesFromApi(10);
  const featured = articles[0] ?? null;
  const rest = articles.slice(1);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-10 max-w-3xl">
        <p className="animate-brand text-xs font-semibold uppercase tracking-[0.08em] text-[oklch(0.42_0.07_195)]">
          Northline Daily
        </p>
        <h1 className="mt-3 animate-rise font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
          Live AI tech news from your database.
        </h1>
        <p
          className="mt-4 max-w-2xl animate-rise text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "80ms" }}
        >
          Cards and article pages render real MongoDB documents — titles, AI
          summaries, publisher metadata, and external cover images.
        </p>
        <div
          className="mt-6 flex flex-wrap items-start gap-3 animate-rise"
          style={{ animationDelay: "140ms" }}
        >
          <Link
            href="/chat"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <MessageSquareText className="size-4" />
            Ask the desk
          </Link>
          <SyncNewsButton />
        </div>
      </section>

      {featured ? (
        <section aria-label="Featured story" className="mb-10">
          <NewsCard article={featured} featured />
        </section>
      ) : (
        <div className="mb-10 rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
          No articles in MongoDB yet. Click “Sync AI tech news” to load live
          stories.
        </div>
      )}

      <section id="latest" aria-label="Latest stories">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              From MongoDB
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {articles.length} live article{articles.length === 1 ? "" : "s"}{" "}
              loaded from the <code>articles</code> collection.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              style={{ animationDelay: `${120 + index * 70}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
