'use client'
import { useState } from 'react'
import Image from 'next/image'
import { generateWhatsAppReport, copyToClipboardWA } from '@/lib/report-generator'
import toast from 'react-hot-toast'
import { ExtendedReport } from '@/hooks/useAdminLogic'

interface Props {
  reports: ExtendedReport[]
  onUpdate: (id: string, status: string, desc: string) => void
  onDelete: (id: string) => void
}

export default function ReportsTab({ reports, onUpdate, onDelete }: Props) {
  const [ketuaOsis, setKetuaOsis] = useState('Ida Bagus Made Sesa Kumara')
  const [filter, setFilter] = useState('All')
  
  // State Edit Inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ status: '', deskripsi: '' })
  
  // State Modal Hapus & Foto
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewImages, setViewImages] = useState<string[] | null>(null)

  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter)
  const todayStr = new Date().toISOString().split('T')[0]

  const handleCopyWA = () => {
    const todayReports = reports.filter(r => r.tanggal === todayStr)
    const msg = generateWhatsAppReport({ reports: todayReports as any, ketua_osis: ketuaOsis })
    copyToClipboardWA(msg) ? toast.success('Disalin!') : toast.error('Gagal')
  }

  return (
    <div className="space-y-6">
      {/* --- TOOLBAR (Filter & Copy WA) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 items-end sticky top-20 z-10">
        <div className="w-full md:w-1/3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nama Penanda Tangan</label>
          <input value={ketuaOsis} onChange={e => setKetuaOsis(e.target.value)} className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex gap-4 items-center flex-wrap justify-end">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['All', 'Bersih', 'Kotor'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 text-xs font-bold rounded-md transition ${filter === s ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{s}</button>
            ))}
          </div>
          <button onClick={handleCopyWA} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg transition flex items-center gap-2">
            <span>💬</span> Copy WA
          </button>
        </div>
      </div>

      {/* --- LIST DATA (CARD STYLE DENGAN SVG) --- */}
      <div className="space-y-4">
        {filtered.map(report => {
          const isToday = report.tanggal === todayStr;
          const isEditing = editingId === report.id;

          return (
            <div key={report.id} className={`bg-white rounded-xl p-5 border transition-all duration-200 ${isEditing ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg scale-[1.01]' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'}`}>
              <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                
                {/* Bagian Kiri: Ikon SVG & Info */}
                <div className="flex items-center gap-4 md:w-1/4">
                  
                  {/* UPDATE: Menggunakan SVG Icon agar sama dengan Input Form */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${report.status === 'Bersih' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {report.status === 'Bersih' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{report.classes?.nama || 'Unknown'}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{new Date(report.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                      {isToday && <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[10px] font-bold">HARI INI</span>}
                    </div>
                  </div>
                </div>

                {/* Bagian Tengah: Deskripsi & Status */}
                <div className="flex-1 md:px-4 pl-4 md:pl-0 border-l border-gray-100 md:border-none">
                  {isEditing ? (
                    <div className="space-y-3">
                      <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Bersih">Bersih</option>
                        <option value="Kotor">Kotor</option>
                      </select>
                      <textarea value={editData.deskripsi} onChange={e => setEditData({...editData, deskripsi: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" rows={2}/>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${report.status==='Bersih'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                          {report.status}
                        </span>
                        {report.foto_url && (
                          <button onClick={() => setViewImages(report.foto_url)} className="text-xs flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-full transition hover:bg-blue-100">
                            📸 {report.foto_url.length} Foto
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{report.deskripsi || 'Tidak ada deskripsi.'}</p>
                    </div>
                  )}
                </div>

                {/* Bagian Kanan: Tombol Aksi */}
                <div className="flex items-center justify-end gap-2 md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0">
                  {isEditing ? (
                    <>
                      <button onClick={() => { onUpdate(report.id, editData.status, editData.deskripsi); setEditingId(null) }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">Batal</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(report.id); setEditData({ status: report.status, deskripsi: report.deskripsi || '' }) }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteId(report.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 mt-2 font-medium">Tidak ada data laporan.</p>
          </div>
        )}
      </div>

      {/* --- MODALS (Hapus & Foto) --- */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Hapus Laporan?</h3>
            <p className="text-sm text-gray-500 mt-2">Data dan foto akan dihapus permanen.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">Batal</button>
              <button onClick={() => { onDelete(deleteId); setDeleteId(null) }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {viewImages && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setViewImages(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full p-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg">📸 Bukti Foto</h3>
               <button onClick={() => setViewImages(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewImages.map((img, i) => (
                <div key={i} className="relative aspect-video bg-gray-200 rounded overflow-hidden group">
                  <Image src={img} alt="Bukti" fill className="object-cover" unoptimized />
                  <a href={img} target="_blank" className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition">Buka Full</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
