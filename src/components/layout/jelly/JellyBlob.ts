// Soft-body "jelly" indicator for the dock.
//
// Physics: the blob's two ends are springs that chase the target button (the
// leading end snaps first, the trailing end follows a beat later). Around them
// sits a ring of particles. Each particle wants to sit on a pill shape between
// the two ends, but has its own wobbly spring, a little inertia, pressure
// that keeps the area constant, and a slosh force. So the blob squashes,
// stretches, ripples and settles like a real jelly instead of tweening
// between fixed shapes.
//
// Rendering: WebGL2 draws the ring as a signed-distance field, rounded by
// ROUND px, with a bevelled normal for highlights, a rim, a glow and a soft
// shadow. Canvas 2D is the fallback.

export interface Pill {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

type RGBA = [number, number, number, number];

export interface JellyPalette {
  tintTop: RGBA; // straight alpha, 0..1
  tintBottom: RGBA;
  specular: number;
  rim: number;
  glow: number;
  stroke: number;
  shadow: number;
}

export const JELLY_PALETTES: Record<'light' | 'dark', JellyPalette> = {
  light: {
    tintTop: [0.02, 0.18, 0.32, 0.16],
    tintBottom: [0.02, 0.18, 0.32, 0.06],
    specular: 0.55,
    rim: 0.28,
    glow: 0.22,
    stroke: 0.22,
    shadow: 0.16,
  },
  dark: {
    tintTop: [0, 0, 0, 0.32],
    tintBottom: [0, 0, 0, 0.16],
    specular: 0.32,
    rim: 0.16,
    glow: 0.12,
    stroke: 0.12,
    shadow: 0.3,
  },
};

const N = 56; // particles around the ring
const ROUND = 10; // px; the ring is the pill inset by this much, then re-rounded
const STEP = 1 / 240; // fixed physics step (s)
const MAX_FRAME = 1 / 20;

// Tunables. Exposed on the instance so they can be tweaked live from devtools.
export const DEFAULT_PARAMS = {
  // End springs: stiffness k, damping ratio z.
  leadK: 420, leadZ: 0.68,
  trailK: 230, trailZ: 0.7, trailDelay: 0.055,
  settleK: 380, settleZ: 0.62,
  pressK: 520, pressZ: 0.5,
  pressReach: 0.24, // how far the leading end reaches toward the target while pressed
  pressMaxReach: 30, // px cap on that reach
  // Jelly can't stretch forever: past maxStretch × its width, the back end is
  // pulled along (and the front dragged back a little).
  maxStretch: 1.6,
  tetherK: 1400,
  tetherDrag: 0.3,
  // The dock's ends are soft walls: the jelly squashes against them.
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
  // Squish when pressing the active item.
  pokeK: 700, pokeZ: 0.28, pokeWiden: 3.5, pokeFlatten: 0.13,
  // Idle life.
  breathe: 0.5,
  hoverReach: 3,
  hoverRadius: 46,
};

type Params = typeof DEFAULT_PARAMS;

interface Spring {
  x: number;
  v: number;
  goal: number;
  k: number;
  c: number;
  wait: number; // seconds before it starts moving
}

const damping = (k: number, z: number) => 2 * z * Math.sqrt(k);

function stepSpring(s: Spring, dt: number) {
  if (s.wait > 0) {
    s.wait -= dt;
    return;
  }
  s.v += (s.k * (s.goal - s.x) - s.c * s.v) * dt;
  s.x += s.v * dt;
}

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
#define N ${N}
uniform vec2 uPts[N];
uniform vec2 uOrigin;   // container-space CSS px of the canvas top-left
uniform float uDpr;
uniform float uHeight;  // canvas height in device px
uniform float uRound;
uniform vec2 uYRange;   // blob top and bottom, for the tint gradient
uniform vec4 uTintTop;
uniform vec4 uTintBottom;
uniform vec4 uFx;       // specular, rim, glow, stroke
uniform float uShadow;
out vec4 outColor;

// Signed distance to the ring polygon (after Inigo Quilez), plus the nearest point.
float sdPoly(vec2 p, out vec2 nearest) {
  float d = 1e9;
  float s = 1.0;
  nearest = p;
  for (int i = 0, j = N - 1; i < N; j = i, i++) {
    vec2 a = uPts[i];
    vec2 e = uPts[j] - a;
    vec2 w = p - a;
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    float bb = dot(b, b);
    if (bb < d) { d = bb; nearest = p - b; }
    bvec3 c = bvec3(p.y >= a.y, p.y < uPts[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s = -s;
  }
  return s * sqrt(d);
}

vec4 over(vec4 top, vec4 bottom) { return top + bottom * (1.0 - top.a); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uHeight - gl_FragCoord.y) / uDpr + uOrigin;

  vec2 nearest;
  float d = sdPoly(p, nearest) - uRound;
  float px = 1.0 / uDpr;
  float cover = smoothstep(px, -px, d);

  // Soft drop shadow, mostly outside the body.
  vec2 nearestS;
  float ds = sdPoly(p - vec2(0.0, 2.5), nearestS) - uRound;
  float shadow = (1.0 - smoothstep(-2.0, 5.0, ds)) * smoothstep(-4.0, 1.0, d) * uShadow;
  vec4 col = vec4(0.0, 0.0, 0.0, shadow);

  if (d < px) {
    // Bevel: a quarter circle ROUND px wide around the edge, flat inside.
    float q = clamp(-d / uRound, 0.0, 1.0);
    vec2 dir = p - nearest;
    float len = length(dir);
    dir = len > 1e-4 ? dir / len : vec2(0.0);
    float inner = 1.0 - q;
    vec3 n = normalize(vec3(dir * inner, sqrt(max(0.0, 1.0 - inner * inner))));

    vec3 L = normalize(vec3(-0.35, -0.85, 0.55)); // screen y points down
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 42.0) + 0.18 * pow(max(dot(n, H), 0.0), 6.0);
    float rim = pow(1.0 - n.z, 2.5);
    // Light passing through the jelly gathers on the side away from the light.
    float glow = pow(max(dot(dir, -normalize(L.xy)), 0.0), 1.5) * inner * inner;
    float stroke = smoothstep(1.4, 0.0, abs(d + 0.6)) * (0.55 + 0.45 * max(-dir.y, 0.0));

    float t = clamp((p.y - uYRange.x) / max(uYRange.y - uYRange.x, 1.0), 0.0, 1.0);
    vec4 tint = mix(uTintTop, uTintBottom, t);
    vec4 body = vec4(tint.rgb * tint.a, tint.a);

    float light = clamp(spec * uFx.x + rim * uFx.y + glow * uFx.z + stroke * uFx.w, 0.0, 1.0);
    body = over(vec4(vec3(light), light), body);
    col = over(body * cover, col);
  }

  outColor = col;
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Jelly shader failed: ${log}`);
  }
  return sh;
}

// Point on a stadium (pill) at arc-length fraction u, clockwise from top centre.
function stadiumPoint(cx: number, cy: number, half: number, r: number, u: number) {
  const straight = half * 2;
  const perim = 2 * straight + 2 * Math.PI * r;
  let s = (((u % 1) + 1) % 1) * perim;
  if (s < half) return { x: cx + s, y: cy - r, nx: 0, ny: -1 };
  s -= half;
  if (s < Math.PI * r) {
    const a = -Math.PI / 2 + s / r;
    return { x: cx + half + r * Math.cos(a), y: cy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
  }
  s -= Math.PI * r;
  if (s < straight) return { x: cx + half - s, y: cy + r, nx: 0, ny: 1 };
  s -= straight;
  if (s < Math.PI * r) {
    const a = Math.PI / 2 + s / r;
    return { x: cx - half + r * Math.cos(a), y: cy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) };
  }
  s -= Math.PI * r;
  return { x: cx - half + s, y: cy - r, nx: 0, ny: -1 };
}

export class JellyBlob {
  params: Params = { ...DEFAULT_PARAMS };

  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private program: WebGLProgram | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private palette: JellyPalette = JELLY_PALETTES.light;
  private reducedMotion = false;

  // Layout
  private origin = { x: 0, y: 0 }; // canvas top-left in container space
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;

  // Shape state
  private left: Spring = { x: 0, v: 0, goal: 0, k: 0, c: 0, wait: 0 };
  private right: Spring = { x: 0, v: 0, goal: 0, k: 0, c: 0, wait: 0 };
  private poke: Spring = { x: 0, v: 0, goal: 0, k: 0, c: 0, wait: 0 };
  private cy = 0;
  private height = 0;
  private restWidth = 0;
  private dir = 1; // direction of the current move
  private bounds: [number, number] = [-Infinity, Infinity];
  private home: Pill | null = null; // where the blob lives when idle

  // Surface particles: displacement from the goal shape.
  private dx = new Float32Array(N);
  private dy = new Float32Array(N);
  private vx = new Float32Array(N);
  private vy = new Float32Array(N);
  private gx = new Float32Array(N);
  private gy = new Float32Array(N);
  private gnx = new Float32Array(N);
  private gny = new Float32Array(N);
  private gvx = new Float32Array(N); // goal velocity, for its acceleration
  private gvy = new Float32Array(N);
  private hasGoal = false;
  private pts = new Float32Array(N * 2);

  private pointer: { x: number; y: number } | null = null;
  private hover = 0;

  private time = 0;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private visible = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.reducedMotion =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initGL();
    this.setSpring(this.left, this.params.settleK, this.params.settleZ);
    this.setSpring(this.right, this.params.settleK, this.params.settleZ);
    this.setSpring(this.poke, this.params.pokeK, this.params.pokeZ);
  }

  get isWebGL() {
    return this.gl !== null;
  }

  private initGL() {
    const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) {
      this.ctx2d = this.canvas.getContext('2d');
      return;
    }
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
      this.gl = gl;
      this.program = prog;
      for (const name of ['uPts', 'uOrigin', 'uDpr', 'uHeight', 'uRound', 'uYRange', 'uTintTop', 'uTintBottom', 'uFx', 'uShadow']) {
        this.uniforms[name] = gl.getUniformLocation(prog, name);
      }
      gl.bindVertexArray(gl.createVertexArray());
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } catch (err) {
      console.warn(err);
      this.gl = null;
      this.ctx2d = this.canvas.getContext('2d');
    }
  }

  private setSpring(s: Spring, k: number, z: number) {
    if (this.reducedMotion) z = Math.max(z, 1);
    s.k = k;
    s.c = damping(k, z);
  }

  setPalette(p: JellyPalette) {
    this.palette = p;
  }

  // Canvas covers the container plus `margin` px on every side.
  resize(containerW: number, containerH: number, margin: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.origin = { x: -margin, y: -margin };
    this.cssW = containerW + margin * 2;
    this.cssH = containerH + margin * 2;
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    this.canvas.style.left = `${-margin}px`;
    this.canvas.style.top = `${-margin}px`;
  }

  // Inner edges of the dock: the blob squashes against them instead of passing.
  setBounds(min: number, max: number) {
    this.bounds = [min, max];
  }

  // Put the blob somewhere instantly (first paint, or after a resize).
  place(pill: Pill) {
    this.home = pill;
    for (const s of [this.left, this.right]) {
      s.v = 0;
      s.wait = 0;
    }
    this.left.x = this.left.goal = pill.left;
    this.right.x = this.right.goal = pill.right;
    this.cy = (pill.top + pill.bottom) / 2;
    this.height = pill.bottom - pill.top;
    this.restWidth = pill.right - pill.left;
    this.dx.fill(0);
    this.dy.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.hasGoal = false;
    this.start();
  }

  // Finger down on another item: the leading end tugs toward it.
  pressToward(target: Pill) {
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
    this.start();
  }

  // Finger down on the active item: squish.
  pressInPlace() {
    this.poke.goal = 1;
    this.start();
  }

  // Let go: snap to the target (or back home when target is null).
  release(target: Pill | null) {
    const p = this.params;
    this.poke.goal = 0;
    if (!this.home) return;
    if (!target) {
      this.setSpring(this.left, p.settleK, p.settleZ);
      this.setSpring(this.right, p.settleK, p.settleZ);
      this.left.goal = this.home.left;
      this.right.goal = this.home.right;
      this.left.wait = this.right.wait = 0;
      this.start();
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
    this.home = target;
    this.start();
  }

  // Jump straight to a new item (keyboard, back/forward).
  moveTo(target: Pill) {
    this.release(target);
  }

  setPointer(pt: { x: number; y: number } | null) {
    this.pointer = pt;
    this.start();
  }

  private start() {
    if (this.raf || !this.visible) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.start();
    else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private frame = (now: number) => {
    this.raf = 0;
    const elapsed = Math.min((now - this.last) / 1000, MAX_FRAME);
    this.last = now;
    this.acc += elapsed;
    while (this.acc >= STEP) {
      this.step(STEP);
      this.acc -= STEP;
    }
    this.render();
    // With reduced motion there is no idle life, so sleep once everything is still.
    if (!this.reducedMotion || !this.isSettled()) {
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private isSettled() {
    const still = (s: Spring) => Math.abs(s.v) < 0.01 && Math.abs(s.goal - s.x) < 0.01;
    return still(this.left) && still(this.right) && still(this.poke);
  }

  private computeGoal(out: { x: Float32Array; y: Float32Array; nx: Float32Array; ny: Float32Array }) {
    const p = this.params;
    const poke = this.poke.x;
    let l = this.left.x - poke * p.pokeWiden;
    let r = this.right.x + poke * p.pokeWiden;
    if (r - l < this.height) {
      const mid = (l + r) / 2;
      l = mid - this.height / 2;
      r = mid + this.height / 2;
    }
    const width = r - l;
    // Keep the volume roughly constant: thinner when long, fatter when short.
    const vol = this.reducedMotion ? 1 : Math.pow(this.restWidth / width, p.volumeExp);
    const h = this.height * Math.min(1.14, Math.max(0.76, vol)) * (1 - poke * p.pokeFlatten);

    const rad = Math.max(1, h / 2 - ROUND);
    const half = Math.max(0, (width - 2 * ROUND) / 2 - rad);
    const cx = (l + r) / 2;
    const cy = this.cy;
    const breathe = this.reducedMotion ? 0 : p.breathe;
    const t = this.time;
    const pt = this.pointer;

    for (let i = 0; i < N; i++) {
      const u = i / N;
      const s = stadiumPoint(cx, cy, half, rad, u);
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

  private scratch = { x: new Float32Array(N), y: new Float32Array(N), nx: new Float32Array(N), ny: new Float32Array(N) };

  private step(dt: number) {
    const p = this.params;
    this.time += dt;
    stepSpring(this.left, dt);
    stepSpring(this.right, dt);
    stepSpring(this.poke, dt);
    const excess = this.right.x - this.left.x - Math.max(this.restWidth, this.height) * p.maxStretch;
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
    this.restWidth += (this.home ? this.home.right - this.home.left - this.restWidth : 0) * Math.min(1, dt * 10);
    const hoverGoal = this.pointer && !this.reducedMotion ? 1 : 0;
    this.hover += (hoverGoal - this.hover) * Math.min(1, dt * 8);

    const g = this.scratch;
    const { cx, halfW } = this.computeGoal(g);

    const motion = this.reducedMotion ? 0 : 1;
    const kS = p.surfK;
    const cS = damping(p.surfK, p.surfZ);

    // Current ring positions, for pressure.
    let area = 0;
    let goalArea = 0;
    let perim = 0;
    for (let i = 0, j = N - 1; i < N; j = i, i++) {
      const xi = g.x[i] + this.dx[i], yi = g.y[i] + this.dy[i];
      const xj = g.x[j] + this.dx[j], yj = g.y[j] + this.dy[j];
      area += xj * yi - xi * yj;
      goalArea += g.x[j] * g.y[i] - g.x[i] * g.y[j];
      perim += Math.hypot(xi - xj, yi - yj);
    }
    // Ring runs clockwise on screen (y down), so the shoelace sum is positive.
    const pressure = motion * p.pressure * ((goalArea - area) * 0.5) / Math.max(perim, 1);

    for (let i = 0; i < N; i++) {
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

      const prev = (i + N - 1) % N;
      const next = (i + 1) % N;
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
    for (let i = 0; i < N; i++) {
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
  }

  private render() {
    if (!this.hasGoal) return;
    const pal = this.palette;
    if (this.gl && this.program) {
      const gl = this.gl;
      const u = this.uniforms;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.uniform2fv(u.uPts, this.pts);
      gl.uniform2f(u.uOrigin, this.origin.x, this.origin.y);
      gl.uniform1f(u.uDpr, this.dpr);
      gl.uniform1f(u.uHeight, this.canvas.height);
      gl.uniform1f(u.uRound, ROUND);
      gl.uniform2f(u.uYRange, this.cy - this.height / 2, this.cy + this.height / 2);
      gl.uniform4fv(u.uTintTop, pal.tintTop);
      gl.uniform4fv(u.uTintBottom, pal.tintBottom);
      gl.uniform4f(u.uFx, pal.specular, pal.rim, pal.glow, pal.stroke);
      gl.uniform1f(u.uShadow, pal.shadow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
    }
    const ctx = this.ctx2d;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, -this.origin.x * this.dpr, -this.origin.y * this.dpr);
    ctx.clearRect(this.origin.x, this.origin.y, this.cssW, this.cssH);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = this.pts[i * 2];
      const y = this.pts[i * 2 + 1];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    // Fill and stroke overlap, so draw opaque and apply the alpha to the canvas.
    const [r, g, b, a] = pal.tintTop;
    ctx.fillStyle = ctx.strokeStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
    this.canvas.style.opacity = String(a);
    ctx.lineJoin = 'round';
    ctx.lineWidth = ROUND * 2;
    ctx.fill();
    ctx.stroke();
  }
}
