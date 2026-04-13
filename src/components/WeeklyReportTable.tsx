'use client'

import { useState } from 'react'
import { MessageSquare, Filter, CheckSquare, Square } from 'lucide-react'
import { generateWhatsAppMessage } from '@/utils/whatsapp'

interface WeeklyReportTableProps {
  assignments: any[]
  statuses: any[]
  roles: any[]
  people: any[]
  startDate: Date
}

export default function WeeklyReportTable({ assignments, statuses, roles, people, startDate }: WeeklyReportTableProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(roles.map(r => r.id))
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

  const getAssignmentsByRole = (dateStr: string, shiftType: 'day' | 'night', roleId: string) => {
    return assignments.filter(
      a => a.date === dateStr && a.shift_type === shiftType && a.role_id === roleId
    )
  }

  const handleWhatsAppExport = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    
    // Filter assignments and statuses to ONLY today for the daily broadcast
    // even though the table shows the whole week.
    const todayAssignments = assignments.filter(a => a.date === todayStr)
    const todayStatuses = statuses.filter(s => s.date === todayStr || !s.date) // Handle potential missing date field if it's already filtered by server

    const message = generateWhatsAppMessage(
      todayStr,
      todayAssignments,
      todayStatuses,
      people,
      roles.filter(r => selectedRoleIds.includes(r.id))
    )

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  const ShiftTable = ({ type, title, icon }: { type: 'day' | 'night', title: string, icon: string }) => {
    const filteredRoles = roles.filter(r => selectedRoleIds.includes(r.id))
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm w-fit">
          <span className="text-4xl">{icon}</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
        </div>

        <div className="overflow-x-auto bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl print:shadow-none print:border-slate-300">
          <table className="w-full text-right border-collapse min-w-[1200px]">
            <thead>
              <tr>
                <th className="p-4 bg-slate-50 border-b-2 border-l-2 border-slate-200 text-slate-400 font-black uppercase text-xs sticky right-0 z-10 w-48 text-center text-center">התפקיד / תאריך</th>
                {weekDays.map((date, idx) => (
                  <th key={idx} className="p-4 bg-slate-50 border-b-2 border-slate-200 text-center">
                    <p className="text-slate-800 font-black text-lg">יום {dayNames[idx]}</p>
                    <p className="text-slate-400 font-bold text-xs">{date.getDate()}/{date.getMonth() + 1}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="group">
                  <td className="p-4 bg-slate-50 border-l-2 border-slate-100 sticky right-0 z-10 group-hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: role.color_code }} />
                      <span className="font-black text-slate-700">{role.role_name}</span>
                    </div>
                  </td>
                  {weekDays.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const roleAssignments = getAssignmentsByRole(dateStr, type, role.id)
                    return (
                      <td key={idx} className="p-4 border-r border-slate-100 text-center group-hover:bg-slate-50 transition-colors bg-white">
                        {roleAssignments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {roleAssignments.map(a => (
                              <p key={a.id} className="font-black text-slate-800 text-sm whitespace-nowrap">
                                {a.person?.first_name} {a.person?.last_name}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-slate-300 font-black text-xl italic">
                    לא נבחרו תפקידים לתצוגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 no-print p-8 bg-slate-50/50 rounded-[2.5rem] border-2 border-slate-100">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <Filter className="text-sky-500" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">סינון והתאמת תצוגה</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {roles.map(role => {
              const isActive = selectedRoleIds.includes(role.id)
              return (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  style={{ 
                    borderColor: isActive ? role.color_code : '#e2e8f0',
                    backgroundColor: isActive ? `${role.color_code}10` : 'transparent',
                    color: isActive ? '#1e293b' : '#94a3b8'
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm border-2 transition-all hover:scale-105 active:scale-95 ${isActive ? 'shadow-sm' : ''}`}
                >
                  <div className={`w-3 h-3 rounded-full ${!isActive && 'grayscale opacity-50'}`} style={{ backgroundColor: role.color_code }} />
                  {role.role_name}
                </button>
              )
            })}
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setSelectedRoleIds(roles.map(r => r.id))}
              className="flex items-center gap-2 text-xs font-black text-sky-600 hover:text-sky-700 underline underline-offset-4"
            >
              <CheckSquare size={14} />
              בחר הכל
            </button>
            <button 
              onClick={() => setSelectedRoleIds([])}
              className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 underline underline-offset-4"
            >
              <Square size={14} />
              נקה הכל
            </button>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-8 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-600 hover:border-slate-300 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          הדפס דו"ח (PDF)
        </button>
        <button 
          onClick={handleWhatsAppExport}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-emerald-100 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          <MessageSquare size={24} strokeWidth={2.5} />
          שידור דו"ח ל-WhatsApp
        </button>
      </div>

      <ShiftTable type="day" title="סיכום משמרות יום" icon="☀️" />
      <ShiftTable type="night" title="סיכום משמרות לילה" icon="🌙" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="p-8 bg-sky-50 rounded-[2rem] border border-sky-100">
          <h4 className="text-lg font-black text-sky-900 mb-2">שימוש בדו"ח</h4>
          <p className="text-sky-700 font-medium">הדו"ח מציג את כלל השיבוצים לשבוע הנוכחי. ניתן להוריד כ-PDF באמצעות פקודת ההדפסה של הדפדפן.</p>
        </div>
        <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
          <h4 className="text-lg font-black text-emerald-900 mb-2">שידור WhatsApp</h4>
          <p className="text-emerald-700 font-medium">לחיצה על כפתור השידור תפתח חלון WhatsApp עם סיכום טקסטואלי של המשמרות והמצבה להיום.</p>
        </div>
        <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
          <h4 className="text-lg font-black text-amber-900 mb-2">מצבת נוכחית</h4>
          <p className="text-amber-700 font-medium">נתוני המצבה בשידור ה-WhatsApp נלקחים מנתוני "מצבת יומית" שהוזנו לאותו היום.</p>
        </div>
      </div>
    </div>
  )
}
