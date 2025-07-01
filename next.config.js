/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable NextAuth middleware
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
