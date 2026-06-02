import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eqhoplayer.app',
  appName: 'EQHO Player',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    // Full screen for iPhone notches and iPad
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: false,
    // Prefer edge-to-edge layout
    backgroundColor: '#020617',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: 'large',
      spinnerColor: '#ff4fa3',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
