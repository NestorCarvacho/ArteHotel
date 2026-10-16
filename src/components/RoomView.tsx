import { useEffect, useRef } from "react"
import { useCatalog } from "../data/catalog"
import { MuseumFigure } from "./MuseumFigure"

type RoomViewProps = {
  roomId: string
  onClose: () => void
  onGo: (index: number) => void
}

export function RoomView({ roomId, onClose, onGo }: RoomViewProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { artworks } = useCatalog()
  const index = artworks.findIndex((artwork) => artwork.id === roomId)
  const artwork = artworks[index]

  useEffect(() => {
    closeRef.current?.focus()
  }, [roomId])

  useEffect(() => {
    for (const neighbor of [index - 1, index + 1]) {
      const next = artworks[neighbor]
      if (!next) continue
      const image = new Image()
      image.src = next.src
    }
  }, [artworks, index])

  if (!artwork) return null

  return (
    <div className="room fixed inset-0 z-40 flex flex-col text-ivory">
      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7">
        <button
          ref={closeRef}
          type="button"
          className="back-btn"
          onClick={onClose}
          aria-label="Volver al pasillo"
        >
          ← Pasillo
        </button>
        <p className="font-sans text-[11px] tracking-[0.28em] text-ivory/60 uppercase">
          {String(index + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")}
        </p>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:px-20">
        <MuseumFigure key={artwork.id} artwork={artwork} />
      </div>

      {index > 0 && (
        <button
          type="button"
          className="nav-arrow left"
          onClick={() => onGo(index - 1)}
          aria-label="Obra anterior"
        >
          ←
        </button>
      )}
      {index < artworks.length - 1 && (
        <button
          type="button"
          className="nav-arrow right"
          onClick={() => onGo(index + 1)}
          aria-label="Obra siguiente"
        >
          →
        </button>
      )}

      <div className="relative z-10 flex justify-center gap-10 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
        <button type="button" className="text-btn" disabled={index === 0} onClick={() => onGo(index - 1)}>
          Anterior
        </button>
        <button
          type="button"
          className="text-btn"
          disabled={index === artworks.length - 1}
          onClick={() => onGo(index + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
