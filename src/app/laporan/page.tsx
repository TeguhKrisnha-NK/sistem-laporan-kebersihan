'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { Class } from '@/types'
import Navbar from '@/components/Navbar' // ✅ Import Navbar yang baru dibuat
import toast from 'react-hot-toast'
import Image from 'next/image'

// --- KOMPONEN FORMULIR UTAMA ---
function InputForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Ambil nama petugas dari URL (misal: ?petugas=Alin)
  const officerName = searchParams.get('petugas') 

  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    classId: '',
    status: 'Bersih',
    deskripsi: '',
    fotos: [] as File[], 
  })

  // Fetch Data Kelas saat loading
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('nama', { ascending: true })

        if (error) throw error
        setClasses(data || [])
      } catch (error) {
        toast.error('Gagal mengambil data kelas')
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])

  // Handle Input File (Banyak Foto)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      // Validasi maks 5 foto
      if (formData.fotos.length + newFiles.length > 5) {
        toast.error('Maksimal upload 5 foto')
        return
      }
      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, ...newFiles]
      }))
    }
  }

  // Hapus Foto dari Preview
  const removePhoto = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove)
    }))
    // Reset input agar bisa pilih file yang sama lagi jika perlu
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Handle Submit Laporan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validasi Input
      if (!formData.classId) {
        toast.error('Pilih kelas terlebih dahulu')
        setSubmitting(false)
        return
      }

      if (formData.status === 'Kotor' && !formData.deskripsi.trim()) {
        toast.error('Deskripsi wajib diisi jika status Kotor')
        setSubmitting(false)
        return
      }

      // 1. Proses Upload Foto ke Supabase Storage
      let uploadedUrls: string[] = []

      if (formData.fotos.length > 0) {
        const uploadPromises = formData.fotos.map(async (file) => {
          const fileExt = file.name.split('.').pop()?.toLowerCase()
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
          // Masukkan ke folder 'public_uploads' agar terpisah dari folder user login
          const filePath = `public_uploads/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filePath, file, { contentType: file.type })

          if (uploadError) throw uploadError

          const { data: publicData } = supabase.storage
            .from('reports')
            .getPublicUrl(filePath)
            
          return publicData.publicUrl
        })

        try {
          uploadedUrls = await Promise.all(uploadPromises)
        } catch (error) {
          console.error(error)
          toast.error('Gagal upload salah satu foto')
          setSubmitting(false)
          return
        }
      }

      // 2. Insert Data Laporan ke Database
      const { error: insertError } = await supabase
        .from('reports')
        .insert([
          {
            class_id: formData.classId,
            // Jika ada nama petugas dari URL, tempelkan di deskripsi
            deskripsi: officerName 
              ? `[Petugas: ${officerName}] ${formData.deskripsi}` 
              : formData.deskripsi, 
            status: formData.status,
            foto_url: uploadedUrls.length > 0 ? uploadedUrls : null,
            tanggal: new Date().toISOString().split('T')[0],
            semester: getCurrentSemester(),
          },
        ])

      if (insertError) throw insertError

      toast.success('Laporan berhasil dikirim!')
      
      // Redirect ke Dashboard untuk melihat hasil (atau ke Home)
      router.push('/dashboard') 

    } catch (error) {
      toast.error('Gagal menyimpan laporan')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center p-10">
      <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></span>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      
      {/* Header Halaman */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          📝 Input Laporan
        </h1>
        {officerName ? (
          <div className="mt-3 bg-blue-50 inline-flex items-center px-4 py-1.5 rounded-full border border-blue-100">
            <span className="text-blue-600 text-sm font-medium">Petugas yang melapor: <b>{officerName}</b></span>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Isi formulir di bawah untuk melaporkan kondisi kelas.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Pilih Kelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Kelas <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 transition"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.nama} ({cls.tingkat})</option>
                ))}
              </select>
              {/* Panah Custom */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Kondisi Kebersihan */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Kondisi Kebersihan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['Bersih', 'Kotor'].map((option) => (
                <div
                  key={option}
                  onClick={() => setFormData({ ...formData, status: option })}
                  className={`
                    cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 select-none
                    ${formData.status === option 
                      ? (option === 'Bersih' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                      : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-2xl">{option === 'Bersih' ? '✨' : '🗑️'}</span>
                  <span className="font-semibold">{option}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Deskripsi & Foto */}
          <div className="space-y-6">
            <div className={`transition-all duration-300`}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detail Masalah {formData.status === 'Kotor' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder={formData.status === 'Kotor' ? "Contoh: Ada sampah plastik di kolong meja..." : "Catatan tambahan (opsional)..."}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Foto Bukti <span className="text-gray-400 font-normal">(Bisa pilih banyak)</span>
              </label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative group">
                <div className="space-y-1 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition">
                    <svg stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span className="p-1">Upload foto</span>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (Maks 5 Foto)</p>
                </div>
              </div>

              {/* Preview Foto */}
              {formData.fotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.fotos.map((file, index) => (
                    <div key={index} className="relative group bg-gray-100 rounded-lg p-2 border border-gray-200">
                      <div className="text-xs text-gray-600 truncate mb-1 px-1">{file.name}</div>
                      <div className="h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                        <span className="text-3xl">📸</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm transition"
                        title="Hapus foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.99]"
          >
            {submitting ? (
               <>
                 <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                 Mengirim...
               </>
            ) : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  )
}

// --- HALAMAN UTAMA ---
export default function InputLaporanPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ✅ NAVBAR 
         Kita panggil komponen Navbar di sini agar muncul di halaman ini.
         Ini sama persis dengan yang ada di Dashboard/Admin.
      */}
      <Navbar />

      <main className="flex-1">
        {/* Suspense: Wajib ada karena kita membaca data URL (?petugas=...) */}
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
