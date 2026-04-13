import { createClient } from '../../utils/supabase/server'
import PersonnelStatusTable from '@/components/PersonnelStatusTable'
import { ClipboardList, ChevronRight } from 'lucide-react'
import DateFilter from '@/components/DateFilter'

export default async function StatusPage({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>אנא התחבר מחדש</div>
  }

  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0]

  // Fetch all people
  const { data: people } = await supabase.from('people').select('*').order('last_name')
  
  // Fetch roles
  const { data: roles } = await supabase.from('settings_roles').select('*').order('display_order')

  // Fetch statuses for the specific date
  const { data: statuses } = await supabase
    .from('daily_status')
    .select('*')
    .eq('date', selectedDate)

  // Fetch assignments for the specific date
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, person:people(first_name, last_name)')
    .eq('date', selectedDate)

  // Combined data for the table
  const peopleWithStatus = people?.map(person => {
    const statusEntry = statuses?.find(s => s.person_id === person.id)
    return {
      ...person,
      status: statusEntry?.status || 'בית',
      is_automated: statusEntry?.is_automated || false
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-6">
            <a href="/" className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all">
              <ChevronRight size={24} />
            </a>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <ClipboardList className="text-sky-500" size={32} />
                מצבת כוח אדם
              </h1>
              <p className="text-lg text-slate-400 font-bold uppercase tracking-wider">ניהול נוכחות יומית</p>
            </div>
          </div>

          <DateFilter selectedDate={selectedDate} />
        </header>

        <main className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <PersonnelStatusTable 
            key={selectedDate}
            initialPeople={peopleWithStatus || []} 
            roles={roles || []}
            people={people || []}
            assignments={assignments || []}
            statuses={statuses || []}
            date={selectedDate}
          />
        </main>
      </div>
    </div>
  )
}
