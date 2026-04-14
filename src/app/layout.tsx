import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";
import { createClient } from '@/utils/supabase/server';
import GlobalNav from '@/components/GlobalNav';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "SHABZAK - ניהול משמרות",
  description: "מערכת ניהול משמרות חכמה ומודרנית",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="he" dir="rtl">
      <body
        className={`${inter.variable} ${heebo.variable} font-heebo antialiased bg-slate-50 text-slate-900 flex flex-col min-h-[100dvh]`}
      >
        {user && <GlobalNav />}
        <div className={`flex-1 ${user ? 'pb-24 md:pb-0' : ''}`}>
          {children}
        </div>
      </body>
    </html>
  );
}
