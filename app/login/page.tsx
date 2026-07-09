'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Animation helper
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(username, password);
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2e29] to-[#0d1615]">
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5 mix-blend-overlay"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
          {/* Logo */}
          <div className="mb-12 transform transition-all duration-1000 ease-out"
               style={{ transform: mounted ? 'translateY(0)' : 'translateY(-2rem)', opacity: mounted ? 1 : 0 }}>
            <Image 
              src="https://i.ibb.co/fYLpx9rW/Untitled-design1-1.jpg" 
              alt="Space Oracle Logo" 
              width={300} 
              height={80} 
              priority
              className="object-contain"
            />
          </div>

          {/* Premium Features */}
          <div className="space-y-8 max-w-md mx-auto">
            <div className="transform transition-all duration-1000 delay-300 ease-out"
                 style={{ transform: mounted ? 'translateY(0)' : 'translateY(1rem)', opacity: mounted ? 1 : 0 }}>
              <h1 className="text-4xl font-bold text-white mb-4">
                Premium Real Estate <br />
                <span className="text-[#c69c6d]">Management Platform</span>
              </h1>
            </div>

            <div className="space-y-6 transform transition-all duration-1000 delay-500 ease-out"
                 style={{ transform: mounted ? 'translateY(0)' : 'translateY(1rem)', opacity: mounted ? 1 : 0 }}>
              <div className="flex items-center space-x-4 text-[#e5d0b1]">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#c69c6d]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#c69c6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#c69c6d]">Enterprise Security</h3>
                  <p className="text-sm opacity-80">Advanced protection for your data</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-[#e5d0b1]">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#c69c6d]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#c69c6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-[#c69c6d]">Real-time Analytics</h3>
                  <p className="text-sm opacity-80">Instant insights and reporting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Signature */}
          <div className="absolute bottom-12 transform transition-all duration-1000 delay-700 ease-out"
               style={{ transform: mounted ? 'translateY(0)' : 'translateY(1rem)', opacity: mounted ? 0.8 : 0 }}>
            <div className="text-[#c69c6d] text-sm tracking-widest">SPACE ORACLE</div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0d1615] dark:to-[#1a2e29]">
        <div className="w-full max-w-md transform transition-all duration-1000 ease-out"
             style={{ transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)', opacity: mounted ? 1 : 0 }}>
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <Image 
              src="https://i.ibb.co/fYLpx9rW/Untitled-design1-1.jpg" 
              alt="Space Oracle Logo" 
              width={200} 
              height={50} 
              priority
              className="object-contain mx-auto"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/80 dark:bg-[#1a2e29]/50 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 dark:border-[#c69c6d]/20 overflow-hidden">
            <div className="p-8 lg:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#1a2e29] dark:text-white mb-2">Welcome Back</h2>
                <p className="text-gray-600 dark:text-[#e5d0b1]">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 h-12 bg-white dark:bg-[#264a42]/30 border border-gray-200 dark:border-[#c69c6d]/20 rounded-xl focus:ring-2 focus:ring-[#c69c6d] focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 h-12 bg-white dark:bg-[#264a42]/30 border border-gray-200 dark:border-[#c69c6d]/20 rounded-xl focus:ring-2 focus:ring-[#c69c6d] focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#1a2e29] to-[#264a42] dark:from-[#c69c6d] dark:to-[#deb887] text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c69c6d] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg dark:shadow-[0_4px_16px_rgba(198,156,109,0.3)]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Signing in...
                    </div>
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#c69c6d]/10">
                <div className="flex justify-center">
                  <p className="text-sm text-gray-500 dark:text-[#e5d0b1]/60">
                    © {new Date().getFullYear()} Space Oracle. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 