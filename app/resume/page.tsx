"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
	Upload,
	FileText,
	Trophy,
	Sparkles,
	ArrowRight,
	CheckCircle,
	X,
	Zap,
	BarChart2,
	Star,
	Target,
	Brain,
	Lock,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { cn } from "@/lib/utils"
import AnimatedCounter from "@/components/ui/animated-counter"
import { getStoredAccessToken } from "@/lib/auth-storage"

// Mock competitive scores data
const competitiveScores = [
	{ name: "Sarah Chen", score: 87, rank: 1, change: "+3" },
	{ name: "Michael Park", score: 82, rank: 2, change: "+5" },
	{ name: "Emily Rodriguez", score: 78, rank: 3, change: "+2" },
	{ name: "David Kim", score: 75, rank: 4, change: "+1" },
	{ name: "Jessica Lee", score: 72, rank: 5, change: "+4" },
]

// Enhanced example scores with competitive context
const exampleScores = [
	{ 
		name: "Max", 
		scores: [87, 92, 85],
		context: "Stanford",
		type: "school" as const
	},
	{ 
		name: "Emma", 
		scores: [78, 84, 76],
		context: "MIT",
		type: "school" as const
	},
	{ 
		name: "3 others", 
		scores: [72, 68, 75],
		context: "from your network",
		type: "network" as const
	},
	{ 
		name: "Sarah", 
		scores: [91, 88, 93],
		context: "UC Berkeley",
		type: "school" as const
	},
	{ 
		name: "5 people", 
		scores: [65, 71, 68],
		context: "in your field",
		type: "field" as const
	},
	{ 
		name: "Alex", 
		scores: [82, 79, 85],
		context: "Harvard",
		type: "school" as const
	},
]

