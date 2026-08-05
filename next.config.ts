import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a parent directory also has a
  // package-lock.json, which otherwise confuses Turbopack's root inference).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
