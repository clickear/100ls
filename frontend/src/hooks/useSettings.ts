import { useState, useEffect } from 'react';
import type { Theme } from '../types/player';

interface UserSettings {
  theme: Theme;
  shadowingPauseFactor: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'imperial-gold',
  shadowingPauseFactor: 1.5,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('100ls-settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('100ls-settings', JSON.stringify(settings));
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Also update body background color meta tag for mobile browsers if needed
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', settings.theme === 'midnight-blue' ? '#020617' : '#fdfbf7');
    }
  }, [settings]);

  const setTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setShadowingPauseFactor = (factor: number) => {
    setSettings(prev => ({ ...prev, shadowingPauseFactor: factor }));
  };

  return {
    settings,
    setTheme,
    setShadowingPauseFactor,
  };
}
