/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['images.pexels.com', 'i.imgur.com', 'localhost', 'xsgames.co', 'randomuser.me'],
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