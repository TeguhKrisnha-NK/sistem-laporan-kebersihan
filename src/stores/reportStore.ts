import { create } from 'zustand'
import type { Report } from '@/types'

interface ReportStore {
  reports: Report[]
  setReports: (reports: Report[]) => void
  addReport: (report: Report) => void
  updateReport: (id: string, data: Partial<Report>) => void
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  setReports: (reports) => set({ reports }),
  addReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
    })),
  updateReport: (id, data) =>
    set((state) => ({
      reports: state.reports. map((r) =>
        r.id === id ? { ...r, ...data } : r,
      ),
    })),
}))
