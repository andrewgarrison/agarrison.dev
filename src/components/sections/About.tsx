'use client';

import { forwardRef } from 'react';
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
  return (
    <section
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-start p-6 overflow-y-auto"
    >
      <div className="max-w-5xl w-full py-8 md:py-12 space-y-8">
        {/* Bio Section */}
        <GlassCard className="p-8 md:p-12" variant="default">
          <h2 className="section-heading font-serif text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
            About Me
          </h2>
          <div className="section-content space-y-4 text-lg text-white/80">
            <p>
              I&apos;m a Senior Frontend Engineer with a passion for crafting exceptional user experiences
              through thoughtful design and cutting-edge web technologies. With nearly a decade of
              experience spanning fintech, e-commerce, and digital innovation, I bring a unique blend
              of technical expertise and creative problem-solving to every project.
            </p>
            <p>
              My journey in frontend development has taken me from early explorations with interactive
              web applications to mastering modern frameworks and animation libraries. I specialize in
              building performant, accessible, and delightful interfaces that users love to interact with.
            </p>
            <p>
              Recently, I&apos;ve been diving deep into agentic coding workflows, leveraging AI-powered tools
              like Claude Code to enhance productivity and explore new paradigms in software development.
              I believe in the power of automation and intelligent tooling to amplify human creativity.
            </p>
          </div>
        </GlassCard>

        {/* Skills Section */}
        <GlassCard className="p-8 md:p-12" variant="default">
          <h3 className="section-heading font-serif text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
            Skills & Expertise
          </h3>
          <div className="section-content">
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
        <GlassCard className="p-8 md:p-12" variant="default">
          <h3 className="section-heading font-serif text-3xl md:text-4xl font-medium tracking-tight text-white mb-8">
            Experience & Education
          </h3>
          <div className="section-content space-y-6">
            {timeline.map((item, index) => (
              <div
                key={index}
                className="timeline-item relative pl-8 pb-6 border-l-2 border-white/20 last:pb-0"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-sky-400 border-2 border-white/40 shadow-lg" />
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                    <h4 className="text-xl font-medium text-white">{item.title}</h4>
                    <span className="text-sm text-sky-300 font-medium">{item.period}</span>
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