export default function ResumePage() {
	const isAuthorized = useRequireAuth()
	const router = useRouter()
  const [uploadState, setUploadState] = useState<"initial" | "uploading" | "processing" | "complete" | "error">(
    "initial",
  )
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [score, setScore] = useState<number | null>(null)
	const [currentExample, setCurrentExample] = useState(0)
	const [resumeAnalysis, setResumeAnalysis] = useState<{
		score: number
		parsed: {
			components: {
				education: number
				experience: number
    skills: number
				ai_signal: number
				projects: number
			}
			explanation: {
				highlights: string[]
				notes: {
					strengths: string[]
					weaknesses: string[]
				}
			}
		}
  } | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [showFullReport, setShowFullReport] = useState(false)
	const [userSchool, setUserSchool] = useState<string | null>(null)
	const fileInputRef = React.useRef<HTMLInputElement>(null)

	const PARSER_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"
	const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

	// Fetch user's school from profile to personalize examples
	useEffect(() => {
		if (!isAuthorized) return

		async function fetchUserSchool() {
			try {
				const token = getStoredAccessToken()
				if (!token) return

				const response = await fetch(`${API_BASE_URL}v1/users/profile/get_own_profile`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				})

				if (response.ok) {
					const result = await response.json()
					const profile = result?.data || result
					
					// Try to get school from CV data
					const cvProfile = profile?.resume?.profile || profile?.resume
					if (cvProfile?.education && Array.isArray(cvProfile.education) && cvProfile.education.length > 0) {
						// Get most recent or current education
						const currentEdu = cvProfile.education.find((edu: any) => !edu.end_date) 
							|| cvProfile.education.sort((a: any, b: any) => (b.start_date || "").localeCompare(a.start_date || ""))[0]
						
						if (currentEdu?.school) {
							setUserSchool(currentEdu.school)
							console.log("[Resume] Found user school:", currentEdu.school)
						}
					}
				}
			} catch (error) {
				console.warn("[Resume] Failed to fetch user school:", error)
			}
		}

		fetchUserSchool()
	}, [isAuthorized])

	// Rotate through example scores
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentExample((prev) => (prev + 1) % exampleScores.length)
		}, 3500) // Slightly longer to read the enhanced content
		return () => clearInterval(interval)
	}, [])
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setUploadState("uploading")
			setUploadProgress(0)
			handleFileUpload(selectedFile)
    }
  }

	const handleFileUpload = async (uploadedFile: File) => {
		try {
			setErrorMessage(null)
			
			// Get authentication token
			const token = getStoredAccessToken()
			if (!token) {
				setErrorMessage("Authentication required. Please log in again.")
				setUploadState("error")
				return
			}
			
			// Validate file size (max 10MB)
			if (uploadedFile.size > 10 * 1024 * 1024) {
				setErrorMessage("File size must be less than 10MB")
				setUploadState("error")
				return
			}

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
					if (prev >= 90) {
          clearInterval(uploadInterval)
						return 90
        }
        return prev + 10
      })
			}, 200)

			// Prepare form data
			const formData = new FormData()
			formData.append("file", uploadedFile)

			// Call the API
			setUploadState("processing")
			setUploadProgress(100)
			
			const response = await fetch(`${PARSER_API_BASE_URL}v2/parser/resume/store/score`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (!response.ok) {
				const errorText = await response.text()
				console.error("[Resume Score] API error:", response.status, errorText)
				throw new Error(`Failed to analyze resume: ${response.status}`)
			}

			const result = await response.json()
			console.log("[Resume Score] API response:", result)

			// Map API response to our state
			setScore(result.score || result.parsed?.overall_score || 0)
			setResumeAnalysis(result)
          setUploadState("complete")
		} catch (error) {
			console.error("[Resume Score] Error:", error)
			setErrorMessage(
				error instanceof Error 
					? error.message 
					: "Failed to analyze resume. Please try again."
			)
			setUploadState("error")
		}
  }

  const resetUpload = () => {
    setUploadState("initial")
    setUploadProgress(0)
    setProcessingProgress(0)
    setFile(null)
    setScore(null)
		setResumeAnalysis(null)
		setErrorMessage(null)
		setShowFullReport(false)
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	// Enhance example data with user's school if available
	const getEnhancedExampleData = () => {
		const baseExample = exampleScores[currentExample] || exampleScores[0]
		if (!baseExample) return exampleScores[0]
		
		// If user has a school and we're showing a school example, personalize it
		if (userSchool && baseExample.type === "school" && Math.random() > 0.5) {
			// Sometimes show user's own school for extra engagement
			return {
				...baseExample,
				context: userSchool,
				name: "Your peers",
			}
		}
		
		return baseExample
	}

	const currentExampleData = getEnhancedExampleData()

  return (
		<DashboardLayout>
			<div className="min-h-screen pb-20">
				<div className="max-w-md mx-auto px-4 py-4 sm:py-6">
					{uploadState === "initial" && (
						<div className="space-y-4 sm:space-y-6">
							{/* Hero Section */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								className="text-center mb-6 sm:mb-8"
							>
								<div className="flex justify-center mb-3 sm:mb-4">
									<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
										<Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
									</div>
								</div>
								<h1 className="text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
									Let's Measure Your Progress
								</h1>
								<p className="text-sm sm:text-base text-zinc-400 mb-4 sm:mb-6 px-2">
									See how your resume stacks up
								</p>

								{/* Rotating Example Scores - Enhanced */}
								{currentExampleData && (
									<AnimatePresence mode="wait">
										<motion.div
											key={currentExample}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											transition={{ duration: 0.3 }}
											className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-blue-500/30 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
										>
											<div className="flex flex-col items-center gap-2 sm:gap-3">
												{currentExampleData.type === "school" ? (
													<>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm text-center">
															<span className="text-zinc-300">
																People from <strong className="text-white font-bold">{currentExampleData.context}</strong> have scores:
															</span>
														</div>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
															{currentExampleData.scores.map((s, idx) => (
																<Badge
																	key={idx}
																	className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 font-extrabold shadow-[0_0_10px_rgba(139,92,246,0.4)]"
																>
																	{s}
																</Badge>
															))}
														</div>
														<div className="text-[10px] sm:text-xs text-zinc-500 mt-1">
															<strong className="text-white">{currentExampleData.name}</strong> scored {Math.max(...currentExampleData.scores)}
														</div>
													</>
												) : currentExampleData.type === "network" ? (
													<>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm text-center">
															<span className="text-zinc-300">
																<strong className="text-white font-bold">{currentExampleData.name}</strong> {currentExampleData.context} have scores:
															</span>
														</div>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
															{currentExampleData.scores.map((s, idx) => (
																<Badge
																	key={idx}
																	className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 font-extrabold shadow-[0_0_10px_rgba(139,92,246,0.4)]"
																>
																	{s}
																</Badge>
															))}
														</div>
													</>
												) : (
													<>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm text-center">
															<span className="text-zinc-300">
																<strong className="text-white font-bold">{currentExampleData.name}</strong> {currentExampleData.context} have scores:
															</span>
														</div>
														<div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
															{currentExampleData.scores.map((s, idx) => (
																<Badge
																	key={idx}
																	className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 font-extrabold shadow-[0_0_10px_rgba(139,92,246,0.4)]"
																>
																	{s}
																</Badge>
															))}
														</div>
													</>
												)}
											</div>
										</motion.div>
									</AnimatePresence>
								)}
							</motion.div>

							{/* Upload Section */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.5 }}
							>
								<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
									<EnhancedCardHeader className="pb-3">
										<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
											<FileText className="h-5 w-5 text-blue-400" />
											Upload Your Resume
										</EnhancedCardTitle>
									</EnhancedCardHeader>
									<EnhancedCardContent className="space-y-4">
										<div
											className={cn(
												"border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer",
												file
													? "border-green-500/50 bg-green-500/10"
													: "border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5",
											)}
											onClick={() => fileInputRef.current?.click()}
										>
                  <input
												ref={fileInputRef}
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                      {file ? (
												<motion.div
													initial={{ scale: 0.9 }}
													animate={{ scale: 1 }}
													className="flex flex-col items-center"
												>
													<CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 mb-3" />
													<div className="flex items-center gap-2 bg-zinc-800 px-3 sm:px-4 py-2 rounded-lg mb-2 max-w-full">
														<FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
														<span className="text-xs sm:text-sm font-medium text-white truncate max-w-[180px] sm:max-w-[200px]">
															{file.name}
														</span>
														<button
                            onClick={(e) => {
																e.stopPropagation()
                              setFile(null)
                            }}
															className="ml-2 text-zinc-400 hover:text-white flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
														</button>
                        </div>
													<p className="text-xs text-zinc-400">Tap to change file</p>
												</motion.div>
											) : (
												<div className="flex flex-col items-center">
													<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-3 sm:mb-4">
														<Upload className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
													</div>
													<p className="text-sm sm:text-base text-zinc-300 mb-1 font-medium">Tap to upload resume</p>
													<p className="text-xs sm:text-sm text-zinc-500 mb-2">or drag and drop</p>
													<p className="text-xs text-zinc-600">PDF, DOC, DOCX</p>
                    </div>
											)}
                </div>

									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>
                </div>
					)}

					{/* Uploading State */}
          {uploadState === "uploading" && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							<EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
								<EnhancedCardHeader className="pb-3">
									<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
										<Upload className="h-5 w-5 text-blue-400" />
										Uploading Resume
									</EnhancedCardTitle>
								</EnhancedCardHeader>
								<EnhancedCardContent className="space-y-4">
									<div className="flex items-center justify-center py-6 sm:py-8">
										<motion.div
											animate={{ rotate: 360 }}
											transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
											className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent"
										/>
                </div>
                <div className="space-y-2">
										<div className="flex items-center justify-between text-xs sm:text-sm">
											<span className="text-zinc-300 truncate pr-2">{file?.name}</span>
											<span className="text-blue-400 font-bold">{uploadProgress}%</span>
                  </div>
										<Progress value={uploadProgress} className="h-2 sm:h-3 bg-zinc-800" />
                </div>
								</EnhancedCardContent>
							</EnhancedCard>
						</motion.div>
          )}

					{/* Processing State */}
          {uploadState === "processing" && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							<EnhancedCard variant="gradient" className="bg-zinc-900/80 border-purple-700/40 shadow-xl rounded-2xl">
								<EnhancedCardHeader className="pb-3">
									<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
										<Sparkles className="h-5 w-5 text-purple-400" />
										Analyzing Resume
									</EnhancedCardTitle>
								</EnhancedCardHeader>
								<EnhancedCardContent className="space-y-4">
									<div className="flex items-center justify-center py-6 sm:py-8">
										<div className="relative">
											<motion.div
												animate={{ rotate: 360 }}
												transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
												className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-blue-500 border-l-transparent"
											/>
											<Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                  </div>
									<p className="text-center text-xs sm:text-sm text-zinc-400">AI is analyzing your resume...</p>
								</EnhancedCardContent>
							</EnhancedCard>
						</motion.div>
					)}

					{/* Error State */}
					{uploadState === "error" && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
						>
							<EnhancedCard variant="default" className="bg-zinc-900/80 border-red-700/40 shadow-xl rounded-2xl">
								<EnhancedCardHeader className="pb-3">
									<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2 text-red-400">
										<X className="h-5 w-5" />
										Upload Error
									</EnhancedCardTitle>
								</EnhancedCardHeader>
								<EnhancedCardContent className="space-y-4">
									<div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
										<p className="text-red-400 mb-2 font-medium">{errorMessage || "Failed to analyze resume"}</p>
										<p className="text-xs sm:text-sm text-zinc-400">
											Please make sure your file is in a supported format (PDF, DOC, DOCX) and under 10MB.
										</p>
                </div>
									<EnhancedButton
										variant="gradient"
										className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
										onClick={resetUpload}
									>
										Try Again
									</EnhancedButton>
								</EnhancedCardContent>
							</EnhancedCard>
						</motion.div>
          )}

					{/* Complete State */}
					{uploadState === "complete" && score !== null && resumeAnalysis?.parsed && (
						<div className="space-y-4 sm:space-y-6">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
								className="text-center mb-4 sm:mb-6"
							>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 200, damping: 15 }}
									className="inline-block mb-3 sm:mb-4"
								>
									<Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400" />
								</motion.div>
								<h2 className="text-2xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
									Your Resume Score: {score}
								</h2>
								<p className="text-xs sm:text-sm text-zinc-400">Here's your current progress and personalized insights</p>
							</motion.div>

							{/* Score Breakdown */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.5 }}
							>
								<EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
									<EnhancedCardHeader className="pb-3">
										<EnhancedCardTitle className="text-lg sm:text-xl">Score Breakdown</EnhancedCardTitle>
									</EnhancedCardHeader>
									<EnhancedCardContent className="space-y-4">
										{[
											{ name: "Experience", score: resumeAnalysis.parsed.components.experience },
											{ name: "Skills", score: resumeAnalysis.parsed.components.skills },
											{ name: "Education", score: resumeAnalysis.parsed.components.education },
											{ name: "Projects", score: resumeAnalysis.parsed.components.projects },
										].map((section, index) => {
											// Get feedback from strengths/weaknesses
											let feedback = ""
											if (section.score >= 80) {
												feedback = resumeAnalysis.parsed.explanation.notes.strengths[0] || "Strong performance in this area"
											} else if (section.score >= 60) {
												feedback = "Good foundation, room for improvement"
											} else {
												feedback = resumeAnalysis.parsed.explanation.notes.weaknesses[0] || "Consider enhancing this section"
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
													<p className="text-xs text-zinc-400 mt-2">{feedback}</p>
                      </div>
											)
										})}
									</EnhancedCardContent>
								</EnhancedCard>
							</motion.div>

							{/* Locked Insights Section */}
							{!showFullReport && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3, duration: 0.5 }}
								>
									<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl relative overflow-hidden">
										{/* Blur overlay */}
										<div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
											<Lock className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-600 mb-4" />
											<p className="text-zinc-400 text-sm sm:text-base mb-4 text-center px-4">
												Unlock detailed insights
											</p>
											<EnhancedButton
												variant="gradient"
												animation="shimmer"
												className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
												onClick={() => setShowFullReport(true)}
												rightIcon={<ArrowRight className="h-4 w-4" />}
											>
												View Full Report
											</EnhancedButton>
                          </div>
										<EnhancedCardHeader className="pb-3">
											<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
												<Brain className="h-5 w-5 text-purple-400" />
												Detailed Insights
											</EnhancedCardTitle>
										</EnhancedCardHeader>
										<EnhancedCardContent className="space-y-4 opacity-30">
											{/* Highlights Preview */}
											{resumeAnalysis.parsed.explanation.highlights && resumeAnalysis.parsed.explanation.highlights.length > 0 && (
                      <div>
													<div className="flex items-center gap-2 mb-2">
														<Sparkles className="h-4 w-4 text-yellow-400" />
														<span className="text-sm font-medium text-white">Highlights</span>
                          </div>
													<div className="space-y-2 pl-6">
														{resumeAnalysis.parsed.explanation.highlights.slice(0, 2).map((highlight, index) => (
															<div key={index} className="flex items-start space-x-3">
																<div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
																<p className="text-sm text-zinc-300">{highlight}</p>
                        </div>
														))}
														{resumeAnalysis.parsed.explanation.highlights.length > 2 && (
															<p className="text-xs text-zinc-500">+{resumeAnalysis.parsed.explanation.highlights.length - 2} more</p>
														)}
                      </div>
                    </div>
											)}

											{/* Strengths Preview */}
											{resumeAnalysis.parsed.explanation.notes.strengths && resumeAnalysis.parsed.explanation.notes.strengths.length > 0 && (
												<div>
													<div className="flex items-center gap-2 mb-2">
														<Star className="h-4 w-4 text-green-400" />
														<span className="text-sm font-medium text-white">Strengths</span>
                  </div>
													<div className="space-y-2 pl-6">
														{resumeAnalysis.parsed.explanation.notes.strengths.slice(0, 2).map((strength, index) => (
															<div key={index} className="flex items-start space-x-3">
																<div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
																<p className="text-sm text-zinc-300">{strength}</p>
                    </div>
														))}
														{resumeAnalysis.parsed.explanation.notes.strengths.length > 2 && (
															<p className="text-xs text-zinc-500">+{resumeAnalysis.parsed.explanation.notes.strengths.length - 2} more</p>
														)}
                    </div>
                  </div>
											)}

											{/* Weaknesses Preview */}
											{resumeAnalysis.parsed.explanation.notes.weaknesses && resumeAnalysis.parsed.explanation.notes.weaknesses.length > 0 && (
                    <div>
													<div className="flex items-center gap-2 mb-2">
														<Target className="h-4 w-4 text-orange-400" />
														<span className="text-sm font-medium text-white">Areas for Improvement</span>
                    </div>
													<div className="space-y-2 pl-6">
														{resumeAnalysis.parsed.explanation.notes.weaknesses.slice(0, 2).map((weakness, index) => (
															<div key={index} className="flex items-start space-x-3">
																<div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
																<p className="text-sm text-zinc-300">{weakness}</p>
                  </div>
														))}
														{resumeAnalysis.parsed.explanation.notes.weaknesses.length > 2 && (
															<p className="text-xs text-zinc-500">+{resumeAnalysis.parsed.explanation.notes.weaknesses.length - 2} more</p>
														)}
                    </div>
                  </div>
											)}
										</EnhancedCardContent>
									</EnhancedCard>
								</motion.div>
							)}

							{/* Full Report - Unlocked */}
							{showFullReport && (
								<>
									{/* Highlights */}
									{resumeAnalysis.parsed.explanation.highlights && resumeAnalysis.parsed.explanation.highlights.length > 0 && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.1, duration: 0.5 }}
										>
											<EnhancedCard variant="default" className="bg-zinc-900/80 border-zinc-800 shadow-xl rounded-2xl">
												<EnhancedCardHeader className="pb-3">
													<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
														<Sparkles className="h-5 w-5 text-yellow-400" />
														Highlights
													</EnhancedCardTitle>
												</EnhancedCardHeader>
												<EnhancedCardContent className="space-y-3">
													{resumeAnalysis.parsed.explanation.highlights.map((highlight, index) => (
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
									{resumeAnalysis.parsed.explanation.notes.strengths && resumeAnalysis.parsed.explanation.notes.strengths.length > 0 && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.2, duration: 0.5 }}
										>
											<EnhancedCard variant="default" className="bg-zinc-900/80 border-green-700/40 shadow-xl rounded-2xl">
												<EnhancedCardHeader className="pb-3">
													<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
														<Star className="h-5 w-5 text-green-400" />
														Strengths
													</EnhancedCardTitle>
												</EnhancedCardHeader>
												<EnhancedCardContent className="space-y-3">
													{resumeAnalysis.parsed.explanation.notes.strengths.map((strength, index) => (
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
									{resumeAnalysis.parsed.explanation.notes.weaknesses && resumeAnalysis.parsed.explanation.notes.weaknesses.length > 0 && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: 0.3, duration: 0.5 }}
										>
											<EnhancedCard variant="default" className="bg-zinc-900/80 border-orange-700/40 shadow-xl rounded-2xl">
												<EnhancedCardHeader className="pb-3">
													<EnhancedCardTitle className="text-lg sm:text-xl flex items-center gap-2">
														<Target className="h-5 w-5 text-orange-400" />
														Areas for Improvement
													</EnhancedCardTitle>
												</EnhancedCardHeader>
												<EnhancedCardContent className="space-y-3">
													{resumeAnalysis.parsed.explanation.notes.weaknesses.map((weakness, index) => (
														<div key={index} className="flex items-start space-x-3">
															<div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
															<p className="text-sm text-zinc-300">{weakness}</p>
                </div>
													))}
												</EnhancedCardContent>
											</EnhancedCard>
										</motion.div>
									)}
								</>
							)}

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5, duration: 0.5 }}
								className="flex flex-col sm:flex-row gap-3"
							>
								<EnhancedButton
									variant="outline"
									className="flex-1 border-zinc-700 text-white hover:bg-zinc-800 text-sm sm:text-base"
                  onClick={resetUpload}
                >
									Upload Another
								</EnhancedButton>
								<EnhancedButton
									variant="gradient"
									animation="shimmer"
									className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-sm sm:text-base"
									rightIcon={<BarChart2 className="h-4 w-4" />}
									onClick={() => {
										// Store resume data in localStorage for the report page
										if (resumeAnalysis) {
											try {
												localStorage.setItem("resume.analysis", JSON.stringify(resumeAnalysis))
											} catch (error) {
												console.warn("[Resume] Failed to store analysis data:", error)
											}
										}
										// Navigate to report page with score
										router.push(`/resume/report?score=${score}`)
									}}
								>
									View Full Report
								</EnhancedButton>
							</motion.div>
						</div>
          )}
        </div>
    </div>
		</DashboardLayout>
  )
}
