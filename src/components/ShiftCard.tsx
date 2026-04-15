import { User, Plus, Trash2 } from 'lucide-react'

interface Assignment {
  person_id: string
  person_name?: string
  role_id: string
  slot_index: number
  person?: {
    first_name: string
    last_name: string
  }
  role?: {
    role_name: string
    color_code: string
  }
}

interface ShiftCardProps {
  title: string
  timeRange: string
  assignments: Assignment[]
  onAssign: (slotIndex: number) => void
  onDelete: (slotIndex: number) => void
  isNight?: boolean
}

export default function ShiftCard({ title, timeRange, assignments, onAssign, onDelete, isNight }: ShiftCardProps) {
  const slotIndices = [0, 1, 2, 3]

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      {/* Slim Divider Header */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-2">
          {title === 'משמרת יום' ? 'יום' : 'לילה'}
        </span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      <div className="space-y-1 md:space-y-2">
        {slotIndices.map((idx) => {
          const assignment = assignments.find((a) => a.slot_index === idx)
          const roleData = assignment?.role

          if (assignment) {
            return (
              <div key={idx} className="relative group flex items-center gap-2 border-b border-slate-50 last:border-0 pb-1 md:pb-0">
                <button
                  onClick={() => onAssign(idx)}
                  className="flex-1 flex items-center justify-between p-1.5 md:p-3 rounded-lg md:rounded-2xl transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <div 
                      className="px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold border text-white flex-shrink-0"
                      style={{ backgroundColor: roleData?.color_code || '#94a3b8', borderColor: 'rgba(0,0,0,0.1)' }}
                    >
                      {roleData?.role_name || 'תפקיד'}
                    </div>
                    <span className="text-sm md:text-base font-bold text-slate-700 truncate">
                      {assignment.person 
                        ? `${assignment.person.first_name} ${assignment.person.last_name}` 
                        : assignment.person_name || 'שם לא ידוע'}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(idx)
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  title="מחק שיבוץ"
                >
                  <Trash2 className="size-3.5 md:size-4" />
                </button>
              </div>
            )
          }

          return (
            <button
              key={idx}
              onClick={() => onAssign(idx)}
              className="w-full h-9 md:h-[54px] flex items-center justify-center p-2 rounded-lg md:rounded-2xl border border-dashed border-slate-100 text-slate-300 hover:border-sky-300 hover:text-sky-500 transition-all"
            >
              <Plus className="size-3.5 md:size-4" strokeWidth={3} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
