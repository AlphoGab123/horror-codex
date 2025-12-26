'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from '@/game/MainScene';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/constants';
import type { HudState } from '@/game/types';

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hud, setHud] = useState<HudState>({ pickupCollected: false, showPrompt: false });

  const scene = useMemo(() => new MainScene({ onHudUpdate: setHud }), []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#050505',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { y: 0 },
        },
      },
      scene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      game.scale.resize(width, height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [scene]);

  return (
    <div className="game-shell">
      <div ref={containerRef} className="canvas-container" />
      <div className="ui-overlay" style={{ justifyContent: 'flex-start' }}>
        <div className="ui-row">
          <div className="badge">Pickup: {hud.pickupCollected ? 'Collected' : 'Missing'}</div>
          <div className="badge">Move: WASD</div>
          <div className="badge">Interact: E</div>
        </div>
        {hud.showPrompt && (
          <div className="prompt" style={{ marginTop: 10 }}>
            Press E to collect the battery
          </div>
        )}
        <a className="link-button" style={{ marginTop: 'auto' }} href="/">
          Back to lobby
        </a>
      </div>
    </div>
  );
}
