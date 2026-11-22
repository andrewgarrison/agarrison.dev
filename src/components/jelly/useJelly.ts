'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { JellyBody, type BodyOptions, type Rect } from './body';
import type { JellyPalette } from './palette';
import { JellySurface } from './stage';

export interface Jelly {
  body: JellyBody;
  surface: JellySurface;
}

/**
 * Creates a surface on `canvasRef` (sized to `containerRef`) with one body on
 * it, and keeps its palette in step with the theme. `onLayout` runs on mount
 * and whenever the container resizes; place the body there.
 */
export function useJelly(
  containerRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: {
    palettes: Record<'light' | 'dark', JellyPalette>;
    margin?: number;
    body?: BodyOptions;
    onLayout?: (jelly: Jelly, container: HTMLElement) => void;
  },
) {
  const { resolvedTheme } = useTheme();
  const jellyRef = useRef<Jelly | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const opts = optionsRef.current;
    const surface = new JellySurface(canvas, opts.margin ?? 12);
    const body = new JellyBody(opts.body);
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    surface.add(body, opts.palettes[theme]);
    const jelly = { body, surface };
    jellyRef.current = jelly;

    const layout = () => {
      surface.resize(container.offsetWidth, container.offsetHeight);
      optionsRef.current.onLayout?.(jelly, container);
      surface.wake();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(container);
    container.dataset.jelly = 'ready';

    return () => {
      observer.disconnect();
      surface.destroy();
      delete container.dataset.jelly;
      jellyRef.current = null;
    };
  }, [canvasRef, containerRef]);

  useEffect(() => {
    const jelly = jellyRef.current;
    jelly?.surface.setPalette(jelly.body, optionsRef.current.palettes[resolvedTheme]);
  }, [resolvedTheme]);

  return jellyRef;
}

/** An element's box in its offsetParent's space, optionally inset. */
export function rectOf(el: HTMLElement, inset = 0): Rect {
  return {
    left: el.offsetLeft + inset,
    right: el.offsetLeft + el.offsetWidth - inset,
    top: el.offsetTop + inset,
    bottom: el.offsetTop + el.offsetHeight - inset,
  };
}
