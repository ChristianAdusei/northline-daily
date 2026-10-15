import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // News cover images come from many publisher CDNs.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
