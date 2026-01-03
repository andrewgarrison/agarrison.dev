'use client';

import { forwardRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

export const About = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center p-6"
    >
      <GlassCard className="max-w-4xl w-full p-8 md:p-12" variant="default">
        <h2 className="section-heading font-serif text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
          About
        </h2>
        <p className="section-content text-lg text-white/80">
          Coming soon - Learn more about my background and expertise.
        </p>
      </GlassCard>
    </section>
  );
});

About.displayName = 'About';
