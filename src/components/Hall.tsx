import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { useCatalog } from "../data/catalog"
import { HALL, hallExtent } from "../lib/hall"
import { usePrefersReducedMotion } from "../lib/motion"
import { createHallCarpet } from "../lib/textures"
import { getWalk, publishCameraZ, targetZ } from "../lib/walk"
import { Door } from "./Door"

function Walker() {
  const reduce = usePrefersReducedMotion()
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)
  const lookX = useRef(0)

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    perspective.fov = width < 760 ? 54 : HALL.fov
    perspective.updateProjectionMatrix()
  }, [camera, width])

  useFrame((_, delta) => {
    const goal = targetZ.current
    const snap = getWalk()
    const side = snap.nearest % 2 === 0 ? -1 : 1
    const goalX = snap.inFront ? side * 0.16 : 0
    const goalLook = snap.inFront ? side * 0.9 : 0
    camera.position.z = reduce ? goal : THREE.MathUtils.damp(camera.position.z, goal, 3.1, delta)
    camera.position.y = HALL.eye
    camera.position.x = reduce ? goalX : THREE.MathUtils.damp(camera.position.x, goalX, 2.4, delta)
    lookX.current = reduce ? goalLook : THREE.MathUtils.damp(lookX.current, goalLook, 2.4, delta)
    camera.lookAt(lookX.current, HALL.lookY, camera.position.z - HALL.lookAhead)
    publishCameraZ(camera.position.z)
  })

  return null
}

function EndCarousel({ slides, z }: { slides: string[]; z: number }) {
  const [index, setIndex] = useState(0)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (reduce || slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 3200)
    return () => window.clearInterval(id)
  }, [reduce, slides])

  useEffect(() => {
    const src = slides[index]
    if (!src) return
    const loader = new THREE.TextureLoader()
    let dropped = false
    let loaded: THREE.Texture | null = null
    loader.load(src, (texture) => {
      if (dropped) {
        texture.dispose()
        return
      }
      texture.colorSpace = THREE.SRGBColorSpace
      loaded = texture
      const mat = material.current
      if (!mat) {
        texture.dispose()
        return
      }
      const previous = mat.map
      mat.map = texture
      mat.needsUpdate = true
      if (previous && previous !== texture) previous.dispose()
    })
    return () => {
      dropped = true
      const mat = material.current
      if (mat && loaded && mat.map === loaded) {
        mat.map = null
        mat.needsUpdate = true
      }
      loaded?.dispose()
    }
  }, [slides, index])

  useFrame(({ clock }) => {
    if (!group.current || reduce) return
    group.current.position.y = 1.62 + Math.sin(clock.elapsedTime * 0.7) * 0.045
  })

  const width = 1.22
  const height = 1.68
  const border = 0.05

  return (
    <group ref={group} position={[0, 1.62, z]}>
      <mesh position={[0, height / 2 + border / 2, 0]}>
        <boxGeometry args={[width + border * 2, border, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, -(height / 2 + border / 2), 0]}>
        <boxGeometry args={[width + border * 2, border, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-(width / 2 + border / 2), 0, 0]}>
        <boxGeometry args={[border, height, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[width / 2 + border / 2, 0, 0]}>
        <boxGeometry args={[border, height, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={material} color="#ffffff" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Corridor({ onChoose }: { onChoose: (index: number) => void }) {
  const { artworks } = useCatalog()
  const count = artworks.length
  const extent = useMemo(() => hallExtent(count), [count])
  const slides = useMemo(() => artworks.flatMap((artwork) => artwork.photos.map((photo) => photo.src)), [artworks])
  const carpet = useMemo(() => createHallCarpet(), [])

  useEffect(() => {
    return () => carpet.dispose()
  }, [carpet])

  const gl = useThree((state) => state.gl)
  useEffect(() => {
    carpet.wrapS = THREE.RepeatWrapping
    carpet.wrapT = THREE.RepeatWrapping
    carpet.repeat.set(1, extent.length / HALL.width)
    carpet.anisotropy = gl.capabilities.getMaxAnisotropy()
    carpet.needsUpdate = true
  }, [gl, carpet, extent.length])

  const wall = "#050505"

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, extent.center]}>
        <planeGeometry args={[HALL.width, extent.length]} />
        <meshStandardMaterial map={carpet} roughness={1} metalness={0} />
      </mesh>

      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * (HALL.width / 2 + 0.08), HALL.height / 2, extent.center]}>
          <boxGeometry args={[0.16, HALL.height, extent.length]} />
          <meshBasicMaterial color={wall} />
        </mesh>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL.height, extent.center]}>
        <planeGeometry args={[HALL.width, extent.length]} />
        <meshBasicMaterial color={wall} />
      </mesh>

      <mesh position={[0, HALL.height / 2, extent.end]}>
        <boxGeometry args={[HALL.width + 0.5, HALL.height + 0.2, 0.24]} />
        <meshBasicMaterial color={wall} />
      </mesh>

      <EndCarousel slides={slides} z={extent.end + 0.85} />

      {artworks.map((artwork, index) => (
        <Door key={artwork.id} index={index} onChoose={onChoose} />
      ))}

      <ambientLight color="#ffffff" intensity={0.85} />
    </group>
  )
}

export function Hall({ onChoose }: { onChoose: (index: number) => void }) {
  useEffect(() => {
    return () => {
      document.body.style.cursor = ""
    }
  }, [])

  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.5]}
      camera={{
        fov: HALL.fov,
        near: 0.08,
        far: 160,
        position: [0, HALL.eye, HALL.initialZ],
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.setClearColor("#000000")
      }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 14, 42]} />
      <Walker />
      <Corridor onChoose={onChoose} />
    </Canvas>
  )
}
