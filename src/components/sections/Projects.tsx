'use client';

import { forwardRef, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { getFeaturedProjects } from '@/data/projects';

export const Projects = forwardRef<HTMLElement>((props, ref) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!gridRef.current || hasAnimated.current) return;

    const cards = gridRef.current.querySelectorAll('.project-card');
    if (cards.length === 0) return;

    hasAnimated.current = true;

    // Set initial hidden state
    gsap.set(cards, {
      opacity: 0,
      x: 60,
    });

    // Staggered slide-in animation
    gsap.to(cards, {
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'back.out(1.2)',
      delay: 0.1,
    });
  }, []);

  const featuredProjects = getFeaturedProjects();

  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-6xl mx-auto py-8 md:py-12">
        <h2
          ref={headingRef}
          className="section-heading font-serif text-4xl md:text-5xl font-medium tracking-tight text-white mb-8 md:mb-12 text-center"
        >
          Projects
        </h2>

        <div
          ref={gridRef}
          className="section-content flex flex-col gap-5 md:gap-6 max-w-2xl mx-auto"
        >
          {featuredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {featuredProjects.length === 0 && (
          <p className="text-center text-white/60 text-lg">
            Projects coming soon.
          </p>
        )}
      </div>
    </section>
  );
});

Projects.displayName = 'Projects';
