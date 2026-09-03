import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Client Router Cache — keep RSC payloads in memory so that
    // navigating back to a recently visited tab is instant (no
    // skeleton, no server round-trip) within the stale window.
    // router.refresh() after check-in still invalidates all entries.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
