'use client'

import { useEffect, useRef, useState } from 'react'
import YouTube from 'react-youtube'

import { getYouTubeWatchUrl } from '@/lib/youtube/playback'

interface YouTubeLivePlayerProps {
  title?: string
  videoId: string
}

const playerTitle = (title: string | undefined): string => {
  const trimmed = title?.trim()

  if (!trimmed) {
    return 'Transmissão ao vivo do Campestre TV'
  }

  return trimmed
}

export const YouTubeLivePlayer = ({ title, videoId }: YouTubeLivePlayerProps) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const watchUrl = getYouTubeWatchUrl(videoId)
  const accessibleTitle = playerTitle(title)

  useEffect(() => {
    frameRef.current?.focus()
  }, [])

  if (failed) {
    return (
      <div className="flex aspect-video w-full max-w-full items-center justify-center bg-foreground/5 px-6 text-center">
        <p className="max-w-md text-sm text-foreground">
          Não foi possível reproduzir esta transmissão.{' '}
          <a
            className="underline underline-offset-4"
            href={watchUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Assista no YouTube
            <span className="sr-only"> (abre em uma nova aba)</span>
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div
      ref={frameRef}
      aria-busy={!ready}
      aria-label={accessibleTitle}
      className="relative aspect-video w-full max-w-full overflow-hidden bg-foreground/5"
      tabIndex={-1}
    >
      {ready ? null : (
        <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">
          Carregando transmissão…
        </p>
      )}
      <YouTube
        className="absolute inset-0 size-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:size-full"
        iframeClassName="size-full"
        opts={{
          height: '100%',
          playerVars: {
            autoplay: 0,
            fs: 1,
            playsinline: 1,
            rel: 0,
          },
          width: '100%',
        }}
        title={accessibleTitle}
        videoId={videoId}
        onError={() => setFailed(true)}
        onReady={() => setReady(true)}
      />
    </div>
  )
}
