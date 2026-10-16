import { useCatalog } from "../data/catalog"
import { MuseumFigure } from "./MuseumFigure"

export function EmptyHall() {
  const { exhibition } = useCatalog()
  return (
    <main className="grid h-full place-items-center bg-night px-6 text-center text-ivory">
      <div className="max-w-md">
        <p className="font-sans text-[11px] tracking-[0.36em] text-brass uppercase">{exhibition.kicker}</p>
        <h1 className="mt-4 font-serif text-5xl font-normal italic">El pasillo está vacío</h1>
        <p className="mt-5 font-sans leading-relaxed font-light text-ivory-dim">
          Agrega la primera habitación desde el mantenedor, con su nombre, su foto y su descripción.
        </p>
        <a className="brass-btn mt-8 inline-block" href="/mantener">
          Abrir el mantenedor
        </a>
      </div>
    </main>
  )
}

export function FlatHall({ fallback = false }: { fallback?: boolean }) {
  const { exhibition, artworks } = useCatalog()
  const hasSamples = artworks.some((artwork) => artwork.sample)

  return (
    <div className="flat-scroll bg-night text-ivory">
      <section className="flex flex-col items-center justify-center px-6 text-center">
        <p className="font-sans text-[11px] tracking-[0.42em] text-brass uppercase">{exhibition.kicker}</p>
        <h1 className="hero-title mt-4">{exhibition.title}</h1>
        <p className="mx-auto mt-6 max-w-md font-sans text-base leading-relaxed font-light text-ivory-dim">
          {exhibition.lede}
        </p>
        {fallback && (
          <p className="mx-auto mt-6 max-w-sm font-sans text-sm leading-relaxed text-ivory/60">
            Este navegador no pudo abrir el pasillo en tres dimensiones. Las salas se recorren hacia abajo, una
            imagen por pantalla.
          </p>
        )}
        {hasSamples && (
          <p className="mx-auto mt-6 max-w-sm font-sans text-sm leading-relaxed text-ivory/55">
            {exhibition.sampleNote}
          </p>
        )}
        <p className="mt-10 font-sans text-[10px] tracking-[0.32em] text-ivory/60 uppercase">Desliza hacia abajo</p>
      </section>
      {artworks.map((artwork) => (
        <section key={artwork.id} className="room flex items-center justify-center px-4 py-16">
          <MuseumFigure artwork={artwork} />
        </section>
      ))}
      <p className="px-6 py-10 text-center">
        <a
          className="font-sans text-[10px] tracking-[0.22em] text-ivory/50 uppercase hover:text-brass"
          href="https://nestorcarvacho.pythonanywhere.com/"
          target="_blank"
          rel="noreferrer"
        >
          Powered by Néstor Carvacho
        </a>
      </p>
    </div>
  )
}
