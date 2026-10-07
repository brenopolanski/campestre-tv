import { getYouTubeVideos, parseYouTubeVideoIds, YouTubeApiError } from '@/lib/youtube/api'

export async function GET(request: Request) {
  try {
    const videoIds = parseYouTubeVideoIds(new URL(request.url).searchParams.get('ids'))
    const videos = await getYouTubeVideos(videoIds)

    return Response.json(
      { videos },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    if (error instanceof YouTubeApiError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    return Response.json({ error: 'Could not load YouTube videos.' }, { status: 500 })
  }
}
