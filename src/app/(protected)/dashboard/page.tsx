'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Report, Class } from '@/types'
import toast from 'react-hot-toast'

// Kita buat tipe data khusus biar tidak error TypeScript saat baca relasi classes
interface DashboardReport extends Report {
  classes?: Class | null;
}

export default function DashboardPage() {
  const supabase = createClient()
  const [allReports, setAllReports] = useState<DashboardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Fetch semua data
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      // Kita tambahkan classes(*) agar nama kelas muncul
      const { data, error } = await supabase
        .from('reports')
        .select('*, classes(*)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAllReports(data || [])
      setLastUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    } catch (error) {
      toast.error('Gagal mengambil laporan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchReports()

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchReports])

  // --- LOGIKA FILTER DATA ---
  const todayStr = new Date().toISOString().split('T')[0]
  const todayReports = allReports.filter(r => r.tanggal === todayStr)

  const todayBersih = todayReports.filter(r => r.status === 'Bersih').length
  const todayKotor = todayReports.filter(r => r.status === 'Kotor').length

  const totalAllTime = allReports.length
  const allTimeBersih = allReports.filter(r => r.status === 'Bersih').length
  const allTimeKotor = allReports.filter(r => r.status === 'Kotor').length

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Dashboard Kebersihan
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pantau status kebersihan sekolah hari ini & keseluruhan.
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-2">
              ✓ Terupdate pukul: <span className="font-medium text-gray-600">{lastUpdate}</span>
            </p>
          )}
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Bersih */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 card-hover relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Laporan Bersih (Hari Ini)</p>
              <h3 className="text-4xl font-bold text-green-600 mt-2">{todayBersih}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
             <span className="text-xs text-gray-400">Total Sejak Awal</span>
             <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{allTimeBersih}</span>
          </div>
        </div>

        {/* Card Kotor */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 card-hover relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Laporan Kotor (Hari Ini)</p>
              <h3 className="text-4xl font-bold text-red-600 mt-2">{todayKotor}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
             <span className="text-xs text-gray-400">Total Sejak Awal</span>
             <span className="text-sm font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{allTimeKotor}</span>
          </div>
        </div>

        {/* Card Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 card-hover relative overflow-hidden">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Laporan (Hari Ini)</p>
              <h3 className="text-4xl font-bold text-blue-600 mt-2">{todayReports.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
             <span className="text-xs text-gray-400">Total Sejak Awal</span>
             <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{totalAllTime}</span>
          </div>
        </div>
      </div>

      {/* List Laporan HARI INI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            📋 Aktivitas Terbaru (Hari Ini)
          </h2>
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500">
            {todayStr}
          </span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {loading ? (
             [1,2,3].map(i => (
                <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
             ))
          ) : todayReports.length > 0 ? (
            todayReports.slice(0, 10).map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-gray-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${report.status === 'Bersih' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      {/* INI BAGIAN YANG ERROR TADI, SUDAH DIPERBAIKI */}
                      <p className="font-medium text-gray-900 text-sm">
                        {report.deskripsi || 'Laporan tanpa deskripsi'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Kelas {report.classes?.nama || 'N/A'} • {new Date(report.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.foto_url && report.foto_url.length > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      📸 {report.foto_url.length}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      report.status === 'Bersih'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="inline-block p-4 rounded-full bg-gray-50 text-gray-400 mb-3">
                 <span className="text-2xl">💤</span>
              </div>
              <p className="text-gray-500 font-medium">Belum ada laporan hari ini</p>
              <p className="text-gray-400 text-sm">Data riwayat total bisa dilihat di kartu atas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
