// Our own 3D pyraminx in three.js: a black tetrahedron with rounded triangle stickers, or
// stickerless, all colored plastic. Like the cube, stickers are fixed to positions; a move turns
// its layer, then the colors are re-read from the new state and the layer snaps back. While a
// layer turns, the black body is drawn as two parts cut where the layer ends, so both stay solid.
// Stickerless has no body: the cut is closed with the colors of the pieces next to it, darker,
// like the inside walls of the stickerless cube. The turn queue works like the cube's.
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CORNERS,
  CORNER_POS,
  PYRA_FACES,
  PYRA_STICKERS,
  applyPyraMove,
  cornerOf,
  cutOf,
  isTip,
  type Corner,
  type PieceKind,
  type PyraBase,
  type PyraMove,
  type PyraState,
} from "../pyraminx/model";
import type { StickerColors, Visible } from "./cubeScene";

/** Distance from the center to a corner. */
const SIZE = 2;
/** How much of its triangle a sticker covers. */
const STICKER = 0.8;
/** Stickerless: how much of a piece's side is at full color; it darkens toward its edges. */
const FLAT = 0.84;
/** Stickerless: how much of its color a seam, or the inside of a piece, keeps (as on the cube). */
const SEAM_SHADE = 0.55;
/** How far along each side a sticker's corners are rounded. */
const ROUNDING = 0.16;
const HURRY = 0.35;
const MAX_BEHIND = 2;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const corner = (c: Corner) => new Vector3(...CORNER_POS[c]).multiplyScalar(SIZE);
const middle = (pts: Vector3[]) => pts.reduce((sum, p) => sum.add(p), new Vector3()).divideScalar(pts.length);

/**
 * Triangles as one geometry, each wound so it faces `out` (away from the center unless given).
 * Colors, one per corner of each triangle, become vertex colors.
 */
