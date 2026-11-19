import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { BrandMark } from "./components/Brand";
import { ChatScreen } from "./components/ChatScreen";
import { LoginScreen } from "./components/LoginScreen";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { applyTheme, getInitialTheme, type Theme } from "./lib/theme";

function BootScreen() {
  return (
    <main className="boot">
      <BrandMark size={48} />
      <p>abrindo a velo ia…</p>
    </main>
  );
}

function ConfigScreen() {
  return (
    <main className="config-screen">
      <BrandMark size={52} />
      <h1>falta configurar</h1>
      <p>
        Defina <code>VITE_SUPABASE_URL</code> e{" "}
        <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> (ou
        nas variáveis do GitHub Actions) e gere o app de novo.
      </p>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    applyTheme(theme);

    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({
      style: theme === "dark" ? Style.Light : Style.Dark,
    }).catch(() => undefined);
    void StatusBar.setBackgroundColor({
      color: theme === "dark" ? "#0a0a0a" : "#ffffff",
    }).catch(() => undefined);
  }, [theme]);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setBooting(false);
      })
      .catch(() => {
        if (active) setBooting(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) setSession(nextSession);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  if (!isSupabaseConfigured) return <ConfigScreen />;
  if (booting) return <BootScreen />;
  if (!session) {
    return <LoginScreen theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <ChatScreen
      session={session}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
