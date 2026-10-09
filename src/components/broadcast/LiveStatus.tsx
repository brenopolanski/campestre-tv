import { UserIcon } from '@/components/shared/Icons'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface LiveBadgeProps {
  onDark?: boolean
}

export const LiveBadge = ({ onDark = false }: LiveBadgeProps) => {
  return (
    <span
      className={cn(
        'flex items-center gap-2 label-caps',
        onDark ? 'text-primary-foreground' : 'text-live',
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      Ao vivo
    </span>
  )
}

interface ViewersProps {
  count: number
}

export const Viewers = ({ count }: ViewersProps) => {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
      <UserIcon aria-hidden="true" className="size-4" />
      {count}
    </span>
  )
}

interface LiveStatusProps {
  onDark?: boolean
  viewers?: number
}

export const LiveStatus = ({ onDark = false, viewers }: LiveStatusProps) => {
  return (
    <div className="flex items-center gap-5">
      <LiveBadge onDark={onDark} />
      {typeof viewers === 'number' && (
        <>
          <Separator className="h-5" orientation="vertical" />
          <Viewers count={viewers} />
        </>
      )}
    </div>
  )
}
