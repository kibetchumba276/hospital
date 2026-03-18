/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Exclude Supabase Edge Functions from the build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**', '**/node_modules/**']
    };
    return config;
  },
}

module.exports = nextConfig
