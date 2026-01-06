'use client';

import { useRef } from 'react';
import { GlassCard } from './GlassCard';
import type { Project } from '@/data/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string): string => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div
      ref={cardRef}
      className="project-card"
      style={{ '--card-index': index } as React.CSSProperties}
    >
      <GlassCard
        className="h-full flex flex-col overflow-hidden group"
        variant="default"
        hover
      >
        <div className="relative h-40 md:h-48 overflow-hidden rounded-t-[var(--radius-lg)]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-sky-400/30 to-sky-600/30 transition-transform duration-500 group-hover:scale-105"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl opacity-50" aria-hidden="true">
              {project.title.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-serif text-xl md:text-2xl font-medium text-white leading-tight">
              {project.title}
            </h3>
            <time
              dateTime={project.date}
              className="text-xs text-white/50 whitespace-nowrap mt-1"
            >
              {formatDate(project.date)}
            </time>
          </div>

          <p className="text-sm md:text-base text-white/70 mb-4 flex-1">
            {project.overview}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60 border border-white/10"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-white/40">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
