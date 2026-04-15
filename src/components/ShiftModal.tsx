'use client'

import { useState, useEffect } from 'react'
import { X, Check, Search, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Role {
  id: string
  role_name: string
  color_code: string
}

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (roleId: string, personId: string) => void
  isSaving?: boolean
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
  isSaving = false,
  people, 
  roles,
  date, 
  shiftType,
  initialRoleId,
  initialPersonId 
}: ShiftModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [tempRoleId, setTempRoleId] = useState<string | null>(initialRoleId || null)
  const [tempPersonId, setTempPersonId] = useState<string | null>(initialPersonId || null)
  const [searchQuery, setSearchQuery] = useState('')

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSearchQuery('')
    }
  }, [isOpen])

  const handlePersonSelect = (person: any) => {
    setTempPersonId(person.id)
    const defaultRoleId = person.default_role_id
    if (defaultRoleId) {
      setTempRoleId(defaultRoleId)
    }
    // Move to next step automatically after selection
    setTimeout(() => setStep(2), 300)
  }

  if (!isOpen) return null

  const filteredPeople = people.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedPerson = people.find(p => p.id === tempPersonId)

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-lg h-[85vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"
              >
                <ArrowRight size={18} strokeWidth={3} />
              </button>
            )}
            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                {step === 1 ? 'בחירת איש צוות' : 'וידוא תפקיד'}
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-slate-400">
                {date} • {shiftType === 'day' ? 'משמרת יום' : 'משמרת לילה'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-50 flex">
          <div className={`h-full bg-sky-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>

        {/* Content */}
        <div className="p-5 md:p-8 flex-1 overflow-hidden relative">
          
          {/* Step 1: Person Selection */}
          <div className={`h-full flex flex-col space-y-4 transition-all duration-300 ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none absolute inset-0 p-5 md:p-8'}`}>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="חפש שם..."
                className="w-full pr-12 pl-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white transition-all outline-none font-bold text-slate-700 text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {filteredPeople.map(person => (
                <button
                  key={person.id}
                  onClick={() => handlePersonSelect(person)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                    tempPersonId === person.id
                      ? 'bg-sky-50 border-sky-200'
                      : 'bg-white border-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tempPersonId === person.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={20} />
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${tempPersonId === person.id ? 'text-sky-900' : 'text-slate-800'}`}>
                        {person.first_name} {person.last_name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {roles.find(r => r.id === person.default_role_id)?.role_name || 'ללא תפקיד מוגדר'}
                      </p>
                    </div>
                  </div>
                  {tempPersonId === person.id && <Check className="text-sky-600" size={20} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Role Selection */}
          <div className={`h-full flex flex-col space-y-6 transition-all duration-300 ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none absolute inset-0 p-5 md:p-8'}`}>
            {selectedPerson && (
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-sky-500 shadow-sm">
                  <User size={24} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-800">{selectedPerson.first_name} {selectedPerson.last_name}</p>
                  <p className="text-xs font-bold text-slate-400">נבחר לשיבוץ</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-1">בחר תפקיד למשמרת</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setTempRoleId(role.id)}
                    className={`py-4 px-4 rounded-2xl font-black text-xs md:text-sm transition-all border-2 flex items-center justify-center gap-2 ${
                      tempRoleId === role.id 
                        ? `border-transparent text-white shadow-lg scale-[1.02]` 
                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                    }`}
                    style={{ backgroundColor: tempRoleId === role.id ? role.color_code : undefined }}
                  >
                    {role.role_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 md:p-8 bg-white border-t border-slate-50 flex-shrink-0">
          {step === 1 ? (
            <div className="text-center text-xs font-bold text-slate-400">
              בחר איש צוות כדי להמשיך
            </div>
          ) : (
            <Button
              onClick={() => tempRoleId && tempPersonId && onSave(tempRoleId, tempPersonId)}
              disabled={!tempRoleId || !tempPersonId}
              isLoading={isSaving}
              className="w-full py-5 md:py-6 rounded-2xl text-xl font-black shadow-xl shadow-sky-100"
              variant="primary"
            >
              <Check size={24} className="ml-2" strokeWidth={3} />
              שבץ עכשיו
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
