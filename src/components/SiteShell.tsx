'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Hero } from '@/components/sections/Hero';
import { Projects } from '@/components/sections/Projects';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';

export type Section = 'home' | 'projects' | 'about' | 'contact';

const sectionIndex: Record<Section, number> = {
  home: 0,
  projects: 1,
  about: 2,
  contact: 3,
};

const sectionOrder: Section[] = ['home', 'projects', 'about', 'contact'];

// Fired on window when the section changes from outside the dock (a swipe),
// so the dock can move its indicator.
export const SECTION_CHANGE_EVENT = 'sectionchange';

// Swipe tuning, in px / ms.
const SWIPE_MIN_DISTANCE = 60; // a slow, deliberate drag
const SWIPE_MIN_FLICK = 30; // a short but fast flick...
const SWIPE_FLICK_VELOCITY = 0.4; // ...moving at least this fast
const SWIPE_MAX_DURATION = 800;
const SWIPE_EDGE_GUARD = 20;

const getNavigationDirection =(from: Section, to: Section): number => {
  return sectionIndex[to] > sectionIndex[from] ? 1 : -1;
};

const sectionMap: Record<string, Section> = {
  '/': 'home',
  '/projects': 'projects',
  '/about': 'about',
  '/contact': 'contact',
};

const pathMap: Record<Section, string> = {
  home: '/',
  projects: '/projects',
  about: '/about',
  contact: '/contact',
};

