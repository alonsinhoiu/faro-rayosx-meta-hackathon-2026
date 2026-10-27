import { useState, useEffect } from 'react';

export type ViewportMode = 'auto' | 'desktop' | 'mobile';

export function useViewport() {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [overrideMode, setOverrideMode] = useState<ViewportMode>('auto');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const naturalIsMobile = windowWidth < 1024;
  const isMobile =
    overrideMode === 'mobile'
      ? true
      : overrideMode === 'desktop'
        ? false
        : naturalIsMobile;

  return {
    isMobile,
    windowWidth,
    mode: overrideMode,
    setMode: setOverrideMode,
    toggleOverride: () => {
      setOverrideMode((curr) => {
        if (curr === 'auto') return isMobile ? 'desktop' : 'mobile';
        if (curr === 'desktop') return 'mobile';
        return 'desktop';
      });
    },
  };
}
