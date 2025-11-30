import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css' // Penting agar Tailwind jalan

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistem Laporan Kebersihan',
  description: 'Sistem Manajemen Kebersihan Sekolah',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        
        {/* Render Halaman Utama di sini */}
        {children}
        
        {/* Notifikasi Toast (Wajib ditaruh di sini agar muncul) */}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
