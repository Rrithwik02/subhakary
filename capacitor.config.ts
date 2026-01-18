import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.subhakary.app',
  appName: 'Subhakary',
  webDir: 'dist',
  server: {
    url: 'https://0814cb91-57d4-4708-ac26-aa4e28d4ea2e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'light',
      backgroundColor: '#D4AF37'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF8F5',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
