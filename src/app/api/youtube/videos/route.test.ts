import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/youtube/videos', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = 'test-youtube-api-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY
    vi.unstubAllGlobals()
  })

  it('returns normalized videos without the API key', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        items: [
          {
            id: 'aaaaaaaaaaa',
            snippet: {
              title: 'Quadra 1 ao vivo',
              description: 'Ao vivo',
              channelId: 'channel-id1',
              channelTitle: 'Campestre TV',
              publishedAt: '2026-10-07T18:00:00Z',
              liveBroadcastContent: 'live',
              thumbnails: { high: { url: 'https://i.ytimg.com/high.jpg' } },
            },
            liveStreamingDetails: {
              actualStartTime: '2026-10-07T18:00:00Z',
              concurrentViewers: '342',
            },
            statistics: { viewCount: '12345', likeCount: '123', commentCount: '45' },
            status: { embeddable: true, privacyStatus: 'public' },
          },
        ],
      }),
    )

    const response = await GET(new Request('http://localhost/api/youtube/videos?ids=aaaaaaaaaaa'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(JSON.stringify(body)).not.toContain('test-youtube-api-key')
    expect(body).toEqual({
      videos: [
        {
          id: 'aaaaaaaaaaa',
          title: 'Quadra 1 ao vivo',
          description: 'Ao vivo',
          channelId: 'channel-id1',
          channelTitle: 'Campestre TV',
          thumbnailUrl: 'https://i.ytimg.com/high.jpg',
          publishedAt: '2026-10-07T18:00:00Z',
          embeddable: true,
          privacyStatus: 'public',
          live: {
            status: 'live',
            actualStartTime: '2026-10-07T18:00:00Z',
            concurrentViewers: 342,
          },
          statistics: {
            viewCount: 12345,
            likeCount: 123,
            commentCount: 45,
          },
        },
      ],
    })
  })

  it('returns 400 when ids are missing', async () => {
    const response = await GET(new Request('http://localhost/api/youtube/videos'))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Missing video ids.' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 503 when YouTube quota is exceeded', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { errors: [{ reason: 'quotaExceeded' }] } }, 403),
    )

    const response = await GET(new Request('http://localhost/api/youtube/videos?ids=aaaaaaaaaaa'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: 'YouTube quota was exceeded.' })
  })

  it('returns 500 when the API key is missing', async () => {
    delete process.env.YOUTUBE_API_KEY

    const response = await GET(new Request('http://localhost/api/youtube/videos?ids=aaaaaaaaaaa'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'YouTube API key is not configured.',
    })
  })
})
