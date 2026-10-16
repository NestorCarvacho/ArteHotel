import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const USER = "lasierragonzalezdanyjorkconk@gmail.com"
const PASSWORD_SALT = "59a593132601839e15b2468b606f3c64"
const PASSWORD_HASH = "959026ec44ae735546038ad488b12eec9abc684ff5be1b346f9f28cd3e494996"
const MAX_FAILS = 3
const LOCK_MS = 15 * 60 * 1000
const TOKEN_MS = 12 * 60 * 60 * 1000

type Attempt = { fails: number; lockedUntil: number }

const attempts = new Map<string, Attempt>()

export type AttemptView = {
  locked: boolean
  remaining: number
  retryAt: number
}

function same(left: string, right: string) {
  return timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest())
}

function passwordMatches(password: string) {
  const hash = scryptSync(password, PASSWORD_SALT, 32)
  const expected = Buffer.from(PASSWORD_HASH, "hex")
  return hash.length === expected.length && timingSafeEqual(hash, expected)
}

export function credentialsMatch(email: string, password: string) {
  const emailOk = same(email.trim().toLowerCase(), USER)
  const passwordOk = passwordMatches(password)
  return emailOk && passwordOk
}

export function attemptState(key: string, now = Date.now()): AttemptView {
  const row = attempts.get(key)
  if (!row) return { locked: false, remaining: MAX_FAILS, retryAt: 0 }
  if (row.lockedUntil > now) return { locked: true, remaining: 0, retryAt: row.lockedUntil }
  if (row.lockedUntil > 0) {
    attempts.delete(key)
    return { locked: false, remaining: MAX_FAILS, retryAt: 0 }
  }
  return { locked: false, remaining: Math.max(0, MAX_FAILS - row.fails), retryAt: 0 }
}

export function recordFailure(key: string, now = Date.now()): AttemptView {
  const current = attemptState(key, now)
  if (current.locked) return current
  const fails = MAX_FAILS - current.remaining + 1
  if (fails >= MAX_FAILS) {
    const lockedUntil = now + LOCK_MS
    attempts.set(key, { fails, lockedUntil })
    return { locked: true, remaining: 0, retryAt: lockedUntil }
  }
  attempts.set(key, { fails, lockedUntil: 0 })
  return { locked: false, remaining: MAX_FAILS - fails, retryAt: 0 }
}

export function recordSuccess(key: string) {
  attempts.delete(key)
}

export function loadSecret(root: string) {
  const file = path.join(root, ".sesion-secreto")
  try {
    const current = fs.readFileSync(file)
    if (current.length >= 32) return current
  } catch {
    // The signing key is created on this machine the first time the server starts.
  }
  const secret = randomBytes(32)
  fs.writeFileSync(file, secret, { mode: 0o600 })
  return secret
}

export function signToken(secret: Buffer, now = Date.now()) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({
      sub: USER,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + TOKEN_MS) / 1000),
    }),
  ).toString("base64url")
  const data = `${header}.${payload}`
  const signature = createHmac("sha256", secret).update(data).digest("base64url")
  return `${data}.${signature}`
}

export function verifyToken(secret: Buffer, token: string, now = Date.now()) {
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [header, payload, signature] = parts
  if (!header || !payload || !signature) return false
  let alg = ""
  try {
    const parsed: unknown = JSON.parse(Buffer.from(header, "base64url").toString("utf8"))
    if (!parsed || typeof parsed !== "object" || !("alg" in parsed)) return false
    alg = String((parsed as { alg: unknown }).alg)
  } catch {
    return false
  }
  if (alg !== "HS256") return false
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  const given = Buffer.from(signature)
  const wanted = Buffer.from(expected)
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return false
  try {
    const body: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (!body || typeof body !== "object") return false
    const record = body as { sub?: unknown; exp?: unknown }
    if (record.sub !== USER) return false
    if (typeof record.exp !== "number" || record.exp * 1000 <= now) return false
    return true
  } catch {
    return false
  }
}

export function sessionCookie(token: string) {
  return `sesion=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TOKEN_MS / 1000}`
}

export function clearCookie() {
  return "sesion=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
}

export function readCookie(header: string | undefined, name: string) {
  if (!header) return null
  for (const part of header.split(";")) {
    const separator = part.indexOf("=")
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    if (key !== name) continue
    return decodeURIComponent(part.slice(separator + 1).trim())
  }
  return null
}

export function failureMessage(view: AttemptView, now = Date.now()) {
  if (view.locked) {
    const minutes = Math.max(1, Math.ceil((view.retryAt - now) / 60000))
    return `Demasiados intentos fallidos. El acceso queda cerrado por ${minutes} minutos.`
  }
  if (view.remaining === 1) return "Correo o contraseña incorrectos. Te queda 1 intento."
  return `Correo o contraseña incorrectos. Te quedan ${view.remaining} intentos.`
}
