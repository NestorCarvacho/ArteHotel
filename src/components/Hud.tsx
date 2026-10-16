import { useEffect, useSyncExternalStore } from "react"
import { useCatalog } from "../data/catalog"
import { approachZ, progressOf } from "../lib/hall"
import { getWalk, subscribeWalk } from "../lib/walk"

type HudProps = {
  onEnter: (index: number) => void
}

export function Hud({ onEnter }: HudProps) {
  const snap = useSyncExternalStore(subscribeWalk, getWalk, getWalk)
  const { exhibition, artworks } = useCatalog()
  const artwork = artworks[snap.nearest]
  const count = artworks.length

  useEffect(() => {
    if (!artwork) return
    const image = new Image()
    image.src = artwork.src
  }, [artwork])

  if (!artwork) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-[max(1.15rem,env(safe-area-inset-top))] right-5 left-5 flex items-start justify-between sm:right-8 sm:left-8">
        <div>
          <p className="font-sans text-[10px] tracking-[0.38em] text-brass uppercase">{exhibition.kicker}</p>
          <p className="mt-1 font-serif text-[1.55rem] leading-none font-normal italic text-ivory">
            {exhibition.title}
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans text-[11px] tracking-[0.24em] text-ivory/75">
            {String(snap.nearest + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
          <p className="mt-2 hidden font-sans text-[10px] tracking-[0.14em] text-ivory/45 md:block">
            Flechas para caminar · Enter para entrar
          </p>
          <a className="pointer-events-auto mt-3 inline-block font-sans text-[10px] tracking-[0.22em] text-ivory/55 uppercase" href="/mantener">
            Mantener
          </a>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        {!snap.moved && (
          <div className="mb-4 text-center">
            <div className="hint-line" aria-hidden="true" />
            <p className="font-sans text-[10px] tracking-[0.32em] text-ivory/75 uppercase">
              Desliza para avanzar
            </p>
          </div>
        )}

        <div className="pointer-events-auto text-center" aria-live="polite">
          <p className="font-sans text-[11px] tracking-[0.32em] text-brass uppercase">{artwork.room}</p>
          <p className="mt-1 font-serif text-[clamp(1.6rem,4vw,2.15rem)] leading-none font-normal italic text-ivory">
            {artwork.title}
          </p>
          <button type="button" className="brass-btn mt-4" onClick={() => onEnter(snap.nearest)}>
            {snap.inFront ? "Entrar" : "Acercarme"}
          </button>
        </div>

        <div className="rail pointer-events-auto" aria-hidden={false}>
          <div className="rail-line" />
          <div className="rail-notch" style={{ left: `${snap.progress * 100}%` }} />
          {artworks.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="rail-tick"
              data-active={index === snap.nearest}
              style={{ left: `${progressOf(approachZ(index), count) * 100}%` }}
              aria-label={`Ir a la habitación ${item.room}, ${item.title}`}
              onClick={() => onEnter(index)}
            />
          ))}
        </div>
        <a
          className="pointer-events-auto mt-1 font-sans text-[10px] tracking-[0.22em] text-ivory/45 uppercase hover:text-brass"
          href="https://nestorcarvacho.pythonanywhere.com/"
          target="_blank"
          rel="noreferrer"
        >
          Powered by Néstor Carvacho
        </a>
      </div>
    </div>
  )
}
