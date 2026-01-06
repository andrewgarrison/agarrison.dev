export interface Project {
  id: string;
  slug: string;
  title: string;
  overview: string;
  description: string;
  image: string;
  date: string;
  tags: string[];
  featured: boolean;
  links?: {
    live?: string;
    github?: string;
  };
}

export const projects: Project[] = [
  {
    id: '1',
    slug: 'portfolio-website',
    title: 'Portfolio Website',
    overview: 'A playful, animated portfolio featuring glass morphism and GSAP-powered transitions.',
    description: 'Built with Next.js 16, React 19, and TypeScript. Features a morphing blob navigation dock, parallax cloud background, and section-based routing with elastic bounce animations.',
    image: '/projects/portfolio.jpg',
    date: '2026-01',
    tags: ['Next.js', 'React', 'TypeScript', 'GSAP', 'Tailwind CSS'],
    featured: true,
    links: {
      live: 'https://agarrison.dev',
      github: 'https://github.com/agarrison/agarrison.dev',
    },
  },
  {
    id: '2',
    slug: 'design-system',
    title: 'Design System',
    overview: 'A comprehensive component library with accessibility built-in from the ground up.',
    description: 'Reusable React components with TypeScript, Storybook documentation, and automated visual regression testing. Supports light/dark themes and meets WCAG 2.1 AA standards.',
    image: '/projects/design-system.jpg',
    date: '2025-09',
    tags: ['React', 'TypeScript', 'Storybook', 'Accessibility'],
    featured: true,
  },
  {
    id: '3',
    slug: 'data-visualization-dashboard',
    title: 'Data Visualization Dashboard',
    overview: 'Real-time analytics dashboard with interactive charts and live data streaming.',
    description: 'Built with D3.js and React for a fintech client. Features WebSocket connections for real-time updates, customizable chart widgets, and export capabilities.',
    image: '/projects/dashboard.jpg',
    date: '2025-06',
    tags: ['React', 'D3.js', 'WebSocket', 'Node.js'],
    featured: true,
  },
  {
    id: '4',
    slug: 'mobile-app',
    title: 'Wellness Tracking App',
    overview: 'Cross-platform mobile app for tracking daily wellness habits and goals.',
    description: 'React Native app with offline-first architecture. Includes habit tracking, mood journaling, and personalized insights powered by ML models.',
    image: '/projects/wellness-app.jpg',
    date: '2025-03',
    tags: ['React Native', 'TypeScript', 'Firebase', 'ML Kit'],
    featured: false,
  },
];

export const getFeaturedProjects = (): Project[] => {
  return projects.filter((project) => project.featured);
};

export const getProjectBySlug = (slug: string): Project | undefined => {
  return projects.find((project) => project.slug === slug);
};
