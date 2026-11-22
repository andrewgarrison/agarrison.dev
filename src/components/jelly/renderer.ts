// One WebGL2 context for every jelly on the page.
//
// Browsers only allow about 16 live WebGL contexts per page, so components
// don't get their own. Each component has a plain 2D canvas (its "surface"),
// and the shared renderer draws that surface's bodies into an offscreen WebGL
// canvas, then copies the pixels across with drawImage. Surfaces keep their
// own place in the page, so jelly can sit behind a component's text.
//
// The shader draws a body's ring as a signed-distance field, rounded by ROUND
// px, with a bevelled normal for highlights, a rim, a glow and a soft shadow.
// Canvas 2D is the fallback.

import { RING, ROUND, type JellyBody } from './body';
import type { JellyPalette } from './palette';

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
#define N ${RING}
uniform vec2 uPts[N];
uniform vec2 uOrigin;   // surface-space CSS px of the viewport's top-left
uniform float uDpr;
uniform float uHeight;  // viewport height in device px
uniform float uRound;
uniform vec2 uYRange;   // body top and bottom, for the tint gradient
uniform vec4 uTintTop;
uniform vec4 uTintBottom;
uniform vec4 uFx;       // specular, rim, glow, stroke
uniform float uShadow;
uniform float uOpacity;
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

  outColor = col * uOpacity;
}`;

const UNIFORMS = [
  'uPts', 'uOrigin', 'uDpr', 'uHeight', 'uRound', 'uYRange',
  'uTintTop', 'uTintBottom', 'uFx', 'uShadow', 'uOpacity',
] as const;

export interface DrawTarget {
  ctx: CanvasRenderingContext2D;
  width: number; // device px
  height: number;
  dpr: number;
  origin: { x: number; y: number }; // surface-space CSS px of the canvas top-left
}

export interface DrawItem {
  body: JellyBody;
  palette: JellyPalette;
}

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

class GLRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private u = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  lost = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 1;
    const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) throw new Error('No WebGL2');
    this.gl = gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    this.program = prog;
    for (const name of UNIFORMS) this.u[name] = gl.getUniformLocation(prog, name);
    gl.bindVertexArray(gl.createVertexArray());
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.SCISSOR_TEST);
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.lost = true;
    });
  }

  draw(target: DrawTarget, items: DrawItem[]) {
    const { gl, u } = this;
    const w = target.width;
    const h = target.height;
    // Grow the shared canvas to fit the biggest surface (never shrink: resizing clears it anyway).
    if (this.canvas.width < w || this.canvas.height < h) {
      this.canvas.width = Math.max(this.canvas.width, w);
      this.canvas.height = Math.max(this.canvas.height, h);
    }
    // Draw in the canvas's bottom-left w×h (GL's origin), which is its top-left
    // in image space once we subtract from the height below.
    gl.viewport(0, 0, w, h);
    gl.scissor(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(u.uOrigin, target.origin.x, target.origin.y);
    gl.uniform1f(u.uDpr, target.dpr);
    gl.uniform1f(u.uHeight, h);
    gl.uniform1f(u.uRound, ROUND);
    for (const { body, palette: pal } of items) {
      if (!body.ready || body.opacity <= 0.001) continue;
      const [top, bottom] = body.yRange;
      gl.uniform2fv(u.uPts, body.pts);
      gl.uniform2f(u.uYRange, top, bottom);
      gl.uniform4fv(u.uTintTop, pal.tintTop);
      gl.uniform4fv(u.uTintBottom, pal.tintBottom);
      gl.uniform4f(u.uFx, pal.specular, pal.rim, pal.glow, pal.stroke);
      gl.uniform1f(u.uShadow, pal.shadow);
      gl.uniform1f(u.uOpacity, body.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // Copy across in the same task, before the drawing buffer is discarded.
    const ctx = target.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(this.canvas, 0, this.canvas.height - h, w, h, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Canvas 2D fallback: flat fill, rounded by stroking ROUND px around the ring.
let scratch: HTMLCanvasElement | null = null;

function draw2d(target: DrawTarget, items: DrawItem[]) {
  const { ctx, width, height, dpr, origin } = target;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  scratch ??= document.createElement('canvas');
  if (scratch.width < width || scratch.height < height) {
    scratch.width = Math.max(scratch.width, width);
    scratch.height = Math.max(scratch.height, height);
  }
  const sc = scratch.getContext('2d')!;
  for (const { body, palette } of items) {
    if (!body.ready || body.opacity <= 0.001) continue;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, width, height);
    sc.setTransform(dpr, 0, 0, dpr, -origin.x * dpr, -origin.y * dpr);
    sc.beginPath();
    for (let i = 0; i < RING; i++) {
      const x = body.pts[i * 2];
      const y = body.pts[i * 2 + 1];
      if (i === 0) sc.moveTo(x, y);
      else sc.lineTo(x, y);
    }
    sc.closePath();
    // Fill and stroke overlap, so draw opaque here and apply the alpha when copying.
    const [r, g, b, a] = palette.tintTop;
    sc.fillStyle = sc.strokeStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
    sc.lineJoin = 'round';
    sc.lineWidth = ROUND * 2;
    sc.fill();
    sc.stroke();
    ctx.globalAlpha = a * body.opacity;
    ctx.drawImage(scratch, 0, 0, width, height, 0, 0, width, height);
    ctx.globalAlpha = 1;
  }
}

let shared: GLRenderer | null | undefined;

function getGL(): GLRenderer | null {
  if (shared === undefined || shared?.lost) {
    try {
      shared = new GLRenderer();
    } catch (err) {
      console.warn(err);
      shared = null;
    }
  }
  return shared;
}

export const isWebGL = () => getGL() !== null;

export function drawSurface(target: DrawTarget, items: DrawItem[]) {
  const gl = getGL();
  if (gl) gl.draw(target, items);
  else draw2d(target, items);
}
