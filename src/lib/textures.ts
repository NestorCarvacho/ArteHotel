import * as THREE from "three"

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function woodShade(rand: () => number, drift = 0) {
  const light = 34 + rand() * 16 + drift
  return `hsl(27, ${32 + rand() * 10}%, ${light}%)`
}

export function createWoodTexture() {
  const size = 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar el piso")

  const rand = mulberry32(201)
  ctx.fillStyle = "#3a291c"
  ctx.fillRect(0, 0, size, size)

  const planks = 8
  const plankH = size / planks
  for (let i = 0; i < planks; i += 1) {
    const y = i * plankH
    const grad = ctx.createLinearGradient(0, y, size, y)
    grad.addColorStop(0, woodShade(rand))
    grad.addColorStop(0.45, woodShade(rand, 4))
    grad.addColorStop(1, woodShade(rand, -3))
    ctx.fillStyle = grad
    ctx.fillRect(0, y + 2, size, plankH - 5)

    ctx.strokeStyle = `rgba(58, 32, 18, ${0.18 + rand() * 0.2})`
    ctx.lineWidth = 1
    for (let g = 0; g < 5; g += 1) {
      const gy = y + 10 + rand() * (plankH - 20)
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(size * 0.3, gy + rand() * 6 - 3, size * 0.7, gy + rand() * 6 - 3, size, gy)
      ctx.stroke()
    }

    let x = 0
    while (x < size) {
      x += 180 + rand() * 220
      ctx.fillStyle = "rgba(42, 26, 16, 0.45)"
      ctx.fillRect(x, y + 2, 2, plankH - 5)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export function createCarpetTexture() {
  const width = 512
  const height = 256
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar la alfombra")

  ctx.fillStyle = "#6d2838"
  ctx.fillRect(0, 0, width, height)

  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? "rgba(255, 220, 200, 0.05)" : "rgba(40, 8, 16, 0.12)"
    ctx.fillRect(28, y, width - 56, 1)
  }

  ctx.fillStyle = "#d4c09a"
  ctx.fillRect(0, 0, 16, height)
  ctx.fillRect(width - 16, 0, 16, height)
  ctx.fillStyle = "#4c1826"
  ctx.fillRect(16, 0, 7, height)
  ctx.fillRect(width - 23, 0, 7, height)
  ctx.fillStyle = "rgba(90, 24, 36, 0.55)"
  ctx.fillRect(width / 2 - 1, 0, 2, height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export function createHallCarpet() {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar la alfombra")

  const rand = mulberry32(19)
  ctx.fillStyle = "#7a1828"
  ctx.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y += 1) {
    const tone = 96 + Math.sin(y * 0.37) * 10 + (y % 5 === 0 ? -8 : 0)
    ctx.fillStyle = `rgb(${tone + 40}, ${Math.max(12, tone * 0.22)}, ${Math.max(18, tone * 0.32)})`
    ctx.fillRect(0, y, size, 1)
  }

  ctx.lineWidth = 1.15
  for (let i = 0; i < 1600; i += 1) {
    const x = rand() * size
    const y = rand() * size
    const len = 5 + rand() * 16
    const ang = rand() * Math.PI
    const x2 = x + Math.cos(ang) * len
    const y2 = y + Math.sin(ang) * len * 0.45
    ctx.strokeStyle = rand() > 0.5 ? "rgba(255, 214, 206, 0.13)" : "rgba(42, 0, 12, 0.28)"
    const draw = (ox: number, oy: number) => {
      ctx.beginPath()
      ctx.moveTo(x + ox, y + oy)
      ctx.lineTo(x2 + ox, y2 + oy)
      ctx.stroke()
    }
    draw(0, 0)
    if (x < 18 || x2 < 18) draw(size, 0)
    if (x > size - 18 || x2 > size - 18) draw(-size, 0)
    if (y < 18 || y2 < 18) draw(0, size)
    if (y > size - 18 || y2 > size - 18) draw(0, -size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

export function createPlaqueTexture(label: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar la placa")

  ctx.fillStyle = "#c6a15a"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = "#7d5a2e"
  ctx.lineWidth = 14
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36)
  ctx.fillStyle = "#2a2118"
  const size = label.length <= 3 ? 132 : label.length <= 6 ? 96 : label.length <= 12 ? 64 : 46
  ctx.font = `500 ${size}px Fraunces, Georgia, 'Liberation Serif', serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 8)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
