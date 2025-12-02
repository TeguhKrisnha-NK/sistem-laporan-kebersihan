export interface Class {
  id: string
  nama: string
  tingkat: 'X' | 'XI' | 'XII'
  created_at: string
  updated_at: string
}

export interface Report {
  id: string;
  created_at: string;
  class_id: string;
  user_id?: string;
  status: 'Bersih' | 'Kotor';
  deskripsi: string | null;
  foto_url: string[] | null;
  tanggal: string;
  semester: number;
  score?: number;
}

// Tambahkan 'average_score' di Ranking
export interface ClassRanking {
  id: string;
  nama: string;
  tingkat: string;
  total_bersih: number;
  total_laporan: number;
  persentase_bersih: number;
  average_score: number; // ✅ Tambahkan ini
}
export interface User {
  id: string
  email: string
  role: 'admin' | 'petugas'
  nama_lengkap: string
}

export interface ClassRanking {
  id: string
  nama: string
  tingkat: 'X' | 'XI' | 'XII'
  total_bersih: number
  total_laporan: number
  persentase_bersih: number
  last_report_date: string | null
}
