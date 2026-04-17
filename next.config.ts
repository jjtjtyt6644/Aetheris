import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  images: {
    formats: ["image/webp"],
    qualities: [60, 75, 80, 90, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
