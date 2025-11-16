"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, FileText, Upload, X, Info, Sparkles } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getStoredAccessToken } from "@/lib/auth-storage"

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
const PARSER_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: {
			type: "spring" as const,
			stiffness: 300,
			damping: 24,
		},
	},
}

export default function CvUploadPage() {
	const isAuthorized = useRequireAuth()
	const router = useRouter()
	const [uploadState, setUploadState] = useState<"initial" | "uploading" | "processing" | "complete" | "error">(
		"initial",
	)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [processingProgress, setProcessingProgress] = useState(0)
	const [file, setFile] = useState<File | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [parsedData, setParsedData] = useState<any>(null)

	if (!isAuthorized) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-black">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
			</div>
		)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0]
			// Validate file type
			const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
			if (!validTypes.includes(selectedFile.type)) {
				setErrorMessage("Please upload a PDF, DOC, or DOCX file")
				return
			}
			// Validate file size (max 10MB)
			if (selectedFile.size > 10 * 1024 * 1024) {
				setErrorMessage("File size must be less than 10MB")
				return
			}
			setFile(selectedFile)
			setErrorMessage(null)
		}
	}

	const handleUpload = async () => {
		if (!file) return

		setUploadState("uploading")
		setUploadProgress(0)
		setErrorMessage(null)

		try {
			const token = getStoredAccessToken()
			if (!token) {
				setErrorMessage("Authentication required. Please log in again.")
				setUploadState("error")
				return
			}

			// Step 1: Upload file to parser API
			console.log("[CV Upload] Starting file upload to parser API...")
			const formData = new FormData()
			formData.append("file", file)

			// Simulate upload progress
			setUploadProgress(30)

			const parserResponse = await fetch(`${PARSER_API_BASE_URL}v2/parser/resume/cv`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			setUploadProgress(60)

			if (!parserResponse.ok) {
				const errorText = await parserResponse.text()
				console.error("[CV Upload] Parser API error:", errorText)
				throw new Error(`Failed to parse resume: ${parserResponse.status}`)
			}

			const parsedResult = await parserResponse.json()
			console.log("[CV Upload] Resume parsed successfully:", parsedResult)

			setUploadProgress(100)
			setParsedData(parsedResult)

			// Move to processing state to save to user profile
			setUploadState("processing")
			await saveToProfile(parsedResult, token)

		} catch (error) {
			console.error("[CV Upload] Error:", error)
			setErrorMessage(
				error instanceof Error 
					? error.message 
					: "Failed to upload and process resume. Please try again."
			)
			setUploadState("error")
		}
	}

	// Type definitions matching backend schema
	type ExperienceEntry = {
		title?: string
		company?: string
		employment_type?: string | null
		location?: string | null
		start_date?: string | null
		end_date?: string | null
		is_current?: boolean
		description?: string | null
		achievements?: string[]
	}

	type EducationEntry = {
		school?: string
		degree?: string
		field_of_study?: string | null
		start_date?: string | null
		end_date?: string | null
		grade?: string | null
		activities?: string | null
		description?: string | null
	}

	// Clean education entries - fixes "end_date=null," and whitespace keys
	const cleanEducationEntry = (raw: any): EducationEntry => {
		const fixed: EducationEntry = {}

		if (typeof raw.school === "string") fixed.school = raw.school
		if (typeof raw.degree === "string") fixed.degree = raw.degree
		if (typeof raw.field_of_study === "string") fixed.field_of_study = raw.field_of_study
		if (typeof raw.start_date === "string") fixed.start_date = raw.start_date
		if (typeof raw.end_date === "string" || raw.end_date === null) fixed.end_date = raw.end_date
		if (typeof raw.grade === "string") fixed.grade = raw.grade
		if (typeof raw.activities === "string") fixed.activities = raw.activities
		if (typeof raw.description === "string") fixed.description = raw.description

		// Handle cursed key from parser: "end_date=null,"
		if ("end_date=null," in raw) {
			const text = raw["end_date=null,"]
			if (!fixed.description && typeof text === "string") {
				fixed.description = text
			}
			if (!("end_date" in fixed)) {
				fixed.end_date = null
			}
		}

		// Handle random whitespace keys as extra description
		for (const [key, value] of Object.entries(raw)) {
			if (key.trim() === "" && typeof value === "string") {
				fixed.description = fixed.description
					? `${fixed.description} ${value}`
					: value
			}
		}

		return fixed
	}

	// Clean experience entries - fixes "end_date=null," and whitespace keys
	const cleanExperienceEntry = (raw: any): ExperienceEntry => {
		const cleaned: ExperienceEntry = {}

		if (typeof raw.title === "string") cleaned.title = raw.title
		if (typeof raw.company === "string") cleaned.company = raw.company
		if (typeof raw.employment_type === "string") cleaned.employment_type = raw.employment_type
		if (typeof raw.location === "string") cleaned.location = raw.location
		if (typeof raw.start_date === "string") cleaned.start_date = raw.start_date
		if (typeof raw.end_date === "string" || raw.end_date === null) {
			cleaned.end_date = raw.end_date
		}
		if (typeof raw.is_current === "boolean") cleaned.is_current = raw.is_current
		if (Array.isArray(raw.achievements)) cleaned.achievements = raw.achievements
		else cleaned.achievements = []

		// Description if parser already gave one
		if (typeof raw.description === "string") {
			cleaned.description = raw.description
		}

		// 1) Fix "end_date=null," garbage key
		if ("end_date=null," in raw) {
			const text = raw["end_date=null,"]
			if (!cleaned.description && typeof text === "string") {
				cleaned.description = text
			}
			if (!("end_date" in cleaned)) {
				cleaned.end_date = null
			}
		}

		// 2) Fix `"  "` / whitespace keys → description
		for (const [key, value] of Object.entries(raw)) {
			if (key.trim() === "" && typeof value === "string") {
				cleaned.description = cleaned.description
					? `${cleaned.description} ${value}`
					: value
			}
		}

		return cleaned
	}

	// Comprehensive normalizer for the entire CV payload
	const normalizeCvForPost = (cvData: any) => {
		const rawProfile = cvData.profile ?? cvData
		const profile: any = {}

		// Basics – just pass through as-is, backend will validate fields
		if (rawProfile.basics && typeof rawProfile.basics === "object") {
			profile.basics = rawProfile.basics
		}

		// Education
		if (Array.isArray(rawProfile.education)) {
			profile.education = rawProfile.education.map(cleanEducationEntry)
		} else {
			profile.education = []
		}

		// Experience
		if (Array.isArray(rawProfile.experience)) {
			profile.experience = rawProfile.experience.map(cleanExperienceEntry)
		} else {
			profile.experience = []
		}

		// Projects – clean and ensure proper shape
		if (Array.isArray(rawProfile.projects)) {
			profile.projects = rawProfile.projects.map((p: any) => ({
				name: p.name ?? null,
				description: p.description ?? null,
				start_date: p.start_date ?? null,
				end_date: p.end_date ?? null,
				url: p.url ?? null,
				highlights: Array.isArray(p.highlights) ? p.highlights : [],
				tech: Array.isArray(p.tech) ? p.tech : [],
			}))
		} else {
			profile.projects = []
		}

		// Handle extracurriculars - map to projects since backend doesn't know extracurriculars
		if (Array.isArray(rawProfile.extracurriculars)) {
			const extraProjects = rawProfile.extracurriculars.map((e: any) => ({
				name: e.title ?? e.name ?? null,
				description: e.description ?? null,
				start_date: e.start_date ?? null,
				end_date: e.end_date ?? null,
				url: e.url ?? null,
				highlights: Array.isArray(e.highlights) ? e.highlights : [],
				tech: Array.isArray(e.tech) ? e.tech : [],
			}))

			// Merge with existing projects
			profile.projects = [...profile.projects, ...extraProjects]
		}

		// Skills – make sure it's an array of strings
		if (Array.isArray(rawProfile.skills)) {
			profile.skills = rawProfile.skills.filter((s: any) => typeof s === "string")
		} else {
			profile.skills = []
		}

		// Honors_awards – pass through if array
		if (Array.isArray(rawProfile.honors_awards)) {
			profile.honors_awards = rawProfile.honors_awards
		} else {
			profile.honors_awards = []
		}

		// Optional stuff – keep if present
		if (Array.isArray(rawProfile.certifications)) {
			profile.certifications = rawProfile.certifications
		} else {
			profile.certifications = []
		}

		if (Array.isArray(rawProfile.languages)) {
			profile.languages = rawProfile.languages
		} else {
			profile.languages = []
		}

		if (Array.isArray(rawProfile.publications)) {
			profile.publications = rawProfile.publications
		} else {
			profile.publications = []
		}

		if (Array.isArray(rawProfile.volunteer)) {
			profile.volunteer = rawProfile.volunteer
		} else {
			profile.volunteer = []
		}

		// 🚫 Make sure NO random top-level junk is left
		return { profile }
	}

	const saveToProfile = async (cvData: any, token: string) => {
		setProcessingProgress(0)

		try {
			// Simulate progress
			setProcessingProgress(20)

			console.log("[CV Upload] Saving parsed data to user profile...")
			console.log("[CV Upload] Raw parsed data from parser API:", JSON.stringify(cvData, null, 2))

			// Normalize the entire CV payload to fix all parser issues
			const payloadToSend = normalizeCvForPost(cvData)
			
			console.log("[CV Upload] Payload being sent to PUT /v1/users/cv:", JSON.stringify(payloadToSend, null, 2))

			// Step 2: Save parsed CV to user profile using PUT /v1/users/cv
			const saveResponse = await fetch(`${API_BASE_URL}v1/users/cv`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payloadToSend),
			})

			console.log("[CV Upload] PUT response status:", saveResponse.status)
			setProcessingProgress(60)

			if (!saveResponse.ok) {
				const errorText = await saveResponse.text()
				console.error("[CV Upload] Save to profile error status:", saveResponse.status)
				console.error("[CV Upload] Save to profile error body:", errorText)
				throw new Error(`Failed to save CV to profile: ${saveResponse.status} - ${errorText}`)
			}

			const saveResult = await saveResponse.json()
			console.log("[CV Upload] CV saved to profile successfully:", saveResult)

			setProcessingProgress(100)

			// Small delay for smooth UI transition
			setTimeout(() => {
				setUploadState("complete")
			}, 500)

		} catch (error) {
			console.error("[CV Upload] Error saving to profile:", error)
			setErrorMessage(
				error instanceof Error 
					? error.message 
					: "Failed to save CV to your profile. Please try again."
			)
			setUploadState("error")
		}
	}

	const resetUpload = () => {
		setUploadState("initial")
		setUploadProgress(0)
		setProcessingProgress(0)
		setFile(null)
		setErrorMessage(null)
		setParsedData(null)
	}

	const handleContinue = () => {
		// Navigate back to profile after successful upload
		router.push("/profile")
	}

	return (
		<AppShell title="Upload CV" showBackButton={true} backUrl="/profile">
			{/* Background Elements */}
			<div className="absolute inset-0 z-0">
				<div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
				<div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
				<div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
			</div>

			<div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12">
				<motion.div
					className="w-full max-w-md space-y-6"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					{/* Header */}
					<motion.div className="text-center" variants={itemVariants}>
						<div className="flex justify-center mb-4">
							<div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_24px_0_rgba(80,0,255,0.5)]">
								<FileText className="h-8 w-8 text-white" />
							</div>
						</div>
						<h1 className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
							Upload Your CV
						</h1>
						<p className="mt-2 text-zinc-400 text-sm">Complete your profile by uploading your resume</p>
					</motion.div>

					{/* Initial Upload State */}
					{uploadState === "initial" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<CardTitle className="text-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
										Select Your Resume
									</CardTitle>
									<CardDescription className="text-zinc-400">
										Upload your CV in PDF, DOC, or DOCX format
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer group">
										<input
											type="file"
											id="cv-upload"
											className="hidden"
											accept=".pdf,.doc,.docx"
											onChange={handleFileChange}
										/>
										<label htmlFor="cv-upload" className="cursor-pointer">
											<div className="flex flex-col items-center">
												<div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
													<Upload className="h-8 w-8 text-purple-400" />
												</div>
												{file ? (
													<div className="flex items-center bg-zinc-800/50 px-4 py-3 rounded-lg border border-purple-500/30">
														<FileText className="h-5 w-5 mr-3 text-purple-400" />
														<span className="text-sm text-white truncate max-w-[250px]">{file.name}</span>
														<button
															type="button"
															className="ml-3 p-1 rounded-full hover:bg-zinc-700 transition-colors"
															onClick={(e) => {
																e.preventDefault()
																e.stopPropagation()
																setFile(null)
															}}
														>
															<X className="h-4 w-4 text-zinc-400" />
														</button>
													</div>
												) : (
													<>
														<p className="text-zinc-300 mb-1 font-medium">Drag and drop your resume here</p>
														<p className="text-zinc-500 text-sm">or click to browse files</p>
														<p className="text-zinc-600 text-xs mt-3">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
													</>
												)}
											</div>
										</label>
									</div>

									{errorMessage && (
										<div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
											{errorMessage}
										</div>
									)}

									<div className="bg-zinc-800/50 rounded-lg p-4 flex items-start">
										<Info className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0 mt-0.5" />
										<div className="text-sm text-zinc-400">
											<p className="mb-1">Your CV will be automatically parsed and your profile will be updated with:</p>
											<ul className="list-disc list-inside space-y-1 text-xs">
												<li>Personal information (name, contact, location)</li>
												<li>Work experience</li>
												<li>Education history</li>
												<li>Skills and certifications</li>
												<li>Projects and achievements</li>
											</ul>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									<EnhancedButton
										className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
										disabled={!file}
										onClick={handleUpload}
										variant="gradient"
										animation="shimmer"
										rounded="full"
									>
										Upload & Process
										<ArrowRight className="ml-2 h-4 w-4" />
									</EnhancedButton>
								</CardFooter>
							</Card>
						</motion.div>
					)}

					{/* Uploading State */}
					{uploadState === "uploading" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<CardTitle className="text-xl font-bold">Uploading Resume</CardTitle>
									<CardDescription className="text-zinc-400">Please wait while we upload your resume</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-center py-8">
										<div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-zinc-300">Uploading {file?.name}</span>
											<span className="text-purple-400 font-bold">{uploadProgress}%</span>
										</div>
										<Progress
											value={uploadProgress}
											className="h-2 bg-zinc-800"
											indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
										/>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{/* Processing State */}
					{uploadState === "processing" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<CardTitle className="text-xl font-bold">Saving to Profile</CardTitle>
									<CardDescription className="text-zinc-400">
										Updating your profile with the extracted information
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-center py-8">
										<div className="relative">
											<div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
											<Sparkles className="h-8 w-8 text-purple-400 absolute inset-0 m-auto animate-pulse" />
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-zinc-300">Saving to your profile...</span>
											<span className="text-purple-400 font-bold">{processingProgress}%</span>
										</div>
										<Progress
											value={processingProgress}
											className="h-2 bg-zinc-800"
											indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
										/>
									</div>
									<div className="text-sm text-zinc-400 italic text-center">This may take a few moments...</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{/* Complete State */}
					{uploadState === "complete" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
											Upload Complete!
										</CardTitle>
										<CheckCircle className="h-6 w-6 text-emerald-400" />
									</div>
									<CardDescription className="text-zinc-400">
										Your CV has been successfully processed and your profile has been updated
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-4">
										<p className="text-sm text-emerald-200">
											✓ Personal information extracted
										</p>
										<p className="text-sm text-emerald-200 mt-2">
											✓ Experience and education parsed
										</p>
										<p className="text-sm text-emerald-200 mt-2">
											✓ Skills and certifications identified
										</p>
									</div>
									<div className="bg-zinc-800/50 rounded-lg p-4">
										<p className="text-xs text-zinc-400">
											You can now view your updated profile or continue editing in settings.
										</p>
									</div>
								</CardContent>
								<CardFooter>
									<EnhancedButton
										className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
										onClick={handleContinue}
										variant="gradient"
										animation="shimmer"
										rounded="full"
									>
										View Profile
										<ArrowRight className="ml-2 h-4 w-4" />
									</EnhancedButton>
								</CardFooter>
							</Card>
						</motion.div>
					)}

					{/* Error State */}
					{uploadState === "error" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-red-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="text-xl font-bold text-red-400">Upload Error</CardTitle>
										<X className="h-6 w-6 text-red-500" />
									</div>
									<CardDescription className="text-zinc-400">
										There was an error processing your resume
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
										<p className="text-red-400 mb-2 font-medium">We couldn't process your resume file.</p>
										<p className="text-sm text-zinc-400">
											Please make sure it's in a supported format (PDF, DOC, DOCX) and try again.
										</p>
									</div>
								</CardContent>
								<CardFooter>
									<EnhancedButton
										className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
										onClick={resetUpload}
										variant="gradient"
										animation="shimmer"
										rounded="full"
									>
										Try Again
									</EnhancedButton>
								</CardFooter>
							</Card>
						</motion.div>
					)}
				</motion.div>
			</div>
		</AppShell>
	)
}

