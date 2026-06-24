import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string; name: string; email: string; phone: string; role: string;
  stationId?: string; station?: { id: string; name: string; address: string };
}

interface AuthContextType {
  user: User | null; token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void; isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agent_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const userData = res.data.data.user;
          if (userData.role !== 'agent') throw new Error('This portal is for station agents only');
          setUser(userData);
        })
        .catch(() => { localStorage.removeItem('agent_token'); setToken(null); })
        .finally(() => setIsLoading(false));
    } else setIsLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/auth/login`, { emailOrPhone: email, password });
    const { token: newToken, user: newUser } = res.data.data;
    if (newUser.role !== 'agent') throw new Error('This portal is for station agents only');
    localStorage.setItem('agent_token', newToken);
    setToken(newToken); setUser(newUser);
  };

  const logout = () => { localStorage.removeItem('agent_token'); setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
