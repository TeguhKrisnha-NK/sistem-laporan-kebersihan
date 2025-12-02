'use client'

import { useRef, useState } from 'react'
import { useInputLaporan } from '@/hooks/useInputLaporan'
import toast from 'react-hot-toast'

const VIOLATION_TYPES = [
  "Kebersihan Kelas (Lantai/Jendela kotor)",
  "Kebersihan Lingkungan Luar (Teras/Halaman)",
  "Kerapian/Tata Kelola Kelas (Meja berantakan)",
  "Kelengkapan Administrasi (Jurnal/Absen)",
  "Kelengkapan Alat Kebersihan (Sapu/Pel)",
  "Kebersihan Sampah (Ada sampah tertinggal)"
]

export default function InputForm() {
  const { classes, loading, submitting, formData, setFormData, submitReport, officerName } = useInputLaporan()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedViolations, setSelectedViolations] = useState<string[]>([])

  // Kalkulasi Skor tetap berjalan di background, tapi tidak ditampilkan
  const currentScore = 480 - (selectedViolations.length * 10)

  const handlePreSubmit = () => {
    let finalDesc = formData.deskripsi
    if (formData.status === 'Kotor' && selectedViolations.length > 0) {
      const violationsText = selectedViolations.map(v => `- ${v}`).join('\n')
      finalDesc = `${formData.deskripsi}\n\nPelanggaran:\n${violationsText}`
    }
    submitReport(currentScore, finalDesc) 
  }

  const toggleViolation = (violation: string) => {
    setSelectedViolations(prev => prev.includes(violation) ? prev.filter(v => v !== violation) : [...prev, violation])
  }

  if (formData.status === 'Bersih' && selectedViolations.length > 0) {
    setSelectedViolations([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      if (formData.fotos.length + newFiles.length > 5) {
        toast.error('Maksimal upload 5 foto')
        return
      }
      setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newFiles] }))
    }
  }

  const removePhoto = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, index) => index !== indexToRemove) }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) return <div className="flex justify-center p-10"><span className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></span></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          📝 Input Penilaian
        </h1>
        {officerName ? (
          <div className="mt-3 bg-blue-50 inline-flex items-center px-4 py-1.5 rounded-full border border-blue-100">
            <span className="text-blue-600 text-sm font-medium">Petugas: <b>{officerName}</b></span>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Silakan isi formulir penilaian kelas.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden">
        
        {/* SCORE BADGE DIHAPUS DISINI AGAR PETUGAS TIDAK LIHAT */}

        <form onSubmit={(e) => { e.preventDefault(); handlePreSubmit(); }} className="space-y-6">
          
          {/* PILIH KELAS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Kelas <span className="text-red-500">*</span></label>
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

          {/* STATUS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Hasil Pemeriksaan <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              {['Bersih', 'Kotor'].map((option) => (
                <div
                  key={option}
                  onClick={() => setFormData({ ...formData, status: option })}
                  className={`
                    cursor-pointer p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 select-none
                    ${formData.status === option 
                      ? (option === 'Bersih' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={`text-3xl ${option === 'Bersih' ? 'text-green-500' : 'text-red-500'}`}>
                    {option === 'Bersih' ? '✨' : '⚠️'}
                  </span>
                  <span className="font-bold text-gray-700">{option}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CHECKBOX PELANGGARAN */}
          {formData.status === 'Kotor' && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-red-700 mb-3">
                Centang Pelanggaran yang Ditemukan:
              </label>
              <div className="space-y-2">
                {VIOLATION_TYPES.map((violation) => (
                  <label key={violation} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-red-100 cursor-pointer hover:bg-red-50 transition">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                      checked={selectedViolations.includes(violation)}
                      onChange={() => toggleViolation(violation)}
                    />
                    <span className="text-sm text-gray-700">{violation}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* DESKRIPSI & FOTO */}
          <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Keterangan detail..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Bukti</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative group bg-white">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span className="p-1">Upload foto</span>
                      <input ref={fileInputRef} type="file" multiple className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Maksimal 5 Foto</p>
                </div>
              </div>

              {formData.fotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.fotos.map((file, index) => (
                    <div key={index} className="relative group bg-gray-100 rounded-lg p-2 border border-gray-200">
                      <div className="text-xs text-gray-600 truncate mb-1 px-1">{file.name}</div>
                      <div className="h-20 bg-gray-200 rounded flex items-center justify-center overflow-hidden"><span className="text-3xl">📸</span></div>
                      <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TOMBOL KIRIM (TANPA MENAMPILKAN SKOR) */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.99]"
          >
            {submitting ? 'Menyimpan...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  )
}
