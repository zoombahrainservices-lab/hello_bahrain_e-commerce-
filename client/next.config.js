const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },

  // npm workspaces hoists ALL client packages (including sharp) to the repo
  // root node_modules/, so client/node_modules/ does not exist. Without this,
  // Next.js file tracing is bounded to client/ and never sees the repo root,
  // making outputFileTracingIncludes paths that point to client/node_modules/
  // resolve to nothing.
  outputFileTracingRoot: path.join(__dirname, '../'),

  // sharp is loaded via webpackIgnore so NFT can't auto-trace it. We explicitly
  // force-include both the sharp package and the Linux platform binaries that
  // contain the actual native .node binary Vercel needs at runtime.
  // Paths are relative to outputFileTracingRoot (the repo root).
  outputFileTracingIncludes: {
    '/api/admin/media/**': [
      'node_modules/sharp/**/*',
      'node_modules/@img/sharp-linux-x64/**/*',
      'node_modules/@img/sharp-linux-arm64/**/*',
      'node_modules/@img/sharp-libvips-linux-x64/**/*',
      'node_modules/@img/sharp-libvips-linux-arm64/**/*',
    ],
  },

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
