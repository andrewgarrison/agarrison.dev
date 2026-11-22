'use client';

import { useRef, type ReactNode } from 'react';
import useSound from 'use-sound';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@ui-sdk/react/popover';
import { GLASS_PALETTES } from './palette';
import { useJelly } from './useJelly';
import type { Rect } from './body';
import './jelly.css';

// The canvas reaches this far past the panel, so the jelly can start (and end) on the trigger.
const MARGIN = 72;
// How long the panel stays mounted after closing, while the jelly shrinks back.
const EXIT_MS = 360;

/**
 * UI SDK's Popover, with a jelly surface that grows out of the trigger and
 * shrinks back into it.
 *
 * UI SDK owns placement, focus, dismissal and presence. The surface is drawn
 * on a canvas inside the content. On close, UI SDK only keeps the content
 * mounted while an animation runs that started in the same task, so we start
 * a do-nothing Web Animation for as long as the jelly needs.
 */
export function JellyPopover({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(false);
  const [playDown] = useSound('/audio/dock_press-down.m4a', { volume: 0.5 });
  const [playUp] = useSound('/audio/dock_press-up-2.m4a', { volume: 0.5 });

  const panelRect = (el: HTMLElement): Rect => ({ left: 0, top: 0, right: el.offsetWidth, bottom: el.offsetHeight });

  // The trigger's box, in the panel's space.
  const triggerRect = (): Rect | null => {
    const t = triggerRef.current?.getBoundingClientRect();
    const c = contentRef.current?.getBoundingClientRect();
    if (!t || !c) return null;
    return { left: t.left - c.left, right: t.right - c.left, top: t.top - c.top, bottom: t.bottom - c.top };
  };

  const jellyRef = useJelly(contentRef, canvasRef, {
    palettes: GLASS_PALETTES,
    margin: MARGIN,
    body: {
      radius: 20,
      params: { breathe: 0.3, maxStretch: 20, maxDisp: 14, vertK: 260, vertZ: 0.55, settleK: 300, settleZ: 0.58 },
    },
    // The panel's size settles after it opens (fonts, content): follow it.
    onLayout: ({ body }, el) => {
      if (openRef.current && el.offsetWidth > 0) body.morphTo(panelRect(el));
    },
  });

  const onOpenChange = (open: boolean) => {
    openRef.current = open;
    const jelly = jellyRef.current;
    const content = contentRef.current;
    if (!jelly || !content) return;
    if (open) {
      // Wait a frame for UI SDK to show and place the panel, then grow out of the trigger.
      requestAnimationFrame(() => {
        const from = triggerRect();
        if (!from || !openRef.current) return;
        jelly.body.place(from);
        jelly.body.opacity = 0;
        jelly.body.fadeTo(1, 16);
        jelly.body.morphTo(panelRect(content));
        jelly.surface.wake();
      });
      return;
    }
    const to = triggerRect();
    if (to) jelly.body.morphTo(to);
    jelly.body.fadeTo(0, 9);
    jelly.surface.wake();
    // Keep the panel mounted while the jelly shrinks back. Must start in this task.
    content.animate([{ outlineColor: 'transparent' }, { outlineColor: 'transparent' }], { duration: EXIT_MS });
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        ref={triggerRef}
        className="jelly-button"
        onPointerDown={() => playDown()}
        onPointerUp={() => playUp()}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent ref={contentRef} keepMounted sideOffset={10} className="jelly-popover">
        <canvas ref={canvasRef} aria-hidden="true" className="jelly-canvas" />
        <div className="jelly-popover-inner">
          <PopoverTitle className="jelly-popover-title">{title}</PopoverTitle>
          {description && <PopoverDescription className="jelly-popover-description">{description}</PopoverDescription>}
          {children}
          <PopoverClose className="jelly-button jelly-button-small">Done</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
}
