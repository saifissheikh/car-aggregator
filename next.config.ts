import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qlv-media-prod.qatarliving.com",
      },
      {
        protocol: "https",
        hostname: "**.qatarsale.com",
      },
    ],
  },
};

export default nextConfig;
