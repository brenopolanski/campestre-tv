'use client'

import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useState } from 'react'

import { LiveBadge, LiveStatus } from '@/components/broadcast/LiveStatus'
import { Button } from '@/components/ui/button'
import type { BroadcastCourt } from '@/lib/courts'

interface CourtPlayerProps {
  court: BroadcastCourt
  externalWatchUrl?: string
  playback?: ReactNode
  subtitle?: string
  onWatch?: () => void
}

const controlClassName =
  'size-auto rounded-none p-0 text-primary-foreground/90 hover:bg-transparent hover:text-primary-foreground/90 hover:opacity-70'

const CourtPlayer = ({
  court,
  externalWatchUrl,
  playback,
  subtitle,
  onWatch,
}: CourtPlayerProps) => {
  const [muted, setMuted] = useState(false)
  const [playing, setPlaying] = useState(true)
  const showTransport = !playback && !externalWatchUrl && !onWatch

  return (
    <section className="border-b border-border px-8 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium tracking-[0.18em] uppercase">{court.name}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <LiveStatus viewers={court.viewers} />
      </div>

      <figure className="relative overflow-hidden bg-foreground/5">
        {playback ?? (
          <>
            <Image
              alt={court.alt}
              className="aspect-video h-auto w-full object-cover"
              height={court.height}
              sizes="100vw"
              src={court.image}
              width={court.width}
              priority
            />
            {externalWatchUrl ? (
              <a
                className="absolute inset-0 flex items-center justify-center bg-black/25 focus-visible:outline-2 focus-visible:outline-offset-2"
                href={externalWatchUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="bg-background px-4 py-3 text-sm text-foreground">
                  Assistir no YouTube
                  <span className="sr-only"> (abre em uma nova aba)</span>
                </span>
              </a>
            ) : (
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-5 bg-gradient-to-t from-black/70 to-transparent px-5 pt-14 pb-5">
                <Button
                  aria-label={
                    onWatch ? `Assistir ${court.name} ao vivo` : playing ? 'Pausar' : 'Reproduzir'
                  }
                  className={controlClassName}
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (onWatch) {
                      onWatch()
                      return
                    }

                    setPlaying((value) => !value)
                  }}
                >
                  {!onWatch && playing ? <Pause className="size-5" /> : <Play className="size-5" />}
                </Button>
                <LiveBadge onDark />
                <span className="h-[3px] flex-1 bg-primary-foreground/70" />
                {showTransport ? (
                  <>
                    <Button
                      aria-label={muted ? 'Ativar som' : 'Desativar som'}
                      className={controlClassName}
                      size="icon"
                      variant="ghost"
                      onClick={() => setMuted((value) => !value)}
                    >
                      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                    </Button>
                    <Button
                      aria-label="Tela cheia"
                      className={controlClassName}
                      size="icon"
                      variant="ghost"
                    >
                      <Maximize2 className="size-5" />
                    </Button>
                  </>
                ) : null}
              </figcaption>
            )}
          </>
        )}
      </figure>
    </section>
  )
}

export { CourtPlayer }
