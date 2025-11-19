"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { motion, AnimatePresence } from "framer-motion"
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
  Award,
  Calendar,
  Clock,
  Timer,
  PlayCircle,
  Briefcase,
  BookOpen,
  DollarSign,
  Rocket,
  Code,
  Palette,
  Users,
  MessageCircle,
  Heart,
  Globe,
  Mic,
  TrendingUp,
  Flame,
  ChevronRight,
  Lock,
  Medal,
  Bell,
  Settings,
  PartyPopper,
  Crown,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle } from "@/components/ui/enhanced-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { cn } from "@/lib/utils"
import AnimatedCounter from "@/components/ui/animated-counter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStoredAccessToken } from "@/lib/auth-storage"

// Goal categories
const goalCategories = [
  {
    id: "career",
    name: "Career Growth",
    icon: Briefcase,
    gradient: "from-blue-500 via-purple-500 to-fuchsia-500",
    description: "Advance your career and reach new heights",
    color: "blue",
  },
  {
    id: "learning",
    name: "Skill Development",
    icon: BookOpen,
    gradient: "from-purple-500 via-pink-500 to-red-500",
    description: "Master new skills and technologies",
    color: "purple",
  },
  {
    id: "financial",
    name: "Financial Freedom",
    icon: DollarSign,
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    description: "Achieve financial independence and security",
    color: "yellow",
  },
  {
    id: "personal",
    name: "Person Growth",
    icon: Sparkles,
    gradient: "from-pink-500 via-purple-500 to-indigo-500",
    description: "Become the best version of yourself",
    color: "pink",
  },
  {
    id: "business",
    name: "Entrepreneurship",
    icon: Rocket,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    description: "Build and scale your business empire",
    color: "indigo",
  }
]

// Activity preferences
const activityPreferences = [
  { id: "coding", name: "Programming & Development", icon: Code, category: "learning" },
  { id: "design", name: "UI/UX Design", icon: Palette, category: "learning" },
  { id: "data", name: "Data Science & Analytics", icon: BarChart2, category: "learning" },
  { id: "leadership", name: "Leadership & Management", icon: Users, category: "career" },
  { id: "networking", name: "Networking & Communication", icon: MessageCircle, category: "career" },
  { id: "fitness", name: "Health & Fitness", icon: Heart, category: "personal" },
  { id: "mindfulness", name: "Mindfulness & Meditation", icon: Brain, category: "personal" },
  { id: "investing", name: "Investing & Finance", icon: TrendingUp, category: "financial" },
  { id: "entrepreneurship", name: "Entrepreneurship", icon: Rocket, category: "business" },
  { id: "marketing", name: "Digital Marketing", icon: Sparkles, category: "business" },
  { id: "languages", name: "Language Learning", icon: Globe, category: "learning" },
  { id: "public-speaking", name: "Public Speaking", icon: Mic, category: "career" }
]

// Daily challenges with more detail
const dailyChallenges = [
  {
    id: 1,
    title: "Complete a Coding Challenge",
    description: "Solve one problem on LeetCode or HackerRank to sharpen your skills",
    xp: 100,
    difficulty: "Medium",
    timeEstimate: "30 mins",
    category: "learning",
    icon: Code,
    participants: 234,
    completions: 1847,
  },
  {
    id: 2,
    title: "Network with a Peer",
    description: "Send a meaningful message to someone in your field and build connections",
    xp: 75,
      difficulty: "Easy",
      timeEstimate: "15 mins",
    category: "career",
    icon: Users,
    participants: 456,
    completions: 3421,
    },
    {
    id: 3,
      title: "Read Industry Article",
    description: "Read and summarize one tech industry article to stay informed",
    xp: 50,
      difficulty: "Easy",
      timeEstimate: "20 mins",
    category: "learning",
    icon: BookOpen,
    participants: 567,
    completions: 4523,
  },
    {
      id: 4,
    title: "Practice Public Speaking",
    description: "Record yourself giving a 3-minute presentation on any topic",
    xp: 80,
      difficulty: "Medium",
    timeEstimate: "25 mins",
    category: "career",
    icon: Mic,
    participants: 123,
    completions: 892,
    },
    {
      id: 5,
    title: "Work on Side Project",
    description: "Spend focused time building or improving your personal project",
    xp: 120,
    difficulty: "Medium",
    timeEstimate: "45 mins",
    category: "learning",
    icon: Rocket,
    participants: 345,
    completions: 2156,
    }
  ]

