// Draws the highway on a canvas: a strip of black cube plastic in perspective, with sticker gems
// sliding down to a row of receptors. A gem shows its move; when the player has moved that letter
// to another key, a small keycap on the gem shows the key. Receptors show their lane's key. On the
// pyraminx, gems and receptors are triangles, and a tip's gem is a small one. The 1x1x1's one lane
// is a space bar: a wide road, with bars for notes and a bar for its receptor.
import { moveToString, type Color } from "cube-kit/cube/model";
import { LEAD_IN, type Chart, type Note } from "./chart";
import { keyFor, keyLabel, laneOfKey, letterOf, type KeyMap, type Lane } from "./lanes";
import type { Puzzle } from "./puzzles";
import type { Judgment } from "./score";

/** Beats of song visible ahead of the strike line. */
export const VISIBLE_BEATS = 5;
/** How far the road shrinks toward the horizon (far width = 1 / (1 + K)). */
const K = 2.4;
/** Notes stay visible a little past the strike line. */
const BELOW = -0.1;
const POP_MS = 550;
const FLASH_MS = 220;

export type Palette = Record<Color | "gray" | "body" | "accent" | "ink" | "text" | "textSoft" | "stage" | "line", string>;

export interface Pop {
  lane: Lane | "all";
  judgment: Judgment | "wrong";
  /** performance.now() when it happened. */
  at: number;
}

export interface HighwayFrame {
  chart: Chart;
  beat: number;
  results: readonly Judgment[];
  /** Index of the next note to play. */
  next: number;
  /** Keys held down right now. */
  held: ReadonlySet<string>;
  pops: readonly Pop[];
  now: number;
  /** Names of the sections, already translated. */
  sectionNames: readonly string[];
  /** Words for the judgments, translated. */
  words: Record<Pop["judgment"], string>;
  /** What the space bar is called, translated. */
  space: string;
}

const DARK_TEXT = new Set<string>(["W", "Y", "O"]);

export class Highway {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;

  private lanes: readonly Lane[];
  private space = "";

  constructor(
    private canvas: HTMLCanvasElement,
    private colors: Palette,
    private keys: KeyMap,
    private puzzle: Puzzle,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.lanes = puzzle.lanes;
  }

  /** Matches the canvas to its box on screen. */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---- Geometry ------------------------------------------------------------------------------

  private get horizonY() {
    return this.h * 0.04;
  }
  private get strikeY() {
    return this.h - Math.min(70, this.h * 0.13);
  }
  /** How many lanes wide the road is: a space bar is as wide as three. */
  private get columns() {
    return this.puzzle.bar ? 3 : this.lanes.length;
  }

  private get halfWidth() {
    // Lanes keep their width: fewer lanes make a narrower road.
    return Math.min(this.w * 0.48, 55 * this.columns);
  }

  private scale(z: number) {
    return 1 / (1 + K * z);
  }

  /** Screen y and road half width at depth z (0 = strike line, 1 = horizon). */
  private at(z: number) {
    const s = this.scale(z);
    const far = this.scale(1);
    const y = this.horizonY + (this.strikeY - this.horizonY) * ((s - far) / (1 - far));
    return { y, half: this.halfWidth * s, s };
  }

  private laneX(lane: number, half: number) {
    return this.w / 2 + (-1 + (2 * lane + 1) / this.lanes.length) * half;
  }

  private depth(beatsAhead: number) {
    return beatsAhead / VISIBLE_BEATS;
  }

  // ---- Drawing -------------------------------------------------------------------------------

  draw(f: HighwayFrame) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    this.space = f.space;
    const shown = f.next > 0 ? f.chart.notes[f.next - 1].after : f.chart.start;
    const faceColor = (lane: Lane) => this.puzzle.laneColor(shown, lane);

    this.road();
    this.beatLines(f.beat);
    this.sectionLines(f);

