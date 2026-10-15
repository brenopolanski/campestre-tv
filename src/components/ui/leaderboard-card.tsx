"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from "@/components/ui/leaderboard-podium"
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from "@/components/ui/leaderboard-rankings"

interface LeaderboardRunOption {
  id: string
  label: string
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  fromDate?: string | Date
  toDate?: string | Date
  podiumRankings: LeaderboardPodiumRanking[]
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  showAvatar?: boolean
  medalStyle?: "classic" | "modern" | "minimal"
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title,
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      showAvatar = false,
      medalStyle = "minimal",
      runOptions,
      selectedRunId,
      onRunChange,
      ...props
    },
    ref
  ) => {
    const fromLabel = fromDate ? formatRangeDate(fromDate) : ""
    const toLabel = toDate ? formatRangeDate(toDate) : ""
    const dateLabel =
      fromLabel && toLabel ? `${fromLabel} - ${toLabel}` : fromLabel || toLabel
    const hasRunOptions = Boolean(runOptions && runOptions.length > 0)
    const hasHeader = Boolean(title) || Boolean(dateLabel) || hasRunOptions
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ""
    const hasOnRunChange = Boolean(onRunChange)
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId)

    React.useEffect(() => {
      if (hasOnRunChange) return
      setLocalRunId(resolvedRunId)
    }, [hasOnRunChange, resolvedRunId])

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId

    return (
      <div
        ref={ref}
        className={cn("p-6 rounded-2xl border shadow-sm bg-surface", className)}
        {...props}
      >
        {hasHeader ? (
          <div className="flex gap-4 justify-between items-start mb-6">
            {title || dateLabel ? (
              <div className="space-y-1">
                {title ? <h3 className="text-xl font-semibold">{title}</h3> : null}
                {dateLabel ? (
                  <p className="text-sm text-muted-foreground">{dateLabel}</p>
                ) : null}
              </div>
            ) : null}

            {hasRunOptions ? (
              <select
                aria-label="Select leaderboard run"
                value={activeRunId}
                onChange={(e) => {
                  if (onRunChange) {
                    onRunChange(e.target.value)
                    return
                  }
                  setLocalRunId(e.target.value)
                }}
                className="bg-background text-foreground rounded-md border px-3 py-1.5 text-sm"
              >
                {runOptions?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}

        <LeaderboardPodium
          className="mb-6"
          medalStyle={medalStyle}
          rankings={podiumRankings}
          showAvatar={showAvatar}
        />

        <LeaderboardRankings
          currentUserId={currentUserId}
          rankings={rankings}
        />
      </div>
    )
  }
)

LeaderboardCard.displayName = "LeaderboardCard"

export { LeaderboardCard }
export type { LeaderboardCardProps, LeaderboardRunOption }
