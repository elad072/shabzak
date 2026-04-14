'use client'

import { Users, Home, ShieldX, MapPin } from 'lucide-react'

interface StatusSummaryProps {
  counts: {
    base: number
    home: number
    closed: number
  }
}

export default function StatusSummary({ counts }: StatusSummaryProps) {
  const total = counts.base + counts.home + counts.closed

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 w-full md:w-auto">
      <div className="bg-sky-50 border border-sky-100 p-2 md:p-4 rounded-[1rem] md:rounded-2xl flex items-center justify-center md:justify-start gap-1.5 md:gap-4 transition-all hover:bg-sky-100">
        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-sky-500 text-white flex items-center justify-center flex-shrink-0">
          <MapPin size={14} className="md:w-[22px] md:h-[22px]" />
        </div>
        <div className="flex flex-col md:block items-start">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-sky-600 leading-none md:leading-normal">בבסיס</p>
          <p className="text-sm md:text-2xl font-black text-sky-950 leading-none">{counts.base}</p>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 p-2 md:p-4 rounded-[1rem] md:rounded-2xl flex items-center justify-center md:justify-start gap-1.5 md:gap-4 transition-all hover:bg-slate-200">
        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-400 text-white flex items-center justify-center flex-shrink-0">
          <Home size={14} className="md:w-[22px] md:h-[22px]" />
        </div>
        <div className="flex flex-col md:block items-start">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none md:leading-normal">בבית</p>
          <p className="text-sm md:text-2xl font-black text-slate-900 leading-none">{counts.home}</p>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 p-2 md:p-4 rounded-[1rem] md:rounded-2xl flex items-center justify-center md:justify-start gap-1.5 md:gap-4 transition-all hover:bg-rose-100">
        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
          <ShieldX size={14} className="md:w-[22px] md:h-[22px]" />
        </div>
        <div className="flex flex-col md:block items-start">
          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-600 leading-none md:leading-normal">סגור</p>
          <p className="text-sm md:text-2xl font-black text-rose-950 leading-none">{counts.closed}</p>
        </div>
      </div>
    </div>
  )
}
