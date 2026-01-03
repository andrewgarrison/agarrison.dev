import { ReactNode } from 'react';
import { ParallaxBackground } from './ParallaxBackground';

interface WindowFrameProps {
  children: ReactNode;
}

export function WindowFrame({ children }: WindowFrameProps) {
  return (
    <div className="p-2 md:p-3 min-h-screen">
      <div className="window-frame pb-24 rounded-[var(--radius-xl)] overflow-hidden min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-1.5rem)]">
        <ParallaxBackground />
        {children}
      </div>
    </div>
  );
}
