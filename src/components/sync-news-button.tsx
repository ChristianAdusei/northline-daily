"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SyncNewsButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  async function onSync() {
    setError(null);
    setIsSyncing(true);

    try {
      const response = await fetch("/api/news/sync", { method: "POST" });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        curated?: number;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Sync failed");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  const busy = isSyncing || isPending;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void onSync()}
        disabled={busy}
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "gap-2"
        )}
      >
        <RefreshCw className={cn("size-4", busy && "animate-spin")} />
        {busy ? "Syncing…" : "Sync AI tech news"}
      </button>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
