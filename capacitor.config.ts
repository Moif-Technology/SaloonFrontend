import type { CapacitorConfig } from '@capacitor/cli';

// Detect environment
const isProduction = true  // Use production API

// Set API base based on environment
const apiBase = isProduction
  ? 'https://api.moifone.com'  // Production
  : 'http://192.168.1.2:5010'  // Development - local network IP

const config: CapacitorConfig = {
  appId: 'com.moifone.salonpos',
  appName: 'Salon POS',
  webDir: 'dist',
  server: {
    androidScheme: isProduction ? 'https' : 'http',  // Use HTTP for local dev, HTTPS for prod
    // url: apiBase,  // DO NOT SET — web assets load from APK, NOT from backend
    cleartext: !isProduction, // Allow HTTP for local dev only
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    SunmiPrinter: {
      // Sunmi D3 mini thermal printer plugin
    },
  },
};

console.log(`[Capacitor] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`[Capacitor] API Base: ${apiBase}`);

export default config;
