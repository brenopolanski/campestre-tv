import Image from 'next/image'

import type { BroadcastCourt } from '@/lib/courts'
import { cn } from '@/lib/utils'

interface CourtCardProps {
  court: BroadcastCourt
  active?: boolean
  onWatch?: () => void
}

const CourtCard = ({ court, active = false, onWatch }: CourtCardProps) => {
  return (
    <li className="w-[66%] shrink-0 snap-start rounded-[0.25rem] bg-surface p-4 md:w-[21vw]">
      <button
        aria-label={court.name}
        className="group grid w-full gap-4 text-left"
        type="button"
        onClick={onWatch}
      >
        <Image
          alt=""
          className={cn(
            'aspect-video w-full rounded-[0.25rem] object-cover outline-4 outline-transparent transition-[outline-color] duration-300 group-hover:outline-brand',
            active && 'outline-brand',
          )}
          height={court.height}
          sizes="(min-width: 768px) 21vw, 66vw"
          src={court.image}
          width={court.width}
        />
        <h2
          className={cn(
            'text-base font-bold uppercase transition-colors duration-300 group-hover:text-brand',
            active ? 'text-brand' : 'text-ink',
          )}
        >
          {court.name}
        </h2>
      </button>
    </li>
  )
}

export { CourtCard }
