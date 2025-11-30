'use client'

import { useRef } from 'react'
import { useInputLaporan } from '@/hooks/useInputLaporan'
import toast from 'react-hot-toast'

export default function InputForm() {
  const { classes, loading, submitting, formData, setFormData, submitReport, officerName } = useInputLaporan()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle File Change
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
          📝 Input Laporan
        </h1>
        {officerName ? (
          <div className="mt-3 bg-blue-50 inline-flex items-center px-4 py-1.5 rounded-full border border-blue-100">
            <span className="text-blue-600 text-sm font-medium">Petugas: <b>{officerName}</b></span>
          </div>
        ) : (
          <p className="text-gray-500 mt-2">Isi formulir untuk melaporkan kondisi kelas.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={(e) => { e.preventDefault(); submitReport(); }} className="space-y-6">
          
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>

          {/* STATUS KEBERSIHAN (DENGAN SVG) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Kondisi Kebersihan <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              {['Bersih', 'Kotor'].map((option) => {
                const isSelected = formData.status === option;
                const isBersih = option === 'Bersih';

                return (
                  <div
                    key={option}
                    onClick={() => setFormData({ ...formData, status: option })}
                    className={`
                      cursor-pointer p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 select-none group
                      ${isSelected
                        ? (isBersih ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* SVG ICON WRAPPER */}
                    <div className={`p-3 rounded-full transition-colors ${
                      isSelected
                        ? (isBersih ? 'bg-white text-green-600 shadow-sm' : 'bg-white text-red-600 shadow-sm')
                        : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600'
                    }`}>
                      {isBersih ? (
                        // Ikon Sparkles (Bersih)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      ) : (
                        // Ikon Trash (Kotor)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </div>

                    <span className={`font-bold text-lg ${
                      isSelected
                        ? (isBersih ? 'text-green-700' : 'text-red-700')
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`}>
                      {option}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* DESKRIPSI & FOTO */}
          <div className="space-y-6">
            <div className={`transition-all duration-300`}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Detail Masalah {formData.status === 'Kotor' && <span className="text-red-500">*</span>}</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder={formData.status === 'Kotor' ? "Contoh: Ada sampah plastik di kolong meja..." : "Catatan tambahan (opsional)..."}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Bukti <span className="text-gray-400 font-normal">(Bisa pilih banyak)</span></label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative group bg-white">
                <div className="space-y-1 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition flex justify-center">
                    <svg stroke="currentColor" fill="none" viewBox="0 0 48 48" className="h-12 w-12"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                  <p className="text-xs text-gray-500">Maksimal 5 Foto</p>
                </div>
              </div>

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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm transition transform hover:scale-110"
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
