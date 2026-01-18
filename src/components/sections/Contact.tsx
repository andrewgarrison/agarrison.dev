'use client';

import { forwardRef, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import gsap from 'gsap';

export const Contact = forwardRef<HTMLElement>((props, ref) => {
  const linkedInRef = useRef<HTMLAnchorElement>(null);
  const xRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const icons = [linkedInRef.current, xRef.current].filter(Boolean);

    icons.forEach((icon) => {
      if (!icon) return;

      const handleMouseEnter = () => {
        gsap.to(icon, {
          scale: 1.15,
          rotation: 5,
          duration: 0.4,
          ease: 'elastic.out(1, 0.3)',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.4,
          ease: 'elastic.out(1, 0.3)',
        });
      };

      const handleMouseDown = () => {
        gsap.to(icon, {
          scale: 0.9,
          rotation: -5,
          duration: 0.15,
          ease: 'power2.out',
        });
      };

      const handleMouseUp = () => {
        gsap.to(icon, {
          scale: 1.15,
          rotation: 5,
          duration: 0.3,
          ease: 'elastic.out(1, 0.3)',
        });
      };

      icon.addEventListener('mouseenter', handleMouseEnter);
      icon.addEventListener('mouseleave', handleMouseLeave);
      icon.addEventListener('mousedown', handleMouseDown);
      icon.addEventListener('mouseup', handleMouseUp);

      return () => {
        icon.removeEventListener('mouseenter', handleMouseEnter);
        icon.removeEventListener('mouseleave', handleMouseLeave);
        icon.removeEventListener('mousedown', handleMouseDown);
        icon.removeEventListener('mouseup', handleMouseUp);
      };
    });
  }, []);

  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center p-6"
    >
      <GlassCard className="max-w-4xl w-full p-8 md:p-12" variant="default">
        <h2 className="section-heading font-serif text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
          Let&apos;s Connect
        </h2>

        <p className="section-content text-lg text-white/80 mb-8 text-center">
          I&apos;m always open to new opportunities and conversations. Reach out and let&apos;s create something amazing together.
        </p>

        {/* Social Icons */}
        <div className="flex gap-8 justify-center mb-8">
          <a
            ref={linkedInRef}
            href="https://www.linkedin.com/in/andrewtategarrison"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-interactive rounded-2xl p-6 transition-all duration-300 hover:bg-white/20"
            aria-label="LinkedIn Profile"
          >
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>

          <a
            ref={xRef}
            href="https://x.com/Andrew_Garrison"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-interactive rounded-2xl p-6 transition-all duration-300 hover:bg-white/20"
            aria-label="X (Twitter) Profile"
          >
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>

        {/* Email Contact */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Or email me at</p>
          <a
            href="mailto:andrewgarrison5@gmail.com"
            className="text-sky-300 hover:text-sky-200 text-lg font-medium transition-colors duration-200"
          >
            andrewgarrison5@gmail.com
          </a>
        </div>
      </GlassCard>
    </section>
  );
});

Contact.displayName = 'Contact';
