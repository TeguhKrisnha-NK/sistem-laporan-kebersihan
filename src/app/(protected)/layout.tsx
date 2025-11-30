'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase. auth.getUser()

        if (! user) {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🏫 Laporan Kebersihan
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/laporan"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Input Laporan
            </Link>
            <Link
              href="/ranking"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Ranking
            </Link>
            <Link
              href="/admin"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Admin
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4 px-4">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Dashboard
              </Link>
              <Link
                href="/laporan"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Input Laporan
              </Link>
              <Link
                href="/ranking"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Ranking
              </Link>
              <Link
                href="/admin"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
