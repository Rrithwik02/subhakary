import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

// Treat tablets as part of the “app-like” mobile experience
const MOBILE_BREAKPOINT = 1024;

export const useMobileLayout = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Initial check for SSR safety
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });
  const [isNativeApp, setIsNativeApp] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check if running in Capacitor native app (iOS/Android)
    const checkNative = () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      setIsNativeApp(isNativePlatform);
    };

    checkMobile();
    checkNative();
    
    window.addEventListener("resize", checkMobile);
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Show mobile layout ONLY for:
  // 1. Native Capacitor apps (iOS/Android)
  // Website and installed PWA surfaces should use the responsive web layout.
  return isNativeApp;
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
