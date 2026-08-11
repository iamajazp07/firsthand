import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { APEX_HOST } from "@/lib/site";

/**
 * Per-HOST robots.txt. Health serves from its own subdomain, so each host has
 * to advertise its OWN sitemap — pointing the subdomain at the apex sitemap
 * would offer Google a file listing URLs it does not serve.
 *
 * Reading headers() makes this handler dynamic (it is cached by default).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") ?? APEX_HOST)
    .split(":")[0]
    .trim()
    .toLowerCase();
  const origin = `https://${host}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin review console is private and must never be indexed.
        disallow: "/admin",
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
