/**
 * @id CTX-AUTH-001
 * @name AuthContext
 * @description Context de autenticação - gerencia token ClickUp e estado de login
 * @dependencies none
 * @status active
 * @version 2.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  teamId: string | null;
  userId: string | null;
  userName: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue {
  // State
  auth: AuthState;
  
  // Actions
  login: (token: string, teamId?: string) => Promise<boolean>;
  logout: () => void;
  validateToken: (token: string) => Promise<boolean>;
  updateCredentials: (token: string, teamId: string) => void;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  teamId: null,
  userId: null,
  userName: null,
  isLoading: true,
  error: null
};

const AUTH_STORAGE_KEY = 'dailyFlow_auth_v2';

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
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          if (parsed.token) {
            // Validate token is still valid
            const isValid = await validateTokenInternal(parsed.token);
            
            if (isValid) {
              setAuth({
                isAuthenticated: true,
                token: parsed.token,
                teamId: parsed.teamId || null,
                userId: parsed.userId || null,
                userName: parsed.userName || null,
                isLoading: false,
                error: null
              });
              console.log('[CTX-AUTH-001] Auth restored from storage');
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

      const newAuth: AuthState = {
        isAuthenticated: true,
        token: cleanToken,
        teamId: teamId || null,
        userId: userInfo.user.id?.toString() || null,
        userName: userInfo.user.username || userInfo.user.email || null,
        isLoading: false,
        error: null
      };

      // Save to storage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        token: cleanToken,
        teamId: teamId || null,
        userId: newAuth.userId,
        userName: newAuth.userName
      }));

      setAuth(newAuth);
      console.log(`[CTX-AUTH-001] Login successful: ${newAuth.userName}`);
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
  // CONTEXT VALUE
  // ============================================
  
  const value: AuthContextValue = {
    auth,
    login,
    logout,
    validateToken,
    updateCredentials
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
