import { createClient } from '../../utils/supabase/server'
import RolesManager from '@/components/RolesManager'
import { Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">אנא התחבר כדי לצפות בדף זה</p>
      </div>
    )
  }

  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
              <ChevronRight size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <Settings className="text-sky-500" size={32} />
                הגדרות מערכת
              </h1>
              <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">ניהול תפקידים וצבעים</p>
            </div>
          </div>
        </header>

        <main className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <RolesManager initialRoles={roles || []} />
        </main>
      </div>
    </div>
  )
}
