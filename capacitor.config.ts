import type { CapacitorConfig } from "@capacitor/cli";

// The Collinz mobile app is a *thin native wrapper* around https://collinz.app.
// It does not ship any application code, UI, env vars, or business logic —
// every pixel and every line of JavaScript is fetched live from the URL above
// on each launch. This means:
//   - Updating the web app instantly updates every installed device.
//   - Capacitor plugins (camera, filesystem, notifications, etc.) still work
//     because the native bridge is injected into the WebView regardless of
//     the origin the WebView is loading.
//   - The app *requires* internet — there is no offline fallback by design.
const LIVE_URL = "https://collinz.app";

const config: CapacitorConfig = {
  appId: "com.collinz.school",
  appName: "Collinz School",
  // `webDir` still needs to point at something for `cap sync` to succeed,
  // but the contents are effectively ignored at runtime because `server.url`
  // takes precedence. The CI workflow writes a one-line redirect placeholder
  // into this directory in case Android ever falls back to it.
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    url: LIVE_URL,
    cleartext: false,
    // Allow the WebView to navigate to Supabase and any *.collinz.app
    // subdomain without bouncing out to an external browser.
    allowNavigation: [
      "collinz.app",
      "*.collinz.app",
      "*.supabase.co",
      "*.supabase.in",
    ],
    // Mask the Android WebView identity. By default Capacitor's WebView
    // sends a UA containing "; wv)" which some hosting platforms
    // (Lovable / Vercel / CDN edges) use to serve cached or feature-gated
    // responses different from the regular Chrome experience. Pretending
    // to be a normal Mobile Chrome avoids any such UA-based routing or
    // caching layer.
    overrideUserAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
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
