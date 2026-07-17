import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a parent directory also has a
  // package-lock.json, which otherwise confuses Turbopack's root inference).
  turbopack: {
    root: __dirname,
  },
  // NEXT_PUBLIC_VERTICAL is baked into each build, so previewing several
  // verticals at once requires one build dir per vertical. NEXT_DIST_DIR lets
  // scripts/preview-all.sh build into .next-<vertical> without the builds
  // clobbering each other; unset (the normal case) keeps the default .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
