import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin review console is private and must never be indexed.
        disallow: "/admin",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
