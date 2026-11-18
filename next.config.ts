import type { NextConfig } from "next";

// Every page is per-user and read live from the database, so the app renders
// dynamically rather than opting into Cache Components.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
