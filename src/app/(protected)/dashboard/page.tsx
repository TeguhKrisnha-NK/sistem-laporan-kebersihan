'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Report, Class } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface DashboardReport extends Omit<Report, 'classes'> {
  classes: Class | null;
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [allReports, setAllReports] = useState<DashboardReport[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

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
      toast.error('Gagal mengambil laporan')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchReports()
    const channel = supabase.channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchReports])

  // Logic Statistik
  const todayStr = new Date().toISOString().split('T')[0]
  const todayReports = allReports.filter(r => r.tanggal === todayStr)
  const todayBersih = todayReports.filter(r => r.status === 'Bersih').length
  const todayKotor = todayReports.filter(r => r.status === 'Kotor').length
  const totalAllTime = allReports.length
  const allTimeBersih = allReports.filter(r => r.status === 'Bersih').length
  const allTimeKotor = allReports.filter(r => r.status === 'Kotor').length

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 fade-in space-y-6">
        {/* Header Content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Kebersihan</h1>
            <p className="text-gray-500 mt-1 text-sm">Pantau status kebersihan sekolah hari ini & keseluruhan.</p>
            {lastUpdate && <p className="text-xs text-gray-400 mt-2">✓ Terupdate pukul: <span className="font-medium text-gray-600">{lastUpdate}</span></p>}
            </div>
            <button onClick={fetchReports} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition shadow-md text-sm font-medium">
            {loading ? 'Memuat...' : 'Refresh Data'}
            </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div><p className="text-sm font-medium text-gray-500">Laporan Bersih (Hari Ini)</p><h3 className="text-4xl font-bold text-green-600 mt-2">{todayBersih}</h3></div>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">✨</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{allTimeBersih}</span></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div><p className="text-sm font-medium text-gray-500">Laporan Kotor (Hari Ini)</p><h3 className="text-4xl font-bold text-red-600 mt-2">{todayKotor}</h3></div>
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">🗑️</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-sm font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{allTimeKotor}</span></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div><p className="text-sm font-medium text-gray-500">Total Laporan (Hari Ini)</p><h3 className="text-4xl font-bold text-blue-600 mt-2">{todayReports.length}</h3></div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">📊</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{totalAllTime}</span></div>
            </div>
        </div>

        {/* List Laporan HARI INI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">📋 Aktivitas Terbaru (Hari Ini)</h2>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500">{todayStr}</span>
            </div>
            <div className="divide-y divide-gray-100">
            {loading ? ([1,2,3].map(i => <div key={i} className="p-4 h-16 bg-gray-50 animate-pulse m-2 rounded"></div>)) : 
            todayReports.length > 0 ? (
                todayReports.slice(0, 10).map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${report.status === 'Bersih' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                        <p className="font-medium text-gray-900 text-sm">{report.deskripsi || 'Laporan tanpa deskripsi'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Kelas {report.classes?.nama || '-'} • {new Date(report.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${report.status === 'Bersih' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{report.status}</span>
                </div>
                ))
            ) : (
                <div className="p-12 text-center text-gray-500">Belum ada laporan hari ini.</div>
            )}
            </div>
        </div>
      </main>
    </div>
  )
}
