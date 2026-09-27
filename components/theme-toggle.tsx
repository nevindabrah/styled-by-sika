'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(document.documentElement.dataset.theme === 'light'); }, []);
  function toggle() {
    const next = document.documentElement.dataset.theme !== 'light';
    document.documentElement.dataset.theme = next ? 'light' : 'dark';
    setLight(next);
    try { localStorage.setItem('sika-theme', next ? 'light' : 'dark'); } catch { /* Theme still works when storage is unavailable. */ }
  }
  return <button type="button" className="icon-button theme-toggle" onClick={toggle}
    aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} title={light ? 'Switch to dark mode' : 'Switch to light mode'}>
    {light ? <Moon size={19} aria-hidden="true"/> : <Sun size={19} aria-hidden="true"/>}
  </button>;
}
