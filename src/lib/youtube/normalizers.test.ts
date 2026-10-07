import { describe, expect, it } from 'vitest'

import { normalizeYouTubeVideo } from './normalizers'
import type { YouTubeVideoResource } from './types'

const resource = (overrides: YouTubeVideoResource): YouTubeVideoResource => overrides

describe('normalizeYouTubeVideo', () => {
  it('normalizes a regular video', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'abcdefghijk',
        snippet: {
          title: 'Final do sábado',
          description: 'Quadra 1',
          channelId: 'UCdWZMGfre33FZdDgcd1dz-A',
          channelTitle: 'Campestre TV',
          publishedAt: '2026-10-01T12:00:00Z',
          liveBroadcastContent: 'none',
          thumbnails: {
            default: { url: 'https://i.ytimg.com/default.jpg' },
            high: { url: 'https://i.ytimg.com/high.jpg' },
          },
        },
        statistics: {
          viewCount: '1200',
          likeCount: '30',
          commentCount: '4',
        },
        status: {
          embeddable: true,
          privacyStatus: 'public',
        },
      }),
    )

    expect(video).toEqual({
      id: 'abcdefghijk',
      title: 'Final do sábado',
      description: 'Quadra 1',
      channelId: 'UCdWZMGfre33FZdDgcd1dz-A',
      channelTitle: 'Campestre TV',
      thumbnailUrl: 'https://i.ytimg.com/high.jpg',
      publishedAt: '2026-10-01T12:00:00Z',
      embeddable: true,
      privacyStatus: 'public',
      live: { status: 'none' },
      statistics: {
        viewCount: 1200,
        likeCount: 30,
        commentCount: 4,
      },
    })
  })

  it('normalizes a live broadcast', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'livevideoid',
        snippet: {
          title: 'Quadra 1 ao vivo',
          description: '',
          channelId: 'channel-id',
          channelTitle: 'Campestre TV',
          liveBroadcastContent: 'live',
        },
        liveStreamingDetails: {
          actualStartTime: '2026-10-07T18:00:00Z',
          concurrentViewers: '342',
          activeLiveChatId: 'chat-id',
          scheduledStartTime: '2026-10-07T18:00:00Z',
        },
      }),
    )

    expect(video?.live).toEqual({
      status: 'live',
      scheduledStartTime: '2026-10-07T18:00:00Z',
      actualStartTime: '2026-10-07T18:00:00Z',
      concurrentViewers: 342,
      activeLiveChatId: 'chat-id',
    })
  })

  it('normalizes an upcoming broadcast', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'upcomingvid',
        snippet: {
          title: 'Próxima transmissão',
          liveBroadcastContent: 'upcoming',
        },
        liveStreamingDetails: {
          scheduledStartTime: '2026-10-08T15:00:00Z',
        },
      }),
    )

    expect(video?.live).toEqual({
      status: 'upcoming',
      scheduledStartTime: '2026-10-08T15:00:00Z',
    })
  })

  it('treats a broadcast with an end time as completed', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'completedid',
        snippet: {
          title: 'Transmissão encerrada',
          liveBroadcastContent: 'none',
        },
        liveStreamingDetails: {
          scheduledStartTime: '2026-10-07T12:00:00Z',
          actualStartTime: '2026-10-07T12:05:00Z',
          actualEndTime: '2026-10-07T13:40:00Z',
        },
      }),
    )

    expect(video?.live.status).toBe('completed')
    expect(video?.live.actualEndTime).toBe('2026-10-07T13:40:00Z')
  })

  it('prefers an end time over a stale live flag', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'stale-live1',
        snippet: { liveBroadcastContent: 'live' },
        liveStreamingDetails: { actualEndTime: '2026-10-07T13:40:00Z' },
      }),
    )

    expect(video?.live.status).toBe('completed')
  })

  it('keeps a started broadcast live when the content flag is still none', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'startedlive',
        snippet: { liveBroadcastContent: 'none' },
        liveStreamingDetails: { actualStartTime: '2026-10-07T18:00:00Z' },
      }),
    )

    expect(video?.live.status).toBe('live')
  })

  it('omits optional fields that YouTube did not send', () => {
    const video = normalizeYouTubeVideo(
      resource({
        id: 'partialvid1',
        snippet: {
          title: 'Sem estatísticas',
          liveBroadcastContent: 'live',
        },
        statistics: {
          viewCount: '0',
        },
      }),
    )

    expect(video?.statistics.viewCount).toBe(0)
    expect(video?.statistics).not.toHaveProperty('likeCount')
    expect(video?.statistics).not.toHaveProperty('commentCount')
    expect(video?.live).not.toHaveProperty('concurrentViewers')
    expect(video).not.toHaveProperty('thumbnailUrl')
    expect(video).not.toHaveProperty('embeddable')
    expect(video).not.toHaveProperty('privacyStatus')
  })

  it('skips a resource without an id', () => {
    expect(normalizeYouTubeVideo(resource({ snippet: { title: 'Sem id' } }))).toBeNull()
  })
})
