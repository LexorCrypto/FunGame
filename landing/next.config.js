/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/FunGame',
  assetPrefix: '/FunGame/',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
