import type { LucideProps } from 'lucide-react'
import Link from 'next/link'

import type { WeatherKind } from '@/clima/weather/types'
import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudRainIcon,
  CloudSunIcon,
  MoonIcon,
  SunIcon,
} from '@/components/shared/Icons'
import { paths } from '@/config/paths'
import { fetchClubWeather } from '@/lib/weather/clubWeather'

interface WeatherIconProps extends LucideProps {
  isDay: boolean
  kind: WeatherKind
}

const WeatherIcon = ({ isDay, kind, ...props }: WeatherIconProps) => {
  switch (kind) {
    case 'sunny':
    case 'clear':
      return isDay ? <SunIcon {...props} /> : <MoonIcon {...props} />
    case 'partly':
      return isDay ? <CloudSunIcon {...props} /> : <CloudMoonIcon {...props} />
    case 'cloudy':
      return <CloudIcon {...props} />
    case 'fog':
      return <CloudFogIcon {...props} />
    case 'rain':
    case 'heavyRain':
      return <CloudRainIcon {...props} />
    case 'storm':
      return <CloudLightningIcon {...props} />
  }
}

export const HeaderWeather = async () => {
  const weather = await fetchClubWeather()

  if (!weather) {
    return null
  }

  return (
    <Link
      aria-label={`Clima em ${weather.place}, ${weather.temperature} graus, ${weather.label.toLowerCase()}`}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-lg font-medium tabular-nums transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      href={paths.clima}
    >
      <WeatherIcon className="size-6" isDay={weather.isDay} kind={weather.kind} aria-hidden />
      <span>{weather.temperature}°</span>
    </Link>
  )
}
