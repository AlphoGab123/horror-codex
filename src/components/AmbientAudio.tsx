'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function AmbientAudio() {
  const started = useRef(false);
  const hasInteracted = useGameStore((state) => state.hasInteracted);

  useEffect(() => {
    if (!hasInteracted || started.current) return;
    started.current = true;
    const ctx = new AudioContext();
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.18;
    }
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.065;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.loop = true;
    noise.start();

    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.value = 56;
    const toneGain = ctx.createGain();
    toneGain.gain.value = 0.012;
    tone.connect(toneGain).connect(ctx.destination);
    tone.start();

    return () => {
      noise.stop();
      tone.stop();
      ctx.close();
    };
  }, [hasInteracted]);

  return null;
}
