// app/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { use } from 'react'
import { DashboardClient } from './client'
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: user } = use(supabase.auth.getUser())
  
  // Redirect if no user is found
  if (!user?.user?.id) {
    redirect('/signin')
  }
  
  // Fetch uploads with their associated outputs
  const { data: uploads } = use(
    supabase
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
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
  )

  // Fetch user storage stats
  const { data: stats } = use(
    supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.user.id)
      .single()
  )

  return (
    <DashboardClient 
      initialUploads={uploads || []}
      initialStats={stats || {
        total_uploads: 0,
        storage_used: 0,
        last_upload: null
      }}
      userId={user.user.id}
    />
  )
}
