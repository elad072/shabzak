'use client'

import { User, ShieldCheck, UserCog, Radio, RefreshCw } from 'lucide-react'

type Role = 'מפקד משמרת' | 'קצין התגננות' | 'סמב"צ' | 'חפיפה'

interface Assignment {
  person_id: string
  person_name: string
  role: Role
  slot_index: number
}

interface ShiftCardProps {
  title: string
  timeRange: string
  assignments: Assignment[]
  onAssign: (role: Role, slotIndex: number) => void
  isNight?: boolean
}

const ROLE_CONFIG = {
  'מפקד משמרת': { 
    Icon: ShieldCheck, 
    bgColor: 'bg-sky-600', 
    textColor: 'text-white',
    borderColor: 'border-sky-700',
    labelColor: 'text-sky-100',
    iconColor: 'text-sky-600'
  },
  'קצין התגננות': { 
    Icon: UserCog, 
    bgColor: 'bg-emerald-600', 
    textColor: 'text-white',
    borderColor: 'border-emerald-700',
    labelColor: 'text-emerald-100',
    iconColor: 'text-emerald-600'
  },
  'סמב"צ': { 
    Icon: Radio, 
    bgColor: 'bg-amber-500', 
    textColor: 'text-white',
    borderColor: 'border-amber-600',
    labelColor: 'text-amber-50',
    iconColor: 'text-amber-600'
  },
  'חפיפה': { 
    Icon: RefreshCw, 
    bgColor: 'bg-indigo-600', 
    textColor: 'text-white',
    borderColor: 'border-indigo-700',
    labelColor: 'text-indigo-100',
    iconColor: 'text-indigo-600'
  },
}

export default function ShiftCard({ title, timeRange, assignments, onAssign, isNight }: ShiftCardProps) {
  // 5 Flexible Slots
  const slotIndices = [0, 1, 2, 3, 4]

  return (
    <div className={`glass-card flex flex-col gap-4 min-h-[480px] p-4 lg:p-5 ${isNight ? 'bg-slate-900/5' : 'bg-white'}`}>
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xl font-black text-slate-800 leading-none mb-1">{title}</h3>
          <p className="text-sm text-slate-500 font-bold">{timeRange}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${isNight ? 'bg-indigo-600 text-white' : 'bg-sky-500 text-white'}`}>
          {isNight ? 'לילה' : 'יום'}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {slotIndices.map((idx) => {
          const assignment = assignments.find((a) => a.slot_index === idx)
          const config = assignment ? ROLE_CONFIG[assignment.role as Role] : null
          const Icon = config?.Icon || User

          return (
            <button
              key={idx}
              onClick={() => onAssign(assignment?.role as Role || 'סמב"צ', idx)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right group relative overflow-hidden ${
                assignment 
                  ? `${config?.bgColor} ${config?.borderColor} shadow-lg shadow-black/5` 
                  : 'bg-slate-50 border-slate-100 hover:border-slate-200 border-dashed'
              }`}
            >
              <div className={`p-2 rounded-lg ${assignment ? 'bg-white shadow-sm' : 'bg-white/50 border border-slate-100'}`}>
                <Icon size={18} className={assignment ? config?.iconColor : 'text-slate-300'} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${assignment ? config?.labelColor : 'text-slate-300'}`}>
                  {assignment ? assignment.role : `משבץ ${idx + 1}`}
                </p>
                <p className={`text-base font-black truncate ${assignment ? 'text-white' : 'text-slate-300 font-medium'}`}>
                  {assignment ? assignment.person_name : 'שיבוץ ריק...'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
