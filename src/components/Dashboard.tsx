'use client'

import { useState, useEffect, useRef } from 'react'
import ShiftCard from './ShiftCard'
import ShiftModal from './ShiftModal'
import StatsModal from './StatsModal'
import { createClient } from '../utils/supabase/client'
import { Calendar as CalendarIcon, ArrowDownCircle, BarChart3 } from 'lucide-react'

interface DashboardProps {
  initialPeople: any[]
  initialAssignments: any[]
  initialRoles: any[]
  startDate: Date
}

export default function Dashboard({ initialPeople, initialAssignments, initialRoles, startDate }: DashboardProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; shiftType: 'day' | 'night'; slotIndex: number } | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  
  const supabase = createClient()
  const todayStr = new Date().toISOString().split('T')[0]
  const todayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to today
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const handleOpenModal = (date: string, shiftType: 'day' | 'night', slotIndex: number) => {
    setSelectedSlot({ date, shiftType, slotIndex })
  }

  const scrollToToday = () => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
      role: { role_name: role.role_name, color_code: role.color_code }
    }

    const { error } = await supabase
      .from('assignments')
      .upsert({
        date,
        shift_type: shiftType,
        person_id: personId,
        role_id: roleId,
        slot_index: slotIndex,
      }, { onConflict: 'date,shift_type,slot_index' })

    if (!error) {
      setAssignments(prev => {
        const filtered = prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex))
        return [...filtered, newAssignment]
      })
      setSelectedSlot(null)
    }
  }

  const handleDeleteAssignment = async (date: string, shiftType: 'day' | 'night', slotIndex: number) => {
    if (!confirm('האם לבטל את השיבוץ?')) return

    const { error } = await supabase
      .from('assignments')
      .delete()
      .match({ date, shift_type: shiftType, slot_index: slotIndex })

    if (!error) {
      setAssignments(prev => prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex)))
    } else {
      alert('שגיאה בביטול השיבוץ')
    }
  }

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

  return (
    <div className="flex flex-col gap-6 pb-20 relative">
      {/* Floating Buttons Container */}
      <div className="fixed bottom-10 left-10 flex flex-col gap-3 z-40 items-end">
        <button 
          onClick={() => setIsStatsModalOpen(true)}
          className="p-4 bg-sky-600 text-white rounded-full shadow-2xl hover:bg-sky-700 transition-all md:flex items-center gap-2"
          title="סטטיסטיקת משמרות"
        >
          <BarChart3 size={24} />
          <span className="font-black hidden md:inline">סטטיסטיקה שבועית</span>
        </button>
        <button 
          onClick={scrollToToday}
          className="p-4 bg-sky-500 text-white rounded-full shadow-2xl hover:bg-sky-600 transition-all animate-bounce md:flex items-center gap-2 hidden"
        >
          <ArrowDownCircle size={24} />
          <span className="font-black">קפוץ להיום</span>
        </button>
      </div>

      {weekDays.map((date, idx) => {
        const dateStr = date.toISOString().split('T')[0]
        const isToday = dateStr === todayStr

        return (
          <div 
            key={dateStr} 
            ref={isToday ? todayRef : null}
            className={`bg-white rounded-[2.5rem] shadow-sm border-2 transition-all p-8 lg:p-10 scroll-mt-20 ${
              isToday ? 'border-sky-500 ring-4 ring-sky-500/10 scale-[1.02] shadow-xl' : 'border-white'
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-50 pb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isToday ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                  <CalendarIcon size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">יום {dayNames[idx]}</h3>
                  <p className="text-lg font-bold text-slate-400 tracking-tight">{date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}</p>
                </div>
              </div>
              {isToday && (
                <div className="px-5 py-2 bg-sky-500 text-white rounded-full font-black text-sm uppercase tracking-widest border border-sky-400 shadow-sm animate-pulse">
                  היום
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <ShiftCard
                title="משמרת יום"
                timeRange="08:30 - 20:30"
                assignments={assignments.filter(a => a.date === dateStr && a.shift_type === 'day')}
                onAssign={(slotIndex) => handleOpenModal(dateStr, 'day', slotIndex)}
                onDelete={(slotIndex) => handleDeleteAssignment(dateStr, 'day', slotIndex)}
              />
              
              <ShiftCard
                title="משמרת לילה"
                timeRange="20:30 - 08:30"
                assignments={assignments.filter(a => a.date === dateStr && a.shift_type === 'night')}
                isNight
                onAssign={(slotIndex) => handleOpenModal(dateStr, 'night', slotIndex)}
                onDelete={(slotIndex) => handleDeleteAssignment(dateStr, 'night', slotIndex)}
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
