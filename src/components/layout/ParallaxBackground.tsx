'use client';

import { useRef, useEffect } from 'react';

type Section = 'home' | 'projects' | 'about' | 'contact';

export function ParallaxBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple function to update data attribute - CSS handles the transition
    const globalWindow = window as Window & { setParallaxSection?: (section: Section) => void };
    globalWindow.setParallaxSection = (section: Section) => {
      if (bgRef.current) {
        bgRef.current.dataset.section = section;
      }
    };

    return () => {
      delete globalWindow.setParallaxSection;
    };
  }, []);

  return (
    <div
      ref={bgRef}
      className="parallax-bg"
      data-section="home"
      aria-hidden="true"
    />
  );
}
