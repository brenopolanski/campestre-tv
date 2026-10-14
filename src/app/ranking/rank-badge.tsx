import { cn } from 'cn'

const lobes = 14
const scallopPath = (() => {
  const center = 50
  const inner = 40
  const outer = 48
  const steps = lobes * 2
  const points = Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2 - Math.PI / 2
    const radius = index % 2 === 0 ? outer : inner
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
  })
  return `M${points.join('L')}Z`
})()

const medalTone = {
  1: { badge: 'text-amber-400', ink: 'text-amber-950' },
  2: { badge: 'text-zinc-300', ink: 'text-zinc-900' },
  3: { badge: 'text-orange-400', ink: 'text-orange-950' },
} as const

const defaultTone = { badge: 'text-zinc-100', ink: 'text-zinc-900' }

interface RankBadgeProps {
  position: number
  size?: 'md' | 'lg'
}

export const RankBadge = ({ position, size = 'md' }: RankBadgeProps) => {
  const tone = medalTone[position as keyof typeof medalTone] ?? defaultTone

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        size === 'lg' ? 'size-11' : 'size-9',
      )}
    >
      <svg
        className={cn('absolute inset-0 size-full', tone.badge)}
        viewBox="0 0 100 100"
        aria-hidden
      >
        <path d={scallopPath} fill="currentColor" />
      </svg>
      <span
        className={cn(
          'relative font-bold tabular-nums',
          tone.ink,
          size === 'lg' ? 'text-sm' : 'text-xs',
        )}
      >
        {position}
      </span>
    </span>
  )
}
