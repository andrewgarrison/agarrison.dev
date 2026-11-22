'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import useSound from 'use-sound';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { JellyBody, type Rect as Pill } from '@/components/jelly/body';
import { JELLY_PALETTES } from '@/components/jelly/palette';
import { JellySurface } from '@/components/jelly/stage';

type Section = 'home' | 'projects' | 'about' | 'contact';

const navItems: { section: Section; label: string; path: string }[] = [
  { section: 'home', label: 'Home', path: '/' },
  { section: 'projects', label: 'Projects', path: '/projects' },
  { section: 'about', label: 'About', path: '/about' },
  { section: 'contact', label: 'Contact', path: '/contact' },
];

// Gap between the blob and the button's top and bottom edges.
const BLOB_INSET_Y = 3;
// How far the canvas reaches past the dock, so wobbles and the shadow aren't clipped.
const CANVAS_MARGIN = 12;

const sectionForPath = (path: string) => navItems.find((item) => item.path === path)?.section;

export function Dock() {
  // Each section is a real route, so the initial path comes from Next. It is the
  // same on the server and the client, which keeps hydration consistent on a
  // direct load of /about etc. After that, in-app navigation uses pushState and
  // popstate, which update activePath below.
  const initialPath = usePathname();
  const [activePath, setActivePath] = useState<string>(initialPath);
  const activePathRef = useRef(activePath);
  useEffect(() => {
    activePathRef.current = activePath;
  }, [activePath]);

  const { resolvedTheme } = useTheme();
  const [playClickDown] = useSound('/audio/dock_press-down.m4a', { volume: 0.6 });
  const [playClickUp] = useSound('/audio/dock_press-up-2.m4a', { volume: 0.6 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jellyRef = useRef<JellyBody | null>(null);
  const surfaceRef = useRef<JellySurface | null>(null);
  // The item under the finger while pressed.
  const pressed = useRef<Section | null>(null);

  const itemRefs = useRef<Record<Section, HTMLButtonElement | null>>({
    home: null,
    projects: null,
    about: null,
    contact: null,
  });

  // The blob's rest shape for an item, in dock coordinates.
  const pillFor = useCallback((section: Section): Pill | null => {
    const el = itemRefs.current[section];
    if (!el) return null;
    return {
      left: el.offsetLeft,
      right: el.offsetLeft + el.offsetWidth,
      top: el.offsetTop + BLOB_INSET_Y,
      bottom: el.offsetTop + el.offsetHeight - BLOB_INSET_Y,
    };
  }, []);

  // Create the jelly, and keep it sized to the dock.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const surface = new JellySurface(canvas, CANVAS_MARGIN);
    const jelly = new JellyBody();
    surface.add(jelly, JELLY_PALETTES[document.documentElement.classList.contains('dark') ? 'dark' : 'light']);
    jellyRef.current = jelly;
    surfaceRef.current = surface;

    const layout = () => {
      surface.resize(container.offsetWidth, container.offsetHeight);
      const first = pillFor(navItems[0].section);
      const last = pillFor(navItems[navItems.length - 1].section);
      if (first && last) jelly.setBounds(first.left - 2, last.right + 2);
      const section = sectionForPath(activePathRef.current);
      const pill = section ? pillFor(section) : null;
      if (pill) jelly.place(pill);
      surface.wake();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(container);

    // Handy for tuning the feel from devtools: window.__jelly.params
    (window as Window & { __jelly?: JellyBody }).__jelly = jelly;

    return () => {
      observer.disconnect();
      surface.destroy();
      jellyRef.current = null;
      surfaceRef.current = null;
      delete (window as Window & { __jelly?: JellyBody }).__jelly;
    };
  }, [pillFor]);

  useEffect(() => {
    const jelly = jellyRef.current;
    if (jelly) surfaceRef.current?.setPalette(jelly, JELLY_PALETTES[resolvedTheme]);
  }, [resolvedTheme]);

  // Keep the highlight and blob in sync on browser back/forward.
  useEffect(() => {
    const syncPath = () => {
      const newPath = window.location.pathname;
      activePathRef.current = newPath;
      setActivePath(newPath);
      const section = sectionForPath(newPath);
      const pill = section ? pillFor(section) : null;
      if (pill) jellyRef.current?.moveTo(pill);
      surfaceRef.current?.wake();
    };
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, [pillFor]);

  // Ask the page to navigate. It refuses mid-transition, and then the blob stays.
  const navigate = useCallback((section: Section): boolean => {
    const globalWindow = window as Window & { navigateToSection?: (section: Section) => boolean };
    if (!globalWindow.navigateToSection?.(section)) return false;
    const path = navItems.find((item) => item.section === section)?.path;
    if (path) {
      activePathRef.current = path;
      setActivePath(path);
    }
    return true;
  }, []);

  // Press: tug toward another item, or squish the active one.
  const handlePress = useCallback((section: Section) => {
    const jelly = jellyRef.current;
    if (!jelly) return;
    pressed.current = section;
    if (section === sectionForPath(activePathRef.current)) {
      jelly.pressInPlace();
      surfaceRef.current?.wake();
      return;
    }
    const pill = pillFor(section);
    if (pill) jelly.pressToward(pill);
    surfaceRef.current?.wake();
  }, [pillFor]);

  // Release: snap over if released on the pressed item, otherwise spring back.
  const handleRelease = useCallback((section: Section) => {
    const jelly = jellyRef.current;
    const wasPressed = pressed.current;
    pressed.current = null;
    if (!jelly || wasPressed === null) return;

    const isOther = section !== sectionForPath(activePathRef.current);
    if (wasPressed === section && isOther && navigate(section)) {
      jelly.release(pillFor(section));
    } else {
      jelly.release(null);
    }
    surfaceRef.current?.wake();
  }, [navigate, pillFor]);

  const handleCancel = useCallback(() => {
    if (pressed.current === null) return;
    pressed.current = null;
    jellyRef.current?.release(null);
    surfaceRef.current?.wake();
  }, []);

  // Keyboard activation (Enter/Space) arrives as a click with no pointer press.
  const handleKeyboardClick = useCallback((e: React.MouseEvent, section: Section) => {
    if (e.detail !== 0) return;
    const pill = pillFor(section);
    if (pill && navigate(section)) {
      jellyRef.current?.moveTo(pill);
      surfaceRef.current?.wake();
    }
  }, [navigate, pillFor]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    jellyRef.current?.setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    surfaceRef.current?.wake();
  }, []);

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        ref={containerRef}
        className="dock-container relative"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          jellyRef.current?.setPointer(null);
          surfaceRef.current?.wake();
        }}
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute pointer-events-none z-0" />

        {navItems.map((item) => {
          const isActive = activePath === item.path;

          return (
            <button
              key={item.section}
              ref={(el) => { itemRefs.current[item.section] = el; }}
              onMouseDown={() => {
                playClickDown();
                handlePress(item.section);
              }}
              onMouseUp={() => {
                playClickUp();
                handleRelease(item.section);
              }}
              onMouseLeave={handleCancel}
              onTouchStart={(e) => {
                e.preventDefault();
                playClickDown();
                handlePress(item.section);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                playClickUp();
                handleRelease(item.section);
              }}
              onTouchCancel={handleCancel}
              onClick={(e) => handleKeyboardClick(e, item.section)}
              className={isActive ? 'dock-item dock-item-active' : 'dock-item dock-item-inactive'}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
