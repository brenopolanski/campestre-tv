import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchYouTubeVideos } from './fetch-videos'

describe('fetchYouTubeVideos', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the app endpoint instead of YouTube', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ videos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchYouTubeVideos(['aaaaaaaaaaa', 'bbbbbbbbbbb'])

    expect(fetchMock).toHaveBeenCalledOnce()
    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toBe('/api/youtube/videos?ids=aaaaaaaaaaa%2Cbbbbbbbbbbb')
    expect(url).not.toContain('googleapis')
    expect(url).not.toContain('key=')
  })
})
