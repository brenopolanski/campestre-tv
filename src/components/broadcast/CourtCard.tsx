import { siteConfig } from '@/config/site'
import type { BroadcastCourt } from '@/lib/courts'
import { cn } from '@/lib/utils'

import { CourtImage } from './CourtImage'
import { LiveBadge, Viewers } from './LiveStatus'
import { ShareButton } from './ShareButton'

interface CourtCardProps {
  court: BroadcastCourt
  active?: boolean
  onWatch?: () => void
}

const readCourtNumber = (name: string) => {
  const digits = name.match(/\d+/)?.[0]

  return digits ? Number(digits) : undefined
}

export const CourtCard = ({ court, active = false, onWatch }: CourtCardProps) => {
  return (
    <li className="group w-[66%] shrink-0 snap-start rounded-lg bg-surface p-4 md:w-[21cqw]">
      <div className="grid gap-4">
        <button className="text-left" type="button" onClick={onWatch}>
          <div
            className={cn(
              'relative overflow-hidden rounded-lg outline-4 outline-transparent transition-[outline-color] duration-300 group-hover:outline-brand',
              active && 'outline-brand',
            )}
          >
            <CourtImage
              alt={court.alt}
              className="aspect-video w-full object-cover"
              height={court.height}
              loading="eager"
              sizes="(min-width: 1280px) 14.8rem, (min-width: 768px) calc(21vw - 2rem), calc(66vw - 3.32rem)"
              src={court.image}
              width={court.width}
            />
            {court.live && <LiveBadge />}
          </div>
        </button>
        <div className="flex items-start justify-between gap-4">
          <button className="grid gap-2 text-left" type="button" onClick={onWatch}>
            <h2
              className={cn(
                'text-base font-bold uppercase transition-colors duration-300 group-hover:text-brand',
                active ? 'text-brand' : 'text-ink',
              )}
            >
              {court.name}
            </h2>
            {court.live && typeof court.viewers === 'number' && <Viewers count={court.viewers} />}
          </button>
          <ShareButton
            aria-label={`Compartilhar ${court.name}`}
            live={readCourtNumber(court.name)}
            size="sm"
            title={`${court.name} - ${siteConfig.name}`}
          />
        </div>
      </div>
    </li>
  )
}
