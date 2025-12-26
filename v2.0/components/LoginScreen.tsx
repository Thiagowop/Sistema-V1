/**
 * @id COMP-LOGIN-001
 * @name LoginScreen
 * @description Tela de login com autenticação Supabase e visual MCSA
 * @status active
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getRememberedEmail,
  type AuthorizedUser
} from '../services/supabaseService';

interface LoginScreenProps {
  onLogin: (user: AuthorizedUser) => void;
}

// Logo MCSA com risco centralizado
const BrandLogo = () => (
  <div className="flex flex-col items-center justify-center select-none">
    <div className="relative flex items-center justify-center py-2">
      {/* Texto Principal */}
      <h1 className="text-6xl font-black text-slate-900 tracking-tighter relative z-10 leading-none">
        MCSA
      </h1>

      {/* Efeito sutil de brilho atrás */}
      <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
    </div>

    {/* Subtítulo */}
    <div className="mt-5 w-full flex justify-center border-t border-slate-200 pt-3">
      <p className="text-[10px] font-bold tracking-[0.6em] text-slate-400 uppercase pl-1 transition-colors hover:text-slate-600">
        Tecnologia
      </p>
    </div>
  </div>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { loginUser, auth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Carregar email salvo ao montar
  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Mostrar erro do auth context
  useEffect(() => {
    if (auth.error) {
      setError(auth.error);
    }
  }, [auth.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      // Autenticar via AuthContext (que usa Supabase)
      const success = await loginUser(email, password, rememberMe);

      if (success) {
        // O estado do auth vai mudar e o App vai re-renderizar automaticamente
        // O onLogin é chamado para callback externo se necessário
        setIsLoading(false);
        // Pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          // Ler user da session storage como fallback
          const userSession = localStorage.getItem('dailyFlow_userSession_v2');
          if (userSession) {
            const user = JSON.parse(userSession) as AuthorizedUser;
            onLogin(user);
          }
        }, 100);
      } else {
        setError('Credenciais inválidas. Verifique seu email e senha.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[LoginScreen] Erro na autenticação:', err);
      setError('Erro de conexão. Verifique sua internet.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden p-4">

      {/* Background animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-900" />

        {/* Orbes de luz com animação fluida */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-600/15 rounded-full blur-[140px] animate-blob animation-delay-4000 mix-blend-screen" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] animate-blob animation-delay-8000 mix-blend-screen" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none" />

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-[400px] animate-zoom-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/50 border border-white/10 overflow-hidden">

          <div className="p-8 pt-12">
            {/* Branding */}
            <div className="mb-10">
              <BrandLogo />
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  E-mail Corporativo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                    placeholder="nome@mcsa.com.br"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                  Senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Lembrar-me e recuperar senha */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <div className={`relative w-4 h-4 rounded-[4px] border transition-all duration-200 flex items-center justify-center ${rememberMe
                    ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                    : 'border-slate-300 group-hover:border-indigo-400 bg-white'
                    }`}>
                    <svg className={`w-3 h-3 text-white transition-transform duration-200 ${rememberMe ? 'scale-100' : 'scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Lembrar-me</span>
                </label>

                <a href="#" className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              {/* Erro */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
                  <Shield size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Botão de login */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-800/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 overflow-hidden"
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer do Card */}
          <div className="bg-slate-50/50 p-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Protegido por MCSA Security Layer • v2.0
            </p>
          </div>
        </div>
      </div>

      <style>{`
        /* Animação de background (Orbes) */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite ease-in-out;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-8000 {
          animation-delay: 8s;
        }

        /* Animações de UI */
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .group-hover\\:animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-zoom-in {
          animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
