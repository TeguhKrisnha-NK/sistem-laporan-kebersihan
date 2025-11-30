'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { ClassRanking } from '@/types'
import toast from 'react-hot-toast'

export default function RankingPage() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<ClassRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [semester, setSemester] = useState<1 | 2>(getCurrentSemester())

  useEffect(() => {
    fetchRanking()
  }, [semester])

  const fetchRanking = async () => {
    setLoading(true)
    try {
      // 1. Ambil data kelas
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')

      if (classError) throw classError

      // 2. Ambil data laporan sesuai semester
      const { data: reports, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('semester', semester) // Fix: hapus spasi .eq

      if (reportError) throw reportError

      // 3. Hitung Ranking
      const rankingData = classes?.map((cls) => {
        const classReports = reports?.filter((r) => r.class_id === cls.id) || []
        const totalBersih = classReports.filter((r) => r.status === 'Bersih').length
        const totalLaporan = classReports.length
        
        // Kalkulasi persentase (cegah pembagian dengan nol)
        const persentaseBersih = totalLaporan > 0
            ? Math.round((totalBersih / totalLaporan) * 100)
            : 0

        return {
          id: cls.id,
          nama: cls.nama,
          tingkat: cls.tingkat,
          total_bersih: totalBersih,
          total_laporan: totalLaporan,
          persentase_bersih: persentaseBersih,
        } as ClassRanking
      })

      // 4. Sorting Logic (Bersih terbanyak -> Persentase tertinggi)
      const sorted = rankingData?.sort((a, b) => {
        if (b.total_bersih !== a.total_bersih) {
          return b.total_bersih - a.total_bersih // Prioritas 1: Jumlah Bersih
        }
        return b.persentase_bersih - a.persentase_bersih // Prioritas 2: Persentase
      })

      setRanking(sorted || [])
    } catch (error) {
      toast.error('Gagal mengambil data ranking')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk mendapatkan style piala berdasarkan peringkat
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: // Juara 1
        return 'bg-yellow-50 border-yellow-400 shadow-yellow-100'
      case 1: // Juara 2
        return 'bg-gray-50 border-gray-300 shadow-gray-100'
      case 2: // Juara 3
        return 'bg-orange-50 border-orange-300 shadow-orange-100'
      default: // Sisanya
        return 'bg-white border-gray-100 hover:bg-gray-50'
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              🏆 Klasemen Kebersihan
            </h1>
            <p className="text-gray-500 mt-1">Ranking kelas berdasarkan kebersihan semester ini.</p>
          </div>

          {/* Semester Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex">
            {[1, 2].map((sem) => (
              <button
                key={sem}
                onClick={() => setSemester(sem as 1 | 2)}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all shadow-sm ${
                  semester === sem
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 bg-transparent shadow-none'
                }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
             {/* Skeleton Loading */}
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
             ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-600 font-medium">Belum ada data ranking</p>
            <p className="text-gray-400 text-sm">Data akan muncul setelah ada laporan masuk.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((item, index) => (
              <div
                key={item.id}
                className={`relative flex flex-col md:flex-row items-center p-5 rounded-xl border-2 transition-transform hover:-translate-y-1 ${getRankStyle(index)}`}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-3xl mb-4 md:mb-0 md:mr-6 border border-gray-100">
                  {getMedalIcon(index)}
                </div>

                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {item.nama}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        index < 3 ? 'bg-white text-gray-800 border border-gray-200' : 'bg-gray-100 text-gray-600'
                    }`}>
                      Tingkat {item.tingkat}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mt-3 md:mt-1">
                    <div className="bg-white/60 p-2 rounded-lg">
                      <p className="text-gray-500 text-xs">Bersih</p>
                      <p className="font-bold text-green-600 text-lg">{item.total_bersih}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <p className="text-gray-500 text-xs">Total Laporan</p>
                      <p className="font-bold text-gray-700 text-lg">{item.total_laporan}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-lg">
                      <p className="text-gray-500 text-xs">Persentase</p>
                      <p className={`font-bold text-lg ${item.persentase_bersih >= 80 ? 'text-green-600' : item.persentase_bersih >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {item.persentase_bersih}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="w-full md:w-32 mt-4 md:mt-0 md:ml-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1 md:hidden">
                    <span>Performance</span>
                    <span>{item.persentase_bersih}%</span>
                  </div>
                  <div className="bg-gray-200/50 rounded-full h-3 overflow-hidden border border-gray-100">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                        index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${item.persentase_bersih}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
