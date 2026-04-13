'use client'

import { Calendar, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface DateFilterProps {
  selectedDate: string
}

export default function DateFilter({ selectedDate }: DateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const navigateDate = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', newDate)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigateDate(e.target.value)
  }

  const handleAdjust = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    const newDateStr = current.toISOString().split('T')[0]
    navigateDate(newDateStr)
  }

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0]
    navigateDate(today)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={() => handleAdjust(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 transition-all active:scale-95 shadow-sm"
          title="יום קודם"
        >
          <ChevronRight size={20} />
        </button>

        <div className="flex items-center gap-2 px-1 sm:px-3 flex-1 sm:flex-none justify-center">
          <input 
            key={selectedDate}
            type="date" 
            defaultValue={selectedDate}
            onChange={handleChange}
            className="bg-transparent border-none font-black text-slate-700 outline-none cursor-pointer text-xs sm:text-sm focus:ring-0 text-center"
          />
        </div>

        <button
          onClick={() => handleAdjust(1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 transition-all active:scale-95 shadow-sm"
          title="יום הבא"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <button
        onClick={handleToday}
        className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-sky-50 text-sky-600 rounded-2xl font-black text-sm hover:bg-sky-100 transition-all active:scale-95 border border-sky-100 shadow-sm w-full sm:w-auto"
      >
        <Calendar size={18} />
        היום
      </button>
    </div>
  )
}


