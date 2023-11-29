/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://sbom.nqminds.com",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
