"use client";

import { ReactNode } from 'react';
import { Header } from './header';
import { Footer } from './footer';
import { cn } from '@/lib/utils';

type MainLayoutProps = {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  withoutFooter?: boolean;
};

export function MainLayout({
  children,
  className,
  fullWidth = false,
  withoutFooter = false,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={cn(
        "flex-1 pt-16", 
        className
      )}>
        <div className={fullWidth ? "w-full" : "container mx-auto px-4 py-8"}>
          {children}
        </div>
      </main>
      {!withoutFooter && <Footer />}
    </div>
  );
}