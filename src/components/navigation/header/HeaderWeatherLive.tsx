'use client'

import { useQuery } from '@tanstack/react-query'
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
import { type ClubWeather, fetchClubWeather } from '@/lib/weather/clubWeather'

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

interface HeaderWeatherLiveProps {
  initial: ClubWeather
}

export const HeaderWeatherLive = ({ initial }: HeaderWeatherLiveProps) => {
  const { data } = useQuery({
    initialData: initial,
    queryFn: async () => {
      const weather = await fetchClubWeather()

      if (!weather) {
        throw new Error('Could not load club weather.')
      }

      return weather
    },
    queryKey: ['club-weather'],
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  return (
    <Link
      aria-label={`Clima em ${data.place}, ${data.temperature} graus, ${data.label.toLowerCase()}`}
      className="flex items-center gap-2 rounded-md px-2 py-1 font-sans text-lg font-medium tabular-nums transition-colors hover:bg-brand hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      href={paths.clima}
    >
      <WeatherIcon className="size-6" isDay={data.isDay} kind={data.kind} aria-hidden />
      <span>{data.temperature}°</span>
    </Link>
  )
}
