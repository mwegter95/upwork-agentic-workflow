/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/demos/bowling-shirt-designer',
  assetPrefix: '/demos/bowling-shirt-designer',
  trailingSlash: true,
  images: { unoptimized: true },
};
module.exports = nextConfig;
