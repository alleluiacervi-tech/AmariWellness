/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
    ],
  },
  turbopack: {
    root: import.meta.dirname,
  },
  // The old back-office design mock-up lived at /admin with sample data
  // and no real sign-in. The real one is /staff, which sends anyone not
  // signed in to /staff/login.
  async redirects() {
    return [
      { source: '/admin', destination: '/staff', permanent: false },
      { source: '/admin/:path*', destination: '/staff', permanent: false },
    ]
  },
}

export default nextConfig
