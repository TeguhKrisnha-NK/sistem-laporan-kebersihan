'use client'
import { useState } from 'react'
import { InspectionGroup } from '@/hooks/useAdminLogic'

export default function SchedulesTab({ groups, onUpdate }: { groups: InspectionGroup[], onUpdate: any }) {
  const [editingGroup, setEditingGroup] = useState<InspectionGroup | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return
    onUpdate(editingGroup.id, editingGroup.classes, editingGroup.officers)
    setEditingGroup(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group, idx) => (
        <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Kelompok {idx + 1}</h3>
            </div>
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Petugas:</p>
              <div className="flex flex-wrap gap-2">{group.officers.map((o, i) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">👤 {o}</span>)}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tugas Kelas:</p>
              <div className="flex flex-wrap gap-2">{group.classes.map((c, i) => <span key={i} className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-sm border">{c}</span>)}</div>
            </div>
          </div>
          <button onClick={() => setEditingGroup(group)} className="mt-6 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-sm transition">✏️ Edit Data</button>
        </div>
      ))}

      {/* Modal Edit */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Kelompok</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Nama Petugas (Pisahkan koma)</label>
                <textarea className="w-full border rounded p-2 h-20" value={editingGroup.officers.join(', ')} onChange={e => setEditingGroup({...editingGroup, officers: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Tugas Kelas (Pisahkan koma)</label>
                <textarea className="w-full border rounded p-2 h-20" value={editingGroup.classes.join(', ')} onChange={e => setEditingGroup({...editingGroup, classes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setEditingGroup(null)} className="px-4 py-2 text-gray-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
