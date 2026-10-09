'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'

import { YouTubeLivePlayer } from '@/components/youtube/YouTubeLivePlayer'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics'
import type { BroadcastCourt } from '@/lib/courts'
import { courts, featuredCourt } from '@/lib/courts'
import { generateReactKey } from '@/lib/utils'
import { fetchYouTubeChannel } from '@/lib/youtube/fetchChannel'
import { canEmbedLiveVideo, getYouTubeWatchUrl } from '@/lib/youtube/playback'
import type { YouTubeChannelVideo } from '@/lib/youtube/types'

import { CourtCard } from './CourtCard'
import { CourtPlayer } from './CourtPlayer'

const toBroadcastCourt = (video: YouTubeChannelVideo): BroadcastCourt => {
  return {
    alt: video.title ? video.title : 'Transmissão ao vivo',
    height: 720,
    image: video.thumbnailUrl ?? '/no-thumb.png',
    live: true,
    name: video.courtName ?? video.title,
    width: 1280,
    ...(typeof video.live.concurrentViewers === 'number'
      ? { viewers: video.live.concurrentViewers }
      : {}),
  }
}

const readCourtNumber = (video: YouTubeChannelVideo): number | null => {
  const digits = video.courtName?.match(/\d+/)?.[0]

  return digits ? Number(digits) : null
}

const compareVideos = (a: YouTubeChannelVideo, b: YouTubeChannelVideo) => {
  return (a.courtName ?? a.title).localeCompare(b.courtName ?? b.title, 'pt-BR', {
    numeric: true,
  })
}

interface BroadcastShellProps {
  cards: React.ReactNode
  player: React.ReactNode
}

const BroadcastShell = ({ cards, player }: BroadcastShellProps) => {
  return (
    <div className="@container mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
      <div className="w-full min-w-0 md:flex-1">{player}</div>
      <nav
        aria-label="Quadras"
        className="border-t border-surface md:self-stretch md:border-t-0 md:border-l"
      >
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain p-4 md:flex-col md:overflow-visible md:p-[1.4rem]">
          {cards}
        </ul>
      </nav>
    </div>
  )
}

export const LiveBroadcastFallback = () => {
  return (
    <BroadcastShell
      cards={[...courts]
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
        .map((court, index) => (
          <CourtCard key={generateReactKey('court-card', court.id, index)} court={court} />
        ))}
      player={<CourtPlayer court={featuredCourt} />}
    />
  )
}

export const LiveBroadcast = () => {
  const [liveVideos, setLiveVideos] = useState<YouTubeChannelVideo[] | null>(null)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [liveCourt, setLiveCourt] = useQueryState(
    'live',
    parseAsInteger.withOptions({ history: 'replace', scroll: false }),
  )

  useEffect(() => {
    let active = true

    void fetchYouTubeChannel()
      .then((channel) => {
        if (!active) {
          return
        }

        setLiveVideos(channel.videos.filter((video) => video.live.status === 'live'))
      })
      .catch(() => {
        if (!active) {
          return
        }

        setLiveVideos([])
      })

    return () => {
      active = false
    }
  }, [])

  if (!liveVideos || liveVideos.length === 0) {
    return <LiveBroadcastFallback />
  }

  const sortedVideos = [...liveVideos].sort(compareVideos)
  const selected =
    sortedVideos.find((video) => liveCourt !== null && readCourtNumber(video) === liveCourt) ??
    sortedVideos.find((video) => video.id === playingVideoId) ??
    sortedVideos[0]
  const watching = playingVideoId === selected.id
  const embeddable = canEmbedLiveVideo(selected)
  const court = toBroadcastCourt(selected)

  const watchVideo = (video: YouTubeChannelVideo) => {
    trackEvent(ANALYTICS_EVENTS.courtWatch, {
      court: readCourtNumber(video),
      name: video.courtName ?? video.title,
      source: 'card',
    })
    setPlayingVideoId(video.id)
    void setLiveCourt(readCourtNumber(video))
  }

  return (
    <BroadcastShell
      cards={sortedVideos.map((video, index) => {
        const cardCourt = toBroadcastCourt(video)

        return (
          <CourtCard
            key={generateReactKey('court-card', video.id, index)}
            active={video.id === selected.id}
            court={cardCourt}
            onWatch={() => watchVideo(video)}
          />
        )
      })}
      player={
        <CourtPlayer
          court={court}
          externalWatchUrl={watching && !embeddable ? getYouTubeWatchUrl(selected.id) : undefined}
          playback={
            watching && embeddable ? (
              <YouTubeLivePlayer title={selected.title} videoId={selected.id} />
            ) : undefined
          }
          onWatch={
            watching
              ? undefined
              : () => {
                  trackEvent(ANALYTICS_EVENTS.courtWatch, {
                    court: readCourtNumber(selected),
                    name: court.name,
                    source: 'player',
                  })
                  setPlayingVideoId(selected.id)
                }
          }
        />
      }
    />
  )
}
