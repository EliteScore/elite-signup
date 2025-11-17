"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, FileText, Upload, X, Info, Sparkles } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getStoredAccessToken } from "@/lib/auth-storage"
import { sanitizeCvForPost, ExperienceEntry, EducationEntry } from "@/lib/cv-normalizer"

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
	const [mode, setMode] = useState<"upload" | "manual">("upload")
	const [uploadProgress, setUploadProgress] = useState(0)
	const [processingProgress, setProcessingProgress] = useState(0)
	const [file, setFile] = useState<File | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [parsedData, setParsedData] = useState<any>(null)

	type ManualBasics = {
		full_name: string
		headline: string
		email: string
		phone: string
		location: string
		summary: string
	}

	const createEmptyBasics = (): ManualBasics => ({
		full_name: "",
		headline: "",
		email: "",
		phone: "",
		location: "",
		summary: "",
	})

	const createEmptyExperience = (): ExperienceEntry => ({
		title: "",
		company: "",
		employment_type: "",
		location: "",
		start_date: "",
		end_date: "",
		is_current: false,
		description: "",
		achievements: [],
	})

	const createEmptyEducation = (): EducationEntry => ({
		school: "",
		degree: "",
		field_of_study: "",
		start_date: "",
		end_date: "",
		grade: "",
		activities: "",
		description: "",
	})

	const [manualBasics, setManualBasics] = useState<ManualBasics>(createEmptyBasics())
	const [manualExperience, setManualExperience] = useState<ExperienceEntry[]>([createEmptyExperience()])
	const [manualEducation, setManualEducation] = useState<EducationEntry[]>([createEmptyEducation()])
	const [manualSkillsInput, setManualSkillsInput] = useState("")

	const handleManualBasicsChange = (field: keyof ManualBasics, value: string) => {
		setManualBasics((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const updateManualExperience = (index: number, field: keyof ExperienceEntry | "is_current", value: string | boolean) => {
		setManualExperience((prev) =>
			prev.map((entry, idx) => {
				if (idx !== index) return entry
				if (field === "is_current") {
					return {
						...entry,
						is_current: value as boolean,
						end_date: value ? null : entry.end_date,
					}
				}
				return {
					...entry,
					[field]: value as string,
				}
			}),
		)
	}

	const updateManualEducation = (index: number, field: keyof EducationEntry, value: string) => {
		setManualEducation((prev) =>
			prev.map((entry, idx) => {
				if (idx !== index) return entry
				return {
					...entry,
					[field]: value,
				}
			}),
		)
	}

	const addManualExperience = () => setManualExperience((prev) => [...prev, createEmptyExperience()])
	const removeManualExperience = (index: number) =>
		setManualExperience((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

	const addManualEducation = () => setManualEducation((prev) => [...prev, createEmptyEducation()])
	const removeManualEducation = (index: number) =>
		setManualEducation((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))

	const resetManualForm = () => {
		setManualBasics(createEmptyBasics())
		setManualExperience([createEmptyExperience()])
		setManualEducation([createEmptyEducation()])
		setManualSkillsInput("")
	}

	const switchMode = (nextMode: "upload" | "manual") => {
		setMode(nextMode)
		setErrorMessage(null)
		setUploadState("initial")
		setUploadProgress(0)
		setProcessingProgress(0)
		if (nextMode === "manual") {
			setFile(null)
		} else {
			resetManualForm()
		}
	}

	const buildManualCvPayload = () => {
		const basics = Object.fromEntries(
			Object.entries(manualBasics).map(([key, value]) => [key, value.trim()]),
		) as ManualBasics

		const experiences = manualExperience
			.map((exp) => ({
				title: exp.title?.trim() || "",
				company: exp.company?.trim() || "",
				employment_type: exp.employment_type || "",
				location: exp.location || "",
				start_date: exp.start_date || "",
				end_date: exp.is_current ? null : exp.end_date || null,
				is_current: exp.is_current ?? false,
				description: exp.description || "",
				achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
			}))
			.filter((exp) => exp.title || exp.company)

		const education = manualEducation
			.map((edu) => ({
				school: edu.school?.trim() || "",
				degree: edu.degree?.trim() || "",
				field_of_study: edu.field_of_study || "",
				start_date: edu.start_date || "",
				end_date: edu.end_date || "",
				grade: edu.grade || "",
				activities: edu.activities || "",
				description: edu.description || "",
			}))
			.filter((edu) => edu.school || edu.degree)

		const skillsArray = manualSkillsInput
			.split(",")
			.map((skill) => skill.trim())
			.filter(Boolean)

		return {
			profile: {
				basics,
				experience: experiences,
				education,
				projects: [],
				skills: skillsArray,
				certifications: [],
				languages: [],
				publications: [],
				honors_awards: [],
				volunteer: [],
			},
		}
	}

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

	const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setErrorMessage(null)

		if (!manualBasics.full_name.trim()) {
			setErrorMessage("Please add your full name to continue.")
			return
		}

		try {
			const token = getStoredAccessToken()
			if (!token) {
				setErrorMessage("Authentication required. Please log in again.")
				return
			}

			setUploadState("processing")
			setProcessingProgress(10)

			const manualCv = buildManualCvPayload()
			setParsedData(manualCv)

			await saveToProfile(manualCv, token)
		} catch (error) {
			console.error("[CV Upload] Manual entry error:", error)
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Failed to save your information. Please try again.",
			)
			setUploadState("error")
		}
	}


	const saveToProfile = async (cvData: any, token: string) => {
		setProcessingProgress(0)

		try {
			// Simulate progress
			setProcessingProgress(20)

			console.log("[CV Upload] Saving parsed data to user profile...")
			console.log("[CV Upload] Raw parsed data from parser API:", JSON.stringify(cvData, null, 2))

			// Sanitize the entire CV payload - THE ONE TRUE GATE between parser chaos and backend schema
			const payload = sanitizeCvForPost(cvData)
			
			console.log("[CV Upload] Payload being sent to PUT /v1/users/cv:", JSON.stringify(payload, null, 2))

			// Step 2: Save parsed CV to user profile using PUT /v1/users/cv
			const saveResponse = await fetch(`${API_BASE_URL}v1/users/cv`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
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
		if (mode === "manual") {
			resetManualForm()
		}
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
					{uploadState === "initial" && mode === "upload" && (
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
							<div className="text-center mt-4 space-y-2">
								<p className="text-xs text-zinc-500">Don&apos;t have a resume yet?</p>
								<Button
									variant="outline"
									size="sm"
									className="rounded-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
									onClick={() => switchMode("manual")}
								>
									Fill it out manually
								</Button>
							</div>
						</motion.div>
					)}

					{/* Manual Entry State */}
					{uploadState === "initial" && mode === "manual" && (
						<motion.div variants={itemVariants}>
							<Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl rounded-2xl">
								<CardHeader>
									<CardTitle className="text-xl font-bold">Manual Resume Entry</CardTitle>
									<CardDescription className="text-zinc-400">
										Share your experience without uploading a file
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form onSubmit={handleManualSubmit} className="space-y-6">
										<div className="space-y-3">
											<h3 className="text-sm font-semibold text-white">Basics</h3>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												<Input
													placeholder="Full name"
													value={manualBasics.full_name}
													onChange={(e) => handleManualBasicsChange("full_name", e.target.value)}
													className="bg-zinc-800 border-zinc-700 text-white"
												/>
												<Input
													placeholder="Headline (e.g. Product Designer)"
													value={manualBasics.headline}
													onChange={(e) => handleManualBasicsChange("headline", e.target.value)}
													className="bg-zinc-800 border-zinc-700 text-white"
												/>
												<Input
													type="email"
													placeholder="Email"
													value={manualBasics.email}
													onChange={(e) => handleManualBasicsChange("email", e.target.value)}
													className="bg-zinc-800 border-zinc-700 text-white"
												/>
												<Input
													placeholder="Phone"
													value={manualBasics.phone}
													onChange={(e) => handleManualBasicsChange("phone", e.target.value)}
													className="bg-zinc-800 border-zinc-700 text-white"
												/>
												<Input
													placeholder="Location"
													value={manualBasics.location}
													onChange={(e) => handleManualBasicsChange("location", e.target.value)}
													className="bg-zinc-800 border-zinc-700 text-white"
												/>
											</div>
											<Textarea
												placeholder="Professional summary"
												value={manualBasics.summary}
												onChange={(e) => handleManualBasicsChange("summary", e.target.value)}
												className="bg-zinc-800 border-zinc-700 text-white"
											/>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-semibold text-white">Experience</h3>
												<Button variant="outline" size="sm" onClick={addManualExperience}>
													Add role
												</Button>
											</div>
											<div className="space-y-3">
												{manualExperience.map((exp, index) => (
													<div
														key={`experience-${index}`}
														className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
													>
														<div className="flex items-center justify-between">
															<p className="text-xs uppercase tracking-wide text-zinc-500">
																Role {index + 1}
															</p>
															{manualExperience.length > 1 && (
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="text-red-400 hover:text-red-200"
																	onClick={() => removeManualExperience(index)}
																>
																	Remove
																</Button>
															)}
														</div>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
															<Input
																placeholder="Title"
																value={exp.title || ""}
																onChange={(e) => updateManualExperience(index, "title", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Company"
																value={exp.company || ""}
																onChange={(e) => updateManualExperience(index, "company", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Employment type (Full-time, Internship...)"
																value={exp.employment_type || ""}
																onChange={(e) =>
																	updateManualExperience(index, "employment_type", e.target.value)
																}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Location"
																value={exp.location || ""}
																onChange={(e) => updateManualExperience(index, "location", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																type="month"
																placeholder="Start date"
																value={exp.start_date || ""}
																onChange={(e) => updateManualExperience(index, "start_date", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																type="month"
																placeholder="End date"
																value={exp.end_date || ""}
																disabled={exp.is_current ?? false}
																onChange={(e) => updateManualExperience(index, "end_date", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
														</div>
														<label className="flex items-center gap-2 text-xs text-zinc-400">
															<input
																type="checkbox"
																className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
																checked={exp.is_current ?? false}
																onChange={(e) =>
																	updateManualExperience(index, "is_current", e.target.checked)
																}
															/>
															Currently working in this role
														</label>
														<Textarea
															placeholder="Key responsibilities and achievements"
															value={exp.description || ""}
															onChange={(e) => updateManualExperience(index, "description", e.target.value)}
															className="bg-zinc-800 border-zinc-700 text-white"
														/>
													</div>
												))}
											</div>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<h3 className="text-sm font-semibold text-white">Education</h3>
												<Button variant="outline" size="sm" onClick={addManualEducation}>
													Add school
												</Button>
											</div>
											<div className="space-y-3">
												{manualEducation.map((edu, index) => (
													<div
														key={`education-${index}`}
														className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
													>
														<div className="flex items-center justify-between">
															<p className="text-xs uppercase tracking-wide text-zinc-500">
																Education {index + 1}
															</p>
															{manualEducation.length > 1 && (
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	className="text-red-400 hover:text-red-200"
																	onClick={() => removeManualEducation(index)}
																>
																	Remove
																</Button>
															)}
														</div>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
															<Input
																placeholder="School"
																value={edu.school || ""}
																onChange={(e) => updateManualEducation(index, "school", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Degree"
																value={edu.degree || ""}
																onChange={(e) => updateManualEducation(index, "degree", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Field of study"
																value={edu.field_of_study || ""}
																onChange={(e) =>
																	updateManualEducation(index, "field_of_study", e.target.value)
																}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																placeholder="Grade / GPA"
																value={edu.grade || ""}
																onChange={(e) => updateManualEducation(index, "grade", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																type="month"
																placeholder="Start date"
																value={edu.start_date || ""}
																onChange={(e) => updateManualEducation(index, "start_date", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
															<Input
																type="month"
																placeholder="End date"
																value={edu.end_date || ""}
																onChange={(e) => updateManualEducation(index, "end_date", e.target.value)}
																className="bg-zinc-800 border-zinc-700 text-white"
															/>
														</div>
														<Textarea
															placeholder="Highlights, activities, awards"
															value={edu.description || ""}
															onChange={(e) => updateManualEducation(index, "description", e.target.value)}
															className="bg-zinc-800 border-zinc-700 text-white"
														/>
													</div>
												))}
											</div>
										</div>

										<div className="space-y-2">
											<h3 className="text-sm font-semibold text-white">Skills</h3>
											<Input
												placeholder="Separate skills with commas (e.g. React, UI Design, Leadership)"
												value={manualSkillsInput}
												onChange={(e) => setManualSkillsInput(e.target.value)}
												className="bg-zinc-800 border-zinc-700 text-white"
											/>
										</div>

										{errorMessage && (
											<div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
												{errorMessage}
											</div>
										)}

										<div className="flex flex-wrap gap-3">
											<EnhancedButton
												type="submit"
												className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
												variant="gradient"
												animation="shimmer"
												rounded="full"
											>
												Save & Process
												<ArrowRight className="ml-2 h-4 w-4" />
											</EnhancedButton>
											<Button
												type="button"
												variant="ghost"
												className="text-zinc-400 hover:text-white"
												onClick={() => switchMode("upload")}
											>
												Back to upload
											</Button>
										</div>
									</form>
								</CardContent>
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

