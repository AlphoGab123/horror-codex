'use client';

import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useGameStore } from '@/store/gameStore';

export type ColliderBox = {
  position: [number, number, number];
  size: [number, number, number];
};

export const COLLIDERS: ColliderBox[] = [
  { position: [0, 1.5, 12], size: [8, 3, 1] },
  { position: [0, 1.5, -24], size: [8, 3, 1] },
  { position: [-4, 1.5, -6], size: [1, 3, 40] },
  { position: [4, 1.5, -6], size: [1, 3, 40] },
  { position: [-0.5, 1.0, -10], size: [2, 2, 2] },
  { position: [1.5, 1.0, -17], size: [3, 2, 1.5] },
  { position: [-2.5, 1.0, -20], size: [1, 2, 4] },
];

type WallProps = {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
};

const Wall = memo(function Wall({ position, size, color = '#1a1a1a' }: WallProps) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
    </mesh>
  );
});

function PickupMesh({ position, used }: { position: [number, number, number]; used: boolean }) {
  const ref = useRef<Mesh | null>(null);
  const bobSeed = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.2;
      ref.current.position.y = position[1] + Math.sin(performance.now() / 500 + bobSeed.current) * 0.05;
    }
  });

  return (
    <mesh
      ref={(node) => (ref.current = node)}
      position={[position[0], position[1], position[2]]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.5, 0.7, 0.5]} />
      <meshStandardMaterial
        color={used ? '#3a3a3a' : '#9cff4a'}
        emissive={used ? '#111111' : '#6ee600'}
        emissiveIntensity={used ? 0.1 : 0.7}
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh position={[0, -0.01, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 60]} />
      <meshStandardMaterial color="#0b0b0b" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function Ceiling() {
  return (
    <mesh position={[0, 3.0, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 60]} />
      <meshStandardMaterial color="#0a0a0a" roughness={1} metalness={0} />
    </mesh>
  );
}

function LightPatches() {
  return (
    <>
      <pointLight position={[0, 2.6, -6]} intensity={0.15} distance={10} color="#1e6bff" />
      <pointLight position={[2, 2.4, -16]} intensity={0.18} distance={8} color="#ff3c1f" />
    </>
  );
}

export default function Level() {
  const pickups = useGameStore((state) => state.pickups);

  return (
    <group>
      <Floor />
      <Ceiling />
      <LightPatches />
      {COLLIDERS.map((wall) => (
        <Wall key={`${wall.position.join('-')}`} position={wall.position} size={wall.size} />
      ))}
      {pickups.map((pickup) => (
        <PickupMesh key={pickup.id} position={pickup.position} used={pickup.used} />
      ))}
    </group>
  );
}
