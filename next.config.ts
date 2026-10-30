import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The sync bundle route reads these at request time; without this Vercel's
  // file tracing wouldn't ship them with the function.
  outputFileTracingIncludes: {
    "/api/cron/feedback-sync/bundle": ["./sync-skill/**/*", "./src/lib/accounts.ts"],
  },
};

export default nextConfig;
