import { getArtworks } from "../data/catalog"
import { HALL, approachZ, farLimit, isInFront, nearestDoor, progressOf } from "./hall"

export type WalkSnap = {
  z: number
  nearest: number
  inFront: boolean
  progress: number
  moved: boolean
}

const count = () => getArtworks().length

let hasMoved = false

function measure(z: number): WalkSnap {
  if (Math.abs(z - HALL.initialZ) > 0.45) hasMoved = true
  const n = count()
  const nearest = n > 0 ? nearestDoor(z, n) : 0
  return {
    z,
    nearest,
    inFront: n > 0 && isInFront(z, nearest),
    progress: n > 0 ? progressOf(z, n) : 0,
    moved: hasMoved,
  }
}

let snap: WalkSnap = measure(HALL.initialZ)
const listeners = new Set<() => void>()

function emit(next: WalkSnap) {
  if (
    snap.nearest === next.nearest &&
    snap.inFront === next.inFront &&
    snap.moved === next.moved &&
    Math.abs(snap.progress - next.progress) < 0.0012
  ) {
    return
  }
  snap = next
  listeners.forEach((listener) => listener())
}

export function getWalk() {
  return snap
}

export function subscribeWalk(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const targetZ: { current: number } = { current: HALL.initialZ }

export function setTarget(z: number) {
  const min = farLimit(count())
  const max = HALL.nearLimit
  targetZ.current = Math.min(max, Math.max(min, z))
}

/** Positive meters walk deeper into the corridor. */
export function nudge(metersForward: number) {
  setTarget(targetZ.current - metersForward)
}

export function seekIndex(index: number) {
  setTarget(approachZ(index))
}

export function goToEntrance() {
  setTarget(HALL.nearLimit)
}

export function goToEnd() {
  setTarget(farLimit(count()))
}

export function publishCameraZ(z: number) {
  emit(measure(z))
}
