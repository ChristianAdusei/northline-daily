"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareText, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "/", label: "Stories", icon: Newspaper },
  { href: "/chat", label: "Desk Chat", icon: MessageSquareText },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[color-mix(in_oklab,var(--background)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-heading text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Northline
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground sm:inline">
            Daily
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname.startsWith("/article")
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({
                    variant: active ? "secondary" : "ghost",
                    size: "sm",
                  }),
                  "gap-2"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
