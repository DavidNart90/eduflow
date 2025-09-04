import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Experimental optimizations for better performance
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@heroicons/react',
      '@mui/material',
      '@emotion/react',
      'chart.js',
      'react-chartjs-2',
    ],
    // Enable optimized CSS loading
    optimizeCss: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enhanced webpack configuration for memory optimization
  webpack: (config, { isServer, dev }) => {
    // Handle Supabase client-side issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Memory optimization for production builds
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Exclude heavy packages from client bundle unless needed
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        puppeteer: 'puppeteer',
        sharp: 'sharp',
      });
    }

    return config;
  },

  // Images optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
