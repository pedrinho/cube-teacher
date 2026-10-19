// Paint the cube face by face. Centers are fixed: the cube is held with white on top, green in front.
import { useState } from "react";
import { useI18n } from "../i18n";
import { COLORS, FACES, centerIndex, stickerIndex, type Color, type CubeState, type Face } from "../cube/model";

/** The order to walk around the cube: turning it in the hands, then tilting up and down. */
const ORDER: Face[] = ["F", "R", "B", "L", "U", "D"];

export function blankNet(): CubeState {
  return FACES.map((f) => ".".repeat(4) + ({ U: "W", R: "R", F: "G", D: "Y", L: "O", B: "B" } as const)[f] + ".".repeat(4)).join("");
}

interface Props {
  value: CubeState;
  onChange: (value: CubeState) => void;
  /** Stickers to mark as wrong. */
  marked: Set<number>;
}

export function NetEditor({ value, onChange, marked }: Props) {
  const { t } = useI18n();
  const [faceIdx, setFaceIdx] = useState(0);
  const [brush, setBrush] = useState<Color>("W");
  const face = ORDER[faceIdx];
  const counts = Object.fromEntries(COLORS.map((c) => [c, [...value].filter((v) => v === c).length]));

  const paint = (i: number) => {
    if (i === centerIndex(STICKER_FACE[i])) return;
    onChange(value.slice(0, i) + brush + value.slice(i + 1));
  };

  const colorName = (c: string) => (c === "." ? "—" : t(`color.${c as Color}`));

  return (
    <div className="net-editor">
      <div className="net-focus">
        <p className="net-count">{t("solve.face", { n: faceIdx + 1 })}</p>
        <p className="net-hold">{t(`solve.hold.${face}`)}</p>
        <div className="palette" role="radiogroup" aria-label={t("solve.palette")}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={brush === c}
              className="swatch"
              onClick={() => setBrush(c)}
            >
              <span className="swatch-chip" data-color={c} />
              <span className="swatch-name">{t(`color.${c}`)}</span>
              <span className="swatch-count" data-full={counts[c] === 9 || undefined} data-over={counts[c] > 9 || undefined}>
                {counts[c]}/9
              </span>
            </button>
          ))}
        </div>

        <div className="face-grid">
          {Array.from({ length: 9 }, (_, k) => {
            const i = stickerIndex(face, k);
            const c = value[i];
            const isCenter = k === 4;
            return (
              <button
                key={i}
                type="button"
                className="sticker"
                data-color={c}
                data-marked={marked.has(i) || undefined}
                disabled={isCenter}
                aria-label={`${k + 1}: ${colorName(c)}`}
                onClick={() => paint(i)}
              />
            );
          })}
        </div>
        <div className="btn-row">
          <button type="button" className="btn" disabled={faceIdx === 0} onClick={() => setFaceIdx(faceIdx - 1)}>
            {t("solve.prevFace")}
          </button>
          <button type="button" className="btn" disabled={faceIdx === 5} onClick={() => setFaceIdx(faceIdx + 1)}>
            {t("solve.nextFace")}
          </button>
        </div>
      </div>

      <div className="net-side">
        <div className="mini-net" aria-label={t("solve.overview")}>
          {FACES.map((f) => (
            <button
              key={f}
              type="button"
              className="mini-face"
              style={{ gridArea: f }}
              aria-pressed={f === face}
              aria-label={t(`solve.hold.${f}`)}
              onClick={() => setFaceIdx(ORDER.indexOf(f))}
            >
              {Array.from({ length: 9 }, (_, k) => {
                const i = stickerIndex(f, k);
                return <span key={k} data-color={value[i]} data-marked={marked.has(i) || undefined} />;
              })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const STICKER_FACE: Face[] = FACES.flatMap((f) => Array<Face>(9).fill(f));