    // Tails first, then gems from far to near so nearer ones are on top.
    const first = Math.max(0, f.next - 6);
    const visible: number[] = [];
    for (let i = first; i < f.chart.notes.length; i++) {
      const z = this.depth(f.chart.notes[i].beat - f.beat);
      if (z > 1.02) break;
      if (z < BELOW - 0.15) continue;
      visible.push(i);
    }
    for (const i of visible) this.tail(f.chart.notes[i], f.beat, f.results[i]);
    for (const i of [...visible].reverse()) this.gem(f.chart.notes[i], f.beat, f.results[i]);

    this.receptors(f, faceColor);
    this.pops(f);
  }

  private road() {
    const { ctx } = this;
    const near = this.at(BELOW - 0.05);
    const far = this.at(1);
    const bottom = this.h;
    const grad = ctx.createLinearGradient(0, far.y, 0, near.y);
    grad.addColorStop(0, this.colors.stage);
    grad.addColorStop(0.25, this.colors.body);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.w / 2 - far.half, far.y);
    ctx.lineTo(this.w / 2 + far.half, far.y);
    ctx.lineTo(this.w / 2 + near.half, near.y);
    ctx.lineTo(this.w / 2 + near.half, bottom);
    ctx.lineTo(this.w / 2 - near.half, bottom);
    ctx.lineTo(this.w / 2 - near.half, near.y);
    ctx.closePath();
    ctx.fill();

    // Lane dividers.
    ctx.strokeStyle = this.colors.line;
    ctx.lineWidth = 1;
    for (let k = 1; k < this.lanes.length; k++) {
      const t = -1 + (2 * k) / this.lanes.length;
      ctx.beginPath();
      ctx.moveTo(this.w / 2 + t * far.half, far.y);
      ctx.lineTo(this.w / 2 + t * this.at(BELOW - 0.05).half, near.y);
      ctx.stroke();
    }
  }

  private beatLines(beat: number) {
    const { ctx } = this;
    for (let b = Math.ceil(beat + BELOW * VISIBLE_BEATS); b <= beat + VISIBLE_BEATS; b++) {
      const { y, half } = this.at(this.depth(b - beat));
      ctx.strokeStyle = this.colors.line;
      ctx.globalAlpha = b % 4 === 0 ? 0.9 : 0.4;
      ctx.lineWidth = b % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(this.w / 2 - half, y);
      ctx.lineTo(this.w / 2 + half, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /** A line with the step's name rides down the road one beat before the step's first note. */
  private sectionLines(f: HighwayFrame) {
    const { ctx } = this;
    f.chart.sections.forEach((s, i) => {
      const z = this.depth(s.startBeat + LEAD_IN - 1 - f.beat);
      if (z < 0 || z > 1) return;
      const { y, half, s: scale } = this.at(z);
      ctx.strokeStyle = this.colors.accent;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(this.w / 2 - half, y);
      ctx.lineTo(this.w / 2 + half, y);
      ctx.stroke();
      ctx.fillStyle = this.colors.text;
      ctx.font = `700 ${Math.round(22 * scale)}px "Lexend Variable", Lexend, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(f.sectionNames[i] ?? "", this.w / 2, y - 6 * scale);
    });
  }

  private noteColor(note: Note, result: Judgment | undefined) {
    if (result === "miss") return this.colors.gray;
    if (note.lane === "all") return this.colors.accent;
    return this.colors[this.puzzle.laneColor(note.before, note.lane)];
  }

  private tail(note: Note, beat: number, result: Judgment | undefined) {
    if (note.move.amount !== 2 || note.lane === "all" || (result && result !== "miss")) return;
    const { ctx } = this;
    const lane = this.lanes.indexOf(note.lane);
    const z0 = Math.max(this.depth(note.beat - beat), BELOW);
    const z1 = Math.min(this.depth(note.beat + note.length - 0.35 - beat), 1);
    if (z1 <= z0) return;
    const a = this.at(z0);
    const b = this.at(z1);
    const wA = (a.half / this.lanes.length) * 0.32;
    const wB = (b.half / this.lanes.length) * 0.32;
    ctx.fillStyle = this.noteColor(note, result);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.laneX(lane, a.half) - wA, a.y);
    ctx.lineTo(this.laneX(lane, b.half) - wB, b.y);
    ctx.lineTo(this.laneX(lane, b.half) + wB, b.y);
    ctx.lineTo(this.laneX(lane, a.half) + wA, a.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private gem(note: Note, beat: number, result: Judgment | undefined) {
    if (result && result !== "miss") return; // Hit notes are gone.
    const { ctx } = this;
    const z = this.depth(note.beat - beat);
    const { y, half, s } = this.at(z);
    const laneW = (2 * half) / this.columns;
    ctx.globalAlpha = z < 0 ? Math.max(0, 1 + z / 0.25) : 1;
    const fill = this.noteColor(note, result);

    if (note.lane === "all") {
      const h = laneW * 0.5;
      roundRect(ctx, this.w / 2 - half * 0.97, y - h / 2, half * 1.94, h, h * 0.3);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = Math.max(1, 3 * s);
      ctx.strokeStyle = this.colors.body;
      ctx.stroke();
      if (this.puzzle.bar) this.label(this.space, this.w / 2, y, h * 0.55, "#ffffff");
      else if (laneW > 26) {
        const text = moveToString(note.move);
        this.label(text, this.w / 2, y, h * 0.7, "#ffffff");
        const key = this.movedKey(note);
        if (key) this.keycap(key, this.w / 2 + ctx.measureText(text).width / 2 + h * 0.6, y, h * 0.75);
      }
      ctx.globalAlpha = 1;
      return;
    }

    const lane = this.lanes.indexOf(note.lane);
    const x = this.laneX(lane, half);
    const size = laneW * 0.8 * (note.shape === "tip" ? 0.62 : 1);
    const h = this.triangles ? size * 0.82 : note.shape === "wide" ? size * 0.95 : size * 0.72;
    const prime = note.move.amount === 3;

    if (prime && result !== "miss") {
      this.gemPath(x, y, size + 8 * s, h + 8 * s);
      ctx.fillStyle = this.colors.accent;
      ctx.fill();
    }
    this.gemPath(x, y, size, h);
    if (note.shape === "slice") {
      ctx.fillStyle = this.colors.body;
      ctx.fill();
      ctx.lineWidth = Math.max(2, size * 0.12);
      ctx.strokeStyle = fill;
      ctx.stroke();
    } else {
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.strokeStyle = this.colors.body;
      ctx.stroke();
      // A soft shine, like a sticker.
      if (!this.triangles) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.beginPath();
        ctx.rect(x - size / 2 + size * 0.1, y - h / 2 + h * 0.1, size * 0.8, h * 0.28);
        ctx.fill();
      }
    }

    if (size > 22) {
      const face = this.puzzle.laneColor(note.before, note.lane);
      const ink = note.shape === "slice" || result === "miss" || !DARK_TEXT.has(face) ? "#ffffff" : this.colors.ink;
      // A triangle's middle is low down.
      this.label(moveToString(note.move), x, y + (this.triangles ? h * 0.14 : -h * 0.02), h * (this.triangles ? 0.42 : 0.5), ink);
      const key = this.movedKey(note);
      if (key) this.keycap(key, x + size / 2, y + h / 2, Math.max(h * 0.5, 16));
    }
    ctx.globalAlpha = 1;
  }

  /** Pyraminx notes are triangles, like its stickers. */
  private get triangles() {
    return this.puzzle.id === "pyraminx";
  }

  /** The outline of a gem or receptor centered on (x, y): a rectangle or a sharp-cornered triangle. */
  private gemPath(x: number, y: number, w: number, h: number) {
    const { ctx } = this;
    ctx.beginPath();
    if (!this.triangles) {
      ctx.rect(x - w / 2, y - h / 2, w, h);
      return;
    }
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
  }

  /** The label of the key that plays a note, when it isn't the note's own letter. */
  private movedKey(note: Note) {
    const label = keyLabel(keyFor(note.move, this.keys));
    return label === letterOf(note.move) ? undefined : label;
  }

  /** A small light keycap, like the keys on the setup screen. */
  private keycap(text: string, x: number, y: number, size: number) {
    const { ctx } = this;
    roundRect(ctx, x - size / 2, y - size / 2, size, size, size * 0.25);
    ctx.fillStyle = this.colors.text;
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.1);
    ctx.strokeStyle = this.colors.body;
    ctx.stroke();
    this.label(text, x, y + size * 0.03, size * 0.68, this.colors.ink);
  }

  private label(text: string, x: number, y: number, size: number, color: string) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = `800 ${Math.round(size)}px "Lexend Variable", Lexend, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  /** The strike line: a receptor per lane in its color, lit while its key is down. */
  private receptors(f: HighwayFrame, faceColor: (lane: Lane) => Color) {
    const { ctx } = this;
    const { y, half } = this.at(0);
    const laneW = (2 * half) / this.lanes.length;
    const size = laneW * 0.8;
    const h = size * (this.triangles ? 0.82 : 0.72);
    const heldLanes = new Set([...f.held].map((code) => laneOfKey(code, this.keys, this.puzzle)));

    const flashing = (lane: Lane | "all") =>
      f.pops.some((p) => (p.lane === lane || p.lane === "all") && p.judgment !== "miss" && p.judgment !== "wrong" && f.now - p.at < FLASH_MS);

    if (this.puzzle.bar) {
      // One bar the shape of the notes, lit while the space bar is down.
      const barH = ((2 * half) / this.columns) * 0.5;
      const lit = heldLanes.has("all") || flashing("all");
      roundRect(ctx, this.w / 2 - half * 0.97, y - barH / 2, half * 1.94, barH, barH * 0.3);
      ctx.fillStyle = lit ? this.colors.accent : "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = this.colors.accent;
      ctx.stroke();
      this.label(this.space, this.w / 2, y, barH * 0.42, lit ? "#ffffff" : this.colors.accent);
      return;
    }

    this.lanes.forEach((lane, i) => {
      const x = this.laneX(i, half);
      const color = this.colors[faceColor(lane)];
      const lit = heldLanes.has(lane) || flashing(lane);
      this.gemPath(x, y, size, h);
      ctx.fillStyle = lit ? color : "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();
      const ink = lit ? (DARK_TEXT.has(faceColor(lane)) ? this.colors.ink : "#ffffff") : color;
      this.label(keyLabel(this.keys[lane]), x, y + (this.triangles ? h * 0.14 : 0), h * (this.triangles ? 0.4 : 0.46), ink);
    });

    // Whole-cube turns light the line across every lane.
    if (heldLanes.has("all") || flashing("all")) {
      ctx.strokeStyle = this.colors.accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(this.w / 2 - half, y + h / 2 + 8);
      ctx.lineTo(this.w / 2 + half, y + h / 2 + 8);
      ctx.stroke();
    }
  }

  private pops(f: HighwayFrame) {
    const { ctx } = this;
    const { y, half } = this.at(0);
    const laneW = (2 * half) / this.lanes.length;
    for (const p of f.pops) {
      const age = f.now - p.at;
      if (age > POP_MS || age < 0) continue;
      const x = p.lane === "all" ? this.w / 2 : this.laneX(this.lanes.indexOf(p.lane), half);
      const rise = (age / POP_MS) * laneW * 0.9;
      ctx.globalAlpha = 1 - age / POP_MS;
      const text = f.words[p.judgment];
      const color = p.judgment === "perfect" ? "#ffffff" : p.judgment === "good" ? this.colors.textSoft : this.colors.gray;
      ctx.font = `800 ${Math.round(Math.min(26, laneW * 0.32))}px "Lexend Variable", Lexend, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 4;
      ctx.strokeStyle = this.colors.body;
      ctx.strokeText(text, x, y - laneW * 0.4 - rise);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y - laneW * 0.4 - rise);
    }
    ctx.globalAlpha = 1;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}
