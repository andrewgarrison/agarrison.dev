'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import useSound from 'use-sound';
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@ui-sdk/react/tabs';
import { JELLY_PALETTES } from './palette';
import { useJelly } from './useJelly';
import type { Rect } from './body';
import './jelly.css';

const INSET_Y = 3;

export interface JellyTab {
  value: string;
  label: ReactNode;
  panel: ReactNode;
}

/**
 * UI SDK's Tabs, with the dock's jelly as the selection indicator.
 *
 * UI SDK owns the behaviour (roles, arrow keys, activation) and measures the
 * selected tab into TabsIndicator's --active-tab-* variables. The indicator
 * stays invisible; the jelly reads those variables whenever they change and
 * springs to them.
 */
export function JellyTabs({ tabs, label, defaultValue }: { tabs: JellyTab[]; label: string; defaultValue?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  const [playDown] = useSound('/audio/dock_press-down.m4a', { volume: 0.5 });
  const [playUp] = useSound('/audio/dock_press-up-2.m4a', { volume: 0.5 });

  // The selected tab's box, from UI SDK's CSS variables.
  const readIndicator = (): Rect | null => {
    const el = indicatorRef.current;
    if (!el) return null;
    const css = getComputedStyle(el);
    const n = (name: string) => parseFloat(css.getPropertyValue(name));
    const left = n('--active-tab-left');
    const width = n('--active-tab-width');
    const top = n('--active-tab-top');
    const height = n('--active-tab-height');
    if (![left, width, top, height].every(Number.isFinite) || width === 0) return null;
    return { left, right: left + width, top: top + INSET_Y, bottom: top + height - INSET_Y };
  };

  const jellyRef = useJelly(listRef, canvasRef, {
    palettes: JELLY_PALETTES,
    onLayout: ({ body }, list) => {
      const rect = readIndicator();
      const tabsEls = list.querySelectorAll<HTMLElement>('[data-slot="tabs-tab"]');
      if (tabsEls.length) {
        const first = tabsEls[0];
        const last = tabsEls[tabsEls.length - 1];
        body.setBounds(first.offsetLeft - 2, last.offsetLeft + last.offsetWidth + 2);
      }
      if (rect) body.place(rect);
    },
  });

  // Follow UI SDK's measurements. It writes the variables as inline style on the indicator.
  useEffect(() => {
    const el = indicatorRef.current;
    if (!el) return;
    let placed = false;
    const observer = new MutationObserver(() => {
      const jelly = jellyRef.current;
      const rect = readIndicator();
      if (!jelly || !rect) return;
      // First measurement, or a resize: jump. Otherwise spring.
      const first = !placed || el.dataset.activationDirection === 'none';
      placed = true;
      if (first || !jelly.body.rest) jelly.body.place(rect);
      else jelly.body.release(rect);
      pressed.current = null;
      jelly.surface.wake();
    });
    observer.observe(el, { attributes: true, attributeFilter: ['style', 'data-activation-direction'] });
    return () => observer.disconnect();
  }, [jellyRef]);

  const onPointerDown = (e: React.PointerEvent) => {
    const tab = (e.target as HTMLElement).closest<HTMLElement>('[data-slot="tabs-tab"]');
    const jelly = jellyRef.current;
    if (!tab || !jelly || e.button !== 0) return;
    pressed.current = tab;
    playDown();
    if (tab.hasAttribute('data-selected')) jelly.body.pressInPlace();
    else
      jelly.body.pressToward({
        left: tab.offsetLeft,
        right: tab.offsetLeft + tab.offsetWidth,
        top: tab.offsetTop + INSET_Y,
        bottom: tab.offsetTop + tab.offsetHeight - INSET_Y,
      });
    jelly.surface.wake();
  };

  const letGo = () => {
    if (!pressed.current) return;
    playUp();
    setTimeout(() => {
      if (!pressed.current) return;
      pressed.current = null;
      jellyRef.current?.body.release(null);
      jellyRef.current?.surface.wake();
    }, 0);
  };

  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className="jelly-tabs">
      <TabsList
        ref={listRef}
        aria-label={label}
        className="jelly-tabs-list"
        onPointerDown={onPointerDown}
        onPointerUp={letGo}
        onPointerLeave={letGo}
        onPointerCancel={letGo}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !listRef.current) return;
          const r = listRef.current.getBoundingClientRect();
          jellyRef.current?.body.setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
          jellyRef.current?.surface.wake();
        }}
        onMouseLeave={() => {
          jellyRef.current?.body.setPointer(null);
          jellyRef.current?.surface.wake();
        }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="jelly-canvas" />
        {tabs.map((t) => (
          <TabsTab key={t.value} value={t.value} className="jelly-tab">
            {t.label}
          </TabsTab>
        ))}
        <TabsIndicator ref={indicatorRef} className="jelly-tabs-indicator" />
      </TabsList>
      {tabs.map((t) => (
        <TabsPanel key={t.value} value={t.value} className="jelly-tabs-panel">
          {t.panel}
        </TabsPanel>
      ))}
    </Tabs>
  );
}
