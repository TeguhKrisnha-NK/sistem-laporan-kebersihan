'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { generateWhatsAppReport, copyToClipboardWA } from '@/lib/report-generator'
import type { Report, Class } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

// --- TIPE DATA ---
interface ExtendedReport extends Omit<Report, 'foto_url'> {
  classes: Class;
  foto_url: string[] | null;
}

interface Schedule {
  id: number;
  day_of_week: string;
  members: string[];
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  // State Utama
  const [activeTab, setActiveTab] = useState<'laporan' | 'jadwal'>('laporan')
  const [loading, setLoading] = useState(true)
  
  // State Laporan
  const [reports, setReports] = useState<ExtendedReport[]>([])
  const [ketua_osis, setKetua_osis] = useState('Ida Bagus Made Sesa Kumara')
  const [filterStatus, setFilterStatus] = useState<'All' | 'Bersih' | 'Kotor'>('All')
  
  // State Jadwal
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  // State Modal Foto & Edit Laporan
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{status: 'Bersih' | 'Kotor', deskripsi: string}>({status: 'Bersih', deskripsi: ''})
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
    
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchReports())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.email !== 'teguhkrisnha@gmail.com') {
        toast.error('AKSES DITOLAK: Anda bukan Admin.')
        router.push('/dashboard') 
        return
      }
      await Promise.all([fetchReports(), fetchSchedules()])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- FETCHING ---
  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*, classes(*)').order('created_at', { ascending: false })
    if (data) setReports(data)
  }

  const fetchSchedules = async () => {
    const dayOrder: {[key: string]: number} = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 }
    const { data } = await supabase.from('picket_schedules').select('*')
    if (data) {
      const sorted = data.sort((a, b) => (dayOrder[a.day_of_week] || 99) - (dayOrder[b.day_of_week] || 99))
      setSchedules(sorted)
    }
  }

  // --- LOGIKA EDIT LAPORAN ---
  const handleEditClick = (report: ExtendedReport) => {
    setEditingId(report.id)
    setEditData({
      status: report.status,
      deskripsi: report.deskripsi || '',
    })
  }

  const handleSaveEdit = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: editData.status,
          deskripsi: editData.deskripsi,
        })
        .eq('id', reportId)

      if (error) throw error
      toast.success('Laporan diperbarui')
      setEditingId(null)
      fetchReports()
    } catch (error) {
      toast.error('Gagal update')
    }
  }

  // --- LOGIKA COPY WA ---
  const handleCopyWA = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayReports = reports.filter(r => r.tanggal === todayStr)
    const message = generateWhatsAppReport({ reports: todayReports as any, ketua_osis })
    copyToClipboardWA(message) ? toast.success('Laporan WA disalin!') : toast.error('Gagal menyalin')
  }

  // --- LOGIKA JADWAL ---
  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSchedule) return

    try {
      const { error } = await supabase
        .from('picket_schedules')
        .update({ members: editingSchedule.members })
        .eq('id', editingSchedule.id)

      if (error) throw error
      toast.success('Jadwal diperbarui!')
      setEditingSchedule(null)
      fetchSchedules()
    } catch (error) {
      toast.error('Gagal update jadwal')
    }
  }

  const handleMembersChange = (text: string) => {
    if (!editingSchedule) return
    const membersArray = text.split(',').map(s => s.trim()).filter(s => s !== '')
    setEditingSchedule({ ...editingSchedule, members: membersArray })
  }

  // --- RENDER HELPERS ---
  const filteredReports = filterStatus === 'All' ? reports : reports.filter((r) => r.status === filterStatus)
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Stats Calculation
  const todayBersih = reports.filter(r => r.tanggal === todayStr && r.status === 'Bersih').length
  const todayKotor = reports.filter(r => r.tanggal === todayStr && r.status === 'Kotor').length
  const todayTotal = reports.filter(r => r.tanggal === todayStr).length
  
  const allBersih = reports.filter(r => r.status === 'Bersih').length
  const allKotor = reports.filter(r => r.status === 'Kotor').length
  const allTotal = reports.length

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">Mode Administrator</p>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-medium">
            Logout
          </button>
        </div>
        
        {/* TAB NAVIGATION (DIPERBAIKI: JARAK LEBIH LEGA) */}
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="flex gap-8 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('laporan')}
              className={`pb-4 px-2 text-base font-bold transition border-b-2 ${activeTab === 'laporan' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              📋 Laporan Masuk
            </button>
            <button 
              onClick={() => setActiveTab('jadwal')}
              className={`pb-4 px-2 text-base font-bold transition border-b-2 ${activeTab === 'jadwal' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              🗓️ Manajemen Jadwal
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 fade-in">
        
        {/* --- TAB: LAPORAN --- */}
        {activeTab === 'laporan' && (
          <div className="space-y-8">
            
            {/* 1. STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Bersih */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
                  <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bersih (Hari Ini)</p>
                      <h3 className="text-4xl font-bold text-green-600 mt-2">{todayBersih}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">✨</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                     <span className="text-xs text-gray-400">Total Sejak Awal</span>
                     <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{allBersih}</span>
                  </div>
               </div>

               {/* Kotor */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
                  <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Kotor (Hari Ini)</p>
                      <h3 className="text-4xl font-bold text-red-600 mt-2">{todayKotor}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">⚠️</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                     <span className="text-xs text-gray-400">Total Sejak Awal</span>
                     <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{allKotor}</span>
                  </div>
               </div>

               {/* Total */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
                  <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Laporan (Hari Ini)</p>
                      <h3 className="text-4xl font-bold text-blue-600 mt-2">{todayTotal}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">📊</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                     <span className="text-xs text-gray-400">Total Sejak Awal</span>
                     <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{allTotal}</span>
                  </div>
               </div>
            </div>

            {/* 2. TOOLBAR & FILTER (DIPERBAIKI: TOMBOL COPY WA LEBIH BESAR) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between gap-6 items-end lg:items-center">
               <div className="w-full lg:w-1/3">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nama Penanda Tangan (WA)</label>
                 <input 
                    value={ketua_osis} 
                    onChange={e => setKetua_osis(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Nama Ketua OSIS / Admin"
                 />
               </div>
               
               <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-end items-center">
                 <div className="flex bg-gray-100 p-1.5 rounded-lg">
                    {['All', 'Bersih', 'Kotor'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setFilterStatus(s as any)} 
                        className={`px-4 py-2 text-xs font-bold rounded-md transition ${filterStatus===s ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
                 
                 {/* TOMBOL COPY WA DIPERBESAR */}
                 <button 
                    onClick={handleCopyWA} 
                    className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-green-300 active:scale-95 transition flex items-center gap-2"
                 >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    Salin Laporan WA
                 </button>
               </div>
            </div>

            {/* 3. DAFTAR LAPORAN (CARD ROW STYLE) */}
            <div className="space-y-4">
               {filteredReports.map(report => {
                 const isToday = report.tanggal === todayStr;
                 const isEditing = editingId === report.id;

                 return (
                   <div 
                      key={report.id} 
                      className={`
                        bg-white rounded-xl p-5 border transition-all duration-200
                        ${isEditing ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg scale-[1.01]' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'}
                      `}
                   >
                      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        
                        {/* Kolom Kiri: Waktu & Kelas */}
                        <div className="flex items-center gap-4 md:w-1/4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${report.status === 'Bersih' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {report.status === 'Bersih' ? '✨' : '🗑️'}
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900 text-lg">{report.classes?.nama || 'Unknown'}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                 <span>{new Date(report.created_at).toLocaleDateString('id-ID')}</span>
                                 <span>•</span>
                                 <span>{new Date(report.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                                 {isToday && <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[10px] font-bold">HARI INI</span>}
                              </div>
                           </div>
                        </div>

                        {/* Kolom Tengah: Deskripsi & Status */}
                        <div className="flex-1 md:px-4 border-l border-gray-100 md:border-l-0 md:border-none pl-4 md:pl-0">
                           {isEditing ? (
                              <div className="space-y-3">
                                 <select 
                                    value={editData.status} 
                                    onChange={e => setEditData({...editData, status: e.target.value as any})}
                                    className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                                 >
                                    <option value="Bersih">✨ Bersih</option>
                                    <option value="Kotor">🗑️ Kotor</option>
                                 </select>
                                 <textarea 
                                    value={editData.deskripsi}
                                    onChange={e => setEditData({...editData, deskripsi: e.target.value})}
                                    className="w-full border p-2 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none"
                                    rows={2}
                                    placeholder="Deskripsi laporan..."
                                 />
                              </div>
                           ) : (
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${report.status==='Bersih'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>
                                       {report.status}
                                    </span>
                                    {report.foto_url && (
                                       <button onClick={() => {setSelectedImages(report.foto_url); setShowModal(true)}} className="text-xs flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-full">
                                          📸 {report.foto_url.length} Foto
                                       </button>
                                    )}
                                 </div>
                                 <p className="text-gray-600 text-sm line-clamp-2">{report.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
                              </div>
                           )}
                        </div>

                        {/* Kolom Kanan: Aksi */}
                        <div className="flex items-center justify-end gap-2 md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0">
                           {isEditing ? (
                              <>
                                 <button onClick={() => handleSaveEdit(report.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm">
                                    Simpan
                                 </button>
                                 <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition">
                                    Batal
                                 </button>
                              </>
                           ) : (
                              <button 
                                 onClick={() => handleEditClick(report)} 
                                 className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                 title="Edit Laporan"
                              >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                              </button>
                           )}
                        </div>

                      </div>
                   </div>
                 )
               })}
               
               {filteredReports.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                     <span className="text-4xl">📭</span>
                     <p className="text-gray-500 mt-2 font-medium">Belum ada data laporan.</p>
                  </div>
               )}
            </div>
          </div>
        )}

        {/* --- TAB: JADWAL PIKET --- */}
        {activeTab === 'jadwal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🗓️ {schedule.day_of_week}
                  </h3>
                  <div className="space-y-2">
                    {schedule.members && schedule.members.length > 0 ? (
                      schedule.members.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-xs">👤</span> <span className="text-sm font-medium">{member}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-sm">Belum ada petugas.</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setEditingSchedule(schedule)}
                  className="mt-6 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-sm transition"
                >
                  ✏️ Edit Petugas
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL EDIT JADWAL */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingSchedule(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Jadwal: {editingSchedule.day_of_week}</h2>
            <form onSubmit={handleUpdateSchedule}>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nama Petugas</label>
              <p className="text-xs text-gray-500 mb-2">Pisahkan nama dengan tanda koma (,).</p>
              <textarea 
                className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                value={editingSchedule.members.join(', ')}
                onChange={(e) => handleMembersChange(e.target.value)}
              />
              <div className="flex gap-3 mt-6 justify-end">
                <button type="button" onClick={() => setEditingSchedule(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTO */}
      {showModal && selectedImages && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
           <div className="bg-white rounded-2xl max-w-4xl w-full p-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">📸 Bukti Foto</h3>
                 <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden group">
                       <Image src={img} alt="Bukti" fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized/>
                       <a href={img} target="_blank" className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">Buka Full</a>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
