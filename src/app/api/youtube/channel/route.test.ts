import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

const API_KEY = 'test-youtube-api-key'
const CHANNEL_ID = 'UCdWZMGfre33FZdDgcd1dz-A'

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/youtube/channel', () => {
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

  it('returns live courts without the API key', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = new URL(String(input))

      if (url.pathname.endsWith('/playlistItems')) {
        return jsonResponse({
          items: [
            {
              snippet: {
                channelTitle: 'Campestre TV',
                resourceId: { videoId: 'aaaaaaaaaaa' },
              },
            },
            {
              snippet: {
                channelTitle: 'Campestre TV',
                resourceId: { videoId: 'bbbbbbbbbbb' },
              },
            },
          ],
        })
      }

      return jsonResponse({
        items: [
          {
            id: 'aaaaaaaaaaa',
            snippet: {
              title: 'Campestre TV - Quadra 1',
              description: 'Ao vivo',
              channelId: CHANNEL_ID,
              channelTitle: 'Campestre TV',
              liveBroadcastContent: 'live',
              thumbnails: { high: { url: 'https://i.ytimg.com/quadra-1.jpg' } },
            },
            liveStreamingDetails: {
              actualStartTime: '2026-10-07T18:00:00Z',
              concurrentViewers: '342',
            },
            statistics: { viewCount: '10' },
          },
          {
            id: 'bbbbbbbbbbb',
            snippet: {
              title: 'Campestre TV - Quadra 2',
              description: '',
              channelId: CHANNEL_ID,
              channelTitle: 'Campestre TV',
              liveBroadcastContent: 'live',
              thumbnails: { high: { url: 'https://i.ytimg.com/quadra-2.jpg' } },
            },
            liveStreamingDetails: {
              actualStartTime: '2026-10-07T18:05:00Z',
              concurrentViewers: '127',
            },
            statistics: { viewCount: '8' },
          },
        ],
      })
    })

    const response = await GET(new Request('http://localhost/api/youtube/channel'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(JSON.stringify(body)).not.toContain(API_KEY)
    expect(body.channel).toEqual({ id: CHANNEL_ID, title: 'Campestre TV' })
    expect(body.liveCount).toBe(2)
    expect(
      body.videos.map((video: { courtName: string; id: string }) => [video.id, video.courtName]),
    ).toEqual([
      ['aaaaaaaaaaa', 'Quadra 1'],
      ['bbbbbbbbbbb', 'Quadra 2'],
    ])
  })

  it('returns 404 when the channel does not exist', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { errors: [{ reason: 'playlistNotFound', message: API_KEY }] } }, 404),
    )

    const response = await GET(new Request('http://localhost/api/youtube/channel'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: 'Channel not found.' })
    expect(JSON.stringify(body)).not.toContain(API_KEY)
  })

  it('returns 400 when no channel id is configured', async () => {
    delete process.env.YOUTUBE_CHANNEL_ID

    const response = await GET(new Request('http://localhost/api/youtube/channel'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Missing channel id.' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
