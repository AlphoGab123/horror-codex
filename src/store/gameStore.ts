import { create } from 'zustand';

export type Pickup = {
  id: string;
  position: [number, number, number];
  used: boolean;
};

type GameState = {
  position: [number, number, number];
  yaw: number;
  pitch: number;
  flashlightOn: boolean;
  battery: number;
  pickups: Pickup[];
  nearbyPickupId: string | null;
  isPointerLocked: boolean;
  hasInteracted: boolean;
  setPosition: (position: [number, number, number]) => void;
  setRotation: (yaw: number, pitch: number) => void;
  setFlashlightOn: (active: boolean) => void;
  toggleFlashlight: () => void;
  drainBattery: (amount: number) => void;
  setBattery: (value: number) => void;
  usePickup: (id: string) => void;
  setNearbyPickup: (id: string | null) => void;
  setPointerLocked: (locked: boolean) => void;
  setHasInteracted: (flag: boolean) => void;
};

const initialPickups: Pickup[] = [
  { id: 'pickup-1', position: [-1.5, 0.8, -10], used: false },
  { id: 'pickup-2', position: [2.2, 0.8, -20], used: false },
];

export const useGameStore = create<GameState>((set, get) => ({
  position: [0, 1.6, 8],
  yaw: 0,
  pitch: 0,
  flashlightOn: true,
  battery: 100,
  pickups: initialPickups,
  nearbyPickupId: null,
  isPointerLocked: false,
  hasInteracted: false,
  setPosition: (position) => set({ position }),
  setRotation: (yaw, pitch) => set({ yaw, pitch }),
  setFlashlightOn: (active) => set({ flashlightOn: active && get().battery > 0 }),
  toggleFlashlight: () =>
    set((state) => {
      if (state.battery <= 0) return { flashlightOn: false };
      return { flashlightOn: !state.flashlightOn };
    }),
  drainBattery: (amount) =>
    set((state) => {
      if (!state.flashlightOn || state.battery <= 0) return state;
      const next = Math.max(0, state.battery - amount);
      return {
        battery: next,
        flashlightOn: next <= 0 ? false : state.flashlightOn,
      };
    }),
  setBattery: (value) => {
    const clamped = Math.min(100, Math.max(0, value));
    set({ battery: clamped, flashlightOn: clamped <= 0 ? false : get().flashlightOn });
  },
  usePickup: (id) =>
    set((state) => {
      const pickup = state.pickups.find((entry) => entry.id === id && !entry.used);
      if (!pickup) return state;
      return {
        pickups: state.pickups.map((entry) => (entry.id === id ? { ...entry, used: true } : entry)),
        battery: 100,
        flashlightOn: true,
        nearbyPickupId: null,
      };
    }),
  setNearbyPickup: (id) => set({ nearbyPickupId: id }),
  setPointerLocked: (locked) => set({ isPointerLocked: locked }),
  setHasInteracted: (flag) => set({ hasInteracted: flag }),
}));
