import { exhibition, artworks } from "../data/artworks"

type IntroProps = {
  leaving: boolean
  onEnter: () => void
}

export function Intro({ leaving, onEnter }: IntroProps) {
  const hasSamples = artworks.some((artwork) => artwork.sample)

  return (
    <div className={`intro ${leaving ? "intro-out" : ""}`}>
      <div className="w-full max-w-xl text-center">
        <p className="font-sans text-[11px] tracking-[0.42em] text-brass uppercase">{exhibition.kicker}</p>
        <h1 className="hero-title">{exhibition.title}</h1>
        <p className="mx-auto mt-6 max-w-md font-sans text-base leading-relaxed font-light text-ivory-dim sm:text-lg">
          {exhibition.lede}
        </p>
        <button type="button" className="brass-btn mt-8" onClick={onEnter} autoFocus>
          Entrar al pasillo
        </button>
        {hasSamples && (
          <p className="mx-auto mt-8 max-w-sm font-sans text-sm leading-relaxed text-ivory/55">
            {exhibition.sampleNote}
          </p>
        )}
      </div>
    </div>
  )
}
