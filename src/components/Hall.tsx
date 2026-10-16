import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useCatalog } from "../data/catalog"
import { HALL, hallExtent } from "../lib/hall"
import { usePrefersReducedMotion } from "../lib/motion"
import { createCarpetTexture, createWoodTexture } from "../lib/textures"
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

function Corridor({ onChoose }: { onChoose: (index: number) => void }) {
  const { artworks } = useCatalog()
  const count = artworks.length
  const extent = useMemo(() => hallExtent(count), [count])
  const maps = useMemo(() => {
    const wood = createWoodTexture()
    const carpet = createCarpetTexture()
    wood.repeat.set(HALL.width / 1.8, extent.length / 1.8)
    carpet.repeat.set(1, extent.length / 1.6)
    return { wood, carpet }
  }, [extent.length])

  useEffect(() => {
    return () => {
      maps.wood.dispose()
      maps.carpet.dispose()
    }
  }, [maps])

  const gl = useThree((state) => state.gl)
  useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy()
    maps.wood.anisotropy = max
    maps.carpet.anisotropy = max
    maps.wood.needsUpdate = true
    maps.carpet.needsUpdate = true
  }, [gl, maps])

  const pilasters = useMemo(() => {
    const zs: number[] = []
    for (let i = 0; i <= count; i += 1) {
      zs.push(HALL.firstDoor + HALL.spacing / 2 - i * HALL.spacing)
    }
    return zs
  }, [count])

  const trim = "#cbb89a"
  const wall = "#e4d8c7"

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, extent.center]}>
        <planeGeometry args={[HALL.width + 0.2, extent.length]} />
        <meshStandardMaterial map={maps.wood} roughness={0.62} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, extent.center]}>
        <planeGeometry args={[1.16, extent.length - 0.4]} />
        <meshStandardMaterial map={maps.carpet} roughness={1} metalness={0} />
      </mesh>

      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * (HALL.width / 2 + 0.08), HALL.height / 2, extent.center]}>
            <boxGeometry args={[0.16, HALL.height, extent.length]} />
            <meshStandardMaterial color={wall} roughness={0.96} />
          </mesh>
          <mesh position={[side * (HALL.width / 2 - 0.02), 0.52, extent.center]}>
            <boxGeometry args={[0.035, 0.9, extent.length]} />
            <meshStandardMaterial color="#d7c9b6" roughness={0.94} />
          </mesh>
          <mesh position={[side * (HALL.width / 2 - 0.028), 0.08, extent.center]}>
            <boxGeometry args={[0.055, 0.16, extent.length]} />
            <meshStandardMaterial color="#3e342c" roughness={0.8} />
          </mesh>
          <mesh position={[side * (HALL.width / 2 - 0.03), 1.02, extent.center]}>
            <boxGeometry args={[0.05, 0.05, extent.length]} />
            <meshStandardMaterial color={trim} roughness={0.74} />
          </mesh>
          <mesh position={[side * (HALL.width / 2 - 0.03), HALL.height - 0.07, extent.center]}>
            <boxGeometry args={[0.055, 0.08, extent.length]} />
            <meshStandardMaterial color={trim} roughness={0.74} />
          </mesh>
          {pilasters.map((z) => (
            <mesh key={z} position={[side * (HALL.width / 2 - 0.035), HALL.height / 2, z]}>
              <boxGeometry args={[0.07, HALL.height, 0.16]} />
              <meshStandardMaterial color="#efe4d4" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, HALL.height, extent.center]}>
        <planeGeometry args={[HALL.width, extent.length]} />
        <meshStandardMaterial color="#d5c9b7" roughness={1} />
      </mesh>

      {pilasters.map((z) => (
        <mesh key={`light-${z}`} position={[0, HALL.height - 0.015, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.055, 20]} />
          <meshStandardMaterial color="#fff4e4" emissive="#ffe0b8" emissiveIntensity={1.35} />
        </mesh>
      ))}

      <mesh position={[0, HALL.height / 2, extent.end]}>
        <boxGeometry args={[HALL.width + 0.5, HALL.height + 0.2, 0.24]} />
        <meshStandardMaterial color="#d9cebd" roughness={1} />
      </mesh>
      <mesh position={[0, 1.62, extent.end + 0.14]}>
        <planeGeometry args={[1.22, 2.16]} />
        <meshStandardMaterial color="#ffd7aa" emissive="#ffc184" emissiveIntensity={0.9} roughness={0.45} />
      </mesh>
      {([-0.36, 0.36] as const).map((x) => (
        <mesh key={x} position={[x, 1.62, extent.end + 0.18]}>
          <planeGeometry args={[0.46, 2.2]} />
          <meshStandardMaterial color="#f7f1e6" transparent opacity={0.38} roughness={1} />
        </mesh>
      ))}
      <pointLight position={[0, 1.7, extent.end + 1.1]} color="#ffc48a" intensity={18} distance={12} decay={2} />

      {artworks.map((artwork, index) => (
        <Door key={artwork.id} index={index} room={artwork.room} onChoose={onChoose} />
      ))}

      <hemisphereLight color="#fff6ea" groundColor="#7a5a46" intensity={1.05} />
      <ambientLight color="#ffe6cc" intensity={0.34} />
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
        gl.toneMappingExposure = 1.02
        gl.setClearColor("#2a241e")
      }}
    >
      <color attach="background" args={["#2a241e"]} />
      <fog attach="fog" args={["#2a241e", 12, 46]} />
      <Walker />
      <Corridor onChoose={onChoose} />
    </Canvas>
  )
}
