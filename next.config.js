/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable NextAuth middleware
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_MAX_BATCH_TRANSLATIONS: process.env.MAX_BATCH_TRANSLATIONS || '10',
  },
};

module.exports = nextConfig;
