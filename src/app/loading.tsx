import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-10 gap-4 animate-in fade-in duration-300">
      <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
      <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">טוען נתונים...</p>
    </div>
  )
}
