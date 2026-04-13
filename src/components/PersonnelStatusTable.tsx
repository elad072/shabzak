'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { generateWhatsAppMessage } from '@/utils/whatsapp'
import { Check, Info, Home, ShieldX, MapPin, MessageSquare, Loader2, Zap } from 'lucide-react'

interface PersonWithStatus {
  id: string
  first_name: string
  last_name: string
  default_role_id: string
  default_role: string
  status: 'בסיס' | 'בית' | 'סגור' | null
  is_automated: boolean
  has_shift: boolean
}

interface PersonnelStatusTableProps {
  roles: any[]
  people: any[]
  date: string
}

export default function PersonnelStatusTable({ roles, people, date }: PersonnelStatusTableProps) {
  const [peopleState, setPeople] = useState<PersonWithStatus[]>([])
  const [assignmentsState, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch statuses and assignments in parallel
      const [statusesResponse, assignmentsResponse] = await Promise.all([
        supabase.from('daily_status').select('*').eq('date', date),
        supabase.from('assignments').select('*, person:people(first_name, last_name)').eq('date', date)
      ])

      const statuses = statusesResponse.data || []
      const assignments = assignmentsResponse.data || []
      setAssignments(assignments)
      const assignedPersonIds = new Set(assignments.map(a => a.person_id))

      // Merge data
      const mergedPeople = people.map(person => {
        const statusEntry = statuses.find(s => s.person_id === person.id)
        const hasShift = assignedPersonIds.has(person.id)
        
        let status = statusEntry?.status || null
        let isAutomated = statusEntry?.is_automated || false

        // Automatic logic: If no manual status and has shift -> 'בסיס'
        if (!statusEntry && hasShift) {
          status = 'בסיס'
          isAutomated = true
        }

        return {
          ...person,
          status,
          is_automated: isAutomated,
          has_shift: hasShift
        }
      })

      setPeople(mergedPeople)
    } catch (error) {
      console.error('Error fetching status data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [date, people, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusUpdate = async (personId: string, newStatus: 'בסיס' | 'בית' | 'סגור') => {
    const person = peopleState.find(p => p.id === personId)
    const isTogglingOff = person?.status === newStatus
    const statusToSave = isTogglingOff ? null : newStatus

    // Optimistic Update
    const previousPeople = [...peopleState]
    setPeople(prev => prev.map(p => 
      p.id === personId ? { ...p, status: statusToSave, is_automated: false } : p
    ))
    setIsSaving(personId)

    try {
      if (isTogglingOff) {
        // If toggling off, we can either delete the row or set status to null
        // Let's set it to null or delete it to keep DB clean
        const { error } = await supabase
          .from('daily_status')
          .delete()
          .match({ date, person_id: personId })

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('daily_status')
          .upsert({
            date,
            person_id: personId,
            status: newStatus,
            is_automated: false,
          }, { onConflict: 'date,person_id' })

        if (error) throw error
      }
    } catch (error) {
      console.error('Status update error:', error)
      setPeople(previousPeople) // Rollback on error
      alert('שגיאה בשמירת הסטטוס')
    } finally {
      setIsSaving(null)
    }
  }

  const handleManualSync = async () => {
    setIsLoading(true)
    try {
      // Find people who are currently 'null' but have a shift
      const peopleToSync = peopleState.filter(p => p.status === null && p.has_shift)
      
      if (peopleToSync.length === 0) {
        alert('אין אנשים בלתי מוגדרים עם משמרות לסנכרון')
        return
      }

      const updates = peopleToSync.map(p => ({
        date,
        person_id: p.id,
        status: 'בסיס' as const,
        is_automated: true
      }))

      const { error } = await supabase
        .from('daily_status')
        .upsert(updates, { onConflict: 'date,person_id' })

      if (error) throw error
      
      // Refresh local data
      await fetchData()
    } catch (error) {
      console.error('Sync error:', error)
      alert('שגיאה בסנכרון הנתונים')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWhatsAppExport = () => {
    // We need to pass the current state to the message generator
    const message = generateWhatsAppMessage(
      date,
      assignmentsState,
      peopleState, // Pass the merged state
      roles
    )

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const statusConfig = {
    'בסיס': { label: 'בסיס', color: 'bg-sky-500', icon: MapPin },
    'בית': { label: 'בית', color: 'bg-slate-400', icon: Home },
    'סגור': { label: 'סגור', color: 'bg-rose-500', icon: ShieldX },
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-sky-500" size={48} />
        <p className="text-slate-400 font-bold">טוען נתונים...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-sky-500 rounded-full" />
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">רשימת משרתים</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleWhatsAppExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100/50 active:scale-95"
          >
            <MessageSquare size={18} strokeWidth={2.5} />
            שידור WhatsApp
          </button>
          <button
            onClick={handleManualSync}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-black text-sm hover:border-slate-300 transition-all active:scale-95"
          >
            <Zap size={18} className="text-amber-500" />
            סנכרן משיבוצים
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 md:mx-0">
        <div className="min-w-[800px] md:min-w-full">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-black uppercase tracking-widest">
                <th className="p-4 md:p-6 text-sm">שם מלא</th>
                <th className="p-4 md:p-6 text-sm text-center">סטטוס נוכחי</th>
                <th className="p-4 md:p-6 text-sm text-center">שינוי סטטוס</th>
                <th className="p-4 md:p-6 text-sm">מקור</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
            {peopleState.map((person) => {
              const role = roles.find(r => r.id === person.default_role_id)
              const isCurrentSaving = isSaving === person.id
              
              return (
                <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xl font-black text-slate-800">{person.first_name} {person.last_name}</p>
                        <p className="text-sm font-bold text-slate-400">{role?.role_name || person.default_role || '-'}</p>
                      </div>
                      {person.has_shift && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 uppercase tracking-tighter">
                          <Zap size={10} fill="currentColor" />
                          משמרת
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {person.status ? (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-black text-sm shadow-sm ${statusConfig[person.status].color} animate-in fade-in zoom-in duration-300`}>
                        {statusConfig[person.status].label}
                      </div>
                    ) : (
                      <span className="text-slate-200 font-bold text-sm">טרם הוגדר</span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                       {(['בסיס', 'בית', 'סגור'] as const).map((s) => (
                        <button
                          key={s}
                          disabled={isCurrentSaving}
                          onClick={() => handleStatusUpdate(person.id, s)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 relative ${
                            person.status === s
                              ? `${statusConfig[s].color} border-transparent text-white shadow-md scale-105 z-10`
                              : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50'
                          } ${isCurrentSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={statusConfig[s].label}
                        >
                          {person.status === s ? (
                            isCurrentSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={4} />
                          ) : (() => {
                            const Icon = statusConfig[s].icon
                            return <Icon size={20} />
                          })()}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-6">
                    {person.is_automated ? (
                      <div className="flex items-center gap-2 text-sky-600 font-black text-[11px] bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 w-fit uppercase tracking-wider">
                        <Info size={12} />
                        משיבוץ
                      </div>
                    ) : person.status ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit uppercase tracking-wider">
                        <Check size={12} />
                        ידני
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)
}

