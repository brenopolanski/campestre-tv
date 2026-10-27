import { useEffect, useRef } from 'react'

/**
 * Ambient rain (background). Climinha's drops belong to the character, not here.
 *
 * Where it works (Chrome, Safari 17+, Firefox), rain is drawn in a Web Worker with
 * OffscreenCanvas: off the main thread, it does not stall scroll or animations.
 * On other browsers, it falls back to the main-thread version.
 */
interface RainCanvasProps {
  intensity: 0 | 1 | 2
  reduced: boolean
}

export const RainCanvas = ({ intensity, reduced }: RainCanvasProps) => {
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = wrap.current
    if (!host || intensity === 0) {
      return
    }
    // a new canvas on every effect: a canvas can be transferred to the worker only once
    const canvas = document.createElement('canvas')
    canvas.className = 'env__rain-canvas'
    host.appendChild(canvas)
    const size = () => ({ w: window.innerWidth, h: window.innerHeight })

    let cleanup: () => void
    if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('./rain.worker.ts', import.meta.url), { type: 'module' })
      const offscreen = canvas.transferControlToOffscreen()
      worker.postMessage({ type: 'init', canvas: offscreen, intensity, reduced, ...size() }, [
        offscreen,
      ])
      const onResize = () => worker.postMessage({ type: 'resize', ...size() })
      const onVisibility = () => worker.postMessage({ type: document.hidden ? 'pause' : 'resume' })
      window.addEventListener('resize', onResize)
      document.addEventListener('visibilitychange', onVisibility)
      cleanup = () => {
        worker.terminate()
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
      }
    } else {
      cleanup = rainOnMainThread(canvas, intensity, reduced)
    }

    return () => {
      cleanup()
      canvas.remove()
    }
  }, [intensity, reduced])

  return (
    <div
      ref={wrap}
      className="env__rain"
      style={{ opacity: intensity === 0 ? 0 : 1 }}
      aria-hidden
    />
  )
}

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  depth: number
}

/** Main-thread version, for browsers without OffscreenCanvas. */
function rainOnMainThread(canvas: HTMLCanvasElement, intensity: 1 | 2, reduced: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return () => {}
  }
  let w = 0
  let h = 0
  let drops: Drop[] = []
  const wind = intensity === 2 ? 0.22 : 0.12
  const LAYERS = [
    { alpha: 0.16, width: 0.8 },
    { alpha: 0.28, width: 1.15 },
    { alpha: 0.42, width: 1.5 },
  ]

  const spawn = (anywhere: boolean): Drop => {
    const depth = Math.random()
    return {
      x: Math.random() * (w + h * wind) - h * wind,
      y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.2,
      len: 10 + depth * (intensity === 2 ? 22 : 16),
      speed: 520 + depth * (intensity === 2 ? 900 : 620),
      depth,
    }
  }
  const resize = () => {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
    const density = intensity === 2 ? 0.00027 : 0.00016
    drops = Array.from({ length: Math.round(w * h * density) }, () => spawn(true))
  }
  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    ctx.lineCap = 'round'
    for (let l = 0; l < LAYERS.length; l++) {
      ctx.strokeStyle = `rgba(205, 222, 250, ${LAYERS[l].alpha})`
      ctx.lineWidth = LAYERS[l].width
      ctx.beginPath()
      for (const d of drops) {
        if (Math.min(2, Math.floor(d.depth * 3)) !== l) {
          continue
        }
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x + d.len * wind, d.y + d.len)
      }
      ctx.stroke()
    }
  }

  resize()
  window.addEventListener('resize', resize)
  if (reduced) {
    draw()
    return () => window.removeEventListener('resize', resize)
  }

  let raf = 0
  let last = performance.now()
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i]
      d.y += d.speed * dt
      d.x += d.speed * dt * wind
      if (d.y > h + 20) {
        drops[i] = spawn(false)
      }
    }
    draw()
    raf = requestAnimationFrame(tick)
  }
  const onVisibility = () => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }
  raf = requestAnimationFrame(tick)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
