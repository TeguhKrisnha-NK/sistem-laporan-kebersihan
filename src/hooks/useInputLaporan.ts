'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getCurrentSemester } from '@/lib/utils'
import type { Class } from '@/types'
import toast from 'react-hot-toast'

export function useInputLaporan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Ambil nama petugas dari URL (jika ada)
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

  // 1. Fetch Data Kelas dari Supabase
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('classes').select('*').order('nama', { ascending: true })
        if (error) throw error
        setClasses(data || [])
      } catch (error) {
        console.error('Error fetching classes:', error)
        toast.error('Gagal mengambil data kelas')
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [supabase])

  // 2. Fungsi Upload ke Cloudinary (Dengan Debugging Lengkap)
  const uploadToCloudinary = async (files: File[]) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET

    // Cek apakah konfigurasi .env sudah terbaca
    if (!cloudName || !uploadPreset) {
      console.error("❌ Config Missing:", { cloudName, uploadPreset })
      throw new Error('Konfigurasi Cloudinary (Cloud Name/Preset) belum terbaca. Coba restart server.')
    }

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset) // Preset harus mode "Unsigned"
      formData.append('folder', 'laporan_sekolah')   // Folder di Cloudinary

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        const data = await res.json()

        if (!res.ok) {
          // 🔥 Log Error Detail dari Cloudinary ke Console
          console.error("❌ Cloudinary Upload Error:", data)
          throw new Error(data.error?.message || 'Gagal upload gambar ke Cloudinary')
        }

        return data.secure_url // Ambil URL gambar yang berhasil diupload
      } catch (err) {
        console.error("❌ Fetch Error:", err)
        throw err
      }
    })

    return await Promise.all(uploadPromises)
  }

  // 3. Handle Submit Form
  const submitReport = async () => {
    setSubmitting(true)
    const toastId = toast.loading('Sedang mengirim laporan...')

    try {
      // Validasi Input
      if (!formData.classId) throw new Error('Pilih kelas terlebih dahulu')
      if (formData.status === 'Kotor' && !formData.deskripsi.trim()) throw new Error('Deskripsi wajib diisi jika status Kotor')

      // Proses Upload Foto (Jika ada)
      let uploadedUrls: string[] = []
      if (formData.fotos.length > 0) {
        uploadedUrls = await uploadToCloudinary(formData.fotos)
      }

      // Insert Data ke Supabase
      const { error } = await supabase.from('reports').insert([{
        class_id: formData.classId,
        // Gabungkan nama petugas ke deskripsi agar tersimpan
        deskripsi: officerName ? `[Petugas: ${officerName}] ${formData.deskripsi}` : formData.deskripsi,
        status: formData.status,
        foto_url: uploadedUrls.length > 0 ? uploadedUrls : null, // Simpan array link foto
        tanggal: new Date().toISOString().split('T')[0],
        semester: getCurrentSemester(),
        // user_id dibiarkan null (karena sudah diset Nullable di database)
      }])

      if (error) {
        console.error("❌ Supabase Insert Error:", error)
        throw error
      }

      toast.success('Laporan berhasil dikirim!', { id: toastId })
      
      // Redirect ke Dashboard Publik agar user bisa melihat laporannya masuk
      router.push('/dashboard') 

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Gagal menyimpan laporan', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    classes,
    loading,
    submitting,
    formData,
    setFormData,
    submitReport,
    officerName
  }
}
