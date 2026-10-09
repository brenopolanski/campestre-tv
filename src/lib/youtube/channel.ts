import { getYouTubeVideos, YouTubeApiError } from './api'
import { fetchYouTubePlaylistItems } from './client'
import { readCourtName } from './court-name'
import type { YouTubeChannelBroadcasts, YouTubeLiveStatus } from './types'

const CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/
const DEFAULT_VIDEO_LIMIT = 50
const MAX_VIDEO_LIMIT = 50

const LIVE_STATUS_ORDER: Record<YouTubeLiveStatus, number> = {
  completed: 2,
  live: 0,
  none: 3,
  upcoming: 1,
}

// The uploads playlist id is the channel id with the UC prefix replaced by UU.
// playlistItems.list costs 1 unit. search.list costs 100, so recent uploads plus
// videos.list is the cheaper way to see which broadcasts are live.
export const uploadsPlaylistId = (channelId: string): string => {
  return `UU${channelId.slice(2)}`
}

const readVideoLimit = (): number => {
  const raw = process.env.YOUTUBE_CHANNEL_VIDEO_LIMIT

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_VIDEO_LIMIT
  }

  const parsed = Number(raw)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_VIDEO_LIMIT) {
    throw new YouTubeApiError('invalid_request', 'Channel video limit is invalid.', 500)
  }

  return parsed
}

export const resolveYouTubeChannelId = (channelId: string | null): string => {
  if (channelId !== null) {
    const trimmed = channelId.trim()

    if (!CHANNEL_ID_PATTERN.test(trimmed)) {
      throw new YouTubeApiError('invalid_request', 'Channel id is invalid.', 400)
    }

    return trimmed
  }

  const configured = process.env.YOUTUBE_CHANNEL_ID?.trim() ?? ''

  if (!configured) {
    throw new YouTubeApiError('invalid_request', 'Missing channel id.', 400)
  }

  if (!CHANNEL_ID_PATTERN.test(configured)) {
    throw new YouTubeApiError('invalid_request', 'Channel id is invalid.', 500)
  }

  return configured
}

export const getYouTubeChannel = async (
  channelId: string | null,
): Promise<YouTubeChannelBroadcasts> => {
  const id = resolveYouTubeChannelId(channelId)
  const playlistId = uploadsPlaylistId(id)

  let playlist

  try {
    playlist = await fetchYouTubePlaylistItems(playlistId, readVideoLimit())
  } catch (error) {
    if (error instanceof YouTubeApiError && error.reason === 'playlistNotFound') {
      throw new YouTubeApiError('channel_not_found', 'Channel not found.', 404)
    }

    throw error
  }

  const videoIds: string[] = []
  let channelTitle = ''

  for (const item of playlist.items ?? []) {
    if (!channelTitle && item.snippet?.channelTitle) {
      channelTitle = item.snippet.channelTitle
    }

    const videoId = item.snippet?.resourceId?.videoId

    if (videoId) {
      videoIds.push(videoId)
    }
  }

  const detailed = await getYouTubeVideos(videoIds)

  if (!channelTitle) {
    channelTitle = detailed.find((video) => video.channelTitle)?.channelTitle ?? ''
  }

  const videos = detailed
    .filter((video) => video.live.status !== 'none')
    .map((video) => ({
      ...video,
      courtName: readCourtName(video.title),
    }))
    .sort(
      (left, right) => LIVE_STATUS_ORDER[left.live.status] - LIVE_STATUS_ORDER[right.live.status],
    )

  return {
    channel: {
      id,
      title: channelTitle,
    },
    liveCount: videos.filter((video) => video.live.status === 'live').length,
    videos,
  }
}
