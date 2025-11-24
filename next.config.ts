
import type {NextConfig} from 'next';
require('dotenv').config();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'farma365.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lancome.cl',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'es.loccitane.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.augustman.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.rawpixel.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'png.pngtree.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tascani.vtexassets.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'acdn-us.mitiendanube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'holiclothing.com.ar',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hips.hearstapps.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'azrwwblchlzv1cjo.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_MAILCHIMP_CONFIGURED: String(!!(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX && process.env.MAILCHIMP_AUDIENCE_ID)),
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    NEXT_PUBLIC_ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-control-allow-headers',
            value: 'Content-Type, Authorization'
          },
        ]
      },
      {
        // Apply these headers to all pages to fix browser security warnings
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=(), private-state-token-redemption=(), private-state-token-issuance=(), private-aggregation=(), attribution-reporting=(), join-ad-interest-group=(), run-ad-auction=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ]
  },
};

export default nextConfig;
