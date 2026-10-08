import { Play } from 'lucide-react'
import Image from 'next/image'

import { LiveStatus } from '@/components/broadcast/LiveStatus'
import { Button } from '@/components/ui/button'
import type { BroadcastCourt } from '@/lib/courts'
import { cn } from '@/lib/utils'

interface CourtCardProps {
  court: BroadcastCourt
  divided?: boolean
  subtitle?: string
  onWatch?: () => void
}

const CourtCard = ({ court, divided = false, subtitle, onWatch }: CourtCardProps) => {
  return (
    <article
      className={cn('px-8 py-10', divided && 'border-b border-border sm:border-r sm:border-b-0')}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium tracking-[0.18em] uppercase">{court.name}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <LiveStatus viewers={court.viewers} />
      </div>
      <Button
        aria-label={`Assistir ${court.name} ao vivo`}
        className="group relative block h-auto w-full overflow-hidden rounded-none p-0 hover:bg-transparent"
        variant="ghost"
        onClick={onWatch}
      >
        <Image
          alt={court.alt}
          className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          height={court.height}
          sizes="(min-width: 640px) 50vw, 100vw"
          src={court.image}
          width={court.width}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="flex size-14 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-colors group-hover:bg-black/65">
            <Play className="ml-1 size-5 fill-primary-foreground text-primary-foreground" />
          </span>
        </span>
      </Button>
    </article>
  )
}

export { CourtCard }
