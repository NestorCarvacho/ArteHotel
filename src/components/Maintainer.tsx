import { useState } from "react"
import { blankArtwork, setCatalog, useCatalog, type Artwork, type Catalog } from "../data/catalog"

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

export function Maintainer() {
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
    setUploadingId(id)
    setUploadError(null)
    try {
      const [measured, data] = await Promise.all([measureImage(file), fileToBase64(file)])
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: file.type, data }),
      })
      if (!response.ok) throw new Error(await response.text())
      const body = (await response.json()) as { src?: string }
      if (!body.src) throw new Error("La foto no quedó guardada.")
      setDraft((current) => ({
        ...current,
        artworks: current.artworks.map((artwork) => {
          if (artwork.id !== id) return artwork
          return {
            ...artwork,
            src: body.src ?? "",
            width: measured.width,
            height: measured.height,
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

  async function save() {
    setSaveState("saving")
    setMessage("")
    try {
      const response = await fetch("/api/coleccion", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      })
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
            <h1 className="mt-2 font-serif text-4xl font-normal italic sm:text-5xl">Habitaciones</h1>
            <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed font-light text-ivory-dim">
              Ponle nombre a cada puerta, cambia la foto y escribe la descripción. Al guardar, el pasillo queda
              actualizado.
            </p>
          </div>
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
              <div
                className={`keeper-photo ${overId === artwork.id ? "is-over" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setOverId(artwork.id)
                }}
                onDragLeave={() => setOverId((current) => (current === artwork.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  setOverId(null)
                  const file = event.dataTransfer.files[0]
                  if (file) void upload(artwork.id, file)
                }}
              >
                {artwork.src ? (
                  <img src={artwork.src} alt="" />
                ) : (
                  <p className="px-4 text-center font-sans text-sm text-ivory/70">Arrastra una foto o elige un archivo.</p>
                )}
                <label className="keeper-upload">
                  {uploadingId === artwork.id ? "Subiendo…" : artwork.src ? "Cambiar foto" : "Subir foto"}
                  <input
                    type="file"
                    accept={accepted.join(",")}
                    disabled={uploadingId === artwork.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ""
                      if (file) void upload(artwork.id, file)
                    }}
                  />
                </label>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-sans text-[11px] tracking-[0.28em] text-ivory/55">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="flex gap-3">
                    <button type="button" className="text-btn" disabled={index === 0} onClick={() => move(index, -1)}>
                      Antes
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      disabled={index === draft.artworks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Después
                    </button>
                  </div>
                </div>

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
                  <span>En la puerta</span>
                  <input
                    value={artwork.room}
                    maxLength={24}
                    required
                    onChange={(event) => patch(artwork.id, { room: event.target.value })}
                  />
                </label>
                <label className="keeper-field">
                  <span>Descripción</span>
                  <textarea
                    value={artwork.caption}
                    maxLength={400}
                    onChange={(event) => patch(artwork.id, { caption: event.target.value })}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="keeper-field">
                    <span>Año</span>
                    <input
                      value={artwork.year}
                      maxLength={12}
                      onChange={(event) => patch(artwork.id, { year: event.target.value })}
                    />
                  </label>
                  <label className="keeper-field">
                    <span>Medio</span>
                    <input
                      value={artwork.medium}
                      maxLength={40}
                      onChange={(event) => patch(artwork.id, { medium: event.target.value })}
                    />
                  </label>
                </div>

                {uploadError?.id === artwork.id && <p className="text-sm text-[#e7b2a0]">{uploadError.text}</p>}
                {!artwork.src && <p className="text-sm text-ivory/55">Esta habitación todavía no tiene foto.</p>}

                {confirmId === artwork.id ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-sm text-ivory-dim">¿Quitas esta habitación del pasillo?</p>
                    <button type="button" className="text-btn" onClick={() => remove(artwork.id)}>
                      Sí, quitar
                    </button>
                    <button type="button" className="text-btn" onClick={() => setConfirmId(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button type="button" className="text-btn self-start" onClick={() => setConfirmId(artwork.id)}>
                    Quitar
                  </button>
                )}
              </div>
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
