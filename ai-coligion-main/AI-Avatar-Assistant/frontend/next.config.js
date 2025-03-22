/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  },
  images: {
    domains: ['agent.d-id.com', 'd-id.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://agent.d-id.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.d-id.com; media-src 'self' https://*.d-id.com; connect-src 'self' https://*.d-id.com ws://localhost:* http://localhost:* https://localhost:*;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 