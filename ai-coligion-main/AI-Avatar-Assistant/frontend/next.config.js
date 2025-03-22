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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://agent.d-id.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.d-id.com; media-src 'self' blob: https://*.d-id.com; connect-src 'self' https://*.d-id.com https://api-js.mixpanel.com https://*.sentry.io ws: wss: ws://localhost:* http://localhost:* https://localhost:*; frame-src 'self' https://*.d-id.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 