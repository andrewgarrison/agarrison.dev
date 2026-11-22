'use client';

import { JellySwitch } from '@/components/jelly/JellySwitch';
import { JellyTabs } from '@/components/jelly/JellyTabs';
import { JellyPopover } from '@/components/jelly/JellyPopover';

const tabs = [
  { value: 'tokens', label: 'Tokens', panel: 'Colour, spacing, radius and motion, in light and dark.' },
  { value: 'motion', label: 'Motion', panel: 'Springs, not tweens: every jelly settles on its own physics.' },
  { value: 'access', label: 'Access', panel: 'Behaviour and ARIA come from UI SDK. The canvas is decorative.' },
  { value: 'perf', label: 'Perf', panel: 'One WebGL context and one animation loop for the whole page.' },
];

function Card({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[var(--radius-lg)] p-6 flex flex-col gap-5">
      <div>
        <h2 className="font-serif text-xl text-white">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function JellyLab() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-36 flex flex-col gap-6">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Spike</p>
          <h1 className="font-serif text-4xl text-white mt-2">Jelly Design</h1>
          <p className="text-[var(--text-secondary)] mt-3 max-w-xl">
            UI SDK components with a shared WebGL2 jelly layer on top. Try a mouse, a finger and the keyboard.
          </p>
        </header>

        <Card title="Switch" note="Press and hold to feel it tug, release to snap over. Space works too.">
          <div className="flex flex-col gap-4">
            <JellySwitch defaultChecked>Wobbly animations</JellySwitch>
            <JellySwitch>Sound effects</JellySwitch>
            <JellySwitch disabled>Disabled</JellySwitch>
          </div>
        </Card>

        <Card title="Tabs" note="The dock's jelly, following UI SDK's measured indicator. Arrow keys move it.">
          <JellyTabs label="Jelly Design topics" tabs={tabs} />
        </Card>

        <Card title="Popover" note="The surface grows out of the button and shrinks back on Escape, Done or a click outside.">
          <div>
            <JellyPopover
              trigger="What's jelly?"
              title="A squishy design system"
              description="Accessible parts from UI SDK, with springy WebGL surfaces drawn behind them."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
