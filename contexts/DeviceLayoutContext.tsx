'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  detectDeviceSpecs,
  resolveTargetResolution,
  DEFAULT_DEVICE_SPECS,
  DeviceSpecs,
  ResolutionProfile,
  ResolutionKey,
  RESOLUTION_PRESETS,
} from '@/lib/deviceDetection';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type LayoutPreference = 'auto' | 'mobile' | 'desktop';

export interface DeviceLayoutContextType {
  isMounted: boolean;
  deviceType: DeviceType;
  effectiveLayout: 'mobile' | 'desktop';
  preference: LayoutPreference;
  setPreference: (pref: LayoutPreference) => void;
  width: number;
  height: number;
  isTouch: boolean;
  // Identificação Avançada de Dispositivo e Resolução Automática
  deviceSpecs: DeviceSpecs;
  targetResolution: ResolutionProfile;
  resolutionPreference: ResolutionKey;
  setResolutionPreference: (pref: ResolutionKey) => void;
}

const DeviceLayoutContext = createContext<DeviceLayoutContextType>({
  isMounted: false,
  deviceType: 'desktop',
  effectiveLayout: 'desktop',
  preference: 'auto',
  setPreference: () => {},
  width: 1200,
  height: 800,
  isTouch: false,
  deviceSpecs: DEFAULT_DEVICE_SPECS,
  targetResolution: DEFAULT_DEVICE_SPECS.recommendedResolution,
  resolutionPreference: 'auto',
  setResolutionPreference: () => {},
});

function subscribeWindowResize(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', callback);
  window.addEventListener('orientationchange', callback);
  return () => {
    window.removeEventListener('resize', callback);
    window.removeEventListener('orientationchange', callback);
  };
}

function getWindowWidthSnapshot(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1200;
}

function getWindowWidthServerSnapshot(): number {
  return 1200;
}

function getWindowHeightSnapshot(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 800;
}

function getWindowHeightServerSnapshot(): number {
  return 800;
}

function subscribeLayoutPref(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('sr_layout_pref_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('sr_layout_pref_change', callback);
  };
}

function getLayoutPrefSnapshot(): LayoutPreference {
  try {
    const val = localStorage.getItem('sr_layout_pref');
    if (val === 'mobile' || val === 'desktop' || val === 'auto') {
      return val;
    }
  } catch {
    // Ignore storage errors in sandbox
  }
  return 'auto';
}

function getLayoutPrefServerSnapshot(): LayoutPreference {
  return 'auto';
}

function subscribeResPref(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('sr_res_pref_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('sr_res_pref_change', callback);
  };
}

function getResPrefSnapshot(): ResolutionKey {
  try {
    const val = localStorage.getItem('sr_res_pref');
    if (val && (val in RESOLUTION_PRESETS || val === 'auto')) {
      return val as ResolutionKey;
    }
  } catch {
    // Ignore storage errors in sandbox
  }
  return 'auto';
}

function getResPrefServerSnapshot(): ResolutionKey {
  return 'auto';
}

export function DeviceLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const preference = useSyncExternalStore(subscribeLayoutPref, getLayoutPrefSnapshot, getLayoutPrefServerSnapshot);
  const resolutionPreference = useSyncExternalStore(subscribeResPref, getResPrefSnapshot, getResPrefServerSnapshot);

  const width = useSyncExternalStore(subscribeWindowResize, getWindowWidthSnapshot, getWindowWidthServerSnapshot);
  const height = useSyncExternalStore(subscribeWindowResize, getWindowHeightSnapshot, getWindowHeightServerSnapshot);

  const isTouch = useMemo(() => {
    if (isMounted && typeof window !== 'undefined') {
      return 'ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0;
    }
    return false;
  }, [isMounted]);

  // Re-identificar especificações do dispositivo automaticamente com mudanças de viewport após montagem
  const specs = useMemo(() => {
    if (isMounted && typeof window !== 'undefined') {
      return detectDeviceSpecs(window, width, height);
    }
    return DEFAULT_DEVICE_SPECS;
  }, [isMounted, width, height]);

  const setPreference = (pref: LayoutPreference) => {
    try {
      localStorage.setItem('sr_layout_pref', pref);
      window.dispatchEvent(new Event('sr_layout_pref_change'));
    } catch {
      // Ignore
    }
  };

  const setResolutionPreference = (pref: ResolutionKey) => {
    try {
      localStorage.setItem('sr_res_pref', pref);
      window.dispatchEvent(new Event('sr_res_pref_change'));
    } catch {
      // Ignore
    }
  };

  // Identificação do dispositivo físico / viewport (com fallback seguro SSR)
  let detectedType: DeviceType = 'desktop';
  if (isMounted) {
    if (width < 768) {
      detectedType = 'mobile';
    } else if (width < 1024) {
      detectedType = 'tablet';
    } else {
      detectedType = 'desktop';
    }
  }

  // Layout efetivo (com respeito à preferência do usuário ou detecção automática, seguro para SSR)
  let effectiveLayout: 'mobile' | 'desktop' = 'desktop';
  if (isMounted) {
    if (preference === 'mobile') {
      effectiveLayout = 'mobile';
    } else if (preference === 'desktop') {
      effectiveLayout = 'desktop';
    } else {
      effectiveLayout = width < 768 ? 'mobile' : 'desktop';
    }
  }

  const targetResolution = isMounted
    ? resolveTargetResolution(specs, resolutionPreference)
    : DEFAULT_DEVICE_SPECS.recommendedResolution;

  return (
    <DeviceLayoutContext.Provider
      value={{
        isMounted,
        deviceType: detectedType,
        effectiveLayout,
        preference,
        setPreference,
        width,
        height,
        isTouch,
        deviceSpecs: specs,
        targetResolution,
        resolutionPreference,
        setResolutionPreference,
      }}
    >
      {children}
    </DeviceLayoutContext.Provider>
  );
}

export function useDeviceLayout() {
  return useContext(DeviceLayoutContext);
}

