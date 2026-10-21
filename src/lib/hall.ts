/** Corridor geometry. The camera looks toward -Z; walking forward decreases Z. */

export const HALL = {
  eye: 1.55,
  width: 2.82,
  height: 3.04,
  spacing: 6.4,
  firstDoor: -5.2,
  approach: 3.5,
  initialZ: 0.2,
  nearLimit: 1.85,
  doorW: 1.074,
  doorH: 2.38,
  endMargin: 4.4,
  lookAhead: 8,
  lookY: 1.18,
  fov: 46,
} as const

export function doorZ(index: number) {
  return HALL.firstDoor - index * HALL.spacing
}

export function farLimit(count: number) {
  if (count <= 0) return HALL.initialZ
  return doorZ(count - 1) - 1.35
}

export function hallExtent(count: number) {
  const start = HALL.nearLimit + 2.4
  const end = (count <= 0 ? HALL.firstDoor : doorZ(count - 1)) - HALL.endMargin
  return {
    start,
    end,
    center: (start + end) / 2,
    length: start - end,
  }
}

export function approachZ(index: number) {
  return doorZ(index) + HALL.approach
}

export function isInFront(z: number, index: number) {
  return Math.abs(z - approachZ(index)) < 1.4
}

export function nearestDoor(z: number, count: number) {
  let best = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let index = 0; index < count; index += 1) {
    const dist = Math.abs(z - approachZ(index))
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
  }
  return best
}

export function progressOf(z: number, count: number) {
  const span = HALL.nearLimit - farLimit(count)
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (HALL.nearLimit - z) / span))
}

export function sideOf(index: number) {
  return index % 2 === 0 ? -1 : 1
}
