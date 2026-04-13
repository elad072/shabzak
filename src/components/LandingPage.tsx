'use client'

import { createClient } from '../utils/supabase/client'
import { LogIn, Calendar, Users, Bell } from 'lucide-react'

export default function LandingPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100 via-slate-50 to-slate-50">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-12 inline-flex p-4 rounded-3xl bg-white shadow-xl shadow-sky-100 border border-sky-50">
          <Calendar size={64} className="text-sky-500" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-6xl font-black text-slate-800 mb-6 tracking-tight">
          מערכת <span className="text-sky-500">SHABZAK</span>
        </h1>
        
        <p className="text-2xl text-slate-500 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
          ניהול משמרות חכם, פשוט ומודרני. הדרך הקלה לעקוב אחר הצוות שלך ולראות מי בשטח בכל רגע נתון.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
          <button 
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 border-b-4 border-slate-950 text-white rounded-2xl text-xl font-bold hover:bg-slate-800 transition-all hover:-translate-y-1 active:translate-y-0 active:border-b-0"
          >
            <LogIn size={24} />
            התחבר עם גוגל
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="bg-white/50 p-8 rounded-3xl border border-white">
            <Calendar className="text-sky-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">שיבוץ שבועי</h3>
            <p className="text-slate-500">תצוגה שבועית רחבה ונוחה הכוללת משמרות יום ולילה.</p>
          </div>
          <div className="bg-white/50 p-8 rounded-3xl border border-white">
            <Users className="text-sky-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">ניהול צוות</h3>
            <p className="text-slate-500">מעקב מלא אחר פרטי הצוות, תפקידים ומספרי טלפון.</p>
          </div>
          <div className="bg-white/50 p-8 rounded-3xl border border-white">
            <Bell className="text-sky-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">דיווחים בזמן אמת</h3>
            <p className="text-slate-500">שליחת דוחות ועדכונים ישירות למשתמשים רלוונטיים.</p>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-8 text-slate-400 font-medium">
        © {new Date().getFullYear()} SHABZAK System. All rights reserved.
      </footer>
    </div>
  )
}
