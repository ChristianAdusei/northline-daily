import type { Metadata } from "next";

import { Chatbot } from "@/components/chatbot";

export const metadata: Metadata = {
  title: "Desk Chat",
  description:
    "Ask the Northline desk assistant about curated AI/tech stories.",
};

export default function ChatPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-8 max-w-2xl">
        <p className="animate-brand text-xs font-semibold uppercase tracking-[0.08em] text-[oklch(0.42_0.07_195)]">
          Northline Daily
        </p>
        <h1 className="mt-3 animate-rise font-heading text-4xl font-semibold tracking-tight">
          Desk Chat
        </h1>
        <p
          className="mt-3 animate-rise text-muted-foreground"
          style={{ animationDelay: "80ms" }}
        >
          Ask across the curated top-10 AI/tech feed. Open any article for a
          deep-dive chat grounded in that story’s summaries.
        </p>
      </section>

      <div className="animate-rise" style={{ animationDelay: "120ms" }}>
        <Chatbot mode="desk" />
      </div>
    </div>
  );
}
