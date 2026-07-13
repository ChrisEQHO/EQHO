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
    // Edge-to-edge under the translucent status bar. Use 'never' (NOT 'automatic')
    // so WKWebView does NOT auto-inset its content by the safe area — otherwise the
    // top inset is applied twice (native content inset + our CSS env(safe-area-inset-top)),
    // which is what caused the oversized empty gap under the status bar. With 'never'
    // the CSS env() insets own the safe-area spacing exactly once.
    contentInset: 'never',
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
