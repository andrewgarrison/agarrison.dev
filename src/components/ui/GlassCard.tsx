import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'subtle' | 'ghost';
  hover?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = false,
  as: Component = 'div',
}: GlassCardProps) {
  const baseClasses = 'rounded-[var(--radius-lg)]';

  const variantClasses = {
    default: 'glass',
    strong: 'glass-strong',
    subtle: 'bg-white/5 border border-white/10',
    ghost: 'bg-transparent'
  };

  const hoverClasses = hover ? 'glass-interactive cursor-pointer' : '';

  return (
    <Component
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
    >
      {children}
    </Component>
  );
}
