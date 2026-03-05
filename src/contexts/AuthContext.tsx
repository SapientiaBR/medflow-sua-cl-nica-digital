import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Doctor } from '@/types';
import { mockDoctor } from '@/data/mock';

interface AuthContextType {
  doctor: Doctor | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Partial<Doctor> & { password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(mockDoctor);
  const isAuthenticated = !!doctor;

  const login = async (_email: string, _password: string) => {
    setDoctor(mockDoctor);
    return true;
  };

  const register = async (data: Partial<Doctor> & { password: string }) => {
    setDoctor({ ...mockDoctor, ...data, id: 'doc-new' });
    return true;
  };

  const logout = () => setDoctor(null);

  return (
    <AuthContext.Provider value={{ doctor, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
