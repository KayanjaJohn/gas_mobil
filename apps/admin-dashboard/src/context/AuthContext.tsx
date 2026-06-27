import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FIX: Verify token on mount and handle errors properly
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          console.log('[ADMIN AUTH] Verifying token...');
          const res = await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          });
          
          // Handle both response formats
          const userData = res.data.data?.user || res.data.user;
          if (userData) {
            setUser(userData);
            setError(null);
            console.log('[ADMIN AUTH] ✅ Token verified');
          } else {
            throw new Error('No user data in response');
          }
        } catch (err: any) {
          console.error('[ADMIN AUTH] ❌ Token verification failed:', err.message);
          // Clear invalid token
          localStorage.removeItem('admin_token');
          setToken(null);
          setUser(null);
          setError('Session expired. Please login again.');
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      console.log('[ADMIN AUTH] Login attempt:', email);
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { emailOrPhone: email, password },
        { timeout: 5000 }
      );
      
      // Handle both response formats
      const responseData = res.data.data || res.data;
      const newToken = responseData.token;
      const newUser = responseData.user;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('admin_token', newToken);
      setToken(newToken);
      setUser(newUser);
      setError(null);
      console.log('[ADMIN AUTH] ✅ Login successful');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMsg);
      console.error('[ADMIN AUTH] ❌ Login failed:', errorMsg);
      throw err;
    }
  };

  const logout = () => {
    console.log('[ADMIN AUTH] Logout called');
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
