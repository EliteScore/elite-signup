"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
	ArrowLeft,
	Trophy,
	TrendingUp,
	TrendingDown,
	Star,
	Target,
	Brain,
	BarChart3,
	Users,
	Medal,
	Crown,
	Sparkles,
	FileText,
	CheckCircle,
	AlertCircle,
	Briefcase,
	Code,
	GraduationCap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
	EnhancedCard,
	EnhancedCardContent,
	EnhancedCardHeader,
	EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { cn } from "@/lib/utils"
import AnimatedCounter from "@/components/ui/animated-counter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStoredAccessToken } from "@/lib/auth-storage"


export default function ResumeReportPage() {
	const isAuthorized = useRequireAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [activeTab, setActiveTab] = useState("overview")
	const [resumeData, setResumeData] = useState<any>(null)
	const [userScore, setUserScore] = useState<number | null>(null)
	const [resumeScores, setResumeScores] = useState<{
		user_id: number
		overall_score: number
		projects_score: number
		experience_score: number
		education_score: number
		skills_score: number
	} | null>(null)
	const [isLoadingScores, setIsLoadingScores] = useState(false)

	// Fetch resume scores from API
	useEffect(() => {
		if (!isAuthorized) return

		async function fetchResumeScores() {
			const token = getStoredAccessToken()
			if (!token) {
				console.warn("[Resume Report] No token available for fetching resume scores")
				return
			}

			setIsLoadingScores(true)
			try {
				console.log("[Resume Report] Fetching resume scores from API...")
				const response = await fetch("/api/users/resume-scores", {
					method: "GET",
					headers: {
						"Accept": "application/json",
						Authorization: `Bearer ${token}`,
					},
				})

				if (response.ok) {
					const data = await response.json()
					console.log("[Resume Report] Fetched resume scores:", data)
					setResumeScores(data)
					// Update userScore if we got overall_score from API
					if (data.overall_score !== undefined) {
						setUserScore(data.overall_score)
					}
				} else if (response.status === 404) {
					console.log("[Resume Report] No resume scores found (404)")
					// This is okay - user might not have scores yet
				} else {
					console.warn("[Resume Report] Failed to fetch resume scores:", response.status, response.statusText)
				}
			} catch (error) {
				console.error("[Resume Report] Error fetching resume scores:", error)
			} finally {
				setIsLoadingScores(false)
			}
		}

		fetchResumeScores()
	}, [isAuthorized])

	// Load resume data from URL params or localStorage
	useEffect(() => {
		if (!isAuthorized) return

		// Try to get data from URL params
		const scoreParam = searchParams?.get("score")
		const dataParam = searchParams?.get("data")

		if (dataParam) {
			try {
				const decoded = JSON.parse(decodeURIComponent(dataParam))
				setResumeData(decoded)
				// Extract score from API response structure (same as resume page)
				const apiScore = decoded.score || decoded.parsed?.overall_score || 0
				setUserScore(apiScore)
			} catch (error) {
				console.warn("[Resume Report] Failed to parse data param:", error)
			}
		}

		// Fallback: Try to get from localStorage (only if we don't have data yet)
		if (!resumeData && !dataParam) {
			try {
				const stored = localStorage.getItem("resume.analysis")
				if (stored) {
					const parsed = JSON.parse(stored)
					setResumeData(parsed)
					// Extract score from API response structure (same as resume page)
					const apiScore = parsed.score || parsed.parsed?.overall_score || 0
					setUserScore(apiScore)
				}
			} catch (error) {
				console.warn("[Resume Report] Failed to load from localStorage:", error)
			}
		}
		
		// Only use URL param if we don't have API data (fallback)
		if (scoreParam && !resumeData && !resumeScores) {
			setUserScore(Number(scoreParam))
		}
	}, [isAuthorized, searchParams, resumeData, resumeScores])

	// Redirect if no data (after authorization check)
	useEffect(() => {
		if (!isAuthorized) return
		
		// Only redirect if we've checked localStorage and still have no data
		const checkData = () => {
			if (!resumeData && !userScore) {
				const stored = localStorage.getItem("resume.analysis")
				if (!stored) {
					const timer = setTimeout(() => {
						router.push("/resume")
					}, 1500)
					return () => clearTimeout(timer)
				}
			}
		}

		const timeoutId = setTimeout(checkData, 500)
		return () => clearTimeout(timeoutId)
	}, [isAuthorized, resumeData, userScore, router])

	// Early returns after all hooks
	if (!isAuthorized) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-black">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
			</div>
		)
	}

	// If no data, show loading
	if (!resumeData && !userScore) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-black">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
			</div>
		)
	}

	// Extract score from API response structure - prioritize API scores over local data
	const score = resumeScores?.overall_score || resumeData?.score || resumeData?.parsed?.overall_score || userScore || 0
	// Use API scores if available, otherwise fall back to parsed components
	const components = resumeScores ? {
		experience: resumeScores.experience_score,
		skills: resumeScores.skills_score,
		education: resumeScores.education_score,
		projects: resumeScores.projects_score,
		ai_signal: 0 // Not provided by API
	} : (resumeData?.parsed?.components || {})
	const explanation = resumeData?.parsed?.explanation || { 
		highlights: [], 
		notes: { strengths: [], weaknesses: [] },
		top_archetype_matches: []
	}


	return (
		<DashboardLayout>
			<div className="min-h-screen pb-20 relative overflow-hidden">
				{/* Animated Background Orbs */}
				<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
					<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
					<div className="absolute top-1/2 right-1/3 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
				</div>

				<div className="max-w-md mx-auto px-4 py-4 sm:py-6 relative z-10">
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="flex items-center gap-3 mb-6 sm:mb-8"
					>
						<EnhancedButton
							variant="ghost"
							size="sm"
							rounded="full"
							className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 -ml-2 transition-all duration-200"
							onClick={() => router.back()}
							leftIcon={<ArrowLeft className="h-4 w-4" />}
						>
							<span className="hidden sm:inline">Back</span>
						</EnhancedButton>
						<h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex-1 text-center sm:text-left drop-shadow-lg">
							Full Report
						</h1>
						<div className="w-12 sm:w-20" /> {/* Spacer for centering */}
					</motion.div>

					{/* Score Hero Section */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, ease: "easeOut" }}
						className="mb-6 sm:mb-8"
					>
						<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800/60 shadow-2xl rounded-3xl overflow-hidden relative">
							{/* Gradient overlay */}
							<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
							
							<div className="p-8 sm:p-10 relative z-10">
								<div className="flex flex-col items-center gap-8">
									{/* Circular Progress with enhanced styling */}
									<div className="relative">
										{/* Outer glow ring */}
										<div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse" />
										
										<svg className="w-36 h-36 sm:w-44 sm:h-44 relative z-10 drop-shadow-2xl" viewBox="0 0 100 100">
											{/* Background circle */}
											<circle
												cx="50"
												cy="50"
												r="45"
												fill="none"
												stroke="#27272a"
												strokeWidth="8"
											/>
											{/* Progress circle with glow */}
											<motion.circle
												cx="50"
												cy="50"
												r="45"
												fill="none"
												stroke="url(#scoreGradient)"
												strokeWidth="8"
												strokeLinecap="round"
												strokeDasharray="283"
												initial={{ strokeDashoffset: 283 }}
												animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
												transition={{ duration: 2, ease: "easeOut" }}
												transform="rotate(-90 50 50)"
												filter="url(#glow)"
											/>
											<defs>
												<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="#3b82f6" />
													<stop offset="50%" stopColor="#a855f7" />
													<stop offset="100%" stopColor="#ec4899" />
												</linearGradient>
												<filter id="glow">
													<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
													<feMerge>
														<feMergeNode in="coloredBlur"/>
														<feMergeNode in="SourceGraphic"/>
													</feMerge>
												</filter>
											</defs>
										</svg>
										<div className="absolute inset-0 flex flex-col items-center justify-center z-20">
											<AnimatedCounter
												from={0}
												to={score}
												duration={2}
												className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg"
											/>
											<div className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">/ 100</div>
										</div>
									</div>
									
									{/* Score Info */}
									<div className="text-center w-full space-y-3">
										{/* Title with enhanced styling */}
										<div className="flex items-center justify-center gap-3">
											<div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
												<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" strokeWidth={2.5} />
											</div>
											<h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent drop-shadow-md">
												Resume Score
											</h2>
										</div>
									</div>
								</div>
							</div>
						</EnhancedCard>
					</motion.div>

					{/* Tabs */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-1.5 mb-6 sm:mb-8 grid grid-cols-2 w-full h-12 sm:h-14 shadow-lg">
							<TabsTrigger
								value="overview"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/40 data-[state=active]:to-purple-600/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl transition-all duration-300 text-sm sm:text-base font-semibold data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-300"
							>
								<BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
								<span className="hidden sm:inline">Overview</span>
								<span className="sm:hidden">Stats</span>
							</TabsTrigger>
							<TabsTrigger
								value="insights"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/40 data-[state=active]:to-purple-600/40 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl transition-all duration-300 text-sm sm:text-base font-semibold data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:text-zinc-300"
							>
								<Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
								Insights
							</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent value="overview" className="space-y-5 sm:space-y-6 mt-0">
							{/* Performance Metrics - Mobile First */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="grid grid-cols-2 gap-3 sm:gap-4"
							>
								<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-500/30">
									<EnhancedCardContent className="p-4 sm:p-5 text-center">
										<div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-md">
											{score}
										</div>
										<div className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">Current Score</div>
									</EnhancedCardContent>
								</EnhancedCard>
								<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-500/30">
									<EnhancedCardContent className="p-4 sm:p-5 text-center">
										<div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-pink-600 bg-clip-text text-transparent drop-shadow-md">
											{100 - score}
										</div>
										<div className="text-xs sm:text-sm text-zinc-400 mt-2 font-medium">To Perfect</div>
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>

							{/* Score Breakdown */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800/60 shadow-2xl rounded-3xl overflow-hidden relative">
									<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
									<EnhancedCardHeader className="pb-4 relative z-10">
										<EnhancedCardTitle className="text-xl sm:text-2xl flex items-center gap-3">
											<div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
												<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
											</div>
											<span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent font-extrabold">
												Score Breakdown
											</span>
										</EnhancedCardTitle>
									</EnhancedCardHeader>
									<EnhancedCardContent className="space-y-4 sm:space-y-5 relative z-10">
										{[
											{ name: "Experience", score: components.experience || 0, icon: Briefcase, color: "blue" },
											{ name: "Skills", score: components.skills || 0, icon: Code, color: "purple" },
											{ name: "Education", score: components.education || 0, icon: GraduationCap, color: "pink" },
											{ name: "Projects", score: components.projects || 0, icon: FileText, color: "indigo" },
											{ name: "AI Signal", score: components.ai_signal || 0, icon: Sparkles, color: "yellow" },
										].map((section, index) => {
											const getFeedback = () => {
												if (section.score >= 80) {
													return explanation.notes?.strengths?.[0] || "Strong performance in this area"
												} else if (section.score >= 60) {
													return "Good foundation, room for improvement"
												} else {
													return explanation.notes?.weaknesses?.[0] || "Consider enhancing this section"
												}
											}

											const IconComponent = section.icon
											const getColorClasses = (color: string) => {
												switch (color) {
													case "blue":
														return {
															gradient: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
															icon: "text-blue-400"
														}
													case "purple":
														return {
															gradient: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
															icon: "text-purple-400"
														}
													case "pink":
														return {
															gradient: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
															icon: "text-pink-400"
														}
													case "indigo":
														return {
															gradient: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30",
															icon: "text-indigo-400"
														}
													case "yellow":
														return {
															gradient: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
															icon: "text-yellow-400"
														}
													default:
														return {
															gradient: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
															icon: "text-blue-400"
														}
												}
											}

											const colorClasses = getColorClasses(section.color)

											return (
												<motion.div
													key={section.name}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: 0.3 + index * 0.1 }}
													className="bg-zinc-800/70 backdrop-blur-sm border border-zinc-700/60 rounded-xl p-4 sm:p-5 hover:border-zinc-600/80 hover:bg-zinc-800/80 transition-all duration-300 shadow-lg hover:shadow-xl"
												>
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<div className={`p-2 rounded-lg bg-gradient-to-br border ${colorClasses.gradient}`}>
																<IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${colorClasses.icon}`} />
															</div>
															<span className="text-sm sm:text-base font-semibold text-white">{section.name}</span>
														</div>
														<span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
															{Math.round(section.score)}/100
														</span>
													</div>
													<AnimatedProgress
														value={section.score}
														max={100}
														className="h-2.5 sm:h-3 bg-zinc-700/50 rounded-full overflow-hidden [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-purple-500 [&>div]:to-pink-500 [&>div]:shadow-[0_0_10px_rgba(139,92,246,0.5)]"
														delay={0.5 + index * 0.1}
													/>
													<p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">{getFeedback()}</p>
												</motion.div>
											)
										})}
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>
						</TabsContent>

						{/* Insights Tab */}
						<TabsContent value="insights" className="space-y-5 sm:space-y-6 mt-0">
							{/* Highlights */}
							{explanation.highlights && explanation.highlights.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-yellow-500/30 shadow-2xl rounded-3xl overflow-hidden relative">
										<div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-amber-500/5 pointer-events-none" />
										<EnhancedCardHeader className="pb-4 relative z-10">
											<EnhancedCardTitle className="text-xl sm:text-2xl flex items-center gap-3">
												<div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
													<Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
												</div>
												<span className="bg-gradient-to-r from-yellow-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent font-extrabold">
													Highlights
												</span>
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-4 relative z-10">
											{explanation.highlights.map((highlight: string, index: number) => (
												<motion.div
													key={index}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: 0.2 + index * 0.05 }}
													className="flex items-start gap-4 p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800/70 hover:border-yellow-500/30 transition-all duration-300"
												>
													<div className="w-2.5 h-2.5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
													<p className="text-sm sm:text-base text-zinc-200 leading-relaxed flex-1">{highlight}</p>
												</motion.div>
											))}
										</EnhancedCardContent>
									</EnhancedCard>
								</motion.div>
							)}

							{/* Strengths */}
							{explanation.notes?.strengths && explanation.notes.strengths.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.2 }}
								>
									<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-green-500/30 shadow-2xl rounded-3xl overflow-hidden relative">
										<div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 pointer-events-none" />
										<EnhancedCardHeader className="pb-4 relative z-10">
											<EnhancedCardTitle className="text-xl sm:text-2xl flex items-center gap-3">
												<div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
													<Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
												</div>
												<span className="bg-gradient-to-r from-green-200 via-emerald-100 to-teal-200 bg-clip-text text-transparent font-extrabold">
													Strengths
												</span>
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-4 relative z-10">
											{explanation.notes.strengths.map((strength: string, index: number) => (
												<motion.div
													key={index}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: 0.3 + index * 0.05 }}
													className="flex items-start gap-4 p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800/70 hover:border-green-500/30 transition-all duration-300"
												>
													<div className="w-2.5 h-2.5 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
													<p className="text-sm sm:text-base text-zinc-200 leading-relaxed flex-1">{strength}</p>
												</motion.div>
											))}
										</EnhancedCardContent>
									</EnhancedCard>
								</motion.div>
							)}

							{/* Weaknesses */}
							{explanation.notes?.weaknesses && explanation.notes.weaknesses.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
								>
									<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-orange-500/30 shadow-2xl rounded-3xl overflow-hidden relative">
										<div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-red-500/5 pointer-events-none" />
										<EnhancedCardHeader className="pb-4 relative z-10">
											<EnhancedCardTitle className="text-xl sm:text-2xl flex items-center gap-3">
												<div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
													<Target className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
												</div>
												<span className="bg-gradient-to-r from-orange-200 via-amber-100 to-red-200 bg-clip-text text-transparent font-extrabold">
													Areas for Improvement
												</span>
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-4 relative z-10">
											{explanation.notes.weaknesses.map((weakness: string, index: number) => (
												<motion.div
													key={index}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: 0.4 + index * 0.05 }}
													className="flex items-start gap-4 p-3 sm:p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800/70 hover:border-orange-500/30 transition-all duration-300"
												>
													<div className="w-2.5 h-2.5 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
													<p className="text-sm sm:text-base text-zinc-200 leading-relaxed flex-1">{weakness}</p>
												</motion.div>
											))}
										</EnhancedCardContent>
									</EnhancedCard>
								</motion.div>
							)}

							{/* Top Archetype Matches */}
							{explanation.top_archetype_matches && explanation.top_archetype_matches.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
							>
								<EnhancedCard variant="default" className="bg-zinc-900/90 backdrop-blur-xl border-purple-500/30 shadow-2xl rounded-3xl overflow-hidden relative">
									<div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-pink-500/5 pointer-events-none" />
									<EnhancedCardHeader className="pb-4 relative z-10">
										<EnhancedCardTitle className="text-xl sm:text-2xl flex items-center gap-3">
											<div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30">
												<Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
											</div>
											<span className="bg-gradient-to-r from-purple-200 via-fuchsia-100 to-pink-200 bg-clip-text text-transparent font-extrabold">
												Top Career Archetype Matches
											</span>
										</EnhancedCardTitle>
									</EnhancedCardHeader>
									<EnhancedCardContent className="space-y-3 sm:space-y-4 relative z-10">
										{explanation.top_archetype_matches.map((match: { name: string; match_pct: number }, index: number) => (
											<motion.div
												key={index}
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												transition={{ delay: 0.5 + index * 0.05 }}
												className="flex items-center justify-between p-4 sm:p-5 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl hover:bg-zinc-800/70 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300"
											>
												<div className="flex items-center gap-3 sm:gap-4">
													<div className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-fuchsia-400 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
													<span className="text-sm sm:text-base font-semibold text-white">{match.name}</span>
												</div>
												<Badge className="bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 text-purple-200 border-purple-500/50 px-3 py-1.5 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.3)]">
													{match.match_pct}% match
												</Badge>
											</motion.div>
										))}
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>
							)}
						</TabsContent>

					</Tabs>
				</div>
			</div>
		</DashboardLayout>
	)
}

