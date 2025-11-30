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
  
  // Ambil nama petugas dari URL
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

  // Fetch Data Kelas
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('classes').select('*').order('nama', { ascending: true })
        if (error) throw error
        setClasses(data || [])
      } catch (error) {
        toast.error('Gagal mengambil data kelas')
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [supabase])

  // Handle Upload Foto ke Storage
  const uploadPhotos = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `public_uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('reports').getPublicUrl(filePath)
      return data.publicUrl
    })

    return await Promise.all(uploadPromises)
  }

  // Handle Submit Form
  const submitReport = async () => {
    setSubmitting(true)
    try {
      // Validasi
      if (!formData.classId) throw new Error('Pilih kelas terlebih dahulu')
      if (formData.status === 'Kotor' && !formData.deskripsi.trim()) throw new Error('Deskripsi wajib diisi jika status Kotor')

      // Upload Foto (Jika ada)
      let uploadedUrls: string[] = []
      if (formData.fotos.length > 0) {
        uploadedUrls = await uploadPhotos(formData.fotos)
      }

      // Insert ke Database
      const { error } = await supabase.from('reports').insert([{
        class_id: formData.classId,
        deskripsi: officerName ? `[Petugas: ${officerName}] ${formData.deskripsi}` : formData.deskripsi,
        status: formData.status,
        foto_url: uploadedUrls.length > 0 ? uploadedUrls : null,
        tanggal: new Date().toISOString().split('T')[0],
        semester: getCurrentSemester(),
      }])

      if (error) throw error

      toast.success('Laporan berhasil dikirim!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Gagal menyimpan laporan')
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
