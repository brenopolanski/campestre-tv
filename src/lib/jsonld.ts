import { siteConfig } from '@/config/site'

export interface JsonLdGraph {
  '@context': 'https://schema.org'
  '@graph': Record<string, unknown>[]
}

export const ORGANIZATION_ID = `${siteConfig.url}/#organization`
export const WEBSITE_ID = `${siteConfig.url}/#website`

const getOrganizationSchema = (): Record<string, unknown> => ({
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: siteConfig.name,
  url: siteConfig.url,
  sameAs: [siteConfig.links.youtube, siteConfig.author.x],
})

const getWebSiteSchema = (): Record<string, unknown> => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  publisher: { '@id': ORGANIZATION_ID },
})

const getWebPageSchema = (): Record<string, unknown> => ({
  '@type': 'WebPage',
  name: siteConfig.title,
  description: siteConfig.description,
  url: siteConfig.url,
  inLanguage: 'pt-BR',
  primaryImageOfPage: {
    '@type': 'ImageObject',
    url: new URL('/og.jpg', siteConfig.url).href,
    width: 1200,
    height: 630,
  },
  isPartOf: { '@id': WEBSITE_ID },
  publisher: { '@id': ORGANIZATION_ID },
})

export const getSiteJsonLd = (): JsonLdGraph => ({
  '@context': 'https://schema.org',
  '@graph': [getOrganizationSchema(), getWebSiteSchema(), getWebPageSchema()],
})
