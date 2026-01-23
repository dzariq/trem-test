import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import App from "./App.tsx";
import "./index.css";

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
