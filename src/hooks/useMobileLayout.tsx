import { useEffect, useState } from "react";

export const useMobileLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check if running in Capacitor native app
    const checkNative = () => {
      const isCapacitor = 
        typeof (window as any).Capacitor !== 'undefined' || 
        window.location.protocol === 'capacitor:' ||
        // Check for mobile user agent as fallback for testing
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsNativeApp(isCapacitor);
    };

    checkMobile();
    checkNative();
    
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile, isNativeApp, showMobileLayout: isMobile };
};
