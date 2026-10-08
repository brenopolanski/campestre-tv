'use client'

import { useEffect, useState } from 'react'

import { CourtCard } from '@/components/broadcast/CourtCard'
import { CourtPlayer } from '@/components/broadcast/CourtPlayer'
import { YouTubeLivePlayer } from '@/components/youtube/YouTubeLivePlayer'
import { type BroadcastCourt, courts, featuredCourt } from '@/lib/courts'
import { fetchYouTubeChannel } from '@/lib/youtube/fetch-channel'
import { canEmbedLiveVideo, getYouTubeWatchUrl } from '@/lib/youtube/playback'
import type { YouTubeChannelVideo } from '@/lib/youtube/types'

const toBroadcastCourt = (video: YouTubeChannelVideo): BroadcastCourt => {
  return {
    alt: video.title ? video.title : 'Transmissão ao vivo',
    height: 720,
    image: video.thumbnailUrl ?? '/court-1.jpg',
    name: video.courtName ?? video.title,
    width: 1280,
    ...(typeof video.live.concurrentViewers === 'number'
      ? { viewers: video.live.concurrentViewers }
      : {}),
  }
}

const streamSubtitle = (video: YouTubeChannelVideo, name: string): string | undefined => {
  if (!video.title || video.title === name) {
    return undefined
  }

  return video.title
}

const LiveBroadcast = () => {
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
      <>
        <CourtPlayer court={featuredCourt} />
        <section className="grid border-b border-border sm:grid-cols-2">
          {courts.map((court, index) => (
            <CourtCard key={court.id} court={court} divided={index === 0} />
          ))}
        </section>
      </>
    )
  }

  const selected = liveVideos.find((video) => video.id === selectedVideoId) ?? liveVideos[0]
  const watching = selectedVideoId === selected.id
  const embeddable = canEmbedLiveVideo(selected)
  const court = toBroadcastCourt(selected)
  const others = liveVideos.filter((video) => video.id !== selected.id)

  return (
    <>
      <CourtPlayer
        court={court}
        externalWatchUrl={watching && !embeddable ? getYouTubeWatchUrl(selected.id) : undefined}
        playback={
          watching && embeddable ? (
            <YouTubeLivePlayer title={selected.title} videoId={selected.id} />
          ) : undefined
        }
        subtitle={streamSubtitle(selected, court.name)}
        onWatch={watching ? undefined : () => setSelectedVideoId(selected.id)}
      />
      {others.length > 0 ? (
        <section className="grid border-b border-border sm:grid-cols-2">
          {others.map((video, index) => {
            const cardCourt = toBroadcastCourt(video)

            return (
              <CourtCard
                key={video.id}
                court={cardCourt}
                divided={index % 2 === 0}
                subtitle={streamSubtitle(video, cardCourt.name)}
                onWatch={() => setSelectedVideoId(video.id)}
              />
            )
          })}
        </section>
      ) : null}
    </>
  )
}

export { LiveBroadcast }
