'use client';

import { forwardRef, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { GlassCard } from '@/components/ui/GlassCard';

interface TimelineItem {
  period: string;
  title: string;
  organization: string;
  type: 'work' | 'education';
}

const timeline: TimelineItem[] = [
  {
    period: '2023 - Present',
    title: 'Senior Frontend Engineer',
    organization: 'Circle',
    type: 'work',
  },
  {
    period: '2021 - 2023',
    title: 'Frontend Engineer',
    organization: 'Gemini',
    type: 'work',
  },
  {
    period: '2019 - 2021',
    title: 'Frontend Engineer',
    organization: 'Spreetail',
    type: 'work',
  },
  {
    period: '2017 - 2020',
    title: 'BBA, Marketing Management',
    organization: 'University of Nebraska at Omaha',
    type: 'education',
  },
  {
    period: '2015 - 2019',
    title: 'Frontend Development Intern',
    organization: 'Gallup',
    type: 'work',
  },
];

const skills = [
  'HTML/CSS',
  'TypeScript',
  'React',
  'Next.js',
  'GSAP Animations',
  'React Context',
  'XState State Machines',
  'Zustand',
  'LocalStorage',
  'Agentic Coding',
  'Claude Code',
  'Multi Subagent Workflows',
  'Git Worktrees',
];

export const About = forwardRef<HTMLElement>((props, ref) => {
  const skillsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;

    const skillTags = skillsRef.current?.querySelectorAll('.skill-tag');
    const timelineItems = timelineRef.current?.querySelectorAll('.timeline-item');

    if (skillTags && skillTags.length > 0) {
      hasAnimated.current = true;

      gsap.set(skillTags, { opacity: 0, scale: 0.8, y: 10 });
      gsap.to(skillTags, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'back.out(1.5)',
        delay: 0.3,
      });
    }

    if (timelineItems && timelineItems.length > 0) {
      gsap.set(timelineItems, { opacity: 0, x: -20 });
      gsap.to(timelineItems, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      });
    }
  }, []);

  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-start p-6 overflow-y-auto"
    >
      <div className="max-w-5xl w-full py-8 md:py-12 space-y-8">
        {/* Bio Section */}
        <GlassCard className="p-6 sm:p-8 md:p-12" variant="default">
          <h2 className="section-heading font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white mb-4 sm:mb-6">
            About Me
          </h2>
          <div className="section-content space-y-4 text-base sm:text-lg text-white/80">
            <p>
              Hey there. I&apos;m Andrew, based out of San Francisco and spending most of my time these days
              thinking about how AI changes the way we build things. Compound engineering, agentic swarms,
              multi-agent workflows, that whole space is where I live right now, and it&apos;s moving fast.
            </p>
            <p>
              I&apos;m also really curious about the intersection of AI and 3D, world models especially.
              The idea that we&apos;re getting close to AI that can actually reason about and generate
              three-dimensional environments is kind of wild, and I&apos;m watching that space closely.
            </p>
            <p>
              Not looking for new roles at the moment, but I&apos;m always down to hear interesting ideas.
              And if you&apos;re in SF and want to grab a coffee and talk big ideas or sports, count me in.
            </p>
          </div>
        </GlassCard>

        {/* Skills Section */}
        <GlassCard className="p-6 sm:p-8 md:p-12" variant="default">
          <h3 className="section-heading font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white mb-4 sm:mb-6">
            Skills & Expertise
          </h3>
          <div ref={skillsRef} className="section-content">
            <div className="mb-6">
              <h4 className="text-xl font-medium text-white mb-3">Frontend Development</h4>
              <p className="text-white/70 mb-4">
                Deep technical understanding of modern web technologies, from semantic HTML and responsive
                CSS to complex state management and animation systems.
              </p>
            </div>
            <div className="mb-6">
              <h4 className="text-xl font-medium text-white mb-3">Agentic Coding</h4>
              <p className="text-white/70 mb-4">
                Advanced workflows utilizing AI-powered coding tools, including multi-subagent workflows
                with Git worktrees and sophisticated automation patterns.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="skill-tag px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20
                           text-white/90 text-sm font-medium transition-all duration-300
                           hover:bg-white/20 hover:border-white/40 hover:scale-105 hover:shadow-lg
                           cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Timeline Section */}
        <GlassCard className="p-6 sm:p-8 md:p-12" variant="default">
          <h3 className="section-heading font-serif text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white mb-6 sm:mb-8">
            Experience & Education
          </h3>
          <div ref={timelineRef} className="section-content space-y-6">
            {timeline.map((item, index) => (
              <div
                key={index}
                className="timeline-item relative pl-8 pb-6 border-l-2 border-white/20 last:pb-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-sky-400 border-2 border-white/40 shadow-lg" />
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                    <h4 className="text-lg sm:text-xl font-medium text-white">{item.title}</h4>
                    <span className="text-xs sm:text-sm text-white font-medium whitespace-nowrap">{item.period}</span>
                  </div>
                  <p className="text-white/70">{item.organization}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                    {item.type === 'work' ? 'Professional' : 'Education'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
});

About.displayName = 'About';
