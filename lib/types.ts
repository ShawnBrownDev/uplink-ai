import { Database } from '@/types/supabase';
import type { User } from '@supabase/supabase-js'

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface UserProfile extends User {
  full_name?: string
  avatar_url?: string
  updated_at?: string
}

export interface ProfileUpdate {
  full_name?: string
  avatar_url?: string
  email?: string
  password?: string
}


export interface Output {
  id: string;
  type: string;
  url: string;
  created_at: string;
}

export interface Upload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  url: string;
  outputs?: Output[];
}

export interface UserStats {
  total_uploads: number;
  storage_used: number;
  last_upload: string | null;
}

export interface DashboardClientProps {
  userId: string;
  initialUploads: Upload[];
  initialStats: UserStats;
}
