import { useState } from "react"
import type { Artwork } from "../data/artworks"

type Status = "loading" | "ready" | "error"

export function MuseumFigure({ artwork }: { artwork: Artwork }) {
  const [status, setStatus] = useState<Status>("loading")

  return (
    <figure className="appear grid w-fit max-w-full justify-items-center">
      <div className="mat relative">
        {status === "loading" && (
          <div
            className="absolute inset-[0.9rem] animate-pulse bg-[#e4d8c6]"
            style={{ aspectRatio: `${artwork.width} / ${artwork.height}` }}
          />
        )}
        {status === "error" ? (
          <div className="grid h-[42vh] w-[min(72vw,380px)] place-items-center bg-[#e7dccb] px-6 text-center text-[#2a241c]">
            <div>
              <p className="font-serif text-2xl italic">Esta pieza no abrió</p>
              <p className="mt-3 font-sans text-sm leading-relaxed">
                Revisa que el archivo exista en {artwork.src}
              </p>
            </div>
          </div>
        ) : (
          <img
            src={artwork.src}
            alt={artwork.title}
            width={artwork.width}
            height={artwork.height}
            draggable={false}
            className={`piece ${status === "ready" ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setStatus("ready")
            }}
          />
        )}
      </div>
      <figcaption className="mt-5 w-0 min-w-full text-left">
        <p className="font-sans text-[11px] tracking-[0.32em] text-brass uppercase">{artwork.room}</p>
        <h2 className="mt-2 font-serif text-[clamp(1.7rem,3vw,2.4rem)] leading-none font-normal italic text-ivory">
          {artwork.title}
        </h2>
        <p className="mt-3 font-sans text-sm text-ivory/65">
          {artwork.medium} · {artwork.year}
        </p>
        <p className="mt-3 max-w-[36ch] font-sans text-[15px] leading-relaxed font-light text-ivory-dim">
          {artwork.caption}
        </p>
      </figcaption>
    </figure>
  )
}
