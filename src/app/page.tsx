import { createClient } from '../utils/supabase/server'
import LandingPage from '../components/LandingPage'
import Dashboard from '../components/Dashboard'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Fetch people and assignments for the weekly view
  // For simplicity, let's fetch all people and assignments for the current week
  const { data: people } = await supabase.from('people').select('*').order('last_name')
  
  // Get current week range (Sunday to Saturday)
  const today = new Date()
  const first = today.getDate() - today.getDay()
  const sunday = new Date(today.setDate(first))
  const saturday = new Date(today.setDate(first + 6))
  
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name)')
    .gte('date', sunday.toISOString().split('T')[0])
    .lte('date', saturday.toISOString().split('T')[0])

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">לוח משמרות שבועי</h1>
          <p className="text-xl text-slate-500 font-medium">ניהול שיבוצים - מערכת SHABZAK</p>
        </div>
        <nav className="flex gap-4">
          <a href="/people" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            ניהול כוח אדם
          </a>
          <form action="/auth/signout" method="post">
            <button className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
              התנתק
            </button>
          </form>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto">
        <Dashboard 
          initialPeople={people || []} 
          initialAssignments={assignments || []} 
          startDate={sunday}
        />
      </main>
    </div>
  )
}
