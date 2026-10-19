// The song's position in beats. Time comes from a clock in seconds (the audio context's, so the
// picture and the sound agree); the position is kept in beats, so a tempo change doesn't jump.

export class BeatClock {
  private anchorTime = 0;
  private anchorBeat = 0;
  private running = false;

  constructor(
    private now: () => number,
    private tempo: number,
  ) {}

  /** Beats per minute (here: quarter turns per minute). */
  get bpm() {
    return this.tempo;
  }

  get playing() {
    return this.running;
  }

  get beat(): number {
    return this.running ? this.anchorBeat + ((this.now() - this.anchorTime) * this.tempo) / 60 : this.anchorBeat;
  }

  play() {
    if (this.running) return;
    this.anchorTime = this.now();
    this.running = true;
  }

  pause() {
    if (!this.running) return;
    this.anchorBeat = this.beat;
    this.running = false;
  }

  seek(beat: number) {
    this.anchorBeat = beat;
    this.anchorTime = this.now();
  }

  setBpm(bpm: number) {
    this.anchorBeat = this.beat;
    this.anchorTime = this.now();
    this.tempo = bpm;
  }

  /** The clock time (seconds) at which a beat will be reached, while playing. */
  timeOf(beat: number): number {
    return this.anchorTime + ((beat - this.anchorBeat) * 60) / this.tempo;
  }

  /** Seconds per beat. */
  get secondsPerBeat() {
    return 60 / this.tempo;
  }
}
