"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Target, Users, Search } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
		{ icon: Search, label: "Search", href: "/search" },
    { icon: Target, label: "Goals", href: "/goals" },
    { icon: Users, label: "Community", href: "/for-you" },
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
		<div
			className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-zinc-900/30"
			style={{
				paddingBottom: "env(safe-area-inset-bottom)",
			}}
    >
			<nav className="flex items-center justify-between h-14 px-4 sm:px-6 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
						<Link
							key={item.label}
							href={item.href}
							className="relative flex flex-col items-center justify-center flex-1 h-full touch-manipulation"
						>
							<motion.div
								className="relative flex flex-col items-center justify-center gap-1"
								whileTap={{ scale: 0.85 }}
								transition={{ type: "spring", stiffness: 400, damping: 17 }}
							>
								<Icon
									className={cn(
										"h-5 w-5 transition-all duration-200",
										active ? "text-white" : "text-zinc-500",
									)}
									strokeWidth={active ? 2.5 : 2}
									fill={active ? "currentColor" : "none"}
								/>
								<span
                className={cn(
										"text-[8px] font-normal transition-colors duration-200 leading-tight",
										active ? "text-white" : "text-zinc-500",
									)}
								>
									{item.label}
								</span>
							</motion.div>
            </Link>
          )
        })}
      </nav>
		</div>
  )
}

