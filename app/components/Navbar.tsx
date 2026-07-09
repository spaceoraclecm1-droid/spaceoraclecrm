'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import React from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [reportsOpen, setReportsOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Effect for navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  // Only show the main navigation if user is logged in and not loading
  const showNav = !loading && user;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-[#0d1615]/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <nav className="premium-container py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-12 w-auto relative">
              <Image 
                src="https://i.ibb.co/fYLpx9rW/Untitled-design1-1.jpg" 
                alt="Space Oracle Logo" 
                width={180} 
                height={48} 
                priority
                className="object-contain"
              />
            </div>
          </Link>
          
          {showNav && (
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/" label="Dashboard" />
              <NavLink href="/enquiry/new" label="New Enquiry" />
              <NavLink href="/enquiry/list" label="Enquiries" />
              <NavLink href="/site-visits" label="Site Visits" />
              
              {/* Reports Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className="flex items-center hover:text-[#c69c6d] transition-colors focus:outline-none px-4 py-2 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10"
                >
                  Reports
                  <svg
                    className={`ml-1 h-4 w-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {reportsOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white text-gray-700 z-50">
                    <div className="py-1">
                      <Link
                        href="/reports/employee-inquiry"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Employee Inquiry Report
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Profile */}
              <div className="relative ml-4">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#c69c6d] flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user?.username?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-sm">
                    <div className="font-medium">{user?.username}</div>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white text-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {showNav && (
            <div className="md:hidden">
              <MobileMenu user={user} onLogout={handleLogout} />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

const NavLink = ({ href, label }: { href: string; label: string }) => {
  return (
    <Link href={href} className="px-4 py-2 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10 transition-colors">
      {label}
    </Link>
  );
};

const MobileMenu = ({ user, onLogout }: { user: any; onLogout: () => Promise<void> }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#0d1615] shadow-lg p-4 scale-in">
          <div className="flex flex-col space-y-2">
            {/* User info for mobile */}
            {user && (
              <div className="px-4 py-2 mb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#c69c6d] flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{user.username}</div>
                  </div>
                </div>
              </div>
            )}
            
            <MobileNavLink href="/" label="Dashboard" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/enquiry/new" label="New Enquiry" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/enquiry/list" label="Enquiries" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/site-visits" label="Site Visits" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/reports/employee-inquiry" label="Reports" onClick={() => setIsOpen(false)} />
            
            <button 
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-2 text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavLink = ({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => {
  return (
    <Link href={href} className="px-4 py-3 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10 transition-colors" onClick={onClick}>
      {label}
    </Link>
  );
}; 