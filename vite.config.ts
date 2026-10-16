import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { coleccionPlugin } from "./server/coleccion-plugin.ts"

export default defineConfig({
  plugins: [react(), tailwindcss(), coleccionPlugin()],
  server: {
    host: true,
    port: 4731,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4731,
    strictPort: true,
  },
})
