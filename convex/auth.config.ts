import type { AuthConfig } from "convex/server";

const convexSiteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.VITE_CONVEX_SITE_URL;

if (!convexSiteUrl) {
  throw new Error(
    "Missing CONVEX_SITE_URL or VITE_CONVEX_SITE_URL for Convex Auth config.",
  );
}

export default {
  providers: [
    {
      domain: convexSiteUrl,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
