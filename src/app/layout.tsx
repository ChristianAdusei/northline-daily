import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Northline Daily",
    template: "%s · Northline Daily",
  },
  description:
    "A responsive news foundation with story cards, article pages, and a desk chatbot — powered by Next.js and shadcn/ui.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,oklch(0.93_0.04_195)_0%,transparent_42%),radial-gradient(circle_at_88%_0%,oklch(0.95_0.03_85)_0%,transparent_36%),linear-gradient(180deg,oklch(0.985_0.01_195),oklch(0.97_0.015_145)_55%,oklch(0.96_0.02_200))]" />
          <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(oklch(0.55_0.02_195_/0.07)_1px,transparent_1px),linear-gradient(90deg,oklch(0.55_0.02_195_/0.07)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        </div>
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
