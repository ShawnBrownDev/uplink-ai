/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        // port: '', // Port might vary, or be omitted
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'xsgames.co',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  webpack: (config) => {
    // Remove framer-motion warning for production export
    if (process.env.NODE_ENV === 'production') {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
};

module.exports = nextConfig;