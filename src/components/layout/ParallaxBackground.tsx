'use client';

import { useRef, useEffect } from 'react';

type Section = 'home' | 'projects' | 'about' | 'contact';

// Night sits underneath and is always fully opaque; day sits on top and is
// faded out by the `html.dark` class (see globals.css). Keeping the bottom
// layer painted means a theme switch never exposes an unpainted frame.
export function ParallaxBackground() {
  const dayRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSection = (section: Section) => {
      if (dayRef.current) dayRef.current.dataset.section = section;
      if (nightRef.current) nightRef.current.dataset.section = section;
    };

    const globalWindow = window as Window & { setParallaxSection?: (section: Section) => void };
    globalWindow.setParallaxSection = updateSection;

    return () => {
      delete globalWindow.setParallaxSection;
    };
  }, []);

  return (
    <>
      <div
        ref={nightRef}
        className="parallax-bg parallax-bg-night"
        data-section="home"
        aria-hidden="true"
      />
      <div
        ref={dayRef}
        className="parallax-bg parallax-bg-day"
        data-section="home"
        aria-hidden="true"
      />
    </>
  );
}
