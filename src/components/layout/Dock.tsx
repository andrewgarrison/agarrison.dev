'use client';

import { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import useSound from 'use-sound';

// Register the plugin
gsap.registerPlugin(MorphSVGPlugin);

type Section = 'home' | 'projects' | 'about' | 'contact';

const navItems: { section: Section; label: string; path: string }[] = [
  { section: 'home', label: 'Home', path: '/' },
  { section: 'projects', label: 'Projects', path: '/projects' },
  { section: 'about', label: 'About', path: '/about' },
  { section: 'contact', label: 'Contact', path: '/contact' },
];

const BLOB_HEIGHT = 34;
const BLOB_PADDING = 3;

// Create a pill/rounded rectangle path centered at given position
function createPillPath(left: number, right: number, height: number = BLOB_HEIGHT): string {
  const r = height / 2;
  const top = BLOB_PADDING;
  const bottom = height + BLOB_PADDING;
  const cy = top + height / 2;

  return `
    M ${left + r},${top}
    L ${right - r},${top}
    C ${right},${top} ${right},${cy} ${right},${cy}
    C ${right},${cy} ${right},${bottom} ${right - r},${bottom}
    L ${left + r},${bottom}
    C ${left},${bottom} ${left},${cy} ${left},${cy}
    C ${left},${cy} ${left},${top} ${left + r},${top}
    Z
  `.trim().replace(/\s+/g, ' ');
}

// Create a stretched blob path - uniform "grab and pull" effect
function createStretchedBlobPath(
  fromLeft: number,
  fromRight: number,
  toLeft: number,
  toRight: number,
  progress: number,
  height: number = BLOB_HEIGHT
): string {
  const r = height / 2;
  const top = BLOB_PADDING;
  const bottom = height + BLOB_PADDING;
  const cy = top + height / 2;

  const movingRight = toLeft > fromLeft;

  // Calculate stretched bounds - leading edge moves faster, trailing follows
  const leadingProgress = Math.min(progress * 1.5, 1);
  const trailingProgress = Math.max(0, (progress - 0.2) * 1.25);

  let left: number, right: number;

  if (movingRight) {
    // Moving right: right edge leads, left edge trails
    left = gsap.utils.interpolate(fromLeft, toLeft, trailingProgress);
    right = gsap.utils.interpolate(fromRight, toRight, leadingProgress);
  } else {
    // Moving left: left edge leads, right edge trails
    left = gsap.utils.interpolate(fromLeft, toLeft, leadingProgress);
    right = gsap.utils.interpolate(fromRight, toRight, trailingProgress);
  }

  // Uniform pill shape - no pinching, just a stretched rounded rectangle
  return `
    M ${left + r},${top}
    L ${right - r},${top}
    C ${right},${top} ${right},${cy} ${right},${cy}
    C ${right},${cy} ${right},${bottom} ${right - r},${bottom}
    L ${left + r},${bottom}
    C ${left},${bottom} ${left},${cy} ${left},${cy}
    C ${left},${cy} ${left},${top} ${left + r},${top}
    Z
  `.trim().replace(/\s+/g, ' ');
}

export function Dock() {
  const pathname = usePathname();
  const [playClickDown] = useSound('/audio/dock_click-down.mp3', { volume: 0.6 });
  const [playClickUp] = useSound('/audio/dock_click-up.mp3', { volume: 0.6 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const currentBounds = useRef({ left: 0, right: 92 });
  const breathingTween = useRef<gsap.core.Timeline | null>(null);
  const stretchTween = useRef<gsap.core.Tween | null>(null);
  const isFirstRender = useRef(true);
  const isAnimating = useRef(false);
  const isPressing = useRef(false);
  const pendingTarget = useRef<{ left: number; right: number; section: Section } | null>(null);

  const itemRefs = useRef<Record<Section, HTMLButtonElement | null>>({
    home: null,
    projects: null,
    about: null,
    contact: null,
  });

  // Subtle breathing animation for living blob feel
  const startBreathing = useCallback(() => {
    if (!pathRef.current || isAnimating.current || isPressing.current) return;

    if (breathingTween.current) {
      breathingTween.current.kill();
    }

    const { left, right } = currentBounds.current;
    const r = BLOB_HEIGHT / 2;

    // Create breathing loop with subtle morphs
    const breathe = () => {
      if (isAnimating.current || isPressing.current || !pathRef.current) return;

      const wobbleX = gsap.utils.random(-2, 2);
      const wobbleY = gsap.utils.random(-1, 1);

      const top = BLOB_PADDING + wobbleY;
      const bottom = BLOB_HEIGHT + BLOB_PADDING - wobbleY;
      const cy = (top + bottom) / 2;
      const adjustedLeft = left + wobbleX * 0.5;
      const adjustedRight = right - wobbleX * 0.5;
      const midX = (adjustedLeft + adjustedRight) / 2;

      const breathePath = `
        M ${adjustedLeft + r},${top}
        Q ${midX},${top - wobbleY * 2} ${adjustedRight - r},${top}
        C ${adjustedRight},${top} ${adjustedRight},${cy} ${adjustedRight},${cy}
        C ${adjustedRight},${cy} ${adjustedRight},${bottom} ${adjustedRight - r},${bottom}
        Q ${midX},${bottom + wobbleY * 2} ${adjustedLeft + r},${bottom}
        C ${adjustedLeft},${bottom} ${adjustedLeft},${cy} ${adjustedLeft},${cy}
        C ${adjustedLeft},${cy} ${adjustedLeft},${top} ${adjustedLeft + r},${top}
        Z
      `.trim().replace(/\s+/g, ' ');

      breathingTween.current = gsap.timeline({
        onComplete: breathe
      });

      breathingTween.current.to(pathRef.current, {
        morphSVG: breathePath,
        duration: gsap.utils.random(2, 3.5),
        ease: 'sine.inOut',
      });
    };

    breathe();
  }, []);

  // Start stretch on mousedown - anticipation phase
  const startStretch = useCallback((targetLeft: number, targetRight: number, section: Section) => {
    if (!pathRef.current || isAnimating.current) return;

    isPressing.current = true;
    pendingTarget.current = { left: targetLeft, right: targetRight, section };

    // Stop breathing
    if (breathingTween.current) {
      breathingTween.current.kill();
    }

    const fromLeft = currentBounds.current.left;
    const fromRight = currentBounds.current.right;

    // Create stretched path toward target (anticipation)
    const stretchPath = createStretchedBlobPath(fromLeft, fromRight, targetLeft, targetRight, 0.5);

    // Kill any existing stretch tween
    if (stretchTween.current) {
      stretchTween.current.kill();
    }

    stretchTween.current = gsap.to(pathRef.current, {
      morphSVG: {
        shape: stretchPath,
        shapeIndex: 0,
      },
      duration: 0.15,
      ease: 'power2.out',
    });
  }, []);

  // Cancel stretch and return to idle state
  const cancelStretch = useCallback(() => {
    if (!pathRef.current || !isPressing.current) return;

    isPressing.current = false;
    pendingTarget.current = null;

    // Kill stretch animation
    if (stretchTween.current) {
      stretchTween.current.kill();
    }

    // Return to current position with elastic snap back
    const { left, right } = currentBounds.current;
    const idlePath = createPillPath(left, right);

    gsap.to(pathRef.current, {
      morphSVG: {
        shape: idlePath,
        shapeIndex: 0,
      },
      duration: 0.4,
      ease: 'elastic.out(1, 0.4)',
      onComplete: () => {
        startBreathing();
      }
    });
  }, [startBreathing]);

  // Complete the morph transition on mouseup
  const completeTransition = useCallback((section: Section) => {
    if (!pathRef.current || !pendingTarget.current) return;

    const { left: targetLeft, right: targetRight } = pendingTarget.current;

    isPressing.current = false;
    isAnimating.current = true;

    // Kill stretch animation
    if (stretchTween.current) {
      stretchTween.current.kill();
    }

    // Navigate to the section
    if (typeof window !== 'undefined' && (window as any).navigateToSection) {
      (window as any).navigateToSection(section);
    }

    // Complete the morph to final position
    const finalPath = createPillPath(targetLeft, targetRight);

    gsap.to(pathRef.current, {
      morphSVG: {
        shape: finalPath,
        shapeIndex: 0,
      },
      duration: 0.35,
      ease: 'elastic.out(1, 0.5)',
      onComplete: () => {
        currentBounds.current = { left: targetLeft, right: targetRight };
        pendingTarget.current = null;
        isAnimating.current = false;
        startBreathing();
      }
    });
  }, [startBreathing]);

  // Handle mousedown - start the stretch
  const handleMouseDown = useCallback((section: Section) => {
    // Don't animate if already on this section
    const currentSection = navItems.find(item => item.path === pathname)?.section;
    if (section === currentSection || isAnimating.current) return;

    const targetButton = itemRefs.current[section];
    const container = containerRef.current;

    if (targetButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = targetButton.getBoundingClientRect();

      const targetLeft = buttonRect.left - containerRect.left;
      const targetRight = targetLeft + buttonRect.width;

      startStretch(targetLeft, targetRight, section);
    }
  }, [pathname, startStretch]);

  // Handle mouseup - complete or cancel
  const handleMouseUp = useCallback((section: Section) => {
    if (!isPressing.current) return;

    // Check if releasing on the same button that was pressed
    if (pendingTarget.current?.section === section) {
      completeTransition(section);
    } else {
      cancelStretch();
    }
  }, [completeTransition, cancelStretch]);

  // Handle mouse leave - cancel the stretch
  const handleMouseLeave = useCallback(() => {
    if (isPressing.current) {
      cancelStretch();
    }
  }, [cancelStretch]);

  // Initialize blob position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeItem = navItems.find(item => item.path === pathname);
      if (!activeItem || !pathRef.current || !itemRefs.current[activeItem.section]) return;

      const activeButton = itemRefs.current[activeItem.section];
      const container = containerRef.current;

      if (activeButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        const targetLeft = buttonRect.left - containerRect.left;
        const targetRight = targetLeft + buttonRect.width;

        if (isFirstRender.current) {
          // Set initial position without animation
          currentBounds.current = { left: targetLeft, right: targetRight };
          const initialPath = createPillPath(targetLeft, targetRight);
          pathRef.current.setAttribute('d', initialPath);
          isFirstRender.current = false;
          startBreathing();
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname, startBreathing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (breathingTween.current) {
        breathingTween.current.kill();
      }
    };
  }, []);

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div ref={containerRef} className="dock-container relative">
        {/* SVG Living Blob Indicator */}
        <svg
          className="absolute top-[6px] left-0 w-full pointer-events-none z-0"
          style={{ height: BLOB_HEIGHT + BLOB_PADDING * 2 }}
        >
          <defs>
            <linearGradient id="blobGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.14)" />
              <stop offset="50%" stopColor="rgba(0, 0, 0, 0.07)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
            </linearGradient>
            <filter id="blobShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
              <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" />
              <feComposite in2="offsetBlur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            ref={pathRef}
            fill="url(#blobGradient)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1"
            filter="url(#blobShadow)"
          />
        </svg>

        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.section}
              ref={(el) => { itemRefs.current[item.section] = el; }}
              onMouseDown={() => {
                playClickDown();
                handleMouseDown(item.section);
              }}
              onMouseUp={() => {
                playClickUp();
                handleMouseUp(item.section);
              }}
              onMouseLeave={handleMouseLeave}
              className={isActive ? 'dock-item dock-item-active' : 'dock-item dock-item-inactive'}
              aria-label={`Navigate to ${item.label}`}
            >
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
