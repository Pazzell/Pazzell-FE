const MUTE_KEY = "pazzell_sound_muted";

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.18
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playSuccessSound() {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 523.25, now, 0.14); // C5
  playTone(ctx, 659.25, now + 0.09, 0.18); // E5
  playTone(ctx, 784.0, now + 0.18, 0.22); // G5
}

export function playWrongSound() {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 200, now, 0.22, "sawtooth", 0.12);
  playTone(ctx, 150, now + 0.08, 0.26, "sawtooth", 0.1);
}
