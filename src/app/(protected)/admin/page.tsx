 'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAdminLogic } from '@/hooks/useAdminLogic'
import AdminStats from '@/components/admin/AdminStats' // ✅ Import Statistik
import ReportsTab from '@/components/admin/ReportsTab' // ✅ Import Tabel Laporan
import SchedulesTab from '@/components/admin/SchedulesTab'

export default function AdminDashboard() {
  const router = useRouter()
  // Pastikan hook ini jalan
  const { loading, reports, groups, deleteReport, updateReport, updateGroup, supabase } = useAdminLogic()
  const [activeTab, setActiveTab] = useState<'laporan' | 'jadwal'>('laporan')

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else if (user.email !== 'teguhkrisnha@gmail.com') {
        toast.error('AKSES DITOLAK')
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [supabase, router])

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">🛡️ Admin Panel</h1>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded font-medium">Logout</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-8 border-b">
          <button onClick={() => setActiveTab('laporan')} className={`pb-4 px-2 font-bold border-b-2 transition ${activeTab === 'laporan' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>📋 Laporan Masuk</button>
          <button onClick={() => setActiveTab('jadwal')} className={`pb-4 px-2 font-bold border-b-2 transition ${activeTab === 'jadwal' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>🗓️ Manajemen Tugas</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 fade-in">
        {activeTab === 'laporan' ? (
          <>
            {/* ✅ PANGGIL KARTU STATISTIK DI SINI */}
            <AdminStats reports={reports} />
            
            {/* ✅ PANGGIL TABEL LAPORAN (YANG SUDAH DIUPDATE JADI CARD) */}
            <ReportsTab reports={reports} onUpdate={updateReport} onDelete={deleteReport} />
          </>
        ) : (
          <SchedulesTab groups={groups} onUpdate={updateGroup} />
        )}
      </main>
    </div>
  )
}
