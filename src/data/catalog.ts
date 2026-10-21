import { useSyncExternalStore } from "react"
import seed from "./coleccion.seed.json"

export type Exhibition = {
  title: string
  kicker: string
  lede: string
  sampleNote: string
}

export type Photo = {
  src: string
  width: number
  height: number
  title: string
  caption: string
}

export const MIN_PHOTOS = 2
export const MAX_PHOTOS = 30
export const MAX_CAPTION = 300

export type Artwork = {
  id: string
  room: string
  title: string
  year: string
  medium: string
  caption: string
  photos: Photo[]
  sample: boolean
}

export type Catalog = {
  exhibition: Exhibition
  artworks: Artwork[]
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null
  return value.trim().slice(0, max)
}

function photoOf(value: unknown): Photo | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const src = text(record.src, 180)
  if (!src || !/^\/obras\/[a-zA-Z0-9._-]+$/.test(src)) return null
  if (typeof record.width !== "number" || typeof record.height !== "number") return null
  if (!Number.isFinite(record.width) || !Number.isFinite(record.height)) return null
  if (record.width <= 0 || record.height <= 0) return null
  return {
    src,
    width: Math.round(record.width),
    height: Math.round(record.height),
    title: text(record.title, 80) ?? "",
    caption: text(record.caption, MAX_CAPTION) ?? "",
  }
}

function artworkOf(value: unknown): Artwork | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const id = text(record.id, 40)
  const room = text(record.room, 24)
  const title = text(record.title, 80)
  const year = text(record.year, 12)
  const medium = text(record.medium, 40)
  const caption = text(record.caption, MAX_CAPTION)
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return null
  if (room == null || title == null || year == null || medium == null || caption == null) return null
  if (!Array.isArray(record.photos) || record.photos.length < MIN_PHOTOS || record.photos.length > MAX_PHOTOS) {
    return null
  }
  const photos: Photo[] = []
  for (const item of record.photos) {
    const photo = photoOf(item)
    if (!photo) return null
    photos.push(photo)
  }
  if (typeof record.sample !== "boolean") return null
  return {
    id,
    room,
    title,
    year,
    medium,
    caption,
    photos,
    sample: record.sample,
  }
}

export function parseCatalog(value: unknown): Catalog | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const exhibition = record.exhibition
  if (!exhibition || typeof exhibition !== "object" || !Array.isArray(record.artworks)) return null
  const info = exhibition as Record<string, unknown>
  const title = text(info.title, 80)
  const kicker = text(info.kicker, 40)
  const lede = text(info.lede, 280)
  const sampleNote = text(info.sampleNote, 280)
  if (!title || !kicker || !lede || sampleNote == null) return null
  const artworks: Artwork[] = []
  const seen = new Set<string>()
  for (const item of record.artworks) {
    const artwork = artworkOf(item)
    if (!artwork || seen.has(artwork.id)) return null
    seen.add(artwork.id)
    artworks.push(artwork)
  }
  return { exhibition: { title, kicker, lede, sampleNote }, artworks }
}

const initial = parseCatalog(seed)
if (!initial) throw new Error("La colección inicial no es válida")

let catalog: Catalog = initial
const listeners = new Set<() => void>()

export function getCatalog() {
  return catalog
}

export function getArtworks() {
  return catalog.artworks
}

export function getExhibition() {
  return catalog.exhibition
}

export function setCatalog(next: Catalog) {
  catalog = next
  listeners.forEach((listener) => listener())
}

export function subscribeCatalog(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCatalog() {
  return useSyncExternalStore(subscribeCatalog, getCatalog, getCatalog)
}

export async function loadCatalog() {
  try {
    const response = await fetch(`/coleccion.json?t=${Date.now()}`, { cache: "no-store" })
    if (!response.ok) return
    const parsed = parseCatalog(await response.json())
    if (parsed) setCatalog(parsed)
  } catch {
    // The bundled collection stays in place when the file cannot be read.
  }
}

export function blankArtwork(count: number): Artwork {
  const number = 201 + count
  return {
    id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    room: String(number),
    title: "Nueva habitación",
    year: String(new Date().getFullYear()),
    medium: "Fotografía",
    caption: "",
    photos: [],
    sample: false,
  }
}
