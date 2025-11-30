'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Report, Class } from '@/types'
import { deleteCloudinaryImage } from '@/app/actions' // ✅ Import Server Action untuk hapus foto

// --- TIPE DATA ---
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

  // --- 1. FETCH DATA (Laporan & Jadwal) ---
  const fetchData = useCallback(async () => {
    try {
      // setLoading(true) // Opsional: dimatikan agar tidak flickering saat auto-refresh
      const [reportsRes, groupsRes] = await Promise.all([
        supabase
          .from('reports')
          .select('*, classes(*)')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('inspection_groups')
          .select('*')
          .order('id', { ascending: true })
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

  // --- 2. DELETE REPORT (Termasuk Hapus Foto di Cloudinary) ---
  const deleteReport = async (id: string) => {
    const toastId = toast.loading('Menghapus...')
    try {
      // A. Ambil data laporan dulu untuk mendapatkan link foto
      const { data: reportData, error: fetchError } = await supabase
        .from('reports')
        .select('foto_url')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // B. Jika ada foto, Hapus dari Cloudinary menggunakan Server Action
      if (reportData?.foto_url && Array.isArray(reportData.foto_url) && reportData.foto_url.length > 0) {
        await Promise.all(
          reportData.foto_url.map((url: string) => deleteCloudinaryImage(url))
        )
      }

      // C. Hapus Data dari Supabase
      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      toast.success('Laporan & Foto berhasil dihapus', { id: toastId })
      
      // Update UI langsung tanpa fetch ulang agar cepat
      setReports(prev => prev.filter(r => r.id !== id))
      
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus laporan', { id: toastId })
    }
  }

  // --- 3. UPDATE REPORT (Status & Deskripsi) ---
  const updateReport = async (id: string, status: string, deskripsi: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status, deskripsi })
        .eq('id', id)

      if (error) throw error
      
      toast.success('Laporan diperbarui')
      fetchData() // Refresh data untuk memastikan sinkronisasi
    } catch (error) {
      toast.error('Gagal memperbarui laporan')
    }
  }

  // --- 4. UPDATE JADWAL PIKET (Groups) ---
  const updateGroup = async (id: number, classes: string[], officers: string[]) => {
    try {
      const { error } = await supabase
        .from('inspection_groups')
        .update({ classes, officers })
        .eq('id', id)

      if (error) throw error
      
      toast.success('Data Petugas Diperbarui')
      fetchData()
    } catch (error) {
      toast.error('Gagal update jadwal')
    }
  }

  // --- 5. SETUP REALTIME & INIT ---
  useEffect(() => {
    fetchData()

    // Langganan perubahan data di tabel 'reports'
    const channel = supabase.channel('admin_logic_realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'reports' }, 
        () => {
          // Jika ada insert/update/delete dari user lain, refresh data
          fetchData()
        }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [fetchData, supabase])

  return {
    loading,
    reports,
    groups,
    deleteReport,
    updateReport,
    updateGroup,
    supabase 
  }
}
