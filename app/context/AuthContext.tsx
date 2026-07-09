'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../utils/supabase';

interface User {
  id: string;
  username: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Check for user in localStorage
        const storedUser = localStorage.getItem('crm_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    const protectRoutes = async () => {
      if (loading) return;

      // Paths that don't require authentication
      const publicPaths = ['/login', '/reset-password'];
      
      // If on a protected route and not authenticated, redirect to login
      if (!user && !publicPaths.includes(pathname) && pathname !== '/login') {
        router.push('/login');
      }
      
      // If authenticated and on login page, redirect to dashboard
      if (user && pathname === '/login') {
        router.push('/');
      }
    };

    protectRoutes();
  }, [user, loading, pathname, router]);

  const login = async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Query the users table to check credentials
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Simple password check - in a real app, use proper password hashing
      if (data.password !== password) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Create a user object without the password
      const loggedInUser = {
        id: data.id,
        username: data.username,
        created_at: data.created_at
      };

      // Store user in state and localStorage
      setUser(loggedInUser);
      localStorage.setItem('crm_user', JSON.stringify(loggedInUser));

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Remove user from state and localStorage
      setUser(null);
      localStorage.removeItem('crm_user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    if (user) return true;
    
    try {
      const storedUser = localStorage.getItem('crm_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 