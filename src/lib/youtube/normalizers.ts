import type {
  YouTubeLiveStatus,
  YouTubeLiveStreamingDetails,
  YouTubeVideo,
  YouTubeVideoResource,
  YouTubeVideoSnippet,
} from './types'

const THUMBNAIL_SIZES = ['maxres', 'standard', 'high', 'medium', 'default'] as const

const parseCount = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const readThumbnailUrl = (snippet: YouTubeVideoSnippet | undefined): string | undefined => {
  const thumbnails = snippet?.thumbnails
  if (!thumbnails) {
    return undefined
  }

  for (const size of THUMBNAIL_SIZES) {
    const url = thumbnails[size]?.url
    if (url) {
      return url
    }
  }

  return undefined
}

// A finished broadcast keeps actualEndTime after liveBroadcastContent returns to "none".
// An actual start without an end time means the broadcast is still live.
const resolveLiveStatus = (
  content: string | undefined,
  details: YouTubeLiveStreamingDetails | undefined,
): YouTubeLiveStatus => {
  if (details?.actualEndTime) {
    return 'completed'
  }

  if (content === 'live' || details?.actualStartTime) {
    return 'live'
  }

  if (content === 'upcoming' || details?.scheduledStartTime) {
    return 'upcoming'
  }

  return 'none'
}

export const normalizeYouTubeVideo = (resource: YouTubeVideoResource): YouTubeVideo | null => {
  if (!resource.id) {
    return null
  }

  const snippet = resource.snippet
  const details = resource.liveStreamingDetails
  const statistics = resource.statistics
  const status = resource.status
  const concurrentViewers = parseCount(details?.concurrentViewers)
  const viewCount = parseCount(statistics?.viewCount)
  const likeCount = parseCount(statistics?.likeCount)
  const commentCount = parseCount(statistics?.commentCount)
  const thumbnailUrl = readThumbnailUrl(snippet)

  return {
    id: resource.id,
    title: snippet?.title ?? '',
    description: snippet?.description ?? '',
    channelId: snippet?.channelId ?? '',
    channelTitle: snippet?.channelTitle ?? '',
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    ...(snippet?.publishedAt ? { publishedAt: snippet.publishedAt } : {}),
    ...(typeof status?.embeddable === 'boolean' ? { embeddable: status.embeddable } : {}),
    ...(status?.privacyStatus ? { privacyStatus: status.privacyStatus } : {}),
    live: {
      status: resolveLiveStatus(snippet?.liveBroadcastContent, details),
      ...(details?.scheduledStartTime ? { scheduledStartTime: details.scheduledStartTime } : {}),
      ...(details?.actualStartTime ? { actualStartTime: details.actualStartTime } : {}),
      ...(details?.actualEndTime ? { actualEndTime: details.actualEndTime } : {}),
      ...(concurrentViewers !== undefined ? { concurrentViewers } : {}),
      ...(details?.activeLiveChatId ? { activeLiveChatId: details.activeLiveChatId } : {}),
    },
    statistics: {
      ...(viewCount !== undefined ? { viewCount } : {}),
      ...(likeCount !== undefined ? { likeCount } : {}),
      ...(commentCount !== undefined ? { commentCount } : {}),
    },
  }
}
