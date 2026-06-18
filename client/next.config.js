/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required on Vercel (Next.js 14) — sharp has native binaries and must not be
    // bundled into the serverless function. Without this, /api/admin/media/* crashes
    // at cold start and returns HTML 500 instead of JSON.
    serverComponentsExternalPackages: ['sharp'],
  },
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

