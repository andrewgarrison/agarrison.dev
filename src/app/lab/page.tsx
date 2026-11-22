import type { Metadata } from 'next';
import { JellyLab } from './JellyLab';

export const metadata: Metadata = {
  title: 'Jelly Lab',
  robots: { index: false, follow: false },
};

export default function LabPage() {
  return <JellyLab />;
}
