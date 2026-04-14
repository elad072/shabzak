import { createClient } from '../../utils/supabase/server'
import PeopleClient from '../../components/PeopleClient'

export default async function PeoplePage() {
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

  const { data: people } = await supabase.from('people').select('*').order('last_name')
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <header className="hidden md:flex max-w-7xl mx-auto mb-12 justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">ניהול כוח אדם</h1>
          <p className="text-xl text-slate-500 font-medium">הוספה, עריכה ומחיקת אנשי צוות</p>
        </div>
        <nav className="flex gap-4">
          <a href="/" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            חזרה ללוח
          </a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        <PeopleClient initialPeople={people || []} roles={roles || []} />
      </main>
    </div>
  )
}
