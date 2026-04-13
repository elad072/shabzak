import { User, Plus } from 'lucide-react'

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
  isNight?: boolean
}

export default function ShiftCard({ title, timeRange, assignments, onAssign, isNight }: ShiftCardProps) {
  const slotIndices = [0, 1, 2, 3]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${isNight ? 'bg-indigo-500' : 'bg-sky-400'}`} />
          <div>
            <h4 className="text-xl font-black text-slate-800 leading-none">{title}</h4>
            <p className="text-sm text-slate-400 font-bold tracking-tight">{timeRange}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {slotIndices.map((idx) => {
          const assignment = assignments.find((a) => a.slot_index === idx)
          const roleData = assignment?.role

          if (assignment) {
            return (
              <button
                key={idx}
                onClick={() => onAssign(idx)}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:border-sky-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider text-white shadow-sm"
                    style={{ backgroundColor: roleData?.color_code || '#94a3b8', borderColor: 'rgba(0,0,0,0.1)' }}
                  >
                    {roleData?.role_name || 'תפקיד'}
                  </div>
                  <span className="text-base font-black text-slate-700 group-hover:text-sky-700 transition-colors">
                    {assignment.person 
                      ? `${assignment.person.first_name} ${assignment.person.last_name}` 
                      : assignment.person_name || 'שם לא ידוע'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-sky-50 group-hover:text-sky-500 transition-all">
                  <User size={16} strokeWidth={3} />
                </div>
              </button>
            )
          }

          return (
            <button
              key={idx}
              onClick={() => onAssign(idx)}
              className="w-full h-[54px] flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-100 text-slate-300 hover:border-sky-300 hover:text-sky-500 hover:bg-sky-50/30 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Plus size={16} strokeWidth={3} />
                <span className="text-sm font-black uppercase tracking-widest">הוסף שיבוץ</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
