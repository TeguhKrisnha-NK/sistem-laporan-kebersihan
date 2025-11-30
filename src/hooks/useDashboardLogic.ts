'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Report, Class } from '@/types'
import toast from 'react-hot-toast'

// Kita definisikan tipe data di sini agar bisa dipakai di komponen lain
export interface DashboardReport extends Omit<Report, 'classes'> {
  classes: Class | null;
}

export function useDashboardLogic() {
  const supabase = createClient()
  const [allReports, setAllReports] = useState<DashboardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Fungsi Fetch Data
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, classes(*)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAllReports(data || [])
      setLastUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Setup Realtime
  useEffect(() => {
    fetchReports()
    
    const channel = supabase.channel('dashboard_realtime_logic')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        // Refresh data diam-diam saat ada update
        fetchReports()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchReports, supabase])

  return {
    loading,
    allReports,
    lastUpdate,
    fetchReports // Kita return ini biar tombol Refresh manual bisa jalan
  }
}
