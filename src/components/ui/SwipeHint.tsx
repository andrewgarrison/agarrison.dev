'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const SEEN_KEY = 'swipeHintSeen';
// Let the hero name finish animating in before the hint appears.
const SHOW_DELAY = 1.6;

// A one-time "‹‹‹ Swipe" hint above the dock, shown on touch screens the first
// time the home section is on screen. Add ?swipe-hint to the URL to see it again.
export function SwipeHint({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const eligible = useRef<boolean | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Decided once, on the first run.
    if (eligible.current === null) {
      const force = new URLSearchParams(window.location.search).has('swipe-hint');
      let seen = false;
      try {
        seen = localStorage.getItem(SEEN_KEY) === '1';
      } catch {}
      const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      eligible.current = force || (touch && !seen);
    }

    // Leaving home (or swiping) before or during the hint cuts it short.
    if (!visible) {
      if (timeline.current) {
        timeline.current.kill();
        timeline.current = null;
        gsap.to(el, { opacity: 0, y: 4, duration: 0.25, ease: 'power2.in' });
      }
      return;
    }

    if (!eligible.current || timeline.current) return;

    const chevrons = el.querySelectorAll('.swipe-hint-chevron');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline({
      delay: SHOW_DELAY,
      onStart: () => {
        // Counted as seen once it actually appears.
        eligible.current = false;
        try {
          localStorage.setItem(SEEN_KEY, '1');
        } catch {}
      },
      onComplete: () => {
        timeline.current = null;
      },
    });

    tl.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });

    if (!reduceMotion) {
      // Chevrons light up right-to-left, the way the finger moves.
      tl.fromTo(
        [...chevrons].reverse(),
        { opacity: 0.25, x: 0 },
        {
          keyframes: [
            { opacity: 1, x: -3, duration: 0.25, ease: 'power1.out' },
            { opacity: 0.25, x: 0, duration: 0.45, ease: 'power1.in' },
          ],
          stagger: 0.12,
          repeat: 2,
          repeatDelay: 0.25,
        },
        '-=0.2'
      );
    } else {
      tl.to({}, { duration: 2.5 });
    }

    tl.to(el, { opacity: 0, y: 4, duration: 0.6, ease: 'power2.in' }, '+=0.4');
    timeline.current = tl;
  }, [visible]);

  useEffect(() => () => {
    timeline.current?.kill();
    timeline.current = null;
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-28 z-40 flex justify-center pointer-events-none md:hidden" aria-hidden="true">
      <div
        ref={ref}
        className="swipe-hint flex items-center gap-2 text-white/85 text-[11px] uppercase tracking-[0.2em] drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
        style={{ opacity: 0 }}
      >
        <span className="flex items-center -space-x-1">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              className="swipe-hint-chevron"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.25 }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          ))}
        </span>
        <span>Swipe</span>
      </div>
    </div>
  );
}
