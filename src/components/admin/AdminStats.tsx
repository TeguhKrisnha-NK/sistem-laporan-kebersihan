import { ExtendedReport } from '@/hooks/useAdminLogic'

export default function AdminStats({ reports }: { reports: ExtendedReport[] }) {
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Filter Data Hari Ini
  const todayReports = reports.filter(r => r.tanggal === todayStr)
  const todayBersih = todayReports.filter(r => r.status === 'Bersih').length
  const todayKotor = todayReports.filter(r => r.status === 'Kotor').length
  const todayTotal = todayReports.length
  
  // Filter Data Total (Semua)
  const allBersih = reports.filter(r => r.status === 'Bersih').length
  const allKotor = reports.filter(r => r.status === 'Kotor').length
  const allTotal = reports.length

  // Komponen Kartu (Sama persis dengan DashboardStats)
  const StatCard = ({ title, todayVal, allVal, icon, color, bg }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${color.replace('text-', 'border-')} relative overflow-hidden group hover:shadow-md transition`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider opacity-70 ${color}`}>{title} (Hari Ini)</p>
          <h3 className={`text-4xl font-bold ${color} mt-2`}>{todayVal}</h3>
        </div>
        <div className={`p-3 ${bg} rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
         <span className="text-xs text-gray-400 font-medium">Total Sejak Awal</span>
         <span className={`text-xs font-bold ${color.replace('600', '700')} ${bg} px-3 py-1 rounded-full`}>{allVal}</span>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Kartu Bersih */}
      <StatCard 
        title="Bersih" 
        todayVal={todayBersih} 
        allVal={allBersih} 
        color="text-green-600" 
        bg="bg-green-50" 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      
      {/* Kartu Kotor */}
      <StatCard 
        title="Kotor" 
        todayVal={todayKotor} 
        allVal={allKotor} 
        color="text-red-600" 
        bg="bg-red-50"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        } 
      />
      
      {/* Kartu Total */}
      <StatCard 
        title="Total" 
        todayVal={todayTotal} 
        allVal={allTotal} 
        color="text-blue-600" 
        bg="bg-blue-50"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        } 
      />
    </div>
  )
}
