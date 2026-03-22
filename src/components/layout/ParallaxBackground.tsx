'use client';

import { useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

type Section = 'home' | 'projects' | 'about' | 'contact';

export function ParallaxBackground() {
  const dayRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

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

  const isDark = resolvedTheme === 'dark';

  return (
    <>
      <div
        ref={dayRef}
        className="parallax-bg parallax-bg-day"
        data-section="home"
        aria-hidden="true"
        style={{ opacity: isDark ? 0 : 1 }}
      />
      <div
        ref={nightRef}
        className="parallax-bg parallax-bg-night"
        data-section="home"
        aria-hidden="true"
        style={{ opacity: isDark ? 1 : 0 }}
      />
    </>
  );
}
