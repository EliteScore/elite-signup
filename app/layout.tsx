import type React from "react"
import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"]
})

export const metadata: Metadata = {
  title: "EliteScore - Make Hard Work Addictive",
  description: "EliteScore is a competitive social network where students turn self-improvement into a game. Upload your resume, complete challenges to earn XP, and compete with peers to get into your dream university or land that internship.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased bg-black text-white`}
        style={{
          backgroundImage: "radial-gradient(1000px 400px at 50% -10%, rgba(59,130,246,0.06), transparent 40%), radial-gradient(800px 300px at 90% 10%, rgba(124,58,237,0.05), transparent 40%), radial-gradient(600px 200px at 20% 80%, rgba(59,130,246,0.03), transparent 40%)",
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </body>
    </html>
  )
}

