'use client'

import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import InputForm from '@/components/laporan/InputForm'

export default function InputLaporanPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Global */}
      <Navbar />

      <main className="flex-1">
        {/* Suspense: Wajib untuk useSearchParams di dalam InputForm */}
        <Suspense fallback={<div className="text-center p-20 text-gray-500">Memuat formulir...</div>}>
          <InputForm />
        </Suspense>
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm bg-white border-t mt-auto">
        &copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah
      </footer>
    </div>
  )
}
