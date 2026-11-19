import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { BrandMark } from "./Brand";
import { ThemeButton } from "./ThemeButton";
import { supabase } from "../lib/supabase";
import type { Theme } from "../lib/theme";

function translateLoginError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos. Confira e tente de novo.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Não consegui falar com o servidor. Verifique sua conexão.";
  }
  return message;
}

export function LoginScreen({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Preencha o e-mail e a senha para entrar.");
      return;
    }

    if (!supabase) {
      setError("O app ainda não foi configurado com o Supabase.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      setError(translateLoginError(authError.message));
      setLoading(false);
    }
    // Em caso de sucesso, o onAuthStateChange do App troca a tela.
  };

  return (
    <main className="login">
      <div className="login-topbar">
        <div className="login-wordmark">
          <BrandMark size={30} />
          <span>velo ia</span>
        </div>
        <ThemeButton theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="login-content">
        <p className="eyebrow">a mesma velo, agora no seu bolso</p>
        <h1 className="login-title">
          conversas que
          <br />
          <em>ficam com você.</em>
        </h1>
        <p className="login-subtitle">
          Entre com a mesma conta da rede social velo. Seu histórico aparece
          aqui e lá, sem perder o fio da conversa.
        </p>

        <form className="login-card" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>e-mail</span>
            <span className="field-control">
              <Mail size={17} strokeWidth={1.7} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="voce@email.com"
                maxLength={254}
                disabled={loading}
                required
              />
            </span>
          </label>

          <label className="field">
            <span>senha</span>
            <span className="field-control">
              <Lock size={17} strokeWidth={1.7} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="sua senha"
                maxLength={128}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff size={17} strokeWidth={1.8} />
                ) : (
                  <Eye size={17} strokeWidth={1.8} />
                )}
              </button>
            </span>
          </label>

          {error ? (
            <p className="form-error" role="alert">
              <AlertCircle size={16} strokeWidth={1.9} aria-hidden="true" />
              {error}
            </p>
          ) : null}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={17} strokeWidth={2} />
                entrando…
              </>
            ) : (
              "entrar"
            )}
          </button>

          <p className="login-hint">
            Ainda não tem conta? Crie no app da rede social velo e volte para
            cá com o mesmo e-mail.
          </p>
        </form>
      </div>

      <p className="login-footer">
        velo ia · um espaço para falar do dia, das ideias e do que vier
      </p>
    </main>
  );
}
