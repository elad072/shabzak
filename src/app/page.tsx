import { createClient } from '../utils/supabase/server'
import LandingPage from '../components/LandingPage'
import Dashboard from '../components/Dashboard'
import StatusSummary from '../components/StatusSummary'
import { LayoutDashboard, Users, FileBarChart, ClipboardList, Settings } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch data
  const { data: people } = await supabase.from('people').select('*').order('last_name')
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')
  
  // Fetch today's status counts
  const { data: statuses } = await supabase
    .from('daily_status')
    .select('status')
    .eq('date', today)

  const counts = {
    base: statuses?.filter(s => s.status === 'בסיס').length || 0,
    home: statuses?.filter(s => s.status === 'בית').length || 0,
    closed: statuses?.filter(s => s.status === 'סגור').length || 0,
  }

  // Get current week range
  const now = new Date()
  const first = now.getDate() - now.getDay()
  const sunday = new Date(now.setDate(first))
  const saturday = new Date(now.setDate(first + 6))
  
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name), role:settings_roles(role_name, color_code)')
    .gte('date', sunday.toISOString().split('T')[0])
    .lte('date', saturday.toISOString().split('T')[0])

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Modern Header Container */}
        <header className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-8">
            <div className="text-center md:text-right">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">SHABZAK</h1>
              <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">מערכת ניהול משמרות כ"א</p>
            </div>
            
            <StatusSummary counts={counts} />

            <nav className="flex items-center gap-2">
              <form action="/auth/signout" method="post">
                <button className="px-6 py-4 bg-slate-900 border-b-4 border-slate-950 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:translate-y-1 active:border-b-0">
                  התנתק
                </button>
              </form>
            </nav>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <a href="/" className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-black shadow-lg shadow-sky-100 transition-all">
              <LayoutDashboard size={20} />
              לוח משמרות
            </a>
            <a href="/status" className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:border-sky-200 hover:text-sky-600 transition-all">
              <ClipboardList size={20} />
              מצבת יומית
            </a>
            <a href="/people" className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:border-sky-200 hover:text-sky-600 transition-all">
              <Users size={20} />
              ניהול צוות
            </a>
            <a href="/report" className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:border-sky-200 hover:text-sky-600 transition-all">
              <FileBarChart size={20} />
              דוחות ושידור
            </a>
            <a href="/settings" className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black hover:border-sky-200 hover:text-sky-600 transition-all">
              <Settings size={20} />
              הגדרות
            </a>
          </div>
        </header>

        <main>
          <Dashboard 
            initialPeople={people || []} 
            initialAssignments={assignments || []} 
            initialRoles={roles || []}
            startDate={sunday}
          />
        </main>
      </div>
    </div>
  )
}
