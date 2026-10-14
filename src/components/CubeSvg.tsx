// A small drawn cube (top, front and right faces) for thumbnails: cheap enough to show many per page.
import { STICKERS, type CubeState } from "../cube/model";

type Vec = readonly [number, number, number];

const project = ([x, y, z]: Vec) => [(x - z) * 0.866, -y + (x + z) * 0.5] as const;
const pointsOf = (corners: Vec[]) =>
  corners
    .map(project)
    .map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`)
    .join(" ");

const visibleFaces = STICKERS.map((s, i) => ({ ...s, i })).filter(
  (s) => s.normal[0] + s.normal[1] + s.normal[2] > 0,
);

function quad(center: Vec, normal: Vec, half: number): Vec[] {
  const axes = ([0, 1, 2] as const).filter((k) => normal[k] === 0);
  const unit = (k: number, sign: number): Vec => [k === 0 ? sign : 0, k === 1 ? sign : 0, k === 2 ? sign : 0];
  const [a, b] = axes.map((k) => (sign: number) => unit(k, sign * half));
  const add = (...vs: Vec[]): Vec => [
    vs.reduce((s, v) => s + v[0], 0),
    vs.reduce((s, v) => s + v[1], 0),
    vs.reduce((s, v) => s + v[2], 0),
  ];
  return [add(center, a(1), b(1)), add(center, a(1), b(-1)), add(center, a(-1), b(-1)), add(center, a(-1), b(1))];
}

const BODY = (["U", "F", "R"] as const).map((face) => {
  const normal: Vec = face === "U" ? [0, 1, 0] : face === "F" ? [0, 0, 1] : [1, 0, 0];
  return pointsOf(quad([normal[0] * 1.5, normal[1] * 1.5, normal[2] * 1.5], normal, 1.5));
});

export interface CubeSvgProps {
  state: CubeState;
  /** Stickers that matter; the rest are drawn gray. Defaults to all. */
  visible?: (stickerIndex: number, state: CubeState) => boolean;
  label?: string;
  className?: string;
  /** Draws the face letters U, F and R on the visible faces. */
  faceLetters?: boolean;
}

const LETTERS = [
  { text: "U", at: project([0, 1.5, 0]) },
  { text: "F", at: project([0, 0, 1.5]) },
  { text: "R", at: project([1.5, 0, 0]) },
];

export function CubeSvg({ state, visible, label, className, faceLetters }: CubeSvgProps) {
  return (
    <svg
      viewBox="-2.75 -3.15 5.5 6.3"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {BODY.map((points, k) => (
        <polygon key={k} points={points} fill="var(--cube-body)" stroke="var(--cube-body)" strokeWidth={0.12} strokeLinejoin="round" />
      ))}
      {visibleFaces.map((s) => {
        const color = state[s.i];
        const shown = visible ? visible(s.i, state) : true;
        const fill = !shown ? "var(--st-gray)" : color === "." ? "var(--st-empty)" : `var(--st-${color})`;
        const center: Vec = [s.pos[0] + s.normal[0] * 0.5, s.pos[1] + s.normal[1] * 0.5, s.pos[2] + s.normal[2] * 0.5];
        return (
          <polygon
            key={s.i}
            points={pointsOf(quad(center, s.normal, 0.4))}
            fill={fill}
            stroke={fill}
            strokeWidth={0.08}
            strokeLinejoin="round"
          />
        );
      })}
      {faceLetters &&
        LETTERS.map((l) => (
          <text key={l.text} x={l.at[0]} y={l.at[1]} className="face-letter" textAnchor="middle" dominantBaseline="central">
            {l.text}
          </text>
        ))}
    </svg>
  );
}
