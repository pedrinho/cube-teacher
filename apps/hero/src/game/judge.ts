// Plays a chart against key presses. Notes are judged in order: the next note can be hit while
// its timing window is open; once the window has passed it is missed. Either way the move still
// happens on the cube, so the cube always follows the song and ends solved. A half turn, once hit,
// is held: keeping its key down until its tail has gone by earns a bonus, letting go early drops it.
import { holdEnd, isHold, type Note } from "./chart";
import { keyFor, type KeyMap } from "./lanes";
import { GOOD_MS, judge, type Judgment } from "./score";

export type PlayEvent =
  | { type: "hit"; note: number; judgment: Exclude<Judgment, "miss">; offsetMs: number }
  | { type: "miss"; note: number }
  /** A key that doesn't match the note in reach. */
  | { type: "wrong"; note: number; code: string }
  /** A key with no note in reach. */
  | { type: "stray"; code: string }
  /** A half turn's key held until its tail went by. */
  | { type: "held"; note: number }
  /** A half turn's key let go too early. */
  | { type: "dropped"; note: number };

export type HoldState = "holding" | "held" | "dropped";

/** Letting go this many beats before a tail ends still counts as holding it, to reach the next key. */
export const HOLD_SLACK = 0.2;

export class Judge {
  /** How each note went, by index; notes before `next` are done. */
  readonly results: Judgment[] = [];
  /** How each half turn that was hit is being held, by note index. */
  readonly holds: (HoldState | undefined)[] = [];
  next = 0;
  /** Half turns whose key is down right now, and that key. */
  private holding: { note: number; code: string }[] = [];

  constructor(
    private readonly notes: readonly Note[],
    private readonly keys: KeyMap,
  ) {}

  get done() {
    return this.next >= this.notes.length;
  }

  /** Settles what `beat` has reached: holds whose tail has gone by, and notes whose window has closed. */
  update(beat: number, msPerBeat: number): PlayEvent[] {
    const events: PlayEvent[] = [];
    for (const h of this.holding.filter((h) => beat >= holdEnd(this.notes[h.note]))) events.push(this.endHold(h, "held"));
    while (this.next < this.notes.length && (beat - this.notes[this.next].beat) * msPerBeat > GOOD_MS) {
      this.results[this.next] = "miss";
      events.push({ type: "miss", note: this.next });
      this.next++;
    }
    return events;
  }

  /** A key (KeyboardEvent.code) pressed at `beat`: settles late notes first, then judges the press. */
  press(code: string, beat: number, msPerBeat: number): PlayEvent[] {
    const events = this.update(beat, msPerBeat);
    const note = this.notes[this.next];
    const offsetMs = note ? (beat - note.beat) * msPerBeat : Infinity;
    const judgment = judge(offsetMs);
    if (!note || !judgment) events.push({ type: "stray", code });
    else if (keyFor(note.move, this.keys) !== code) events.push({ type: "wrong", note: this.next, code });
    else {
      this.results[this.next] = judgment;
      events.push({ type: "hit", note: this.next, judgment, offsetMs });
      if (isHold(note)) {
        this.holds[this.next] = "holding";
        this.holding.push({ note: this.next, code });
      }
      this.next++;
    }
    return events;
  }

  /** A key let go at `beat`: a hold on it is held if its tail has (nearly) gone by, else dropped. */
  release(code: string, beat: number): PlayEvent[] {
    return this.holding
      .filter((h) => h.code === code)
      .map((h) => this.endHold(h, beat >= holdEnd(this.notes[h.note]) - HOLD_SLACK ? "held" : "dropped"));
  }

  /** Ends every hold in progress as held: the song was paused, and the keys let go with it. */
  settle(): PlayEvent[] {
    return [...this.holding].map((h) => this.endHold(h, "held"));
  }

  private endHold(h: { note: number; code: string }, how: "held" | "dropped"): PlayEvent {
    this.holding = this.holding.filter((other) => other !== h);
    this.holds[h.note] = how;
    return { type: how, note: h.note };
  }

  /** Starts the song over. */
  reset() {
    this.results.length = 0;
    this.holds.length = 0;
    this.holding = [];
    this.next = 0;
  }
}
