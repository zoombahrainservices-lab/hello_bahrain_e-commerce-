/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevents the RSC bundler from bundling sharp (covers Server Components).
    serverComponentsExternalPackages: ['sharp'],
  },

  // Prevents the regular webpack server bundler from bundling sharp (covers Route Handlers).
  // This is belt-and-suspenders alongside the webpackIgnore comment in image-processing.ts.
  webpack: (config, { isServer }) => {
    if (isServer) {
      if (Array.isArray(config.externals)) {
        config.externals.push({ sharp: 'commonjs sharp' });
      }
    }
    return config;
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
