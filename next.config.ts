import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle report (webpack build): ANALYZE=true npm run build -- --webpack
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  // Section content is static: prerender it as a cached shell ('use cache')
  cacheComponents: true,
  // Automatic memoization — replaces hand-written useCallback/useMemo
  reactCompiler: true,
  // Project page media comes from each project's own GitHub repository
  // (served unoptimized; the pattern still restricts next/image to it)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/kudzaiprichard/**" }],
  },
};

export default withBundleAnalyzer(nextConfig);
