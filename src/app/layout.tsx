import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${inter.variable} ${heebo.variable} font-heebo antialiased bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
