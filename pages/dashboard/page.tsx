import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import DashboardClient from '@/components/dashboard/client'
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
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
          .order('created_at', { ascending: false })

        // Fetch stats
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (uploadsError) console.error('Error fetching uploads:', uploadsError);
        if (statsError) console.error('Error fetching user stats:', statsError);

        console.log('Fetched uploadsData in page.tsx:', uploadsData);
        setUploads(uploadsData || [])
        setStats(statsData || {
          total_uploads: 0,
          storage_used: 0,
          last_upload: null
        })
      }
      setLoading(false);
    }
    checkUserAndFetchData()
  }, [router, supabase])

  if (loading || !userId) {
    return <div>Loading...</div>; // Or a proper loading spinner/component
  }

  return (
    <DashboardClient 
      userId={userId}
      initialUploads={uploads}
      initialStats={stats}
    />
  )
}
