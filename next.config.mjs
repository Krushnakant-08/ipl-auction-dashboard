/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure API routes work properly
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
