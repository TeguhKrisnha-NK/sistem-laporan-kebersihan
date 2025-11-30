'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image' // ✅ Import Image

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
      } catch (error) { console.error(error) } finally { setLoading(false) }
    }
    fetchGroups()
  }, [])

  const allOfficers = groups.flatMap(group => group.officers.map(officer => ({ name: officer, classes: group.classes })))
  const filteredOfficers = allOfficers.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleOfficerClick = (officerName: string) => {
    const params = new URLSearchParams(); params.set('petugas', officerName)
    router.push(`/laporan?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar Landing Page */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          
          {/* ✅ GANTI EMOJI DENGAN LOGO GAMBAR */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/logo-sman2.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-gray-800 md:text-xl text-lg">Sistem Kebersihan</span>
          </div>

          <div className="flex gap-2">
             <Link href="/login" className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition">Login Admin</Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm hidden md:block">Daftar</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Halo, Siapa yang bertugas hari ini?</h1>
          <p className="text-gray-500">Cari nama Anda di bawah ini untuk mulai mengisi laporan.</p>
          <div className="max-w-md mx-auto relative mt-6">
            <input type="text" placeholder="🔍 Ketik nama Anda..." className="w-full px-5 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none text-lg transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>)} </div>
        ) : filteredOfficers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredOfficers.map((officer, idx) => (
              <button key={idx} onClick={() => handleOfficerClick(officer.name)} className="group relative bg-white hover:bg-blue-600 border border-gray-200 hover:border-blue-600 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 text-left">
                <div className="flex flex-col h-full justify-between">
                  <span className="font-bold text-gray-800 group-hover:text-white text-lg">{officer.name}</span>
                  <span className="text-xs text-gray-400 group-hover:text-blue-100 mt-2">Cek: {officer.classes.slice(0, 2).join(', ')}{officer.classes.length > 2 ? '...' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><span className="text-4xl">🤔</span><p className="text-gray-500 mt-2">Nama petugas tidak ditemukan.</p></div>
        )}
      </main>
      <footer className="py-6 text-center text-gray-400 text-sm bg-white border-t mt-auto">&copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah</footer>
    </div>
  )
}
