import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maoun.app',
  appName: 'ماعون',
  webDir: 'dist',
  server: {
    url: 'https://07c64b4d-d8ce-4268-a048-383feb448665.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    Camera: {
      iosUsesNonExemptEncryption: false
    }
  },
  ios: {
    contentInset: 'automatic',
    minVersion: '16.0'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
