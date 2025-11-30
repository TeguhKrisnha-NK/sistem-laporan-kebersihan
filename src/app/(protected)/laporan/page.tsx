'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { Class } from '@/types'
import toast from 'react-hot-toast'

export default function InputLaporanPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Ganti foto single menjadi array 'fotos'
  const [formData, setFormData] = useState({
    classId: '',
    status: 'Bersih',
    deskripsi: '',
    fotos: [] as File[], 
  })

  useEffect(() => {
    fetchClasses()
  }, [])

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

  // Handle pilih file (bisa multiple)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Gabungkan foto lama dengan foto baru (maksimal 5 foto misalnya)
      const newFiles = Array.from(e.target.files)
      
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

  // Hapus foto tertentu dari list
  const removePhoto = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove)
    }))
    // Reset value input biar bisa pilih file yang sama lagi kalau mau
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // --- PROSES UPLOAD MULTIPLE ---
      let uploadedUrls: string[] = []

      if (formData.fotos.length > 0) {
        // Upload semua foto secara paralel (bersamaan)
        const uploadPromises = formData.fotos.map(async (file) => {
          const fileExt = file.name.split('.').pop()?.toLowerCase()
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

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

      // --- INSERT DATA ---
      // Pastikan kolom foto_url di Supabase sudah diubah jadi text[] (Array)
      const { error: insertError } = await supabase
        .from('reports')
        .insert([
          {
            class_id: formData.classId,
            user_id: user.id,
            status: formData.status,
            deskripsi: formData.status === 'Kotor' ? formData.deskripsi : null,
            foto_url: uploadedUrls.length > 0 ? uploadedUrls : null, // Kirim array URL
            tanggal: new Date().toISOString().split('T')[0],
            semester: getCurrentSemester(),
          },
        ])

      if (insertError) throw insertError

      toast.success('Laporan berhasil disimpan!')
      
      setFormData({ classId: '', status: 'Bersih', deskripsi: '', fotos: [] })
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      router.push('/dashboard')
    } catch (error) {
      toast.error('Gagal menyimpan laporan')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center p-10"><span className="loading loading-spinner"></span></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📝 Input Laporan
          </h1>
          <p className="text-gray-500 mt-1">
            Isi formulir di bawah ini untuk melaporkan kondisi kebersihan kelas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Pilih Kelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Kelas <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.nama} ({cls.tingkat})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kondisi Kebersihan */}
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
                    cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2
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

          {/* Deskripsi & Foto */}
          <div className="space-y-6">
            {formData.status === 'Kotor' && (
              <div className="slide-up">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detail Masalah <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan bagian mana yang kotor..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Foto Bukti <span className="text-gray-400 font-normal">(Bisa pilih banyak)</span>
              </label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload file</span>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple // ✅ KUNCI AGAR BISA BANYAK
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Maksimal 5 Foto</p>
                </div>
              </div>

              {/* Preview Foto yang Dipilih */}
              {formData.fotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.fotos.map((file, index) => (
                    <div key={index} className="relative group bg-gray-100 rounded-lg p-2 border border-gray-200">
                      <div className="text-xs text-gray-600 truncate mb-1">{file.name}</div>
                      <div className="h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                        {/* Tampilkan preview gambar sederhana */}
                        <span className="text-2xl">📸</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
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
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? 'Mengupload...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  )
}
