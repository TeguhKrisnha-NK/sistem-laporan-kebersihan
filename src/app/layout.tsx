import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Laporan Kebersihan Sekolah',
  description: 'Aplikasi manajemen laporan kebersihan OSIS',
  icons: {
    icon: '🏫',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
