/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for container/Cloud Run builds, standard output for Vercel
  output: process.env.VERCEL ? undefined : 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    '@opentelemetry/api',
    '@opentelemetry/core',
    '@aws-sdk/client-s3',
    'pg',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
