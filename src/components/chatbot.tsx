"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, SendHorizonal, Sparkles, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatbotProps = {
  mode?: "desk" | "article";
  articleId?: string;
  articleSlug?: string;
  articleTitle?: string;
};

export function Chatbot({
  mode = "desk",
  articleId,
  articleSlug,
  articleTitle,
}: ChatbotProps) {
  const isArticleMode = mode === "article" && Boolean(articleSlug || articleId);

  const welcomeMessage = useMemo<ChatMessage>(
    () => ({
      id: "welcome",
      role: "assistant",
      content: isArticleMode
        ? `I'm loaded with context for “${articleTitle ?? "this article"}”. Ask for a deep dive, implications, or clarifications.`
        : "Hi — I'm the Northline desk assistant. Ask about the curated AI/tech stories from top publishers.",
    }),
    [articleTitle, isArticleMode]
  );

  const suggestions = isArticleMode
    ? [
        "Give me the key takeaways",
        "Why does this matter?",
        "Explain the technical angle",
        "What should I watch next?",
      ]
    : [
        "What are today's top AI stories?",
        "Any major funding news?",
        "Summarize the startup coverage",
        "Which publishers are featured?",
      ];

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, [articleSlug, articleId]);

  useEffect(() => {
    setMessages([welcomeMessage]);
  }, [welcomeMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  async function sendMessage(raw: string) {
    const content = raw.trim();
    if (!content || isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId,
          articleId: isArticleMode ? articleId : undefined,
          articleSlug: isArticleMode ? articleSlug : undefined,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reply?: string;
        error?: string;
        sessionId?: string;
      };

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.ok
          ? data.reply || "No response."
          : `Sorry — ${data.error || "chat failed."}`,
      };
      setMessages((current) => [...current, reply]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? `Sorry — ${error.message}`
              : "Sorry — chat request failed.",
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex h-[min(72vh,760px)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_30px_80px_-48px_rgba(15,61,62,0.55)] backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-[oklch(0.94_0.03_195)] text-[oklch(0.35_0.07_195)]">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-none">
            {isArticleMode ? "Article Deep Dive" : "Desk Chat"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArticleMode
              ? "Gemini grounded in this article’s summaries"
              : "Gemini + curated AI/tech catalog"}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4 sm:px-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "animate-message flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback
                  className={cn(
                    message.role === "assistant"
                      ? "bg-[oklch(0.94_0.03_195)] text-[oklch(0.35_0.07_195)]"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="size-3.5" />
                  ) : (
                    <UserRound className="size-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "assistant"
                    ? "bg-muted/80 text-foreground"
                    : "bg-[oklch(0.35_0.07_195)] text-white"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isPending ? (
            <div className="animate-message flex gap-3">
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback className="bg-[oklch(0.94_0.03_195)] text-[oklch(0.35_0.07_195)]">
                  <Bot className="size-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl bg-muted/80 px-3.5 py-3 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendMessage(suggestion)}
              className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-[oklch(0.55_0.06_195)] hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isArticleMode
                ? "Ask a deep-dive question about this article…"
                : "Ask about curated AI/tech stories…"
            }
            rows={2}
            className="min-h-[64px] resize-none"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isPending}
            className="size-10 shrink-0"
            aria-label="Send message"
          >
            <SendHorizonal className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
