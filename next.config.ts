import type { NextConfig } from "next";
const nextConfig: NextConfig = { serverExternalPackages: ["xlsx", "nodemailer", "pdfjs-dist"] };
export default nextConfig;
