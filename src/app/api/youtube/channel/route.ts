import { getYouTubeChannel } from '@/lib/youtube/channel'
import { YouTubeApiError } from '@/lib/youtube/client'

export async function GET(request: Request) {
  try {
    const channel = await getYouTubeChannel(new URL(request.url).searchParams.get('channelId'))

    return Response.json(channel, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof YouTubeApiError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    return Response.json({ error: 'Could not load the YouTube channel.' }, { status: 500 })
  }
}
