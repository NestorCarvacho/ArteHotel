import { useEffect, useRef, useState } from "react"
import { getArtworks, useCatalog } from "./data/catalog"
import { Maintainer } from "./components/Maintainer"
import { FlatHall, EmptyHall } from "./components/FlatHall"
import { Hall } from "./components/Hall"
import { Hud } from "./components/Hud"
import { Intro } from "./components/Intro"
import { RoomView } from "./components/RoomView"
import { WebGlGuard } from "./components/WebGlGuard"
import { usePrefersReducedMotion } from "./lib/motion"
import { getWalk, goToEnd, goToEntrance, nudge, seekIndex } from "./lib/walk"
import { hasWebGL } from "./lib/webgl"

export default function App() {
  const catalog = useCatalog()
  const [glOk] = useState(hasWebGL)
  if (window.location.pathname === "/mantener") return <Maintainer />
  if (catalog.artworks.length === 0) return <EmptyHall />
  if (!glOk) return <FlatHall fallback />

  return (
    <WebGlGuard fallback={<FlatHall fallback />}>
      <Experience />
    </WebGlGuard>
  )
}

function Experience() {
  const reduce = usePrefersReducedMotion()
  const [intro, setIntro] = useState<"open" | "closing" | "closed">("open")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [covered, setCovered] = useState(false)
  const roomRef = useRef<string | null>(null)
  const introRef = useRef(intro)
  const busy = useRef(false)
  const timers = useRef<number[]>([])
  const touchY = useRef<number | null>(null)
  const handlers = useRef({
    tryEnter: (_index: number) => {},
    closeRoom: () => {},
    dismissIntro: () => {},
    goTo: (_index: number) => {},
  })

  useEffect(() => {
    const timersNow = timers.current
    return () => timersNow.forEach((id) => window.clearTimeout(id))
  }, [])

  function later(run: () => void, ms: number) {
    const id = window.setTimeout(run, ms)
    timers.current.push(id)
  }

  function openRoom(id: string) {
    if (busy.current || roomRef.current) return
    busy.current = true
    setCovered(true)
    later(() => {
      roomRef.current = id
      setRoomId(id)
      const piece = getArtworks().find((artwork) => artwork.id === id)
      document.title = piece ? `${piece.title} — Habitaciones` : "Habitaciones — portafolio"
      later(() => {
        setCovered(false)
        busy.current = false
      }, reduce ? 0 : 70)
    }, reduce ? 0 : 460)
  }

  function closeRoom() {
    if (busy.current || !roomRef.current) return
    busy.current = true
    setCovered(true)
    later(() => {
      roomRef.current = null
      setRoomId(null)
      document.title = "Habitaciones — portafolio"
      later(() => {
        setCovered(false)
        busy.current = false
      }, reduce ? 0 : 70)
    }, reduce ? 0 : 420)
  }

  function goTo(index: number) {
    const next = getArtworks()[index]
    if (!next || busy.current) return
    seekIndex(index)
    roomRef.current = next.id
    setRoomId(next.id)
    document.title = `${next.title} — Habitaciones`
  }

  function tryEnter(index: number) {
    if (introRef.current === "open" || roomRef.current || busy.current) return
    const snap = getWalk()
    const piece = getArtworks()[index]
    if (snap.inFront && snap.nearest === index && piece) {
      openRoom(piece.id)
      return
    }
    seekIndex(index)
  }

  function dismissIntro() {
    if (introRef.current !== "open") return
    setIntro("closing")
    later(() => setIntro("closed"), reduce ? 0 : 560)
  }

  useEffect(() => {
    introRef.current = intro
    handlers.current = { tryEnter, closeRoom, dismissIntro, goTo }
  })

  useEffect(() => {
    const wheelMeters = 0.0125

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (introRef.current === "open" || roomRef.current) return
      const unit =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY
      nudge(unit * wheelMeters)
    }

    const onKey = (event: KeyboardEvent) => {
      if (introRef.current === "open") {
        if (event.key === "Enter" || event.key === "ArrowDown") {
          event.preventDefault()
          handlers.current.dismissIntro()
        }
        return
      }

      if (roomRef.current) {
        const index = getArtworks().findIndex((artwork) => artwork.id === roomRef.current)
        if (event.key === "Escape") {
          event.preventDefault()
          handlers.current.closeRoom()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          handlers.current.goTo(index + 1)
        } else if (event.key === "ArrowLeft") {
          event.preventDefault()
          handlers.current.goTo(index - 1)
        }
        return
      }

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault()
        nudge(1.25)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault()
        nudge(-1.25)
      } else if (event.key === "Home") {
        event.preventDefault()
        goToEntrance()
      } else if (event.key === "End") {
        event.preventDefault()
        goToEnd()
      } else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault()
        handlers.current.tryEnter(getWalk().nearest)
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      touchY.current = event.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event: TouchEvent) => {
      if (introRef.current === "open" || roomRef.current) return
      const target = event.target
      if (target instanceof Element && target.closest("button, a")) return
      const y = event.touches[0]?.clientY
      if (y == null || touchY.current == null) return
      event.preventDefault()
      const delta = touchY.current - y
      touchY.current = y
      nudge(delta * 0.017)
    }

    const onTouchEnd = () => {
      touchY.current = null
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd)
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  const hallLocked = intro === "open" || roomId !== null || covered
  const showHud = intro === "closed" && roomId === null
  const showIntro = intro !== "closed"

  return (
    <div className="fixed inset-0 touch-none overflow-hidden bg-night text-ivory">
      <div className="absolute inset-0" inert={hallLocked || undefined}>
        <Hall onChoose={tryEnter} />
        <div className="vignette" />
        {showHud && <Hud onEnter={tryEnter} />}
      </div>
      {showIntro && <Intro leaving={intro === "closing"} onEnter={dismissIntro} />}
      {roomId && <RoomView roomId={roomId} onClose={closeRoom} onGo={goTo} />}
      <div className={`veil ${covered ? "is-on" : ""}`} />
    </div>
  )
}
