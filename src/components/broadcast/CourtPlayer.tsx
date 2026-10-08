'use client'

import { Play, Share2 } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import type { BroadcastCourt } from '@/lib/courts'

interface CourtPlayerProps {
  court: BroadcastCourt
  externalWatchUrl?: string
  playback?: ReactNode
  onWatch?: () => void
}

const copyPageUrl = () => {
  const write = navigator.clipboard?.writeText(window.location.href)

  void write?.catch(() => {})
}

const CourtPlayer = ({ court, externalWatchUrl, playback, onWatch }: CourtPlayerProps) => {
  return (
    <section className="w-full p-4 md:p-[1.4rem]">
      <div className="rounded-[0.25rem] bg-surface p-4 pb-0 md:p-[1.4rem] md:pb-0">
        <figure className="relative overflow-hidden rounded-[0.25rem]">
          {playback ?? (
            <>
              <Image
                alt={court.alt}
                className="aspect-video h-auto w-full object-cover"
                height={court.height}
                sizes="(min-width: 768px) 70vw, 100vw"
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
                  <span className="bg-canvas px-4 py-3 text-sm text-ink">
                    Assistir no YouTube
                    <span className="sr-only"> (abre em uma nova aba)</span>
                  </span>
                </a>
              ) : null}
              {onWatch ? (
                <button
                  aria-label={`Assistir ${court.name} ao vivo`}
                  className="absolute inset-0 flex items-center justify-center"
                  type="button"
                  onClick={onWatch}
                >
                  <Play className="size-10 fill-white text-white" />
                </button>
              ) : null}
            </>
          )}
        </figure>
        <div className="flex items-center justify-between">
          <h1 className="py-4 text-[1.25rem] font-bold text-brand uppercase">{court.name}</h1>
          <button
            aria-label="Compartilhar"
            className="flex size-10 items-center justify-center rounded-[0.25rem] bg-canvas text-ink transition-colors hover:bg-brand hover:text-brand-ink"
            type="button"
            onClick={copyPageUrl}
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

export { CourtPlayer }
