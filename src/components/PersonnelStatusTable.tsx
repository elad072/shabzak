'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase/client'
import { generateWhatsAppMessage } from '@/utils/whatsapp'
import { Check, Info, Home, ShieldX, MapPin, MessageSquare } from 'lucide-react'

interface PersonWithStatus {
  id: string
  first_name: string
  last_name: string
  default_role_id: string
  default_role: string
  status: 'בסיס' | 'בית' | 'סגור'
  is_automated: boolean
}

interface PersonnelStatusTableProps {
  initialPeople: PersonWithStatus[]
  roles: any[]
  people: any[]
  assignments: any[]
  statuses: any[]
  date: string
}

export default function PersonnelStatusTable({ initialPeople, roles, people, assignments, statuses, date }: PersonnelStatusTableProps) {
  const [peopleState, setPeople] = useState(initialPeople)
  const [isSyncing, setIsSyncing] = useState(false)
  const supabase = createClient()

  const handleStatusChange = async (personId: string, newStatus: 'בסיס' | 'בית' | 'סגור') => {
    setPeople(prev => prev.map(p => 
      p.id === personId ? { ...p, status: newStatus, is_automated: false } : p
    ))

    const { error } = await supabase
      .from('daily_status')
      .upsert({
        date,
        person_id: personId,
        status: newStatus,
        is_automated: false,
      }, { onConflict: 'date,person_id' })

    if (error) {
      console.error('Status update error:', error)
    }
  }

  const handleWhatsAppExport = () => {
    const message = generateWhatsAppMessage(
      date,
      assignments,
      statuses,
      people,
      roles
    )

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const handleAutoPopulate = async () => {
    setIsSyncing(true)
    
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('person_id')
      .eq('date', date)

    if (!assignmentsData || assignmentsData.length === 0) {
      alert('לא נמצאו שיבוצים לתאריך זה')
      setIsSyncing(false)
      return
    }

    const uniquePersonIds = Array.from(new Set(assignments.map(a => a.person_id)))

    // 2. Bulk upsert statuses
    const updates = uniquePersonIds.map(id => ({
      date,
      person_id: id,
      status: 'בסיס',
      is_automated: true
    }))

    const { error } = await supabase
      .from('daily_status')
      .upsert(updates, { onConflict: 'date,person_id' })

    if (!error) {
      // 3. Update local state
      setPeople(prev => prev.map(p => {
        if (uniquePersonIds.includes(p.id)) {
          return { ...p, status: 'בסיס', is_automated: true }
        }
        return p
      }))
    }

    setIsSyncing(false)
  }

  const statusConfig = {
    'בסיס': { label: 'בסיס', color: 'bg-sky-500', icon: MapPin },
    'בית': { label: 'בית', color: 'bg-slate-400', icon: Home },
    'סגור': { label: 'סגור', color: 'bg-rose-500', icon: ShieldX },
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
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
          >
            <MessageSquare size={18} strokeWidth={2.5} />
            שידור WhatsApp
          </button>
          <button
            onClick={handleAutoPopulate}
            disabled={isSyncing}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-black text-sm hover:border-slate-300 transition-all"
          >
            {isSyncing ? (
              'מסנכרן...'
            ) : (
              <>
                <Check size={18} />
                סנכרן משיבוצים
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs">
              <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">שם מלא</th>
              <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest text-center">סטטוס נוכחי</th>
              <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest text-center">שינוי סטטוס</th>
              <th className="p-6 text-sm font-black text-slate-400 uppercase tracking-widest">מקור</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {peopleState.map((person) => {
              const role = roles.find(r => r.id === person.default_role_id)
              return (
                <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <p className="text-xl font-black text-slate-800">{person.first_name} {person.last_name}</p>
                    <p className="text-sm font-bold text-slate-400">{role?.role_name || person.default_role || '-'}</p>
                  </td>
                  <td className="p-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-black text-sm ${statusConfig[person.status].color}`}>
                      {person.status}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2">
                      {(['בסיס', 'בית', 'סגור'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(person.id, s)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
                            person.status === s
                              ? `${statusConfig[s].color} border-slate-900/10 text-white shadow-lg`
                              : 'bg-white border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-500'
                          }`}
                          title={statusConfig[s].label}
                        >
                          {person.status === s ? <Check size={20} strokeWidth={4} /> : (() => {
                            const Icon = statusConfig[s].icon
                            return <Icon size={20} />
                          })()}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-6">
                    {person.is_automated ? (
                      <div className="flex items-center gap-2 text-sky-600 font-black text-sm bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 w-fit">
                        <Info size={14} />
                        אוטומטי (משיבוץ)
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs font-bold uppercase">ידני</span>
                    )}
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
