'use client';

import { forwardRef, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import gsap from 'gsap';

export const Contact = forwardRef<HTMLElement>((props, ref) => {
  const dockRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const dock = dockRef.current;
    const icons = itemsRef.current.filter(Boolean) as HTMLLIElement[];

    if (!dock || icons.length === 0) return;

    const firstIcon = icons[0];

    // Responsive sizes based on screen width
    const isMobile = window.innerWidth < 640;
    const iconSize = isMobile ? 40 : 56;
    const min = iconSize + 16; // icon width + margins (8px each side)
    const max = isMobile ? 64 : 120;
    const bound = min * Math.PI;

    gsap.set(icons, {
      transformOrigin: '50% 100%',
      width: iconSize,
      height: iconSize,
    });

    const updateIcons = (pointer: number) => {
      const offset = dock.getBoundingClientRect().left + firstIcon.offsetLeft;

      for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        // Calculate expected center position based on index and spacing
        const expectedCenterX = i * min + min / 2;
        const distance = expectedCenterX - (pointer - offset);
        let x = 0;
        let scale = 1;

        if (-bound < distance && distance < bound) {
          const rad = (distance / min) * 0.5;
          scale = 1 + ((max / min - 1) * Math.cos(rad));
          x = 2 * (max - min) * Math.sin(rad);
        } else {
          // Icons outside the interaction zone get a small offset
          x = (-bound < distance ? 1 : -1) * (max - min);
        }

        gsap.to(icon, {
          duration: 0.3,
          x: x,
          scale: scale,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateIcons(event.clientX);
    };

    const handleMouseLeave = () => {
      gsap.to(icons, {
        duration: 0.3,
        scale: 1,
        x: 0,
        ease: 'power2.out',
      });
    };

    dock.addEventListener('mousemove', handleMouseMove);
    dock.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      dock.removeEventListener('mousemove', handleMouseMove);
      dock.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center p-6"
    >
      <GlassCard className="max-w-4xl w-full pb-0 pt-6 px-6 sm:pt-8 sm:px-8 md:pt-12 md:px-12 relative flex flex-col !rounded-b-none" variant="default">
        <h2 className="section-heading font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-4 sm:mb-6">
          Let&apos;s Connect
        </h2>

        <p className="section-content text-base sm:text-lg text-white/80 mb-8 sm:mb-12 md:mb-16">
          I&apos;m always open to new opportunities and conversations. Reach out and let&apos;s create something amazing together.
        </p>

        {/* macOS-style Dock */}
        <div className="mt-auto -mx-6 sm:-mx-8 md:-mx-12">
          <ul
            ref={dockRef}
            className="flex justify-center items-end h-16 sm:h-20 m-0 py-2 sm:py-3 glass-strong list-none relative w-full"
            style={{ overflow: 'visible', borderRadius: '1rem 1rem 0 0' }}
          >
            <li
              ref={(el) => { itemsRef.current[0] = el; }}
              className="mx-1 sm:mx-2 w-14 h-14"
            >
              <a
                href="https://www.linkedin.com/in/andrewtategarrison"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
                aria-label="LinkedIn Profile"
              >
                <svg
                  className="w-full h-full object-contain rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </li>

            <li
              ref={(el) => { itemsRef.current[1] = el; }}
              className="mx-1 sm:mx-2 w-14 h-14"
            >
              <a
                href="https://x.com/Andrew_Garrison"
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
                aria-label="X (Twitter) Profile"
              >
                <svg
                  className="w-full h-full object-contain rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </li>

            <li
              ref={(el) => { itemsRef.current[2] = el; }}
              className="mx-1 sm:mx-2 w-14 h-14"
            >
              <a
                href="mailto:andrewgarrison5@gmail.com"
                className="block h-full"
                aria-label="Send Email"
              >
                <svg
                  className="w-full h-full object-contain rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </GlassCard>
    </section>
  );
});

Contact.displayName = 'Contact';
