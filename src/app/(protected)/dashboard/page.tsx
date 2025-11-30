'use client'

import { useDashboardLogic } from '@/hooks/useDashboardLogic'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  // Panggil Logic Hook
  const { loading, allReports, lastUpdate, fetchReports } = useDashboardLogic()

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Ingat: Navbar sudah ada di Layout, jadi tidak perlu dipanggil di sini */}

      <main className="max-w-7xl mx-auto px-4 py-8 fade-in space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Kebersihan</h1>
              <p className="text-gray-500 mt-1 text-sm">Pantau status kebersihan sekolah hari ini & keseluruhan.</p>
              {lastUpdate && <p className="text-xs text-gray-400 mt-2">✓ Terupdate pukul: <span className="font-medium text-gray-600">{lastUpdate}</span></p>}
            </div>
            <button 
              onClick={fetchReports} 
              disabled={loading} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition shadow-md text-sm font-medium flex items-center gap-2"
            >
              {loading ? 'Memuat...' : 'Refresh Data'}
            </button>
        </div>

        {/* 1. Komponen Statistik */}
        <DashboardStats reports={allReports} />

        {/* 2. Komponen Aktivitas Terbaru */}
        <RecentActivity reports={allReports} loading={loading} />

      </main>
    </div>
  )
}
