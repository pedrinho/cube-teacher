// The top layer seen from above, with the top row of each side around it (front at the bottom),
// like the last-layer pictures in Cinoto's guide. Arrows can show where top pieces need to go.
import { CORNER_SLOTS, EDGE_SLOTS, stickerIndex, type Color, type CubeState } from "../cube/model";
import { homeOf } from "../cube/pieces";

interface Cell {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const GAP = 0.08;
const STRIP = 0.42;
const cells: Cell[] = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) cells.push({ index: stickerIndex("U", r * 3 + c), x: 1 + c, y: 1 + r, w: 1, h: 1 });
for (let c = 0; c < 3; c++) {
  // Each side's top row, placed next to the top face edge it touches.
  cells.push({ index: stickerIndex("F", c), x: 1 + c, y: 4 + GAP, w: 1, h: STRIP });
  cells.push({ index: stickerIndex("B", c), x: 1 + (2 - c), y: 1 - GAP - STRIP, w: 1, h: STRIP });
  cells.push({ index: stickerIndex("R", c), x: 4 + GAP, y: 1 + (2 - c), w: STRIP, h: 1 });
  cells.push({ index: stickerIndex("L", c), x: 1 - GAP - STRIP, y: 1 + c, w: STRIP, h: 1 });
}

/** Center of the top-face cell where a top-layer slot's U sticker is. */
function topCell(slot: { stickers: number[]; faces: string[] }) {
  const u = slot.stickers[slot.faces.indexOf("U")];
  const k = u - stickerIndex("U", 0);
  return { x: 1.5 + (k % 3), y: 1.5 + Math.floor(k / 3) };
}

function arrowsFor(state: CubeState) {
  const top = [...EDGE_SLOTS, ...CORNER_SLOTS].filter((s) => s.faces.includes("U"));
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const slot of top) {
    const colors = slot.stickers.map((i) => state[i] as Color);
    const home = homeOf(state, colors);
    if (home.name === slot.name) continue;
    const a = topCell(slot);
    const b = topCell(home);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const trim = 0.28 / len;
    out.push({
      x1: a.x + (b.x - a.x) * trim,
      y1: a.y + (b.y - a.y) * trim,
      x2: b.x - (b.x - a.x) * trim,
      y2: b.y - (b.y - a.y) * trim,
    });
  }
  return out;
}

interface Props {
  state: CubeState;
  visible?: (stickerIndex: number, state: CubeState) => boolean;
  /** Draws arrows from each top piece to its place (for the last steps). */
  arrows?: boolean;
  label?: string;
  className?: string;
}

export function TopView({ state, visible, arrows, label, className }: Props) {
  const fill = (i: number) => (visible && !visible(i, state) ? "var(--st-gray)" : `var(--st-${state[i]})`);
  return (
    <svg
      viewBox="0.35 0.35 4.3 4.3"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <marker id="tv-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
      </defs>
      <rect x={1 - GAP} y={1 - GAP} width={3 + 2 * GAP} height={3 + 2 * GAP} rx={0.2} fill="var(--cube-body)" />
      {cells.map((cell) => (
        <rect
          key={cell.index}
          x={cell.x + GAP / 2}
          y={cell.y + GAP / 2}
          width={cell.w - GAP}
          height={cell.h - GAP}
          rx={0.12}
          fill={fill(cell.index)}
          stroke="var(--cube-body)"
          strokeWidth={0.04}
        />
      ))}
      {arrows &&
        arrowsFor(state).map((a, k) => (
          <line
            key={k}
            {...a}
            stroke="var(--ink)"
            strokeWidth={0.13}
            strokeLinecap="round"
            markerEnd="url(#tv-head)"
          />
        ))}
    </svg>
  );
}
