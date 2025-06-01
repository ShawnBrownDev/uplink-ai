import type { AppProps } from 'next/app';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() =>
    createPagesBrowserClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <Component {...pageProps} />
      <Toaster />
    </SessionContextProvider>
  );
}