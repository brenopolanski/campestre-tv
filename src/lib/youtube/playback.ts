import type { YouTubeChannelVideo } from './types'

export const getYouTubeWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

export const canEmbedLiveVideo = (
  video: Pick<YouTubeChannelVideo, 'embeddable' | 'live'>,
): boolean => {
  return video.live.status === 'live' && video.embeddable === true
}
