/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Cloudflare R2 public media domain
      {
        protocol: 'https',
        hostname: 'media.helloonebahrain.com',
        pathname: '/**',
      },
      // Wildcard fallback covers Supabase storage URLs and any other domains
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },
};

module.exports = nextConfig;

