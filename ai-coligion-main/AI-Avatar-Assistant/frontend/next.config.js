/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001',
  },
  images: {
    domains: ['example.com'],
  },
  webpack: (config) => {
    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]',
      },
    });
    return config;
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false
};

module.exports = nextConfig; 