'use client'

import { useState } from 'react'
import { X, Check, Search } from 'lucide-react'

interface Role {
  id: string
  role_name: string
  color_code: string
}

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (roleId: string, personId: string) => void
  people: any[]
  roles: Role[]
  date: string
  shiftType: 'day' | 'night'
  initialRoleId?: string | null
  initialPersonId?: string | null
}

export default function ShiftModal({ 
  isOpen, 
  onClose, 
  onSave, 
  people, 
  roles,
  date, 
  shiftType,
  initialRoleId,
  initialPersonId 
}: ShiftModalProps) {
  const [tempRoleId, setTempRoleId] = useState<string | null>(initialRoleId || null)
  const [tempPersonId, setTempPersonId] = useState<string | null>(initialPersonId || null)
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const filteredPeople = people.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-lg max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">ביצוע שיבוץ</h3>
            <p className="text-[10px] md:text-sm font-bold text-slate-500">
              יום {date} | משמרת {shiftType === 'day' ? 'יום' : 'לילה'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-slate-200 rounded-xl md:rounded-2xl transition-all text-slate-400">
            <X size={24} className="md:hidden" strokeWidth={2.5} />
            <X size={32} className="hidden md:block" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Role Selection */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">1. בחר תפקיד</label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setTempRoleId(role.id)}
                  className={`py-3 md:py-4 px-3 md:px-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all border-2 flex items-center justify-center gap-2 ${
                    tempRoleId === role.id 
                      ? `border-slate-900/10 text-white shadow-lg` 
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: tempRoleId === role.id ? role.color_code : undefined }}
                >
                  {tempRoleId === role.id && <Check size={14} className="md:size-4" strokeWidth={4} />}
                  {role.role_name}
                </button>
              ))}
            </div>
          </div>

          {/* Person Selection */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">2. בחר איש צוות</label>
            <div className="relative mb-4">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 md:size-5" size={18} />
              <input
                type="text"
                placeholder="חפש שם..."
                className="w-full pr-10 md:pr-12 pl-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white focus:ring-0 font-bold transition-all outline-none text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[150px] md:max-h-[220px] overflow-y-auto space-y-1 custom-scrollbar pr-1 -mr-1">
              {filteredPeople.map(person => (
                <button
                  key={person.id}
                  onClick={() => setTempPersonId(person.id)}
                  className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl transition-all border-2 ${
                    tempPersonId === person.id
                      ? 'bg-sky-50 border-sky-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="text-right">
                    <p className={`text-base md:text-lg font-black ${tempPersonId === person.id ? 'text-sky-700' : 'text-slate-800'}`}>
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="text-[9px] md:text-xs font-bold text-slate-400">
                      {roles.find(r => r.id === person.default_role_id)?.role_name || person.default_role || '-'}
                    </p>
                  </div>
                  {tempPersonId === person.id && (
                    <Check className="text-sky-600 md:size-6" size={20} strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => tempRoleId && tempPersonId && onSave(tempRoleId, tempPersonId)}
            disabled={!tempRoleId || !tempPersonId}
            className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-xl font-black transition-all flex items-center justify-center gap-2 md:gap-3 ${
              tempRoleId && tempPersonId
                ? 'bg-slate-900 border-b-4 border-slate-950 text-white shadow-xl hover:-translate-y-1 active:translate-y-0 active:border-b-0'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Check size={24} className="md:size-7" strokeWidth={3} />
            שבץ משמרת
          </button>
        </div>
      </div>
    </div>
  )
}
