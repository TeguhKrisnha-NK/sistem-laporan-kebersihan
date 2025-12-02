'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface InspectionGroup {
  id: number;
  classes: string[];
  officers: string[];
}

export default function LandingPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [groups, setGroups] = useState<InspectionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchGroups() {
      try {
        const { data } = await supabase.from('inspection_groups').select('*').order('id', { ascending: true })
        if (data) setGroups(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  // Gabungkan semua petugas dari semua grup menjadi satu list flat
  const allOfficers = groups.flatMap(group => 
    group.officers.map(officer => ({ name: officer, classes: group.classes }))
  )

  // Filter berdasarkan pencarian
  const filteredOfficers = allOfficers.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOfficerClick = (officerName: string) => {
    // Arahkan ke halaman input laporan dengan membawa nama petugas
    const params = new URLSearchParams()
    params.set('petugas', officerName)
    router.push(`/laporan?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          
          {/* Logo Sekolah */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image 
                src="/logo-sman2.png" 
                alt="Logo SMAN 2 Negara"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-gray-800 md:text-xl text-lg">Sistem Kebersihan</span>
          </div>

          {/* Menu Kanan */}
          <div className="flex gap-2">
             <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Login Admin
            </Link>
            {/* Tombol Daftar (Opsional jika masih dibutuhkan) */}
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm hidden md:block"
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="text-center mb-10 space-y-3 pt-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Halo, Siapa yang bertugas hari ini?
          </h1>
          <p className="text-gray-500">Cari nama Anda di bawah ini untuk mulai mengisi laporan.</p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Ketik nama Anda..."
              className="w-full pl-11 pr-5 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg transition bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Daftar Petugas (Grid) */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredOfficers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {filteredOfficers.map((officer, idx) => (
              <button
                key={idx}
                onClick={() => handleOfficerClick(officer.name)}
                className="group relative bg-white hover:bg-blue-600 border border-gray-200 hover:border-blue-600 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between h-full"
              >
                <div>
                  <span className="font-bold text-gray-800 group-hover:text-white text-lg block mb-1">
                    {officer.name}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-blue-100">
                    Tugas: {officer.classes.slice(0, 2).join(', ')}{officer.classes.length > 2 ? '...' : ''}
                  </span>
                </div>
                
                {/* Panah Hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <span className="text-5xl block mb-4">🤔</span>
            <p className="text-gray-500 font-medium">Nama petugas tidak ditemukan.</p>
            <p className="text-sm text-gray-400 mt-1">Coba ketik nama lain atau hubungi Admin.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm bg-white border-t mt-auto">
        &copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah
      </footer>
    </div>
  )
}
