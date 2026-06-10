'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase/client'
import { UserPlus, Edit2, Trash2, X, Check, Phone, Shield, Search, LayoutGrid, List, ArrowUpDown, Users, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Layers, FileSpreadsheet } from 'lucide-react'
import { exportPeopleToExcel } from '../utils/excelExport'

interface Person {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  default_role_id: string | null
  default_role?: string
  is_standard: boolean
  rank: string | null
}

interface Role {
  id: string
  role_name: string
  rank: string | null
  teken: string | null
  teken_quantity: number | null
  color_code?: string
}

export default function PeopleClient({ initialPeople, roles }: { initialPeople: Person[], roles: Role[] }) {
  const [people, setPeople] = useState(initialPeople)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'accordion'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'standard'>('name')
  const [expandedRoles, setExpandedRoles] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    default_role_id: roles.length > 0 ? roles[0].id : '',
    is_standard: true,
    rank: ''
  })

  const supabase = createClient()

  const openModal = (person?: Person) => {
    if (person) {
      setEditingPerson(person)
      setFormData({
        first_name: person.first_name,
        last_name: person.last_name,
        phone: person.phone || '',
        default_role_id: person.default_role_id || (roles.length > 0 ? roles[0].id : ''),
        is_standard: person.is_standard ?? true,
        rank: person.rank || ''
      })
    } else {
      setEditingPerson(null)
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        default_role_id: roles.length > 0 ? roles[0].id : '',
        is_standard: true,
        rank: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation for role slots
    if (formData.is_standard && formData.default_role_id) {
      const selectedRole = roles.find(r => r.id === formData.default_role_id)
      if (selectedRole && selectedRole.teken_quantity && selectedRole.teken_quantity > 0) {
        const peopleInRole = people.filter(p =>
          p.default_role_id === formData.default_role_id &&
          p.is_standard &&
          p.id !== editingPerson?.id
        ).length
        
        if (peopleInRole >= selectedRole.teken_quantity) {
          alert(`לא ניתן לשבץ יותר מ-${selectedRole.teken_quantity} אנשים בתקן עבור תפקיד זה (${selectedRole.role_name})`)
          return
        }
      }
    }
    
    if (editingPerson) {
      const { data, error } = await supabase
        .from('people')
        .update(formData)
        .eq('id', editingPerson.id)
        .select()
      
      if (!error && data && data.length > 0) {
        setPeople(prev => prev.map(p => p.id === editingPerson.id ? data[0] : p))
        setIsModalOpen(false)
      }
    } else {
      const { data, error } = await supabase
        .from('people')
        .insert([formData])
        .select()
      
      if (!error && data && data.length > 0) {
        setPeople(prev => [...prev, data[0]])
        setIsModalOpen(false)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק איש צוות זה?')) return
    
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setPeople(prev => prev.filter(p => p.id !== id))
    }
  }

  const toggleRoleAccordion = (roleId: string) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  const filteredPeople = people.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || (p.phone && p.phone.includes(query))
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    }
    if (sortBy === 'role') {
      const roleA = roles.find(r => r.id === a.default_role_id)?.role_name || ''
      const roleB = roles.find(r => r.id === b.default_role_id)?.role_name || ''
      return roleA.localeCompare(roleB)
    }
    if (sortBy === 'standard') {
      return (a.is_standard === b.is_standard) ? 0 : a.is_standard ? -1 : 1
    }
    return 0
  })

  const stats = {
    total: people.length,
    standard: people.filter(p => p.is_standard).length,
    nonStandard: people.filter(p => !p.is_standard).length,
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Users className="text-sky-500 mb-2" size={24} />
          <span className="text-2xl md:text-3xl font-black text-slate-800">{stats.total}</span>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">סה"כ צוות</span>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <ShieldCheck className="text-emerald-500 mb-2" size={24} />
          <span className="text-2xl md:text-3xl font-black text-slate-800">{stats.standard}</span>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">בתקן</span>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <ShieldAlert className="text-amber-500 mb-2" size={24} />
          <span className="text-2xl md:text-3xl font-black text-slate-800">{stats.nonStandard}</span>
          <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">על תקני</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 order-2 md:order-1">
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 border-b-4 border-sky-600 text-white rounded-xl text-sm font-bold hover:bg-sky-400 transition-all active:translate-y-0 active:border-b-0 whitespace-nowrap"
          >
            <UserPlus size={18} />
            הוסף איש צוות
          </button>

          <button
            onClick={() => exportPeopleToExcel(people, roles)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 border-b-4 border-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all active:translate-y-0 active:border-b-0 whitespace-nowrap"
            title="ייצוא לאקסל"
          >
            <FileSpreadsheet size={18} />
            ייצוא לאקסל
          </button>
          
          <div className="h-10 w-px bg-slate-100 hidden md:block mx-2" />
          
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => setViewMode('grid')}
              title="תצוגת כרטיסים"
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="תצוגת רשימה"
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('accordion')}
              title="תצוגת תקנים"
              className={`p-2 rounded-lg transition-all ${viewMode === 'accordion' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Layers size={20} />
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 pr-10 py-2.5 text-sm font-bold text-slate-600 outline-none focus:border-sky-500 transition-all"
            >
              <option value="name">מיון לפי שם</option>
              <option value="role">מיון לפי תפקיד</option>
              <option value="standard">מיון לפי תקן</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="relative flex-1 max-w-full md:max-w-md order-1 md:order-2">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="חיפוש לפי שם או טלפון..."
            className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white border-2 border-slate-100 focus:border-sky-500 outline-none font-bold transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredPeople.map(person => {
            const role = roles.find(r => r.id === person.default_role_id)
            const roleName = role?.role_name || person.default_role || '-'
            return (
              <div key={person.id} className={`glass-card flex flex-col justify-between group border p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all ${person.is_standard ? 'bg-white border-slate-100' : 'bg-amber-50/50 border-amber-200'}`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${person.is_standard ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                      <span className="text-xl font-black">{(person.first_name?.[0] || '')}{(person.last_name?.[0] || '')}</span>
                    </div>
                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(person)} className="p-3 md:p-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-all shadow-sm md:shadow-none">
                        <Edit2 className="w-5 h-5 md:w-4.5 md:h-4.5" />
                      </button>
                      <button onClick={() => handleDelete(person.id)} className="p-3 md:p-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm md:shadow-none">
                        <Trash2 className="w-5 h-5 md:w-4.5 md:h-4.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      {person.rank && <span className="text-xs font-bold text-sky-600 mb-0.5">{person.rank}</span>}
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        {person.first_name} {person.last_name}
                      </h3>
                    </div>
                    {!person.is_standard && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-lg uppercase tracking-wider">
                        על תקני
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Shield size={16} className="text-sky-500" />
                      <div className="flex flex-col">
                        <span className="font-bold">{roleName}</span>
                        {role?.teken && <span className="text-xs text-slate-400">תקן: {role.teken}</span>}
                      </div>
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Phone size={16} className="text-slate-400" />
                        <span dir="ltr">{person.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-widest">
                  <th className="p-4 md:p-6">איש צוות</th>
                  <th className="p-4 md:p-6">תפקיד</th>
                  <th className="p-4 md:p-6">טלפון</th>
                  <th className="p-4 md:p-6">סטטוס</th>
                  <th className="p-4 md:p-6 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPeople.map(person => {
                  const role = roles.find(r => r.id === person.default_role_id)
                  return (
                    <tr key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 md:p-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${person.is_standard ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                            <span className="text-sm font-black">{(person.first_name?.[0] || '')}{(person.last_name?.[0] || '')}</span>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm md:text-base">{person.first_name} {person.last_name}</p>
                            {person.rank && <p className="text-[10px] font-bold text-sky-600">{person.rank}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm">{role?.role_name || '-'}</span>
                          {role?.teken && <span className="text-[10px] text-slate-400">תקן: {role.teken}</span>}
                        </div>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className="text-sm font-medium text-slate-500" dir="ltr">{person.phone || '-'}</span>
                      </td>
                      <td className="p-4 md:p-6">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${person.is_standard ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {person.is_standard ? 'בתקן' : 'על תקני'}
                        </span>
                      </td>
                      <td className="p-4 md:p-6">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openModal(person)} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(person.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map(role => {
            const rolePeople = filteredPeople.filter(p => p.default_role_id === role.id)
            const standardCount = rolePeople.filter(p => p.is_standard).length
            const isExpanded = expandedRoles.includes(role.id)
            const isFull = role.teken_quantity && standardCount >= role.teken_quantity

            return (
              <div key={role.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleRoleAccordion(role.id)}
                  className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: role.color_code || '#cbd5e1' }} />
                    <div className="text-right">
                      <h4 className="text-lg font-black text-slate-800">{role.role_name}</h4>
                      <p className="text-xs font-bold text-slate-400">תקן: {role.teken || 'לא הוגדר'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                      <span className={`text-sm font-black ${isFull ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {standardCount} / {role.teken_quantity || '∞'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">איוש תקן</span>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {rolePeople.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rolePeople.map(person => (
                          <div key={person.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${person.is_standard ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600'}`}>
                                {person.first_name[0]}{person.last_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{person.first_name} {person.last_name}</p>
                                <p className="text-[10px] text-slate-400" dir="ltr">{person.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!person.is_standard && (
                                <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">על תקני</span>
                              )}
                              <button onClick={() => openModal(person)} className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors">
                                <Edit2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-slate-400 font-bold text-sm italic">אין אנשי צוות משויכים לתפקיד זה</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                {editingPerson ? 'ערוך איש צוות' : 'הוסף איש צוות חדש'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="sm:w-8 sm:h-8" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">דרגה</label>
                  <input
                    type="text"
                    placeholder="למשל: רס״ן"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all"
                    value={formData.rank}
                    onChange={e => setFormData({...formData, rank: e.target.value})}
                  />
                </div>
                <div className="hidden sm:block space-y-2 opacity-0 pointer-events-none">
                  {/* Spacer */}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">שם פרטי</label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all"
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">שם משפחה</label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all"
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">טלפון</label>
                <input
                  type="tel"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all"
                  dir="ltr"
                  placeholder="050-0000000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">תפקיד ברירת מחדל</label>
                <div className="relative">
                  <select
                    required
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all appearance-none"
                    value={formData.default_role_id || ''}
                    onChange={e => setFormData({...formData, default_role_id: e.target.value})}
                  >
                    {roles
                      .filter(role => {
                        // Show the role if:
                        // 1. It's not full
                        // 2. OR it's the current role of the person we're editing
                        // 3. OR we're not trying to set a "Standard" status (so capacity doesn't matter)
                        const count = people.filter(p => p.default_role_id === role.id && p.is_standard).length
                        const isFull = !!(role.teken_quantity && role.teken_quantity > 0 && count >= role.teken_quantity)
                        const isCurrentRole = editingPerson?.default_role_id === role.id
                        
                        return !isFull || isCurrentRole || !formData.is_standard
                      })
                      .map(role => {
                        const count = people.filter(p => p.default_role_id === role.id && p.is_standard).length
                        return (
                          <option key={role.id} value={role.id}>
                            {role.role_name} {role.teken_quantity ? `(${count}/${role.teken_quantity})` : ''}
                          </option>
                        )
                      })}
                  </select>
                  {formData.default_role_id && (
                    <div className="mt-2 px-4 py-2 bg-sky-50 rounded-xl border border-sky-100">
                      {(() => {
                        const role = roles.find(r => r.id === formData.default_role_id)
                        if (!role) return null
                        const count = people.filter(p => p.default_role_id === role.id && p.is_standard).length
                        return (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-sky-700 font-bold">פרטי תקן: {role.teken || 'לא הוגדר'}</span>
                            <span className={`font-black ${role.teken_quantity && count >= role.teken_quantity ? 'text-red-500' : 'text-sky-600'}`}>
                              {count} / {role.teken_quantity || '∞'}
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest block pr-1">סטטוס תקן</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, is_standard: true})}
                    className={`py-4 rounded-2xl font-black transition-all border-2 ${
                      formData.is_standard
                        ? 'bg-sky-500 border-sky-600 text-white shadow-lg shadow-sky-200'
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    בתקן
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, is_standard: false})}
                    className={`py-4 rounded-2xl font-black transition-all border-2 ${
                      !formData.is_standard
                        ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-200'
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    על תקני
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-lg font-black text-slate-800 block">סטטוס תקן</label>
                  <p className="text-sm text-slate-500 font-bold">{formData.is_standard ? 'איש צוות בתקן' : 'איש צוות על-תקני'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_standard: !formData.is_standard })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_standard ? 'bg-sky-500' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.is_standard ? '-translate-x-1' : '-translate-x-7'}`}
                  />
                </button>
              </div>

              <div className="pt-4 flex gap-4 shrink-0">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-900 border-b-4 border-slate-950 text-white rounded-2xl text-xl font-black hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0 active:border-b-0"
                >
                  <Check size={28} />
                  שמור שינויים
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
