import type { MetadataRoute } from "next";
import { NETWORK_NAME } from "@/lib/site";
import { portal } from "@/lib/verticals/portal";

/**
 * Web app manifest — served at /manifest.webmanifest.
 *
 * Network-level, not per-vertical: a single build serves every vertical from
 * one origin, so there is one installable app identity (Firsthand) rather than
 * one per path. Icons come from public/brand/, the same artwork the browser
 * icons in src/app/ are cut from.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NETWORK_NAME}: ${portal.tagline}`,
    short_name: NETWORK_NAME,
    description: portal.description,
    start_url: "/",
    display: "standalone",
    background_color: portal.theme.brandWhite,
    theme_color: portal.theme.brandNavy,
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/apple-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
