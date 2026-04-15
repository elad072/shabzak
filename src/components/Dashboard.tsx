'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ShiftCard from './ShiftCard'
import ShiftModal from './ShiftModal'
import StatsModal from './StatsModal'
import { createClient } from '../utils/supabase/client'
import { Calendar as CalendarIcon, ArrowDownCircle, BarChart3, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DashboardProps {
  initialPeople: any[]
  initialAssignments: any[]
  initialRoles: any[]
  startDate: Date
}

function toIsoDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Dashboard({ initialPeople, initialAssignments, initialRoles, startDate }: DashboardProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; shiftType: 'day' | 'night'; slotIndex: number } | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const todayStr = toIsoDateStr(new Date())
  const todayRef = useRef<HTMLDivElement>(null)

  // Determine if viewing current week
  const thisWeekSunday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const isCurrentWeek =
    toIsoDateStr(startDate) === toIsoDateStr(thisWeekSunday)

  const assignmentsByDateAndShift = useMemo(() => {
    const dict: Record<string, Record<string, any[]>> = {}
    for (const a of assignments) {
      if (!dict[a.date]) dict[a.date] = { day: [], night: [] }
      if (!dict[a.date][a.shift_type]) dict[a.date][a.shift_type] = []
      dict[a.date][a.shift_type].push(a)
    }
    return dict
  }, [assignments])

  useEffect(() => {
    setAssignments(initialAssignments)
  }, [startDate.getTime()])

  useEffect(() => {
    if (isCurrentWeek && todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isCurrentWeek])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const handleOpenModal = (date: string, shiftType: 'day' | 'night', slotIndex: number) => {
    setSelectedSlot({ date, shiftType, slotIndex })
  }

  const scrollToToday = () => {
    if (isCurrentWeek) {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      router.push('/')
    }
  }

  const handleSaveAssignment = async (roleId: string, personId: string) => {
    if (!selectedSlot) return

    const { date, shiftType, slotIndex } = selectedSlot
    const person = initialPeople.find(p => p.id === personId)
    const role = initialRoles.find(r => r.id === roleId)
    if (!person || !role) return

    const newAssignment = {
      date,
      shift_type: shiftType,
      person_id: personId,
      role_id: roleId,
      slot_index: slotIndex,
      person_name: `${person.first_name} ${person.last_name}`,
      person: { first_name: person.first_name, last_name: person.last_name },
      role: { role_name: role.role_name, color_code: role.color_code },
    }

    setIsSavingAssignment(true)
    try {
      const { error } = await supabase
        .from('assignments')
        .upsert(
          { date, shift_type: shiftType, person_id: personId, role_id: roleId, slot_index: slotIndex },
          { onConflict: 'date,shift_type,slot_index' }
        )

      if (error) throw error

      setAssignments(prev => {
        const filtered = prev.filter(
          a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex)
        )
        return [...filtered, newAssignment]
      })
      setSelectedSlot(null)
      toast.success('המשמרת שובצה בהצלחה')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('אירעה שגיאה בשיבוץ המשמרת')
    } finally {
      setIsSavingAssignment(false)
    }
  }

  const handleDeleteAssignment = async (date: string, shiftType: 'day' | 'night', slotIndex: number) => {
    if (!confirm('האם לבטל את השיבוץ?')) return

    const toastId = toast.loading('מבטל שיבוץ...')

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .match({ date, shift_type: shiftType, slot_index: slotIndex })

      if (error) throw error

      setAssignments(prev =>
        prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex))
      )
      toast.success('השיבוץ בוטל', { id: toastId })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('שגיאה בביטול השיבוץ', { id: toastId })
    }
  }

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

  return (
    <div className="flex flex-col gap-4 md:gap-6 pb-32 relative px-2 md:px-0">
      {/* Future week banner */}
      {!isCurrentWeek && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-100 rounded-2xl text-violet-700 text-xs md:text-sm font-black mx-2 md:mx-0">
          <CalendarClock size={18} className="shrink-0" />
          <span>אתה מציג שבוע שאינו השבוע הנוכחי</span>
        </div>
      )}

      {/* Floating Buttons Container */}
      <div className="fixed bottom-24 md:bottom-10 left-4 md:left-10 flex flex-col gap-3 z-40 items-end">
        <button
          onClick={() => setIsStatsModalOpen(true)}
          className="p-3 md:p-4 bg-sky-600 text-white rounded-full shadow-2xl hover:bg-sky-700 transition-all flex items-center gap-2"
          title="סטטיסטיקת משמרות"
        >
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-black hidden md:inline">סטטיסטיקה שבועית</span>
        </button>
        <button
          onClick={scrollToToday}
          className={`p-3 md:p-4 text-white rounded-full shadow-2xl transition-all flex items-center gap-2 ${
            isCurrentWeek
              ? 'bg-sky-500 hover:bg-sky-600 animate-bounce hidden md:flex'
              : 'bg-violet-500 hover:bg-violet-600'
          }`}
          title={isCurrentWeek ? 'קפוץ להיום' : 'חזור לשבוע הנוכחי'}
        >
          <ArrowDownCircle className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-black hidden md:inline">
            {isCurrentWeek ? 'קפוץ להיום' : 'שבוע נוכחי'}
          </span>
        </button>
      </div>

      {weekDays.map((date, idx) => {
        const dateStr = toIsoDateStr(date)
        const isToday = dateStr === todayStr

        return (
          <div
            key={dateStr}
            ref={isToday ? todayRef : null}
            className={`bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border-2 transition-all p-4 md:p-8 lg:p-10 scroll-mt-20 ${
              isToday
                ? 'border-sky-500 ring-4 ring-sky-500/10 md:scale-[1.02] shadow-xl'
                : 'border-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4 md:mb-8 gap-3 border-b border-slate-50 pb-4 md:pb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center ${
                    isToday ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <CalendarIcon className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight">
                    יום {dayNames[idx]}
                  </h3>
                  <p className="text-xs md:text-lg font-bold text-slate-400 tracking-tight">
                    {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}
                  </p>
                </div>
              </div>
              {isToday && (
                <div className="px-3 py-1 md:px-5 md:py-2 bg-sky-500 text-white rounded-full font-black text-[10px] md:text-sm uppercase tracking-widest border border-sky-400 shadow-sm animate-pulse">
                  היום
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-20">
              <ShiftCard
                title="משמרת יום"
                timeRange="08:30 - 20:30"
                assignments={assignmentsByDateAndShift[dateStr]?.day || []}
                onAssign={slotIndex => handleOpenModal(dateStr, 'day', slotIndex)}
                onDelete={slotIndex => handleDeleteAssignment(dateStr, 'day', slotIndex)}
              />

              <ShiftCard
                title="משמרת לילה"
                timeRange="20:30 - 08:30"
                assignments={assignmentsByDateAndShift[dateStr]?.night || []}
                isNight
                onAssign={slotIndex => handleOpenModal(dateStr, 'night', slotIndex)}
                onDelete={slotIndex => handleDeleteAssignment(dateStr, 'night', slotIndex)}
              />
            </div>
          </div>
        )
      })}

      {selectedSlot && (
        <ShiftModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSave={handleSaveAssignment}
          isSaving={isSavingAssignment}
          people={initialPeople}
          roles={initialRoles}
          date={selectedSlot.date}
          shiftType={selectedSlot.shiftType}
        />
      )}
      {isStatsModalOpen && (
        <StatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          people={initialPeople}
          assignments={assignments}
        />
      )}
    </div>
  )
}
