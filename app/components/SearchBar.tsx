'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  submitOnEnter?: boolean;
  redirectUrl?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = 'Search enquiries...', 
  defaultValue = '',
  submitOnEnter = false,
  redirectUrl = ''
}: SearchBarProps) {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(defaultValue);
  
  // Update internal state when defaultValue prop changes
  useEffect(() => {
    console.log('SearchBar defaultValue changed:', defaultValue);
    setValue(defaultValue);
  }, [defaultValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // Don't trim here - pass the exact value including empty string
    // This ensures that clearing works properly
    onSearch(newValue);
  };

  const handleQuickFilter = (filterValue: string) => {
    setValue(filterValue);
    onSearch(filterValue);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanValue = value.trim();
    onSearch(cleanValue);
    
    // If submitOnEnter is true and redirectUrl is provided, redirect with the search query
    if (submitOnEnter && redirectUrl && cleanValue) {
      console.log('Redirecting to:', `${redirectUrl}?search=${encodeURIComponent(cleanValue)}`);
      router.push(`${redirectUrl}?search=${encodeURIComponent(cleanValue)}`);
    }
  };

  return (
    <div className={`w-full mb-6 transition-all duration-300 ${isFocused ? 'scale-[1.01]' : 'scale-[1]'}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          type="text"
          className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-[#111f1c] 
            text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 
            shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c69c6d] focus:border-transparent 
            transition-all duration-300 ${isFocused ? 'shadow-md' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </form>
      
      {/* Quick Filters - Optional */}
      <div className="flex gap-2 mt-2 px-1">
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => handleQuickFilter("today")}
        >
          Today
        </button>
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => handleQuickFilter("new")}
        >
          New
        </button>
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => handleQuickFilter("due")}
        >
          Due
        </button>
      </div>
    </div>
  );
} 