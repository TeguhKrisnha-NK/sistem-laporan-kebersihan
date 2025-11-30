'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    namaLengkap: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React. FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Password tidak cocok')
        return
      }

      if (formData.password.length < 6) {
        toast. error('Password minimal 6 karakter')
        return
      }

      const { error, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nama_lengkap: formData. namaLengkap,
            role: 'petugas',
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data?.user) {
        toast.success('Akun berhasil dibuat!  Silakan login.')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React. ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e. target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏫 Laporan Kebersihan
            </h1>
            <p className="text-gray-600">Daftar Akun Baru</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleChange}
                placeholder="Nama Anda"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData. confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? 'Membuat akun...' : 'Daftar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Sudah punya akun? {' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
