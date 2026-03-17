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
}

createRoot(document.getElementById("root")!).render(<App />);
