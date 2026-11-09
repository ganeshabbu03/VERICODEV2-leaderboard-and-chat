import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Theme context -----------------------------------------------------------
// Stores the user's chosen theme ("dark" or "light") and persists it in
// localStorage so the choice survives page reloads. The default is "dark"
// because the existing site is built for dark mode, but every component
// reads CSS variables defined under `[data-theme="light"]` so the toggle
// really does flip the entire palette without us needing to swap class
// lists manually across the tree.

const ThemeContext = createContext(null);

const STORAGE_KEY = 'vericode_theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) {
    // ignore quota / disabled storage errors
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      // best-effort persistence
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setThemeExplicit = useCallback((next) => {
    if (next === 'dark' || next === 'light') setTheme(next);
  }, []);

  const value = { theme, toggleTheme, setTheme: setThemeExplicit };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
