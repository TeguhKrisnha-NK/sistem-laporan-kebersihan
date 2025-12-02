export interface Class {
  id: string
  nama: string
  tingkat: string // Kita ubah jadi string agar fleksibel dan konsisten
  created_at?: string
  updated_at?: string
}

export interface Report {
  id: string
  created_at: string
  class_id: string
  user_id?: string
  status: 'Bersih' | 'Kotor'
  deskripsi: string | null
  foto_url: string[] | null
  tanggal: string
  semester: number
  score?: number
}

export interface ClassRanking {
  id: string
  nama: string
  tingkat: string // Harus sama dengan interface Class di atas
  total_bersih: number
  total_laporan: number
  persentase_bersih: number
  average_score: number // Wajib ada untuk logika ranking baru
  last_report_date?: string | null
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'petugas'
  nama_lengkap: string
}
