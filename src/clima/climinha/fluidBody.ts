/**
 * Climinha's fluid body: the outline is recalculated every frame.
 *  - a slow wave (two frequencies per point) → a cloud "breathing", never still
 *  - inertia tilt (lean): the top lags behind when he moves, like jelly
 */

// outline traced from the reference (viewBox 240×182)
const POINTS: [number, number][] = [
  [15.0, 110.9],
  [23.9, 89.6],
  [41.7, 75.0],
  [64.5, 63.8],
  [83.3, 40.7],
  [105.1, 25.2],
  [125.0, 21.6],
  [148.7, 26.4],
  [171.5, 46.9],
  [189.3, 64.7],
  [209.2, 76.2],
  [223.6, 99.3],
  [222.0, 123.0],
  [203.2, 137.2],
  [170.5, 143.2],
  [132.9, 146.4],
  [93.3, 149.3],
  [55.6, 143.8],
  [28.9, 133.1],
]

const CENTER: [number, number] = [120, 92]
const TOP = 21.6
const BOTTOM = 149.3

// normals pointing outward
const NORMALS = POINTS.map((p, i) => {
  const prev = POINTS[(i - 1 + POINTS.length) % POINTS.length]
  const next = POINTS[(i + 1) % POINTS.length]
  let nx = next[1] - prev[1]
  let ny = -(next[0] - prev[0])
  const len = Math.hypot(nx, ny) || 1
  nx /= len
  ny /= len
  // make sure it points away from the center
  if (nx * (p[0] - CENTER[0]) + ny * (p[1] - CENTER[1]) < 0) {
    nx = -nx
    ny = -ny
  }
  return [nx, ny] as [number, number]
})

function catmullRom(pts: [number, number][]) {
  const n = pts.length
  const k = 1 / 6
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += ` C ${(p1[0] + (p2[0] - p0[0]) * k).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) * k).toFixed(1)} ${(
      p2[0] -
      (p3[0] - p1[0]) * k
    ).toFixed(
      1,
    )} ${(p2[1] - (p3[1] - p1[1]) * k).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + ' Z'
}

export const STATIC_BODY_PATH = catmullRom(POINTS)

/**
 * @param t       time in seconds
 * @param amp     wave amplitude (viewBox units)
 * @param lean    -1…1: sideways shift; the top lags behind
 */
export function fluidBodyPath(t: number, amp: number, lean: number) {
  const pts = POINTS.map((p, i) => {
    const wave = Math.sin(t * 1.25 + i * 0.95) * 0.6 + Math.sin(t * 0.7 + i * 2.3) * 0.4
    const [nx, ny] = NORMALS[i]
    // relative height: 1 at the top, 0 at the base
    const h = 1 - (p[1] - TOP) / (BOTTOM - TOP)
    const lag = -lean * 14 * h * h
    return [p[0] + nx * wave * amp + lag, p[1] + ny * wave * amp] as [number, number]
  })
  return catmullRom(pts)
}

/** how far the eyes follow the tilt (they sit in the middle of the body) */
export function eyeLeanOffset(lean: number) {
  return -lean * 14 * 0.42
}
