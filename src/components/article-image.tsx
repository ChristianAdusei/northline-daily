"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#d7e6e6"/>
          <stop offset="100%" stop-color="#b7cbcb"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#3f5f5f" font-family="Georgia, serif" font-size="42">Northline</text>
    </svg>`
  );

type ArticleImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

function isUsableSrc(src: string) {
  return Boolean(src) && /^(https?:\/\/|data:)/i.test(src);
}

export function ArticleImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
}: ArticleImageProps) {
  const [currentSrc, setCurrentSrc] = useState(
    isUsableSrc(src) ? src : PLACEHOLDER
  );
  const [failed, setFailed] = useState(false);

  // When next/image rejects a host or the remote asset 404s, fall back to a native img/placeholder.
  if (failed || currentSrc.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc.startsWith("data:") ? currentSrc : PLACEHOLDER}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          className
        )}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => {
        setFailed(true);
        setCurrentSrc(PLACEHOLDER);
      }}
    />
  );
}
