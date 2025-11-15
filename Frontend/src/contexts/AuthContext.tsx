import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('access_token', data.access_token);
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
