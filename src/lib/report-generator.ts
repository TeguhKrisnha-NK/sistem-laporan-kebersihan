import type { Report, Class } from '@/types'
import { formatDateIndonesia } from './utils'

interface ReportData {
  reports: (Report & { classes: Class })[]
  ketua_osis: string
}

export function generateWhatsAppReport(data: ReportData): string {
  const today = formatDateIndonesia(new Date())

  const reportsByClass = new Map<string, string>()

  data.reports.forEach((report) => {
    const className = report.classes.nama
    const content =
      report.status === 'Bersih' ? 'Bersih' : report. deskripsi || 'Kotor'

    reportsByClass.set(className, content)
  })

  let message = `LAPORAN KEBERSIHAN KELAS\n${today} :\n\n`

  const sortedClasses = Array.from(reportsByClass.entries()). sort((a, b) =>
    a[0].localeCompare(b[0]),
  )

  sortedClasses.forEach(([className, status]) => {
    message += `${className} : ${status}\n`
  })

  message += `\nTTD Ketua OSIS\n*${data.ketua_osis}*`

  return message
}

export function copyToClipboardWA(text: string): boolean {
  try {
    navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
