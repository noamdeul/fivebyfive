import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * - idle:     nothing to show
 * - resting:  counting down to the end of the rest
 * - overtime: rest is over but the next set hasn't started; counts up
 * - lifting:  "Start set" was tapped; counts up until the set is marked done
 */
export type RestPhase = 'idle' | 'resting' | 'overtime' | 'lifting';

export interface RestTimerView {
  phase: RestPhase;
  /** Seconds left while resting; seconds elapsed in overtime / lifting. */
  seconds: number;
  durationSec: number;
  /** 0..1 fraction elapsed, for a progress ring. */
  progress: number;
}

/**
 * Derives a live countdown from the persisted `endsAt` timestamp. Because the
 * source of truth is a timestamp (not a ticking counter), the countdown stays
 * accurate after the screen sleeps or the app is backgrounded.
 */
/** Short WebAudio beep so the timer is noticeable without an audio asset. */
function playBeep() {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch {
    // Audio may be unavailable (e.g. autoplay policy); fail silently.
  }
}

export function useRestTimer(): RestTimerView {
  const rest = useAppStore((s) => s.rest);
  const sound = useAppStore((s) => s.settings.sound);
  const [now, setNow] = useState(() => Date.now());

  const ticking = rest.endsAt != null || rest.setStartedAt != null;
  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  // Fire vibration/sound once the rest crosses zero. The bar stays up in
  // overtime so "Start set" is still there when the lifter is ready.
  useEffect(() => {
    if (rest.endsAt == null) return;
    const msLeft = rest.endsAt - Date.now();
    if (msLeft <= 0) return;
    const id = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([200, 100, 200]);
      }
      if (sound) playBeep();
    }, msLeft);
    return () => clearTimeout(id);
  }, [rest.endsAt, sound]);

  if (rest.setStartedAt != null) {
    const seconds = Math.max(0, Math.floor((now - rest.setStartedAt) / 1000));
    return { phase: 'lifting', seconds, durationSec: rest.durationSec, progress: 0 };
  }

  if (rest.endsAt == null) {
    return { phase: 'idle', seconds: 0, durationSec: rest.durationSec, progress: 0 };
  }

  const remainingMs = rest.endsAt - now;
  if (remainingMs <= 0) {
    return { phase: 'overtime', seconds: Math.floor(-remainingMs / 1000), durationSec: rest.durationSec, progress: 1 };
  }

  const durationSec = rest.durationSec || 1;
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / (durationSec * 1000)));
  return { phase: 'resting', seconds: Math.ceil(remainingMs / 1000), durationSec, progress };
}
