'use client';

import { forwardRef, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { getFeaturedProjects } from '@/data/projects';

// Temporary flag to show "Coming Soon" state
const SHOW_COMING_SOON = true;

export const Projects = forwardRef<HTMLElement>((props, ref) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Coming Soon animation
    if (SHOW_COMING_SOON && comingSoonRef.current && !hasAnimated.current) {
      hasAnimated.current = true;

      const container = comingSoonRef.current;
      const title = container.querySelector('.coming-soon-title');
      const subtitle = container.querySelector('.coming-soon-subtitle');
      const sparkles = container.querySelectorAll('.sparkle');

      // Initial states
      gsap.set(title, { opacity: 0, y: 30, scale: 0.9 });
      gsap.set(subtitle, { opacity: 0, y: 20 });
      gsap.set(sparkles, { opacity: 0, scale: 0, rotation: -180 });

      const tl = gsap.timeline({ delay: 0.2 });

      // Animate title with bounce
      tl.to(title, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
      });

      // Animate subtitle
      tl.to(
        subtitle,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.4'
      );

      // Animate sparkles
      tl.to(
        sparkles,
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'back.out(3)',
        },
        '-=0.4'
      );

      // Continuous twinkling for sparkles
      sparkles.forEach((sparkle, i) => {
        gsap.to(sparkle, {
          opacity: 0.3,
          scale: 0.5,
          duration: 0.8 + i * 0.1,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          delay: tl.duration() + i * 0.15,
        });
      });

      return;
    }

    // Regular projects animation (for when SHOW_COMING_SOON is false)
    if (!gridRef.current || hasAnimated.current) return;

    const cards = gridRef.current.querySelectorAll('.project-card');
    if (cards.length === 0) return;

    hasAnimated.current = true;

    gsap.set(cards, {
      opacity: 0,
      x: 60,
    });

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
          className="section-heading font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-6 sm:mb-8 md:mb-12 text-center"
        >
          Projects
        </h2>

        {SHOW_COMING_SOON ? (
          <div
            ref={comingSoonRef}
            className="section-content flex flex-col items-center justify-center max-w-2xl mx-auto py-12 md:py-20 relative"
          >
            {/* Sparkles */}
            <svg className="sparkle absolute top-0 left-1/4" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="rgba(255,255,255,0.6)" />
            </svg>
            <svg className="sparkle absolute top-8 right-1/3" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="rgba(255,255,255,0.5)" />
            </svg>
            <svg className="sparkle absolute bottom-16 left-1/3" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="rgba(255,255,255,0.55)" />
            </svg>
            <svg className="sparkle absolute -bottom-4 right-1/4" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="rgba(255,255,255,0.45)" />
            </svg>

            {/* Main content */}
            <div className="glass rounded-2xl px-8 py-10 md:px-12 md:py-14 text-center relative z-10">
              <h3 className="coming-soon-title font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-4">
                Coming Soon
              </h3>
              <p className="coming-soon-subtitle text-white/70 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
                Exciting projects are in the works. Check back soon to see what I&apos;ve been building.
              </p>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
});

Projects.displayName = 'Projects';
