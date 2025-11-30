'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Cek Status User saat Navbar dimuat
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        setUserEmail(user.email || null)
      } else {
        setIsLoggedIn(false)
        setUserEmail(null)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserEmail(null)
    router.push('/login') // Redirect ke login setelah logout
  }

  const getLinkClass = (path: string) => {
    const isActive = pathname === path
    return isActive 
      ? "text-blue-600 px-3 py-2 rounded-md text-sm font-bold border-b-2 border-blue-600" 
      : "text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition"
  }

  // Cek apakah user adalah ADMIN UTAMA
  const isAdmin = userEmail === 'teguhkrisnha@gmail.com'

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">🏫</span>
            <span className="font-bold text-gray-900 text-lg hidden md:block">Laporan Kebersihan</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
            <Link href="/laporan" className={getLinkClass('/laporan')}>Input Laporan</Link>
            <Link href="/ranking" className={getLinkClass('/ranking')}>Ranking</Link>
            
            {/* HANYA TAMPIL JIKA ADMIN */}
            {isAdmin && (
              <Link href="/admin" className={getLinkClass('/admin')}>Admin Panel</Link>
            )}
          </div>

          {/* Tombol Kanan (Login / Logout) */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Halo, {isAdmin ? 'Admin' : 'Petugas'}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition shadow-sm"
              >
                Login Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded focus:outline-none"
          >
            <span className="text-2xl">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">Dashboard</Link>
            <Link href="/laporan" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">Input Laporan</Link>
            <Link href="/ranking" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">Ranking</Link>
            
            {isAdmin && (
              <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 font-bold bg-purple-50">Admin Panel</Link>
            )}

            <div className="pt-4 mt-2 border-t border-gray-100">
              {isLoggedIn ? (
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-bold text-red-600 hover:bg-red-50">Logout</button>
              ) : (
                <Link href="/login" className="w-full text-left block px-3 py-2 rounded-md text-base font-bold text-blue-600 hover:bg-blue-50">Login</Link>
              )}
            </div>
        </div>
      )}
    </nav>
  )
}