export default function SiteShell({ initialSection }: { initialSection: Section }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  // The initial section comes from the route itself (each route renders
  // SiteShell with its own initialSection), so server and client always agree.
  // No URL sniffing needed for the initial render.
  const [activeSection, setActiveSection] = useState<Section>(initialSection);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastDirection, setLastDirection] = useState<number>(1);
  const [lastDistance, setLastDistance] = useState<number>(1);
  // The section being transitioned to. Kept visible (alongside the active
  // section) for the duration of the GSAP transition so the entry animation
  // plays instead of the new content flashing in at the end.
  const [incomingSection, setIncomingSection] = useState<Section | null>(null);

  // Set the initial background position on mount, and sync the section on
  // browser back/forward. In-app navigation goes through navigateToSection
  // (pushState), not the router.
  useEffect(() => {
    const globalWindow = window as Window & { setParallaxSection?: (section: Section) => void };
    if (globalWindow.setParallaxSection) {
      globalWindow.setParallaxSection(initialSection);
    }

    const handlePopState = () => {
      const section = sectionMap[window.location.pathname] || 'home';
      setActiveSection(section);
      if (globalWindow.setParallaxSection) {
        globalWindow.setParallaxSection(section);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialSection]);

  // Animate initial hero content. This runs only on the initial mount
  // (direct load). When arriving at home via in-app navigation, the section
  // entry animation already provides the motion, so replaying the character
  // stagger would look like the animation restarting.
  const heroIntroPlayed = useRef(false);
  useGSAP(() => {
    const isFirstRun = !heroIntroPlayed.current;
    heroIntroPlayed.current = true;
    if (activeSection !== 'home' || !heroRef.current) return;
    if (!isFirstRun) return;

    const chars = heroRef.current.querySelectorAll('.char');
    const subheading = heroRef.current.querySelector('.hero-subheading');

    // Reset any inline transforms from page transitions
    gsap.set(heroRef.current, { clearProps: 'all' });

    // Scale bounce intensity based on navigation distance (extra playful for hero)
    const heroBounceIntensity = 1.2 + (lastDistance * 0.2); // Scales: 1.4, 1.6, 1.8 for distances 1, 2, 3

    const tl = gsap.timeline({ defaults: { ease: `back.out(${heroBounceIntensity})` } });

    // Directional character animation
    const charStartX = 15 * lastDirection;

    tl.fromTo(
      chars,
      {
        opacity: 0,
        x: charStartX,
        rotateY: -15 * lastDirection,
      },
      {
        opacity: 1,
        x: 0,
        rotateY: 0,
        duration: 0.6,
        stagger: 0.025,
      }
    );

    if (subheading) {
      tl.fromTo(
        subheading,
        { opacity: 0, x: 20 * lastDirection },
        { opacity: 1, x: 0, duration: 0.6 },
        '-=0.3'
      );
    }
  }, { scope: containerRef, dependencies: [activeSection, lastDirection, lastDistance] });

  // Returns false when the click is ignored (already there, or mid-transition),
  // so the dock can keep its indicator on the page that is actually showing.
  const navigateToSection = useCallback((section: Section): boolean => {
    if (section === activeSection || isAnimating) return false;

    setIsAnimating(true);
    setIncomingSection(section);

    const sectionRefs: Record<Section, React.RefObject<HTMLElement | null>> = {
      home: heroRef,
      projects: projectsRef,
      about: aboutRef,
      contact: contactRef,
    };

    const currentRef = sectionRefs[activeSection];
    const nextRef = sectionRefs[section];

    // Calculate direction: 1 = forward (animate left), -1 = backward (animate right)
    const direction = getNavigationDirection(activeSection, section);

    // Calculate navigation distance for elastic bounce scaling
    const distance = Math.abs(sectionIndex[section] - sectionIndex[activeSection]);
    const bounceIntensity = 1.1 + (distance * 0.15); // Scales: 1.25, 1.4, 1.55 for distances 1, 2, 3

    // Track direction and distance for hero animation when navigating to home
    if (section === 'home') {
      setLastDirection(direction);
      setLastDistance(distance);
    }

    // X offset values (positive = right, negative = left)
    const exitX = -80 * direction;  // Forward: exit to left (-80), Backward: exit to right (+80)
    const entryX = 80 * direction;  // Forward: enter from right (+80), Backward: enter from left (-80)

    const tl = gsap.timeline({
      onComplete: () => {
        // Keep previous section hidden and reset position
        if (currentRef.current) {
          gsap.set(currentRef.current, { opacity: 0, x: 0 });
        }
        setActiveSection(section);
        setIncomingSection(null); // Clear incoming section after transition
        setIsAnimating(false);
      },
    });

    // Animate out current section
    if (currentRef.current) {
      tl.to(currentRef.current, {
        opacity: 0,
        x: exitX,
        duration: 0.35,
        ease: 'power2.in',
      });
    }

    // Animate in next section
    if (nextRef.current) {
      // Set initial state for entry
      gsap.set(nextRef.current, {
        opacity: 0,
        x: entryX,
      });

      tl.to(nextRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        ease: `back.out(${bounceIntensity})`,
      }, '-=0.15');

      // Animate section content with directional stagger
      const heading = nextRef.current.querySelector('.section-heading');
      const content = nextRef.current.querySelector('.section-content');

      if (heading) {
        gsap.fromTo(
          heading,
          { opacity: 0, x: 20 * direction },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: 0.15,
            ease: `back.out(${bounceIntensity})`
          }
        );
      }

      if (content) {
        gsap.fromTo(
          content,
          { opacity: 0, x: 20 * direction },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: 0.25,
            ease: `back.out(${bounceIntensity})`
          }
        );
      }
    }

    // Update URL without triggering the App Router. Next.js wraps
    // history.pushState and would otherwise perform a real client-side
    // navigation to the route, unmounting the page mid-transition.
    // The __NA flag tells the wrapper to update the URL only.
    window.history.pushState({ __NA: true }, '', pathMap[section]);

    // Animate background parallax (CSS transition handles the smoothness)
    const globalWindow = window as Window & { setParallaxSection?: (section: Section) => void };
    if (globalWindow.setParallaxSection) {
      globalWindow.setParallaxSection(section);
    }

    return true;
  }, [activeSection, isAnimating]);

  // Expose navigation function globally for Dock
  useEffect(() => {
    const globalWindow = window as Window & { navigateToSection?: (section: Section) => boolean };
    globalWindow.navigateToSection = navigateToSection;
    return () => {
      delete globalWindow.navigateToSection;
    };
  }, [navigateToSection]);

  // Swipe left/right anywhere to move to the next/previous section (touch only).
  // Listeners are passive so vertical scrolling inside sections is untouched.
  const swipeNavRef = useRef({ activeSection, navigateToSection });
  useEffect(() => {
    swipeNavRef.current = { activeSection, navigateToSection };
  }, [activeSection, navigateToSection]);

  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = e.target as Element | null;
      // One finger only; the dock handles its own touches; skip the screen
      // edges, where iOS Safari's back/forward gesture lives.
      if (
        e.touches.length !== 1 ||
        target?.closest('nav') ||
        touch.clientX < SWIPE_EDGE_GUARD ||
        touch.clientX > window.innerWidth - SWIPE_EDGE_GUARD
      ) {
        start = null;
        return;
      }
      start = { x: touch.clientX, y: touch.clientY, t: performance.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const elapsed = performance.now() - start.t;
      start = null;

      const horizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
      const far = Math.abs(dx) > SWIPE_MIN_DISTANCE;
      const flick = Math.abs(dx) > SWIPE_MIN_FLICK && Math.abs(dx) / elapsed > SWIPE_FLICK_VELOCITY;
      if (!horizontal || elapsed > SWIPE_MAX_DURATION || !(far || flick)) return;

      // Finger moving left reveals the next section, like turning a page.
      const { activeSection: current, navigateToSection: go } = swipeNavRef.current;
      const nextIndex = sectionIndex[current] + (dx < 0 ? 1 : -1);
      const next = sectionOrder[nextIndex];
      if (!next) return; // Already at Home or Contact.

      if (go(next)) window.dispatchEvent(new Event(SECTION_CHANGE_EVENT));
    };

    const onTouchCancel = () => {
      start = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      className="relative h-full overflow-hidden"
    >
      <div style={{ display: activeSection === 'home' || incomingSection === 'home' ? 'block' : 'none' }}>
        <Hero ref={heroRef} />
      </div>
      <div style={{ display: activeSection === 'projects' || incomingSection === 'projects' ? 'block' : 'none' }}>
        <Projects ref={projectsRef} />
      </div>
      <div style={{ display: activeSection === 'about' || incomingSection === 'about' ? 'block' : 'none' }}>
        <About ref={aboutRef} />
      </div>
      <div style={{ display: activeSection === 'contact' || incomingSection === 'contact' ? 'block' : 'none' }}>
        <Contact ref={contactRef} />
      </div>
    </main>
  );
}
