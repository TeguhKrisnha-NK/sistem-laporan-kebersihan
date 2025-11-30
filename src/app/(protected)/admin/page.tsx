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

// Tipe data untuk Group Piket (Bukan Schedule Harian lagi)
interface InspectionGroup {
  id: number;
  classes: string[]; // Array nama kelas
  officers: string[]; // Array nama petugas
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
  
  // State Jadwal (Groups)
  const [groups, setGroups] = useState<InspectionGroup[]>([])
  const [editingGroup, setEditingGroup] = useState<InspectionGroup | null>(null)

  // State Modal Foto & Edit Laporan
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{status: 'Bersih' | 'Kotor', deskripsi: string}>({status: 'Bersih', deskripsi: ''})
  const [selectedImages, setSelectedImages] = useState<string[] | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
    
    // Subscribe Realtime
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
        toast.error('AKSES DITOLAK'); router.push('/dashboard'); return
      }
      await Promise.all([fetchReports(), fetchGroups()])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  // --- FETCHING ---
  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*, classes(*)').order('created_at', { ascending: false })
    if (data) setReports(data)
  }

  const fetchGroups = async () => {
    // Ambil data pembagian tugas
    const { data } = await supabase.from('inspection_groups').select('*').order('id', { ascending: true })
    if (data) setGroups(data)
  }

  // --- LOGIKA EDIT LAPORAN & WA ---
  const handleEditClick = (report: ExtendedReport) => { setEditingId(report.id); setEditData({ status: report.status, deskripsi: report.deskripsi || '' }) }
  
  const handleSaveEdit = async (reportId: string) => {
    try {
      const { error } = await supabase.from('reports').update({ status: editData.status, deskripsi: editData.deskripsi }).eq('id', reportId)
      if (error) throw error; toast.success('Updated'); setEditingId(null); fetchReports()
    } catch (error) { toast.error('Gagal') }
  }

  const handleCopyWA = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayReports = reports.filter(r => r.tanggal === todayStr)
    const message = generateWhatsAppReport({ reports: todayReports as any, ketua_osis })
    copyToClipboardWA(message) ? toast.success('Disalin!') : toast.error('Gagal')
  }

  // --- LOGIKA EDIT JADWAL (GROUPS) ---
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    try {
      const { error } = await supabase
        .from('inspection_groups')
        .update({ 
          classes: editingGroup.classes, 
          officers: editingGroup.officers 
        })
        .eq('id', editingGroup.id)

      if (error) throw error
      toast.success('Data Petugas Diperbarui!')
      setEditingGroup(null)
      fetchGroups()
    } catch (error) {
      toast.error('Gagal update')
    }
  }

  // Helper untuk mengubah string input menjadi array
  const handleArrayChange = (type: 'classes' | 'officers', text: string) => {
    if (!editingGroup) return
    const arrayData = text.split(',').map(s => s.trim()).filter(s => s !== '')
    setEditingGroup({ ...editingGroup, [type]: arrayData })
  }

  // --- RENDER ---
  const filteredReports = filterStatus === 'All' ? reports : reports.filter((r) => r.status === filterStatus)
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Stats
  const todayBersih = reports.filter(r => r.tanggal === todayStr && r.status === 'Bersih').length
  const todayKotor = reports.filter(r => r.tanggal === todayStr && r.status === 'Kotor').length
  const todayTotal = reports.filter(r => r.tanggal === todayStr).length
  const allBersih = reports.filter(r => r.status === 'Bersih').length
  const allKotor = reports.filter(r => r.status === 'Kotor').length
  const allTotal = reports.length

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <div><h1 className="text-xl font-bold text-gray-900">Admin Panel</h1><p className="text-xs text-gray-500">Administrator Mode</p></div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-medium">Logout</button>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-4"><div className="flex gap-8 border-b border-gray-200"><button onClick={() => setActiveTab('laporan')} className={`pb-4 px-2 text-base font-bold transition border-b-2 ${activeTab === 'laporan' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>📋 Laporan Masuk</button><button onClick={() => setActiveTab('jadwal')} className={`pb-4 px-2 text-base font-bold transition border-b-2 ${activeTab === 'jadwal' ? 'text-blue-600 border-blue-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>🗓️ Manajemen Tugas</button></div></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 fade-in">
        
        {/* --- TAB: LAPORAN --- */}
        {activeTab === 'laporan' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition"><div className="flex justify-between items-start z-10 relative"><div><p className="text-sm font-medium text-gray-500">Bersih (Hari Ini)</p><h3 className="text-4xl font-bold text-green-600 mt-2">{todayBersih}</h3></div><div className="p-3 bg-green-50 rounded-xl text-green-600">✨</div></div><div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{allBersih}</span></div></div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition"><div className="flex justify-between items-start z-10 relative"><div><p className="text-sm font-medium text-gray-500">Kotor (Hari Ini)</p><h3 className="text-4xl font-bold text-red-600 mt-2">{todayKotor}</h3></div><div className="p-3 bg-red-50 rounded-xl text-red-600">⚠️</div></div><div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full">{allKotor}</span></div></div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition"><div className="flex justify-between items-start z-10 relative"><div><p className="text-sm font-medium text-gray-500">Laporan (Hari Ini)</p><h3 className="text-4xl font-bold text-blue-600 mt-2">{todayTotal}</h3></div><div className="p-3 bg-blue-50 rounded-xl text-blue-600">📊</div></div><div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-xs text-gray-400">Total Sejak Awal</span><span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{allTotal}</span></div></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between gap-6 items-end lg:items-center">
               <div className="w-full lg:w-1/3"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nama Penanda Tangan (WA)</label><input value={ketua_osis} onChange={e => setKetua_osis(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white" placeholder="Nama Ketua OSIS"/></div>
               <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-end items-center">
                 <div className="flex bg-gray-100 p-1.5 rounded-lg">{['All', 'Bersih', 'Kotor'].map(s => (<button key={s} onClick={() => setFilterStatus(s as any)} className={`px-4 py-2 text-xs font-bold rounded-md transition ${filterStatus===s ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>))}</div>
                 <button onClick={handleCopyWA} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition flex items-center gap-2"><span>💬</span> Salin Format WA</button>
               </div>
            </div>

            <div className="space-y-4">
               {filteredReports.map(report => {
                 const isToday = report.tanggal === todayStr; const isEditing = editingId === report.id;
                 return (
                   <div key={report.id} className={`bg-white rounded-xl p-5 border transition-all duration-200 ${isEditing ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg scale-[1.01]' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'}`}>
                      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div className="flex items-center gap-4 md:w-1/4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${report.status === 'Bersih' ? 'bg-green-100' : 'bg-red-100'}`}>{report.status === 'Bersih' ? '✨' : '🗑️'}</div>
                           <div>
                              <h4 className="font-bold text-gray-900 text-lg">{report.classes?.nama || 'Unknown'}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                 <span>{new Date(report.created_at).toLocaleDateString('id-ID')}</span><span>•</span><span>{new Date(report.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                                 {isToday && <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[10px] font-bold">HARI INI</span>}
                              </div>
                           </div>
                        </div>
                        <div className="flex-1 md:px-4 pl-4 md:pl-0">
                           {isEditing ? (
                              <div className="space-y-3"><select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as any})} className="w-full border p-2 rounded-lg text-sm bg-gray-50"><option value="Bersih">✨ Bersih</option><option value="Kotor">🗑️ Kotor</option></select><textarea value={editData.deskripsi} onChange={e => setEditData({...editData, deskripsi: e.target.value})} className="w-full border p-2 rounded-lg text-sm bg-gray-50 outline-none" rows={2}/></div>
                           ) : (
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${report.status==='Bersih'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{report.status}</span>{report.foto_url && (<button onClick={() => {setSelectedImages(report.foto_url); setShowModal(true)}} className="text-xs flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded-full">📸 {report.foto_url.length} Foto</button>)}</div>
                                 <p className="text-gray-600 text-sm line-clamp-2">{report.deskripsi || 'Tidak ada deskripsi.'}</p>
                              </div>
                           )}
                        </div>
                        <div className="flex items-center justify-end gap-2 md:w-auto mt-2 md:mt-0 pt-2 md:pt-0">
                           {isEditing ? (<><button onClick={() => handleSaveEdit(report.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Simpan</button><button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold">Batal</button></>) : (<button onClick={() => handleEditClick(report)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>)}
                        </div>
                      </div>
                   </div>
                 )
               })}
               {filteredReports.length === 0 && (<div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300"><span className="text-4xl">📭</span><p className="text-gray-500 mt-2 font-medium">Belum ada data laporan.</p></div>)}
            </div>
          </div>
        )}

        {/* --- TAB: MANAJEMEN JADWAL/TUGAS --- */}
        {activeTab === 'jadwal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Kelompok {idx + 1}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {group.id}</span>
                  </div>
                  
                  {/* Daftar Petugas */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Petugas:</p>
                    <div className="flex flex-wrap gap-2">
                        {group.officers.map((officer, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">👤 {officer}</span>
                        ))}
                    </div>
                  </div>

                  {/* Daftar Tugas Kelas */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tugas Cek Kelas:</p>
                    <div className="flex flex-wrap gap-2">
                        {group.classes.map((cls, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-sm border border-gray-200">{cls}</span>
                        ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingGroup(group)}
                  className="mt-6 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-sm transition"
                >
                  ✏️ Edit Data
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL EDIT GROUPS */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingGroup(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Kelompok</h2>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Petugas</label>
                <p className="text-xs text-gray-400 mb-2">Pisahkan nama dengan koma (,)</p>
                <textarea 
                    className="w-full border border-gray-300 rounded-xl p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-sm"
                    value={editingGroup.officers.join(', ')}
                    onChange={(e) => handleArrayChange('officers', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tugas Kelas</label>
                <p className="text-xs text-gray-400 mb-2">Pisahkan kelas dengan koma (,)</p>
                <textarea 
                    className="w-full border border-gray-300 rounded-xl p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-sm"
                    value={editingGroup.classes.join(', ')}
                    onChange={(e) => handleArrayChange('classes', e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setEditingGroup(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition">Batal</button>
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
