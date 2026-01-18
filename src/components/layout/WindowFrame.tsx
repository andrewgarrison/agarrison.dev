import { ReactNode } from 'react';
import { ParallaxBackground } from './ParallaxBackground';

interface WindowFrameProps {
  children: ReactNode;
}

export function WindowFrame({ children }: WindowFrameProps) {
  return (
    <div className="fixed inset-0 p-2 md:p-3 overflow-hidden box-border">
      <div className="window-frame rounded-[var(--radius-xl)] overflow-hidden h-full">
        <ParallaxBackground />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
