'use client';

import { useEffect, useRef } from 'react';
import { PerspectiveCamera, SpotLight } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { COLLIDERS } from './Level';
import { useGameStore } from '@/store/gameStore';

const MOVE_SPEED = 3;
const LOOK_SENSITIVITY = 0.0022;
const BATTERY_DRAIN_PER_SEC = 6;
const PICKUP_RANGE = 1.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function intersectsBox(point: [number, number, number], box: { position: [number, number, number]; size: [number, number, number] }) {
  const [px, py, pz] = point;
  const [bx, by, bz] = box.position;
  const [sx, sy, sz] = box.size;
  return (
    px > bx - sx / 2 &&
    px < bx + sx / 2 &&
    py > by - sy / 2 &&
    py < by + sy / 2 &&
    pz > bz - sz / 2 &&
    pz < bz + sz / 2
  );
}

function resolveCollision(desired: [number, number, number], current: [number, number, number]) {
  let next: [number, number, number] = [...desired];
  for (const collider of COLLIDERS) {
    if (intersectsBox(next, collider)) {
      // simple axis separation
      const dx = desired[0] - current[0];
      const dz = desired[2] - current[2];
      let corrected: [number, number, number] = [...current];
      if (dx !== 0) {
        const test: [number, number, number] = [desired[0], current[1], current[2]];
        if (!intersectsBox(test, collider)) {
          corrected = [desired[0], corrected[1], corrected[2]];
        }
      }
      if (dz !== 0) {
        const test: [number, number, number] = [corrected[0], corrected[1], desired[2]];
        if (!intersectsBox(test, collider)) {
          corrected = [corrected[0], corrected[1], desired[2]];
        }
      }
      next = corrected;
    }
  }
  return next;
}

export default function Player() {
  const cameraRef = useRef<PerspectiveCamera>(null!);
  const flashlightRef = useRef<SpotLight>(null);
  const pressedKeys = useRef<Record<string, boolean>>({});
  const pointerLocked = useGameStore((state) => state.isPointerLocked);
  const setPointerLocked = useGameStore((state) => state.setPointerLocked);
  const position = useGameStore((state) => state.position);
  const yaw = useGameStore((state) => state.yaw);
  const pitch = useGameStore((state) => state.pitch);
  const setPosition = useGameStore((state) => state.setPosition);
  const setRotation = useGameStore((state) => state.setRotation);
  const flashlightOn = useGameStore((state) => state.flashlightOn);
  const toggleFlashlight = useGameStore((state) => state.toggleFlashlight);
  const drainBattery = useGameStore((state) => state.drainBattery);
  const pickups = useGameStore((state) => state.pickups);
  const nearbyPickupId = useGameStore((state) => state.nearbyPickupId);
  const setNearbyPickup = useGameStore((state) => state.setNearbyPickup);
  const usePickup = useGameStore((state) => state.usePickup);
  const setHasInteracted = useGameStore((state) => state.setHasInteracted);
  const { gl, set } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleClick = () => {
      canvas.requestPointerLock();
      setHasInteracted(true);
    };
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, setHasInteracted]);

  useEffect(() => {
    const handleLockChange = () => {
      const locked = document.pointerLockElement === gl.domElement;
      setPointerLocked(locked);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [gl.domElement, setPointerLocked]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.current[event.key.toLowerCase()] = true;
      if (event.key.toLowerCase() === 'f') {
        toggleFlashlight();
      }
      if (event.key.toLowerCase() === 'e' && nearbyPickupId) {
        usePickup(nearbyPickupId);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current[event.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyPickupId, toggleFlashlight, usePickup]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!pointerLocked) return;
      const newYaw = yaw - event.movementX * LOOK_SENSITIVITY;
      const newPitch = clamp(pitch - event.movementY * LOOK_SENSITIVITY, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
      setRotation(newYaw, newPitch);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [pitch, yaw, pointerLocked, setRotation]);

  useFrame((_, delta) => {
    const forward = (pressedKeys.current['w'] || false) as boolean;
    const backward = (pressedKeys.current['s'] || false) as boolean;
    const left = (pressedKeys.current['a'] || false) as boolean;
    const right = (pressedKeys.current['d'] || false) as boolean;

    const direction: [number, number, number] = [0, 0, 0];
    if (forward) direction[2] -= 1;
    if (backward) direction[2] += 1;
    if (left) direction[0] -= 1;
    if (right) direction[0] += 1;

    const length = Math.hypot(direction[0], direction[2]);
    if (length > 0) {
      direction[0] /= length;
      direction[2] /= length;
    }

    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    const moveX = (direction[0] * cosYaw - direction[2] * sinYaw) * MOVE_SPEED * delta;
    const moveZ = (direction[0] * sinYaw + direction[2] * cosYaw) * MOVE_SPEED * delta;

    const desired: [number, number, number] = [position[0] + moveX, position[1], position[2] + moveZ];
    const resolved = resolveCollision(desired, position);

    setPosition(resolved);
    drainBattery(delta * BATTERY_DRAIN_PER_SEC);

    const camera = cameraRef.current;
    camera.position.set(resolved[0], resolved[1], resolved[2]);
    camera.rotation.set(pitch, yaw, 0);

    if (flashlightRef.current) {
      flashlightRef.current.position.copy(camera.position);
      flashlightRef.current.target.position.set(
        camera.position.x + Math.sin(yaw) * 2,
        camera.position.y + Math.sin(performance.now() / 800) * 0.05,
        camera.position.z + Math.cos(yaw) * 2,
      );
      flashlightRef.current.target.updateMatrixWorld();
      const sway = Math.sin(performance.now() / 500) * 0.04;
      flashlightRef.current.angle = 0.45 + sway * 0.08;
      flashlightRef.current.penumbra = 0.35;
      flashlightRef.current.intensity = flashlightOn ? 2.2 : 0;
    }

    // pickup detection
    let nearest: string | null = null;
    for (const pickup of pickups) {
      if (pickup.used) continue;
      const dx = pickup.position[0] - resolved[0];
      const dy = pickup.position[1] - resolved[1];
      const dz = pickup.position[2] - resolved[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < PICKUP_RANGE) {
        nearest = pickup.id;
        break;
      }
    }
    setNearbyPickup(nearest);
  });

  useEffect(() => {
    set({ camera: cameraRef.current });
  }, [set]);

  return (
    <>
      <perspectiveCamera ref={cameraRef} fov={75} near={0.1} far={80} />
      <spotLight
        ref={flashlightRef}
        color="#fffbe6"
        position={[position[0], position[1], position[2]]}
        distance={12}
        intensity={flashlightOn ? 2.5 : 0}
        angle={0.45}
        penumbra={0.2}
        decay={1.4}
        castShadow
      />
    </>
  );
}
