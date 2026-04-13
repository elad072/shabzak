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
    <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
      <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-sky-100">
        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center">
          <MapPin size={22} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">בבסיס</p>
          <p className="text-2xl font-black text-sky-950">{counts.base}</p>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-slate-200">
        <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center">
          <Home size={22} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">בבית</p>
          <p className="text-2xl font-black text-slate-900">{counts.home}</p>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-rose-100">
        <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
          <ShieldX size={22} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">סגור</p>
          <p className="text-2xl font-black text-rose-950">{counts.closed}</p>
        </div>
      </div>
    </div>
  )
}
