// Our own 3D cube in three.js: black rounded cubies with rounded stickers, or stickerless cubies
// made all of colored plastic. Stickers are fixed to positions; a move animates its layer, then the colors are re-read from
// the new state and the layer snaps back. So the picture always comes straight from a CubeState.
// The whole puzzle can also be spun to look at its other sides, which doesn't change the state.
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Shape,
  ShapeGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { STICKERS, applyMove, moveLayer, type BaseMove, type CubeState, type Move, type Vec } from "../cube/model";

export type Visible = (stickerIndex: number, state: CubeState) => boolean;

/** What the scene draws: where the cubies and stickers are, and how moves change the state. */
export interface CubeShape {
  cubies: Vec[];
  stickers: { pos: Vec; normal: Vec }[];
  apply: (state: CubeState, move: Move) => CubeState;
  moveLayer: (base: BaseMove) => { axis: Vec; inLayer: (pos: Vec) => boolean };
}

/** The 3x3: every cubie but the hidden one in the middle. */
const CUBE_3: CubeShape = {
  cubies: [-1, 0, 1].flatMap((x) =>
    [-1, 0, 1].flatMap((y) => [-1, 0, 1].flatMap((z): Vec[] => (x || y || z ? [[x, y, z]] : []))),
  ),
  stickers: STICKERS,
  apply: applyMove,
  moveLayer,
};

export type StickerColors = Record<"W" | "Y" | "G" | "B" | "R" | "O" | "gray" | "empty" | "body", string>;

const CUBIE = 0.97;
const STICKER = 0.84;
const STICKER_RADIUS = 0.13;
/** Stickerless: how much of its color the deepest part of a seam keeps (1 on the flat of a side). */
const SEAM_SHADE = 0.55;
/** When the person taps ahead of the animation, waiting moves play faster. */
const HURRY = 0.35;
/** When more taps than this are waiting, the older ones are applied at once. */
const MAX_BEHIND = 2;
/** How long spinning the whole puzzle a quarter turn takes. */
const SPIN_MS = 260;

function roundedSquare(size: number, radius: number): ShapeGeometry {
  const h = size / 2;
  const s = new Shape();
  s.moveTo(-h + radius, -h);
  s.lineTo(h - radius, -h);
  s.quadraticCurveTo(h, -h, h, -h + radius);
  s.lineTo(h, h - radius);
  s.quadraticCurveTo(h, h, h - radius, h);
  s.lineTo(-h + radius, h);
  s.quadraticCurveTo(-h, h, -h, h - radius);
  s.lineTo(-h, -h + radius);
  s.quadraticCurveTo(-h, -h, -h + radius, -h);
  return new ShapeGeometry(s, 4);
}

const posKey = (p: readonly number[]) => p.join(",");
/** The side of a BoxGeometry facing `normal`, in its order: +x, -x, +y, -y, +z, -z. */
const boxSide = (normal: Vec) => {
  const axis = normal.findIndex((c) => c !== 0);
  return axis * 2 + (normal[axis] > 0 ? 0 : 1);
};

/**
 * A stickerless cubie: every triangle of `body` goes to the outer side it lies closest to, so the
 * inner walls take that side's color instead of the black body. They are drawn darker than the
 * side itself, so the seams between pieces still show.
 */
function stickerlessBody(body: BufferGeometry, outer: Vec[]): BufferGeometry {
  const position = body.getAttribute("position");
  const normal = body.getAttribute("normal");
  const sides = outer.map((n) => new Vector3(...n));
  const p = new Vector3();
  const n = new Vector3();
  // The triangles of each outer side, by their first vertex.
  const triangles = sides.map(() => [] as number[]);
  for (let first = 0; first < position.count; first += 3) {
    const center = new Vector3();
    for (let v = first; v < first + 3; v++) center.add(p.fromBufferAttribute(position, v));
    let best = 0;
    sides.forEach((s, k) => {
      if (center.dot(s) > center.dot(sides[best])) best = k;
    });
    triangles[best].push(first);
  }
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const shades: number[] = [];
  triangles.forEach((list, k) => {
    geometry.addGroup(positions.length / 3, list.length * 3, boxSide(outer[k]));
    for (const first of list)
      for (let v = first; v < first + 3; v++) {
        p.fromBufferAttribute(position, v);
        const shade = SEAM_SHADE + (1 - SEAM_SHADE) * Math.max(0, n.fromBufferAttribute(normal, v).dot(sides[k]));
        positions.push(p.x, p.y, p.z);
        shades.push(shade, shade, shade);
      }
  });
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(shades, 3));
  return geometry;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** One move waiting to play. Moves from the same `play` call share a group. */
interface Queued {
  move: Move;
  group: number;
  /** Position of the move within its group. */
  index: number;
  onStep?: (index: number) => void;
  done?: () => void;
}

interface Turn {
  move: Move;
  group: number;
  cubies: Group[];
  pivot: Group;
  axis: Vector3;
  angle: number;
  start: number;
  duration: number;
}

