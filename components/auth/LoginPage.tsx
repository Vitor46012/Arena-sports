'use client';

import React, { useState } from 'react';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';

interface LoginPageProps {
  onLoginSuccess: (role: 'admin' | 'tenant') => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const performLogin = async (loginEmail: string, loginPass?: string, directRole?: 'admin' | 'tenant') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass || 'sportsreview_edge_pass',
          directRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação. Verifique suas credenciais.');
      }

      const role = data.role === 'admin' ? 'admin' : 'tenant';
      onLoginSuccess(role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao conectar ao servidor de autenticação.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    performLogin(email, password);
  };

  const handleDevLogin = (role: 'admin' | 'tenant') => {
    const devEmail = role === 'admin' ? 'admin@sportsreview.internal' : 'arena.morumbi@sportsreview.internal';
    performLogin(devEmail, 'sportsreview_edge_pass', role);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white font-sans antialiased relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-slate-800/20 rounded-full blur-2xl pointer-events-none" />

      {/* Main Login Card */}
      <div
        id="loginCard"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Header with Official Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <div className="p-2 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-xl inline-flex items-center justify-center">
            <SportsReviewLogo variant="compact" size="lg" showTagline={true} />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-mono font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full inline-block">
              Acesso Operacional (B2B)
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="loginErrorMessage"
            role="alert"
            className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2"
          >
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="loginEmailInput"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block"
            >
              E-mail Corporativo
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
                mail
              </span>
              <input
                id="loginEmailInput"
                type="email"
                placeholder="operador@arena.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-600 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="loginPasswordInput"
                className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block"
              >
                Senha
              </label>
              <span className="text-[10px] font-mono text-slate-500 hover:text-orange-400 cursor-pointer transition-colors">
                Esqueceu a chave?
              </span>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
                lock
              </span>
              <input
                id="loginPasswordInput"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-600 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btnLoginSubmit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-70 text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Autenticando via API...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Autenticar</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase shrink-0">
            OU ACESSO RÁPIDO (DEV)
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* QA Shortcut Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            id="btnDevLoginAdmin"
            onClick={() => handleDevLogin('admin')}
            disabled={isLoading}
            className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base text-orange-500">
              admin_panel_settings
            </span>
            <span>Admin (NOC)</span>
          </button>

          <button
            type="button"
            id="btnDevLoginTenant"
            onClick={() => handleDevLogin('tenant')}
            disabled={isLoading}
            className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base text-emerald-400">
              stadium
            </span>
            <span>Tenant (Arena)</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2">
          <p className="text-[10px] font-mono text-slate-500">
            Velocity Industrial Network • Sports Review Edge v2.4
          </p>
        </div>
      </div>
    </div>
  );
}
