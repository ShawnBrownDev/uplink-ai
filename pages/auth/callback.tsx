import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { getSupabaseClient} from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallback: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get query parameters
      const { error } = await getSupabaseClient().auth.getSession();
      
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      // Redirect to dashboard or home page
      router.push('/dashboard');
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;