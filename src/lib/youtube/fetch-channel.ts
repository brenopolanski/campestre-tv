import type { YouTubeChannelBroadcasts } from './types'

// Browser helper. Calls this app's API and never sends a YouTube API key.
export const fetchYouTubeChannel = async (
  channelId?: string,
): Promise<YouTubeChannelBroadcasts> => {
  const params = new URLSearchParams()

  if (channelId) {
    params.set('channelId', channelId)
  }

  const query = params.size > 0 ? `?${params.toString()}` : ''
  const response = await fetch(`/api/youtube/channel${query}`)

  if (!response.ok) {
    throw new Error('Could not load the YouTube channel.')
  }

  return response.json() as Promise<YouTubeChannelBroadcasts>
}
