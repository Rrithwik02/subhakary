import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export const useMobileLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check if running in Capacitor native app (iOS/Android)
    // This will only be true when running as a native app, not in mobile browsers
    const checkNative = () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      setIsNativeApp(isNativePlatform);
    };

    checkMobile();
    checkNative();
    
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Only show mobile layout in native Capacitor apps
  return isNativeApp;
};
