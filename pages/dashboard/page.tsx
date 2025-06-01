import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DashboardClient } from './client'
import { Upload, UserStats } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [stats, setStats] = useState<UserStats>({
    total_uploads: 0,
    storage_used: 0,
    last_upload: null
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Fetch uploads
        const { data: uploadsData } = await supabase
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
          .order('created_at', { ascending: false })

        // Fetch stats
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setUploads(uploadsData || [])
        setStats(statsData || {
          total_uploads: 0,
          storage_used: 0,
          last_upload: null
        })
      }
    }
    checkUser()
  }, [router, supabase])

  if (!userId) {
    return null // or a loading spinner
  }

  return (
    <DashboardClient 
      userId={userId}
      initialUploads={uploads}
      initialStats={stats}
    />
  )
}
