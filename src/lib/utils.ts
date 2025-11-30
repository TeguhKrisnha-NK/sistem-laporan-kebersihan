import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateIndonesia(date: string | Date): string {
  return format(
    typeof date === 'string' ? new Date(date) : date,
    "EEEE, dd MMMM yyyy",
    { locale: id },
  )
}

export function getCurrentSemester(): 1 | 2 {
  const month = new Date().getMonth() + 1
  return month >= 7 ? 1 : 2
}

export function copyToClipboard(text: string): boolean {
  try {
    navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
