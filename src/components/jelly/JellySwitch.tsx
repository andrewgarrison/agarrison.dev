'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import useSound from 'use-sound';
import { Switch, SwitchThumb } from '@ui-sdk/react/switch';
import { MILK_PALETTES } from './palette';
import { rectOf, useJelly } from './useJelly';
import type { Rect } from './body';
import './jelly.css';

type SwitchProps = React.ComponentProps<typeof Switch>;

/**
 * UI SDK's Switch, with a jelly thumb.
 *
 * UI SDK owns the behaviour: role, keyboard, form value and the
 * `data-checked` attribute. The real SwitchThumb is still rendered and
 * positioned by CSS from that attribute; it's just invisible once the jelly
 * is ready. The jelly watches `data-checked`, measures where the thumb went,
 * and springs there.
 */
export function JellySwitch({ children, ...props }: Omit<SwitchProps, 'children'> & { children?: ReactNode }) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const pressed = useRef(false);
  const [playDown] = useSound('/audio/dock_press-down.m4a', { volume: 0.5 });
  const [playUp] = useSound('/audio/dock_press-up-2.m4a', { volume: 0.5 });

  const thumbRect = useCallback((): Rect | null => (thumbRef.current ? rectOf(thumbRef.current) : null), []);

  const jellyRef = useJelly(rootRef, canvasRef, {
    palettes: MILK_PALETTES,
    margin: 10,
    body: { params: { breathe: 0, pressMaxReach: 9, pressReach: 0.4, maxStretch: 1.9, pokeWiden: 2 } },
    onLayout: ({ body }, root) => {
      const thumb = thumbRect();
      if (!thumb) return;
      const inset = thumb.top; // same gap on every side
      body.setBounds(inset, root.clientWidth - inset);
      body.place(thumb);
    },
  });

  // Follow UI SDK's state: whenever data-checked flips, spring to the thumb.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new MutationObserver(() => {
      const jelly = jellyRef.current;
      const thumb = thumbRect();
      if (!jelly || !thumb) return;
      pressed.current = false;
      jelly.body.release(thumb);
      jelly.surface.wake();
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-checked'] });
    return () => observer.disconnect();
  }, [jellyRef, thumbRect]);

  const onPointerDown = (e: React.PointerEvent) => {
    const jelly = jellyRef.current;
    const thumb = thumbRect();
    const root = rootRef.current;
    if (!jelly || !thumb || !root || props.disabled || e.button !== 0) return;
    pressed.current = true;
    playDown();
    // Tug toward the other end.
    const w = root.clientWidth;
    jelly.body.pressToward({ ...thumb, left: w - thumb.right, right: w - thumb.left });
    jelly.surface.wake();
  };

  const letGo = () => {
    if (!pressed.current) return;
    playUp();
    // If the click toggled the switch, the observer has already sprung it over.
    // Otherwise (released off the switch), spring back.
    setTimeout(() => {
      if (!pressed.current) return;
      pressed.current = false;
      jellyRef.current?.body.release(null);
      jellyRef.current?.surface.wake();
    }, 0);
  };

  return (
    <label className="jelly-switch-label">
      {children}
      <Switch
        {...props}
        ref={rootRef}
        className="jelly-switch"
        onPointerDown={onPointerDown}
        onPointerUp={letGo}
        onPointerLeave={letGo}
        onPointerCancel={letGo}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="jelly-canvas" />
        <SwitchThumb ref={thumbRef} className="jelly-switch-thumb" />
      </Switch>
    </label>
  );
}
