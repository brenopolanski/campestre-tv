import type { YouTubeVideosResponse } from './types'

// Browser helper. Calls this app's API and never sends a YouTube API key.
export const fetchYouTubeVideos = async (videoIds: string[]): Promise<YouTubeVideosResponse> => {
  const params = new URLSearchParams({ ids: videoIds.join(',') })
  const response = await fetch(`/api/youtube/videos?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Could not load YouTube videos.')
  }

  return response.json() as Promise<YouTubeVideosResponse>
}
