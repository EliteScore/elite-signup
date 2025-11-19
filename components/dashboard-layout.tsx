"use client"

import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { EnhancedNav } from "@/components/enhanced-nav"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"

interface DashboardLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  showFooter?: boolean
}

export function DashboardLayout({ children, showBottomNav = true, showFooter = true }: DashboardLayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    // In a real app, you would also update the document class and store the preference
    if (theme === "dark") {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }

  return (
    <div className={`min-h-screen flex flex-col text-white ${theme} relative`}>
      {/* Full Page Background - Pure Black */}
      <div className="fixed inset-0 z-0 bg-black">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-400/8 via-purple-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-500/8 via-pink-400/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-emerald-400/5 via-blue-400/3 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col">
        <EnhancedNav theme={theme} onThemeToggle={toggleTheme} />

        <motion.main
          className="flex-1 pb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>

        {showBottomNav && <MainNav />}
        {showFooter && <Footer />}
      </div>
    </div>
  )
}

