/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LiveBroadcast } from './LiveBroadcast'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img">{alt}</span>,
}))

vi.mock('react-youtube', () => ({
  default: ({ title, videoId }: { title?: string; videoId?: string }) => (
    <div data-testid="youtube-player" data-video-id={videoId} title={title} />
  ),
}))

const channel = {
  channel: { id: 'UCdWZMGfre33FZdDgcd1dz-A', title: 'Campestre TV' },
  liveCount: 2,
  videos: [
    {
      id: 'abcdefghijk',
      title: 'Quadra 8 - quarta-feira, 7 de outubro de 2026',
      description: '',
      channelId: 'UCdWZMGfre33FZdDgcd1dz-A',
      channelTitle: 'Campestre TV',
      thumbnailUrl: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
      courtName: 'Quadra 8',
      embeddable: true,
      live: {
        status: 'live',
        actualStartTime: '2026-10-07T18:00:00Z',
        concurrentViewers: 342,
      },
      statistics: { viewCount: 10 },
    },
    {
      id: 'lmnopqrstuv',
      title: 'Transmissão especial',
      description: '',
      channelId: 'UCdWZMGfre33FZdDgcd1dz-A',
      channelTitle: 'Campestre TV',
      thumbnailUrl: 'https://i.ytimg.com/vi/lmnopqrstuv/hqdefault.jpg',
      courtName: null,
      embeddable: false,
      live: {
        status: 'live',
        concurrentViewers: 12,
      },
      statistics: {},
    },
    {
      id: 'completedvid',
      title: 'Quadra 1',
      description: '',
      channelId: 'UCdWZMGfre33FZdDgcd1dz-A',
      channelTitle: 'Campestre TV',
      courtName: 'Quadra 1',
      embeddable: true,
      live: { status: 'completed' },
      statistics: {},
    },
  ],
}

describe('LiveBroadcast', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(channel), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('plays the selected embeddable court and links out when embedding is disabled', async () => {
    render(<LiveBroadcast />, { wrapper: withNuqsTestingAdapter() })

    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe('/api/youtube/channel')

    fireEvent.click(await screen.findByRole('button', { name: 'Assistir Quadra 8 ao vivo' }))

    const player = screen.getByTestId('youtube-player')
    expect(player.getAttribute('data-video-id')).toBe('abcdefghijk')
    expect(screen.getAllByTestId('youtube-player')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /^Transmissão especial/ }))

    expect(screen.queryByTestId('youtube-player')).toBeNull()
    const link = screen.getByRole('link', { name: /Assistir no YouTube/ })
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/watch?v=lmnopqrstuv')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.queryByRole('heading', { name: 'Quadra 1' })).toBeNull()
  })

  it('opens the court from a shared ?live= link and updates it on click', async () => {
    const quadra6 = {
      ...channel.videos[0],
      courtName: 'Quadra 6',
      id: 'quadra6vid00',
      title: 'Quadra 6 - quarta-feira, 7 de outubro de 2026',
    }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...channel, videos: [quadra6, ...channel.videos] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const onUrlUpdate = vi.fn()

    render(<LiveBroadcast />, {
      wrapper: withNuqsTestingAdapter({ hasMemory: true, onUrlUpdate, searchParams: '?live=8' }),
    })

    expect(await screen.findByRole('heading', { level: 1, name: 'Quadra 8' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^Quadra 6/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Quadra 6' })).toBeTruthy()
    expect(screen.getByTestId('youtube-player').getAttribute('data-video-id')).toBe('quadra6vid00')
    await vi.waitFor(() => {
      expect(onUrlUpdate.mock.lastCall?.[0].searchParams.get('live')).toBe('6')
    })
  })
})
