import { askGemini } from "@/lib/gemini";
import { isArticleCategory } from "@/lib/articles";
import type { ArticleCategory } from "@/lib/db/schema";
import type { NewsApiArticle } from "@/lib/newsapi";

export type AiProcessedArticle = {
  index: number;
  category: ArticleCategory;
  quickSummary: string;
  detailedSummary: string;
  whyItMatters: string;
};

type GeminiSelectionPayload = {
  selected: AiProcessedArticle[];
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() || text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeSelected(
  value: unknown,
  candidateCount: number
): AiProcessedArticle[] {
  if (!value || typeof value !== "object") return [];
  const selected = (value as GeminiSelectionPayload).selected;
  if (!Array.isArray(selected)) return [];

  const cleaned: AiProcessedArticle[] = [];

  for (const item of selected) {
    if (!item || typeof item !== "object") continue;
    const index = Number((item as AiProcessedArticle).index);
    if (!Number.isInteger(index) || index < 0 || index >= candidateCount) {
      continue;
    }

    const categoryRaw = String((item as AiProcessedArticle).category || "AI");
    const category: ArticleCategory = isArticleCategory(categoryRaw)
      ? categoryRaw
      : "AI";

    const quickSummary = String(
      (item as AiProcessedArticle).quickSummary || ""
    ).trim();
    const detailedSummary = String(
      (item as AiProcessedArticle).detailedSummary || ""
    ).trim();
    const whyItMatters = String(
      (item as AiProcessedArticle).whyItMatters || ""
    ).trim();

    if (!quickSummary || !detailedSummary || !whyItMatters) continue;

    cleaned.push({
      index,
      category,
      quickSummary,
      detailedSummary,
      whyItMatters,
    });
  }

  // Dedupe by index, keep first 10
  const seen = new Set<number>();
  return cleaned
    .filter((item) => {
      if (seen.has(item.index)) return false;
      seen.add(item.index);
      return true;
    })
    .slice(0, 10);
}

/**
 * Gemini selects the best AI/tech stories and writes card + article summaries.
 */
export async function selectAndSummarizeAiTechNews(
  candidates: NewsApiArticle[],
  targetCount = 10
): Promise<AiProcessedArticle[]> {
  if (candidates.length === 0) return [];

  const catalog = candidates
    .map((article, index) => {
      return [
        `INDEX: ${index}`,
        `TITLE: ${article.title}`,
        `SOURCE: ${article.source.name}`,
        `AUTHOR: ${article.author ?? "n/a"}`,
        `DATE: ${article.publishedAt}`,
        `URL: ${article.url}`,
        `DESCRIPTION: ${article.description ?? ""}`,
        `CONTENT: ${(article.content ?? "").replace(/\s*\[\+\d+\schars\]\s*$/i, "")}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = `You are an editor for an AI/tech newsroom.

From the candidate articles below, select the ${targetCount} BEST and most relevant AI / technology stories.
Prefer: AI models, ML research, major tech platforms, startups, funding, chips, developer tools.
Skip: celebrity gossip, pure sports, politics-only, or unrelated consumer fluff.

For EACH selected story, write:
- category: one of AI | Technology | Startups | Funding | Machine Learning
- quickSummary: 1-2 sentences for a news card under the title (max ~280 chars)
- detailedSummary: 2-4 short paragraphs for the article page long summary
- whyItMatters: 1-3 sentences on why readers should care

Return ONLY valid JSON with this shape:
{
  "selected": [
    {
      "index": 0,
      "category": "AI",
      "quickSummary": "...",
      "detailedSummary": "...",
      "whyItMatters": "..."
    }
  ]
}

Candidates:
${catalog}`;

  const response = await askGemini(
    prompt,
    "Return JSON only. No markdown commentary."
  );

  const parsed = extractJson(response);
  const selected = normalizeSelected(parsed, candidates.length);

  if (selected.length > 0) {
    return selected;
  }

  // Fallback: take first N candidates with heuristic summaries
  return candidates.slice(0, targetCount).map((article, index) => {
    const blurb =
      article.description?.trim() ||
      `Coverage from ${article.source.name || "a top tech publisher"}.`;
    return {
      index,
      category: "AI" as const,
      quickSummary: blurb.slice(0, 280),
      detailedSummary: [blurb, article.content?.replace(/\s*\[\+\d+\schars\]\s*$/i, "").trim()]
        .filter(Boolean)
        .join("\n\n"),
      whyItMatters:
        "This story reflects current momentum across AI and technology markets.",
    };
  });
}
