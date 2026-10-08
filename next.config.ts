import { withEnvStyles } from 'env.style'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        hostname: 'i.ytimg.com',
        protocol: 'https',
      },
    ],
  },
}

export default withEnvStyles(nextConfig, {
  color: {
    development: '#3b82f6',
    preview: '#f59e0b',
    staging: '#6b7280',
  },
})
