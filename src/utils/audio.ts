/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer for high-performance sound effects (Zero external assets/mp3s required)

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMutedState(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

export function getMutedState(): boolean {
  return isMuted;
}

/**
 * 1. Play Button Click / Interaction Sound (crisp pluck)
 */
export function playClickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.11);
}

/**
 * 2. Play Rolling Digit Shuffle Tick (short, highly rapid clicking)
 */
export function playTickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.20, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * 3. Play Digit Lock sound (solid high-quality notification chime)
 */
export function playLockSound(index: number = 0) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // Root frequencies change slightly depending on the digit index
  const baseFreq = index === 0 ? 330 : index === 1 ? 392 : 523;

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.25);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(baseFreq * 2, ctx.currentTime);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.36);
  osc2.stop(ctx.currentTime + 0.36);
}

/**
 * 4. Celebrating Winning/Draw completed Sound (Ascending beautiful arpeggio)
 */
export function playSuccessSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major scale arpeggio
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.30, now + idx * 0.12);
    // Let higher notes ring a bit longer and fade beautifully
    const duration = 0.4 + (idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + duration + 0.01);
  });
}
