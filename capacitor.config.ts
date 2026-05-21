import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.collinz.school",
  appName: "Collinz School",
  webDir: "dist",
  server: {
    androidScheme: "https",
    // Live reload (emulator):
    // url: "http://10.0.2.2:8080",
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#f5f5f5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#ffffff",
  },
  android: {
    backgroundColor: "#ffffff",
  },
};

export default config;
