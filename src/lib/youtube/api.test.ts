import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getYouTubeVideos, parseYouTubeVideoIds } from './api'
import { fetchYouTubeVideoList, YouTubeApiError } from './client'

const API_KEY = 'test-youtube-api-key'

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const videoItem = (id: string, title: string) => ({
  id,
  snippet: {
    title,
    description: '',
    channelId: 'channel-id1',
    channelTitle: 'Campestre TV',
    liveBroadcastContent: 'none',
  },
  statistics: { viewCount: '10', likeCount: '1', commentCount: '0' },
  status: { embeddable: true, privacyStatus: 'public' },
})

describe('YouTube API client', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = API_KEY
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY
    vi.unstubAllGlobals()
  })

  it('requests every id in one videos.list call and keeps the requested order', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      jsonResponse({
        items: [videoItem('bbbbbbbbbbb', 'Second'), videoItem('aaaaaaaaaaa', 'First')],
      }),
    )

    const videos = await getYouTubeVideos(['aaaaaaaaaaa', 'bbbbbbbbbbb'])

    expect(fetchMock).toHaveBeenCalledOnce()
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(requestUrl.origin + requestUrl.pathname).toBe('https://googleapis.com/youtube/v3/videos')
    expect(requestUrl.searchParams.get('part')).toBe(
      'snippet,liveStreamingDetails,statistics,status',
    )
    expect(requestUrl.searchParams.get('id')).toBe('aaaaaaaaaaa,bbbbbbbbbbb')
    expect(requestUrl.searchParams.get('key')).toBe(API_KEY)
    expect(videos.map((video) => video.id)).toEqual(['aaaaaaaaaaa', 'bbbbbbbbbbb'])
  })

  it('omits videos YouTube did not return', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [videoItem('aaaaaaaaaaa', 'Found')] }))

    const videos = await getYouTubeVideos(['aaaaaaaaaaa', 'bbbbbbbbbbb'])

    expect(videos.map((video) => video.id)).toEqual(['aaaaaaaaaaa'])
  })

  it('splits ids into batches of 50', async () => {
    const ids = Array.from({ length: 51 }, (_, index) => `v${String(index).padStart(10, '0')}`)
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(async (input) => {
      const requested = new URL(String(input)).searchParams.get('id')?.split(',') ?? []
      return jsonResponse({ items: requested.map((id) => videoItem(id, id)) })
    })

    const videos = await getYouTubeVideos(ids)
    const firstRequestIds =
      new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get('id')?.split(',') ?? []
    const secondRequestIds =
      new URL(String(fetchMock.mock.calls[1]?.[0])).searchParams.get('id')?.split(',') ?? []

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(firstRequestIds).toHaveLength(50)
    expect(secondRequestIds).toEqual([ids[50]])
    expect(videos.map((video) => video.id)).toEqual(ids)
  })

  it('rejects a missing API key before calling YouTube', async () => {
    delete process.env.YOUTUBE_API_KEY

    await expect(fetchYouTubeVideoList(['aaaaaaaaaaa'])).rejects.toEqual(
      expect.objectContaining<Partial<YouTubeApiError>>({
        code: 'missing_api_key',
        status: 500,
      }),
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('hides the API key when YouTube returns a quota error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 403,
            message: `Quota exceeded for key ${API_KEY}`,
            errors: [{ reason: 'quotaExceeded', message: `key=${API_KEY}` }],
          },
        },
        403,
      ),
    )

    await expect(getYouTubeVideos(['aaaaaaaaaaa'])).rejects.toMatchObject({
      code: 'quota_exceeded',
      status: 503,
      message: 'YouTube quota was exceeded.',
    })
  })

  it('hides the API key when the key is rejected', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          error: {
            errors: [{ reason: 'keyInvalid', message: API_KEY }],
          },
        },
        400,
      ),
    )

    await expect(fetchYouTubeVideoList(['aaaaaaaaaaa'])).rejects.toMatchObject({
      code: 'invalid_api_key',
      message: 'YouTube API key was rejected.',
    })
  })

  it('reports a network failure without the request URL', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error(`connect failed key=${API_KEY}`))

    await expect(fetchYouTubeVideoList(['aaaaaaaaaaa'])).rejects.toMatchObject({
      code: 'network_error',
      message: 'Could not reach YouTube.',
    })
  })

  it('reports a malformed YouTube response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: { id: 'aaaaaaaaaaa' } }))

    await expect(fetchYouTubeVideoList(['aaaaaaaaaaa'])).rejects.toMatchObject({
      code: 'malformed_response',
      status: 502,
    })
  })
})

describe('parseYouTubeVideoIds', () => {
  it('rejects missing, empty, malformed, and excessive ids', () => {
    expect(() => parseYouTubeVideoIds(null)).toThrow(YouTubeApiError)
    expect(() => parseYouTubeVideoIds('')).toThrow('Missing video ids.')
    expect(() => parseYouTubeVideoIds('abc')).toThrow('One or more video ids are invalid.')
    expect(() => parseYouTubeVideoIds('aaaaaaaaaaa,,bbbbbbbbbbb')).toThrow(
      'One or more video ids are invalid.',
    )

    const tooMany = Array.from({ length: 51 }, (_, index) => `v${String(index).padStart(10, '0')}`)
    expect(() => parseYouTubeVideoIds(tooMany.join(','))).toThrow('Too many video ids.')
  })

  it('trims a valid list', () => {
    expect(parseYouTubeVideoIds(' aaaaaaaaaaa, bbbbbbbbbbb ')).toEqual([
      'aaaaaaaaaaa',
      'bbbbbbbbbbb',
    ])
  })
})
