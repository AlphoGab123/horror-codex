'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import AmbientAudio from '@/components/AmbientAudio';
import Level from '@/components/Level';
import Player from '@/components/Player';
import UIOverlay from '@/components/UIOverlay';

const GameCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false },
);

export default function GamePage() {
  return (
    <div className="game-shell">
      <div className="canvas-container">
        <Suspense fallback={null}>
          <GameCanvas
            shadows
            gl={{ logarithmicDepthBuffer: true }}
            camera={{ position: [0, 1.6, 8], fov: 75, near: 0.12, far: 120 }}
          >
            <color attach="background" args={["#050505"]} />
            <fog attach="fog" args={["#050505", 10, 70]} />
            <ambientLight intensity={0.08} />
            <Level />
            <Player />
          </GameCanvas>
        </Suspense>
      </div>
      <UIOverlay />
      <AmbientAudio />
    </div>
  );
}
