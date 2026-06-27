import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';

export const PWAInstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    promptInstall,
    dismissPrompt,
    isDismissed,
  } = usePWAInstall();

  useEffect(() => {
    // Show prompt after 3 seconds delay, only on mobile, not installed, not dismissed
    if (isMobile && isInstallable && !isInstalled && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isInstallable, isInstalled, isStandalone, isDismissed]);

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Download className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install Subhakary App
            </h3>
            
            {isIOS ? (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1">
                  <span>1. Tap</span>
                  <Share className="h-3 w-3 inline" />
                  <span>Share button</span>
                </p>
                <p className="flex items-center gap-1">
                  <span>2. Tap</span>
                  <Plus className="h-3 w-3 inline" />
                  <span>"Add to Home Screen"</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Install for quick access, offline support & a better experience
              </p>
            )}

            {!isIOS && (
              <Button
                onClick={handleInstall}
                size="sm"
                className="mt-3 w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
