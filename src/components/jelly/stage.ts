// The stage: one animation loop for every jelly surface on the page.
//
// A surface is a 2D canvas a component owns, plus the bodies drawn on it.
// The stage steps every awake body on a fixed physics step, draws each awake
// surface through the shared renderer, and stops the loop entirely once
// everything is asleep (or off screen, or the tab is hidden).

import { STEP, type JellyBody } from './body';
import type { JellyPalette } from './palette';
import { drawSurface } from './renderer';

const MAX_FRAME = 1 / 20;

const surfaces = new Set<JellySurface>();
let raf = 0;
let last = 0;
let acc = 0;

function wakeLoop() {
  if (raf || typeof window === 'undefined' || document.visibilityState === 'hidden') return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now: number) {
  raf = 0;
  const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  acc += elapsed;
  let steps = 0;
  while (acc >= STEP) {
    acc -= STEP;
    steps++;
  }
  let anyAwake = false;
  for (const s of surfaces) {
    if (!s.awake || !s.onScreen) continue;
    s.tick(steps);
    anyAwake ||= s.awake;
  }
  if (anyAwake) raf = requestAnimationFrame(frame);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wakeLoop();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
}

/** Number of surfaces on the page (handy for checking the shared-context claim). */
export const surfaceCount = () => surfaces.size;

export class JellySurface {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private items: { body: JellyBody; palette: JellyPalette }[] = [];
  private margin: number;
  private dpr = 1;
  private observer: IntersectionObserver | null = null;
  awake = true;
  onScreen = true;

  /**
   * @param canvas absolutely positioned inside the container it measures from
   * @param margin px the canvas reaches past the container, so wobbles and the shadow aren't clipped
   */
  constructor(canvas: HTMLCanvasElement, margin = 12) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.margin = margin;
    surfaces.add(this);
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(([entry]) => {
        this.onScreen = entry.isIntersecting;
        if (this.onScreen) this.wake();
      });
      this.observer.observe(canvas);
    }
  }

  /** Match the container's size (CSS px). Call from a ResizeObserver. */
  resize(width: number, height: number) {
    const m = this.margin;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = width + m * 2;
    const cssH = height + m * 2;
    this.canvas.width = Math.max(1, Math.round(cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * this.dpr));
    Object.assign(this.canvas.style, {
      width: `${cssW}px`,
      height: `${cssH}px`,
      left: `${-m}px`,
      top: `${-m}px`,
    });
    this.wake();
  }

  add(body: JellyBody, palette: JellyPalette) {
    this.items.push({ body, palette });
    this.wake();
  }

  remove(body: JellyBody) {
    this.items = this.items.filter((item) => item.body !== body);
    this.wake();
  }

  setPalette(body: JellyBody, palette: JellyPalette) {
    const item = this.items.find((i) => i.body === body);
    if (item) item.palette = palette;
    this.wake();
  }

  /** Call after changing any body's goals. */
  wake() {
    this.awake = true;
    wakeLoop();
  }

  tick(steps: number) {
    for (const { body } of this.items) {
      for (let i = 0; i < steps; i++) body.step(STEP);
    }
    drawSurface(
      {
        ctx: this.ctx,
        width: this.canvas.width,
        height: this.canvas.height,
        dpr: this.dpr,
        origin: { x: -this.margin, y: -this.margin },
      },
      this.items,
    );
    this.awake = this.items.some(({ body }) => !body.isAsleep());
  }

  destroy() {
    surfaces.delete(this);
    this.observer?.disconnect();
    this.items = [];
  }
}
