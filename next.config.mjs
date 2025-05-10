/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['res.cloudinary.com', 'v0.blob.com'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb'
    },
  },
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  },
  // Disable PWA/Service Worker features for v0 compatibility
  pwa: false,
  // Ensure we're not using any workbox configurations
  webpack: (config, { isServer }) => {
    // Return the modified config
    return config;
  },
};

export default nextConfig;
