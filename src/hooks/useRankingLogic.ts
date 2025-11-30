'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { ClassRanking } from '@/types'
import toast from 'react-hot-toast'

export function useRankingLogic() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<ClassRanking[]>([])
  const [loading, setLoading] = useState(true)
  
  // State Filter
  const [semester, setSemester] = useState<1 | 2>(getCurrentSemester())
  
  // ✅ INI YANG HILANG SEBELUMNYA: State Tahun
  const [year, setYear] = useState<number>(new Date().getFullYear())

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')

      if (classError) throw classError

      // Filter Tanggal berdasarkan Tahun yang dipilih
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data: reports, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('semester', semester)
        .gte('tanggal', startDate) // Filter Tahun
        .lte('tanggal', endDate)

      if (reportError) throw reportError

      const rankingData = classes?.map((cls) => {
        const classReports = reports?.filter((r) => r.class_id === cls.id) || []
        const totalBersih = classReports.filter((r) => r.status === 'Bersih').length
        const totalLaporan = classReports.length
        const persentaseBersih = totalLaporan > 0 ? Math.round((totalBersih / totalLaporan) * 100) : 0

        return {
          id: cls.id,
          nama: cls.nama,
          tingkat: cls.tingkat,
          total_bersih: totalBersih,
          total_laporan: totalLaporan,
          persentase_bersih: persentaseBersih,
        } as ClassRanking
      })

      const sorted = rankingData?.sort((a, b) => {
        if (b.total_bersih !== a.total_bersih) return b.total_bersih - a.total_bersih 
        return b.persentase_bersih - a.persentase_bersih
      })

      setRanking(sorted || [])
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat ranking')
    } finally {
      setLoading(false)
    }
  }, [semester, year, supabase])

  useEffect(() => {
    fetchRanking()
    const channel = supabase.channel('ranking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchRanking())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRanking, supabase])

  return {
    ranking,
    loading,
    semester,
    setSemester,
    year,    // ✅ Pastikan ini ada
    setYear  // ✅ Pastikan ini ada
  }
}
