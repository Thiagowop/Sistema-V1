
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email && password) {
        setIsLoading(false);
        onLogin();
      } else {
        setIsLoading(false);
        setError('Por favor, preencha todos os campos.');
      }
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans p-4">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-50 opacity-5 z-0" />
      <div className="absolute -top-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 md:w-96 md:h-96 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
      
      {/* Main Card */}
      <div className="bg-white p-6 sm:p-10 md:p-12 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-[420px] relative z-10 border border-slate-200">
        
        {/* MCSA Logo Branding - Responsive & Aligned */}
        <div className="flex flex-col items-center justify-center mb-8 md:mb-10">
             <div className="relative">
                {/* Main Logo Text - Responsive Sizes */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-900 m-0 leading-none select-none">
                  MCSA
                </h1>
                {/* Strikethrough Bar */}
                <div className="absolute top-[54%] left-[-6%] right-[-6%] h-[3px] md:h-[4px] bg-slate-500/80 rounded-full"></div>
             </div>
             {/* Subtitle Technology - Perfectly Aligned width */}
             <p className="text-xs md:text-base font-bold tracking-[0.58em] text-slate-400 mt-2 md:mt-3 uppercase text-center w-full pl-1 md:pl-2">
               Tecnologia
             </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all font-medium text-sm md:text-base"
                placeholder="nome@mcsa.com.br"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-slate-600 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all font-medium text-sm md:text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-slate-800 focus:ring-slate-800 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-slate-500 cursor-pointer select-none">
                Lembrar-me
              </label>
            </div>
            <div className="text-xs">
              <a href="#" className="font-bold text-slate-600 hover:text-slate-800 transition-colors">
                Recuperar acesso
              </a>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg flex items-center gap-2 animate-fadeIn border border-rose-100">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-slate-300/50 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar no Sistema <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Footer inside card */}
        <div className="mt-6 md:mt-8 text-center pt-5 md:pt-6 border-t border-slate-50">
          <p className="text-[9px] md:text-[10px] text-slate-300 uppercase tracking-wide font-bold">
            Protegido por criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  );
};
