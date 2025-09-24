"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Search, MessageCircle, Settings, User, ChevronDown, LogOut, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface EnhancedNavProps {
  theme?: "light" | "dark"
  onThemeToggle?: () => void
}

export function EnhancedNav({ theme = "dark", onThemeToggle }: EnhancedNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const [messageCount, setMessageCount] = useState(2)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is on login or signup page
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
    // This would normally check for a valid session
    setIsLoggedIn(pathname !== "/login" && pathname !== "/signup" && pathname !== "/")
  }, [pathname])

  if (!mounted) return null

  const mainNavItems = [
    { label: "Home", href: "/home" },
    { label: "Explore", href: "/search" },
    { label: "Goals", href: "/goals" },
    { label: "Communities", href: "/for-you" },
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/90 backdrop-blur-lg overflow-x-hidden">
      <div className="container h-16 flex items-center justify-between px-4">
        {/* Logo */}
        <Link href={isLoggedIn ? "/home" : "/"} className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative h-8 w-8 flex items-center justify-center"
          >
            <img src="/Annotation 2025-07-18 034118.png" alt="ELITESCORE logo" className="h-8 w-8 object-contain" />
          </motion.div>
          <motion.span
            className="text-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent hidden sm:inline-block"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            ELITESCORE
          </motion.span>
        </Link>

        {/* Only keep search and chat options */}
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <>
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-white hover:bg-muted"
                onClick={() => router.push("/search")}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Messages Button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-white hover:bg-muted relative"
                onClick={() => router.push("/chat")}
              >
                <MessageCircle className="h-5 w-5" />
                {messageCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                    {messageCount}
                  </Badge>
                )}
              </Button>
            </>
          )}

          {/* User Menu */}
          {isLoggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-8 gap-1 pl-1 pr-2 hover:bg-muted">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-muted">U</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 hover:text-red-400"
                  onClick={() => router.push("/login")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Auth buttons for non-logged in users */}
          {!isLoggedIn && !isAuthPage && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Button asChild className="gradient-bg">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

