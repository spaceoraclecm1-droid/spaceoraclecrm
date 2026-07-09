'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // This check is redundant with the AuthContext protection, but provides
  // an extra layer of security and better UX
  useEffect(() => {
    if (pageLoaded && !loading && !user) {
      router.push('/login');
    }
  }, [pageLoaded, loading, user, router]);

  if (loading || !pageLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-12 px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Protected Page</h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                This page is only visible to authenticated users
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                href="/" 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Welcome, {user?.username}!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This is a secure page only accessible to authenticated users.
          </p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="text-amber-800 dark:text-amber-400 font-medium mb-2">
            Your Account Details
          </h3>
          <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
            <li><strong>User ID:</strong> {user?.id}</li>
            <li><strong>Username:</strong> {user?.username}</li>
            <li><strong>Created At:</strong> {new Date(user?.created_at || '').toLocaleString()}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 