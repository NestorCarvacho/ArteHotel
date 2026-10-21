import type { ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { HALL, doorZ, sideOf } from "../lib/hall"

function skipRaycast() {}

const doorMap = new THREE.TextureLoader().load("/assets/puerta.png")
doorMap.colorSpace = THREE.SRGBColorSpace
doorMap.anisotropy = 8

const frame = 0.05
const frameDepth = 0.062
const photoZ = 0.02
const frameZ = photoZ + 0.01 + frameDepth / 2
const faceMat = new THREE.MeshBasicMaterial({ color: "#513E2F" })
const edgeMat = new THREE.MeshBasicMaterial({ color: "#3a2b20" })
const trim = [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat]

type DoorProps = {
  index: number
  onChoose: (index: number) => void
}

export function Door({ index, onChoose }: DoorProps) {
  const side = sideOf(index)
  const inward = -side
  const yaw = side === -1 ? Math.PI / 2 : -Math.PI / 2
  const z = doorZ(index)
  const wallX = side * (HALL.width / 2)
  const mountX = wallX + inward * 0.02

  const choose = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onChoose(index)
  }

  return (
    <group
      position={[mountX, 0, z]}
      rotation={[0, yaw, 0]}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        document.body.style.cursor = ""
      }}
      onClick={choose}
    >
      <mesh position={[0, HALL.doorH / 2, photoZ]}>
        <planeGeometry args={[HALL.doorW, HALL.doorH]} />
        <meshBasicMaterial map={doorMap} />
      </mesh>
      {([-1, 1] as const).map((hand) => (
        <mesh
          key={hand}
          position={[hand * (HALL.doorW / 2 + frame / 2), (HALL.doorH + frame) / 2, frameZ]}
          material={trim}
          raycast={skipRaycast}
        >
          <boxGeometry args={[frame, HALL.doorH + frame, frameDepth]} />
        </mesh>
      ))}
      <mesh position={[0, HALL.doorH + frame / 2, frameZ]} material={trim} raycast={skipRaycast}>
        <boxGeometry args={[HALL.doorW + frame * 2, frame, frameDepth]} />
      </mesh>
      <mesh position={[0, frame / 2, frameZ]} material={trim} raycast={skipRaycast}>
        <boxGeometry args={[HALL.doorW + frame * 2, frame, frameDepth]} />
      </mesh>
    </group>
  )
}
