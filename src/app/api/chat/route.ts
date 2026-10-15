import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { askGemini } from "@/lib/gemini";
import { appendChatMessages, getOrCreateChatSession } from "@/lib/chat-store";
import {
  getStoredArticleById,
  getStoredArticleBySlug,
  listStoredArticles,
} from "@/lib/news-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  articleSlug?: string;
  articleId?: string;
  sessionId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "message is required" },
        { status: 400 }
      );
    }

    const article =
      (body.articleSlug
        ? await getStoredArticleBySlug(body.articleSlug)
        : null) ??
      (body.articleId ? await getStoredArticleById(body.articleId) : null);

    let systemContext: string;
    let sessionId = body.sessionId?.trim() || randomUUID();

    if (article?._id) {
      systemContext = `You are the Northline Daily article deep-dive assistant.
Stay focused on THIS article only. Use the provided summaries and original content.
If asked something unrelated, briefly say you can only discuss this article.
Be concise, insightful, and cite concrete details from the article context.

Article title: ${article.title}
Publisher: ${article.publisherName}
Author: ${article.authorName}
Category: ${article.category}
Source URL: ${article.sourceUrl}
Quick summary: ${article.quickSummary}
Long summary: ${article.detailedSummary}
Why it matters: ${article.whyItMatters}
Original content: ${article.originalContent}`;

      await getOrCreateChatSession({
        sessionId,
        articleId: String(article._id),
        articleTitle: article.title,
      });
    } else {
      const articles = await listStoredArticles(10);
      const catalog = articles
        .map(
          (item, index) =>
            `${index + 1}. ${item.title} [${item.category}] (${item.publisherName}) — ${item.quickSummary} — /article/${item.slug}`
        )
        .join("\n");

      systemContext = `You are the Northline Daily desk assistant.
Answer using the curated AI/tech news catalog below.
Suggest /article/<slug> links when helpful.
Do not invent articles that are not listed.

News catalog:
${catalog || "(no articles synced yet)"}`;
    }

    const reply = await askGemini(message, systemContext);

    if (article?._id) {
      const now = new Date();
      await appendChatMessages({
        sessionId,
        articleId: String(article._id),
        messages: [
          {
            id: `user-${now.getTime()}`,
            text: message,
            isUser: true,
            timestamp: now,
          },
          {
            id: `assistant-${now.getTime() + 1}`,
            text: reply,
            isUser: false,
            timestamp: new Date(),
          },
        ],
      });
    }

    return NextResponse.json({ ok: true, reply, sessionId });
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
