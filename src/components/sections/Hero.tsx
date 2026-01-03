'use client';

import { forwardRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export const Hero = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center p-6"
    >
      <GlassCard className="max-w-2xl w-full p-8 md:p-12 text-center" variant="ghost">
        <h1 className="hero-heading font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-6">
          {'Andrew '.split('').map((char, i) => (
            <span key={`andrew-${i}`} className="char inline-block">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
          <em className="text-white/90">
            {'Garrison'.split('').map((char, i) => (
              <span key={`garrison-${i}`} className="char inline-block">
                {char}
              </span>
            ))}
          </em>
        </h1>
        <p className="hero-subheading text-lg md:text-xl text-white/80 max-w-md mx-auto">
          Designer and developer crafting thoughtful digital experiences.
        </p>
      </GlassCard>
    </section>
  );
});

Hero.displayName = 'Hero';
