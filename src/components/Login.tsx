import { useState, type FormEvent } from "react"

type LoginProps = {
  onEnter: () => void
}

export function Login({ onEnter }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [locked, setLocked] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked || pending) return
    setPending(true)
    setMessage("")
    try {
      const response = await fetch("/api/sesion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (response.ok) {
        onEnter()
        return
      }
      const body = (await response.json()) as { error?: string; locked?: boolean }
      setLocked(Boolean(body.locked))
      setMessage(body.error || "No se pudo entrar.")
    } catch {
      setMessage("No se pudo entrar. Abre el mantenedor con el proyecto en marcha (npm run dev).")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="keeper">
      <div className="keeper-login">
        <form onSubmit={(event) => void submit(event)}>
          <p className="font-sans text-[11px] tracking-[0.36em] text-brass uppercase">Mantenedor</p>
          <h1 className="mt-2 font-serif text-5xl font-normal italic">laSierra Gonzalez</h1>
          <p className="mt-3 font-sans text-sm leading-relaxed font-light text-ivory-dim">
            Entra para armar las habitaciones, colocar las fotos y escribir las descripciones.
          </p>
          <label className="keeper-field mt-8">
            <span>Correo</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              required
              disabled={locked || pending}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="keeper-field mt-5">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              required
              disabled={locked || pending}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <p className="mt-4 min-h-10 text-sm text-[#e7b2a0]" role="status">
            {message}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <button type="submit" className="brass-btn" disabled={locked || pending}>
              {pending ? "Entrando…" : "Entrar"}
            </button>
            <a className="text-btn" href="/">
              Ver el pasillo
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
