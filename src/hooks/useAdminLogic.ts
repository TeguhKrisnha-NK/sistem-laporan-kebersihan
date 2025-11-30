'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Report, Class } from '@/types'

// Types
export interface ExtendedReport extends Omit<Report, 'foto_url'> {
  classes: Class;
  foto_url: string[] | null;
}

export interface InspectionGroup {
  id: number;
  classes: string[];
  officers: string[];
}

export function useAdminLogic() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<ExtendedReport[]>([])
  const [groups, setGroups] = useState<InspectionGroup[]>([])

  // --- FETCHING ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [reportsRes, groupsRes] = await Promise.all([
        supabase.from('reports').select('*, classes(*)').order('created_at', { ascending: false }),
        supabase.from('inspection_groups').select('*').order('id', { ascending: true })
      ])
      
      if (reportsRes.error) throw reportsRes.error
      if (groupsRes.error) throw groupsRes.error

      setReports(reportsRes.data || [])
      setGroups(groupsRes.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // --- DELETE REPORT + PHOTO ---
  const deleteReport = async (id: string) => {
    try {
      // 1. Ambil data foto dulu
      const { data: reportData } = await supabase.from('reports').select('foto_url').eq('id', id).single()

      // 2. Hapus file di storage jika ada
      if (reportData?.foto_url && reportData.foto_url.length > 0) {
        const filesToRemove = reportData.foto_url.map((url: any) => {
          const parts = url.split('/reports/')
          return parts[1]
        }).filter(Boolean)

        if (filesToRemove.length > 0) {
          await supabase.storage.from('reports').remove(filesToRemove)
        }
      }

      // 3. Hapus data di DB
      const { error } = await supabase.from('reports').delete().eq('id', id)
      if (error) throw error

      toast.success('Laporan dihapus')
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      toast.error('Gagal menghapus')
    }
  }

  // --- UPDATE REPORT ---
  const updateReport = async (id: string, status: string, deskripsi: string) => {
    try {
      const { error } = await supabase.from('reports').update({ status, deskripsi }).eq('id', id)
      if (error) throw error
      toast.success('Laporan diperbarui')
      fetchData() // Refresh agar data sinkron
    } catch (error) {
      toast.error('Gagal update')
    }
  }

  // --- UPDATE JADWAL ---
  const updateGroup = async (id: number, classes: string[], officers: string[]) => {
    try {
      const { error } = await supabase.from('inspection_groups').update({ classes, officers }).eq('id', id)
      if (error) throw error
      toast.success('Jadwal diperbarui')
      fetchData()
    } catch (error) {
      toast.error('Gagal update jadwal')
    }
  }

  // Init & Realtime
  useEffect(() => {
    fetchData()
    const channel = supabase.channel('admin_logic_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData, supabase])

  return {
    loading,
    reports,
    groups,
    deleteReport,
    updateReport,
    updateGroup,
    supabase // Export supabase instance jika butuh auth logout di page utama
  }
}
