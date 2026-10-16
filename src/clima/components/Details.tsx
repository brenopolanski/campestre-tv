import { motion, useReducedMotion } from 'motion/react'

import { motionTokens } from '@/clima/theme/motion'
import { compassLabel, uvCategory } from '@/clima/weather/conditions'
import { clockLabel, minutesOf } from '@/clima/weather/format'
import type { TemperatureUnit } from '@/clima/weather/store'
import { toUnit } from '@/clima/weather/store'
import type { Forecast } from '@/clima/weather/types'

import { Card } from './primitives'

interface DetailGridProps {
  forecast: Forecast
  unit: TemperatureUnit
  order: number
}

export type DetailId = 'uv' | 'feels' | 'wind' | 'humidity' | 'precip' | 'sun'

/**
 * The detail cards (UV, feels-like, wind, humidity, precipitation, sun) as loose pieces:
 * on a phone they become a grid that appears on scroll; on a computer they orbit Climinha.
 */
export function detailCards({
  forecast,
  unit,
  order,
  reveal,
}: DetailGridProps & { reveal: boolean }): Record<DetailId, React.ReactNode> {
  const c = forecast.current
  const today = forecast.daily[0]
  const tomorrow = forecast.daily[1]

  const uv = forecast.current.isDay ? c.uv : 0
  const uvShown = Math.round(uv)
  const uvInfo = uvCategory(uv)
  const uvPeak = uvCategory(today?.uvMax ?? 0)

  const feelsDiff = c.apparent - c.temperature
  const feelsText =
    Math.abs(feelsDiff) <= 1.5
      ? 'Igual à temperatura real.'
      : feelsDiff > 0
        ? 'Parece mais quente.'
        : 'Parece mais frio.'

  return {
    uv: (
      <Card key="uv" title="Índice UV" icon="sun" order={order} reveal={reveal} lag={0}>
        <p className="detail__value">{uvShown}</p>
        <p className="detail__label">{uvInfo.label}</p>
        <UvScale value={uv} />
        <p className="detail__note">
          {forecast.current.isDay ? uvInfo.advice : `Pico amanhã: ${uvPeak.label.toLowerCase()}.`}
        </p>
      </Card>
    ),
    feels: (
      <Card
        key="feels"
        title="Sensação"
        icon="thermometer"
        order={order + 1}
        reveal={reveal}
        lag={0.5}
      >
        <p className="detail__value">{toUnit(c.apparent, unit)}°</p>
        <p className="detail__spacer" />
        <p className="detail__note">{feelsText}</p>
      </Card>
    ),
    wind: (
      <Card
        key="wind"
        title="Vento"
        icon="wind"
        order={order + 2}
        className="card--wind"
        reveal={reveal}
        lag={1}
      >
        <div className="wind">
          <div className="wind__stats">
            <p className="detail__value">
              {Math.round(c.windSpeed)}
              <span className="detail__unit">km/h</span>
            </p>
            <p className="detail__label">Vento {compassLabel(c.windDirection)}</p>
            <p className="detail__note">Rajadas de {Math.round(c.windGusts)} km/h.</p>
          </div>
          <Compass direction={c.windDirection} />
        </div>
      </Card>
    ),
    humidity: (
      <Card key="humidity" title="Umidade" icon="drop" order={order + 3} reveal={reveal} lag={0}>
        <p className="detail__value">{Math.round(c.humidity)}%</p>
        <p className="detail__spacer" />
        <p className="detail__note">Orvalho a {toUnit(c.dewPoint, unit)}°.</p>
      </Card>
    ),
    precip: (
      <Card
        key="precip"
        title="Precipitação"
        icon="umbrella"
        order={order + 4}
        reveal={reveal}
        lag={0.5}
      >
        <p className="detail__value">
          {formatMm(today?.precipSum ?? 0)}
          <span className="detail__unit">mm</span>
        </p>
        <p className="detail__label">Hoje</p>
        <p className="detail__spacer" />
        <p className="detail__note">
          {tomorrow && tomorrow.precipSum >= 0.5
            ? `Amanhã: ${formatMm(tomorrow.precipSum)} mm.`
            : 'Amanhã: sem chuva.'}
        </p>
      </Card>
    ),
    sun: today ? <SunCard key="sun" forecast={forecast} order={order + 5} reveal={reveal} /> : null,
  }
}

/** Phone: a detail grid that appears as you scroll. */
export const DetailGrid = ({ forecast, unit, order }: DetailGridProps) => {
  const cards = detailCards({ forecast, unit, order, reveal: true })
  return (
    <div className="details">
      {cards.uv}
      {cards.feels}
      {cards.wind}
      {cards.humidity}
      {cards.precip}
      {cards.sun}
    </div>
  )
}

