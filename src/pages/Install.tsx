import { Download, Share, Plus, MoreVertical, Check, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const Install = () => {
  const navigate = useNavigate();
  const { isIOS, isAndroid, isInstalled, isStandalone, promptInstall, isInstallable } = usePWAInstall();

  if (isInstalled || isStandalone) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              App Already Installed!
            </h1>
            <p className="text-muted-foreground mb-6">
              Subhakary is already installed on your device. You can access it from your home screen.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Install Subhakary App
            </h1>
            <p className="text-muted-foreground">
              Install our app for a faster, smoother experience with offline access
            </p>
          </div>

          {/* Benefits */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-3">Why Install?</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Quick access from your home screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Works offline - browse even without internet</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Full screen experience without browser bars</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Faster loading with cached content</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Direct install button for Android/Chrome */}
          {isInstallable && !isIOS && (
            <Button onClick={promptInstall} className="w-full mb-6" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Install Subhakary App
            </Button>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded">iOS</span>
                  Install on iPhone/iPad
                </h2>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <p className="font-medium">Tap the Share button</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Look for <Share className="h-4 w-4" /> at the bottom of Safari
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Look for <Plus className="h-4 w-4" /> Add to Home Screen option
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <p className="font-medium">Tap "Add" to confirm</p>
                      <p className="text-sm text-muted-foreground">
                        The app icon will appear on your home screen
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Android Instructions */}
          {isAndroid && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">Android</span>
                  Install on Android
                </h2>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <p className="font-medium">Tap the menu button</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Look for <MoreVertical className="h-4 w-4" /> in Chrome's top right corner
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <p className="font-medium">Tap "Install app" or "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">
                        You may see a banner at the bottom too
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <p className="font-medium">Tap "Install" to confirm</p>
                      <p className="text-sm text-muted-foreground">
                        The app will be added to your home screen
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* General Instructions for Desktop */}
          {!isIOS && !isAndroid && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4">Install on Desktop</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Look for the install icon in your browser's address bar, or:
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Click the menu (⋮) in Chrome</li>
                  <li>2. Select "Install Subhakary..."</li>
                  <li>3. Click "Install" to confirm</li>
                </ol>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            No app store required • Free • Updates automatically
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
