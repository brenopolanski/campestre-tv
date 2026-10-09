import type { MetadataRoute } from 'next'

import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

const sitemap = (): MetadataRoute.Sitemap => {
  return [
    {
      url: new URL(paths.home, siteConfig.url).href,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ]
}

export default sitemap
