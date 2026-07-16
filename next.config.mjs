/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV ?? process.env.VERCEL_ENV ?? "production",
  },
};

export default nextConfig;
