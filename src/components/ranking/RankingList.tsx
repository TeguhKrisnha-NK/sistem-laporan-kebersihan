import type { ClassRanking } from '@/types'

export default function RankingList({ ranking }: { ranking: ClassRanking[] }) {
  
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50 border-yellow-400 shadow-md ring-1 ring-yellow-200'
      case 1: return 'bg-gray-50 border-gray-300 shadow-sm'
      case 2: return 'bg-orange-50 border-orange-300 shadow-sm'
      default: return 'bg-white border-gray-100 hover:bg-gray-50'
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <span className="text-4xl">🏆</span>
    if (index === 1) return <span className="text-4xl">🥈</span>
    if (index === 2) return <span className="text-4xl">🥉</span>
    return <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
  }

  if (ranking.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
        <span className="text-4xl">📭</span>
        <p className="text-gray-500 mt-2 font-medium">Belum ada data ranking.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {ranking.map((item, index) => (
        <div 
          key={item.id} 
          className={`relative flex items-center p-6 rounded-2xl border-2 transition-all hover:scale-[1.01] ${getRankStyle(index)}`}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 shrink-0 mr-6">
            {getRankIcon(index)}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-200/50 pb-2">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{item.nama}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-bold mt-1 sm:mt-0 w-fit ${index < 3 ? 'bg-white text-gray-800 border border-gray-200 shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                Tingkat {item.tingkat}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Bersih</p>
                <p className="text-xl font-bold text-green-600 flex items-center justify-center sm:justify-start gap-1">
                  {item.total_bersih} <span className="text-xs font-normal text-gray-400">kali</span>
                </p>
              </div>

              <div className="text-center sm:text-left border-l border-gray-200 pl-4">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Laporan</p>
                <p className="text-xl font-bold text-gray-700">{item.total_laporan}</p>
              </div>

              {/* KOLOM RATA-RATA NILAI */}
              <div className="text-center sm:text-right border-l border-gray-200 pl-4">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Rata-rata Nilai</p>
                <p className={`text-2xl font-black ${item.average_score >= 470 ? 'text-green-600' : item.average_score >= 450 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {item.average_score || 0}
                </p>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
