import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.07c64b4dd8ce4268a048383feb448665',
  appName: 'nutrichem-arabic-analyzer',
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
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
