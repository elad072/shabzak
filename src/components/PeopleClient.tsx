'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase/client'
import { UserPlus, Edit2, Trash2, X, Check, Phone, Shield, Search } from 'lucide-react'

interface Person {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  default_role_id: string | null
  default_role?: string
}

interface Role {
  id: string
  role_name: string
}

export default function PeopleClient({ initialPeople, roles }: { initialPeople: Person[], roles: Role[] }) {
  const [people, setPeople] = useState(initialPeople)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    default_role_id: roles.length > 0 ? roles[0].id : ''
  })

  const supabase = createClient()

  const openModal = (person?: Person) => {
    if (person) {
      setEditingPerson(person)
      setFormData({
        first_name: person.first_name,
        last_name: person.last_name,
        phone: person.phone || '',
        default_role_id: person.default_role_id || (roles.length > 0 ? roles[0].id : '')
      })
    } else {
      setEditingPerson(null)
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        default_role_id: roles.length > 0 ? roles[0].id : ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
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

  const filteredPeople = people.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query) || (p.phone && p.phone.includes(query))
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-3 px-8 py-4 bg-sky-500 border-b-4 border-sky-600 text-white rounded-2xl text-lg font-bold hover:bg-sky-400 transition-all hover:-translate-y-1 active:translate-y-0 active:border-b-0 whitespace-nowrap"
        >
          <UserPlus size={24} />
          הוסף איש צוות
        </button>

        <div className="relative flex-1 max-w-md">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map(person => {
          const roleName = roles.find(r => r.id === person.default_role_id)?.role_name || person.default_role || '-'
          return (
            <div key={person.id} className="glass-card flex flex-col justify-between group bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <span className="text-xl font-black">{(person.first_name?.[0] || '')}{(person.last_name?.[0] || '')}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(person)} className="p-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(person.id)} className="p-2 bg-slate-50 text-slate-500 border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {person.first_name} {person.last_name}
                </h3>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Shield size={16} className="text-sky-500" />
                    <span className="font-bold">{roleName}</span>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-2xl font-black text-slate-800">
                {editingPerson ? 'ערוך איש צוות' : 'הוסף איש צוות חדש'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={32} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
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
                <select
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-sky-500 font-black outline-none transition-all appearance-none"
                  value={formData.default_role_id || ''}
                  onChange={e => setFormData({...formData, default_role_id: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-4">
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