/** The whole puzzle spinning to be looked at from another side. */
interface Spin {
  from: Quaternion;
  to: Quaternion;
  start: number;
  duration: number;
}

export class CubeScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private controls: OrbitControls;
  /** Holds the puzzle, and spins it to show its other sides; turns happen inside it, in `root`. */
  private view = new Group();
  private root = new Group();
  private cubies = new Map<string, Group>();
  /** Where each sticker is drawn: its own mesh, or one side of its cubie when stickerless. */
  private stickers: { mesh: Mesh; side?: number }[] = [];
  private materials: Record<string, Material> = {};
  private resize: ResizeObserver;

  private shown: CubeState;
  private visible: Visible = () => true;
  private queue: Queued[] = [];
  private turn: Turn | null = null;
  private turnDone?: () => void;
  private spinning: Spin | null = null;
  private lastGroup = -1;
  private nextGroup = 0;
  private turnMs = 450;
  private pauseMs = 250;
  private reducedMotion: boolean;
  private shape: CubeShape;

  constructor(
    private container: HTMLElement,
    colors: StickerColors,
    initial: CubeState,
    options: { fromBelow?: boolean; stickerless?: boolean; shape?: CubeShape } = {},
  ) {
    this.shape = options.shape ?? CUBE_3;
    this.shown = initial;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.append(this.renderer.domElement);

    const stickerless = options.stickerless ?? false;
    for (const [name, value] of Object.entries(colors)) {
      this.materials[name] =
        name === "body"
          ? new MeshStandardMaterial({ color: new Color(value), roughness: 0.8, metalness: 0 })
          : new MeshBasicMaterial({ color: new Color(value), vertexColors: stickerless });
    }

    this.scene.add(new AmbientLight(0xffffff, 1.2));
    const light = new DirectionalLight(0xffffff, 2.2);
    light.position.set(3, 6, 5);
    this.scene.add(light);
    this.view.add(this.root);
    this.scene.add(this.view);

    this.buildCubies(stickerless);
    this.paint();

    // Front-right-top view: F on the left, R on the right, like the pictures. Smaller puzzles are
    // seen from closer, but not so close that a 1x1x1 looks as big as a 3x3.
    const lat = ((options.fromBelow ? -28 : 28) * Math.PI) / 180;
    const lon = (32 * Math.PI) / 180;
    const size = 1 + 2 * Math.max(...this.shape.cubies.flat().map(Math.abs));
    const d = (11 * (size + 1)) / 4;
    this.camera.position.set(Math.sin(lon) * Math.cos(lat) * d, Math.sin(lat) * d, Math.cos(lon) * Math.cos(lat) * d);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.7;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = Math.PI - 0.25;
    this.controls.addEventListener("change", () => this.render());

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(container);
    this.fit();
  }

  private buildCubies(stickerless: boolean) {
    const body = new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 3, 0.09);
    // Stickerless pieces have square corners. The extra segments let the inner walls split
    // cleanly between the colors of a piece's outer sides.
    const square = new BoxGeometry(CUBIE, CUBIE, CUBIE, 8, 8, 8).toNonIndexed();
    const sticker = roundedSquare(STICKER, STICKER_RADIUS);
    const front = new Vector3(0, 0, 1);
    const { cubies, stickers } = this.shape;
    for (const pos of cubies) {
      const cubie = new Group();
      cubie.position.set(...pos);
      cubie.userData.home = pos;
      // Stickerless: one material per side, so the outer sides can take the sticker colors.
      // The whole cubie is drawn in its outer sides' colors, seams and inner walls too.
      const outer = stickers
        .filter((s) => posKey(s.pos) === posKey(pos))
        .map((s) => s.normal)
        .sort((a, b) => boxSide(a) - boxSide(b));
      cubie.add(
        stickerless
          ? new Mesh(stickerlessBody(square, outer), Array(6).fill(this.materials.body))
          : new Mesh(body, this.materials.body),
      );
      this.cubies.set(posKey(pos), cubie);
      this.root.add(cubie);
    }
    stickers.forEach((s, i) => {
      const cubie = this.cubies.get(posKey(s.pos))!;
      if (stickerless) {
        this.stickers[i] = { mesh: cubie.children[0] as Mesh, side: boxSide(s.normal) };
        return;
      }
      const mesh = new Mesh(sticker, this.materials.gray);
      const n = new Vector3(...s.normal);
      mesh.position.copy(n).multiplyScalar(CUBIE / 2 + 0.002);
      mesh.quaternion.setFromUnitVectors(front, n);
      cubie.add(mesh);
      this.stickers[i] = { mesh };
    });
  }

  private paint() {
    this.stickers.forEach(({ mesh, side }, i) => {
      const c = this.shown[i];
      const material = !this.visible(i, this.shown) ? this.materials.gray : (this.materials[c] ?? this.materials.empty);
      if (side === undefined) mesh.material = material;
      else (mesh.material as Material[])[side] = material;
    });
    this.render();
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
  setState(state: CubeState, visible?: Visible) {
    this.finishTurn(false);
    this.queue = [];
    this.lastGroup = -1;
    this.shown = state;
    this.visible = visible ?? (() => true);
    this.paint();
  }

  /** Changes which stickers are drawn gray, without touching the state. */
  setVisible(visible?: Visible) {
    this.visible = visible ?? (() => true);
    this.paint();
  }

  /** How long a quarter turn takes, and the pause between moves played together. */
  setTiming(turnMs: number, pauseMs: number) {
    this.turnMs = turnMs;
    this.pauseMs = pauseMs;
  }

  /**
   * Animates moves one after another, starting from what is shown now. Moves of one call pause
   * briefly between them; `onStep` is told which one is playing.
   */
  play(moves: Move[], options: { done?: () => void; onStep?: (index: number) => void } = {}) {
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
      // Too far behind: finish the current turn now and skip ahead.
      this.completeTurn();
      this.next();
    }
  }

  private groupsWaiting(after?: number) {
    return new Set(this.queue.filter((q) => q.group !== after).map((q) => q.group)).size;
  }

  private next() {
    // Far behind (many quick taps): jump over the older moves without animating them.
    while (this.groupsWaiting() > MAX_BEHIND + 1) {
      const skipped = this.queue.shift()!;
      this.shown = this.shape.apply(this.shown, skipped.move);
      skipped.onStep?.(skipped.index);
      skipped.done?.();
    }
    const item = this.queue.shift();
    if (!item) {
      if (!this.spinning) this.renderer.setAnimationLoop(null);
      this.lastGroup = -1;
      return;
    }
    item.onStep?.(item.index);
    const { axis, inLayer } = this.shape.moveLayer(item.move.base);
    const cubies = [...this.cubies.values()].filter((c) => inLayer(c.userData.home as Vec));
    this.paint();
    const pivot = new Group();
    this.root.add(pivot);
    for (const c of cubies) pivot.attach(c);
    const amount = item.move.amount === 3 ? -1 : item.move.amount;
    // Catch up when later taps are already waiting; otherwise pause between moves of a demo.
    const behind = this.groupsWaiting(item.group) > 0;
    const duration = this.reducedMotion ? 0 : this.turnMs * (amount === 2 ? 1.4 : 1) * (behind ? HURRY : 1);
    const pause = this.reducedMotion || behind || item.group !== this.lastGroup ? 0 : this.pauseMs;
    this.lastGroup = item.group;
    this.turn = {
      move: item.move,
      group: item.group,
      cubies,
      pivot,
      axis: new Vector3(...axis),
      // Clockwise seen from the tip of the axis is a negative rotation.
      angle: (-Math.PI / 2) * amount,
      start: performance.now() + pause,
      duration,
    };
    this.turnDone = item.done;
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private tick() {
    const now = performance.now();
    const spin = this.spinning;
    if (spin) {
      const t = spin.duration === 0 ? 1 : Math.max(0, Math.min(1, (now - spin.start) / spin.duration));
      this.view.quaternion.slerpQuaternions(spin.from, spin.to, ease(t));
      if (t >= 1) this.spinning = null;
    }
    const turn = this.turn;
    if (turn) {
      const t = turn.duration === 0 ? 1 : Math.max(0, Math.min(1, (now - turn.start) / turn.duration));
      turn.pivot.quaternion.copy(new Quaternion().setFromAxisAngle(turn.axis, turn.angle * ease(t)));
      if (t >= 1) {
        this.completeTurn();
        this.next();
      }
    }
    if (!this.turn && !this.spinning) this.renderer.setAnimationLoop(null);
    this.render();
  }

  /**
   * Spins the whole puzzle a quarter turn (`amount` 1, 2 or 3 like a move's) around an axis
   * through it, to show its other sides, without changing its state or the moves still to play.
   * The axes stay put as it spins, like a cube held in the hand: x through R, y through U and z
   * through F, clockwise seen from that side. Spins pressed quickly add up.
   */
  spin(axis: Vec, amount: 1 | 2 | 3) {
    const quarter = new Quaternion().setFromAxisAngle(new Vector3(...axis), (-Math.PI / 2) * (amount === 3 ? -1 : amount));
    const to = (this.spinning?.to ?? this.view.quaternion).clone().premultiply(quarter).normalize();
    const duration = this.reducedMotion ? 0 : SPIN_MS * (amount === 2 ? 1.4 : 1);
    this.spinning = { from: this.view.quaternion.clone(), to, start: performance.now(), duration };
    this.renderer.setAnimationLoop(() => this.tick());
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
    for (const c of turn.cubies) {
      this.root.attach(c);
      c.position.set(...(c.userData.home as Vec));
      c.quaternion.identity();
    }
    this.root.remove(turn.pivot);
    this.turn = null;
    if (completed) this.shown = this.shape.apply(this.shown, turn.move);
    this.paint();
  }

  /** The state shown once all queued moves have played. */
  get finalState(): CubeState {
    let s = this.shown;
    if (this.turn) s = this.shape.apply(s, this.turn.move);
    for (const q of this.queue) s = this.shape.apply(s, q.move);
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
