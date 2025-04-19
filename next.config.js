/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        unoptimized: true,
        domains: ['localhost', 'polyp-segmentation-web.vercel.app'],
    },
    api: {
        bodyParser: false,
    },
};

module.exports = nextConfig;
  