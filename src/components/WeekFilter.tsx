'use client'

import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

interface WeekFilterProps {
  /** ISO date string of the week's Sunday (e.g. "2026-04-14") */
  startDateStr: string
  /** ISO date string of the week's Saturday (e.g. "2026-04-20") */
  endDateStr: string
}

function toIsoDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekSundayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return toIsoDateStr(d)
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return getWeekSundayStr(toIsoDateStr(d))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function WeekFilterInner({ startDateStr, endDateStr }: WeekFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const todayStr = toIsoDateStr(new Date())
  const thisWeekSundayStr = getWeekSundayStr(todayStr)
  const isCurrentWeek = startDateStr === thisWeekSundayStr

  const navigateToWeek = (sundayStr: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sundayStr === thisWeekSundayStr) {
      params.delete('weekDate')
    } else {
      params.set('weekDate', sundayStr)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePrev = () => navigateToWeek(addWeeks(startDateStr, -1))
  const handleNext = () => navigateToWeek(addWeeks(startDateStr, 1))
  const handleToday = () => navigateToWeek(thisWeekSundayStr)

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    navigateToWeek(getWeekSundayStr(e.target.value))
  }

  const diffWeeks = Math.round(
    (new Date(startDateStr + 'T00:00:00').getTime() -
      new Date(thisWeekSundayStr + 'T00:00:00').getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  )

  let weekLabel = ''
  if (diffWeeks === 0) weekLabel = 'השבוע הנוכחי'
  else if (diffWeeks === 1) weekLabel = 'השבוע הבא'
  else if (diffWeeks === -1) weekLabel = 'השבוע הקודם'
  else if (diffWeeks > 1) weekLabel = `בעוד ${diffWeeks} שבועות`
  else weekLabel = `לפני ${Math.abs(diffWeeks)} שבועות`

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      {/* Nav pill */}
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 flex-1 sm:flex-none justify-between sm:justify-start min-w-[200px]">
        {/* Prev week */}
        <button
          onClick={handlePrev}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-all active:scale-95 shadow-sm shrink-0"
          title="שבוע קודם"
        >
          <ChevronRight size={18} />
        </button>

        {/* Week label — clickable date picker overlay */}
        <label className="flex flex-col items-center cursor-pointer flex-1 px-2 relative min-w-[140px]">
          <span
            className={`text-[10px] font-black uppercase tracking-widest leading-tight ${
              isCurrentWeek ? 'text-sky-500' : 'text-violet-500'
            }`}
          >
            {weekLabel}
          </span>
          <span className="text-xs font-black text-slate-700 leading-tight whitespace-nowrap">
            {formatDate(startDateStr)} עד {formatDateFull(endDateStr)}
          </span>
          <input
            type="date"
            onChange={handleDatePick}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="בחר שבוע לפי תאריך"
            title="לחץ לבחירת שבוע"
          />
        </label>

        {/* Next week */}
        <button
          onClick={handleNext}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-all active:scale-95 shadow-sm shrink-0"
          title="שבוע הבא"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Back to current week */}
      {!isCurrentWeek && (
        <button
          onClick={handleToday}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl font-black text-xs hover:bg-sky-100 transition-all active:scale-95 border border-sky-100 shadow-sm whitespace-nowrap"
        >
          <RotateCcw size={13} />
          השבוע הנוכחי
        </button>
      )}
    </div>
  )
}

export default function WeekFilter(props: WeekFilterProps) {
  return (
    <Suspense
      fallback={
        <div className="h-11 w-48 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
      }
    >
      <WeekFilterInner {...props} />
    </Suspense>
  )
}
