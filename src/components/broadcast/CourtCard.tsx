import Image from 'next/image'

import { siteConfig } from '@/config/site'
import type { BroadcastCourt } from '@/lib/courts'
import { cn } from '@/lib/utils'

import { LiveStatus } from './LiveStatus'
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
    <li className="relative w-[66%] shrink-0 snap-start rounded-lg bg-surface p-4 md:w-[21cqw]">
      <button className="group grid w-full gap-4 text-left" type="button" onClick={onWatch}>
        <Image
          alt={court.alt}
          className={cn(
            'aspect-video w-full rounded-lg object-cover outline-4 outline-transparent transition-[outline-color] duration-300 group-hover:outline-brand',
            active && 'outline-brand',
          )}
          height={court.height}
          loading="eager"
          sizes="(min-width: 1280px) 14.8rem, (min-width: 768px) calc(21vw - 2rem), calc(66vw - 3.32rem)"
          src={court.image}
          width={court.width}
        />
        <div className="grid gap-2 pr-12">
          <h2
            className={cn(
              'text-base font-bold uppercase transition-colors duration-300 group-hover:text-brand',
              active ? 'text-brand' : 'text-ink',
            )}
          >
            {court.name}
          </h2>
          <LiveStatus live={court.live} viewers={court.viewers} onDark />
        </div>
      </button>
      <div className="absolute right-4 bottom-4">
        <ShareButton
          aria-label={`Compartilhar ${court.name}`}
          live={readCourtNumber(court.name)}
          size="sm"
          title={`${court.name} - ${siteConfig.name}`}
        />
      </div>
    </li>
  )
}
