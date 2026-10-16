import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import type { ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { HALL, doorZ, sideOf } from "../lib/hall"
import { createPlaqueTexture } from "../lib/textures"
import { getWalk } from "../lib/walk"

const brass = { color: "#b89045", metalness: 0.82, roughness: 0.32 }
const frame = { color: "#4a3c32", roughness: 0.72, metalness: 0.04 }

function skipRaycast() {}

type DoorProps = {
  index: number
  room: string
  onChoose: (index: number) => void
}

export function Door({ index, room, onChoose }: DoorProps) {
  const side = sideOf(index)
  const inward = -side
  const yaw = side === -1 ? Math.PI / 2 : -Math.PI / 2
  const z = doorZ(index)
  const wallX = side * (HALL.width / 2)
  const mountX = wallX + inward * 0.03
  const hovered = useRef(false)
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  const leak = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const [plaque, setPlaque] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let texture: THREE.CanvasTexture | null = null
    let drop = false
    void document.fonts.ready.then(() => {
      if (drop) return
      texture = createPlaqueTexture(room)
      setPlaque(texture)
    })
    return () => {
      drop = true
      texture?.dispose()
    }
  }, [room])

  useFrame((_, delta) => {
    const near = getWalk().inFront && getWalk().nearest === index
    const hot = near || hovered.current
    const globe = glow.current
    const gap = leak.current
    const lamp = light.current
    if (globe) {
      globe.emissiveIntensity = THREE.MathUtils.damp(
        globe.emissiveIntensity,
        hot ? (near ? 2.4 : 1.5) : 0.85,
        4,
        delta,
      )
    }
    if (gap) {
      gap.emissiveIntensity = THREE.MathUtils.damp(gap.emissiveIntensity, near ? 2.2 : 0.55, 3, delta)
    }
    if (lamp) {
      lamp.intensity = THREE.MathUtils.damp(lamp.intensity, near ? 36 : hot ? 26 : 16, 4, delta)
    }
  })

  const choose = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onChoose(index)
  }

  const slabH = HALL.doorH - 0.04

  return (
    <group>
      <group
        position={[mountX, 0, z]}
        rotation={[0, yaw, 0]}
        onPointerOver={(event) => {
          event.stopPropagation()
          hovered.current = true
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          hovered.current = false
          document.body.style.cursor = ""
        }}
      >
        <mesh position={[-(HALL.doorW / 2 + 0.055), HALL.doorH / 2, 0.02]} raycast={skipRaycast}>
          <boxGeometry args={[0.09, HALL.doorH + 0.08, 0.1]} />
          <meshStandardMaterial {...frame} />
        </mesh>
        <mesh position={[HALL.doorW / 2 + 0.055, HALL.doorH / 2, 0.02]} raycast={skipRaycast}>
          <boxGeometry args={[0.09, HALL.doorH + 0.08, 0.1]} />
          <meshStandardMaterial {...frame} />
        </mesh>
        <mesh position={[0, HALL.doorH + 0.02, 0.02]} raycast={skipRaycast}>
          <boxGeometry args={[HALL.doorW + 0.2, 0.1, 0.1]} />
          <meshStandardMaterial {...frame} />
        </mesh>
        <mesh position={[0, HALL.doorH + 0.26, 0.04]} raycast={skipRaycast}>
          <planeGeometry args={[HALL.doorW - 0.04, 0.28]} />
          <meshStandardMaterial
            color="#f6e6cc"
            emissive="#ffc98a"
            emissiveIntensity={1.5}
            roughness={0.42}
          />
        </mesh>

        <mesh position={[0, slabH / 2 + 0.028, 0.045]} onClick={choose}>
          <boxGeometry args={[HALL.doorW, slabH, 0.055]} />
          <meshStandardMaterial color="#2a221c" roughness={0.58} metalness={0.06} />
        </mesh>
        <mesh position={[0, slabH / 2 + 0.02, 0.078]} raycast={skipRaycast}>
          <boxGeometry args={[HALL.doorW - 0.18, slabH - 0.42, 0.012]} />
          <meshStandardMaterial color="#3a3129" roughness={0.66} />
        </mesh>
        <mesh position={[0, 0.16, 0.08]} raycast={skipRaycast}>
          <boxGeometry args={[HALL.doorW - 0.12, 0.16, 0.01]} />
          <meshStandardMaterial {...brass} />
        </mesh>
        <mesh position={[HALL.doorW / 2 - 0.12, 1.04, 0.09]} raycast={skipRaycast}>
          <boxGeometry args={[0.11, 0.028, 0.03]} />
          <meshStandardMaterial {...brass} />
        </mesh>
        <mesh position={[0, 0.012, 0.07]} raycast={skipRaycast}>
          <boxGeometry args={[HALL.doorW - 0.08, 0.018, 0.02]} />
          <meshStandardMaterial
            ref={leak}
            color="#ffd8b4"
            emissive="#ffb366"
            emissiveIntensity={0.55}
            roughness={0.4}
          />
        </mesh>
        {plaque && (
          <mesh position={[0, 1.52, 0.09]} raycast={skipRaycast}>
            <planeGeometry args={[0.22, 0.11]} />
            <meshStandardMaterial map={plaque} metalness={0.4} roughness={0.42} />
          </mesh>
        )}

      </group>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[wallX + inward * 0.16, 0.02, z]}
        raycast={skipRaycast}
      >
        <planeGeometry args={[0.09, HALL.doorW + 0.04]} />
        <meshStandardMaterial
          color="#e0c27a"
          emissive="#8a6230"
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.38}
        />
      </mesh>

      <group position={[wallX + inward * 0.06, 1.74, z + 0.82]}>
        <mesh rotation={[0, 0, Math.PI / 2]} raycast={skipRaycast}>
          <cylinderGeometry args={[0.014, 0.014, 0.16, 10]} />
          <meshStandardMaterial {...brass} />
        </mesh>
        <mesh position={[inward * 0.09, -0.02, 0]} raycast={skipRaycast}>
          <sphereGeometry args={[0.05, 18, 18]} />
          <meshStandardMaterial
            ref={glow}
            color="#ffe1c2"
            emissive="#ffb15e"
            emissiveIntensity={0.85}
            roughness={0.35}
          />
        </mesh>
        <pointLight
          ref={light}
          position={[inward * 0.2, -0.04, 0.05]}
          color="#ffb15e"
          intensity={16}
          distance={8.5}
          decay={2}
        />
      </group>
    </group>
  )
}
