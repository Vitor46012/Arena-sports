import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER || process.env.NODE_ENV === 'development';
  return {
    distDir: isDev ? '.next-dev' : '.next',
    output: 'standalone',
    typescript: {
      ignoreBuildErrors: true,
    },
    allowedDevOrigins: ['ais-dev-*.run.app', 'ais-pre-*.run.app', '*.run.app', 'localhost:3000'],
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
};

export default nextConfig;
