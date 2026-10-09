'use client'

import { useEffect, useState } from 'react'

import { YouTubeLivePlayer } from '@/components/youtube/YouTubeLivePlayer'
import type { BroadcastCourt } from '@/lib/courts'
import { courts, featuredCourt } from '@/lib/courts'
import { fetchYouTubeChannel } from '@/lib/youtube/fetch-channel'
import { canEmbedLiveVideo, getYouTubeWatchUrl } from '@/lib/youtube/playback'
import type { YouTubeChannelVideo } from '@/lib/youtube/types'

import { CourtCard } from './CourtCard'
import { CourtPlayer } from './CourtPlayer'

const toBroadcastCourt = (video: YouTubeChannelVideo): BroadcastCourt => {
  return {
    alt: video.title ? video.title : 'Transmissão ao vivo',
    height: 720,
    image: video.thumbnailUrl ?? '/no-thumb.png',
    name: video.courtName ?? video.title,
    width: 1280,
    ...(typeof video.live.concurrentViewers === 'number'
      ? { viewers: video.live.concurrentViewers }
      : {}),
  }
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

export const LiveBroadcast = () => {
  const [liveVideos, setLiveVideos] = useState<YouTubeChannelVideo[] | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

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
    return (
      <BroadcastShell
        cards={courts.map((court) => (
          <CourtCard key={court.id} court={court} />
        ))}
        player={<CourtPlayer court={featuredCourt} />}
      />
    )
  }

  const selected = liveVideos.find((video) => video.id === selectedVideoId) ?? liveVideos[0]
  const watching = selectedVideoId === selected.id
  const embeddable = canEmbedLiveVideo(selected)
  const court = toBroadcastCourt(selected)

  return (
    <BroadcastShell
      cards={liveVideos.map((video) => {
        const cardCourt = toBroadcastCourt(video)

        return (
          <CourtCard
            key={video.id}
            active={video.id === selected.id}
            court={cardCourt}
            onWatch={() => setSelectedVideoId(video.id)}
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
          onWatch={watching ? undefined : () => setSelectedVideoId(selected.id)}
        />
      }
    />
  )
}
