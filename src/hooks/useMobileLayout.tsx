import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const MOBILE_BREAKPOINT = 768;

export const useMobileLayout = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Initial check for SSR safety
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check if running in Capacitor native app (iOS/Android)
    const checkNative = () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      setIsNativeApp(isNativePlatform);
    };

    // Check if running as installed PWA (standalone mode)
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isIOSStandalone);
    };

    checkMobile();
    checkNative();
    checkPWA();
    
    window.addEventListener("resize", checkMobile);
    
    // Listen for PWA display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', checkPWA);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
      displayModeQuery.removeEventListener('change', checkPWA);
    };
  }, []);

  // Show mobile layout for:
  // 1. Native Capacitor apps (iOS/Android)
  // 2. Installed PWAs running in standalone mode
  // 3. Mobile browser views (width < 768px)
  return isNativeApp || isPWA || isMobile;
};

// Export additional utilities for more granular control
export const useIsNativeApp = () => {
  const [isNative, setIsNative] = useState(false);
  
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);
  
  return isNative;
};

export const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsPWA(isStandalone || isIOSStandalone);
  }, []);
  
  return isPWA;
};
