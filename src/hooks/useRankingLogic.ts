'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { ClassRanking } from '@/types' // Pastikan tipe data ini diupdate nanti
import toast from 'react-hot-toast'

export function useRankingLogic() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<ClassRanking[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter State
  const [semester, setSemester] = useState<1 | 2>(getCurrentSemester())
  const [year, setYear] = useState<number>(new Date().getFullYear())

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Ambil Data Kelas
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
      if (classError) throw classError

      // 2. Filter Tanggal (1 Tahun Penuh)
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      // 3. Ambil Laporan Sesuai Filter
      const { data: reports, error: reportError } = await supabase
        .from('reports')
        .select('class_id, status, score') // Kita butuh skornya
        .eq('semester', semester)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate)

      if (reportError) throw reportError

      // 4. Hitung Statistik & Rata-rata Skor
      const rankingData = classes?.map((cls) => {
        const classReports = reports?.filter((r) => r.class_id === cls.id) || []
        const totalLaporan = classReports.length
        const totalBersih = classReports.filter((r) => r.status === 'Bersih').length
        
        // Hitung Total Skor
        // Jika kolom score null/kosong, kita anggap 480 (asumsi bersih) atau 0 tergantung kebijakan.
        // Di sini kita pakai 0 jika null agar ketahuan datanya belum update.
        const totalScoreSum = classReports.reduce((sum, r) => sum + (r.score || 0), 0)
        
        // Hitung Rata-rata (Average)
        // Rumus: Total Skor / Jumlah Laporan
        let averageScore = 0
        if (totalLaporan > 0) {
          averageScore = totalScoreSum / totalLaporan
          // Pembulatan 2 desimal agar rapi (cth: 475.65)
          averageScore = Math.round(averageScore * 100) / 100
        }

        // Hitung Persentase (Masih berguna untuk visual bar)
        const persentaseBersih = totalLaporan > 0 
          ? Math.round((totalBersih / totalLaporan) * 100) 
          : 0

        return {
          id: cls.id,
          nama: cls.nama,
          tingkat: cls.tingkat,
          total_bersih: totalBersih,
          total_laporan: totalLaporan,
          persentase_bersih: persentaseBersih, // Tetap dipakai untuk progress bar
          average_score: averageScore, // 🔥 DATA BARU UNTUK RANKING UTAMA
        }
      })

      // 5. Sorting (Berdasarkan Rata-rata Skor Tertinggi)
      const sorted = rankingData?.sort((a, b) => {
        // Jika skor rata-rata beda, yang tinggi di atas
        if (b.average_score !== a.average_score) {
          return b.average_score - a.average_score
        }
        // Jika skor sama, lihat jumlah laporan (yang lebih rajin dinilai di atas)
        return b.total_laporan - a.total_laporan
      })

      // Kita paksa tipe datanya agar TS tidak marah (atau update types.ts)
      setRanking(sorted as ClassRanking[])
      
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
    year,
    setYear
  }
}
