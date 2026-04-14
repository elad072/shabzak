'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { generateWhatsAppMessage } from '@/utils/whatsapp'
import { Check, Info, Home, ShieldX, MapPin, MessageSquare, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

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
      const [statusesResponse, assignmentsResponse] = await Promise.all([
        supabase.from('daily_status').select('*').eq('date', date),
        supabase.from('assignments').select('*, person:people(first_name, last_name)').eq('date', date)
      ])

      const statuses = statusesResponse.data || []
      const assignments = assignmentsResponse.data || []
      setAssignments(assignments)
      const assignedPersonIds = new Set(assignments.map(a => a.person_id))

      const statusLookup: Record<string, any> = {}
      for (const s of statuses) {
        statusLookup[s.person_id] = s
      }

      const mergedPeople = people.map(person => {
        const statusEntry = statusLookup[person.id]
        const hasShift = assignedPersonIds.has(person.id)
        
        let status = statusEntry?.status || null
        let isAutomated = statusEntry?.is_automated || false

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

    const previousPeople = [...peopleState]
    setPeople(prev => prev.map(p => 
      p.id === personId ? { ...p, status: statusToSave, is_automated: false } : p
    ))
    setIsSaving(personId)

    try {
      if (isTogglingOff) {
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
      toast.success('סטטוס עודכן')
    } catch (error) {
      console.error('Status update error:', error)
      setPeople(previousPeople)
      toast.error('שגיאה בשמירת הסטטוס')
    } finally {
      setIsSaving(null)
    }
  }

  const handleManualSync = async () => {
    setIsLoading(true)
    const peopleToSync = peopleState.filter(p => p.status === null && p.has_shift)
    if (peopleToSync.length === 0) {
      toast.error('אין אנשים בלתי מוגדרים עם משמרות לסנכרון')
      setIsLoading(false)
      return
    }

    try {
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
      await fetchData()
      toast.success('הסנכרון הושלם')
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('שגיאה בסנכרון הנתונים')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWhatsAppExport = () => {
    const message = generateWhatsAppMessage(date, assignmentsState, peopleState, roles)
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
    toast.success('דוח וואטסאפ הופק נפתח בחלון חדש')
  }

  const statusConfig = {
    'בסיס': { label: 'בסיס', color: 'bg-sky-500', icon: MapPin },
    'בית': { label: 'בית', color: 'bg-slate-400', icon: Home },
    'סגור': { label: 'סגור', color: 'bg-rose-500', icon: ShieldX },
  }

  const MobileStatusCards = () => (
    <div className="md:hidden space-y-3 p-4 pb-20">
      {peopleState.map((person) => {
        const role = roles.find(r => r.id === person.default_role_id)
        const isCurrentSaving = isSaving === person.id
        
        return (
          <div key={person.id} className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 bg-white flex justify-between items-center gap-3">
              
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="text-[15px] font-black text-slate-800 truncate leading-tight">{person.first_name} {person.last_name}</h4>
                  {person.has_shift && (
                    <Zap size={14} className="text-amber-500 flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400 truncate">{role?.role_name || person.default_role || '-'}</p>
                </div>
              </div>

              <div className="flex gap-1.5 flex-shrink-0 pl-1">
                {(['בסיס', 'בית', 'סגור'] as const).map((s) => {
                  const Icon = statusConfig[s].icon
                  const isActive = person.status === s
                  
                  return (
                    <button
                      key={s}
                      disabled={isCurrentSaving}
                      onClick={() => handleStatusUpdate(person.id, s)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                        isActive
                          ? `${statusConfig[s].color} border-transparent text-white shadow-md scale-105`
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                      } ${isCurrentSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isActive && isCurrentSaving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

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
      <div className="p-5 md:p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-sky-500 rounded-full" />
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">רשימת משרתים</h3>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={handleWhatsAppExport}
            className="flex-1 sm:flex-none text-sm w-full md:w-auto"
            variant="primary"
          >
            <MessageSquare size={18} strokeWidth={2.5} />
            שידור
          </Button>
          <Button
            onClick={handleManualSync}
            className="flex-1 sm:flex-none text-sm gap-2"
            isLoading={isLoading}
            variant="secondary"
          >
            <Zap size={18} className="text-amber-500" />
            סנכרן
          </Button>
        </div>
      </div>

      <MobileStatusCards />

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-black uppercase tracking-widest">
              <th className="p-6 text-sm">שם מלא</th>
              <th className="p-6 text-sm text-center">סטטוס נוכחי</th>
              <th className="p-6 text-sm text-center">שינוי סטטוס</th>
              <th className="p-6 text-sm">מקור</th>
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
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-black text-sm shadow-sm ${statusConfig[person.status].color}`}>
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
                    <div className="flex items-center gap-1 text-sky-600 font-black text-[11px] bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 w-fit uppercase tracking-wider">
                      <Info size={12} />
                      משיבוץ
                    </div>
                  ) : person.status ? (
                    <div className="flex items-center gap-1 text-emerald-600 font-black text-[11px] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit uppercase tracking-wider">
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
  )
}
