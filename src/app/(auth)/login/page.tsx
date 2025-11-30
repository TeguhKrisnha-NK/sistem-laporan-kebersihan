'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image' // ✅ Import Image

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Login berhasil!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-white/50">
        <div className="text-center mb-8">
          {/* ✅ GANTI EMOJI DENGAN LOGO GAMBAR */}
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <Image 
                src="/logo-sman2.png" // Pastikan nama file ini benar
                alt="Logo SMAN 2 Negara"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Laporan Kebersihan</h1>
          <p className="text-gray-500 text-sm">Sistem Manajemen Kebersihan Sekolah</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@sekolah.sch.id" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg active:scale-95">{loading ? 'Memproses...' : 'Masuk'}</button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">Belum punya akun? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Daftar di sini</Link></p>
      </div>
    </div>
  )
}
