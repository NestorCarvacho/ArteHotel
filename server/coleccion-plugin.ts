import fs from "node:fs"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"
import type { Connect, Plugin } from "vite"

const MAX_BODY = 18_000_000

function send(res: ServerResponse, status: number, body: string) {
  res.statusCode = status
  res.setHeader("content-type", "text/plain; charset=utf-8")
  res.end(body)
}

function readBody(req: IncomingMessage, limit: number) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on("data", (chunk: Buffer) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error("El archivo supera el tamaño permitido."))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null
  return value.trim().slice(0, max)
}

function validateCatalog(value: unknown) {
  if (!value || typeof value !== "object") return "La colección no tiene el formato esperado."
  const record = value as Record<string, unknown>
  const exhibition = record.exhibition
  if (!exhibition || typeof exhibition !== "object" || !Array.isArray(record.artworks)) {
    return "Faltan las habitaciones."
  }
  if (record.artworks.length > 40) return "Hay demasiadas habitaciones."
  const info = exhibition as Record<string, unknown>
  if (!text(info.title, 80) || !text(info.kicker, 40) || !text(info.lede, 280) || text(info.sampleNote, 280) == null) {
    return "El título de la muestra no es válido."
  }
  const seen = new Set<string>()
  for (const item of record.artworks) {
    if (!item || typeof item !== "object") return "Una habitación está incompleta."
    const artwork = item as Record<string, unknown>
    const id = text(artwork.id, 40)
    const src = text(artwork.src, 180)
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || seen.has(id)) return "Hay una habitación repetida o sin identificador."
    seen.add(id)
    if (text(artwork.room, 24) == null || text(artwork.title, 80) == null) return "Falta el nombre de una habitación."
    if (text(artwork.year, 12) == null || text(artwork.medium, 40) == null || text(artwork.caption, 400) == null) {
      return "Falta la descripción de una habitación."
    }
    if (src == null || (src !== "" && !/^\/obras\/[a-zA-Z0-9._-]+$/.test(src))) return "La foto de una habitación no es válida."
    if (typeof artwork.width !== "number" || typeof artwork.height !== "number") return "Falta el tamaño de una foto."
    if (typeof artwork.sample !== "boolean") return "Una habitación está incompleta."
  }
  return null
}

function writeFile(root: string, relative: string, contents: string | Buffer) {
  const target = path.join(root, relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, contents)
  const dist = path.join(root, "dist", relative.replace(/^public\//, ""))
  if (fs.existsSync(path.join(root, "dist"))) {
    fs.mkdirSync(path.dirname(dist), { recursive: true })
    fs.writeFileSync(dist, contents)
  }
}

function extensionFor(type: unknown) {
  if (type === "image/jpeg") return "jpg"
  if (type === "image/png") return "png"
  if (type === "image/webp") return "webp"
  if (type === "image/gif") return "gif"
  return null
}

function attach(middlewares: Connect.Server, root: string) {
  middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0]
    if (url !== "/api/coleccion" && url !== "/api/obras") {
      next()
      return
    }

    try {
      if (url === "/api/coleccion" && req.method === "PUT") {
        const raw = await readBody(req, 2_000_000)
        const parsed: unknown = JSON.parse(raw.toString("utf8"))
        const error = validateCatalog(parsed)
        if (error) {
          send(res, 400, error)
          return
        }
        writeFile(root, "public/coleccion.json", `${JSON.stringify(parsed, null, 2)}\n`)
        send(res, 200, "Guardado")
        return
      }

      if (url === "/api/obras" && req.method === "POST") {
        const raw = await readBody(req, MAX_BODY)
        const parsed: unknown = JSON.parse(raw.toString("utf8"))
        if (!parsed || typeof parsed !== "object") {
          send(res, 400, "No llegó la foto.")
          return
        }
        const body = parsed as Record<string, unknown>
        const extension = extensionFor(body.type)
        const data = body.data
        if (!extension || typeof data !== "string" || data.length < 32) {
          send(res, 400, "Usa una foto JPG, PNG, WEBP o GIF.")
          return
        }
        const buffer = Buffer.from(data, "base64")
        if (buffer.length < 32 || buffer.length > 12_000_000) {
          send(res, 400, "La foto tiene que pesar menos de 12 MB.")
          return
        }
        const filename = `foto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
        writeFile(root, path.join("public/obras", filename), buffer)
        res.statusCode = 200
        res.setHeader("content-type", "application/json; charset=utf-8")
        res.end(JSON.stringify({ src: `/obras/${filename}` }))
        return
      }

      send(res, 405, "Esa acción no está disponible.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar."
      send(res, 500, message)
    }
  })
}

export function coleccionPlugin(): Plugin {
  return {
    name: "coleccion",
    configureServer(server) {
      attach(server.middlewares, server.config.root)
    },
    configurePreviewServer(server) {
      attach(server.middlewares, server.config.root)
    },
  }
}
