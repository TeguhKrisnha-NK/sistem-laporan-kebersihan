import { Report, Class } from '@/types'

// Helper untuk membersihkan deskripsi dari tag [Petugas: Name]
const cleanDescription = (desc: string | null) => {
  if (!desc) return ''
  // Hapus teks dalam kurung siku [...] dan spasi setelahnya
  return desc.replace(/\[Petugas:.*?\]\s*/g, '').trim()
}

// Helper untuk mendapatkan tingkat kelas (X, XI, XII) dari nama kelas (misal "X A" -> "X")
const getGrade = (className: string) => {
  return className.split(' ')[0] // Mengambil kata pertama
}

export const generateWhatsAppReport = ({
  reports,
  ketua_osis,
}: {
  reports: (Report & { classes: Class | null })[]
  ketua_osis: string
}) => {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // 1. Urutkan laporan berdasarkan nama kelas (X A, X B, XI A...)
  const sortedReports = reports.sort((a, b) => {
    const classA = a.classes?.nama || ''
    const classB = b.classes?.nama || ''
    return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' })
  })

  // 2. Susun Laporan dengan Grouping
  let reportContent = ''
  let currentGrade = ''

  sortedReports.forEach((report) => {
    const className = report.classes?.nama || 'Tanpa Kelas'
    const grade = getGrade(className)

    // Jika ganti tingkat (misal dari X ke XI), tambahkan Enter
    if (grade !== currentGrade && currentGrade !== '') {
      reportContent += '\n' 
    }
    currentGrade = grade

    // Bersihkan deskripsi
    const cleanDesc = cleanDescription(report.deskripsi)
    
    // Tentukan isi status (Jika kotor tampilkan deskripsinya, jika bersih tulis Bersih)
    const statusText = report.status === 'Bersih' ? 'Bersih' : cleanDesc || 'Kotor'

    reportContent += `${className} : ${statusText}\n`
  })

  // 3. Gabungkan Header dan Footer
  const message = `*LAPORAN KEBERSIHAN KELAS*\n${today} :\n\n${reportContent}\n\nTTD Ketua OSIS\n*${ketua_osis}*`

  return message
}

export const copyToClipboardWA = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
    return true
  }
  return false
}
