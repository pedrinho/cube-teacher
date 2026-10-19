// Draws the highway on a canvas: a strip of black cube plastic in perspective, with sticker gems
// sliding down to a row of receptors. The letter on a gem is the key that plays it.
import { centers, moveToString, type Color } from "cube-kit/cube/model";
import { LEAD_IN, type Chart, type Note } from "./chart";
import { LANES, laneOfKey, type Lane } from "./lanes";
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
}

const DARK_TEXT = new Set<string>(["W", "Y", "O"]);

export class Highway {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private colors: Palette,
  ) {
    this.ctx = canvas.getContext("2d")!;
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
  private get halfWidth() {
    return Math.min(this.w * 0.48, 330);
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
    return this.w / 2 + (-1 + (2 * lane + 1) / LANES.length) * half;
  }

  private depth(beatsAhead: number) {
    return beatsAhead / VISIBLE_BEATS;
  }

  // ---- Drawing -------------------------------------------------------------------------------

  draw(f: HighwayFrame) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    const faceColor = centers(f.next > 0 ? f.chart.notes[f.next - 1].after : f.chart.start);

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
    for (let k = 1; k < LANES.length; k++) {
      const t = -1 + (2 * k) / LANES.length;
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
    return this.colors[centers(note.before)[note.lane] as Color];
  }

  private tail(note: Note, beat: number, result: Judgment | undefined) {
    if (note.move.amount !== 2 || note.lane === "all" || (result && result !== "miss")) return;
    const { ctx } = this;
    const lane = LANES.indexOf(note.lane);
    const z0 = Math.max(this.depth(note.beat - beat), BELOW);
    const z1 = Math.min(this.depth(note.beat + note.length - 0.35 - beat), 1);
    if (z1 <= z0) return;
    const a = this.at(z0);
    const b = this.at(z1);
    const wA = (a.half / LANES.length) * 0.32;
    const wB = (b.half / LANES.length) * 0.32;
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
    const laneW = (2 * half) / LANES.length;
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
      if (laneW > 26) this.label(moveToString(note.move), this.w / 2, y, h * 0.7, "#ffffff");
      ctx.globalAlpha = 1;
      return;
    }

    const lane = LANES.indexOf(note.lane);
    const x = this.laneX(lane, half);
    const size = laneW * 0.8;
    const h = note.shape === "wide" ? size * 0.95 : size * 0.72;
    const r = size * 0.2;
    const prime = note.move.amount === 3;

    if (prime && result !== "miss") {
      roundRect(ctx, x - size / 2 - 4 * s, y - h / 2 - 4 * s, size + 8 * s, h + 8 * s, r + 4 * s);
      ctx.fillStyle = this.colors.accent;
      ctx.fill();
    }
    roundRect(ctx, x - size / 2, y - h / 2, size, h, r);
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
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      roundRect(ctx, x - size / 2 + size * 0.1, y - h / 2 + h * 0.1, size * 0.8, h * 0.28, r * 0.6);
      ctx.fill();
    }

    if (size > 22) {
      const face: string = centers(note.before)[note.lane];
      const ink = note.shape === "slice" || result === "miss" || !DARK_TEXT.has(face) ? "#ffffff" : this.colors.ink;
      this.label(moveToString(note.move), x, y - h * 0.02, h * 0.5, ink);
    }
    ctx.globalAlpha = 1;
  }

  private label(text: string, x: number, y: number, size: number, color: string) {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = `800 ${Math.round(size)}px "Lexend Variable", Lexend, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  /** The strike line: a receptor per lane in its face's color, lit while its key is down. */
  private receptors(f: HighwayFrame, faceColor: Record<string, Color>) {
    const { ctx } = this;
    const { y, half } = this.at(0);
    const laneW = (2 * half) / LANES.length;
    const size = laneW * 0.8;
    const h = size * 0.72;
    const heldLanes = new Set([...f.held].map(laneOfKey));

    const flashing = (lane: Lane | "all") =>
      f.pops.some((p) => (p.lane === lane || p.lane === "all") && p.judgment !== "miss" && p.judgment !== "wrong" && f.now - p.at < FLASH_MS);

    LANES.forEach((lane, i) => {
      const x = this.laneX(i, half);
      const color = this.colors[faceColor[lane]];
      const lit = heldLanes.has(lane) || flashing(lane);
      roundRect(ctx, x - size / 2, y - h / 2, size, h, size * 0.2);
      ctx.fillStyle = lit ? color : "rgba(255, 255, 255, 0.04)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = color;
      ctx.stroke();
      this.label(lane, x, y, h * 0.46, lit ? (DARK_TEXT.has(faceColor[lane]) ? this.colors.ink : "#ffffff") : color);
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
    const laneW = (2 * half) / LANES.length;
    for (const p of f.pops) {
      const age = f.now - p.at;
      if (age > POP_MS || age < 0) continue;
      const x = p.lane === "all" ? this.w / 2 : this.laneX(LANES.indexOf(p.lane), half);
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
