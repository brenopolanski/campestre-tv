import { track } from '@vercel/analytics'

import { isClient } from './utils'

export const ANALYTICS_EVENTS = {
  courtWatch: 'court_watch',
  shareCopy: 'share_copy',
  shareWhatsapp: 'share_whatsapp',
  shareTelegram: 'share_telegram',
  shareNative: 'share_native',
  youtubeWatch: 'youtube_watch',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

type AnalyticsValue = string | number | boolean | null
export type AnalyticsData = Record<string, AnalyticsValue>

export const trackEvent = (name: string, data?: AnalyticsData) => {
  if (process.env.NODE_ENV === 'development') {
    return
  }

  const page = isClient ? window.location.pathname : undefined

  track(name, { page, ...data })
}
