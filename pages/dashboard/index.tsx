import { NextPage } from 'next';
import Head from 'next/head';
import { useRequireAuth } from '@/lib/auth';
import { DashboardClient } from './client';
import { getSupabaseClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { Database } from '@/types/supabase';
import { Navbar } from '@/components/layout/navbar';

type Upload = Database['public']['Tables']['uploads']['Row'] & {
  outputs?: Database['public']['Tables']['outputs']['Row'][];
};

type UserStats = Database['public']['Tables']['user_stats']['Row'];

const Dashboard: NextPage = () => {
  const { user, loading } = useRequireAuth();
  const [initialUploads, setInitialUploads] = useState<Upload[]>([]);
  const [initialStats, setInitialStats] = useState<UserStats>({
    user_id: '',
    total_uploads: 0,
    storage_used: 0,
    last_upload: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(getSupabaseClient());

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch uploads
        const { data: uploadsData, error: uploadsError } = await supabase
          .from('uploads')
          .select(`
            *,
            outputs (
              id,
              type,
              url,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (uploadsError) {
          console.error('Error fetching uploads:', uploadsError);
          throw uploadsError;
        }

        // Fetch user stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Error fetching stats:', statsError);
          throw statsError;
        }

        setInitialUploads(uploadsData || []);
        setInitialStats(statsData || {
          total_uploads: 0,
          storage_used: 0,
          last_upload: null
        });
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, supabase]);

  if (loading || !user || isLoading) {
    return null; // Loading state handled by useRequireAuth
  }

  return (
    <>
      <Head>
        <title>Dashboard - Document Management</title>
        <meta name="description" content="Upload and manage your documents" />
      </Head>

      <Navbar isAuthenticated={true} />

      <DashboardClient 
        userId={user.id} 
        initialUploads={initialUploads}
        initialStats={initialStats}
      />
    </>
  );
};

export default Dashboard;