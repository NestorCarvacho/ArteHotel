import { useEffect, useState } from "react"
import { blankArtwork, MAX_CAPTION, MAX_PHOTOS, MIN_PHOTOS, setCatalog, useCatalog, type Artwork, type Catalog, type Photo } from "../data/catalog"
import { Login } from "./Login"

type SaveState = "idle" | "saving" | "saved" | "error"

const accepted = ["image/jpeg", "image/png", "image/webp", "image/gif"]

function cloneCatalog(catalog: Catalog): Catalog {
  return structuredClone(catalog)
}

function measureImage(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer esa imagen."))
    }
    image.src = url
  })
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo leer el archivo."))
        return
      }
      const comma = reader.result.indexOf(",")
      resolve(comma >= 0 ? reader.result.slice(comma + 1) : reader.result)
    }
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."))
    reader.readAsDataURL(file)
  })
}

function Editor({ onLeave }: { onLeave: () => void }) {
  const loaded = useCatalog()
  const [baseline, setBaseline] = useState(() => cloneCatalog(loaded))
  const [draft, setDraft] = useState(() => cloneCatalog(loaded))
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [message, setMessage] = useState("")
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<{ id: string; text: string } | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline)

  function patch(id: string, partial: Partial<Artwork>) {
    setSaveState("idle")
    setDraft((current) => ({
      ...current,
      artworks: current.artworks.map((artwork) => (artwork.id === id ? { ...artwork, ...partial } : artwork)),
    }))
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= draft.artworks.length) return
    setSaveState("idle")
    setDraft((current) => {
      const artworks = [...current.artworks]
      const [item] = artworks.splice(index, 1)
      if (!item) return current
      artworks.splice(next, 0, item)
      return { ...current, artworks }
    })
  }

  function addRoom() {
    setSaveState("idle")
    const artwork = blankArtwork(draft.artworks.length)
    setDraft((current) => ({ ...current, artworks: [...current.artworks, artwork] }))
    window.setTimeout(() => {
      document.getElementById(`habitacion-${artwork.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 40)
  }

  function remove(id: string) {
    setSaveState("idle")
    setConfirmId(null)
    setDraft((current) => ({ ...current, artworks: current.artworks.filter((artwork) => artwork.id !== id) }))
  }

  async function upload(id: string, file: File) {
    if (!accepted.includes(file.type)) {
      setUploadError({ id, text: "Usa una foto JPG, PNG, WEBP o GIF." })
      return
    }
    if (file.size > 12_000_000) {
      setUploadError({ id, text: "La foto tiene que pesar menos de 12 MB." })
      return
    }
    const current = draft.artworks.find((item) => item.id === id)
    if (current && current.photos.length >= MAX_PHOTOS) {
      setUploadError({ id, text: `Una habitación admite como máximo ${MAX_PHOTOS} fotos.` })
      return
    }
    setUploadingId(id)
    try {
      const [measured, data] = await Promise.all([measureImage(file), fileToBase64(file)])
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: file.type, data }),
      })
      if (response.status === 401) {
        onLeave()
        return
      }
      if (!response.ok) throw new Error(await response.text())
      const body = (await response.json()) as { src?: string }
      if (!body.src) throw new Error("La foto no quedó guardada.")
      const photo: Photo = { src: body.src, width: measured.width, height: measured.height, title: "", caption: "" }
      setDraft((current) => ({
        ...current,
        artworks: current.artworks.map((artwork) => {
          if (artwork.id !== id || artwork.photos.length >= MAX_PHOTOS) return artwork
          return {
            ...artwork,
            photos: [...artwork.photos, photo],
            sample: false,
            medium: artwork.medium === "Estudio de muestra" ? "Fotografía" : artwork.medium,
          }
        }),
      }))
      setSaveState("idle")
    } catch (error) {
      const text = error instanceof Error ? error.message : "No se pudo subir la foto."
      setUploadError({ id, text })
    } finally {
      setUploadingId(null)
    }
  }

  function patchPhoto(id: string, photoIndex: number, partial: Partial<Pick<Photo, "title" | "caption">>) {
    setSaveState("idle")
    setDraft((current) => ({
      ...current,
      artworks: current.artworks.map((artwork) => {
        if (artwork.id !== id) return artwork
        return {
          ...artwork,
          photos: artwork.photos.map((photo, index) => (index === photoIndex ? { ...photo, ...partial } : photo)),
        }
      }),
    }))
  }

  function movePhoto(id: string, photoIndex: number, direction: -1 | 1) {
    setSaveState("idle")
    setDraft((current) => ({
      ...current,
      artworks: current.artworks.map((artwork) => {
        if (artwork.id !== id) return artwork
        const next = photoIndex + direction
        if (next < 0 || next >= artwork.photos.length) return artwork
        const photos = [...artwork.photos]
        const [item] = photos.splice(photoIndex, 1)
        if (!item) return artwork
        photos.splice(next, 0, item)
        return { ...artwork, photos }
      }),
    }))
  }

  async function addFiles(id: string, incoming: FileList | File[]) {
    const files = [...incoming]
    if (files.length === 0) return
    const room = draft.artworks.find((item) => item.id === id)
    const free = MAX_PHOTOS - (room?.photos.length ?? 0)
    if (free <= 0) {
      setUploadError({ id, text: `Una habitación admite como máximo ${MAX_PHOTOS} fotos.` })
      return
    }
    const batch = files.slice(0, free)
    setUploadError(
      batch.length < files.length ? { id, text: `Solo entraron ${batch.length}. El máximo es ${MAX_PHOTOS}.` } : null,
    )
    for (const file of batch) await upload(id, file)
  }

  function removePhoto(id: string, photoIndex: number) {
    setSaveState("idle")
    setDraft((current) => ({
      ...current,
      artworks: current.artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, photos: artwork.photos.filter((_, index) => index !== photoIndex) } : artwork,
      ),
    }))
  }

  async function save() {
    const short = draft.artworks.find((artwork) => artwork.photos.length < MIN_PHOTOS || artwork.photos.length > MAX_PHOTOS)
    if (short) {
      setSaveState("error")
      setMessage(`«${short.title}» necesita entre ${MIN_PHOTOS} y ${MAX_PHOTOS} fotos.`)
      return
    }
    setSaveState("saving")
    setMessage("")
    try {
      const response = await fetch("/api/coleccion", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (response.status === 401) {
        onLeave()
        return
      }
      if (!response.ok) throw new Error(await response.text())
      setCatalog(draft)
      setBaseline(cloneCatalog(draft))
      setSaveState("saved")
      setMessage("Guardado. El pasillo ya usa estos nombres, fotos y descripciones.")
    } catch (error) {
      setSaveState("error")
      const text = error instanceof Error ? error.message : "No se pudo guardar."
      setMessage(
        text === "Failed to fetch"
          ? "No se pudo guardar. Abre el mantenedor con el proyecto en marcha (npm run dev)."
          : text,
      )
    }
  }

  return (
    <div className="keeper">
      <form
        className="flex h-full min-h-0 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
        <header className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4 px-4 pt-6 sm:px-6">
          <div>
            <p className="font-sans text-[11px] tracking-[0.36em] text-brass uppercase">Mantenedor</p>
            <h1 className="mt-2 font-serif text-4xl font-normal italic sm:text-5xl">{draft.exhibition.title}</h1>
            <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed font-light text-ivory-dim">
            Cada habitación va aparte. Arriba va su nombre; abajo, las fotos. Agrega varias de una vez y quita cada una con la cruz.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                if (dirty && !window.confirm("Hay cambios sin guardar. ¿Sales igual?")) return
                void fetch("/api/sesion", { method: "DELETE" }).finally(onLeave)
              }}
            >
              Salir
            </button>
            <a
              className="text-btn"
              href="/"
              onClick={(event) => {
                if (!dirty) return
                if (!window.confirm("Hay cambios sin guardar. ¿Vuelves al pasillo igual?")) event.preventDefault()
              }}
            >
              Ver el pasillo
            </a>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
          <div className="flex justify-end">
            <button type="button" className="brass-btn" onClick={addRoom}>
              Agregar habitación
            </button>
          </div>

          {draft.artworks.length === 0 && (
            <p className="border border-ivory/15 px-4 py-8 text-center font-serif text-2xl italic text-ivory-dim">
              El pasillo no tiene habitaciones. Agrega la primera.
            </p>
          )}

          {draft.artworks.map((artwork, index) => (
            <article key={artwork.id} id={`habitacion-${artwork.id}`} className="keeper-card">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-[11px] tracking-[0.28em] text-ivory/55">
                  Habitación {String(index + 1).padStart(2, "0")}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="text-btn" disabled={index === 0} onClick={() => move(index, -1)}>
                    Subir
                  </button>
                  <button
                    type="button"
                    className="text-btn"
                    disabled={index === draft.artworks.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Bajar
                  </button>
                  {confirmId === artwork.id ? (
                    <>
                      <button type="button" className="text-btn" onClick={() => remove(artwork.id)}>
                        Confirmar
                      </button>
                      <button type="button" className="text-btn" onClick={() => setConfirmId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="text-btn" onClick={() => setConfirmId(artwork.id)}>
                      Quitar habitación
                    </button>
                  )}
                </div>
              </div>

              <div className="keeper-room-fields">
                <label className="keeper-field">
                  <span>Nombre</span>
                  <input
                    value={artwork.title}
                    maxLength={80}
                    required
                    onChange={(event) => patch(artwork.id, { title: event.target.value })}
                  />
                </label>
                <label className="keeper-field">
                  <span>Número en la puerta</span>
                  <input
                    value={artwork.room}
                    maxLength={24}
                    required
                    onChange={(event) => patch(artwork.id, { room: event.target.value })}
                  />
                </label>
                <label className="keeper-field is-wide">
                  <span>Descripción de la habitación</span>
                  <textarea
                    value={artwork.caption}
                    maxLength={MAX_CAPTION}
                    rows={2}
                    onChange={(event) => patch(artwork.id, { caption: event.target.value })}
                  />
                </label>
              </div>

              <div
                className={`keeper-photos ${overId === artwork.id ? "is-over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setOverId(artwork.id)
                }}
                onDragLeave={() => setOverId((current) => (current === artwork.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  setOverId(null)
                  if (event.dataTransfer.files.length) void addFiles(artwork.id, event.dataTransfer.files)
                }}
              >
                {artwork.photos.map((photo, photoIndex) => (
                  <div key={`${photo.src}-${photoIndex}`} className="keeper-shot">
                    <div className="keeper-shot-img">
                      <img src={photo.src} alt="" />
                      <button
                        type="button"
                        className="keeper-x"
                        aria-label={`Quitar ${photo.title || `foto ${photoIndex + 1}`}`}
                        onClick={() => removePhoto(artwork.id, photoIndex)}
                      >
                        ×
                      </button>
                    </div>
                    <label className="keeper-field">
                      <span>Título</span>
                      <input
                        value={photo.title}
                        maxLength={80}
                        placeholder="Título de la foto"
                        onChange={(event) => patchPhoto(artwork.id, photoIndex, { title: event.target.value })}
                      />
                    </label>
                    <label className="keeper-field">
                      <span>Descripción</span>
                      <textarea
                        value={photo.caption}
                        maxLength={MAX_CAPTION}
                        rows={2}
                        placeholder="Descripción"
                        onChange={(event) => patchPhoto(artwork.id, photoIndex, { caption: event.target.value })}
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-btn"
                        disabled={photoIndex === 0}
                        onClick={() => movePhoto(artwork.id, photoIndex, -1)}
                      >
                        Antes
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        disabled={photoIndex === artwork.photos.length - 1}
                        onClick={() => movePhoto(artwork.id, photoIndex, 1)}
                      >
                        Después
                      </button>
                    </div>
                  </div>
                ))}

                <label className={`keeper-add ${artwork.photos.length >= MAX_PHOTOS ? "is-full" : ""}`}>
                  <span>{uploadingId === artwork.id ? "Subiendo…" : "Agregar fotos"}</span>
                  <small>
                    {artwork.photos.length} de {MAX_PHOTOS}
                  </small>
                  <input
                    type="file"
                    accept={accepted.join(",")}
                    multiple
                    disabled={uploadingId === artwork.id || artwork.photos.length >= MAX_PHOTOS}
                    onChange={(event) => {
                      const files = event.target.files
                      event.target.value = ""
                      if (files && files.length) void addFiles(artwork.id, files)
                    }}
                  />
                </label>
              </div>

              {uploadError?.id === artwork.id && <p className="text-sm text-[#e7b2a0]">{uploadError.text}</p>}
              {artwork.photos.length < MIN_PHOTOS && (
                <p className="text-sm text-ivory/55">Faltan fotos: esta habitación necesita al menos {MIN_PHOTOS}.</p>
              )}
            </article>
          ))}
        </div>
        </div>

        <div className="keeper-save">
          <p className="min-h-5 text-sm text-ivory-dim" role="status">
            {message}
          </p>
          <button type="submit" className="brass-btn" disabled={!dirty || saveState === "saving" || uploadingId !== null}>
            {saveState === "saving" ? "Guardando…" : "Guardar en el pasillo"}
          </button>
        </div>
      </form>
    </div>
  )
}

export function Maintainer() {
  const [session, setSession] = useState<"loading" | "in" | "out">("loading")

  useEffect(() => {
    let active = true
    fetch("/api/sesion", { cache: "no-store" })
      .then((response) => {
        if (active) setSession(response.ok ? "in" : "out")
      })
      .catch(() => {
        if (active) setSession("out")
      })
    return () => {
      active = false
    }
  }, [])

  if (session === "loading") {
    return (
      <div className="keeper grid place-items-center">
        <p className="font-serif text-3xl italic">Abriendo el mantenedor…</p>
      </div>
    )
  }

  if (session === "out") return <Login onEnter={() => setSession("in")} />
  return <Editor onLeave={() => setSession("out")} />
}
