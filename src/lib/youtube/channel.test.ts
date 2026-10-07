import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getYouTubeChannel, uploadsPlaylistId } from './channel'
import type { YouTubeApiError } from './client'

const API_KEY = 'test-youtube-api-key'
const CHANNEL_ID = 'UCdWZMGfre33FZdDgcd1dz-A'

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const playlistItem = (videoId: string) => ({
  snippet: {
    channelTitle: 'Campestre TV',
    resourceId: { videoId },
  },
})

const videoItem = (
  id: string,
  title: string,
  liveBroadcastContent: string,
  liveStreamingDetails?: Record<string, string>,
) => ({
  id,
  snippet: {
    title,
    description: '',
    channelId: CHANNEL_ID,
    channelTitle: 'Campestre TV',
    liveBroadcastContent,
    thumbnails: { high: { url: `https://i.ytimg.com/${id}.jpg` } },
  },
  ...(liveStreamingDetails ? { liveStreamingDetails } : {}),
  statistics: { viewCount: '20', likeCount: '2', commentCount: '1' },
  status: { embeddable: true, privacyStatus: 'public' },
})

const mockYouTube = (
  playlistItems: ReturnType<typeof playlistItem>[],
  videos: ReturnType<typeof videoItem>[],
) => {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = new URL(String(input))

    if (url.pathname.endsWith('/playlistItems')) {
      return jsonResponse({ items: playlistItems })
    }

    if (url.pathname.endsWith('/videos')) {
      return jsonResponse({ items: videos })
    }

    throw new Error(`Unexpected YouTube request: ${url.pathname}`)
  })
}

