import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@vercel/sandbox', 'workflow'],
}

export default nextConfig
