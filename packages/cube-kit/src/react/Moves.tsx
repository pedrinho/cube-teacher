// Moves drawn as keycaps. The prime mark gets the accent color so R and R' never look alike.
// Whole-cube turns (x, y, z) get a dashed outline: no layer turns, the cube is held differently.
import { isRotation, parseAlg, moveToString, type Move } from "../cube/model";

export function MoveLabel({ move }: { move: Move }) {
  return (
    <>
      {move.base}
      {move.amount === 2 && <span className="two">2</span>}
      {move.amount === 3 && <span className="prime">'</span>}
    </>
  );
}

export type MoveState = "done" | "current" | "todo";

interface MovesProps {
  alg: string | Move[];
  /** Index of the current move, if any: earlier moves look done. */
  current?: number;
  small?: boolean;
  label?: string;
}

export function Moves({ alg, current, small, label }: MovesProps) {
  const moves = typeof alg === "string" ? parseAlg(alg) : alg;
  return (
    <ol className={small ? "moves moves-small" : "moves"} aria-label={label ?? moves.map(moveToString).join(" ")}>
      {moves.map((m, i) => {
        const state: MoveState = current === undefined ? "todo" : i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li
            key={i}
            className="move"
            data-state={state}
            data-rotation={isRotation(m) || undefined}
            aria-current={state === "current" ? "step" : undefined}
          >
            <MoveLabel move={m} />
          </li>
        );
      })}
    </ol>
  );
}
