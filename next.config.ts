import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx", "nodemailer"],

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;