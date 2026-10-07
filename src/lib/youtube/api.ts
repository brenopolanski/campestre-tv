import { fetchYouTubeVideoList, YouTubeApiError } from './client'
import { normalizeYouTubeVideo } from './normalizers'
import type { YouTubeVideo } from './types'

export const YOUTUBE_MAX_VIDEO_IDS = 50
const YOUTUBE_IDS_PER_REQUEST = 50
const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/

export { YouTubeApiError }

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export const parseYouTubeVideoIds = (value: string | null): string[] => {
  if (value === null || value.trim() === '') {
    throw new YouTubeApiError('invalid_request', 'Missing video ids.', 400)
  }

  const videoIds = value.split(',').map((id) => id.trim())

  if (videoIds.some((id) => !YOUTUBE_VIDEO_ID_PATTERN.test(id))) {
    throw new YouTubeApiError('invalid_request', 'One or more video ids are invalid.', 400)
  }

  if (videoIds.length > YOUTUBE_MAX_VIDEO_IDS) {
    throw new YouTubeApiError('invalid_request', 'Too many video ids.', 400)
  }

  return videoIds
}

export const getYouTubeVideos = async (videoIds: string[]): Promise<YouTubeVideo[]> => {
  if (videoIds.length === 0) {
    return []
  }

  if (videoIds.some((id) => !YOUTUBE_VIDEO_ID_PATTERN.test(id))) {
    throw new YouTubeApiError('invalid_request', 'One or more video ids are invalid.', 400)
  }

  const uniqueIds = [...new Set(videoIds)]
  const videosById = new Map<string, YouTubeVideo>()

  for (const ids of chunk(uniqueIds, YOUTUBE_IDS_PER_REQUEST)) {
    const response = await fetchYouTubeVideoList(ids)

    for (const item of response.items ?? []) {
      const video = normalizeYouTubeVideo(item)
      if (video) {
        videosById.set(video.id, video)
      }
    }
  }

  return videoIds.flatMap((id) => {
    const video = videosById.get(id)
    return video ? [video] : []
  })
}
