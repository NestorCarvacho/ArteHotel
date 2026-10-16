export function hasWebGL() {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    return Boolean(gl)
  } catch {
    return false
  }
}
