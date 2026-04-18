import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  register: true,
  scope: "/",
  swUrl: "/sw.js",
  additionalPrecacheEntries: [
    { url: "/offline", revision },
    { url: "/manifest.webmanifest", revision },
  ],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes requires .next/types which only exists after `next build`.
  // Habilitar cuando haya un paso de `next typegen` en CI.
  typedRoutes: false,
};

export default withSerwist(nextConfig);