// Monthly challenges
const monthlyChallenges = [
  {
    id: 1,
    title: "Build a Complete Project",
    description: "Create a full-stack application with modern technologies",
    xp: 1000,
    difficulty: "Hard",
    timeEstimate: "20+ hours",
    deadline: "2024-03-31",
    progress: 35,
    icon: Code,
    reward: "Project Master Badge",
    participants: 89,
  },
  {
    id: 2,
    title: "Get a Professional Certification",
    description: "Complete AWS, Google Cloud, or similar certification",
    xp: 1500,
    difficulty: "Hard",
    timeEstimate: "40+ hours",
    deadline: "2024-04-15",
    progress: 15,
    icon: Award,
    reward: "Certified Pro Badge",
    participants: 156,
  },
  {
    id: 3,
    title: "Attend 3 Networking Events",
    description: "Join virtual or in-person professional events",
    xp: 500,
    difficulty: "Medium",
    timeEstimate: "6+ hours",
    deadline: "2024-03-20",
    progress: 66,
    icon: Users,
    reward: "Connector Badge",
    participants: 234,
  }
]


// Achievements/Badges
const achievements = [
  { id: 1, name: "Code Master", icon: Code, earned: true, rarity: "epic" },
  { id: 2, name: "Streak Legend", icon: Flame, earned: true, rarity: "legendary" },
  { id: 3, name: "Social Butterfly", icon: Users, earned: true, rarity: "rare" },
  { id: 4, name: "Project Guru", icon: Rocket, earned: false, rarity: "epic" },
  { id: 5, name: "Elite Learner", icon: BookOpen, earned: false, rarity: "legendary" },
]

// Leaderboard preview
const leaderboardPreview = [
  { rank: 1, name: "Sarah Chen", xp: 15420, avatar: null, badge: "👑" },
  { rank: 2, name: "Michael Park", xp: 14230, avatar: null, badge: "🥈" },
  { rank: 3, name: "You", xp: 12840, avatar: null, badge: "🥉" },
  { rank: 4, name: "Emily Rodriguez", xp: 11560, avatar: null, badge: "" },
  { rank: 5, name: "David Kim", xp: 10890, avatar: null, badge: "" },
  ]

