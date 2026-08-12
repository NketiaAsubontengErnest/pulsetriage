'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * React port of the adminHMD template's assets/js/main.js.
 *
 * The template drives its shell with body classes (`sidebar-mini`,
 * `sidebar-open`, `auth-body`) and a `data-theme` attribute on <html>.
 * Those are global side effects, so they live here rather than in a component.
 */

type Theme = 'light' | 'dark';

const THEME_KEY = 'pulsetriage.colorTheme';
const MINI_KEY = 'pulsetriage.sidebarMini';
const DESKTOP_QUERY = '(min-width: 992px)';

interface UiContextType {
  theme: Theme;
  toggleTheme: () => void;
  sidebarMini: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  /** Swaps the body over to the template's full-screen auth/error background. */
  setAuthBody: (enabled: boolean) => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Private mode / storage disabled — the UI still works, it just won't persist. */
  }
};

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [sidebarMini, setSidebarMini] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Restore the saved theme (falling back to the OS preference) ──────────
  useEffect(() => {
    const saved = readStorage(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  // Bootstrap reads data-bs-theme; the template's style.css reads data-theme.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      writeStorage(THEME_KEY, next);
      return next;
    });
  }, []);

  // ── Restore the collapsed-sidebar preference on desktop ──────────────────
  useEffect(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches && readStorage(MINI_KEY) === 'true') {
      setSidebarMini(true);
    }
  }, []);

  // Crossing the desktop breakpoint resets whichever mode no longer applies.
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const handleChange = () => {
      if (media.matches) {
        setSidebarOpen(false);
        setSidebarMini(readStorage(MINI_KEY) === 'true');
      } else {
        setSidebarMini(false);
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('sidebar-mini', sidebarMini);
    document.body.classList.toggle('sidebar-open', sidebarOpen);
  }, [sidebarMini, sidebarOpen]);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setSidebarMini((current) => {
        writeStorage(MINI_KEY, String(!current));
        return !current;
      });
    } else {
      setSidebarOpen((current) => !current);
    }
  }, []);

  const closeSidebar = useCallback(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setSidebarOpen(false);
  }, []);

  const setAuthBody = useCallback((enabled: boolean) => {
    document.body.classList.toggle('auth-body', enabled);
  }, []);

  return (
    <UiContext.Provider
      value={{ theme, toggleTheme, sidebarMini, sidebarOpen, toggleSidebar, closeSidebar, setAuthBody }}
    >
      {children}
    </UiContext.Provider>
  );
};

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) throw new Error('useUi must be used within a UiProvider');
  return context;
};

/** Shared theme switch used by the navbar and the auth pages. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useUi();
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <button
      className={`icon-button theme-toggle${className ? ` ${className}` : ''}`}
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <i className={theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'} aria-hidden="true" />
    </button>
  );
};
