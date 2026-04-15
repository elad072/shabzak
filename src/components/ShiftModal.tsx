'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check, Search, User, ArrowRight } from 'lucide-react'
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
  shiftType: 'day' | 'night' | 'hashal'
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSearchQuery('')
      // Focus the input field when the modal opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handlePersonSelect = (person: any) => {
    setTempPersonId(person.id)
    const defaultRoleId = person.default_role_id
    if (defaultRoleId) {
      setTempRoleId(defaultRoleId)
    }
    setTimeout(() => setStep(2), 200)
  }

  if (!isOpen) return null

  const filteredPeople = people.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedPerson = people.find(p => p.id === tempPersonId)

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-md h-auto max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300 flex flex-col">
        
        {/* Header */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"
              >
                <ArrowRight size={16} strokeWidth={3} />
              </button>
            )}
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                {step === 1 ? 'בחירת איש צוות' : 'וידוא תפקיד'}
              </h3>
              <p className="text-[10px] font-medium text-slate-500">
                {date} • {shiftType === 'day' ? 'משמרת יום' : shiftType === 'night' ? 'משמרת לילה' : 'סיור שטח חש"ל'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-50 flex flex-shrink-0">
          <div className={`h-full bg-sky-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative min-h-[300px] md:min-h-[400px]">
          
          {/* Step 1: Person Selection */}
          <div className={`absolute inset-0 p-4 flex flex-col space-y-3 transition-all duration-300 ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
            <div className="relative flex-shrink-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                ref={inputRef}
                type="text"
                placeholder="חפש שם..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white transition-all outline-none font-bold text-slate-700 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1.5 pb-4">
              {filteredPeople.map(person => (
                <button
                  key={person.id}
                  onClick={() => handlePersonSelect(person)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                    tempPersonId === person.id
                      ? 'bg-sky-50 border-sky-200'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tempPersonId === person.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={16} />
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tempPersonId === person.id ? 'text-sky-900' : 'text-slate-800'}`}>
                        {person.first_name} {person.last_name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {roles.find(r => r.id === person.default_role_id)?.role_name || 'ללא תפקיד מוגדר'}
                      </p>
                    </div>
                  </div>
                  {tempPersonId === person.id && <Check className="text-sky-600" size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Role Selection */}
          <div className={`absolute inset-0 p-4 flex flex-col space-y-4 transition-all duration-300 ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
            {selectedPerson && (
              <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 border border-slate-100 flex-shrink-0">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-sky-500 shadow-sm">
                  <User size={18} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{selectedPerson.first_name} {selectedPerson.last_name}</p>
                  <p className="text-[10px] font-medium text-slate-500">נבחר לשיבוץ</p>
                </div>
              </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-1">בחר תפקיד</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setTempRoleId(role.id)}
                    className={`h-11 px-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-center text-center leading-tight ${
                      tempRoleId === role.id 
                        ? `border-transparent text-white shadow-sm` 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                    style={{ backgroundColor: tempRoleId === role.id ? role.color_code : undefined }}
                  >
                    <span className="truncate">{role.role_name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 md:px-6 md:py-5 bg-white border-t border-slate-50 flex-shrink-0">
          {step === 1 ? (
            <div className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              שלב 1 מתוך 2
            </div>
          ) : (
            <Button
              onClick={() => tempRoleId && tempPersonId && onSave(tempRoleId, tempPersonId)}
              disabled={!tempRoleId || !tempPersonId}
              isLoading={isSaving}
              className="w-full py-2.5 rounded-xl text-sm md:text-base font-bold shadow-lg shadow-sky-100"
              variant="primary"
            >
              <Check size={18} className="ml-2" strokeWidth={3} />
              שבץ עכשיו
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
