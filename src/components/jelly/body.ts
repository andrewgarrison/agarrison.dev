// Jelly physics, with no DOM or drawing.
//
// A body's four edges are springs that chase a target rectangle. On a
// sideways move the leading end snaps first and the trailing end follows a
// beat later. Around the edges sits a ring of particles. Each particle wants
// to sit on a rounded rectangle between the edges, but has its own wobbly
// spring, a little inertia, pressure that keeps the area constant, and a
// slosh force. So the body squashes, stretches, ripples and settles like a
// real jelly instead of tweening between fixed shapes.
//
// Coordinates are CSS px in whatever space the owner measures in (usually its
// surface's container). The renderer reads `pts`.

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const RING = 56; // particles around the ring
export const ROUND = 10; // px; the ring is the shape inset by this much, then re-rounded by the renderer
export const STEP = 1 / 240; // fixed physics step (s)

// Tunables. Each body has its own copy, so they can be tweaked live.
export const DEFAULT_PARAMS = {
  // End springs: stiffness k, damping ratio z.
  leadK: 420, leadZ: 0.68,
  trailK: 230, trailZ: 0.7, trailDelay: 0.055,
  settleK: 380, settleZ: 0.62,
  pressK: 520, pressZ: 0.5,
  pressReach: 0.24, // how far the leading end reaches toward the target while pressed
  pressMaxReach: 30, // px cap on that reach
  // Top and bottom edges (used when a body grows or shrinks, like a popover).
  vertK: 300, vertZ: 0.62,
  // Jelly can't stretch forever: past maxStretch × its width, the back end is
  // pulled along (and the front dragged back a little).
  maxStretch: 1.6,
  tetherK: 1400,
  tetherDrag: 0.3,
  // Soft walls (e.g. the dock's ends): the jelly squashes against them.
  wallK: 5000,
  wallZ: 0.9,
  // Surface particles.
  surfK: 650, surfZ: 0.09, // wobble spring (low damping = jiggly)
  inertia: 0.05, // share of the goal's acceleration the surface feels
  slosh: 0.045, // jelly piles up at the back when accelerating
  pressure: 900, // keeps the area, turning a squashed end into a bulge
  smooth: 2200, // couples neighbours so ripples travel
  maxDisp: 9,
  // Volume: thin when stretched, fat when squashed.
  volumeExp: 0.4,
  volumeMin: 0.76,
  volumeMax: 1.14,
  // Squish when pressing in place.
  pokeK: 700, pokeZ: 0.28, pokeWiden: 3.5, pokeFlatten: 0.13,
  // Idle life. A body with breathe 0 goes to sleep once it settles.
  breathe: 0.5,
  hoverReach: 3,
  hoverRadius: 46,
};

export type JellyParams = typeof DEFAULT_PARAMS;

interface Spring {
  x: number;
  v: number;
  goal: number;
  k: number;
  c: number;
  wait: number; // seconds before it starts moving
}

const spring = (): Spring => ({ x: 0, v: 0, goal: 0, k: 0, c: 0, wait: 0 });
const damping = (k: number, z: number) => 2 * z * Math.sqrt(k);

function stepSpring(s: Spring, dt: number) {
  if (s.wait > 0) {
    s.wait -= dt;
    return;
  }
  s.v += (s.k * (s.goal - s.x) - s.c * s.v) * dt;
  s.x += s.v * dt;
}

const still = (s: Spring) => Math.abs(s.v) < 0.01 && Math.abs(s.goal - s.x) < 0.01;

