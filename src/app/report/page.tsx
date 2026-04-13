import { createClient } from '../../utils/supabase/server'
import WeeklyReportTable from '@/components/WeeklyReportTable'
import { FileBarChart, ChevronRight } from 'lucide-react'

export default async function ReportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>אנא התחבר מחדש</div>
  }

  // Get current week range (Sunday to Saturday)
  const now = new Date()
  const first = now.getDate() - now.getDay()
  const sunday = new Date(now.setDate(first))
  const saturday = new Date(now.setDate(first + 6))
  
  const sundayStr = sunday.toISOString().split('T')[0]
  const saturdayStr = saturday.toISOString().split('T')[0]

  // Fetch people
  const { data: people } = await supabase.from('people').select('*')

  // Fetch roles
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  // Fetch assignments for the week
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name, default_role), role:settings_roles(role_name, color_code)')
    .gte('date', sundayStr)
    .lte('date', saturdayStr)

  // Fetch statuses for today (for the WhatsApp summary)
  const today = new Date().toISOString().split('T')[0]
  const { data: statuses } = await supabase
    .from('daily_status')
    .select('*')
    .eq('date', today)

  return (
    <div className="min-h-screen bg-white p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-10">
        <header className="flex items-center justify-between no-print">
          <div className="flex items-center gap-6">
            <a href="/" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
              <ChevronRight size={24} />
            </a>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <FileBarChart className="text-sky-500" size={32} />
                דו"ח משמרות ושידור
              </h1>
              <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">
                שבוע {sunday.getDate()}/{sunday.getMonth() + 1} - {saturday.getDate()}/{saturday.getMonth() + 1}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* Action buttons are now handled inside the Client Component to avoid Server Component errors */}
          </div>
        </header>

        <main className="space-y-12">
          <WeeklyReportTable 
            assignments={assignments || []} 
            statuses={statuses || []}
            roles={roles || []}
            people={people || []}
            startDate={sunday}
          />
        </main>
      </div>
    </div>
  )
}
