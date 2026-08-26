import React, { useState } from "react";
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertTriangle, KeyRound } from "lucide-react";
import { ExtractedPalette } from "../utils/logoThemeExtractor";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  logoUrl: string;
  onLogoError: () => void;
  brandPalette: ExtractedPalette;
}

export default function LoginScreen({
  onLoginSuccess,
  logoUrl,
  onLogoError,
  brandPalette,
}: LoginScreenProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanLogin = login.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Verify mandatory credentials
    if (cleanLogin === "karol@opera" && cleanPassword === "010125") {
      // Successful authentication
      setTimeout(() => {
        onLoginSuccess();
      }, 300);
    } else {
      setIsSubmitting(false);
      if (cleanLogin !== "karol@opera" && cleanPassword !== "010125") {
        setErrorMessage("Login e senha incorretos. Verifique suas credenciais.");
      } else if (cleanLogin !== "karol@opera") {
        setErrorMessage("Login incorreto. Digite o usuário autorizado.");
      } else {
        setErrorMessage("Senha incorreta. Tente novamente.");
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden select-none"
      id="opera_login_screen"
    >
      {/* Dynamic branding background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_65%)] opacity-20 animate-pulse pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--brand-accent)_0%,_transparent_70%)] opacity-15 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--brand-primary)_0%,_transparent_70%)] opacity-15 pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] stroke-brand-primary pointer-events-none -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="login_grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login_grid)" />
      </svg>

      <div className="relative max-w-md w-full bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center space-y-6 animate-fade-in">
        {/* Logo Container */}
        <div className="flex justify-center">
          <div className="relative w-28 h-28 bg-zinc-950 border border-zinc-800 rounded-3xl p-3 flex items-center justify-center shadow-xl group">
            {/* Corner highlights */}
            <div
              className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2"
              style={{ borderColor: brandPalette.accent }}
            />
            <div
              className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2"
              style={{ borderColor: brandPalette.accent }}
            />
            <div
              className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2"
              style={{ borderColor: brandPalette.accent }}
            />
            <div
              className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2"
              style={{ borderColor: brandPalette.accent }}
            />
            <img
              src={logoUrl}
              alt="Opera Formação"
              onError={onLogoError}
              className="w-full h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* System Header */}
        <div className="space-y-1.5">
          <span
            className="text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full text-white inline-flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: brandPalette.accent }}
          >
            <Lock className="w-3 h-3" /> Acesso Restrito
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            OPERA FORMAÇÃO
          </h1>
          <p className="text-xs text-zinc-400 font-medium">
            Emissor Oficial de Carteiras e Certificados Digitais
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Login Field */}
          <div className="space-y-1.5">
            <label htmlFor="user_login" className="text-xs font-bold text-zinc-300 block">
              Login de Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="user_login"
                type="text"
                required
                autoComplete="username"
                autoFocus
                placeholder=""
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/90 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white placeholder-zinc-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="user_password" className="text-xs font-bold text-zinc-300 block">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="user_password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder=""
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full pl-10 pr-11 py-3 bg-zinc-950/90 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white placeholder-zinc-600 transition-all font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-xl hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            style={{ backgroundColor: brandPalette.accent }}
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest pt-2 border-t border-zinc-800/60 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-zinc-600" />
          Ambiente Seguro & Criptografado
        </div>
      </div>
    </div>
  );
}
