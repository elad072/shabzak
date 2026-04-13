'use client'

import { useState } from 'react'
import { createClient } from '../utils/supabase/client'
import { Plus, Trash2, Edit2, Check, X, MoveUp, MoveDown } from 'lucide-react'

interface Role {
  id: string
  role_name: string
  display_order: number
  color_code: string
}

interface RolesManagerProps {
  initialRoles: Role[]
}

export default function RolesManager({ initialRoles }: RolesManagerProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const [isAdding, setIsAdding] = useState(false)
  const [newRole, setNewRole] = useState({ role_name: '', color_code: '#3b82f6' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ role_name: '', color_code: '' })

  const supabase = createClient()

  const handleAdd = async () => {
    if (!newRole.role_name) return
    const order = roles.length > 0 ? Math.max(...roles.map(r => r.display_order)) + 1 : 1
    
    const { data, error } = await supabase
      .from('settings_roles')
      .insert({ ...newRole, display_order: order })
      .select()
      .single()

    if (data) {
      setRoles([...roles, data])
      setIsAdding(false)
      setNewRole({ role_name: '', color_code: '#3b82f6' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תפקיד זה? שיבוצים קיימים יימחקו.')) return
    const { error } = await supabase.from('settings_roles').delete().eq('id', id)
    if (!error) {
      setRoles(roles.filter(r => r.id !== id))
    }
  }

  const handleEditInit = (role: Role) => {
    setEditingId(role.id)
    setEditForm({ role_name: role.role_name, color_code: role.color_code })
  }

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from('settings_roles')
      .update(editForm)
      .eq('id', id)

    if (!error) {
      setRoles(roles.map(r => r.id === id ? { ...r, ...editForm } : r))
      setEditingId(null)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newRoles = [...roles]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= roles.length) return

    // Swap locally
    const temp = newRoles[index].display_order
    newRoles[index].display_order = newRoles[targetIndex].display_order
    newRoles[targetIndex].display_order = temp
    
    // Sort and set
    const sorted = newRoles.sort((a, b) => a.display_order - b.display_order)
    setRoles(sorted)

    // Global sync (optional but recommended for persistence)
    await supabase.from('settings_roles').update({ display_order: sorted[index].display_order }).eq('id', sorted[index].id)
    await supabase.from('settings_roles').update({ display_order: sorted[targetIndex].display_order }).eq('id', sorted[targetIndex].id)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-slate-800">רשימת תפקידים</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-black hover:bg-sky-600 transition-all shadow-lg shadow-sky-100"
        >
          <Plus size={20} />
          תפקיד חדש
        </button>
      </div>

      <div className="space-y-3">
        {isAdding && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <input
              type="color"
              value={newRole.color_code}
              onChange={e => setNewRole({ ...newRole, color_code: e.target.value })}
              className="w-12 h-12 rounded-xl border-0 cursor-pointer"
            />
            <input
              type="text"
              placeholder="שם התפקיד..."
              value={newRole.role_name}
              onChange={e => setNewRole({ ...newRole, role_name: e.target.value })}
              className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2 font-bold focus:border-sky-500 transition-all"
            />
            <button onClick={handleAdd} className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600">
              <Check size={20} />
            </button>
            <button onClick={() => setIsAdding(false)} className="p-3 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300">
              <X size={20} />
            </button>
          </div>
        )}

        {roles.map((role, idx) => (
          <div
            key={role.id}
            className="flex items-center gap-4 p-4 bg-white border-2 border-slate-100 rounded-2xl group hover:border-slate-300 transition-all"
          >
            <div
              className="w-12 h-12 rounded-xl border-2 border-white shadow-sm"
              style={{ backgroundColor: role.color_code }}
            />
            
            <div className="flex-1">
              {editingId === role.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editForm.role_name}
                    onChange={e => setEditForm({ ...editForm, role_name: e.target.value })}
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1 font-bold"
                  />
                  <input
                    type="color"
                    value={editForm.color_code}
                    onChange={e => setEditForm({ ...editForm, color_code: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                </div>
              ) : (
                <span className="text-lg font-black text-slate-700">{role.role_name}</span>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleMove(idx, 'up')} className="p-3 md:p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <MoveUp size={20} className="md:size-[18px]" />
              </button>
              <button onClick={() => handleMove(idx, 'down')} className="p-3 md:p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <MoveDown size={20} className="md:size-[18px]" />
              </button>
              
              {editingId === role.id ? (
                <>
                  <button onClick={() => handleSaveEdit(role.id)} className="p-3 md:p-2 bg-emerald-500 text-white rounded-lg">
                    <Check size={20} className="md:size-[18px]" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-3 md:p-2 bg-slate-200 text-slate-500 rounded-lg">
                    <X size={20} className="md:size-[18px]" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEditInit(role)} className="p-3 md:p-2 hover:bg-sky-50 text-sky-500 rounded-lg border border-transparent md:border-none">
                    <Edit2 size={20} className="md:size-[18px]" />
                  </button>
                  <button onClick={() => handleDelete(role.id)} className="p-3 md:p-2 hover:bg-rose-50 text-rose-500 rounded-lg border border-transparent md:border-none">
                    <Trash2 size={20} className="md:size-[18px]" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
