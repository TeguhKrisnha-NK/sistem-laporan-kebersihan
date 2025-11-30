'use client'

import { useRankingLogic } from '@/hooks/useRankingLogic'
import RankingList from '@/components/ranking/RankingList'

export default function RankingPage() {
  const { ranking, loading, semester, setSemester, year, setYear } = useRankingLogic()

  // ✅ UBAH BAGIAN INI: Menetapkan tahun 2025 - 2028
  const years = [2025, 2026, 2027, 2028]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <main className="max-w-4xl mx-auto px-4 py-8 fade-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                      🏆 Klasemen Kebersihan
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                      Ranking kelas berdasarkan performa semester ini.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    
                    {/* Dropdown Tahun */}
                    <div className="relative">
                      <select 
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="appearance-none bg-gray-100 border border-transparent hover:border-gray-300 px-4 py-2 pr-8 rounded-xl text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full sm:w-auto"
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>Tahun {y}</option>
                        ))}
                      </select>
                      {/* Panah Custom */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>

                    {/* Tombol Semester */}
                    <div className="bg-gray-100 p-1.5 rounded-xl flex shadow-inner w-full sm:w-auto">
                        {[1, 2].map((sem) => (
                          <button 
                            key={sem} 
                            onClick={() => setSemester(sem as 1 | 2)} 
                            className={`
                              flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                              ${semester === sem 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 bg-transparent'
                              }
                            `}
                          >
                            Sem {sem}
                          </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Ranking */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : (
              <RankingList ranking={ranking} />
            )}

        </div>
      </main>
    </div>
  )
}
