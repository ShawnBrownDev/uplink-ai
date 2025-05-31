export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          url: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          url: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          url?: string
        }
      }
      outputs: {
        Row: {
          id: string
          upload_id: string
          type: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          type: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          type?: string
          url?: string
          created_at?: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_uploads: number
          storage_used: number
          last_upload: string | null
        }
        Insert: {
          user_id: string
          total_uploads?: number
          storage_used?: number
          last_upload?: string | null
        }
        Update: {
          user_id?: string
          total_uploads?: number
          storage_used?: number
          last_upload?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}