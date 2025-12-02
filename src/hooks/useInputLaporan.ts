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
  
  // Ambil nama petugas dari URL (jika diklik dari halaman depan)
  const officerName = searchParams.get('petugas') 

  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    classId: '',
    status: 'Bersih', // Default
    deskripsi: '',
    fotos: [] as File[], 
  })

  // 1. Fetch Data Kelas
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('classes').select('*').order('nama', { ascending: true })
        if (error) throw error
        setClasses(data || [])
      } catch (error) {
        console.error(error)
        toast.error('Gagal mengambil data kelas')
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [supabase])

  // 2. Fungsi Upload ke Cloudinary
  const uploadToCloudinary = async (files: File[]) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error('Konfigurasi Cloudinary belum diset.')
    }

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'laporan_sekolah')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Gagal upload gambar')
      
      return data.secure_url
    })

    return await Promise.all(uploadPromises)
  }

  // 3. Handle Submit (Menerima Override Skor & Deskripsi dari UI)
  const submitReport = async (scoreOverride?: number, descOverride?: string) => {
    setSubmitting(true)
    const toastId = toast.loading('Mengirim laporan...')

    try {
      // Validasi
      if (!formData.classId) throw new Error('Pilih kelas terlebih dahulu')
      
      // Upload Foto
      let uploadedUrls: string[] = []
      if (formData.fotos.length > 0) {
        uploadedUrls = await uploadToCloudinary(formData.fotos)
      }

      // Siapkan Data Deskripsi (Gabung dengan Nama Petugas jika ada)
      // Prioritas: Deskripsi Final dari UI (yang ada list pelanggaran) -> Deskripsi State -> Kosong
      const finalDescText = descOverride || formData.deskripsi
      const finalDescription = officerName 
        ? `[Petugas: ${officerName}] ${finalDescText}` 
        : finalDescText

      // Insert ke Database
      const { error } = await supabase.from('reports').insert([{
        class_id: formData.classId,
        deskripsi: finalDescription,
        status: formData.status,
        
        // 🔥 PENTING: Simpan Skor (Default 480 jika tidak ada hitungan pelanggaran)
        score: scoreOverride !== undefined ? scoreOverride : 480,
        
        foto_url: uploadedUrls.length > 0 ? uploadedUrls : null,
        tanggal: new Date().toISOString().split('T')[0], // Tanggal hari ini YYYY-MM-DD
        semester: getCurrentSemester(),
      }])

      if (error) throw error

      toast.success('Laporan berhasil disimpan!', { id: toastId })
      
      // Redirect ke Dashboard
      router.push('/dashboard')

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Gagal menyimpan', { id: toastId })
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
