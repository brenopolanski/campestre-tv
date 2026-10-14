import { cn } from 'cn'

import type { Athlete } from './columns'
import { athleteInitials, formatPoints } from './format'

const places = [2, 1, 3] as const

const placeStyle = {
  1: {
    bar: 'h-24 bg-amber-400',
    initials: 'size-16 bg-amber-400 text-lg text-amber-950',
  },
  2: {
    bar: 'h-16 bg-zinc-300',
    initials: 'size-14 bg-zinc-300 text-base text-zinc-900',
  },
  3: {
    bar: 'h-12 bg-orange-400',
    initials: 'size-14 bg-orange-400 text-base text-orange-950',
  },
} as const

interface PodiumProps {
  athletes: Athlete[]
}

export const Podium = ({ athletes }: PodiumProps) => {
  const byPosition = new Map(athletes.map((athlete) => [athlete.position, athlete]))
  const ranked = places.flatMap((position) => {
    const athlete = byPosition.get(position)
    return athlete ? [athlete] : []
  })

  if (ranked.length === 0) {
    return null
  }

  return (
    <ol aria-label="Pódio" className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {ranked.map((athlete) => {
        const style = placeStyle[athlete.position as keyof typeof placeStyle]
        return (
          <li key={athlete.position} className="flex min-w-0 flex-col items-center">
            <span
              className={cn(
                'flex items-center justify-center rounded-full font-semibold',
                style.initials,
              )}
            >
              {athleteInitials(athlete.name)}
            </span>
            <p className="mt-3 line-clamp-2 w-full text-center text-sm font-medium">
              {athlete.name}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-300 tabular-nums">
              {formatPoints(athlete.points)}
            </p>
            <div className={cn('mt-4 w-full rounded-t-xl', style.bar)} />
          </li>
        )
      })}
    </ol>
  )
}
