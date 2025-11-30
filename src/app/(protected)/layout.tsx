'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)

  // Kita HAPUS logic pengecekan user & redirect di sini
  // Agar halaman Dashboard bisa diakses publik
  
  useEffect(() => {
    // Hanya simulasi loading sebentar agar transisi halus
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
      <Navbar /> 
      <main className="flex-1 w-full">
        {children}
      </main>
      <footer className="py-6 text-center text-gray-400 text-sm bg-white border-t mt-auto">
        &copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah
      </footer>
    </div>
  )
}
