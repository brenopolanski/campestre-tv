import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { SunEventIcon, WeatherIcon } from '../icons/WeatherIcon'
import { motionTokens } from '../theme/motion'
import { isWet } from '../weather/conditions'
import { clockLabel, dayLabel, hourLabel, hourlySummary } from '../weather/format'
import { toUnit } from '../weather/store'
import type { TemperatureUnit } from '../weather/store'
import type { PrecipitationOutlook } from '../weather/outlook'
import type { Forecast } from '../weather/types'
import { RAIN_THRESHOLD } from '../weather/outlook'
import { Card } from './primitives'

/* ------------------------------------------------------------------ */
/* Hourly                                                              */
/* ------------------------------------------------------------------ */

type HourlyItem =
  | {
      type: 'hour'
      key: string
      label: string
      temp: number
      kind: Forecast['current']['kind']
      isDay: boolean
      pop: number
    }
  | { type: 'sun'; key: string; label: string; event: 'sunrise' | 'sunset'; caption: string }

export function HourlyCard({
  forecast,
  unit,
  order,
}: {
  forecast: Forecast
  unit: TemperatureUnit
  order: number
}) {
  const items = useMemo<HourlyItem[]>(() => {
    const hours = forecast.hourly.slice(0, 25)
    const out: HourlyItem[] = []
    const first = hours[0]?.time ?? ''
    const last = hours[hours.length - 1]?.time ?? ''
    const events = forecast.daily
      .slice(0, 2)
      .flatMap((d) => [
        { time: d.sunrise, event: 'sunrise' as const },
        { time: d.sunset, event: 'sunset' as const },
      ])
      .filter((e) => e.time > first && e.time < last)

    hours.forEach((h, i) => {
      out.push({
        type: 'hour',
        key: h.time,
        label: i === 0 ? 'Agora' : hourLabel(h.time),
        temp: i === 0 ? forecast.current.temperature : h.temperature,
        kind: i === 0 ? forecast.current.kind : h.kind,
        isDay: i === 0 ? forecast.current.isDay : h.isDay,
        pop: h.precipProbability,
      })
      const next = hours[i + 1]
      for (const e of events) {
        if (next && e.time > h.time && e.time < next.time) {
          out.push({
            type: 'sun',
            key: e.time,
            label: clockLabel(e.time),
            event: e.event,
            caption: e.event === 'sunrise' ? 'Nascer' : 'Pôr do sol',
          })
        }
      }
    })
    return out
  }, [forecast])

  const summary = hourlySummary(forecast.hourly)

  return (
    <Card title="Previsão por hora" icon="clock" className="card--hourly" order={order} reveal>
      {summary && <p className="card__summary">{summary}</p>}
      <div className="hourly" data-hscroll tabIndex={0} aria-label="Próximas 24 horas">
        {items.map((item) =>
          item.type === 'hour' ? (
            <div key={item.key} className="hourly__item">
              <span className="hourly__label">{item.label}</span>
              <span className="hourly__icon">
                <WeatherIcon kind={item.kind} isDay={item.isDay} size={26} />
                {item.pop >= 20 && (
                  <span className="hourly__pop">{Math.round(item.pop / 10) * 10}%</span>
                )}
              </span>
              <span className="hourly__temp">{toUnit(item.temp, unit)}°</span>
            </div>
          ) : (
            <div key={item.key} className="hourly__item hourly__item--sun">
              <span className="hourly__label">{item.label}</span>
              <span className="hourly__icon">
                <SunEventIcon type={item.event} />
              </span>
              <span className="hourly__caption">{item.caption}</span>
            </div>
          ),
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* 10 days                                                             */
/* ------------------------------------------------------------------ */

// absolute temperature scale → color (cold blue → mild green → hot orange)
const TEMP_STOPS: [number, string][] = [
  [0, '#5aa9ff'],
  [12, '#59c8e8'],
  [18, '#6fd4a4'],
  [23, '#c9dc5c'],
  [27, '#f6c443'],
  [31, '#f89a3a'],
  [36, '#f2643a'],
]

function tempGradient(min: number, max: number) {
  const span = Math.max(1, max - min)
  const stops = TEMP_STOPS.map(([t, c]) => `${c} ${(((t - min) / span) * 100).toFixed(1)}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

export function DailyCard({
  forecast,
  unit,
  order,
}: {
  forecast: Forecast
  unit: TemperatureUnit
  order: number
}) {
  const reduced = useReducedMotion()
  const days = forecast.daily.slice(0, 10)
  const low = Math.min(...days.map((d) => d.min))
  const high = Math.max(...days.map((d) => d.max))
  const span = Math.max(1, high - low)
  const gradient = tempGradient(low, high)
  const now = forecast.current.temperature

  return (
    <Card title="Previsão para 10 dias" icon="calendar" className="card--daily" order={order}>
      <ul className="daily">
        {days.map((d, i) => {
          const left = ((d.min - low) / span) * 100
          const right = 100 - ((d.max - low) / span) * 100
          const center = (left + (100 - right)) / 2
          const nowPos = Math.min(100, Math.max(0, ((now - low) / span) * 100))
          const wet = isWet(d.kind) || d.precipProbability >= 40
          return (
            <li key={d.date} className="daily__row">
              <span className="daily__day">{dayLabel(d.date, i)}</span>
              <span className="daily__icon">
                <WeatherIcon kind={d.kind} size={24} />
                {wet && d.precipProbability >= 30 && (
                  <span className="daily__pop">{Math.round(d.precipProbability / 10) * 10}%</span>
                )}
              </span>
              <span className="daily__min">{toUnit(d.min, unit)}°</span>
              <span className="daily__track" aria-hidden="true">
                <motion.span
                  className="daily__fill"
                  style={{ backgroundImage: gradient }}
                  initial={
                    reduced
                      ? false
                      : { clipPath: `inset(0 ${100 - center}% 0 ${center}% round 999px)` }
                  }
                  whileInView={{ clipPath: `inset(0 ${right}% 0 ${left}% round 999px)` }}
                  viewport={{ once: true, margin: '0px 0px -40px 0px' }}
                  transition={{ ...motionTokens.system.default, delay: i * 0.03 }}
                />
                {i === 0 && (
                  <span
                    className="daily__now"
                    style={{ left: `${nowPos}%` }}
                    title="Temperatura agora"
                  />
                )}
              </span>
              <span className="daily__max">{toUnit(d.max, unit)}°</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Upcoming rain (conditional)                                         */
/* ------------------------------------------------------------------ */

export function PrecipitationCard({
  outlook,
  order,
}: {
  outlook: PrecipitationOutlook
  order: number
}) {
  const reduced = useReducedMotion()
  const max = Math.max(1, ...outlook.steps.map((s) => s.precipitation))
  return (
    <Card title="Chuva próxima" icon="umbrella" className="card--precip" order={order} reveal>
      <p className="precip__text">{outlook.text}</p>
      <div className="precip__bars" aria-hidden="true">
        {outlook.steps.map((s, i) => (
          <motion.span
            key={s.time}
            className="precip__bar"
            data-dry={s.precipitation < RAIN_THRESHOLD || undefined}
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: Math.max(0.08, s.precipitation / max) }}
            viewport={{ once: true, margin: '0px 0px -25% 0px' }}
            transition={{ ...motionTokens.system.default, delay: 0.1 + i * 0.025 }}
          />
        ))}
      </div>
      <div className="precip__axis" aria-hidden="true">
        <span>Agora</span>
        <span>1h</span>
        <span>2h</span>
        <span>3h</span>
      </div>
    </Card>
  )
}