describe('getYouTubeChannel', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = API_KEY
    process.env.YOUTUBE_CHANNEL_ID = CHANNEL_ID
    delete process.env.YOUTUBE_CHANNEL_VIDEO_LIMIT
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY
    delete process.env.YOUTUBE_CHANNEL_ID
    delete process.env.YOUTUBE_CHANNEL_VIDEO_LIMIT
    vi.unstubAllGlobals()
  })

  it('derives the uploads playlist from the channel id', () => {
    expect(uploadsPlaylistId(CHANNEL_ID)).toBe('UUdWZMGfre33FZdDgcd1dz-A')
  })

  it('loads recent uploads and then their live details', async () => {
    mockYouTube(
      [playlistItem('aaaaaaaaaaa'), playlistItem('bbbbbbbbbbb')],
      [
        videoItem('aaaaaaaaaaa', 'Campestre TV - Quadra 1', 'live', {
          actualStartTime: '2026-10-07T18:00:00Z',
          concurrentViewers: '342',
        }),
        videoItem('bbbbbbbbbbb', 'Campestre TV - Quadra 2', 'none'),
      ],
    )

    const channel = await getYouTubeChannel(null)
    const fetchMock = vi.mocked(fetch)
    const playlistUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    const videosUrl = new URL(String(fetchMock.mock.calls[1]?.[0]))

    expect(playlistUrl.pathname).toBe('/youtube/v3/playlistItems')
    expect(playlistUrl.searchParams.get('playlistId')).toBe('UUdWZMGfre33FZdDgcd1dz-A')
    expect(playlistUrl.searchParams.get('part')).toBe('snippet')
    expect(playlistUrl.searchParams.get('maxResults')).toBe('50')
    expect(playlistUrl.searchParams.get('key')).toBe(API_KEY)
    expect(videosUrl.pathname).toBe('/youtube/v3/videos')
    expect(videosUrl.searchParams.get('id')).toBe('aaaaaaaaaaa,bbbbbbbbbbb')
    expect(videosUrl.searchParams.get('part')).toBe(
      'snippet,liveStreamingDetails,statistics,status',
    )
    expect(channel.channel).toEqual({ id: CHANNEL_ID, title: 'Campestre TV' })
    expect(channel.liveCount).toBe(1)
    expect(channel.videos.map((video) => video.id)).toEqual(['aaaaaaaaaaa'])
    expect(channel.videos[0]?.courtName).toBe('Quadra 1')
    expect(channel.videos[0]?.live).toMatchObject({
      status: 'live',
      actualStartTime: '2026-10-07T18:00:00Z',
      concurrentViewers: 342,
    })
  })

  it('returns every live court and keeps live broadcasts ahead of the others', async () => {
    mockYouTube(
      [playlistItem('ccccccccccc'), playlistItem('aaaaaaaaaaa'), playlistItem('bbbbbbbbbbb')],
      [
        videoItem('ccccccccccc', 'Campestre TV - Quadra 3', 'none', {
          actualStartTime: '2026-10-07T12:00:00Z',
          actualEndTime: '2026-10-07T13:00:00Z',
        }),
        videoItem('aaaaaaaaaaa', 'Campestre TV - Quadra 1', 'live', {
          actualStartTime: '2026-10-07T18:00:00Z',
          concurrentViewers: '342',
        }),
        videoItem('bbbbbbbbbbb', 'Campestre TV - Quadra 2', 'upcoming', {
          scheduledStartTime: '2026-10-08T15:00:00Z',
        }),
      ],
    )

    const channel = await getYouTubeChannel(null)

    expect(channel.liveCount).toBe(1)
    expect(channel.videos.map((video) => [video.courtName, video.live.status])).toEqual([
      ['Quadra 1', 'live'],
      ['Quadra 2', 'upcoming'],
      ['Quadra 3', 'completed'],
    ])
    expect(channel.videos[0]?.live.concurrentViewers).toBe(342)
    expect(channel.videos[1]?.live.scheduledStartTime).toBe('2026-10-08T15:00:00Z')
  })

  it('counts multiple live courts', async () => {
    mockYouTube(
      [playlistItem('aaaaaaaaaaa'), playlistItem('bbbbbbbbbbb')],
      [
        videoItem('aaaaaaaaaaa', 'Campestre TV - Quadra 1', 'live', {
          actualStartTime: '2026-10-07T18:00:00Z',
          concurrentViewers: '342',
        }),
        videoItem('bbbbbbbbbbb', 'Campestre TV - Quadra 2', 'live', {
          actualStartTime: '2026-10-07T18:05:00Z',
          concurrentViewers: '127',
        }),
      ],
    )

    const channel = await getYouTubeChannel(null)

    expect(channel.liveCount).toBe(2)
    expect(channel.videos.map((video) => video.courtName)).toEqual(['Quadra 1', 'Quadra 2'])
    expect(channel.videos.map((video) => video.live.concurrentViewers)).toEqual([342, 127])
  })

  it('returns no live videos when the recent uploads are not broadcasts', async () => {
    mockYouTube([playlistItem('aaaaaaaaaaa')], [videoItem('aaaaaaaaaaa', 'Campestre TV', 'none')])

    const channel = await getYouTubeChannel(null)

    expect(channel.liveCount).toBe(0)
    expect(channel.videos).toEqual([])
    expect(channel.channel.title).toBe('Campestre TV')
  })

  it('leaves courtName null when the title does not name one court', async () => {
    mockYouTube(
      [playlistItem('aaaaaaaaaaa')],
      [
        videoItem('aaaaaaaaaaa', 'Campestre TV', 'live', {
          actualStartTime: '2026-10-07T18:00:00Z',
        }),
      ],
    )

    const channel = await getYouTubeChannel(null)

    expect(channel.videos[0]?.courtName).toBeNull()
  })

  it('uses a channel id from the query and a configured discovery limit', async () => {
    process.env.YOUTUBE_CHANNEL_VIDEO_LIMIT = '2'
    const otherChannelId = 'UCzzzzzzzzzzzzzzzzzzzzzz'
    mockYouTube([], [])

    await getYouTubeChannel(otherChannelId)

    const playlistUrl = new URL(String(vi.mocked(fetch).mock.calls[0]?.[0]))
    expect(playlistUrl.searchParams.get('playlistId')).toBe(uploadsPlaylistId(otherChannelId))
    expect(playlistUrl.searchParams.get('maxResults')).toBe('2')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('reports a missing channel before calling YouTube', async () => {
    delete process.env.YOUTUBE_CHANNEL_ID

    await expect(getYouTubeChannel(null)).rejects.toMatchObject({
      code: 'invalid_request',
      message: 'Missing channel id.',
      status: 400,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects an invalid channel id', async () => {
    await expect(getYouTubeChannel('not-a-channel')).rejects.toMatchObject({
      message: 'Channel id is invalid.',
      status: 400,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports a missing channel when the uploads playlist does not exist', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: `Playlist missing for key ${API_KEY}`,
            errors: [{ reason: 'playlistNotFound', message: API_KEY }],
          },
        },
        404,
      ),
    )

    await expect(getYouTubeChannel(null)).rejects.toEqual(
      expect.objectContaining<Partial<YouTubeApiError>>({
        code: 'channel_not_found',
        message: 'Channel not found.',
        status: 404,
      }),
    )
  })

  it('hides the API key when YouTube quota is exceeded', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: `Quota exceeded for key ${API_KEY}`,
            errors: [{ reason: 'quotaExceeded', message: API_KEY }],
          },
        },
        403,
      ),
    )

    await expect(getYouTubeChannel(null)).rejects.toMatchObject({
      code: 'quota_exceeded',
      message: 'YouTube quota was exceeded.',
      status: 503,
    })
  })

  it('hides the API key when YouTube returns an error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { message: API_KEY, errors: [{ reason: 'backendError' }] } }, 500),
    )

    await expect(getYouTubeChannel(null)).rejects.toMatchObject({
      code: 'youtube_error',
      message: 'YouTube request failed.',
      status: 502,
    })
  })
})