function formatMm(v: number) {
  return v < 10 ? v.toFixed(1).replace('.', ',').replace(',0', '') : String(Math.round(v))
}

interface UvScaleProps {
  value: number
}

const UvScale = ({ value }: UvScaleProps) => {
  const pos = Math.min(100, (value / 11) * 100)
  return (
    <span className="uv-scale" aria-hidden="true">
      <span className="uv-scale__dot" style={{ left: `${pos}%` }} />
    </span>
  )
}

interface CompassProps {
  direction: number
}

const Compass = ({ direction }: CompassProps) => {
  const reduced = useReducedMotion()
  // meteorological direction = where it comes from; the arrow points where it goes
  const to = (direction + 180) % 360
  return (
    <svg
      viewBox="0 0 100 100"
      className="compass"
      role="img"
      aria-label={`Vento vindo de ${compassLabel(direction)}`}
    >
      <circle cx="50" cy="50" r="40" className="compass__ring" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 * Math.PI) / 180
        const major = i % 9 === 0
        const r1 = major ? 33 : 36
        return (
          <line
            key={i}
            x1={50 + Math.sin(a) * r1}
            y1={50 - Math.cos(a) * r1}
            x2={50 + Math.sin(a) * 40}
            y2={50 - Math.cos(a) * 40}
            className={major ? 'compass__tick compass__tick--major' : 'compass__tick'}
          />
        )
      })}
      <text x="50" y="22" className="compass__label">
        N
      </text>
      <text x="80" y="53.5" className="compass__label">
        L
      </text>
      <text x="50" y="85" className="compass__label">
        S
      </text>
      <text x="20" y="53.5" className="compass__label">
        O
      </text>
      <motion.g
        initial={reduced ? false : { rotate: to - 40 }}
        animate={{ rotate: to }}
        transition={{ ...motionTokens.system.default, delay: 0.8 }}
      >
        <line x1="50" y1="70" x2="50" y2="32" className="compass__needle" />
        <path d="M50 26 L55 36 L45 36 Z" className="compass__head" />
        <circle cx="50" cy="72" r="3.2" className="compass__tail" />
      </motion.g>
    </svg>
  )
}

interface SunCardProps {
  forecast: Forecast
  order: number
  reveal: boolean
}

const SunCard = ({ forecast, order, reveal }: SunCardProps) => {
  const today = forecast.daily[0]
  const tomorrow = forecast.daily[1]
  const now = minutesOf(forecast.current.time)
  const rise = minutesOf(today.sunrise)
  const set = minutesOf(today.sunset)
  const beforeSunset = now < set
  const afterSunrise = now >= rise
  const title = beforeSunset ? (afterSunrise ? 'Pôr do sol' : 'Nascer do sol') : 'Nascer do sol'
  const main = beforeSunset
    ? afterSunrise
      ? today.sunset
      : today.sunrise
    : (tomorrow?.sunrise ?? today.sunrise)
  const secondary =
    beforeSunset && afterSunrise
      ? `Nascer: ${clockLabel(today.sunrise)}`
      : `Pôr do sol: ${clockLabel(today.sunset)}`

  // sun position along the arc (0 = rise, 1 = set); outside the day it sits below the horizon
  const t = (now - rise) / Math.max(1, set - rise)
  const progress = Math.min(1.08, Math.max(-0.08, t))

  return (
    <Card title={title} icon="sunrise" order={order} className="card--sun" reveal={reveal} lag={1}>
      <div className="sun">
        <div className="sun__stats">
          <p className="detail__value">{clockLabel(main)}</p>
          <p className="detail__note">{secondary}</p>
        </div>
        <SunArc progress={progress} />
      </div>
    </Card>
  )
}

interface SunArcProps {
  progress: number
}

const SunArc = ({ progress }: SunArcProps) => {
  // a sine wave of one day: horizon at y=34
  const w = 140
  const h = 52
  const horizon = 34
  const amp = 26
  const pts: string[] = []
  for (let i = 0; i <= 48; i++) {
    const x = (i / 48) * w
    const p = (i / 48) * 1.4 - 0.2
    const y = horizon - Math.sin(p * Math.PI) * amp
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const sx = ((progress + 0.2) / 1.4) * w
  const sy = horizon - Math.sin(progress * Math.PI) * amp
  const up = progress > 0 && progress < 1
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sun-arc" aria-hidden="true">
      <polyline points={pts.join(' ')} className="sun-arc__path" />
      <line x1="0" y1={horizon} x2={w} y2={horizon} className="sun-arc__horizon" />
      <circle
        cx={sx}
        cy={sy}
        r="5"
        className={up ? 'sun-arc__sun' : 'sun-arc__sun sun-arc__sun--down'}
      />
    </svg>
  )
}
