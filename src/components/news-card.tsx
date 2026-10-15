import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ArticleImage } from "@/components/article-image";
import { estimateReadTime, formatArticleDate } from "@/lib/articles";
import type { PublicArticle } from "@/lib/serialize";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NewsCardProps = {
  article: PublicArticle;
  featured?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function NewsCard({
  article,
  featured = false,
  className,
  style,
}: NewsCardProps) {
  const readTime = estimateReadTime(
    `${article.quickSummary} ${article.detailedSummary}`
  );

  return (
    <Link
      href={`/article/${article.slug}`}
      className={cn(
        "group block h-full animate-rise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      style={style}
    >
      <Card
        className={cn(
          "h-full gap-0 overflow-hidden py-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(15,61,62,0.45)]",
          featured && "md:grid md:grid-cols-[1.15fr_0.85fr]"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            featured
              ? "aspect-[16/10] md:aspect-auto md:min-h-[320px]"
              : "aspect-[16/10]"
          )}
        >
          <ArticleImage
            src={article.coverImage}
            alt={article.title}
            priority={featured}
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 60vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
            className="transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,32,34,0.35)] via-transparent to-transparent" />
        </div>

        <div className="flex flex-col">
          <CardHeader className="gap-3 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{article.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatArticleDate(article.datePosted)}
              </span>
            </div>
            <CardTitle
              className={cn(
                "font-heading leading-tight text-foreground transition-colors group-hover:text-[oklch(0.38_0.07_195)]",
                featured ? "text-2xl sm:text-3xl" : "text-xl"
              )}
            >
              {article.title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed sm:text-[0.95rem]">
              {article.quickSummary}
            </CardDescription>
          </CardHeader>

          <CardContent className="mt-auto" />

          <CardFooter className="mt-auto justify-between border-t-0 bg-transparent text-sm text-muted-foreground">
            <span>
              {article.publisherName} · {readTime}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              Read
              <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
