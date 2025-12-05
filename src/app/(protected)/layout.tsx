'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 🔥 PERUBAHAN PENTING:
  // Hapus logika 'checkAuth' yang me-redirect ke login.
  // Biarkan Middleware yang mengurus keamanan untuk Admin/Ranking.
  // Layout ini sekarang sifatnya "Open" agar Dashboard bisa diakses.

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulasi loading sekejap agar transisi halus (opsional)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar akan otomatis menyesuaikan (Login/Logout) */}
      <Navbar /> 

      {/* Main Content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm bg-white border-t mt-auto">
        &copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah
      </footer>
    </div>
  )
}
