'use client'

import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useState } from 'react'

import { YouTubeLivePlayer } from '@/components/youtube/YouTubeLivePlayer'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics'
import type { BroadcastCourt, Court } from '@/lib/courts'
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

const readNameNumber = (name: string): number | null => {
  const digits = name.match(/\d+/)?.[0]

  return digits ? Number(digits) : null
}

const readCourtNumber = (video: YouTubeChannelVideo): number | null => {
  return video.courtName ? readNameNumber(video.courtName) : null
}

const compareVideos = (a: YouTubeChannelVideo, b: YouTubeChannelVideo) => {
  return (a.courtName ?? a.title).localeCompare(b.courtName ?? b.title, 'pt-BR', {
    numeric: true,
  })
}

interface LiveCourtSlot {
  court: BroadcastCourt
  kind: 'live'
  video: YouTubeChannelVideo
}

interface OfflineCourtSlot {
  court: Court
  kind: 'offline'
}

type CourtSlot = LiveCourtSlot | OfflineCourtSlot

const slotNumber = (slot: CourtSlot): number | null => {
  return readNameNumber(slot.court.name)
}

const buildCourtSlots = (liveVideos: YouTubeChannelVideo[]): CourtSlot[] => {
  const sortedLive = [...liveVideos].sort(compareVideos)
  const catalogNumbers = new Set(
    courts.flatMap((court) => {
      const number = readNameNumber(court.name)

      return number === null ? [] : [number]
    }),
  )
  const catalogSlots = [...courts]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
    .map((court): CourtSlot => {
      const video = sortedLive.find((item) => readCourtNumber(item) === readNameNumber(court.name))

      return video
        ? { court: toBroadcastCourt(video), kind: 'live', video }
        : { court, kind: 'offline' }
    })
  const extraSlots = sortedLive
    .filter((video) => {
      const number = readCourtNumber(video)

      return number === null || !catalogNumbers.has(number)
    })
    .map((video): CourtSlot => ({ court: toBroadcastCourt(video), kind: 'live', video }))

  return [...catalogSlots, ...extraSlots]
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
  const { data } = useQuery({
    queryFn: () => fetchYouTubeChannel(),
    queryKey: ['youtube-channel'],
    refetchInterval: 60_000,
    retry: false,
  })
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [pickedNumber, setPickedNumber] = useState<number | null>(null)
  const [liveCourt, setLiveCourt] = useQueryState(
    'live',
    parseAsInteger.withOptions({ history: 'replace', scroll: false }),
  )
  const liveVideos = data?.videos.filter((video) => video.live.status === 'live')

  if (!liveVideos || liveVideos.length === 0) {
    return <LiveBroadcastFallback />
  }

  const sortedLive = [...liveVideos].sort(compareVideos)
  const slots = buildCourtSlots(liveVideos)
  const selected =
    (pickedNumber !== null ? slots.find((slot) => slotNumber(slot) === pickedNumber) : undefined) ??
    (playingVideoId
      ? slots.find((slot) => slot.kind === 'live' && slot.video.id === playingVideoId)
      : undefined) ??
    (liveCourt !== null ? slots.find((slot) => slotNumber(slot) === liveCourt) : undefined) ??
    slots.find((slot) => slot.kind === 'live' && slot.video.id === sortedLive[0]?.id) ??
    slots[0]

  if (!selected) {
    return <LiveBroadcastFallback />
  }

  const watchVideo = (video: YouTubeChannelVideo) => {
    trackEvent(ANALYTICS_EVENTS.courtWatch, {
      court: readCourtNumber(video),
      name: video.courtName ?? video.title,
      source: 'card',
    })
    setPickedNumber(readCourtNumber(video))
    setPlayingVideoId(video.id)
    void setLiveCourt(readCourtNumber(video))
  }

  const selectOffline = (court: Court) => {
    const number = readNameNumber(court.name)

    setPickedNumber(number)
    setPlayingVideoId(null)
    void setLiveCourt(number)
  }

  const watching = selected.kind === 'live' && playingVideoId === selected.video.id
  const embeddable = selected.kind === 'live' && canEmbedLiveVideo(selected.video)

  return (
    <BroadcastShell
      cards={slots.map((slot, index) => {
        const active =
          slot.kind === 'live'
            ? selected.kind === 'live' && slot.video.id === selected.video.id
            : selected.kind === 'offline' && slot.court.id === selected.court.id

        return (
          <CourtCard
            key={generateReactKey(
              'court-card',
              slot.kind === 'live' ? slot.video.id : slot.court.id,
              index,
            )}
            active={active}
            court={slot.court}
            onWatch={
              slot.kind === 'live' ? () => watchVideo(slot.video) : () => selectOffline(slot.court)
            }
          />
        )
      })}
      player={
        selected.kind === 'offline' ? (
          <CourtPlayer court={selected.court} />
        ) : (
          <CourtPlayer
            court={selected.court}
            externalWatchUrl={
              watching && !embeddable ? getYouTubeWatchUrl(selected.video.id) : undefined
            }
            playback={
              watching && embeddable ? (
                <YouTubeLivePlayer title={selected.video.title} videoId={selected.video.id} />
              ) : undefined
            }
            onWatch={
              watching
                ? undefined
                : () => {
                    trackEvent(ANALYTICS_EVENTS.courtWatch, {
                      court: readCourtNumber(selected.video),
                      name: selected.court.name,
                      source: 'player',
                    })
                    setPlayingVideoId(selected.video.id)
                  }
            }
          />
        )
      }
    />
  )
}
