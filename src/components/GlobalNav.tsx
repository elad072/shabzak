'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, FileBarChart, ClipboardList, Settings, LogOut } from 'lucide-react'

export default function GlobalNav() {
  const pathname = usePathname()

  const tabs = [
    { name: 'לוח משמרות', icon: LayoutDashboard, href: '/' },
    { name: 'מצבת יומית', icon: ClipboardList, href: '/status' },
    { name: 'ניהול צוות', icon: Users, href: '/people' },
    { name: 'דוחות ושידור', icon: FileBarChart, href: '/report' },
    { name: 'הגדרות', icon: Settings, href: '/settings' },
  ]

  return (
    <>
      {/* Mobile Top Header (Sticky) */}
      <header className="md:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-slate-100 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">SHABZAK</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </form>
      </header>

      {/* Mobile Bottom Navigation (Fixed) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 pb-safe pt-1 z-50 flex justify-around items-center h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {tabs.slice(0, 4).map(tab => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <a 
              key={tab.href} 
              href={tab.href}
              className={`flex flex-col items-center justify-center p-1 min-w-[70px] transition-colors rounded-xl ${
                isActive ? 'text-sky-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`mb-1 p-1 rounded-lg ${isActive ? 'bg-sky-50' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>{tab.name}</span>
            </a>
          )
        })}
      </nav>

      {/* Desktop Header (Sticky) */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-10 py-4 shadow-sm items-center justify-between">
        <div className="flex items-center gap-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">SHABZAK</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">מערכת ניהול משמרות</p>
          </div>
          
          <nav className="flex items-center gap-2">
            {tabs.map(tab => {
              const isActive = pathname === tab.href
              const Icon = tab.icon
              return (
                <a 
                  key={tab.href} 
                  href={tab.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                    isActive ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.name}
                </a>
              )
            })}
          </nav>
        </div>

        <form action="/auth/signout" method="post">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all">
            <LogOut size={16} />
            התנתק
          </button>
        </form>
      </header>
    </>
  )
}
