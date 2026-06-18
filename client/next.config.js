/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevents the RSC bundler from bundling sharp (covers Server Components).
    serverComponentsExternalPackages: ['sharp'],
  },

  // Forces Vercel's Node File Tracer to include sharp's native binary (.node)
  // in the serverless function output. Without this, the tracer misses the
  // binary because it can't follow webpackIgnore dynamic imports statically.
  outputFileTracingIncludes: {
    '/api/admin/media/upload': ['./node_modules/sharp/**/*'],
  },

  // Prevents the regular webpack server bundler from bundling sharp (covers Route Handlers).
  // config.externals in Next.js 14 server builds is an array; we push a resolver
  // function (not a plain object) so webpack's resolver pipeline handles it correctly.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request === 'sharp') return callback(null, 'commonjs sharp');
          callback();
        });
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
