'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';

function BatteryBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="battery-bar" aria-label="Battery level">
      <div
        className={`battery-bar__fill ${clamped <= 0 ? 'empty' : ''}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function UIOverlay() {
  const battery = useGameStore((state) => state.battery);
  const flashlightOn = useGameStore((state) => state.flashlightOn);
  const nearbyPickupId = useGameStore((state) => state.nearbyPickupId);
  const isPointerLocked = useGameStore((state) => state.isPointerLocked);
  const hasInteracted = useGameStore((state) => state.hasInteracted);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ui-overlay">
      <div className="ui-row">
        <div className="badge">Battery {battery.toFixed(0)}%</div>
        <BatteryBar value={battery} />
        <div className="badge">Flashlight {flashlightOn ? 'On' : 'Off'}</div>
      </div>
      <div className="prompt hint" style={{ opacity: showHint ? 1 : 0.4 }}>
        Click the scene to look around. Move with WASD. Press F to toggle flashlight. Press E near glowing cubes to recharge.
      </div>
      <div className="ui-row" style={{ justifyContent: 'space-between' }}>
        <Link href="/" className="link-button">
          Back to lobby
        </Link>
        <div className="badge" aria-live="polite">
          {isPointerLocked ? 'Pointer locked — press Esc to release' : 'Click the scene to lock pointer'}
        </div>
      </div>
      {nearbyPickupId && (
        <div className="prompt" style={{ position: 'absolute', bottom: '30%', left: '50%', transform: 'translateX(-50%)' }}>
          Press E to collect battery
        </div>
      )}
    </div>
  );
}
