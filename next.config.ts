import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arena exposes development previews under a sandbox subdomain. This setting
  // is evaluated only by the Next development server and permits HMR in preview.
  allowedDevOrigins: ["*.e2b.app"],
  // Native C++ binary modules and Prisma must not be bundled into the serverless bundle
  serverExternalPackages: ["argon2", "@prisma/client"],
};

export default nextConfig;