export default function GoalsPage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Onboarding state
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<'goals' | 'skills'>('goals')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  // Resume upload state
  const [uploadState, setUploadState] = useState<"initial" | "uploading" | "processing" | "complete" | "error">("initial")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [resumeScore, setResumeScore] = useState<number | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Dashboard state
  const [activeTab, setActiveTab] = useState("challenges")
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([])
  const [totalXP, setTotalXP] = useState(12840)
  const [streak, setStreak] = useState(8)
  const [level, setLevel] = useState(7)
  const [showCelebration, setShowCelebration] = useState(false)

  const PARSER_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

  // Check for onboarding completion on mount
  useEffect(() => {
    if (!isAuthorized) return

    const onboardingComplete = localStorage.getItem("goals.onboarding.complete")
    const storedGoals = localStorage.getItem("goals.selectedGoals")
    const storedSkills = localStorage.getItem("goals.selectedSkills")
    const storedResumeData = localStorage.getItem("goals.resumeAnalysis")
    const storedXP = localStorage.getItem("goals.totalXP")
    const storedCompleted = localStorage.getItem("goals.completedChallenges")

    if (onboardingComplete === "true") {
      setHasCompletedOnboarding(true)
      if (storedGoals) setSelectedGoals(JSON.parse(storedGoals))
      if (storedSkills) setSelectedSkills(JSON.parse(storedSkills))
      if (storedResumeData) {
        const data = JSON.parse(storedResumeData)
        setResumeScore(data.score)
        setResumeAnalysis(data)
      }
      if (storedXP) setTotalXP(Number(storedXP))
      if (storedCompleted) setCompletedChallenges(JSON.parse(storedCompleted))
    }
  }, [isAuthorized])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Handlers
  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    )
  }

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    )
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      handleFileUpload(selectedFile)
    }
  }

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setUploadState("uploading")
      setErrorMessage(null)

      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append("file", uploadedFile)

      setUploadState("processing")
      setUploadProgress(100)

      const response = await fetch(`${PARSER_API_BASE_URL}v2/parser/resume/score`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze resume: ${response.status}`)
  }

      const result = await response.json()
      setResumeScore(result.score || result.parsed?.overall_score || 0)
      setResumeAnalysis(result)
      localStorage.setItem("goals.resumeAnalysis", JSON.stringify(result))
      setUploadState("complete")
    } catch (error) {
      console.error("[Resume Score] Error:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to analyze resume. Please try again."
      )
      setUploadState("error")
    }
  }

  const resetUpload = () => {
    setUploadState("initial")
    setUploadProgress(0)
    setFile(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const completeOnboarding = async () => {
    setIsSavingPreferences(true)
    try {
      const goalsPayload = selectedGoals
        .map(goalId => goalCategories.find(goal => goal.id === goalId)?.name)
        .filter((name): name is string => Boolean(name))

      const activitiesPayload = selectedSkills
        .map(activityId => activityPreferences.find(activity => activity.id === activityId)?.name)
        .filter((name): name is string => Boolean(name))

      if (goalsPayload.length !== selectedGoals.length || activitiesPayload.length !== selectedSkills.length) {
        console.error("[Preferences] Failed to map all goals/activities to allowed names", {
          selectedGoals,
          goalsPayload,
          selectedSkills,
          activitiesPayload,
        })
        throw new Error("Invalid goals or activities selected. Please reselect and try again.")
      }

      const token = getStoredAccessToken()
      if (!token) {
        console.error("[Preferences] No access token found")
        // Still save locally even if API call fails
        localStorage.setItem("goals.onboarding.complete", "true")
        localStorage.setItem("goals.selectedGoals", JSON.stringify(selectedGoals))
        localStorage.setItem("goals.selectedSkills", JSON.stringify(selectedSkills))
        setHasCompletedOnboarding(true)
        setIsSavingPreferences(false)
        return
      }

      // Use Next.js API route to proxy the request (avoids CORS issues)
      const url = "/api/preferences/set_preferences"
      
      console.log("[Preferences] ===== STARTING API CALL =====")
      console.log("[Preferences] Timestamp:", new Date().toISOString())
      console.log("[Preferences] Request URL:", url)
      console.log("[Preferences] Goals payload:", JSON.stringify(goalsPayload, null, 2))
      console.log("[Preferences] Activities payload:", JSON.stringify(activitiesPayload, null, 2))
      console.log("[Preferences] Token present:", !!token)
      console.log("[Preferences] Token preview:", token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : "none")
      
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      let response: Response
      try {
        console.log("[Preferences] Making fetch request...")
        response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            goals: goalsPayload,
            activities: activitiesPayload,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        console.log("[Preferences] Fetch request completed")
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error("[Preferences] ===== FETCH ERROR =====")
        if (fetchError instanceof Error) {
          console.error("[Preferences] Error name:", fetchError.name)
          console.error("[Preferences] Error message:", fetchError.message)
          console.error("[Preferences] Error stack:", fetchError.stack)
          if (fetchError.name === 'AbortError') {
            console.error("[Preferences] Request timeout after 30 seconds")
            throw new Error("Request timed out. Please check your connection and try again.")
          }
          console.error("[Preferences] Full error object:", fetchError)
          throw new Error(`Network error: ${fetchError.message}`)
        }
        console.error("[Preferences] Unknown error type:", typeof fetchError, fetchError)
        throw fetchError
      }

      console.log("[Preferences] Response received")
      console.log("[Preferences] Response status:", response.status, response.statusText)
      console.log("[Preferences] Response ok:", response.ok)
      console.log("[Preferences] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error("[Preferences] ===== API ERROR RESPONSE =====")
        console.error("[Preferences] Status:", response.status, response.statusText)
        
        let errorText = ""
        let errorJson: any = null
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            errorJson = await response.json()
            errorText = JSON.stringify(errorJson, null, 2)
            console.error("[Preferences] Error response (JSON):", errorText)
          } else {
            errorText = await response.text()
            console.error("[Preferences] Error response (text):", errorText)
          }
        } catch (e) {
          console.error("[Preferences] Could not read error response:", e)
          errorText = `Status ${response.status}: ${response.statusText}`
        }
        
        console.error("[Preferences] Full error details:", {
          status: response.status,
          statusText: response.statusText,
          error: errorJson || errorText
        })
        
        // Still save locally even if API call fails
        localStorage.setItem("goals.onboarding.complete", "true")
        localStorage.setItem("goals.selectedGoals", JSON.stringify(selectedGoals))
        localStorage.setItem("goals.selectedSkills", JSON.stringify(selectedSkills))
        setHasCompletedOnboarding(true)
        setIsSavingPreferences(false)
        return
      }

      let result
      try {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          result = await response.json()
          console.log("[Preferences] ===== SUCCESS =====")
          console.log("[Preferences] Response data:", JSON.stringify(result, null, 2))
        } else {
          result = await response.text()
          console.log("[Preferences] ===== SUCCESS (non-JSON) =====")
          console.log("[Preferences] Response data:", result)
        }
      } catch (e) {
        console.warn("[Preferences] Response was not JSON, but status was OK")
        console.warn("[Preferences] Parse error:", e)
        result = null
      }

      // Save to localStorage
      localStorage.setItem("goals.onboarding.complete", "true")
      localStorage.setItem("goals.selectedGoals", JSON.stringify(selectedGoals))
      localStorage.setItem("goals.selectedSkills", JSON.stringify(selectedSkills))
      setHasCompletedOnboarding(true)
      setIsSavingPreferences(false)
    } catch (error) {
      console.error("[Preferences] Error saving preferences:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("[Preferences] Error details:", errorMessage)
      
      // Still save locally even if API call fails
      localStorage.setItem("goals.onboarding.complete", "true")
      localStorage.setItem("goals.selectedGoals", JSON.stringify(selectedGoals))
      localStorage.setItem("goals.selectedSkills", JSON.stringify(selectedSkills))
      setHasCompletedOnboarding(true)
      setIsSavingPreferences(false)
    }
  }

  const resetOnboarding = () => {
    localStorage.removeItem("goals.onboarding.complete")
    setHasCompletedOnboarding(false)
    setOnboardingStep('goals')
    setSelectedGoals([])
    setSelectedSkills([])
  }

  const handleChallengeComplete = (challengeId: number, xp: number) => {
    if (!completedChallenges.includes(challengeId)) {
      const newCompleted = [...completedChallenges, challengeId]
      const newXP = totalXP + xp
      setCompletedChallenges(newCompleted)
      setTotalXP(newXP)
      localStorage.setItem("goals.completedChallenges", JSON.stringify(newCompleted))
      localStorage.setItem("goals.totalXP", String(newXP))
      
      // Show celebration
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  // Render Onboarding Flow
  if (!hasCompletedOnboarding) {
  return (
      <DashboardLayout>
        <div className="min-h-screen pb-20">
          <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
            {onboardingStep === 'goals' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex justify-center mb-4"
                  >
            <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.8)]">
                        <Target className="h-10 w-10 text-white" />
              </div>
            </div>
                  </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Choose Your Goals
              </h1>
                  <p className="text-sm sm:text-base text-zinc-400 mb-4 px-2 max-w-sm mx-auto">
                    Select at least 2 areas you want to focus on. Join thousands of others on their journey.
              </p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 px-3 py-1">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedGoals.length} / 2+ selected
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 px-3 py-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      15.2k active users
                    </Badge>
              </div>
            </div>

                <div className="space-y-3">
                  {goalCategories.map((goal, index) => (
                        <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                        >
                          <EnhancedCard
                        variant={selectedGoals.includes(goal.id) ? "gradient" : "default"}
                        className={cn(
                          "cursor-pointer transition-all duration-300 relative overflow-hidden",
                          selectedGoals.includes(goal.id)
                            ? "border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-[1.02]"
                            : "border-zinc-800 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        )}
                        onClick={() => handleGoalToggle(goal.id)}
                      >
                        {selectedGoals.includes(goal.id) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
                          />
                        )}
                        <EnhancedCardContent className="p-4 relative">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className={`w-16 h-16 rounded-xl bg-gradient-to-br ${goal.gradient} flex items-center justify-center shadow-lg`}
                            >
                              <goal.icon className="h-8 w-8 text-white" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-white mb-1">{goal.name}</h3>
                              <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-2">{goal.description}</p>
                              <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                                <Users className="h-3 w-3 mr-1" />
                                {Math.floor(Math.random() * 5000) + 2000} members
                                        </Badge>
                                    </div>
                            <div className="flex-shrink-0">
                              <motion.div
                                animate={selectedGoals.includes(goal.id) ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                {selectedGoals.includes(goal.id) ? (
                                  <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                  </div>
                                ) : (
                                  <div className="h-7 w-7 rounded-full border-2 border-zinc-600" />
                                )}
                              </motion.div>
                                </div>
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </motion.div>
                      ))}
                    </div>

                <EnhancedButton
                  variant="gradient"
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_30px_rgba(139,92,246,0.5)] h-14 text-base font-bold"
                  onClick={() => setOnboardingStep('skills')}
                  disabled={selectedGoals.length < 2}
                >
                  Continue to Skills
                  <ArrowRight className="ml-2 h-5 w-5" />
                </EnhancedButton>
              </motion.div>
            )}

            {onboardingStep === 'skills' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex justify-center mb-4"
                          >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full blur-xl opacity-50 animate-pulse" />
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.8)]">
                        <Sparkles className="h-10 w-10 text-white" />
                                </div>
                                </div>
                        </motion.div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    Select Your Skills
                  </h1>
                  <p className="text-sm sm:text-base text-zinc-400 mb-4 px-2 max-w-sm mx-auto">
                    Choose 3-4 activities to master. We'll create personalized challenges just for you.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 px-3 py-1">
                      <Zap className="h-3 w-3 mr-1" />
                      {selectedSkills.length} / 3-4 selected
                    </Badge>
                    </div>
                    </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activityPreferences.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EnhancedCard
                        variant={selectedSkills.includes(skill.id) ? "gradient" : "default"}
                        className={cn(
                          "cursor-pointer transition-all duration-300",
                          selectedSkills.includes(skill.id)
                            ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.5)] scale-[1.02]"
                            : "border-zinc-800 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                        )}
                        onClick={() => handleSkillToggle(skill.id)}
                      >
                        <EnhancedCardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                            >
                              <skill.icon className="h-6 w-6 text-white" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                        </div>
                            <div className="flex-shrink-0">
                              <motion.div
                                animate={selectedSkills.includes(skill.id) ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                {selectedSkills.includes(skill.id) ? (
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                                ) : (
                                  <div className="h-6 w-6 rounded-full border-2 border-zinc-600" />
                                )}
                              </motion.div>
                        </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
                    </motion.div>
                        ))}
                      </div>

                <div className="flex gap-3">
                  <EnhancedButton
                    variant="outline"
                    className="flex-1 h-12 border-zinc-700"
                    onClick={() => setOnboardingStep('goals')}
                  >
                    Back
                  </EnhancedButton>
                  <EnhancedButton
                    variant="gradient"
                    className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-[0_0_30px_rgba(168,85,247,0.5)] h-12 font-bold"
                    onClick={completeOnboarding}
                    disabled={selectedSkills.length < 3 || selectedSkills.length > 4 || isSavingPreferences}
                  >
                    {isSavingPreferences ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        Start Journey
                        <Sparkles className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </EnhancedButton>
                    </div>
              </motion.div>
            )}
        </div>
        </div>
      </DashboardLayout>
    )
  }

  // Render Premium Dashboard
  return (
    <DashboardLayout>
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full p-8 shadow-[0_0_100px_rgba(234,179,8,0.8)]"
                    >
              <PartyPopper className="h-20 w-20 text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-20">
        <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
          {/* Premium Header with Avatar */}
                    <motion.div
            initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
            className="mb-6"
                    >
                        <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                    <span className="text-xs font-bold text-white">{level}</span>
                          </div>
                        </div>
                <div>
                  <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Your Journey
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 px-2 py-0 text-xs">
                      Level {level}
                                </Badge>
                    <span className="text-xs text-zinc-500">Rank #3</span>
                              </div>
                        </div>
                      </div>
              <div className="flex gap-2">
                  <EnhancedButton
                  variant="ghost"
                    size="sm"
                  className="h-10 w-10 p-0"
                  >
                  <Bell className="h-5 w-5" />
                  </EnhancedButton>
                <EnhancedButton
                  variant="ghost"
                  size="sm"
                  onClick={resetOnboarding}
                  className="h-10 w-10 p-0"
                >
                  <Settings className="h-5 w-5" />
                </EnhancedButton>
                          </div>
                              </div>

            {/* Enhanced Stats Cards with Animations */}
            <div className="grid grid-cols-3 gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 cursor-pointer">
                  <EnhancedCardContent className="p-3 text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      <AnimatedCounter from={0} to={totalXP} duration={1.5} />
                            </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Total XP
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-green-700/40 cursor-pointer">
                  <EnhancedCardContent className="p-3 text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {completedChallenges.length}
              </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Done
                            </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-orange-700/40 cursor-pointer">
                  <EnhancedCardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        {streak}
                          </span>
                            </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Day Streak</div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </motion.div>
                            </div>
          </motion.div>

          {/* Premium Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900/80 border border-blue-700/40 rounded-xl p-1 mb-6 shadow-[0_0_30px_rgba(80,0,255,0.3)] grid grid-cols-3 w-full">
              <TabsTrigger
                value="challenges"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <Zap className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <Trophy className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Rank</span>
              </TabsTrigger>
              <TabsTrigger
                value="resume"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <FileText className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Score</span>
              </TabsTrigger>
            </TabsList>

            {/* Challenges Tab - CONTINUED IN NEXT PART DUE TO LENGTH */}
            <TabsContent value="challenges" className="space-y-4">
              {/* Daily Challenges */}
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                <EnhancedCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                        Daily Challenges
                    </EnhancedCardTitle>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                      Resets in 8h
                    </Badge>
                  </div>
                  </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-3">
                  {dailyChallenges.map((challenge, index) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer",
                          completedChallenges.includes(challenge.id)
                          ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                          : "bg-zinc-800/50 border-zinc-700/50 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                      )}
                      onClick={() => !completedChallenges.includes(challenge.id) && handleChallengeComplete(challenge.id, challenge.xp)}
                      >
                      <div className="flex items-start gap-3">
                        <motion.div
                          whileHover={{ rotate: 5 }}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                            completedChallenges.includes(challenge.id)
                              ? "bg-gradient-to-br from-green-500 to-emerald-500"
                              : "bg-gradient-to-br from-blue-500 to-purple-500"
                          )}
                        >
                          {completedChallenges.includes(challenge.id) ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                          ) : (
                            <challenge.icon className="h-6 w-6 text-white" />
                          )}
                        </motion.div>
                          <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className={cn(
                              "text-sm font-semibold",
                                completedChallenges.includes(challenge.id) ? "text-green-400 line-through" : "text-white"
                            )}>
                                {challenge.title}
                              </h4>
                            <Badge className={cn(
                              "text-xs px-2 py-0.5",
                              challenge.difficulty === "Easy" ? "bg-green-900/40 text-green-400 border-green-700/50" :
                              challenge.difficulty === "Medium" ? "bg-yellow-900/40 text-yellow-400 border-yellow-700/50" :
                              "bg-red-900/40 text-red-400 border-red-700/50"
                            )}>
                                {challenge.difficulty}
                              </Badge>
                            </div>
                          <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{challenge.description}</p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-zinc-500">
                                <Timer className="h-3 w-3" />
                                {challenge.timeEstimate}
                              </span>
                            <span className="flex items-center gap-1 text-yellow-400 font-medium">
                                <Award className="h-3 w-3" />
                                +{challenge.xp} XP
                              </span>
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Users className="h-3 w-3" />
                              {challenge.participants} active
                            </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </EnhancedCardContent>
                </EnhancedCard>

              {/* Monthly Challenges */}
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-purple-700/40 shadow-xl rounded-2xl">
                <EnhancedCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-purple-400" />
                        Monthly Projects
                    </EnhancedCardTitle>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">
                      Premium
                    </Badge>
                  </div>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="space-y-4">
                  {monthlyChallenges.map((challenge, index) => (
                      <motion.div
                        key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all"
                      >
                        <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0"
                          >
                            <challenge.icon className="h-7 w-7 text-white" />
                          </motion.div>
                            <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-white">{challenge.title}</h4>
                              <Badge className="bg-purple-900/40 text-purple-400 border-purple-700/50 text-xs">
                                {challenge.progress}%
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 mb-2">{challenge.description}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due {new Date(challenge.deadline).toLocaleDateString()}
                                </span>
                              <span className="flex items-center gap-1 text-yellow-400 font-medium">
                                <Trophy className="h-3 w-3" />
                                  +{challenge.xp} XP
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                              <span className="text-zinc-400">Progress</span>
                            <span className="text-purple-400 font-medium">{challenge.progress}%</span>
                            </div>
                            <Progress
                              value={challenge.progress}
                            className="h-2.5"
                            indicatorClassName="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          />
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                              <Award className="h-3 w-3 mr-1 text-yellow-400" />
                              {challenge.reward}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                              <Users className="h-3 w-3 mr-1" />
                              {challenge.participants} joined
                            </Badge>
                          </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </EnhancedCardContent>
                </EnhancedCard>
          </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-4">
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-yellow-700/40 shadow-xl rounded-2xl">
                <EnhancedCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Crown className="h-5 w-5 mr-2 text-yellow-400" />
                      Top Performers
                    </EnhancedCardTitle>
                    <EnhancedButton variant="ghost" size="sm" className="text-xs">
                      View All
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </EnhancedButton>
                  </div>
                  </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-2">
                  {leaderboardPreview.map((user, index) => (
                    <motion.div
                      key={user.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-3 rounded-xl transition-all cursor-pointer",
                        user.name === "You"
                          ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                          : "bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600"
                      )}
                    >
                        <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0",
                          user.rank === 1 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.5)]" :
                          user.rank === 2 ? "bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-[0_0_15px_rgba(156,163,175,0.5)]" :
                          user.rank === 3 ? "bg-gradient-to-r from-orange-600 to-yellow-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]" :
                          "bg-zinc-700 text-zinc-300"
                        )}>
                          {user.badge || `#${user.rank}`}
                          </div>
                        <Avatar className="h-10 w-10 border-2 border-zinc-700">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-bold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-semibold",
                              user.name === "You" ? "text-blue-400" : "text-white"
                            )}>
                              {user.name}
                            </span>
                            {user.rank <= 3 && (
                              <Medal className={cn(
                                "h-4 w-4",
                                user.rank === 1 ? "text-yellow-400" :
                                user.rank === 2 ? "text-gray-400" :
                                "text-orange-400"
                              )} />
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">{user.xp.toLocaleString()} XP</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            #{user.rank}
                      </div>
                          </div>
                          </div>
                    </motion.div>
                  ))}
                  </EnhancedCardContent>
                </EnhancedCard>

              {/* Achievements */}
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-purple-700/40 shadow-xl rounded-2xl">
                <EnhancedCardHeader className="pb-3">
                    <EnhancedCardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-400" />
                    Your Achievements
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center p-3 relative",
                          achievement.earned
                            ? achievement.rarity === "legendary"
                              ? "bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 shadow-[0_0_25px_rgba(234,179,8,0.6)]"
                              : achievement.rarity === "epic"
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                              : "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            : "bg-zinc-800/50 border border-zinc-700 opacity-50"
                        )}
                      >
                        {achievement.earned ? (
                          <>
                            <achievement.icon className="h-8 w-8 text-white mb-2" />
                            <span className="text-[10px] font-bold text-white text-center">{achievement.name}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-8 w-8 text-zinc-600 mb-2" />
                            <span className="text-[10px] text-zinc-600 text-center">Locked</span>
                          </>
                        )}
                      </motion.div>
                    ))}
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
            </TabsContent>

            {/* Resume Tab - Same as before */}
            <TabsContent value="resume" className="space-y-4">
              {uploadState === "initial" && !resumeScore && (
                      <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                      >
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="flex justify-center mb-4"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full blur-xl opacity-50" />
                        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.8)]">
                          <FileText className="h-10 w-10 text-white" />
                                  </div>
                                  </div>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      Resume Score Feature
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6 px-4">
                      Upload your resume to get AI-powered analysis and personalized recommendations
                    </p>
                              </div>
                              
                  <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardContent className="p-6">
                      <div
                        className="border-2 border-dashed border-blue-700/40 rounded-xl p-8 text-center hover:border-blue-500/60 hover:bg-zinc-800/30 transition-all duration-300 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                                >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="bg-blue-900/30 p-4 rounded-full w-fit mx-auto mb-4 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                        >
                          <Upload className="h-8 w-8 text-blue-400" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-white mb-2">Upload Your Resume</h3>
                        <p className="text-zinc-400 mb-4 text-sm">
                          PDF, DOC, or DOCX • Max 10MB
                        </p>
                                <EnhancedButton
                          variant="gradient"
                          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                        >
                          Choose File
                          <Upload className="ml-2 h-4 w-4" />
                                </EnhancedButton>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                            </div>
                          </EnhancedCardContent>
                        </EnhancedCard>

                  <EnhancedCard variant="default" className="border-zinc-800">
                    <EnhancedCardContent className="p-4">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
                        What You'll Get:
                      </h3>
                      <div className="space-y-2">
                        {[
                          { text: "Overall resume score (0-100)", icon: Trophy },
                          { text: "Detailed breakdown by section", icon: BarChart2 },
                          { text: "Personalized improvement tips", icon: Target },
                          { text: "Comparison with peers", icon: Users },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <div className="bg-green-500/20 rounded p-1">
                              <item.icon className="h-3 w-3 text-green-400" />
                            </div>
                            <span className="text-xs text-zinc-400">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              )}

              {/* Uploading State */}
              {uploadState === "uploading" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardHeader className="pb-3">
                      <EnhancedCardTitle className="text-lg flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-400 animate-bounce" />
                        Uploading Resume
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                      <div className="flex items-center justify-center py-8">
                    <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent"
                        />
                          </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 truncate pr-2">{file?.name}</span>
                          <span className="text-blue-400 font-bold">{uploadProgress}%</span>
                            </div>
                        <Progress value={uploadProgress} className="h-2 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
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
                >
                  <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-purple-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardHeader className="pb-3">
                      <EnhancedCardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
                        Analyzing Resume
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                      <div className="flex items-center justify-center py-8">
                        <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-blue-500 border-l-transparent"
                          />
                          <Sparkles className="h-6 w-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                              </div>
                            </div>
                      <p className="text-center text-sm text-zinc-400">AI is analyzing your resume...</p>
                </EnhancedCardContent>
              </EnhancedCard>
                </motion.div>
      )}

              {/* Error State */}
              {uploadState === "error" && (
          <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
                >
                  <EnhancedCard variant="default" className="bg-zinc-900/80 border-red-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardHeader className="pb-3">
                      <EnhancedCardTitle className="text-lg flex items-center gap-2 text-red-400">
                <X className="h-5 w-5" />
                        Upload Error
                      </EnhancedCardTitle>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                      <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-center">
                        <p className="text-red-400 mb-2 font-medium">{errorMessage || "Failed to analyze resume"}</p>
                        <p className="text-xs text-zinc-400">
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
              {(uploadState === "complete" || resumeScore !== null) && resumeAnalysis?.parsed && (
          <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
          >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="inline-block mb-3"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500 rounded-full blur-xl opacity-50 animate-pulse" />
                        <Trophy className="relative h-16 w-16 text-yellow-400" />
            </div>
                    </motion.div>
                    <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Score: <AnimatedCounter from={0} to={resumeScore || 0} duration={2} />
                    </h2>
                    <p className="text-xs text-zinc-400">Outstanding performance!</p>
              </div>
              
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40">
                        <EnhancedCardContent className="p-4 text-center">
                          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            <AnimatedCounter from={0} to={resumeScore || 0} duration={1.5} />
              </div>
                          <div className="text-xs text-zinc-400 mt-1">Your Score</div>
                        </EnhancedCardContent>
                      </EnhancedCard>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-green-700/40">
                        <EnhancedCardContent className="p-4 text-center">
                          <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Top 15%
                </div>
                          <div className="text-xs text-zinc-400 mt-1">Percentile</div>
                        </EnhancedCardContent>
                      </EnhancedCard>
                    </motion.div>
                </div>

                  <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardHeader className="pb-3">
                      <EnhancedCardTitle className="text-lg flex items-center">
                        <BarChart2 className="h-5 w-5 mr-2 text-blue-400" />
                        Score Breakdown
                      </EnhancedCardTitle>
                    </EnhancedCardHeader>
                    <EnhancedCardContent className="space-y-4">
                      {[
                        { name: "Experience", score: resumeAnalysis.parsed.components.experience, icon: Briefcase },
                        { name: "Skills", score: resumeAnalysis.parsed.components.skills, icon: Code },
                        { name: "Education", score: resumeAnalysis.parsed.components.education, icon: BookOpen },
                        { name: "Projects", score: resumeAnalysis.parsed.components.projects, icon: Rocket },
                      ].map((section, index) => {
                        let feedback = ""
                        if (section.score >= 80) {
                          feedback = resumeAnalysis.parsed.explanation.notes.strengths[0] || "Excellent work!"
                        } else if (section.score >= 60) {
                          feedback = "Good foundation, room to grow"
                        } else {
                          feedback = resumeAnalysis.parsed.explanation.notes.weaknesses[0] || "Needs improvement"
                        }

                        return (
                          <motion.div
                            key={section.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-500/20 rounded p-1">
                                  <section.icon className="h-4 w-4 text-blue-400" />
              </div>
                                <span className="text-sm font-medium text-white">{section.name}</span>
            </div>
                              <span className="text-sm font-bold text-blue-400">{section.score}/100</span>
                            </div>
                            <AnimatedProgress
                              value={section.score}
                              max={100}
                              className="h-2.5 bg-zinc-800 mb-1"
                              indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                              delay={0.3 + index * 0.1}
                            />
                            <p className="text-xs text-zinc-400">{feedback}</p>
                          </motion.div>
                        )
                      })}
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <div className="flex gap-3">
              <EnhancedButton
                variant="outline"
                className="flex-1"
                      onClick={resetUpload}
              >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                      className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                      onClick={() => router.push('/resume/report')}
                    >
                      Full Report
                      <ArrowRight className="ml-2 h-4 w-4" />
              </EnhancedButton>
            </div>
          </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
