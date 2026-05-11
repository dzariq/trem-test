import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";
import "./styles/pdf-print.css";

if (Capacitor.isNativePlatform()) {
  // Let the WebView extend behind the status bar so we control the padding
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
  StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
  StatusBar.setBackgroundColor({ color: "#00000000" }).catch(() => undefined);

  // Hide the native splash screen as soon as React mounts so users never see
  // the configured launchShowDuration if the app is ready earlier.
  import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => {
      // Defer one frame to ensure the first paint actually happened.
      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
      });
    })
    .catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
