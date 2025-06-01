'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Settings } from 'lucide-react';

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  return (
    <header className="w-full py-4 px-4 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo Link */}
        <Link href="/" className="flex items-center">
          {/* Light Mode Logo */}
          <Image
            src="/assets/logo-light.png"
            alt="Uplink AI Logo"
            width={500}
            height={200}
            className="h-28 w-auto dark:hidden"
          />
          {/* Dark Mode Logo */}
          <Image
            src="/assets/logo-dark.png"
            alt="Uplink AI Logo Dark Mode"
            width={500}
            height={200}
            className="h-28 w-auto hidden dark:block"
          />
        </Link>

        {/* Navigation Links (optional, add later) */}
        {/* <nav className="hidden md:flex gap-6">
          <Link href="/#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Features</Link>
          <Link href="/#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Pricing</Link>
          <Link href="/#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Contact</Link>
        </nav> */}

        {/* Auth Buttons and Dark Mode Toggle */}
        <div className="flex gap-2 items-center">
          {!isAuthenticated && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Create Account</Link>
              </Button>
            </>
          )}

          {isAuthenticated && (
            <>
              {/* Dashboard Link (shown on profile page) */}
              {pathname === '/profile' && (
                <Button variant="ghost" size="sm" asChild className="mr-1">
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </Button>
              )}

              {/* Settings button (hidden on profile page) */}
              {pathname !== '/profile' && (
                <Button variant="ghost" size="icon" asChild className="mr-1">
                  <Link href="/profile">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Settings</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}

          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
} 