function facing(triangles: Vector3[][], colors?: Color[][], out?: Vector3): BufferGeometry {
  const positions: number[] = [];
  const rgb: number[] = [];
  triangles.forEach(([a, b, c], k) => {
    const away = out ?? middle([a, b, c]);
    const order = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).dot(away) > 0 ? [0, 1, 2] : [0, 2, 1];
    for (const v of order) {
      const p = [a, b, c][v];
      positions.push(p.x, p.y, p.z);
      if (colors) rgb.push(colors[k][v].r, colors[k][v].g, colors[k][v].b);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute("color", new Float32BufferAttribute(rgb, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** A stickerless piece's side: the whole triangle, darkening toward the edges where pieces meet. */
function seamedGeometry(triangle: Vector3[]): BufferGeometry {
  const mid = middle(triangle);
  const inner = triangle.map((p) => mid.clone().lerp(p, FLAT));
  const flat = new Color(1, 1, 1);
  const seam = new Color(SEAM_SHADE, SEAM_SHADE, SEAM_SHADE);
  const triangles = [inner];
  const colors = [[flat, flat, flat]];
  for (let k = 0; k < 3; k++) {
    const n = (k + 1) % 3;
    triangles.push([triangle[k], triangle[n], inner[n]], [triangle[k], inner[n], inner[k]]);
    colors.push([seam, seam, flat], [seam, flat, flat]);
  }
  return facing(triangles, colors);
}

/** A sticker: its triangle shrunk toward its middle, with rounded corners. */
function stickerGeometry(triangle: Vector3[]): BufferGeometry {
  const mid = middle(triangle);
  const pts = triangle.map((p) => mid.clone().lerp(p, STICKER));
  const outline: Vector3[] = [];
  pts.forEach((v, k) => {
    const from = v.clone().lerp(pts[(k + 2) % 3], ROUNDING);
    const to = v.clone().lerp(pts[(k + 1) % 3], ROUNDING);
    for (let s = 0; s <= 4; s++) {
      const t = s / 4;
      outline.push(
        from
          .clone()
          .multiplyScalar((1 - t) ** 2)
          .addScaledVector(v, 2 * t * (1 - t))
          .addScaledVector(to, t * t),
      );
    }
  });
  return facing(outline.map((p, k) => [mid, p, outline[(k + 1) % outline.length]]));
}

/** One piece of a turn's cut: a triangle of it, and the stickers right above and below it. */
interface CutPart {
  triangle: Vector3[];
  above: number;
  below: number;
}

const stickerAt = (face: string, kind: PieceKind, corners: Corner[]) =>
  PYRA_STICKERS.findIndex((s) => s.face === face && s.kind === kind && s.corners.length === corners.length && corners.every((c) => s.corners.includes(c)));

/**
 * Where a move cuts the puzzle: a triangle across it, a third (tip) or two thirds (layer) of the
 * way from the corner. On each face around the corner, a tip's cut has the tip above it and the
 * corner's center below. A layer's cut has two edges above it and two other corners' centers
 * below, one for each half.
 */
function cutParts(base: PyraBase): CutPart[] {
  const c = cornerOf(base);
  const at = (o: Corner) => corner(c).lerp(corner(o), isTip(base) ? 1 / 3 : 2 / 3);
  const mid = middle(CORNERS.filter((o) => o !== c).map(at));
  const parts: CutPart[] = [];
  for (const face of PYRA_FACES) {
    const onFace = PYRA_STICKERS.filter((s) => s.face === face && s.kind === "tip").map((s) => s.corners[0]);
    if (!onFace.includes(c)) continue;
    const [o1, o2] = onFace.filter((o) => o !== c);
    if (isTip(base)) {
      parts.push({ triangle: [mid, at(o1), at(o2)], above: stickerAt(face, "tip", [c]), below: stickerAt(face, "center", [c]) });
      continue;
    }
    const half = at(o1).add(at(o2)).multiplyScalar(0.5);
    parts.push({ triangle: [mid, at(o1), half], above: stickerAt(face, "edge", [c, o1]), below: stickerAt(face, "center", [o1]) });
    parts.push({ triangle: [mid, half, at(o2)], above: stickerAt(face, "edge", [c, o2]), below: stickerAt(face, "center", [o2]) });
  }
  return parts;
}

interface Queued {
  move: PyraMove;
  group: number;
  index: number;
  onStep?: (index: number) => void;
  done?: () => void;
}

interface Turn {
  move: PyraMove;
  group: number;
  stickers: Mesh[];
  /** Stickerless: the two sides of the cut. */
  caps: Mesh[];
  pivot: Group;
  axis: Vector3;
  angle: number;
  start: number;
  duration: number;
}

export class PyraminxScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private controls: OrbitControls;
  private root = new Group();
  private stickers: Mesh[] = [];
  private materials: Record<string, Material> = {};
  private capMaterial = new MeshBasicMaterial({ vertexColors: true });
  private stickerless: boolean;
  /** The whole body, and the two parts it is drawn as while a layer turns. */
  private body: Mesh;
  private still: Mesh;
  private turning: Mesh;
  private stillCut = new Plane();
  private turningCut = new Plane();
  private resize: ResizeObserver;

  private shown: PyraState;
  private visible: Visible = () => true;
  private queue: Queued[] = [];
  private turn: Turn | null = null;
  private turnDone?: () => void;
  private lastGroup = -1;
  private nextGroup = 0;
  private turnMs = 450;
  private pauseMs = 250;
  private reducedMotion: boolean;

  constructor(
    private container: HTMLElement,
    private colors: StickerColors,
    initial: PyraState,
    options: { stickerless?: boolean } = {},
  ) {
    this.shown = initial;
    this.stickerless = options.stickerless ?? false;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.localClippingEnabled = true;
    container.append(this.renderer.domElement);

    for (const [name, value] of Object.entries(colors))
      if (name !== "body") this.materials[name] = new MeshBasicMaterial({ color: new Color(value), vertexColors: this.stickerless });
    const plastic = (clippingPlanes: Plane[]) =>
      new MeshStandardMaterial({ color: new Color(colors.body), roughness: 0.8, metalness: 0, side: DoubleSide, clippingPlanes });

    this.scene.add(new AmbientLight(0xffffff, 1.2));
    const light = new DirectionalLight(0xffffff, 2.2);
    light.position.set(3, 6, 5);
    this.scene.add(light);
    this.scene.add(this.root);

    const tetra = facing(CORNERS.map((c) => CORNERS.filter((o) => o !== c).map(corner)));
    this.body = new Mesh(tetra, plastic([]));
    this.still = new Mesh(tetra, plastic([this.stillCut]));
    this.turning = new Mesh(tetra, plastic([this.turningCut]));
    this.body.visible = !this.stickerless;
    this.still.visible = this.turning.visible = false;
    this.root.add(this.body, this.still, this.turning);

    for (const s of PYRA_STICKERS) {
      const triangle = s.triangle.map((p) => new Vector3(...p).multiplyScalar(SIZE));
      const mesh = new Mesh(this.stickerless ? seamedGeometry(triangle) : stickerGeometry(triangle), this.materials.gray);
      // Stickers sit just above the body, so it never flickers through.
      if (!this.stickerless)
        mesh.geometry.translate(...(new Vector3(...s.normal).multiplyScalar(0.003).toArray() as [number, number, number]));
      this.stickers.push(mesh);
      this.root.add(mesh);
    }
    this.paint();

    // From the front, a little above and to the right: green in front, blue on the right.
    const lat = (22 * Math.PI) / 180;
    const lon = (55 * Math.PI) / 180;
    const d = 11;
    this.camera.position.set(Math.sin(lon) * Math.cos(lat) * d, Math.sin(lat) * d, Math.cos(lon) * Math.cos(lat) * d);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Look at the middle of the puzzle's height, not its center, so it sits in the middle.
    this.controls.target.set(0, SIZE / 3 - 0.2, 0);
    this.controls.update();
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.7;
    this.controls.addEventListener("change", () => this.render());

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(container);
    this.fit();
  }

  private colorName(i: number) {
    const c = this.shown[i];
    return !this.visible(i, this.shown) ? "gray" : c in this.materials ? c : "empty";
  }

  private paint() {
    this.stickers.forEach((mesh, i) => (mesh.material = this.materials[this.colorName(i)]));
    this.render();
  }

  /**
   * Stickerless: the two sides of a move's cut, each in the darkened colors of the pieces next
   * to it. The turning side faces away from the corner, the still side toward it.
   */
  private caps(base: PyraBase, axis: Vector3): [Mesh, Mesh] {
    const parts = cutParts(base);
    const side = (pick: (p: CutPart) => number, out: Vector3) =>
      new Mesh(
        facing(
          parts.map((p) => p.triangle),
          parts.map((p) => {
            const c = new Color(this.colors[this.colorName(pick(p)) as keyof StickerColors]).multiplyScalar(SEAM_SHADE);
            return [c, c, c];
          }),
          out,
        ),
        this.capMaterial,
      );
    return [side((p) => p.above, axis.clone().negate()), side((p) => p.below, axis)];
  }

  private fit() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** Shows a state right away, dropping any moves still waiting to play. */
  setState(state: PyraState, visible?: Visible) {
    this.finishTurn(false);
    this.queue = [];
    this.lastGroup = -1;
    this.shown = state;
    this.visible = visible ?? (() => true);
    this.paint();
  }

  setVisible(visible?: Visible) {
    this.visible = visible ?? (() => true);
    this.paint();
  }

  setTiming(turnMs: number, pauseMs: number) {
    this.turnMs = turnMs;
    this.pauseMs = pauseMs;
  }

  /** Animates moves one after another, starting from what is shown now. */
  play(moves: PyraMove[], options: { done?: () => void; onStep?: (index: number) => void } = {}) {
    const group = this.nextGroup++;
    moves.forEach((move, index) =>
      this.queue.push({
        move,
        group,
        index,
        onStep: options.onStep,
        done: index === moves.length - 1 ? options.done : undefined,
      }),
    );
    if (moves.length === 0) options.done?.();
    if (!this.turn) this.next();
    else if (this.groupsWaiting(this.turn.group) > MAX_BEHIND) {
      this.completeTurn();
      this.next();
    }
  }

  private groupsWaiting(after?: number) {
    return new Set(this.queue.filter((q) => q.group !== after).map((q) => q.group)).size;
  }

  private next() {
    while (this.groupsWaiting() > MAX_BEHIND + 1) {
      const skipped = this.queue.shift()!;
      this.shown = applyPyraMove(this.shown, skipped.move);
      skipped.onStep?.(skipped.index);
      skipped.done?.();
    }
    const item = this.queue.shift();
    if (!item) {
      this.renderer.setAnimationLoop(null);
      this.lastGroup = -1;
      return;
    }
    item.onStep?.(item.index);
    const unit = new Vector3(...CORNER_POS[cornerOf(item.move.base)]);
    const cut = cutOf(item.move.base);
    const stickers = this.stickers.filter((_, i) => new Vector3(...PYRA_STICKERS[i].center).dot(unit) > cut);
    this.paint();

    // The body splits where the layer ends; the turning part goes round with the stickers.
    this.turningCut.set(unit, -cut * SIZE);
    this.stillCut.set(unit.clone().negate(), cut * SIZE);
    this.body.visible = false;
    this.still.visible = this.turning.visible = !this.stickerless;
    const pivot = new Group();
    this.root.add(pivot);
    pivot.attach(this.turning);
    for (const s of stickers) pivot.attach(s);
    const caps = this.stickerless ? this.caps(item.move.base, unit) : [];
    if (caps.length) {
      pivot.add(caps[0]);
      this.root.add(caps[1]);
    }

    const behind = this.groupsWaiting(item.group) > 0;
    const duration = this.reducedMotion ? 0 : this.turnMs * (behind ? HURRY : 1);
    const pause = this.reducedMotion || behind || item.group !== this.lastGroup ? 0 : this.pauseMs;
    this.lastGroup = item.group;
    this.turn = {
      move: item.move,
      group: item.group,
      stickers,
      caps,
      pivot,
      axis: unit,
      // A third of a turn; clockwise seen from the corner is a negative rotation.
      angle: ((-2 * Math.PI) / 3) * (item.move.amount === 3 ? -1 : 1),
      start: performance.now() + pause,
      duration,
    };
    this.turnDone = item.done;
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private tick() {
    const turn = this.turn;
    if (!turn) return;
    const t = turn.duration === 0 ? 1 : Math.max(0, Math.min(1, (performance.now() - turn.start) / turn.duration));
    turn.pivot.quaternion.copy(new Quaternion().setFromAxisAngle(turn.axis, turn.angle * ease(t)));
    if (t >= 1) {
      this.completeTurn();
      this.next();
    } else {
      this.render();
    }
  }

  private completeTurn() {
    this.finishTurn(true);
    const done = this.turnDone;
    this.turnDone = undefined;
    done?.();
  }

  /** Puts the turning layer back in place; applies the move to the colors if it completed. */
  private finishTurn(completed: boolean) {
    const turn = this.turn;
    if (!turn) return;
    for (const mesh of [...turn.stickers, this.turning]) {
      this.root.attach(mesh);
      mesh.position.set(0, 0, 0);
      mesh.quaternion.identity();
    }
    for (const cap of turn.caps) {
      cap.removeFromParent();
      cap.geometry.dispose();
    }
    this.root.remove(turn.pivot);
    this.body.visible = !this.stickerless;
    this.still.visible = this.turning.visible = false;
    this.turn = null;
    if (completed) this.shown = applyPyraMove(this.shown, turn.move);
    this.paint();
  }

  /** The state shown once all queued moves have played. */
  get finalState(): PyraState {
    let s = this.shown;
    if (this.turn) s = applyPyraMove(s, this.turn.move);
    for (const q of this.queue) s = applyPyraMove(s, q.move);
    return s;
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resize.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
