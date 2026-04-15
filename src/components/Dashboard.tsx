'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import ShiftCard from './ShiftCard'
import ShiftModal from './ShiftModal'
import StatsModal from './StatsModal'
import { createClient } from '../utils/supabase/client'
import { Calendar as CalendarIcon, ArrowDownCircle, BarChart3, CalendarClock, ChevronRight, ChevronLeft } from 'lucide-react'
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
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; shiftType: 'day' | 'night' | 'hashal'; slotIndex: number } | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const todayStr = toIsoDateStr(new Date())
  const todayRef = useRef<HTMLDivElement>(null)

  const thisWeekSunday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const isCurrentWeek = toIsoDateStr(startDate) === toIsoDateStr(thisWeekSunday)

  const assignmentsByDateAndShift = useMemo(() => {
    const dict: Record<string, Record<string, any[]>> = {}
    for (const a of assignments) {
      if (!dict[a.date]) dict[a.date] = { day: [], night: [], hashal: [] }
      if (!dict[a.date][a.shift_type]) dict[a.date][a.shift_type] = []
      dict[a.date][a.shift_type].push(a)
    }
    return dict
  }, [assignments])

  // Calculate Stats for the slim bar
  const stats = useMemo(() => {
    const todayAssignments = assignments.filter(a => a.date === todayStr)
    const base = todayAssignments.length
    const home = initialPeople.length - base
    return { base, home, closed: 3 } // 'closed' is hardcoded as per request example
  }, [assignments, todayStr, initialPeople])

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

  const handleOpenModal = (date: string, shiftType: 'day' | 'night' | 'hashal', slotIndex: number) => {
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
    const role = shiftType === 'hashal' ? { role_name: 'חש"ל', color_code: '#10b981', id: null } : initialRoles.find(r => r.id === roleId)
    if (!person || (shiftType !== 'hashal' && !role)) return

    const newAssignment = {
      date,
      shift_type: shiftType,
      person_id: personId,
      role_id: roleId,
      slot_index: slotIndex,
      person_name: `${person.first_name} ${person.last_name}`,
      person: { first_name: person.first_name, last_name: person.last_name },
      role: role ? { role_name: role.role_name, color_code: role.color_code } : null,
    }

    setIsSavingAssignment(true)
    try {
      const { error } = await supabase
        .from('assignments')
        .upsert(
          {
            date,
            shift_type: shiftType,
            person_id: personId,
            role_id: shiftType === 'hashal' ? null : roleId,
            slot_index: slotIndex
          },
          { onConflict: 'date,shift_type,slot_index' }
        )
      if (error) throw error
      setAssignments(prev => {
        const filtered = prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex))
        return [...filtered, newAssignment]
      })
      setSelectedSlot(null)
      toast.success('המשמרת שובצה בהצלחה')
      router.refresh()
    } catch (error: any) {
      console.error('Full Error Object:', JSON.stringify(error, null, 2))
      console.error('Error Message:', error.message)
      console.error('Error Details:', error.details)
      console.error('Error Hint:', error.hint)
      toast.error(`שגיאה: ${error.message || 'אירעה שגיאה בשיבוץ המשמרת'}`)
    } finally {
      setIsSavingAssignment(false)
    }
  }

  const handleDeleteAssignment = async (date: string, shiftType: 'day' | 'night' | 'hashal', slotIndex: number) => {
    if (!confirm('האם לבטל את השיבוץ?')) return
    const toastId = toast.loading('מבטל שיבוץ...')
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .match({ date, shift_type: shiftType, slot_index: slotIndex })
      if (error) throw error
      setAssignments(prev => prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex)))
      toast.success('השיבוץ בוטל', { id: toastId })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('שגיאה בביטול השיבוץ', { id: toastId })
    }
  }

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

  return (
    <div className="flex flex-col gap-3 md:gap-6 pb-32 relative px-2 md:px-0">
      
      {/* Slim Horizontal Status Bar (Mobile Only) */}
      <div className="flex md:hidden items-center justify-around bg-white border border-slate-100 rounded-xl py-2 px-4 shadow-sm mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sky-500"></div>
          <span className="text-[10px] font-bold text-slate-600">בבסיס: {stats.base}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          <span className="text-[10px] font-bold text-slate-600">בבית: {stats.home}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="text-[10px] font-bold text-slate-600">סגור: {stats.closed}</span>
        </div>
      </div>

      {/* Future week banner */}
      {!isCurrentWeek && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl text-violet-700 text-[10px] md:text-sm font-bold mx-1 md:mx-0">
          <CalendarClock size={14} className="shrink-0" />
          <span>שבוע שאינו הנוכחי</span>
        </div>
      )}

      {/* Floating FAB (Bottom Right) */}
      <div className="fixed bottom-24 right-4 md:bottom-10 md:left-10 flex flex-col gap-3 z-40 items-end">
        <button
          onClick={() => setIsStatsModalOpen(true)}
          className="p-3 bg-sky-600 text-white rounded-full shadow-xl hover:bg-sky-700 transition-all flex items-center gap-2"
        >
          <BarChart3 size={20} />
          <span className="font-bold hidden md:inline text-sm">סטטיסטיקה</span>
        </button>
      </div>

      {weekDays.map((date, idx) => {
        const dateStr = toIsoDateStr(date)
        const isToday = dateStr === todayStr

        return (
          <div
            key={dateStr}
            ref={isToday ? todayRef : null}
            className={`bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border transition-all p-3 md:p-8 scroll-mt-20 ${
              isToday ? 'border-sky-500 ring-2 ring-sky-500/5' : 'border-slate-100'
            }`}
          >
            {/* Compact Date Header */}
            <div className="flex justify-between items-center mb-3 md:mb-8 pb-2 md:pb-8 border-b border-slate-50">
              <div className="flex items-center gap-2 md:gap-4">
                <div className={`w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center ${isToday ? 'bg-sky-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                  <CalendarIcon className="w-4 h-4 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="text-sm md:text-3xl font-black text-slate-800">יום {dayNames[idx]}</h3>
                  <p className="text-[10px] md:text-lg font-bold text-slate-400">{date.getDate()}/{date.getMonth() + 1}</p>
                </div>
              </div>
              {isToday && (
                <div className="px-2 py-0.5 md:px-5 md:py-2 bg-sky-500 text-white rounded-full font-bold text-[9px] md:text-sm uppercase tracking-wider">היום</div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-20">
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

            <ShiftCard
              title="סיור שטח חש״ל"
              timeRange="יומי"
              variant="hashal"
              assignments={assignmentsByDateAndShift[dateStr]?.hashal || []}
              onAssign={slotIndex => handleOpenModal(dateStr, 'hashal', slotIndex)}
              onDelete={slotIndex => handleDeleteAssignment(dateStr, 'hashal', slotIndex)}
            />
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
