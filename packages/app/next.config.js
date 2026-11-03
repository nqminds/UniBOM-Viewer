/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverRuntimeConfig: {
    allowedHosts: ["sbom.coreid.com"], // Add your domain here
  },
};

module.exports = nextConfig;
