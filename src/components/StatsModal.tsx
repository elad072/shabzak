'use client'

import { X, BarChart3, TrendingUp, User, Share2 } from 'lucide-react'

interface Person {
  id: string
  first_name: string
  last_name: string
}

interface Assignment {
  person_id: string
}

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  people: Person[]
  assignments: Assignment[]
}

export default function StatsModal({ isOpen, onClose, people, assignments }: StatsModalProps) {
  if (!isOpen) return null

  // Calculate stats: shifts per person
  const personStats = people.map(person => {
    const shiftCount = assignments.filter(a => a.person_id === person.id).length
    return {
      ...person,
      shiftCount
    }
  }).sort((a, b) => b.shiftCount - a.shiftCount)

  const totalShifts = assignments.length
  const topPerformer = personStats[0]

  const getColorClasses = (count: number) => {
    if (count >= 3) return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-500', label: 'מצטיין' }
    if (count === 2) return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', iconBg: 'bg-amber-500', label: 'פעיל' }
    if (count === 1) return { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-500', label: 'מינימום' }
    return { bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-400', iconBg: 'bg-slate-100', label: '-' }
  }

  const handleWhatsAppShare = () => {
    let message = `📊 *סיכום משמרות שבועי*\n`
    message += `──────────────────\n`
    personStats.filter(p => p.shiftCount > 0).forEach(p => {
      const emoji = p.shiftCount >= 3 ? '✅' : p.shiftCount === 2 ? '⚠️' : '🚨'
      message += `${emoji} ${p.first_name} ${p.last_name}: *${p.shiftCount}* משמרות\n`
    })
    message += `──────────────────\n`
    message += `סה"כ משמרות מאוישות: *${totalShifts}*`
    
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
              <BarChart3 size={20} className="md:hidden" />
              <BarChart3 size={24} className="hidden md:block" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">סטטיסטיקת משמרות</h3>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">סיכום עומסים ופירוט שמי</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl hover:bg-slate-200 text-slate-400 transition-all active:scale-95"
          >
            <X size={24} className="md:hidden" strokeWidth={2.5} />
            <X size={28} className="hidden md:block" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100">
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">סה"כ משמרות</p>
              <p className="text-2xl md:text-3xl font-black text-slate-800">{totalShifts}</p>
            </div>
            <div className="p-4 md:p-6 bg-sky-50 rounded-[1.5rem] md:rounded-[2rem] border border-sky-100">
              <p className="text-[10px] md:text-xs font-black text-sky-400 uppercase tracking-widest mb-1">הכי הרבה השבוע</p>
              <p className="text-sm md:text-xl font-black text-sky-900 truncate">
                {topPerformer && topPerformer.shiftCount > 0 
                  ? `${topPerformer.first_name} (${topPerformer.shiftCount})` 
                  : '-'}
              </p>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4 pr-1">
            <h4 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">פירוט שמי</h4>
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {personStats.map(person => {
                const colors = getColorClasses(person.shiftCount)
                return (
                  <div 
                    key={person.id} 
                    className={`flex items-center justify-between p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border transition-all ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white ${colors.iconBg}`}>
                        <User size={16} className="md:hidden" />
                        <User size={18} className="hidden md:block" />
                      </div>
                      <div>
                        <p className={`text-sm md:text-base font-black ${person.shiftCount > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                          {person.first_name} {person.last_name}
                        </p>
                        {person.shiftCount > 0 && (
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 ${colors.text}`}>
                            <TrendingUp size={9} className="md:size-10" />
                            {colors.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg md:text-2xl font-black ${person.shiftCount > 0 ? 'text-slate-800' : 'text-slate-200'}`}>
                        {person.shiftCount}
                      </span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-tight">משמרות</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:p-8 bg-slate-50 border-t border-slate-100 flex gap-3 md:gap-4 flex-shrink-0">
          <button 
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
          >
            <Share2 size={18} className="md:hidden" />
            <Share2 size={24} className="hidden md:block" />
            שידור WhatsApp
          </button>
          <button 
            onClick={onClose}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:border-slate-300 transition-all active:scale-95"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
