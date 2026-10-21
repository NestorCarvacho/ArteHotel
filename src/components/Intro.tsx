import { useCatalog } from "../data/catalog"

type IntroProps = {
  leaving: boolean
  onEnter: () => void
}

export function Intro({ leaving, onEnter }: IntroProps) {
  const { exhibition } = useCatalog()

  return (
    <div className={`intro gate ${leaving ? "intro-out gate-open" : ""}`}>
      <button type="button" className="gate-door" onClick={onEnter} autoFocus aria-label="Abrir la puerta principal">
        <span className="gate-slab">
          <span className="gate-back" aria-hidden="true" />
          <span className="gate-edge hinge" aria-hidden="true" />
          <span className="gate-edge latch" aria-hidden="true" />
          <span className="gate-edge top" aria-hidden="true" />
          <span className="gate-edge bottom" aria-hidden="true" />
          <span className="gate-face">
          <span className="gate-valance" aria-hidden="true" />
          <span className="gate-panel">
            <span className="font-serif text-[clamp(1.8rem,4vw,2.6rem)] leading-tight font-normal text-ivory italic">
              {exhibition.title}
            </span>
            <span className="mt-5 font-sans text-[10px] tracking-[0.32em] text-[#f3dc8a]/80 uppercase">Abre la puerta</span>
          </span>
          <span className="gate-latch" aria-hidden="true" />
          </span>
        </span>
      </button>
      <a
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] font-sans text-[10px] tracking-[0.22em] text-ivory/50 uppercase hover:text-brass"
        href="https://nestorcarvacho.pythonanywhere.com/"
        target="_blank"
        rel="noreferrer"
      >
        Powered by Néstor Carvacho
      </a>
    </div>
  )
}
