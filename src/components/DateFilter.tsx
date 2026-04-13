'use client'

import { Calendar } from 'lucide-react'

interface DateFilterProps {
  selectedDate: string
}

export default function DateFilter({ selectedDate }: DateFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = new URL(window.location.href)
    url.searchParams.set('date', e.target.value)
    window.location.href = url.toString()
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
      <span className="pr-4 text-sm font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">בחר תאריך:</span>
      <div className="relative">
        <input 
          type="date" 
          defaultValue={selectedDate}
          onChange={handleChange}
          className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 font-black text-slate-700 outline-none focus:border-sky-500 transition-all cursor-pointer"
        />
      </div>
    </div>
  )
}
