import { useCallback, useEffect, useState, type CSSProperties } from "react"
import type { Artwork, Photo } from "../data/catalog"
import { usePrefersReducedMotion } from "../lib/motion"

const LOGO_SRC = "/firma.svg"

function place(index: number, current: number, count: number) {
  let delta = index - current
  const half = count / 2
  if (delta > half) delta -= count
  if (delta < -half) delta += count
  return delta
}

export function MuseumFigure({ artwork, keyboard = false }: { artwork: Artwork; keyboard?: boolean }) {
  const reduce = usePrefersReducedMotion()
  const photos = artwork.photos
  const [index, setIndex] = useState(0)
  const count = photos.length

  useEffect(() => {
    setIndex(0)
  }, [artwork.id])

  useEffect(() => {
    if (!keyboard || count < 2) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setIndex((current) => (current + 1) % count)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        setIndex((current) => (current - 1 + count) % count)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [count, keyboard])

  const bindFrame = useCallback((node: HTMLDivElement | null) => {
    if (!node || count < 2) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      startX = event.touches[0].clientX
      startY = event.touches[0].clientY
      tracking = true
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return
      const dx = event.touches[0].clientX - startX
      const dy = event.touches[0].clientY - startY
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) event.preventDefault()
    }

    const onEnd = (event: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const touch = event.changedTouches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return
      const direction = dx < 0 ? 1 : -1
      setIndex((current) => (current + direction + count) % count)
    }

    node.addEventListener("touchstart", onStart, { passive: true })
    node.addEventListener("touchmove", onMove, { passive: false })
    node.addEventListener("touchend", onEnd)
    return () => {
      node.removeEventListener("touchstart", onStart)
      node.removeEventListener("touchmove", onMove)
      node.removeEventListener("touchend", onEnd)
    }
  }, [count])

  function step(direction: -1 | 1) {
    if (count < 2) return
    setIndex((current) => (current + direction + count) % count)
  }

  useEffect(() => {
    if (!keyboard || count < 2) return
    let bucket = 0
    let lockedUntil = 0

    const onWheel = (event: WheelEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest("input, textarea, select")) return
      const box = target instanceof Element ? target.closest(".caption-scroll") : null
      if (box instanceof HTMLElement && Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
        const room = box.scrollHeight - box.clientHeight
        if (room > 1) {
          const next = box.scrollTop + event.deltaY
          if (next > 0 && next < room) return
        }
      }
      event.preventDefault()
      const now = performance.now()
      if (now < lockedUntil) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (!delta) return
      bucket += delta
      if (Math.abs(bucket) < 36) return
      const direction = bucket > 0 ? 1 : -1
      bucket = 0
      lockedUntil = now + 420
      setIndex((current) => (current + direction + count) % count)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [count, keyboard])

  if (count === 0) {
    return <p className="font-serif text-2xl text-ivory italic">Esta habitación todavía no tiene fotos.</p>
  }

  const current = photos[index] ?? photos[0]
  const title = current?.title || artwork.title
  const caption = current?.caption || artwork.caption

  const ratio = current && current.height > 0 ? current.width / current.height : 0.8

  return (
    <div ref={bindFrame} className="cover-layout" style={{ "--ar": ratio } as CSSProperties}>
      {count > 1 && (
        <button type="button" className="cover-arrow left" onClick={() => step(-1)} aria-label="Foto anterior">
          ←
        </button>
      )}
      <div className="cover">
        <div className="cover-stage">
          {photos.map((photo, photoIndex) => {
            const delta = place(photoIndex, index, count)
            const abs = Math.abs(delta)
            if (abs > 2) return null
            const active = delta === 0
            const tilt = Math.sign(delta) * (abs === 1 ? 54 : abs === 2 ? 72 : 0)
            const depth = abs === 0 ? 48 : abs === 1 ? -70 : -150
            const scale = abs === 0 ? 1 : abs === 1 ? 0.64 : 0.46
            const reach = abs === 1 ? "6.25rem" : "12.5rem"
            return (
              <article
                key={`${photo.src}-${photoIndex}`}
                className={`cover-card ${active && !reduce ? "is-reveal" : ""}`}
                data-active={active}
                data-depth={abs}
                style={{
                  aspectRatio: active ? `${photo.width} / ${photo.height}` : "3 / 4",
                  transform: `translate(-50%, -50%) translateX(calc(${Math.sign(delta) || 0} * (min(var(--frame-w), calc(var(--frame-h) * var(--ar, 0.8))) * 0.5 + ${reach}))) translateZ(${depth}px) rotateY(${-tilt}deg) scale(${scale})`,
                  zIndex: 20 - abs * 5,
                }}
              >
                <div className={`cover-inner ${active ? "" : "is-flipped"}`}>
                  <PhotoFace photo={photo} artwork={artwork} reveal={active} />
                  <div className="cover-face cover-back">
                    <img src={LOGO_SRC} alt="" draggable={false} />
                  </div>
                </div>
                {!active && (
                  <button
                    type="button"
                    className="cover-hit"
                    onClick={() => setIndex(photoIndex)}
                    aria-label={photo.title || artwork.title}
                  />
                )}
              </article>
            )
          })}
        </div>
      </div>
      {count > 1 && (
        <button type="button" className="cover-arrow right" onClick={() => step(1)} aria-label="Foto siguiente">
          →
        </button>
      )}
      {current && (
        <figcaption className="cover-caption">
          <h2>{title}</h2>
          <div className="caption-scroll">
            <p>{caption}</p>
          </div>
        </figcaption>
      )}
    </div>
  )
}

function PhotoFace({ photo, artwork, reveal }: { photo: Photo; artwork: Artwork; reveal: boolean }) {
  const [failed, setFailed] = useState(false)
  const title = photo.title || artwork.title

  return (
    <div className="cover-face">
      {failed ? (
        <p className="px-6 text-center font-serif text-2xl text-ivory italic">Esta pieza no abrió</p>
      ) : (
        <img
          key={reveal ? photo.src : "side"}
          src={photo.src}
          alt={title}
          width={photo.width}
          height={photo.height}
          draggable={false}
          className={reveal ? "is-reveal" : ""}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
