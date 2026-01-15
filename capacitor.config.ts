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
};

export default config;
