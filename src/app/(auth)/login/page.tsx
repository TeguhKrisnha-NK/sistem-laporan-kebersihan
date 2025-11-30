 'use client'


import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase'

import toast from 'react-hot-toast'

import Link from 'next/link'


export default function LoginPage() {

  const router = useRouter()

  const supabase = createClient()

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)


  const handleLogin = async (e: React.FormEvent) => {

    e. preventDefault()

    setLoading(true)


    try {

      const { error } = await supabase.auth.signInWithPassword({

        email,

        password,

      })


      if (error) {

        toast.error(error.message)

        return

      }


      toast.success('Login berhasil!')

      router.push('/dashboard')

    } catch (error) {

      toast.error('Terjadi kesalahan')

      console.error(error)

    } finally {

      setLoading(false)

    }

  }


  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-lg shadow-xl p-8">

          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-gray-900 mb-2">

              🏫 Laporan Kebersihan

            </h1>

            <p className="text-gray-600">Sistem Manajemen Kebersihan Sekolah</p>

          </div>


          <form onSubmit={handleLogin} className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">

                Email

              </label>

              <input

                type="email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

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

                value={password}

                onChange={(e) => setPassword(e.target.value)}

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

              {loading ?  'Logging in...' : 'Masuk'}

            </button>

          </form>


          <p className="text-center text-sm text-gray-600 mt-4">

            Belum punya akun? {' '}

            <Link href="/signup" className="text-blue-600 hover:underline">

              Daftar di sini

            </Link>

          </p>


          {/* Demo credentials */}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">

            <p className="text-xs text-gray-600 mb-2 font-semibold">📌 Demo Credentials:</p>

            <p className="text-xs text-gray-600">Email: demo@example.com</p>

            <p className="text-xs text-gray-600">Password: demo123456</p>

          </div>

        </div>

      </div>

    </div>

  )

}


