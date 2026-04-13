'use client'

import { useState } from 'react'
import ShiftCard from './ShiftCard'
import { createClient } from '../utils/supabase/client'
import { X, Check, Search, Calendar as CalendarIcon } from 'lucide-react'

type Role = 'מפקד משמרת' | 'קצין התגננות' | 'סמב"צ' | 'חפיפה'

interface DashboardProps {
  initialPeople: any[]
  initialAssignments: any[]
  startDate: Date
}

export default function Dashboard({ initialPeople, initialAssignments, startDate }: DashboardProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; shiftType: 'day' | 'night'; slotIndex: number } | null>(null)
  
  // Selection states for modal
  const [tempRole, setTempRole] = useState<Role | null>(null)
  const [tempPersonId, setTempPersonId] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  // When opening modal for an existing assignment, pre-fill data
  const handleOpenModal = (date: string, shiftType: 'day' | 'night', slotIndex: number) => {
    const existing = assignments.find(a => a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex)
    if (existing) {
      setTempRole(existing.assigned_role as Role)
      setTempPersonId(existing.person_id)
    } else {
      setTempRole(null)
      setTempPersonId(null)
    }
    setSelectedSlot({ date, shiftType, slotIndex })
  }

  const handleCloseModal = () => {
    setSelectedSlot(null)
    setTempRole(null)
    setTempPersonId(null)
    setSearchQuery('')
  }

  const handleAssign = async () => {
    if (!selectedSlot || !tempRole || !tempPersonId) return

    const { date, shiftType, slotIndex } = selectedSlot
    const person = initialPeople.find(p => p.id === tempPersonId)
    if (!person) return

    const newAssignment = {
      date,
      shift_type: shiftType,
      person_id: tempPersonId,
      assigned_role: tempRole,
      slot_index: slotIndex,
      person: { first_name: person.first_name, last_name: person.last_name }
    }

    const { error } = await supabase
      .from('assignments')
      .upsert({
        date,
        shift_type: shiftType,
        person_id: tempPersonId,
        assigned_role: tempRole,
        slot_index: slotIndex,
      }, { onConflict: 'date,shift_type,slot_index' })

    if (error) {
      console.error('Upsert error:', error)
      alert('שגיאה בשמירת השיבוץ: ' + error.message)
    } else {
      setAssignments(prev => {
        const filtered = prev.filter(a => !(a.date === date && a.shift_type === shiftType && a.slot_index === slotIndex))
        return [...filtered, newAssignment]
      })
      handleCloseModal()
    }
  }

  const filteredPeople = initialPeople.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const roleOptions: Role[] = ['מפקד משמרת', 'קצין התגננות', 'סמב"צ', 'חפיפה']

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 xl:gap-2">
        {weekDays.map((date, idx) => {
          const dateStr = date.toISOString().split('T')[0]
          return (
            <div key={dateStr} className="flex flex-col gap-4">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                <CalendarIcon size={16} className="text-sky-500" />
                <span className="text-md font-black text-slate-700">יום {dayNames[idx]}</span>
                <span className="text-xs font-bold text-slate-400">({date.getDate()}/{date.getMonth() + 1})</span>
              </div>
              
              <div className="space-y-4">
                <ShiftCard
                  title="משמרת יום"
                  timeRange="08:30 - 20:30"
                  assignments={assignments.filter(a => a.date === dateStr && a.shift_type === 'day')}
                  onAssign={(role, slotIndex) => handleOpenModal(dateStr, 'day', slotIndex)}
                />
                <ShiftCard
                  title="משמרת לילה"
                  timeRange="20:30 - 08:30"
                  assignments={assignments.filter(a => a.date === dateStr && a.shift_type === 'night')}
                  isNight
                  onAssign={(role, slotIndex) => handleOpenModal(dateStr, 'night', slotIndex)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">ביצוע שיבוץ</h3>
                <p className="text-sm font-bold text-slate-500">{selectedSlot.date} | {selectedSlot.shiftType === 'day' ? 'יום' : 'לילה'}</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={32} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Step 1: Select Role */}
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">1. בחר תפקיד</label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map(role => (
                    <button
                      key={role}
                      onClick={() => setTempRole(role)}
                      className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                        tempRole === role 
                          ? 'bg-sky-500 border-sky-600 text-white shadow-lg shadow-sky-100' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Person */}
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">2. בחר איש צוות</label>
                <div className="relative mb-4">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="חפש שם..."
                    className="w-full pr-12 pl-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white focus:ring-0 font-bold transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-[250px] overflow-y-auto space-y-1 custom-scrollbar pr-1 -mr-1">
                  {filteredPeople.map(person => (
                    <button
                      key={person.id}
                      onClick={() => setTempPersonId(person.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                        tempPersonId === person.id
                          ? 'bg-sky-50 border-sky-200 ring-2 ring-sky-500/20'
                          : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-right">
                        <p className={`text-lg font-black ${tempPersonId === person.id ? 'text-sky-700' : 'text-slate-800'}`}>
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-xs font-bold text-slate-400">{person.default_role}</p>
                      </div>
                      {tempPersonId === person.id && (
                        <Check className="text-sky-600" size={24} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAssign}
                disabled={!tempRole || !tempPersonId}
                className={`w-full py-5 rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3 ${
                  tempRole && tempPersonId
                    ? 'bg-slate-900 border-b-4 border-slate-950 text-white hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0 active:border-b-0'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Check size={28} />
                שבץ משמרת
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
