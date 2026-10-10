/// <reference lib="webworker" />
/**
 * Chuva desenhada fora da linha principal (OffscreenCanvas num Web Worker):
 * o scroll, o arraste e as animações do Climinha não disputam tempo com ela.
 */

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  depth: number
}

type Message =
  | {
      type: 'init'
      canvas: OffscreenCanvas
      intensity: 1 | 2
      w: number
      h: number
      reduced: boolean
    }
  | { type: 'resize'; w: number; h: number }
  | { type: 'pause' }
  | { type: 'resume' }

const LAYERS = [
  { alpha: 0.16, width: 0.8 },
  { alpha: 0.28, width: 1.15 },
  { alpha: 0.42, width: 1.5 },
]

let ctx: OffscreenCanvasRenderingContext2D | null = null
let canvas: OffscreenCanvas | null = null
let intensity: 1 | 2 = 1
let w = 0
let h = 0
let drops: Drop[] = []
let running = false
let last = 0
let reduced = false

const raf: (cb: (t: number) => void) => number =
  typeof self.requestAnimationFrame === 'function'
    ? (cb) => self.requestAnimationFrame(cb)
    : (cb) => self.setTimeout(() => cb(performance.now()), 16) as unknown as number

const wind = () => (intensity === 2 ? 0.22 : 0.12)

function spawn(anywhere: boolean): Drop {
  const depth = Math.random()
  return {
    x: Math.random() * (w + h * wind()) - h * wind(),
    y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.2,
    len: 10 + depth * (intensity === 2 ? 22 : 16),
    speed: 520 + depth * (intensity === 2 ? 900 : 620),
    depth,
  }
}

function resize(nw: number, nh: number) {
  if (!canvas || !ctx) return
  w = nw
  h = nh
  canvas.width = w
  canvas.height = h
  const density = intensity === 2 ? 0.00027 : 0.00016
  drops = Array.from({ length: Math.round(w * h * density) }, () => spawn(true))
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.lineCap = 'round'
  const k = wind()
  for (let l = 0; l < LAYERS.length; l++) {
    ctx.strokeStyle = `rgba(205, 222, 250, ${LAYERS[l].alpha})`
    ctx.lineWidth = LAYERS[l].width
    ctx.beginPath()
    for (const d of drops) {
      if (Math.min(2, Math.floor(d.depth * 3)) !== l) continue
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x + d.len * k, d.y + d.len)
    }
    ctx.stroke()
  }
}

function tick(now: number) {
  if (!running) return
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const k = wind()
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i]
    d.y += d.speed * dt
    d.x += d.speed * dt * k
    if (d.y > h + 20) drops[i] = spawn(false)
  }
  draw()
  raf(tick)
}

function start() {
  if (running || reduced) return
  running = true
  last = performance.now()
  raf(tick)
}

self.onmessage = (e: MessageEvent<Message>) => {
  const m = e.data
  if (m.type === 'init') {
    canvas = m.canvas
    ctx = canvas.getContext('2d')
    intensity = m.intensity
    reduced = m.reduced
    resize(m.w, m.h)
    draw()
    start()
  } else if (m.type === 'resize') {
    resize(m.w, m.h)
    draw()
  } else if (m.type === 'pause') {
    running = false
  } else if (m.type === 'resume') {
    start()
  }
}
