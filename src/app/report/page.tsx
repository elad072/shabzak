import { createClient } from '../../utils/supabase/server'
import WeeklyReportTable from '@/components/WeeklyReportTable'
import WeekFilter from '@/components/WeekFilter'
import { FileBarChart, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekDate?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>אנא התחבר מחדש</div>
  }

  const { weekDate } = await searchParams
  const { sunday, saturday } = getWeekRange(weekDate)

  const sundayStr = toIsoDateStr(sunday)
  const saturdayStr = toIsoDateStr(saturday)

  // Fetch people
  const { data: people } = await supabase.from('people').select('*')

  // Fetch roles
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  // Fetch assignments for chosen week
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name, default_role), role:settings_roles(role_name, color_code)')
    .gte('date', sundayStr)
    .lte('date', saturdayStr)

  // Fetch statuses for the selected week (for WhatsApp summary of today within range)
  const today = toIsoDateStr(new Date())
  const { data: statuses } = await supabase
    .from('daily_status')
    .select('*')
    .eq('date', today)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white sticky top-0 z-30 no-print">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title Row */}
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all shrink-0"
              >
                <ChevronRight size={22} />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
                  <FileBarChart className="text-sky-500 shrink-0" size={26} />
                  דו&quot;ח משמרות ושידור
                </h1>
                <p className="text-[11px] sm:text-sm text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  לוח שיבוצים שבועי מלא
                </p>
              </div>
            </div>

            {/* Week navigation */}
            <div className="w-full sm:w-auto">
              <WeekFilter startDateStr={sundayStr} endDateStr={saturdayStr} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
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
