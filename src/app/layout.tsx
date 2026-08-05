import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

import Analytics from "@/components/Analytics";
import { NETWORK_NAME, SITE_URL } from "@/lib/site";

/**
 * Root layout — shared document shell for the WHOLE network.
 *
 * Header and Footer are no longer rendered here: they are vertical-branded and
 * now live in `src/app/[vertical]/layout.tsx`, which knows which vertical the
 * request is for. Root-level pages (portal, about, privacy, terms, contact,
 * editorial-policy, affiliate-disclosure) render their own chrome via
 * `PortalChrome`, so nothing is double-wrapped.
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `${NETWORK_NAME} — %s`,
    default: `${NETWORK_NAME} — Independent, evidence-first reviews and rankings`,
  },
  description:
    "Firsthand publishes independent, evidence-first reviews and rankings across health, money, tech, education, and travel.",
  alternates: { canonical: "./" },
  openGraph: {
    siteName: NETWORK_NAME,
    type: "website",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
