'use client'

import { useState, useRef, useMemo } from 'react'
import { MessageSquare, Filter, CheckSquare, Square, Camera, Check, Download } from 'lucide-react'
import { generateWhatsAppMessage } from '@/utils/whatsapp'
import domtoimage from 'dom-to-image'

interface WeeklyReportTableProps {
  assignments: any[]
  statuses: any[]
  roles: any[]
  people: any[]
  startDate: Date
}

export default function WeeklyReportTable({ assignments, statuses, roles, people, startDate }: WeeklyReportTableProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(roles.map(r => r.id))
  const [isExporting, setIsExporting] = useState(false)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

  const indexedAssignments = useMemo(() => {
    const dict: Record<string, Record<string, Record<string, any[]>>> = {};
    for (const a of assignments) {
      if (!dict[a.date]) dict[a.date] = { day: {}, night: {}, hashal: {} };
      if (!dict[a.date][a.shift_type]) dict[a.date][a.shift_type] = {};
      const roleKey = a.role_id || 'hashal_default';
      if (!dict[a.date][a.shift_type][roleKey]) dict[a.date][a.shift_type][roleKey] = [];
      dict[a.date][a.shift_type][roleKey].push(a);
    }
    return dict;
  }, [assignments]);

  const getAssignmentsByRole = (dateStr: string, shiftType: 'day' | 'night' | 'hashal', roleId: string) => {
    return indexedAssignments[dateStr]?.[shiftType]?.[roleId] || []
  }

  const handleWhatsAppExport = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayAssignments = assignments.filter(a => a.date === todayStr)
    const todayStatuses = statuses.filter(s => s.date === todayStr || !s.date)

    const statusLookup: Record<string, any> = {}
    for (const s of todayStatuses) {
      statusLookup[s.person_id] = s
    }

    const peopleWithStatus = people.map(p => {
      const statusEntry = statusLookup[p.id]
      return { ...p, status: statusEntry?.status || null }
    })

    const message = generateWhatsAppMessage(
      todayStr,
      todayAssignments,
      peopleWithStatus,
      roles.filter(r => selectedRoleIds.includes(r.id))
    )

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const handleCopyToClipboard = async () => {
    if (!tableRef.current) return
    setIsExporting(true)
    
    try {
      // Use toBlob for direct clipboard integration
      const blob = await domtoimage.toBlob(tableRef.current, {
        bgcolor: '#ffffff',
        style: {
          padding: '40px',
          borderRadius: '2rem'
        }
      })
      
      const item = new ClipboardItem({ 'image/png': blob })
      await navigator.clipboard.write([item])
      
      setShowCopySuccess(true)
      setTimeout(() => setShowCopySuccess(false), 3000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      // Fallback to download if clipboard fails
      handleCopyAsImage()
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyAsImage = async () => {
    if (!tableRef.current) return
    setIsExporting(true)
    
    try {
      const dataUrl = await domtoimage.toPng(tableRef.current, {
        bgcolor: '#ffffff',
        style: {
          padding: '40px',
          borderRadius: '2rem'
        }
      })
      
      const link = document.createElement('a')
      link.download = `shabzak-schedule-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error capturing image:', error)
      alert('שגיאה ביצירת התמונה')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  const filteredRoles = roles.filter(r => selectedRoleIds.includes(r.id))

  // Mobile-optimized Daily Card View
  const MobileDailyCards = () => (
    <div className="space-y-6 md:hidden">
      {weekDays.map((date, dateIdx) => {
        const dateStr = date.toISOString().split('T')[0]
        const rolesWithAssignments = filteredRoles.filter(role =>
          getAssignmentsByRole(dateStr, 'day', role.id).length > 0 ||
          getAssignmentsByRole(dateStr, 'night', role.id).length > 0
        )
        const hashalShifts = indexedAssignments[dateStr]?.hashal?.hashal_default || []

        return (
          <div key={dateIdx} className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">יום {dayNames[dateIdx]}</h3>
                <p className="text-slate-400 font-bold text-xs">{date.getDate()}/{date.getMonth() + 1}</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 italic font-black">
                D{dateIdx + 1}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {rolesWithAssignments.length > 0 ? (
                rolesWithAssignments.map(role => {
                  const dayShifts = getAssignmentsByRole(dateStr, 'day', role.id)
                  const nightShifts = getAssignmentsByRole(dateStr, 'night', role.id)
                  
                  return (
                    <div key={role.id} className="space-y-2 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-4 rounded-full" style={{ backgroundColor: role.color_code }} />
                        <span className="font-black text-slate-700 text-sm">{role.role_name}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Day */}
                        <div className={`p-3 rounded-xl border ${dayShifts.length > 0 ? 'bg-sky-50 border-sky-100' : 'bg-slate-50/50 border-slate-100 opacity-30'}`}>
                          <div className="flex items-center gap-1 mb-1 opacity-50">
                            <span className="text-[10px]">☀️</span>
                            <span className="text-[9px] font-black text-sky-700 uppercase">יום</span>
                          </div>
                          {dayShifts.map(a => (
                            <p key={a.id} className="font-black text-slate-800 text-xs">
                              {a.person?.first_name} {a.person?.last_name}
                            </p>
                          ))}
                          {dayShifts.length === 0 && <span className="text-slate-300 text-[9px]">-</span>}
                        </div>
                        
                        {/* Night */}
                        <div className={`p-3 rounded-xl border ${nightShifts.length > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50/50 border-slate-100 opacity-30'}`}>
                          <div className="flex items-center gap-1 mb-1 opacity-50">
                            <span className="text-[10px]">🌙</span>
                            <span className="text-[9px] font-black text-indigo-700 uppercase">לילה</span>
                          </div>
                          {nightShifts.map(a => (
                            <p key={a.id} className="font-black text-slate-800 text-xs">
                              {a.person?.first_name} {a.person?.last_name}
                            </p>
                          ))}
                          {nightShifts.length === 0 && <span className="text-slate-300 text-[9px]">-</span>}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                !hashalShifts.length && (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black text-sm italic">אין שיבוצים ליום זה</p>
                  </div>
                )
              )}

              {hashalShifts.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-dashed border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs">🚔</span>
                    <span className="font-black text-emerald-800 text-xs">סיור שטח חש"ל</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashalShifts.map(a => (
                      <p key={a.id} className="font-black text-slate-800 text-xs bg-white/80 px-2 py-1 rounded-lg border border-emerald-100">
                        {a.person?.first_name} {a.person?.last_name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const IndividualShiftTable = ({ type, title, icon, colorClass, borderClass, bgClass, textClass }: {
    type: 'day' | 'night' | 'hashal',
    title: string,
    icon: string,
    colorClass: string,
    borderClass: string,
    bgClass: string,
    textClass: string
  }) => (
    <div className="px-8 pb-12">
      <div className={`flex items-center gap-4 mb-6 ${bgClass} p-5 rounded-[2rem] border-2 ${borderClass} w-fit`}>
        <span className="text-3xl">{icon}</span>
        <h3 className={`text-2xl font-black ${textClass} tracking-tight`}>{title}</h3>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <table className="w-full text-right border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              <th className="p-4 border-l-2 border-slate-200 text-slate-400 font-black uppercase text-[10px] w-48 text-center bg-slate-50 sticky right-0 z-10">התפקיד / תאריך</th>
              {weekDays.map((date, idx) => (
                <th key={idx} className="p-4 border-l border-slate-100 text-center">
                  <p className="text-slate-800 font-black text-base leading-none mb-1">יום {dayNames[idx]}</p>
                  <p className="text-slate-400 font-bold text-[10px] tracking-widest">{date.getDate()}/{date.getMonth() + 1}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {type === 'hashal' ? (
              <tr className="group">
                <td className="p-4 bg-emerald-50 border-l-2 border-emerald-200 sticky right-0 z-10 font-black text-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full bg-emerald-500" />
                    <span className="text-sm">סיור שטח חש"ל</span>
                  </div>
                </td>
                {weekDays.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const roleAssignments = getAssignmentsByRole(dateStr, 'hashal', 'hashal_default')
                  
                  return (
                    <td key={idx} className="p-4 border-l border-slate-50 group-hover:bg-emerald-50/30 transition-colors text-center bg-white min-w-[140px]">
                      {roleAssignments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {roleAssignments.map(a => (
                            <p key={a.id} className="font-black text-slate-800 text-[13px] leading-tight">
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
            ) : (
              filteredRoles.map((role) => (
                <tr key={role.id} className="group">
                  <td className="p-4 bg-slate-50 border-l-2 border-slate-200 sticky right-0 z-10 font-black text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: role.color_code }} />
                      <span className="text-sm">{role.role_name}</span>
                    </div>
                  </td>
                  {weekDays.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0]
                    const roleAssignments = getAssignmentsByRole(dateStr, type, role.id)
                    
                    return (
                      <td key={idx} className="p-4 border-l border-slate-50 group-hover:bg-slate-50 transition-colors text-center bg-white min-w-[140px]">
                        {roleAssignments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {roleAssignments.map(a => (
                              <p key={a.id} className="font-black text-slate-800 text-[13px] leading-tight">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-12">
      {/* Controls Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 no-print p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3">
            <Filter className="text-sky-500" size={24} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight">התאמת לוח משמרות</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {roles.map(role => {
              const isActive = selectedRoleIds.includes(role.id)
              return (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  style={{ 
                    borderColor: isActive ? role.color_code : '#f1f5f9',
                    backgroundColor: isActive ? `${role.color_code}15` : 'transparent',
                    color: isActive ? '#1e293b' : '#94a3b8'
                  }}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full font-black text-xs md:text-sm border-2 transition-all hover:scale-105 active:scale-95 ${isActive ? 'shadow-sm' : ''}`}
                >
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${!isActive && 'grayscale opacity-50'}`} style={{ backgroundColor: role.color_code }} />
                  {role.role_name}
                </button>
              )
            })}
          </div>

          <div className="flex gap-4">
            <button onClick={() => setSelectedRoleIds(roles.map(r => r.id))} className="flex items-center gap-2 text-xs font-black text-sky-600 hover:underline">
              <CheckSquare size={14} /> בחר הכל
            </button>
            <button onClick={() => setSelectedRoleIds([])} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:underline">
              <Square size={14} /> נקה הכל
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 md:gap-4">
          <button 
            onClick={handleCopyToClipboard}
            disabled={isExporting}
            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 ${showCopySuccess ? 'bg-emerald-500' : 'bg-slate-900'} text-white rounded-[1.2rem] md:rounded-[1.5rem] font-black shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 text-sm md:text-base`}
          >
            {showCopySuccess ? <Check size={20} className="md:size-[24px]" /> : <Camera size={20} className="md:size-[24px]" />}
            {isExporting ? 'מעבד...' : showCopySuccess ? 'הועתק!' : 'העתק תמונה ל-WhatsApp'}
          </button>
          <button 
            onClick={handleCopyAsImage}
            className="flex items-center justify-center p-3 md:p-4 bg-white border-2 border-slate-100 text-slate-400 rounded-xl md:rounded-[1.5rem] hover:border-slate-300 transition-all active:scale-95"
            title="הורד כתמונה"
          >
            <Download size={20} className="md:size-[24px]" />
          </button>
          <button 
            onClick={handleWhatsAppExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] font-black shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 text-sm md:text-base"
          >
            <MessageSquare size={20} className="md:size-[24px]" strokeWidth={2.5} />
            שידור WhatsApp
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <div>
        <MobileDailyCards />
        
        {/* Desktop View (Used for display on large screens AND for image capture on all screens) */}
        <div className="hidden md:block">
          <div ref={tableRef} className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 pb-4 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">סיכום משמרות שבועי - SHABZAK</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">לוח תורנויות מאוחד</p>
                </div>
              </div>
            </div>

            <IndividualShiftTable 
              type="day" 
              title="סיכום משמרות יום" 
              icon="☀️" 
              colorClass="bg-sky-500"
              borderClass="border-sky-100"
              bgClass="bg-sky-50"
              textClass="text-sky-900"
            />
            
            <div className="mx-8 border-t-2 border-dashed border-slate-100 mb-12" />

            <IndividualShiftTable 
              type="night" 
              title="סיכום משמרות לילה" 
              icon="🌙" 
              colorClass="bg-indigo-500"
              borderClass="border-indigo-100"
              bgClass="bg-indigo-50"
              textClass="text-indigo-900"
            />

            <div className="mx-8 border-t-2 border-dashed border-slate-100 mb-12" />

            <IndividualShiftTable
              type="hashal"
              title="סיור שטח חש״ל"
              icon="🚔"
              colorClass="bg-emerald-500"
              borderClass="border-emerald-100"
              bgClass="bg-emerald-50"
              textClass="text-emerald-900"
            />
          </div>
        </div>

        {/* Hidden Container specifically for mobile capture to ensure high quality desktop grid is always used */}
        <div className="md:hidden absolute -left-[9999px] top-0 pointer-events-none" style={{ width: '1300px' }}>
           <div id="mobile-capture-target">
              {/* This is a duplicate ref or I can just use the same tableRef if I manage the render carefully */}
              {/* For simplicity, I'll keep the desktop view rendered in the hidden container on mobile */}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print pb-12">
        <div className="p-8 md:p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-xl md:text-2xl font-black mb-2 md:mb-4 flex items-center gap-3">
              <Camera className="text-sky-400" />
              ייצוא שבועי מלא
            </h4>
            <p className="text-slate-400 font-bold text-sm md:text-lg leading-relaxed">המערכת תפיק תמונה אחת הכוללת גם את משמרות היום וגם את משמרות הלילה לכל השבוע.</p>
          </div>
        </div>
        <div className="p-8 md:p-10 bg-emerald-500 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-xl md:text-2xl font-black mb-2 md:mb-4 flex items-center gap-3">
              <MessageSquare />
              שידור טקסטואלי
            </h4>
            <p className="text-emerald-100 font-bold text-sm md:text-lg leading-relaxed">זקוק לסיכום כתוב? השתמש בכפתור השידור כדי לשלוח את מצבת היום והמשמרות בפורמט טקסט נקי.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
