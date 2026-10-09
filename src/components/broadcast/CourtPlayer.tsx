'use client'

import Image from 'next/image'

import { PlayIcon } from '@/components/shared/Icons'
import { siteConfig } from '@/config/site'
import type { BroadcastCourt } from '@/lib/courts'

import { LiveStatus } from './LiveStatus'
import { ShareButton } from './ShareButton'

interface CourtPlayerProps {
  court: BroadcastCourt
  externalWatchUrl?: string
  playback?: React.ReactNode
  onWatch?: () => void
}

export const CourtPlayer = ({ court, externalWatchUrl, playback, onWatch }: CourtPlayerProps) => {
  return (
    <section className="w-full p-4 md:p-[1.4rem]">
      <div className="rounded-lg bg-surface p-4 pb-0 md:p-[1.4rem] md:pb-0">
        <figure className="relative overflow-hidden rounded-lg">
          {playback ?? (
            <>
              <Image
                alt={court.alt}
                className="aspect-video h-auto w-full object-cover"
                height={court.height}
                loading="eager"
                sizes="(min-width: 768px) 70vw, 100vw"
                src={court.image}
                width={court.width}
              />
              {externalWatchUrl && (
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
              )}
              {onWatch && (
                <button
                  aria-label={`Assistir ${court.name} ao vivo`}
                  className="absolute inset-0 flex items-center justify-center"
                  type="button"
                  onClick={onWatch}
                >
                  <PlayIcon className="size-10 fill-white text-white" />
                </button>
              )}
            </>
          )}
        </figure>
        <div className="flex items-start justify-between gap-4 py-4">
          <div className="grid gap-2">
            <h1 className="text-[1.25rem] font-bold text-brand uppercase">{court.name}</h1>
            <LiveStatus live={court.live} viewers={court.viewers} onDark />
          </div>
          <ShareButton title={`${court.name} - ${siteConfig.name}`} />
        </div>
      </div>
    </section>
  )
}
