import { RadioIcon, UserIcon } from '@/components/shared/Icons'

export const LiveBadge = () => {
  return (
    <span className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1 rounded-sm bg-live px-1.5 py-0.5 text-xs font-semibold text-white uppercase">
      <RadioIcon className="size-3.5" aria-hidden />
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
      <UserIcon className="size-4" aria-hidden />
      {count}
    </span>
  )
}
