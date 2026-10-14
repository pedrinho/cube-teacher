// Our own 3D cube in three.js: black rounded cubies with rounded stickers.
// Stickers are fixed to positions; a move animates its layer, then the colors are re-read from
// the new state and the layer snaps back. So the picture always comes straight from a CubeState.
import {
  AmbientLight,
  Color,
  DirectionalLight,
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
import { STICKERS, applyMove, moveLayer, type CubeState, type Move, type Vec } from "../cube/model";

export type Visible = (stickerIndex: number, state: CubeState) => boolean;

export type StickerColors = Record<"W" | "Y" | "G" | "B" | "R" | "O" | "gray" | "empty" | "body", string>;

const CUBIE = 0.97;
const STICKER = 0.84;
const STICKER_RADIUS = 0.13;
/** When the person taps ahead of the animation, waiting moves play faster. */
const HURRY = 0.35;
/** When more taps than this are waiting, the older ones are applied at once. */
const MAX_BEHIND = 2;

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

export class CubeScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private controls: OrbitControls;
  private root = new Group();
  private cubies = new Map<string, Group>();
  private stickers: Mesh[] = [];
  private materials: Record<string, Material> = {};
  private resize: ResizeObserver;

  private shown: CubeState;
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
    colors: StickerColors,
    initial: CubeState,
  ) {
    this.shown = initial;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.append(this.renderer.domElement);

    for (const [name, value] of Object.entries(colors)) {
      this.materials[name] =
        name === "body"
          ? new MeshStandardMaterial({ color: new Color(value), roughness: 0.8, metalness: 0 })
          : new MeshBasicMaterial({ color: new Color(value) });
    }

    this.scene.add(new AmbientLight(0xffffff, 1.2));
    const light = new DirectionalLight(0xffffff, 2.2);
    light.position.set(3, 6, 5);
    this.scene.add(light);
    this.scene.add(this.root);

    this.buildCubies();
    this.paint();

    // Front-right-top view: F on the left, R on the right, like the pictures.
    const lat = (28 * Math.PI) / 180;
    const lon = (32 * Math.PI) / 180;
    const d = 11;
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

  private buildCubies() {
    const body = new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 3, 0.09);
    const sticker = roundedSquare(STICKER, STICKER_RADIUS);
    const front = new Vector3(0, 0, 1);
    for (const x of [-1, 0, 1])
      for (const y of [-1, 0, 1])
        for (const z of [-1, 0, 1]) {
          if (x === 0 && y === 0 && z === 0) continue;
          const cubie = new Group();
          cubie.position.set(x, y, z);
          cubie.userData.home = [x, y, z] satisfies Vec;
          cubie.add(new Mesh(body, this.materials.body));
          this.cubies.set(posKey([x, y, z]), cubie);
          this.root.add(cubie);
        }
    STICKERS.forEach((s, i) => {
      const mesh = new Mesh(sticker, this.materials.gray);
      const n = new Vector3(...s.normal);
      mesh.position.copy(n).multiplyScalar(CUBIE / 2 + 0.002);
      mesh.quaternion.setFromUnitVectors(front, n);
      this.cubies.get(posKey(s.pos))!.add(mesh);
      this.stickers[i] = mesh;
    });
  }

  private paint() {
    this.stickers.forEach((mesh, i) => {
      const c = this.shown[i];
      mesh.material = !this.visible(i, this.shown) ? this.materials.gray : (this.materials[c] ?? this.materials.empty);
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
      this.shown = applyMove(this.shown, skipped.move);
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
    const { axis, inLayer } = moveLayer(item.move.base);
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
    for (const c of turn.cubies) {
      this.root.attach(c);
      c.position.set(...(c.userData.home as Vec));
      c.quaternion.identity();
    }
    this.root.remove(turn.pivot);
    this.turn = null;
    if (completed) this.shown = applyMove(this.shown, turn.move);
    this.paint();
  }

  /** The state shown once all queued moves have played. */
  get finalState(): CubeState {
    let s = this.shown;
    if (this.turn) s = applyMove(s, this.turn.move);
    for (const q of this.queue) s = applyMove(s, q.move);
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
