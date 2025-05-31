'use client';

import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleDark = () => {
    const root = window.document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleDark}
      aria-label="Toggle dark mode"
      type="button"
      className={`
        w-12 h-7 flex items-center rounded-full border-2 border-gray-300 dark:border-gray-600
        transition-colors duration-300 focus:outline-none
        ${isDark ? 'bg-gray-800' : 'bg-gray-200'}
      `}
    >
      <span
        className={`
          w-6 h-6 flex items-center justify-center rounded-full shadow-md transform transition-transform duration-300
          ${isDark ? 'translate-x-5 bg-gray-900 text-yellow-300' : 'translate-x-0 bg-white text-gray-700'}
        `}
      >
        {isDark ? (
          // Sun icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
            <path stroke="currentColor" strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.414-1.414M6.343 6.343L4.929 4.929m12.02 0l-1.414 1.414M6.343 17.657l-1.414 1.414" />
          </svg>
        ) : (
          // Moon icon
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke="currentColor" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}