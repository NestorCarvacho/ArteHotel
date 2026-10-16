import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/fraunces/latin-400.css"
import "@fontsource/fraunces/latin-400-italic.css"
import "@fontsource/fraunces/latin-500.css"
import "@fontsource/outfit/latin-300.css"
import "@fontsource/outfit/latin-400.css"
import "@fontsource/outfit/latin-500.css"
import { loadCatalog } from "./data/catalog"
import App from "./App"
import "./index.css"

function Boot() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void loadCatalog().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="grid h-full place-items-center bg-night text-ivory">
        <p className="font-serif text-3xl italic">Abriendo el pasillo…</p>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
)
