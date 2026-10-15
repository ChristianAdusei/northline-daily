import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ArticleImage } from "@/components/article-image";
import { Chatbot } from "@/components/chatbot";
import { NewsCard } from "@/components/news-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import {
  fetchArticleFromApi,
  fetchArticlesFromApi,
} from "@/lib/api-client";
import { estimateReadTime, formatArticleDate } from "@/lib/articles";
import { cn } from "@/lib/utils";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticleFromApi(slug);

  if (!article) {
    return { title: "Article not found" };
  }

  return {
    title: article.title,
    description: article.quickSummary,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticleFromApi(slug);

  if (!article) {
    notFound();
  }

  const related = (await fetchArticlesFromApi(10))
    .filter((item) => item.id !== article.id)
    .slice(0, 3);

  const readTime = estimateReadTime(
    `${article.quickSummary} ${article.detailedSummary}`
  );

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-6 gap-2 px-0 hover:bg-transparent"
        )}
      >
        <ArrowLeft className="size-4" />
        Back to stories
      </Link>

      <header className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{article.category}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatArticleDate(article.datePosted)} · {readTime} read ·{" "}
            {article.publisherName}
          </span>
        </div>
        <h1 className="mt-4 animate-rise font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        <p
          className="mt-4 animate-rise text-lg leading-relaxed text-muted-foreground"
          style={{ animationDelay: "80ms" }}
        >
          {article.quickSummary}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-foreground">
            By {article.authorName}
          </p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            Original source
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </header>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted shadow-[0_30px_70px_-40px_rgba(15,61,62,0.55)]">
        <ArticleImage
          src={article.coverImage}
          alt={article.title}
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
        />
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-8 text-base leading-8 text-foreground/90 sm:text-[1.05rem]">
        <section>
          <h2 className="font-heading text-xl font-semibold">Long summary</h2>
          <p className="mt-2 whitespace-pre-wrap">{article.detailedSummary}</p>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold">Why it matters</h2>
          <p className="mt-2">{article.whyItMatters}</p>
        </section>
      </div>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight">
          Deep dive chat
        </h2>
        <Chatbot
          mode="article"
          articleId={article.id}
          articleSlug={article.slug}
          articleTitle={article.title}
        />
      </section>

      <Separator className="my-12" />

      <section>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          More from the desk
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item, index) => (
            <NewsCard
              key={item.id}
              article={item}
              style={{ animationDelay: `${100 + index * 70}ms` }}
            />
          ))}
        </div>
      </section>
    </article>
  );
}
