import type { CapacitorConfig } from "@capacitor/cli";

// CAP_SERVER_URL controls whether the app loads the web bundle from the APK
// (the default) or loads it live from a remote URL.
//
// - Production / Play Store builds: leave CAP_SERVER_URL unset so the app
//   ships a fully-bundled web build (works offline, faster cold start, all
//   plugins behave normally, App Store-safe).
// - Development / staging / internal QA: set CAP_SERVER_URL to a live URL
//   (e.g. https://collinz.app) so the WebView always reflects the latest
//   web deploy without reinstalling the APK.
//
// Set locally:    set CAP_SERVER_URL=https://collinz.app && npm run android:apk
// Set in CI:      handled by .github/workflows/build-android-apk.yml based
//                 on the build_mode workflow input.
const liveServerUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.collinz.school",
  appName: "Collinz School",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    ...(liveServerUrl
      ? {
          // Live mode: WebView loads UI from the remote URL on every launch.
          // The web bundle inside the APK is ignored.
          url: liveServerUrl,
          cleartext: false,
        }
      : {}),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      // White matches the Collinz crest's background in resources/splash.png
      // so there is no visible seam between the system launch screen and the
      // Capacitor splash drawable.
      backgroundColor: "#ffffff",
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
