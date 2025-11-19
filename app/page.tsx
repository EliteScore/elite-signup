"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
	const router = useRouter()

	useEffect(() => {
		// Always redirect to login page on app start
		router.replace("/login")
	}, [router])

	// Show loading state while redirecting
	return (
		<div className="min-h-screen flex items-center justify-center bg-black">
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
		</div>
	)
}

