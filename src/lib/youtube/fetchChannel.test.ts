import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchYouTubeChannel } from './fetchChannel'

describe('fetchYouTubeChannel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the app endpoint instead of YouTube', async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ channel: { id: 'UC', title: '' }, liveCount: 0, videos: [] }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchYouTubeChannel()
    await fetchYouTubeChannel('UCdWZMGfre33FZdDgcd1dz-A')

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/youtube/channel')
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      '/api/youtube/channel?channelId=UCdWZMGfre33FZdDgcd1dz-A',
    )
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('googleapis')
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('key=')
  })
})
