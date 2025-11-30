'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LandingPage() {
  const supabase = createClient()
  const [schedule, setSchedule] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Mendapatkan hari ini dalam format Indonesia
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayName = days[new Date().getDay()]

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const { data } = await supabase
          .from('picket_schedules')
          .select('members')
          .eq('day_of_week', todayName)
          .single()

        if (data) {
          setSchedule(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching schedule', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            <span className="font-bold text-gray-800 text-lg md:text-xl">Sistem Kebersihan</span>
          </div>
          <div className="flex gap-3">
             <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
            >
              Login Admin
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              Daftar Petugas
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Jaga Kebersihan <br/>
            <span className="text-blue-600">Sekolah Kita</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pantau kebersihan kelas dan jadwal piket OSIS secara real-time. Lingkungan bersih, belajar jadi nyaman.
          </p>

          {/* Kartu Jadwal Piket Hari Ini */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-lg mx-auto transform hover:scale-105 transition duration-300">
            <div className="flex flex-col items-center">
              <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
                Jadwal Piket Hari Ini
              </span>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{todayName}</h2>
              <p className="text-gray-400 text-sm mb-6">Petugas OSIS yang bertugas:</p>
              
              {loading ? (
                <div className="animate-pulse flex flex-col gap-2 w-full">
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ) : schedule.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {schedule.map((name, idx) => (
                    <span 
                      key={idx}
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-sm"
                    >
                      👤 {name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic py-4">
                  Tidak ada jadwal piket hari ini / Libur.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Sistem Laporan Kebersihan Sekolah
      </footer>
    </div>
  )
}
