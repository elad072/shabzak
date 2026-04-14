import { createClient } from '../../utils/supabase/server'
import PersonnelStatusTable from '@/components/PersonnelStatusTable'
import { ClipboardList, ChevronRight } from 'lucide-react'
import DateFilter from '@/components/DateFilter'

export default async function StatusPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>אנא התחבר מחדש</div>
  }

  const selectedDate = date || new Date().toISOString().split('T')[0]

  // Fetch all people and roles
  const { data: people } = await supabase.from('people').select('*').order('last_name')
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
        <header className="flex flex-col md:flex-row lg:items-center justify-between bg-transparent md:bg-white p-0 md:p-5 lg:p-8 md:rounded-[2rem] lg:rounded-[2.5rem] shadow-none md:shadow-sm border-0 md:border border-slate-100 gap-4">
          <div className="hidden md:flex items-center gap-4 md:gap-6">
            <a href="/" className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </a>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                <ClipboardList className="text-sky-500 w-6 h-6 md:w-8 md:h-8" />
                מצבת כוח אדם
              </h1>
              <p className="text-xs md:text-lg text-slate-400 font-bold uppercase tracking-wider">ניהול נוכחות יומית</p>
            </div>
          </div>

          <div className="w-full sm:w-auto bg-white p-4 md:p-0 rounded-2xl md:bg-transparent shadow-sm md:shadow-none border border-slate-100 md:border-0">
            <DateFilter selectedDate={selectedDate} />
          </div>
        </header>

        <main className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <PersonnelStatusTable 
            roles={roles || []}
            people={people || []}
            date={selectedDate}
          />
        </main>
      </div>
    </div>
  )
}
