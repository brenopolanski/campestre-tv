export type YouTubeLiveStatus = 'completed' | 'live' | 'none' | 'upcoming'

export interface YouTubeThumbnail {
  url?: string
}

export interface YouTubeVideoSnippet {
  channelId?: string
  channelTitle?: string
  description?: string
  liveBroadcastContent?: string
  publishedAt?: string
  thumbnails?: {
    default?: YouTubeThumbnail
    high?: YouTubeThumbnail
    maxres?: YouTubeThumbnail
    medium?: YouTubeThumbnail
    standard?: YouTubeThumbnail
  }
  title?: string
}

export interface YouTubeLiveStreamingDetails {
  activeLiveChatId?: string
  actualEndTime?: string
  actualStartTime?: string
  concurrentViewers?: string
  scheduledStartTime?: string
}

export interface YouTubeVideoStatisticsResource {
  commentCount?: string
  likeCount?: string
  viewCount?: string
}

export interface YouTubeVideoStatus {
  embeddable?: boolean
  privacyStatus?: string
}

export interface YouTubeVideoResource {
  id?: string
  liveStreamingDetails?: YouTubeLiveStreamingDetails
  snippet?: YouTubeVideoSnippet
  statistics?: YouTubeVideoStatisticsResource
  status?: YouTubeVideoStatus
}

export interface YouTubeVideoListResponse {
  items?: YouTubeVideoResource[]
}

export interface YouTubeLiveDetails {
  activeLiveChatId?: string
  actualEndTime?: string
  actualStartTime?: string
  concurrentViewers?: number
  scheduledStartTime?: string
  status: YouTubeLiveStatus
}

export interface YouTubeVideoStatistics {
  commentCount?: number
  likeCount?: number
  viewCount?: number
}

export interface YouTubeVideo {
  channelId: string
  channelTitle: string
  description: string
  embeddable?: boolean
  id: string
  live: YouTubeLiveDetails
  privacyStatus?: string
  publishedAt?: string
  statistics: YouTubeVideoStatistics
  thumbnailUrl?: string
  title: string
}

export interface YouTubeVideosResponse {
  videos: YouTubeVideo[]
}
