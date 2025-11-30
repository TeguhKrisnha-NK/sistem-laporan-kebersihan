import { DashboardReport } from '@/hooks/useDashboardLogic'

export default function RecentActivity({ reports, loading }: { reports: DashboardReport[], loading: boolean }) {
  const todayStr = new Date().toISOString().split('T')[0]
  // Filter hanya hari ini
  const todayReports = reports.filter(r => r.tanggal === todayStr)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">📋 Aktivitas Terbaru (Hari Ini)</h2>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500">{todayStr}</span>
      </div>
      
      <div className="divide-y divide-gray-100">
        {loading ? (
           // Skeleton Loading
           [1,2,3].map(i => (
              <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
           ))
        ) : todayReports.length > 0 ? (
          todayReports.slice(0, 10).map((report) => (
            <div key={report.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
              <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${report.status === 'Bersih' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {report.deskripsi || 'Laporan tanpa deskripsi'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kelas {report.classes?.nama || '-'} • {new Date(report.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
              </div>

              <div className="flex items-center gap-2">
                {report.foto_url && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">📸</span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${report.status === 'Bersih' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {report.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-50 text-gray-400 mb-3 text-2xl">💤</div>
            <p className="text-gray-500 font-medium">Belum ada laporan hari ini</p>
            <p className="text-gray-400 text-sm">Data riwayat total bisa dilihat di kartu atas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
