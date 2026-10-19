// Sound, all synthesized with Web Audio (no files): a drum and bass groove on the beat, a pluck for
// every hit (each lane has its own note), and small sounds for misses and wrong keys.
import type { BeatClock } from "./clock";
import type { Lane } from "./lanes";

/** Seconds ahead that beats are scheduled, so the groove never stutters. */
const LOOKAHEAD = 0.15;

// C major pentatonic, one note per lane; prime keys play an octave lower.
const LANE_NOTE: Record<Lane, number> = { L: 72, U: 74, F: 76, D: 79, B: 81, R: 84 };
// One chord per bar: C, G, A minor, F (bass roots).
const BASS = [36, 43, 45, 41];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class Sound {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  /** Next beat (in half beats) not scheduled yet. */
  private nextHalf = 0;

  /** Starts audio; call from a click or key press. */
  start() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return; // No sound, the game still works.
      }
      this.out = this.ctx.createGain();
      this.out.gain.value = this.muted ? 0 : 0.55;
      this.out.connect(this.ctx.destination);
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  /** Audio time for a moment given as performance.now() seconds. */
  private at(perfSeconds: number) {
    return this.ctx!.currentTime + Math.max(0, perfSeconds - performance.now() / 1000);
  }

  /** Forget what was scheduled (after a pause or a jump). */
  resetGroove(beat: number) {
    this.nextHalf = Math.max(0, Math.ceil(beat * 2));
  }

  /** Schedules the groove's drums and bass up to a little ahead of the clock, until `endBeat`. */
  groove(clock: BeatClock, endBeat: number) {
    if (!this.ctx || !clock.playing) return;
    const horizon = clock.beat + LOOKAHEAD / clock.secondsPerBeat;
    while (this.nextHalf / 2 <= horizon && this.nextHalf / 2 < endBeat) {
      const half = this.nextHalf++;
      const t = this.at(clock.timeOf(half / 2));
      const beat = half / 2;
      this.hat(t, half % 2 === 0 ? 0.08 : 0.05);
      if (half % 2 === 1) continue;
      if (beat % 2 === 0) this.kick(t);
      else this.snare(t);
      this.bass(t, BASS[Math.floor(beat / 4) % 4], clock.secondsPerBeat * 0.9);
    }
  }

  hit(lane: Lane | "all", prime: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (lane === "all") for (const n of [72, 76, 79]) this.pluck(t, n, 0.12);
    else this.pluck(t, LANE_NOTE[lane] - (prime ? 12 : 0), 0.22);
  }

  miss() {
    if (!this.ctx) return;
    this.tone(this.ctx.currentTime, 110, 70, "sawtooth", 0.18, 0.12);
  }

  wrong() {
    if (!this.ctx) return;
    this.tone(this.ctx.currentTime, 180, 150, "square", 0.1, 0.06);
  }

  /** A new section starts. */
  crash(perfSeconds?: number) {
    if (!this.ctx) return;
    const t = perfSeconds === undefined ? this.ctx.currentTime : this.at(perfSeconds);
    this.noiseBurst(t, 5000, 1.2, 0.25);
  }

  /** The song is over. */
  fanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [72, 76, 79, 84].forEach((n, i) => this.pluck(t + i * 0.12, n, 0.25));
    this.noiseBurst(t + 0.36, 5000, 1.5, 0.2);
  }

  // ---- Instruments ----------------------------------------------------------------------------

  private env(t: number, peak: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(this.out!);
    return g;
  }

  private tone(t: number, from: number, to: number, type: OscillatorType, decay: number, peak: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + decay);
    osc.connect(this.env(t, peak, decay));
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }

  private kick(t: number) {
    this.tone(t, 140, 42, "sine", 0.28, 0.7);
  }

  private snare(t: number) {
    this.noiseBurst(t, 1500, 0.16, 0.22);
    this.tone(t, 200, 160, "triangle", 0.08, 0.12);
  }

  private hat(t: number, peak: number) {
    this.noiseBurst(t, 8000, 0.04, peak);
  }

  private noiseBurst(t: number, cutoff: number, decay: number, peak: number) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx!.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    src.connect(filter).connect(this.env(t, peak, decay));
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
  }

  private bass(t: number, midi: number, length: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = hz(midi);
    const filter = this.ctx!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + Math.min(length, 0.5));
    osc.connect(filter).connect(this.env(t, 0.22, Math.min(length, 0.6)));
    osc.start(t);
    osc.stop(t + Math.min(length, 0.6) + 0.05);
  }

  private pluck(t: number, midi: number, peak: number) {
    const filter = this.ctx!.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.35);
    filter.connect(this.env(t, peak, 0.45));
    for (const [type, detune] of [
      ["square", -6],
      ["triangle", 6],
    ] as const) {
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.value = hz(midi);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 0.5);
    }
  }
}

