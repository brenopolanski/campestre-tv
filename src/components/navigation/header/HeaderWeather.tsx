import { fetchClubWeather } from '@/lib/weather/clubWeather'

import { HeaderWeatherLive } from './HeaderWeatherLive'

export const HeaderWeather = async () => {
  const weather = await fetchClubWeather()

  if (!weather) {
    return null
  }

  return <HeaderWeatherLive initial={weather} />
}
