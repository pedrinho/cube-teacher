// Plays a chart against key presses. Notes are judged in order: the next note can be hit while
// its timing window is open; once the window has passed it is missed. Either way the move still
// happens on the cube, so the cube always follows the song and ends solved.
import type { Note } from "./chart";
import { keyFor } from "./lanes";
import { GOOD_MS, judge, type Judgment } from "./score";

export type PlayEvent =
  | { type: "hit"; note: number; judgment: Exclude<Judgment, "miss">; offsetMs: number }
  | { type: "miss"; note: number }
  /** A key that doesn't match the note in reach. */
  | { type: "wrong"; note: number; code: string }
  /** A key with no note in reach. */
  | { type: "stray"; code: string };

export class Judge {
  /** How each note went, by index; notes before `next` are done. */
  readonly results: Judgment[] = [];
  next = 0;

  constructor(private readonly notes: readonly Note[]) {}

  get done() {
    return this.next >= this.notes.length;
  }

  /** Misses the notes whose window has closed by `beat`. */
  update(beat: number, msPerBeat: number): PlayEvent[] {
    const events: PlayEvent[] = [];
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
    else if (keyFor(note.move) !== code) events.push({ type: "wrong", note: this.next, code });
    else {
      this.results[this.next] = judgment;
      events.push({ type: "hit", note: this.next, judgment, offsetMs });
      this.next++;
    }
    return events;
  }

  /** Starts the song over. */
  reset() {
    this.results.length = 0;
    this.next = 0;
  }
}
