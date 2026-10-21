import { useEffect, useRef } from "react"
import { useCatalog } from "../data/catalog"
import { MuseumFigure } from "./MuseumFigure"

type RoomViewProps = {
  roomId: string
  onClose: () => void
}

export function RoomView({ roomId, onClose }: RoomViewProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { artworks } = useCatalog()
  const artwork = artworks.find((item) => item.id === roomId)

  useEffect(() => {
    closeRef.current?.focus()
  }, [roomId])

  useEffect(() => {
    if (!artwork) return
    for (const photo of artwork.photos) {
      const image = new Image()
      image.src = photo.src
    }
  }, [artwork])

  if (!artwork) return null

  return (
    <div className="room fixed inset-0 z-40 flex flex-col text-ivory">
      <header className="relative z-10 flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-7">
        <button ref={closeRef} type="button" className="neon-exit" onClick={onClose} aria-label="Salir al pasillo">
          Salir
        </button>
        <p className="font-sans text-[11px] tracking-[0.28em] text-ivory/60 uppercase">{artwork.room}</p>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-visible px-14 py-6 sm:px-20">
        <MuseumFigure key={artwork.id} artwork={artwork} keyboard />
      </div>
    </div>
  )
}
