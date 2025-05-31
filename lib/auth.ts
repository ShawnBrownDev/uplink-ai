import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { getSupabaseClient } from './supabase';
import type { UserProfile, ProfileUpdate, Profile } from './types';

export const useAuth = () => {
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          setProfile(null);
          return;
        }

        const { data, error } = await getSupabaseClient()
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If profile doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { error: insertError } = await getSupabaseClient()
              .from('profiles')
              .insert({ id: user.id });
            
            if (insertError) {
              console.error('Error creating profile:', insertError);
              return;
            }
            
            // Try fetching again
            const { data: newData, error: newError } = await getSupabaseClient()
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (newError) {
              console.error('Error fetching new profile:', newError);
              return;
            }
            
            setProfile({
              ...user,
              avatar_url: newData?.avatar_url || undefined,
              full_name: newData?.full_name || undefined,
              updated_at: newData?.updated_at || undefined,
            });
            return;
          }
          return;
        }

        setProfile({
          ...user,
          avatar_url: data?.avatar_url || undefined,
          full_name: data?.full_name || undefined,
          updated_at: data?.updated_at || undefined,
        });
      } catch (error) {
        console.error('Error in getProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await getSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await getSupabaseClient().auth.signOut();
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        password,
      });
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    try {
      if (!user) throw new Error('No user found');
      
      // Update auth metadata if needed
      if (updates.email) {
        const { error: authError } = await getSupabaseClient().auth.updateUser({
          email: updates.email,
        });
        
        if (authError) throw authError;
      }
      
      if (updates.password) {
        const { error: authError } = await getSupabaseClient().auth.updateUser({
          password: updates.password,
        });
        
        if (authError) throw authError;
      }
      
      // Update profile data in profiles table
      const { error: profileError } = await getSupabaseClient()
        .from('profiles')
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Update local state
      setProfile({
        ...profile,
        ...updates,
      } as UserProfile);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
};

// Use this hook to protect routes that require authentication
export const useRequireAuth = (redirectUrl = '/auth/signin') => {
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      // If no session exists, user is not logged in
      if (!session) {
        router.push(redirectUrl);
      } else {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, redirectUrl]);

  return { user, loading };
};