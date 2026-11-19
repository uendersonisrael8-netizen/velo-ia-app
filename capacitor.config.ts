import type { CapacitorConfig } from "@capacitor/cli";

/**
 * O app é um bundle estático (Vite) empacotado no Android. A autenticação e o
 * histórico vão para o Supabase e para a API da Velo usando Bearer token.
 */
const config: CapacitorConfig = {
  appId: "app.velo.ia",
  appName: "Velo IA",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
  },
};

export default config;
