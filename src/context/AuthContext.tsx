import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, loginAdmin, logoutAdmin } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user, error } = await loginAdmin(email, password);
      if (error) throw new Error(error);
      return { user, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Не удалось войти. Пожалуйста, проверьте введенные данные.';
      setError(errorMessage);
      return { user: null, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const { success, error } = await logoutAdmin();
      if (error) throw new Error(error);
      return { success, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Не удалось выйти из системы.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