// Point on a rounded rectangle at arc-length fraction u, clockwise from top
// centre. hw/hh are half the width/height; r is the corner radius.
function roundedRectPoint(cx: number, cy: number, hw: number, hh: number, r: number, u: number) {
  const sx = Math.max(0, hw - r); // half the straight top/bottom
  const sy = Math.max(0, hh - r); // half the straight sides
  const arc = (Math.PI / 2) * r;
  const perim = 4 * sx + 4 * sy + 4 * arc;
  let s = (((u % 1) + 1) % 1) * perim;
  const corner = (ox: number, oy: number, a0: number) => {
    const a = a0 + s / r;
    return { x: ox + r * Math.cos(a), y: oy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
  };
  if (s < sx) return { x: cx + s, y: cy - hh, nx: 0, ny: -1 };
  s -= sx;
  if (s < arc) return corner(cx + sx, cy - sy, -Math.PI / 2);
  s -= arc;
  if (s < 2 * sy) return { x: cx + hw, y: cy - sy + s, nx: 1, ny: 0 };
  s -= 2 * sy;
  if (s < arc) return corner(cx + sx, cy + sy, 0);
  s -= arc;
  if (s < 2 * sx) return { x: cx + sx - s, y: cy + hh, nx: 0, ny: 1 };
  s -= 2 * sx;
  if (s < arc) return corner(cx - sx, cy + sy, Math.PI / 2);
  s -= arc;
  if (s < 2 * sy) return { x: cx - hw, y: cy + sy - s, nx: -1, ny: 0 };
  s -= 2 * sy;
  if (s < arc) return corner(cx - sx, cy - sy, Math.PI);
  s -= arc;
  return { x: cx - sx + s, y: cy - hh, nx: 0, ny: -1 };
}

export interface BodyOptions {
  /** Corner radius in px. Leave out for a pill (fully round ends). */
  radius?: number;
  params?: Partial<JellyParams>;
  reducedMotion?: boolean;
}

export class JellyBody {
  params: JellyParams;
  /** Ring points, x/y interleaved, ready for the renderer. */
  readonly pts = new Float32Array(RING * 2);
  /** Overall opacity, 0..1. Use fadeTo to change it smoothly. */
  opacity = 1;
  private opacityGoal = 1;
  private fadeRate = 10;
  /** False until the first step, and while hidden. */
  ready = false;

  private radius: number | undefined;
  private reducedMotion: boolean;

  private left = spring();
  private right = spring();
  private top = spring();
  private bottom = spring();
  private poke = spring();
  private restWidth = 0;
  private dir = 1; // direction of the current sideways move
  private bounds: [number, number] = [-Infinity, Infinity];
  private home: Rect | null = null; // where the body lives when idle

  // Surface particles: displacement from the goal shape.
  private dx = new Float32Array(RING);
  private dy = new Float32Array(RING);
  private vx = new Float32Array(RING);
  private vy = new Float32Array(RING);
  private gx = new Float32Array(RING);
  private gy = new Float32Array(RING);
  private gvx = new Float32Array(RING); // goal velocity, for its acceleration
  private gvy = new Float32Array(RING);
  private hasGoal = false;
  private scratch = {
    x: new Float32Array(RING),
    y: new Float32Array(RING),
    nx: new Float32Array(RING),
    ny: new Float32Array(RING),
  };

  private pointer: { x: number; y: number } | null = null;
  private hover = 0;
  private time = 0;

  constructor(options: BodyOptions = {}) {
    this.params = { ...DEFAULT_PARAMS, ...options.params };
    this.radius = options.radius;
    this.reducedMotion =
      options.reducedMotion ??
      (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const p = this.params;
    for (const s of [this.left, this.right]) this.setSpring(s, p.settleK, p.settleZ);
    for (const s of [this.top, this.bottom]) this.setSpring(s, p.vertK, p.vertZ);
    this.setSpring(this.poke, p.pokeK, p.pokeZ);
  }

  /** Vertical centre and height of the current shape (for the tint gradient). */
  get yRange(): [number, number] {
    return [this.top.x, this.bottom.x];
  }

  get rest(): Rect | null {
    return this.home;
  }

  private setSpring(s: Spring, k: number, z: number) {
    if (this.reducedMotion) z = Math.max(z, 1);
    s.k = k;
    s.c = damping(k, z);
  }

  /** Soft walls on the left and right: the body squashes against them. */
  setBounds(min: number, max: number) {
    this.bounds = [min, max];
  }

  /** Put the body somewhere instantly (first paint, or after a resize). */
  place(rect: Rect) {
    this.home = rect;
    const edges: [Spring, number][] = [
      [this.left, rect.left],
      [this.right, rect.right],
      [this.top, rect.top],
      [this.bottom, rect.bottom],
    ];
    for (const [s, x] of edges) {
      s.x = s.goal = x;
      s.v = 0;
      s.wait = 0;
    }
    this.restWidth = rect.right - rect.left;
    this.dx.fill(0);
    this.dy.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.hasGoal = false;
  }

  /** Finger down on another target: the leading end tugs toward it. */
  pressToward(target: Rect) {
    if (!this.home) return;
    const p = this.params;
    const dir = Math.sign(target.left - this.home.left) || 1;
    this.dir = dir;
    const lead = dir > 0 ? this.right : this.left;
    const trail = dir > 0 ? this.left : this.right;
    const from = dir > 0 ? this.home.right : this.home.left;
    const to = dir > 0 ? target.right : target.left;
    const reach = Math.max(-p.pressMaxReach, Math.min(p.pressMaxReach, (to - from) * p.pressReach));
    this.setSpring(lead, p.pressK, p.pressZ);
    this.setSpring(trail, p.pressK, p.pressZ);
    lead.goal = from + reach;
    lead.wait = 0;
    // Wind up: the back end leans away a touch.
    trail.goal = (dir > 0 ? this.home.left : this.home.right) - dir * 2;
    trail.wait = 0;
  }

  /** Finger down on the body itself: squish. */
  pressInPlace() {
    this.poke.goal = 1;
  }

  /** Let go: snap to the target, or back home when target is null. */
  release(target: Rect | null) {
    const p = this.params;
    this.poke.goal = 0;
    if (!this.home) return;
    if (!target) {
      this.setSpring(this.left, p.settleK, p.settleZ);
      this.setSpring(this.right, p.settleK, p.settleZ);
      this.left.goal = this.home.left;
      this.right.goal = this.home.right;
      this.left.wait = this.right.wait = 0;
      return;
    }
    const dir = Math.sign(target.left - this.home.left) || 1;
    this.dir = dir;
    const lead = dir > 0 ? this.right : this.left;
    const trail = dir > 0 ? this.left : this.right;
    this.setSpring(lead, p.leadK, p.leadZ);
    this.setSpring(trail, p.trailK, p.trailZ);
    lead.wait = 0;
    trail.wait = this.reducedMotion ? 0 : p.trailDelay;
    this.left.goal = target.left;
    this.right.goal = target.right;
    this.top.goal = target.top;
    this.bottom.goal = target.bottom;
    this.home = target;
  }

  /** Jump straight to a new target (keyboard, back/forward). */
  moveTo(target: Rect) {
    this.release(target);
  }

  /** Grow or shrink to a rectangle with every edge springing on its own (popovers). */
  morphTo(target: Rect) {
    const p = this.params;
    this.setSpring(this.left, p.settleK, p.settleZ);
    this.setSpring(this.right, p.settleK, p.settleZ);
    for (const s of [this.left, this.right, this.top, this.bottom]) s.wait = 0;
    this.left.goal = target.left;
    this.right.goal = target.right;
    this.top.goal = target.top;
    this.bottom.goal = target.bottom;
    this.restWidth = target.right - target.left;
    this.home = target;
  }

  /** Ease opacity toward `goal`; rate is roughly 1/seconds. */
  fadeTo(goal: number, rate = 10) {
    this.opacityGoal = goal;
    this.fadeRate = rate;
    if (this.reducedMotion) this.opacity = goal;
  }

  setPointer(pt: { x: number; y: number } | null) {
    this.pointer = pt;
  }

  /** True when nothing is moving and nothing will move on its own. */
  isAsleep() {
    if (!this.home) return true;
    const idle = this.reducedMotion || this.params.breathe === 0;
    if (!idle || this.hover > 0.001 || this.pointer) return false;
    if (Math.abs(this.opacity - this.opacityGoal) > 0.002) return false;
    if (![this.left, this.right, this.top, this.bottom, this.poke].every(still)) return false;
    for (let i = 0; i < RING; i++) {
      if (Math.abs(this.vx[i]) > 0.02 || Math.abs(this.vy[i]) > 0.02) return false;
    }
    return true;
  }

  private computeGoal() {
    const out = this.scratch;
    const p = this.params;
    const poke = this.poke.x;
    const height = Math.max(1, this.bottom.x - this.top.x);
    const cy = (this.top.x + this.bottom.x) / 2;
    let l = this.left.x - poke * p.pokeWiden;
    let r = this.right.x + poke * p.pokeWiden;
    if (r - l < Math.min(height, 2 * ROUND + 2)) {
      const mid = (l + r) / 2;
      const w = Math.min(height, 2 * ROUND + 2);
      l = mid - w / 2;
      r = mid + w / 2;
    }
    const width = r - l;
    // Keep the volume roughly constant: thinner when long, fatter when short.
    const vol = this.reducedMotion ? 1 : Math.pow(Math.max(this.restWidth, 1) / width, p.volumeExp);
    const h = height * Math.min(p.volumeMax, Math.max(p.volumeMin, vol)) * (1 - poke * p.pokeFlatten);

    const hw = Math.max(0.5, width / 2 - ROUND);
    const hh = Math.max(0.5, h / 2 - ROUND);
    const corner = Math.max(1, Math.min(this.radius === undefined ? Infinity : this.radius - ROUND, hw, hh));
    const cx = (l + r) / 2;
    const breathe = this.reducedMotion ? 0 : p.breathe;
    const t = this.time;
    const pt = this.pointer;

    for (let i = 0; i < RING; i++) {
      const u = i / RING;
      const s = roundedRectPoint(cx, cy, hw, hh, corner, u);
      let x = s.x;
      let y = s.y;
      // Idle: two slow waves travelling round the surface.
      const b = breathe * (0.6 * Math.sin(t * 1.7 + u * Math.PI * 4) + 0.4 * Math.sin(t * 2.6 - u * Math.PI * 6 + 1.3));
      x += s.nx * b;
      y += s.ny * b;
      // Reach toward a nearby cursor.
      if (pt && this.hover > 0.001) {
        const ex = pt.x - x;
        const ey = pt.y - y;
        const dist = Math.hypot(ex, ey);
        if (dist < p.hoverRadius && dist > 0.001) {
          const f = (1 - dist / p.hoverRadius) ** 2 * p.hoverReach * this.hover;
          x += (ex / dist) * f;
          y += (ey / dist) * f;
        }
      }
      out.x[i] = x;
      out.y[i] = y;
      out.nx[i] = s.nx;
      out.ny[i] = s.ny;
    }
    return { cx, halfW: width / 2 };
  }

  step(dt: number) {
    if (!this.home) return;
    const p = this.params;
    this.time += dt;
    this.opacity += (this.opacityGoal - this.opacity) * Math.min(1, dt * this.fadeRate);
    for (const s of [this.left, this.right, this.top, this.bottom, this.poke]) stepSpring(s, dt);
    const height = this.bottom.x - this.top.x;
    const excess = this.right.x - this.left.x - Math.max(this.restWidth, height) * p.maxStretch;
    if (excess > 0) {
      const lead = this.dir > 0 ? this.right : this.left;
      const trail = this.dir > 0 ? this.left : this.right;
      trail.wait = 0;
      trail.v += this.dir * p.tetherK * excess * dt;
      lead.v -= this.dir * p.tetherK * p.tetherDrag * excess * dt;
    }
    const wallC = damping(p.wallK, p.wallZ);
    const [minX, maxX] = this.bounds;
    if (this.left.x < minX) this.left.v += (p.wallK * (minX - this.left.x) - wallC * Math.min(this.left.v, 0)) * dt;
    if (this.right.x > maxX) this.right.v -= (p.wallK * (this.right.x - maxX) + wallC * Math.max(this.right.v, 0)) * dt;
    this.restWidth += (this.home.right - this.home.left - this.restWidth) * Math.min(1, dt * 10);
    const hoverGoal = this.pointer && !this.reducedMotion ? 1 : 0;
    this.hover += (hoverGoal - this.hover) * Math.min(1, dt * 8);

    const g = this.scratch;
    const { cx, halfW } = this.computeGoal();

    const motion = this.reducedMotion ? 0 : 1;
    const kS = p.surfK;
    const cS = damping(p.surfK, p.surfZ);

    // Current ring positions, for pressure.
    let area = 0;
    let goalArea = 0;
    let perim = 0;
    for (let i = 0, j = RING - 1; i < RING; j = i, i++) {
      const xi = g.x[i] + this.dx[i], yi = g.y[i] + this.dy[i];
      const xj = g.x[j] + this.dx[j], yj = g.y[j] + this.dy[j];
      area += xj * yi - xi * yj;
      goalArea += g.x[j] * g.y[i] - g.x[i] * g.y[j];
      perim += Math.hypot(xi - xj, yi - yj);
    }
    // Ring runs clockwise on screen (y down), so the shoelace sum is positive.
    const pressure = motion * p.pressure * ((goalArea - area) * 0.5) / Math.max(perim, 1);

    for (let i = 0; i < RING; i++) {
      // Goal velocity and acceleration (finite differences over the fixed step).
      let ax = 0;
      let ay = 0;
      if (this.hasGoal) {
        const nvx = (g.x[i] - this.gx[i]) / dt;
        const nvy = (g.y[i] - this.gy[i]) / dt;
        ax = (nvx - this.gvx[i]) / dt;
        ay = (nvy - this.gvy[i]) / dt;
        this.gvx[i] = nvx;
        this.gvy[i] = nvy;
      }
      // Guard against one-frame spikes (e.g. a resize).
      const aMax = 2e5;
      ax = Math.max(-aMax, Math.min(aMax, ax));
      ay = Math.max(-aMax, Math.min(aMax, ay));

      const prev = (i + RING - 1) % RING;
      const next = (i + 1) % RING;
      const lapX = (this.dx[prev] + this.dx[next]) * 0.5 - this.dx[i];
      const lapY = (this.dy[prev] + this.dy[next]) * 0.5 - this.dy[i];

      const nx = g.nx[i];
      const ny = g.ny[i];
      // Slosh: when accelerating right, the left side bulges and the right thins.
      const xn = halfW > 0 ? (g.x[i] - cx) / halfW : 0;
      const slosh = -ax * xn * p.slosh * motion;

      let fx = -kS * this.dx[i] - cS * this.vx[i] - ax * p.inertia * motion + p.smooth * lapX;
      let fy = -kS * this.dy[i] - cS * this.vy[i] - ay * p.inertia * motion + p.smooth * lapY;
      fx += nx * (pressure + slosh);
      fy += ny * (pressure + slosh);

      this.vx[i] += fx * dt;
      this.vy[i] += fy * dt;
    }

    const m = p.maxDisp;
    for (let i = 0; i < RING; i++) {
      this.dx[i] = Math.max(-m, Math.min(m, this.dx[i] + this.vx[i] * dt));
      this.dy[i] = Math.max(-m, Math.min(m, this.dy[i] + this.vy[i] * dt));
      this.gx[i] = g.x[i];
      this.gy[i] = g.y[i];
      this.pts[i * 2] = g.x[i] + this.dx[i];
      this.pts[i * 2 + 1] = g.y[i] + this.dy[i];
    }
    if (!this.hasGoal) {
      this.gvx.fill(0);
      this.gvy.fill(0);
      this.hasGoal = true;
    }
    this.ready = true;
  }
}
