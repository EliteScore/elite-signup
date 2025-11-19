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
			<div className="min-h-screen pb-20">
				<div className="max-w-md mx-auto px-4 py-4 sm:py-6">
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center gap-3 mb-4 sm:mb-6"
					>
						<EnhancedButton
							variant="ghost"
							size="sm"
							rounded="full"
							className="text-zinc-400 hover:text-white -ml-2"
							onClick={() => router.back()}
							leftIcon={<ArrowLeft className="h-4 w-4" />}
						>
							<span className="hidden sm:inline">Back</span>
						</EnhancedButton>
						<h1 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex-1 text-center sm:text-left">
							Full Report
						</h1>
						<div className="w-12 sm:w-20" /> {/* Spacer for centering */}
					</motion.div>

					{/* Score Hero Section */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="mb-4 sm:mb-6"
					>
						<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
							<div className="p-6 sm:p-8">
								<div className="flex flex-col items-center gap-6">
									{/* Circular Progress */}
									<div className="relative">
										<svg className="w-32 h-32 sm:w-36 sm:h-36" viewBox="0 0 100 100">
											{/* Background circle */}
											<circle
												cx="50"
												cy="50"
												r="45"
												fill="none"
												stroke="#27272a"
												strokeWidth="8"
											/>
											{/* Progress circle */}
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
											/>
											<defs>
												<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="#3b82f6" />
													<stop offset="50%" stopColor="#a855f7" />
													<stop offset="100%" stopColor="#ec4899" />
												</linearGradient>
											</defs>
										</svg>
										<div className="absolute inset-0 flex flex-col items-center justify-center">
											<AnimatedCounter
												from={0}
												to={score}
												duration={2}
												className="text-4xl sm:text-5xl font-extrabold text-white"
											/>
										</div>
									</div>
									
									{/* Score Info */}
									<div className="text-center w-full space-y-4">
										{/* Title */}
										<div className="flex items-center justify-center gap-2.5">
											<BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" strokeWidth={2.5} />
											<h2 className="text-xl sm:text-2xl font-extrabold text-white">Resume Score</h2>
										</div>
									</div>
								</div>
							</div>
						</EnhancedCard>
					</motion.div>

					{/* Tabs */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 mb-4 sm:mb-6 grid grid-cols-2 w-full h-10 sm:h-12">
							<TabsTrigger
								value="overview"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm"
							>
								<BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Overview</span>
								<span className="sm:hidden">Stats</span>
							</TabsTrigger>
							<TabsTrigger
								value="insights"
								className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm"
							>
								<Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								Insights
							</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-0">
							{/* Performance Metrics - Mobile First */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="grid grid-cols-2 gap-2 sm:gap-3"
							>
								<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800">
									<EnhancedCardContent className="p-3 sm:p-4 text-center">
										<div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
											{score}
										</div>
										<div className="text-[10px] sm:text-xs text-zinc-400 mt-1">Score</div>
									</EnhancedCardContent>
								</EnhancedCard>
								<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800">
									<EnhancedCardContent className="p-3 sm:p-4 text-center">
										<div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
											{100 - score}
										</div>
										<div className="text-[10px] sm:text-xs text-zinc-400 mt-1">To 100</div>
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>

							{/* Score Breakdown */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
									<EnhancedCardHeader className="pb-3">
										<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
											<BarChart3 className="h-5 w-5 text-blue-400" />
											Score Breakdown
										</EnhancedCardTitle>
									</EnhancedCardHeader>
									<EnhancedCardContent className="space-y-4">
										{[
											{ name: "Experience", score: components.experience || 0, icon: Briefcase },
											{ name: "Skills", score: components.skills || 0, icon: Code },
											{ name: "Education", score: components.education || 0, icon: GraduationCap },
											{ name: "Projects", score: components.projects || 0, icon: FileText },
											{ name: "AI Signal", score: components.ai_signal || 0, icon: Sparkles },
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

											return (
												<div key={section.name} className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-3 sm:p-4">
													<div className="flex justify-between items-center mb-2">
														<span className="text-sm font-medium text-white">{section.name}</span>
														<span className="text-sm font-bold text-blue-400">{Math.round(section.score)}/100</span>
													</div>
													<AnimatedProgress
														value={section.score}
														max={100}
														className="h-2 bg-zinc-700 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500"
														delay={0.5 + index * 0.1}
													/>
													<p className="text-xs text-zinc-400 mt-2">{getFeedback()}</p>
												</div>
											)
										})}
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>
						</TabsContent>

						{/* Insights Tab */}
						<TabsContent value="insights" className="space-y-4 sm:space-y-6 mt-0">
							{/* Highlights */}
							{explanation.highlights && explanation.highlights.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 }}
								>
									<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
										<EnhancedCardHeader className="pb-3">
											<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
												<Sparkles className="h-5 w-5 text-yellow-400" />
												Highlights
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-3">
											{explanation.highlights.map((highlight: string, index: number) => (
												<div key={index} className="flex items-start space-x-3">
													<div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
													<p className="text-sm text-zinc-300">{highlight}</p>
												</div>
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
									<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
										<EnhancedCardHeader className="pb-3">
											<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
												<Star className="h-5 w-5 text-green-400" />
												Strengths
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-3">
											{explanation.notes.strengths.map((strength: string, index: number) => (
												<div key={index} className="flex items-start space-x-3">
													<div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
													<p className="text-sm text-zinc-300">{strength}</p>
												</div>
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
									<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
										<EnhancedCardHeader className="pb-3">
											<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
												<Target className="h-5 w-5 text-orange-400" />
												Areas for Improvement
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-3">
											{explanation.notes.weaknesses.map((weakness: string, index: number) => (
												<div key={index} className="flex items-start space-x-3">
													<div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
													<p className="text-sm text-zinc-300">{weakness}</p>
												</div>
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
									<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
										<EnhancedCardHeader className="pb-3">
											<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
												<Users className="h-5 w-5 text-purple-400" />
												Top Career Archetype Matches
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-3">
											{explanation.top_archetype_matches.map((match: { name: string; match_pct: number }, index: number) => (
												<div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
													<div className="flex items-center gap-3">
														<div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
														<span className="text-sm font-medium text-white">{match.name}</span>
													</div>
													<Badge className="bg-purple-900/50 text-purple-300 border-purple-700/50">
														{match.match_pct}% match
													</Badge>
												</div>
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

