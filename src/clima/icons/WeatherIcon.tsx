import type { WeatherKind } from '../weather/types'
import './icons.css'

/**
 * Climinha's own weather icons: filled, two colors,
 * simple geometry. One system for the whole interface.
 */

const CLOUD = 'M7.2 19h10.3a4 4 0 0 0 .55-7.96A5.6 5.6 0 0 0 7.4 9.7 4.66 4.66 0 0 0 7.2 19Z'
const CLOUD_SMALL =
  'M8.2 16.5h8.4a3.2 3.2 0 0 0 .45-6.37 4.5 4.5 0 0 0-8.53-1.04A3.73 3.73 0 0 0 8.2 16.5Z'
const MOON = 'M15.5 3.6a7.6 7.6 0 1 0 5 12.4A8.2 8.2 0 0 1 15.5 3.6Z'

function Sun({
  cx = 12,
  cy = 12,
  r = 4.6,
  rays = true,
}: {
  cx?: number
  cy?: number
  r?: number
  rays?: boolean
}) {
  const len = r * 0.55
  const gap = r + 2
  return (
    <g>
      {rays &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          const x1 = cx + Math.cos(a) * gap
          const y1 = cy + Math.sin(a) * gap
          const x2 = cx + Math.cos(a) * (gap + len)
          const y2 = cy + Math.sin(a) * (gap + len)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="wi-sun"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )
        })}
      <circle cx={cx} cy={cy} r={r} className="wi-sun-fill" />
    </g>
  )
}

function Drops({ heavy }: { heavy?: boolean }) {
  const xs = heavy ? [7.6, 11, 14.4, 17.8] : [8.6, 12.2, 15.8]
  return (
    <g>
      {xs.map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={i % 2 ? 21 : 20.6}
          x2={x - 1.1}
          y2={i % 2 ? 23.4 : 23}
          className="wi-rain"
          strokeWidth={heavy ? 1.9 : 1.6}
          strokeLinecap="round"
        />
      ))}
    </g>
  )
}

export interface WeatherIconProps {
  kind: WeatherKind
  isDay?: boolean
  size?: number
  className?: string
  title?: string
}

export function WeatherIcon({ kind, isDay = true, size = 26, className, title }: WeatherIconProps) {
  const body = (() => {
    switch (kind) {
      case 'sunny':
      case 'clear':
        return isDay ? <Sun /> : <path d={MOON} className="wi-moon" transform="translate(-1.5 1)" />
      case 'partly':
        return (
          <>
            {isDay ? (
              <Sun cx={9} cy={8.6} r={3.7} />
            ) : (
              <path d={MOON} className="wi-moon" transform="translate(-4.2 -1.6) scale(0.82)" />
            )}
            <path d={CLOUD} className="wi-cloud" transform="translate(1.4 1.2) scale(0.9)" />
          </>
        )
      case 'cloudy':
        return (
          <>
            <path d={CLOUD_SMALL} className="wi-cloud-back" transform="translate(3.4 -3.2)" />
            <path d={CLOUD} className="wi-cloud" transform="translate(-0.6 0.6)" />
          </>
        )
      case 'fog':
        return (
          <>
            <path d={CLOUD} className="wi-cloud" transform="translate(0 -3.2)" />
            <line
              x1="4.5"
              y1="19.4"
              x2="19.5"
              y2="19.4"
              className="wi-fog"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <line
              x1="7"
              y1="22.4"
              x2="17"
              y2="22.4"
              className="wi-fog"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </>
        )
      case 'rain':
        return (
          <>
            <path d={CLOUD} className="wi-cloud" transform="translate(0 -3.6)" />
            <Drops />
          </>
        )
      case 'heavyRain':
        return (
          <>
            <path d={CLOUD} className="wi-cloud" transform="translate(0 -3.6)" />
            <Drops heavy />
          </>
        )
      case 'storm':
        return (
          <>
            <path d={CLOUD} className="wi-cloud" transform="translate(0 -3.6)" />
            <path d="M12.6 15.4 9.7 19.6h2.6l-1.5 3.9 4.2-5.4h-2.7l1.6-2.7Z" className="wi-bolt" />
          </>
        )
    }
  })()

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={['wi', className].filter(Boolean).join(' ')}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {body}
    </svg>
  )
}

/** Sunrise / sunset for the hourly timeline. */
export function SunEventIcon({ type, size = 26 }: { type: 'sunrise' | 'sunset'; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="wi" aria-hidden="true">
      <clipPath id={`clip-${type}`}>
        <rect x="0" y="0" width="24" height="17" />
      </clipPath>
      <g clipPath={`url(#clip-${type})`}>
        <Sun cx={12} cy={17} r={4.4} />
      </g>
      <line
        x1="3"
        y1="17.8"
        x2="21"
        y2="17.8"
        className="wi-fog"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d={
          type === 'sunrise'
            ? 'M12 22.6v-2.6m-1.6 1.2L12 19.6l1.6 1.6'
            : 'M12 19.6v2.6m-1.6-1.2 1.6 1.6 1.6-1.6'
        }
        className="wi-fog"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
