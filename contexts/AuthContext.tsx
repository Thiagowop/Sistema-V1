/**
 * @id CTX-AUTH-001
 * @name AuthContext
 * @description Context de autenticação - gerencia usuário Supabase e token ClickUp
 * @dependencies supabaseService
 * @status active
 * @version 2.1.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  AuthorizedUser,
  authenticateUser as supabaseAuth,
  saveRememberedEmail,
  getRememberedEmail,
  clearRememberedEmail
} from '../services/supabaseService';

// ============================================
// TYPES
// ============================================

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthorizedUser | null;  // Usuário do Supabase
  token: string | null;         // Token ClickUp (para API)
  teamId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue {
  // State
  auth: AuthState;

  // Supabase User Actions
  loginUser: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logoutUser: () => void;

  // ClickUp Token Actions (mantido para compatibilidade)
  login: (token: string, teamId?: string) => Promise<boolean>;
  logout: () => void;
  validateToken: (token: string) => Promise<boolean>;
  updateCredentials: (token: string, teamId: string) => void;

  // Role Helpers
  isAdmin: boolean;
  isViewer: boolean;
  canSync: boolean;
  canAccessAdmin: boolean;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  teamId: null,
  isLoading: true,
  error: null
};

const AUTH_STORAGE_KEY = 'dailyFlow_auth_v2';
const USER_SESSION_KEY = 'dailyFlow_userSession_v2';

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);

  // ============================================
  // LOAD SAVED AUTH ON MOUNT
  // ============================================

  useEffect(() => {
    const loadSavedAuth = async () => {
      console.log('[CTX-AUTH-001] Loading saved auth...');

      try {
        // 1. Primeiro, tentar carregar sessão do usuário (Supabase)
        const userSession = localStorage.getItem(USER_SESSION_KEY);
        if (userSession) {
          const user = JSON.parse(userSession) as AuthorizedUser;
          console.log('[CTX-AUTH-001] ✅ User session restored:', user.name);

          // 2. Também carregar token ClickUp se existir
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          const clickupAuth = saved ? JSON.parse(saved) : null;

          setAuth({
            isAuthenticated: true,
            user: user,
            token: clickupAuth?.token || null,
            teamId: clickupAuth?.teamId || null,
            isLoading: false,
            error: null
          });
          return;
        }

        // Fallback: Apenas token ClickUp (sem user Supabase)
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);

          if (parsed.token) {
            const isValid = await validateTokenInternal(parsed.token);

            if (isValid) {
              setAuth({
                isAuthenticated: false, // Não autenticado sem user Supabase
                user: null,
                token: parsed.token,
                teamId: parsed.teamId || null,
                isLoading: false,
                error: null
              });
              console.log('[CTX-AUTH-001] ClickUp token restored (no user session)');
              return;
            }
          }
        }
      } catch (e) {
        console.warn('[CTX-AUTH-001] Failed to load saved auth:', e);
      }

      setAuth(prev => ({ ...prev, isLoading: false }));
    };

    loadSavedAuth();
  }, []);

  // ============================================
  // VALIDATE TOKEN (Internal)
  // ============================================
  
  const validateTokenInternal = async (token: string): Promise<boolean> => {
    try {
      // Try to fetch user info to validate token
      const response = await fetch('https://api.clickup.com/api/v2/user', {
        headers: {
          'Authorization': token.replace(/\s/g, ''),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return true;
      }

      // If direct fails, try via proxy
      const proxyResponse = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://api.clickup.com/api/v2/user')}`, {
        headers: {
          'Authorization': token.replace(/\s/g, ''),
          'Content-Type': 'application/json'
        }
      });

      return proxyResponse.ok;
    } catch (e) {
      console.warn('[CTX-AUTH-001] Token validation failed:', e);
      return false;
    }
  };

  // ============================================
  // VALIDATE TOKEN (Public)
  // ============================================
  
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    console.log('[CTX-AUTH-001] Validating token...');
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isValid = await validateTokenInternal(token);
      
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: isValid ? null : 'Token inválido'
      }));

      return isValid;
    } catch (e: any) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: e.message || 'Erro ao validar token'
      }));
      return false;
    }
  }, []);

  // ============================================
  // LOGIN
  // ============================================
  
  const login = useCallback(async (token: string, teamId?: string): Promise<boolean> => {
    console.log('[CTX-AUTH-001] Logging in...');
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate token first
      const cleanToken = token.replace(/\s/g, '');
      
      // Try to get user info
      let userInfo: any = null;
      
      try {
        const response = await fetch('https://api.clickup.com/api/v2/user', {
          headers: {
            'Authorization': cleanToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          userInfo = await response.json();
        }
      } catch {
        // Try via proxy
        const proxyResponse = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://api.clickup.com/api/v2/user')}`, {
          headers: {
            'Authorization': cleanToken,
            'Content-Type': 'application/json'
          }
        });

        if (proxyResponse.ok) {
          userInfo = await proxyResponse.json();
        }
      }

      if (!userInfo || !userInfo.user) {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: 'Token inválido ou expirado'
        }));
        return false;
      }

      // Save ClickUp credentials to storage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: cleanToken,
        teamId: teamId || null,
        clickupUserId: userInfo.user.id?.toString() || null,
        clickupUserName: userInfo.user.username || userInfo.user.email || null
      }));

      setAuth(prev => ({
        ...prev,
        token: cleanToken,
        teamId: teamId || null,
        isLoading: false,
        error: null
      }));
      console.log(`[CTX-AUTH-001] ClickUp login successful: ${userInfo.user.username}`);
      return true;

    } catch (e: any) {
      console.error('[CTX-AUTH-001] Login error:', e);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: e.message || 'Erro ao fazer login'
      }));
      return false;
    }
  }, []);

  // ============================================
  // LOGOUT
  // ============================================
  
  const logout = useCallback(() => {
    console.log('[CTX-AUTH-001] Logging out...');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({
      ...defaultAuthState,
      isLoading: false
    });
  }, []);

  // ============================================
  // UPDATE CREDENTIALS
  // ============================================

  const updateCredentials = useCallback((token: string, teamId: string) => {
    console.log('[CTX-AUTH-001] Updating credentials...');

    const cleanToken = token.replace(/\s/g, '');

    setAuth(prev => ({
      ...prev,
      token: cleanToken,
      teamId
    }));

    // Update storage
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...parsed,
          token: cleanToken,
          teamId
        }));
      } catch {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          token: cleanToken,
          teamId
        }));
      }
    }
  }, []);

  // ============================================
  // LOGIN USER (Supabase)
  // ============================================

  const loginUser = useCallback(async (
    email: string,
    password: string,
    remember: boolean = false
  ): Promise<boolean> => {
    console.log('[CTX-AUTH-001] 🔐 Logging in user:', email);
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await supabaseAuth(email, password);

      if (result.success && result.user) {
        // Salvar sessão do usuário
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(result.user));

        // Gerenciar "Lembrar-me"
        if (remember) {
          saveRememberedEmail(email);
        } else {
          clearRememberedEmail();
        }

        // Carregar token ClickUp existente se houver
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        const clickupAuth = saved ? JSON.parse(saved) : null;

        setAuth({
          isAuthenticated: true,
          user: result.user,
          token: clickupAuth?.token || null,
          teamId: clickupAuth?.teamId || null,
          isLoading: false,
          error: null
        });

        console.log('[CTX-AUTH-001] ✅ User logged in:', result.user.name);
        return true;
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Credenciais inválidas'
        }));
        return false;
      }
    } catch (e: any) {
      console.error('[CTX-AUTH-001] ❌ Login error:', e);
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: e.message || 'Erro ao fazer login'
      }));
      return false;
    }
  }, []);

  // ============================================
  // LOGOUT USER (Supabase)
  // ============================================

  const logoutUser = useCallback(() => {
    console.log('[CTX-AUTH-001] 🚪 Logging out user...');

    // Remover sessão do usuário
    localStorage.removeItem(USER_SESSION_KEY);

    // NÃO remover remembered email (para facilitar próximo login)
    // NÃO remover token ClickUp (mantém configuração)

    setAuth({
      isAuthenticated: false,
      user: null,
      token: auth.token, // Manter token ClickUp
      teamId: auth.teamId,
      isLoading: false,
      error: null
    });

    console.log('[CTX-AUTH-001] ✅ User logged out');
  }, [auth.token, auth.teamId]);

  // ============================================
  // ROLE HELPERS
  // ============================================

  const isAdmin = auth.user?.role === 'admin';
  const isViewer = auth.user?.role === 'viewer';
  const canSync = isAdmin; // Only admins can sync
  const canAccessAdmin = isAdmin; // Only admins can access admin page

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextValue = {
    auth,
    // Supabase User Actions
    loginUser,
    logoutUser,
    // ClickUp Token Actions
    login,
    logout,
    validateToken,
    updateCredentials,
    // Role Helpers
    isAdmin,
    isViewer,
    canSync,
    canAccessAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('[CTX-AUTH-001] useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
