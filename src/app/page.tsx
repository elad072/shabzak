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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-10 pt-6 pb-6 md:pb-8">
          <StatusSummary counts={counts} />
        </div>

        <main className="px-4 sm:px-6 lg:px-10 pb-10">
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
