import './icons.css'

import type { WeatherKind } from '@/clima/weather/types'

/**
 * Climinha's own weather icons: filled, two colors,
 * simple geometry. One system for the whole interface.
 */

const CLOUD = 'M7.2 19h10.3a4 4 0 0 0 .55-7.96A5.6 5.6 0 0 0 7.4 9.7 4.66 4.66 0 0 0 7.2 19Z'
const CLOUD_SMALL =
  'M8.2 16.5h8.4a3.2 3.2 0 0 0 .45-6.37 4.5 4.5 0 0 0-8.53-1.04A3.73 3.73 0 0 0 8.2 16.5Z'
const MOON = 'M15.5 3.6a7.6 7.6 0 1 0 5 12.4A8.2 8.2 0 0 1 15.5 3.6Z'

interface SunProps {
  cx?: number
  cy?: number
  r?: number
  rays?: boolean
}

const Sun = ({ cx = 12, cy = 12, r = 4.6, rays = true }: SunProps) => {
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
              className="wi-sun"
              strokeLinecap="round"
              strokeWidth="1.8"
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          )
        })}
      <circle className="wi-sun-fill" cx={cx} cy={cy} r={r} />
    </g>
  )
}

interface DropsProps {
  heavy?: boolean
}

const Drops = ({ heavy }: DropsProps) => {
  const xs = heavy ? [7.6, 11, 14.4, 17.8] : [8.6, 12.2, 15.8]
  return (
    <g>
      {xs.map((x, i) => (
        <line
          key={x}
          className="wi-rain"
          strokeLinecap="round"
          strokeWidth={heavy ? 1.9 : 1.6}
          x1={x}
          x2={x - 1.1}
          y1={i % 2 ? 21 : 20.6}
          y2={i % 2 ? 23.4 : 23}
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

export const WeatherIcon = ({
  kind,
  isDay = true,
  size = 26,
  className,
  title,
}: WeatherIconProps) => {
  const body = (() => {
    switch (kind) {
      case 'sunny':
      case 'clear':
        return isDay ? <Sun /> : <path className="wi-moon" d={MOON} transform="translate(-1.5 1)" />
      case 'partly':
        return (
          <>
            {isDay ? (
              <Sun cx={9} cy={8.6} r={3.7} />
            ) : (
              <path className="wi-moon" d={MOON} transform="translate(-4.2 -1.6) scale(0.82)" />
            )}
            <path className="wi-cloud" d={CLOUD} transform="translate(1.4 1.2) scale(0.9)" />
          </>
        )
      case 'cloudy':
        return (
          <>
            <path className="wi-cloud-back" d={CLOUD_SMALL} transform="translate(3.4 -3.2)" />
            <path className="wi-cloud" d={CLOUD} transform="translate(-0.6 0.6)" />
          </>
        )
      case 'fog':
        return (
          <>
            <path className="wi-cloud" d={CLOUD} transform="translate(0 -3.2)" />
            <line
              className="wi-fog"
              strokeLinecap="round"
              strokeWidth="1.7"
              x1="4.5"
              x2="19.5"
              y1="19.4"
              y2="19.4"
            />
            <line
              className="wi-fog"
              strokeLinecap="round"
              strokeWidth="1.7"
              x1="7"
              x2="17"
              y1="22.4"
              y2="22.4"
            />
          </>
        )
      case 'rain':
        return (
          <>
            <path className="wi-cloud" d={CLOUD} transform="translate(0 -3.6)" />
            <Drops />
          </>
        )
      case 'heavyRain':
        return (
          <>
            <path className="wi-cloud" d={CLOUD} transform="translate(0 -3.6)" />
            <Drops heavy />
          </>
        )
      case 'storm':
        return (
          <>
            <path className="wi-cloud" d={CLOUD} transform="translate(0 -3.6)" />
            <path className="wi-bolt" d="M12.6 15.4 9.7 19.6h2.6l-1.5 3.9 4.2-5.4h-2.7l1.6-2.7Z" />
          </>
        )
    }
  })()

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={['wi', className].filter(Boolean).join(' ')}
      height={size}
      role={title ? 'img' : undefined}
      viewBox="0 0 24 24"
      width={size}
    >
      {body}
    </svg>
  )
}

interface SunEventIconProps {
  type: 'sunrise' | 'sunset'
  size?: number
}

/** Sunrise / sunset for the hourly timeline. */
export const SunEventIcon = ({ type, size = 26 }: SunEventIconProps) => {
  return (
    <svg className="wi" height={size} viewBox="0 0 24 24" width={size} aria-hidden>
      <clipPath id={`clip-${type}`}>
        <rect height="17" width="24" x="0" y="0" />
      </clipPath>
      <g clipPath={`url(#clip-${type})`}>
        <Sun cx={12} cy={17} r={4.4} />
      </g>
      <line
        className="wi-fog"
        strokeLinecap="round"
        strokeWidth="1.6"
        x1="3"
        x2="21"
        y1="17.8"
        y2="17.8"
      />
      <path
        className="wi-fog"
        d={
          type === 'sunrise'
            ? 'M12 22.6v-2.6m-1.6 1.2L12 19.6l1.6 1.6'
            : 'M12 19.6v2.6m-1.6-1.2 1.6 1.6 1.6-1.6'
        }
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}
