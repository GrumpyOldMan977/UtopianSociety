import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Civic records accept files up to 10 MB. Multipart framing adds a small
    // amount of overhead before the streaming proxy forwards the request.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
