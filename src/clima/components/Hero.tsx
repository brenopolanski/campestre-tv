import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { RefObject } from 'react'
import { entrance, motionTokens } from '../theme/motion'
import { toUnit, type TemperatureUnit } from '../weather/store'
import type { Place } from '../weather/types'

export interface HeroData {
  temperature: number
  condition: string
  max: number
  min: number
}

interface Props {
  place: Place
  data: HeroData | null
  unit: TemperatureUnit
  /** lugar reservado do Climinha — o TravelingCliminha se posiciona por ele */
  anchorRef: RefObject<HTMLDivElement | null>
  /** false enquanto a intro ocupa a tela */
  revealed: boolean
  /** direção da última troca de cidade: -1, 0, 1 */
  direction: number
  /** sem dados e sem conexão */
  error?: boolean
  onRetry?: () => void
}

/** Hero centralizado: cidade · temperatura · Climinha · condição · máx/mín. */
export function Hero({ place, data, unit, anchorRef, revealed, direction, error, onRetry }: Props) {
  const reduced = useReducedMotion() ?? false
  const { scrollY } = useScroll()
  // o texto do hero some com suavidade; o Climinha segue viagem
  const fade = useTransform(scrollY, [0, 220], [1, 0])

  // o texto só entra depois que o Climinha pousa
  const enter = (delay: number) =>
    reduced
      ? { initial: false as const, animate: { opacity: revealed ? 1 : 0 } }
      : {
          initial: { opacity: 0, y: 8, x: direction * 28 },
          animate: revealed ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 8, x: 0 },
          transition: { ...motionTokens.weather.content, delay: revealed ? delay : 0 },
        }

  const temp = data ? toUnit(data.temperature, unit) : null

  return (
    <header className="hero">
      <motion.div className="hero__top" style={reduced ? undefined : { opacity: fade }}>
        <div key={`loc-${place.id}`}>
          <motion.h1 className="hero__location" {...enter(entrance.location)}>
            {place.name}
          </motion.h1>
        </div>
        <div key={`t-${place.id}-${data ? 1 : 0}`}>
          {data ? (
            <motion.p
              className="hero__temp"
              {...enter(entrance.temperature - 0.1)}
              aria-label={`${temp} graus`}
            >
              <span className="hero__temp-value">{temp}</span>
              <span className="hero__temp-degree" aria-hidden="true">
                °
              </span>
            </motion.p>
          ) : (
            !error && <span className="hero__temp hero__temp--placeholder">--°</span>
          )}
        </div>
      </motion.div>

      <div className="hero__character" ref={anchorRef} aria-hidden="true" />

      <motion.div
        className="hero__readout"
        key={`data-${place.id}-${data ? 'ready' : error ? 'error' : 'empty'}`}
        style={reduced ? undefined : { opacity: fade }}
      >
        {data ? (
          <>
            <motion.p className="hero__condition" {...enter(entrance.condition)}>
              {data.condition}
            </motion.p>
            <motion.p className="hero__range" {...enter(entrance.meta)}>
              Máx. {toUnit(data.max, unit)}° · Mín. {toUnit(data.min, unit)}°
            </motion.p>
          </>
        ) : error ? (
          <motion.div className="hero__error" {...enter(entrance.temperature)} role="alert">
            <p className="hero__error-text">Não consegui atualizar agora.</p>
            <button type="button" className="pill-button glass" onClick={onRetry}>
              Tentar novamente
            </button>
          </motion.div>
        ) : (
          <span className="skeleton skeleton--line" style={{ width: 150 }} />
        )}
      </motion.div>
    </header>
  )
}
