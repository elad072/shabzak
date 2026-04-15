import { createClient } from '../utils/supabase/server'
import LandingPage from '../components/LandingPage'
import Dashboard from '../components/Dashboard'
import StatusSummary from '../components/StatusSummary'
import WeekFilter from '../components/WeekFilter'

function toIsoDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekRange(weekDateParam?: string): { sunday: Date; saturday: Date } {
  let base: Date
  if (weekDateParam) {
    base = new Date(weekDateParam + 'T00:00:00')
  } else {
    base = new Date()
  }
  const day = base.getDay()
  const sunday = new Date(base)
  sunday.setDate(base.getDate() - day)
  sunday.setHours(0, 0, 0, 0)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(0, 0, 0, 0)
  return { sunday, saturday }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ weekDate?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const { weekDate } = await searchParams
  const { sunday, saturday } = getWeekRange(weekDate)

  const today = toIsoDateStr(new Date())
  const sundayStr = toIsoDateStr(sunday)
  const saturdayStr = toIsoDateStr(saturday)

  // Fetch data
  const { data: people } = await supabase.from('people').select('*').order('last_name')
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  // Fetch today's status counts (always today — independent of selected week)
  const { data: statuses } = await supabase
    .from('daily_status')
    .select('status')
    .eq('date', today)

  const counts = {
    base: statuses?.filter(s => s.status === 'בסיס').length || 0,
    home: statuses?.filter(s => s.status === 'בית').length || 0,
    closed: statuses?.filter(s => s.status === 'סגור').length || 0,
  }

  // Fetch assignments for chosen week
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name), role:settings_roles(role_name, color_code)')
    .gte('date', sundayStr)
    .lte('date', saturdayStr)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Sticky sub-header: Status + Week Filter ── */}
      <div className="sticky top-[49px] md:top-[81px] z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-100 shadow-sm transition-all pb-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-2.5 md:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Status pills */}
          <StatusSummary counts={counts} />
          {/* Week navigator */}
          <WeekFilter startDateStr={sundayStr} endDateStr={saturdayStr} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <main className="px-4 sm:px-6 lg:px-10 pt-6 pb-10">
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
