'use client';

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEMES: Theme[] = ['light', 'dark', 'system'];
const DARK_QUERY = '(prefers-color-scheme: dark)';

// --- Saved theme (localStorage), read as an external store ---
const themeListeners = new Set<() => void>();

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored && THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  // Keep tabs in sync when the theme changes in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === 'theme') listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

// --- System colour scheme (matchMedia), read as an external store ---
function subscribeSystemDark(listener: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

const getSystemDark = () => window.matchMedia(DARK_QUERY).matches;

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server snapshots match the first client render ('system' / light);
  // React then re-renders with the real values after hydration.
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, () => 'system' as Theme);
  const systemDark = useSyncExternalStore(subscribeSystemDark, getSystemDark, () => false);
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Keep the <html> class in step, e.g. when the system preference changes.
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    const resolved: ResolvedTheme =
      newTheme === 'system' ? (getSystemDark() ? 'dark' : 'light') : newTheme;

    const apply = () => {
      try {
        localStorage.setItem('theme', newTheme);
      } catch {}
      applyThemeClass(resolved);
      themeListeners.forEach((listener) => listener());
    };

    // Use View Transition API for smooth crossfade if available
    if (document.startViewTransition) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
