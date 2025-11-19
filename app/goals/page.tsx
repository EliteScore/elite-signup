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
  Image,
  Link as LinkIcon,
  Type,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  const [activeTab, setActiveTab] = useState("overview")
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([])
  const [totalXP, setTotalXP] = useState(12840)
  const [streak, setStreak] = useState(8)
  const [level, setLevel] = useState(7)
  const [showCelebration, setShowCelebration] = useState(false)
  const [fetchedPreferences, setFetchedPreferences] = useState<{ goals?: string[], activities?: string[] } | null>(null)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [apiDailyChallenges, setApiDailyChallenges] = useState<any[]>([])
  const [isLoadingDailyChallenges, setIsLoadingDailyChallenges] = useState(false)
  const [apiMonthlyChallenges, setApiMonthlyChallenges] = useState<any[]>([])
  const [isLoadingMonthlyChallenges, setIsLoadingMonthlyChallenges] = useState(false)
  const [challengesXP, setChallengesXP] = useState<Record<number, number>>({})
  const [isLoadingXP, setIsLoadingXP] = useState(false)
  const [userTotalXP, setUserTotalXP] = useState<number | null>(null)

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingChallenge, setPendingChallenge] = useState<{ id: number; xp: number; uc_id?: number } | null>(null)
  const [verificationType, setVerificationType] = useState<"photo" | "link" | "text">("photo")
  const [verificationPhoto, setVerificationPhoto] = useState<File | null>(null)
  const [verificationLink, setVerificationLink] = useState("")
  const [verificationText, setVerificationText] = useState("")
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false)
  const verificationPhotoInputRef = useRef<HTMLInputElement>(null)
  
  // Verification status notification
  const [verificationStatus, setVerificationStatus] = useState<{
    show: boolean
    status: "sent" | "queued" | "approved" | "rejected"
    message: string
    details?: {
      queued?: boolean
      verified?: boolean
      verdict?: string
      ai_confidence?: number
      low_conf_reason?: string
    }
  } | null>(null)

  const PARSER_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

  // Helper function to map challenge data to icon based on goals/activities/tags
  const getChallengeIcon = (challenge: any) => {
    // Check activities first
    if (challenge.activities && challenge.activities.length > 0) {
      const activityName = challenge.activities[0]
      const activity = activityPreferences.find(a => a.name === activityName)
      if (activity) return activity.icon
    }
    
    // Check goals
    if (challenge.goals && challenge.goals.length > 0) {
      const goalName = challenge.goals[0]
      const goal = goalCategories.find(g => g.name === goalName)
      if (goal) return goal.icon
    }
    
    // Check tags for common keywords
    if (challenge.tags && challenge.tags.length > 0) {
      const tags = challenge.tags.map((t: string) => t.toLowerCase())
      if (tags.some((t: string) => t.includes('code') || t.includes('programming'))) return Code
      if (tags.some((t: string) => t.includes('network') || t.includes('connect'))) return Users
      if (tags.some((t: string) => t.includes('read') || t.includes('book'))) return BookOpen
      if (tags.some((t: string) => t.includes('speak') || t.includes('present'))) return Mic
      if (tags.some((t: string) => t.includes('project') || t.includes('build'))) return Rocket
    }
    
    // Default icon
    return Target
  }

  // Helper function to get category from goals/activities
  const getChallengeCategory = (challenge: any): string => {
    if (challenge.activities && challenge.activities.length > 0) {
      const activityName = challenge.activities[0]
      const activity = activityPreferences.find(a => a.name === activityName)
      if (activity) return activity.category
    }
    
    if (challenge.goals && challenge.goals.length > 0) {
      const goalName = challenge.goals[0]
      const goal = goalCategories.find(g => g.name === goalName)
      if (goal) return goal.id
    }
    
    return "learning"
  }

  // Map API challenge to component format
  const mapApiChallengeToComponent = (apiChallenge: any) => {
    const icon = getChallengeIcon(apiChallenge)
    const category = getChallengeCategory(apiChallenge)
    const difficulty = apiChallenge.difficulty 
      ? apiChallenge.difficulty.charAt(0).toUpperCase() + apiChallenge.difficulty.slice(1)
      : "Medium"
    const timeEstimate = apiChallenge.est_minutes 
      ? `${apiChallenge.est_minutes} mins`
      : "30 mins"
    
    return {
      id: apiChallenge.challenge_id || apiChallenge.uc_id,
      uc_id: apiChallenge.uc_id,
      title: apiChallenge.title || "Untitled Challenge",
      description: apiChallenge.description || "",
      xp: apiChallenge.base_xp || 100,
      difficulty,
      timeEstimate,
      category,
      icon,
      participants: 0, // Not in API response
      completions: 0, // Not in API response
      status: apiChallenge.status,
      progress_pct: apiChallenge.progress_pct || 0,
      due_at: apiChallenge.due_at,
      goals: apiChallenge.goals || [],
      activities: apiChallenge.activities || [],
      tags: apiChallenge.tags || [],
      cadence: apiChallenge.cadence || "daily",
    }
  }

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
      
      // Fetch preferences from API
      const fetchPreferences = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          console.log("[Preferences] No token available for fetching preferences")
          return
        }

        setIsLoadingPreferences(true)
        try {
          console.log("[Preferences] Fetching preferences from API...")
          const response = await fetch("/api/preferences/get_preferences", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.error("[Preferences] Failed to fetch preferences:", response.status, response.statusText)
            setIsLoadingPreferences(false)
            return
          }

          const data = await response.json()
          console.log("[Preferences] Fetched preferences:", data)
          
          if (data && (data.goals || data.activities)) {
            setFetchedPreferences(data)
            
            // Map API goals to goal IDs
            if (data.goals && Array.isArray(data.goals)) {
              const mappedGoalIds: string[] = data.goals
                .map((goalName: string) => goalCategories.find(g => g.name === goalName)?.id)
                .filter((id: string | undefined): id is string => Boolean(id))
              if (mappedGoalIds.length > 0) {
                setSelectedGoals(mappedGoalIds)
                localStorage.setItem("goals.selectedGoals", JSON.stringify(mappedGoalIds))
              }
            }
            
            // Map API activities to activity IDs
            if (data.activities && Array.isArray(data.activities)) {
              const mappedActivityIds: string[] = data.activities
                .map((activityName: string) => activityPreferences.find(a => a.name === activityName)?.id)
                .filter((id: string | undefined): id is string => Boolean(id))
              if (mappedActivityIds.length > 0) {
                setSelectedSkills(mappedActivityIds)
                localStorage.setItem("goals.selectedSkills", JSON.stringify(mappedActivityIds))
              }
            }
          }
        } catch (error) {
          console.error("[Preferences] Error fetching preferences:", error)
        } finally {
          setIsLoadingPreferences(false)
        }
      }

      // Fetch daily challenges from API
      const fetchDailyChallenges = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          console.log("[Daily Challenges] No token available for fetching challenges")
          return
        }

        setIsLoadingDailyChallenges(true)
        try {
          console.log("[Daily Challenges] Fetching daily challenges from API...")
          const response = await fetch("/api/challenges/get_daily", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.error("[Daily Challenges] Failed to fetch challenges:", response.status, response.statusText)
            setIsLoadingDailyChallenges(false)
            return
          }

          const data = await response.json()
          console.log("[Daily Challenges] Fetched challenges:", data)
          
          if (data && Array.isArray(data)) {
            const mappedChallenges = data.map(mapApiChallengeToComponent)
            setApiDailyChallenges(mappedChallenges)
            console.log("[Daily Challenges] Mapped challenges:", mappedChallenges)
          }
        } catch (error) {
          console.error("[Daily Challenges] Error fetching challenges:", error)
        } finally {
          setIsLoadingDailyChallenges(false)
        }
      }

      // Fetch monthly challenges from API
      const fetchMonthlyChallenges = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          console.log("[Monthly Challenges] No token available for fetching challenges")
          return
        }

        setIsLoadingMonthlyChallenges(true)
        try {
          console.log("[Monthly Challenges] Fetching monthly challenges from API...")
          const response = await fetch("/api/challenges/get_monthly", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.error("[Monthly Challenges] Failed to fetch challenges:", response.status, response.statusText)
            setIsLoadingMonthlyChallenges(false)
            return
          }

          const data = await response.json()
          console.log("[Monthly Challenges] Fetched challenges:", data)
          
          if (data && Array.isArray(data)) {
            const mappedChallenges = data.map(mapApiChallengeToComponent)
            setApiMonthlyChallenges(mappedChallenges)
            console.log("[Monthly Challenges] Mapped challenges:", mappedChallenges)
          }
        } catch (error) {
          console.error("[Monthly Challenges] Error fetching challenges:", error)
        } finally {
          setIsLoadingMonthlyChallenges(false)
        }
      }

      // Fetch challenges XP from API
      const fetchChallengesXP = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          console.log("[Challenges XP] No token available for fetching XP")
          return
        }

        setIsLoadingXP(true)
        try {
          console.log("[Challenges XP] Fetching challenges XP from API...")
          const response = await fetch("/api/challenges/get_challenges_xp", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            console.error("[Challenges XP] Failed to fetch XP:", response.status, response.statusText)
            setIsLoadingXP(false)
            return
          }

          const data = await response.json()
          console.log("[Challenges XP] Fetched XP data:", data)
          
          // Handle different response formats
          if (data) {
            // Check if it's the total XP format: {user_id, total_xp}
            if (data.total_xp !== undefined) {
              setUserTotalXP(data.total_xp)
              console.log("[Challenges XP] Set total XP:", data.total_xp)
            }
            
            // Also handle per-challenge XP if provided
            if (Array.isArray(data)) {
              // If it's an array, convert to object
              const xpMap: Record<number, number> = {}
              data.forEach((item: any) => {
                if (item.uc_id !== undefined && item.xp !== undefined) {
                  xpMap[item.uc_id] = item.xp
                }
              })
              setChallengesXP(xpMap)
            } else if (typeof data === 'object' && data.total_xp === undefined) {
              // If it's an object but not the total_xp format, assume it's per-challenge mapping
              setChallengesXP(data)
            }
            console.log("[Challenges XP] Mapped XP data:", { challengesXP, userTotalXP: data.total_xp })
          }
        } catch (error) {
          console.error("[Challenges XP] Error fetching XP:", error)
        } finally {
          setIsLoadingXP(false)
        }
      }
      
      fetchPreferences()
      fetchDailyChallenges()
      fetchMonthlyChallenges()
      fetchChallengesXP()
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

  const handleStartChallenge = async (ucId: number) => {
    const token = getStoredAccessToken()
    if (!token) {
      console.error("[Start Challenge] No token available")
      return
    }

    try {
      console.log("[Start Challenge] Starting challenge with uc_id:", ucId)
      const response = await fetch("/api/challenges/start_challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uc_id: ucId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to start challenge" }))
        console.error("[Start Challenge] Failed to start challenge:", errorData)
        return
      }

      const data = await response.json()
      console.log("[Start Challenge] Challenge started successfully:", data)
      
      // Update the challenge status in the local state to "started"
      // This ensures the challenge stays in "in progress" state
      setApiDailyChallenges(prev => 
        prev.map(c => {
          if (c.uc_id === ucId) {
            return { ...c, status: "started" }
          }
          return c
        })
      )
      setApiMonthlyChallenges(prev => 
        prev.map(c => {
          if (c.uc_id === ucId) {
            return { ...c, status: "started" }
          }
          return c
        })
      )
    } catch (error) {
      console.error("[Start Challenge] Error starting challenge:", error)
    }
  }

  const handleChallengeComplete = (challengeId: number, xp: number, ucId?: number) => {
    // Show verification modal instead of directly completing
    setPendingChallenge({ id: challengeId, xp, uc_id: ucId })
    setShowVerificationModal(true)
    setVerificationType("photo")
    setVerificationPhoto(null)
    setVerificationLink("")
    setVerificationText("")
  }

  const handleVerificationSubmit = async () => {
    if (!pendingChallenge || !pendingChallenge.uc_id) {
      alert("Invalid challenge. Please try again.")
      return
    }

    // Validate based on verification type
    if (verificationType === "photo" && !verificationPhoto) {
      alert("Please upload a photo to verify completion")
      return
    }
    if (verificationType === "link" && !verificationLink.trim()) {
      alert("Please provide a link to verify completion")
      return
    }
    if (verificationType === "text" && !verificationText.trim()) {
      alert("Please provide text description to verify completion")
      return
    }

    setIsSubmittingVerification(true)
    const token = getStoredAccessToken()
    
    if (!token) {
      alert("Authentication required. Please log in again.")
      setIsSubmittingVerification(false)
      return
    }

    try {
      let response: Response
      let apiUrl = ""

      // Call the appropriate verification endpoint
      if (verificationType === "photo" && verificationPhoto) {
        apiUrl = "/api/challenges/verify/photo"
        const formData = new FormData()
        formData.append("uc_id", String(pendingChallenge.uc_id))
        formData.append("photo", verificationPhoto)

        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
      } else if (verificationType === "link") {
        apiUrl = "/api/challenges/verify/link"
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uc_id: pendingChallenge.uc_id,
            link: verificationLink,
          }),
        })
      } else if (verificationType === "text") {
        apiUrl = "/api/challenges/verify/text"
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uc_id: pendingChallenge.uc_id,
            text: verificationText,
          }),
        })
      } else {
        throw new Error("Invalid verification type")
      }

      console.log("[Verification] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to verify challenge" }))
        console.error("[Verification] Verification failed:", errorData)
        
        let errorMessage = "Failed to verify challenge. Please try again."
        if (response.status === 400) {
          errorMessage = errorData.error || errorData.message || "Invalid verification data. Please check your input and try again."
        } else if (response.status === 404) {
          errorMessage = "Challenge not found. Please refresh and try again."
        }
        
        alert(errorMessage)
        setIsSubmittingVerification(false)
        return
      }

      const data = await response.json()
      console.log("[Verification] Verification response:", data)

      // Show "Request Sent" notification first
      setVerificationStatus({
        show: true,
        status: "sent",
        message: "Verification request sent successfully",
        details: data
      })

      // Check verification status from API response
      const isVerified = data.verified === true || data.verdict === "approve"
      const isQueued = data.queued === true

      if (isQueued) {
        // Challenge is queued for review - show detailed status
        setVerificationStatus({
          show: true,
          status: "queued",
          message: "Verification Queued for Review",
          details: {
            queued: true,
            verdict: data.verdict,
            ai_confidence: data.ai_confidence,
            low_conf_reason: data.low_conf_reason
          }
        })
        
        // Update challenge status to queued
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "queued" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "queued" } : c)
        )
        
        // Close modal and reset
        setShowVerificationModal(false)
        setPendingChallenge(null)
        setVerificationPhoto(null)
        setVerificationLink("")
        setVerificationText("")
        setIsSubmittingVerification(false)
        
        // Auto-hide notification after 8 seconds
        setTimeout(() => {
          setVerificationStatus(null)
        }, 8000)
        return
      }

      if (!isVerified) {
        // Verification was rejected - show detailed status
        setVerificationStatus({
          show: true,
          status: "rejected",
          message: "Verification Rejected",
          details: {
            verified: false,
            verdict: data.verdict || "reject",
            ai_confidence: data.ai_confidence,
            low_conf_reason: data.low_conf_reason
          }
        })
        setIsSubmittingVerification(false)
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setVerificationStatus(null)
        }, 10000)
        return
      }

      // Show approved status
      setVerificationStatus({
        show: true,
        status: "approved",
        message: "Verification Approved!",
        details: {
          verified: true,
          verdict: data.verdict || "approve",
          ai_confidence: data.ai_confidence
        }
      })

      // Only complete the challenge if verified and approved
      if (!completedChallenges.includes(pendingChallenge.id)) {
        const newCompleted = [...completedChallenges, pendingChallenge.id]
        const newXP = (userTotalXP !== null ? userTotalXP : totalXP) + pendingChallenge.xp
        setCompletedChallenges(newCompleted)
        setTotalXP(newXP)
        if (userTotalXP !== null) {
          setUserTotalXP(newXP)
        }
        localStorage.setItem("goals.completedChallenges", JSON.stringify(newCompleted))
        localStorage.setItem("goals.totalXP", String(newXP))
        
        // Update challenge status in API challenges
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "completed" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "completed" } : c)
        )
        
        // Show celebration
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }

      // Close modal and reset
      setShowVerificationModal(false)
      setPendingChallenge(null)
      setVerificationPhoto(null)
      setVerificationLink("")
      setVerificationText("")
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setVerificationStatus(null)
      }, 5000)
    } catch (error) {
      console.error("[Verification] Error submitting verification:", error)
      alert("Failed to submit verification. Please try again.")
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setVerificationPhoto(file)
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

      {/* Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Verify Challenge Completion
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Please provide verification to complete this challenge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Verification Type Tabs */}
            <Tabs value={verificationType} onValueChange={(v) => setVerificationType(v as "photo" | "link" | "text")}>
              <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                <TabsTrigger value="photo" className="data-[state=active]:bg-purple-600">
                  <Image className="h-4 w-4 mr-1" />
                  Photo
                </TabsTrigger>
                <TabsTrigger value="link" className="data-[state=active]:bg-purple-600">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="text" className="data-[state=active]:bg-purple-600">
                  <Type className="h-4 w-4 mr-1" />
                  Text
                </TabsTrigger>
              </TabsList>

              {/* Photo Verification */}
              <TabsContent value="photo" className="space-y-4 mt-4">
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-purple-500 transition-all cursor-pointer"
                  onClick={() => verificationPhotoInputRef.current?.click()}
                >
                  {verificationPhoto ? (
                    <div className="space-y-2">
                      <Image className="h-12 w-12 mx-auto text-green-400" />
                      <p className="text-sm text-white font-medium">{verificationPhoto.name}</p>
                      <p className="text-xs text-zinc-400">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="h-12 w-12 mx-auto text-zinc-500" />
                      <p className="text-sm text-zinc-400">Click to upload photo</p>
                      <p className="text-xs text-zinc-500">JPG, PNG, or GIF • Max 10MB</p>
                    </div>
                  )}
                  <input
                    ref={verificationPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </TabsContent>

              {/* Link Verification */}
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Verification Link</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/proof"
                    value={verificationLink}
                    onChange={(e) => setVerificationLink(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <p className="text-xs text-zinc-500">
                    Provide a link that proves you completed this challenge
                  </p>
                </div>
              </TabsContent>

              {/* Text Verification */}
              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Verification Description</label>
                  <Textarea
                    placeholder="Describe how you completed this challenge..."
                    value={verificationText}
                    onChange={(e) => setVerificationText(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                  />
                  <p className="text-xs text-zinc-500">
                    Provide a detailed description of how you completed this challenge
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <EnhancedButton
                variant="outline"
                className="flex-1 border-zinc-700"
                onClick={() => {
                  setShowVerificationModal(false)
                  setPendingChallenge(null)
                }}
                disabled={isSubmittingVerification}
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={handleVerificationSubmit}
                disabled={isSubmittingVerification}
              >
                {isSubmittingVerification ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Verification
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </EnhancedButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Status Notification */}
      <AnimatePresence>
        {verificationStatus && verificationStatus.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <EnhancedCard
              variant="gradient"
              className={cn(
                "border shadow-2xl",
                verificationStatus.status === "sent"
                  ? "bg-blue-900/90 border-blue-700/50"
                  : verificationStatus.status === "queued"
                  ? "bg-yellow-900/90 border-yellow-700/50"
                  : verificationStatus.status === "approved"
                  ? "bg-green-900/90 border-green-700/50"
                  : "bg-red-900/90 border-red-700/50"
              )}
            >
              <EnhancedCardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    verificationStatus.status === "sent"
                      ? "bg-blue-600"
                      : verificationStatus.status === "queued"
                      ? "bg-yellow-600"
                      : verificationStatus.status === "approved"
                      ? "bg-green-600"
                      : "bg-red-600"
                  )}>
                    {verificationStatus.status === "sent" && (
                      <CheckCircle className="h-5 w-5 text-white" />
                    )}
                    {verificationStatus.status === "queued" && (
                      <Clock className="h-5 w-5 text-white" />
                    )}
                    {verificationStatus.status === "approved" && (
                      <CheckCircle className="h-5 w-5 text-white" />
                    )}
                    {verificationStatus.status === "rejected" && (
                      <X className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white">
                        {verificationStatus.status === "sent" && "Request Sent"}
                        {verificationStatus.status === "queued" && "Queued for Review"}
                        {verificationStatus.status === "approved" && "Verification Approved"}
                        {verificationStatus.status === "rejected" && "Verification Rejected"}
                      </h4>
                      <button
                        onClick={() => setVerificationStatus(null)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-300 mb-2">{verificationStatus.message}</p>
                    
                    {verificationStatus.details && (
                      <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-700/50">
                        {verificationStatus.details.verdict && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Verdict:</span>
                            <Badge className={cn(
                              "text-xs px-2 py-0.5",
                              verificationStatus.details.verdict === "approve"
                                ? "bg-green-900/40 text-green-400 border-green-700/50"
                                : "bg-red-900/40 text-red-400 border-red-700/50"
                            )}>
                              {verificationStatus.details.verdict === "approve" ? "Approved" : "Rejected"}
                            </Badge>
                          </div>
                        )}
                        {verificationStatus.details.ai_confidence !== undefined && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">AI Confidence:</span>
                            <span className="text-white font-medium">
                              {(verificationStatus.details.ai_confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {verificationStatus.details.queued && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Status:</span>
                            <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-700/50 text-xs px-2 py-0.5">
                              Queued
                            </Badge>
                          </div>
                        )}
                        {verificationStatus.details.low_conf_reason && (
                          <div className="text-xs mt-2">
                            <span className="text-zinc-400 block mb-1">Reason:</span>
                            <p className="text-zinc-300 bg-zinc-800/50 p-2 rounded border border-zinc-700/50">
                              {verificationStatus.details.low_conf_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </EnhancedCardContent>
            </EnhancedCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-20">
        <div className="max-w-md mx-auto px-4 py-4 sm:py-6">
          {/* Premium Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900/80 border border-blue-700/40 rounded-xl p-1 mb-6 shadow-[0_0_30px_rgba(80,0,255,0.3)] grid grid-cols-3 w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="challenges"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <Zap className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger
                value="resume"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(80,0,255,0.5)] rounded-lg transition-all duration-300 text-xs"
              >
                <FileText className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Score</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Your Journey Header Section */}
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                <EnhancedCardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
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
                    <div className="flex-1">
                      <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Your Journey
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 px-2 py-0 text-xs">
                          Level {level}
                        </Badge>
                        <span className="text-xs text-zinc-500">Rank #3</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 cursor-pointer">
                        <EnhancedCardContent className="p-3 text-center">
                          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            <AnimatedCounter 
                              from={0} 
                              to={userTotalXP !== null ? userTotalXP : totalXP} 
                              duration={1.5} 
                            />
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
                </EnhancedCardContent>
              </EnhancedCard>

              {/* Settings & Analytics Section */}
              <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-purple-700/40 shadow-xl rounded-2xl">
                <EnhancedCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-purple-400" />
                      Settings & Analytics
                    </EnhancedCardTitle>
                  </div>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                  {/* Current Goals */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-blue-400" />
                      Current Goals
                      {isLoadingPreferences && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full ml-2"
                        />
                      )}
                    </h3>
                    <div className="space-y-2">
                      {isLoadingPreferences ? (
                        <p className="text-xs text-zinc-500 text-center py-2">Loading goals...</p>
                      ) : selectedGoals.length > 0 ? (
                        selectedGoals.map((goalId) => {
                          const goal = goalCategories.find(g => g.id === goalId)
                          if (!goal) return null
                          return (
                            <motion.div
                              key={goalId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goal.gradient} flex items-center justify-center`}>
                                  <goal.icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-white">{goal.name}</h4>
                                  <p className="text-xs text-zinc-400">{goal.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-zinc-500 text-center py-2">No goals selected</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Skills/Activities */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
                      Selected Activities
                      {isLoadingPreferences && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full ml-2"
                        />
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {isLoadingPreferences ? (
                        <p className="text-xs text-zinc-500">Loading activities...</p>
                      ) : selectedSkills.length > 0 ? (
                        selectedSkills.map((skillId) => {
                          const skill = activityPreferences.find(s => s.id === skillId)
                          if (!skill) return null
                          return (
                            <Badge
                              key={skillId}
                              variant="outline"
                              className="text-xs border-purple-700/50 text-purple-400 bg-purple-900/20"
                            >
                              <skill.icon className="h-3 w-3 mr-1" />
                              {skill.name}
                            </Badge>
                          )
                        })
                      ) : (
                        <p className="text-xs text-zinc-500">No activities selected</p>
                      )}
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-yellow-400" />
                      Level Progress
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Current Level</span>
                        <span className="text-white font-bold">Level {level}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Total XP</span>
                        <span className="text-blue-400 font-bold">{totalXP.toLocaleString()} XP</span>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/50">
                        <div className="text-[10px] text-zinc-500 mb-1">XP to Next Level (estimated)</div>
                        <Progress
                          value={((totalXP % 2000) / 2000) * 100}
                          className="h-2"
                          indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-500"
                        />
                        <div className="text-[10px] text-zinc-400 mt-1">
                          {2000 - (totalXP % 2000)} XP until Level {level + 1}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Challenges Analytics */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <BarChart2 className="h-4 w-4 mr-2 text-green-400" />
                      Challenges Analytics
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <div className="text-xs text-zinc-400 mb-1">Completed</div>
                        <div className="text-xl font-bold text-green-400">
                          {apiDailyChallenges.filter(c => c.status === "completed" || completedChallenges.includes(c.id)).length}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">out of {apiDailyChallenges.length || 0} daily</div>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <div className="text-xs text-zinc-400 mb-1">Completion Rate</div>
                        <div className="text-xl font-bold text-blue-400">
                          {apiDailyChallenges.length > 0 
                            ? Math.round((apiDailyChallenges.filter(c => c.status === "completed" || completedChallenges.includes(c.id)).length / apiDailyChallenges.length) * 100)
                            : 0}%
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-1">Daily Challenges</div>
                      </div>
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-400">Daily Challenges</span>
                        <span className="text-xs font-bold text-white">
                          {apiDailyChallenges.filter(c => c.status === "completed" || completedChallenges.includes(c.id)).length} / {apiDailyChallenges.length || 0}
                        </span>
                      </div>
                      <Progress
                        value={apiDailyChallenges.length > 0 
                          ? (apiDailyChallenges.filter(c => c.status === "completed" || completedChallenges.includes(c.id)).length / apiDailyChallenges.length) * 100
                          : 0}
                        className="h-1.5"
                        indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
                      />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-400">Monthly Challenges</span>
                        <span className="text-xs font-bold text-white">
                          {completedChallenges.filter(id => monthlyChallenges.some(c => c.id === id)).length} / {monthlyChallenges.length}
                        </span>
                      </div>
                      <Progress
                        value={(completedChallenges.filter(id => monthlyChallenges.some(c => c.id === id)).length / monthlyChallenges.length) * 100}
                        className="h-1.5"
                        indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>

                  {/* Achievements Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-yellow-400" />
                      Achievements
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {achievements.slice(0, 3).map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "aspect-square rounded-lg flex flex-col items-center justify-center p-2 relative",
                            achievement.earned
                              ? achievement.rarity === "legendary"
                                ? "bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500"
                                : achievement.rarity === "epic"
                                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                                : "bg-gradient-to-br from-blue-500 to-cyan-500"
                              : "bg-zinc-800/50 border border-zinc-700 opacity-50"
                          )}
                        >
                          {achievement.earned ? (
                            <>
                              <achievement.icon className="h-6 w-6 text-white mb-1" />
                              <span className="text-[9px] font-bold text-white text-center">{achievement.name}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-6 w-6 text-zinc-600 mb-1" />
                              <span className="text-[9px] text-zinc-600 text-center">Locked</span>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <EnhancedButton
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => setActiveTab("challenges")}
                    >
                      View All Achievements
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </EnhancedButton>
                  </div>

                  {/* Change Goals & Activities */}
                  <div className="pt-4 border-t border-zinc-700/50">
                    <EnhancedButton
                      variant="outline"
                      className="w-full border-purple-700/50 text-purple-400 hover:bg-purple-900/20 hover:border-purple-600/50"
                      onClick={resetOnboarding}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Change Goals & Activities
                    </EnhancedButton>
                    <p className="text-xs text-zinc-500 text-center mt-2">
                      Update your goals and activities preferences
                    </p>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </TabsContent>

            {/* Challenges Tab */}
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
                  {isLoadingDailyChallenges ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : apiDailyChallenges.length > 0 ? (
                    apiDailyChallenges.map((challenge, index) => {
                      const isCompleted = completedChallenges.includes(challenge.id) || challenge.status === "completed"
                      const isStarted = challenge.status === "started"
                      
                      return (
                        <motion.div
                          key={challenge.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            isCompleted
                              ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                              : isStarted
                              ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                              : "bg-zinc-800/50 border-zinc-700/50"
                          )}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <motion.div
                              whileHover={{ rotate: 5 }}
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                isCompleted
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                  : "bg-gradient-to-br from-blue-500 to-purple-500"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-6 w-6 text-white" />
                              ) : (
                                <challenge.icon className="h-6 w-6 text-white" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h4 className={cn(
                                  "text-sm font-semibold",
                                  isCompleted ? "text-green-400 line-through" : "text-white"
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
                                {isStarted && (
                                  <Badge className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-400 border-blue-700/50">
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Started
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge className="text-xs px-2 py-0.5 bg-green-900/40 text-green-400 border-green-700/50">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 mb-3">{challenge.description}</p>
                              
                              {/* Goals */}
                              {challenge.goals && challenge.goals.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-zinc-500 mb-1">Goals:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {challenge.goals.map((goal: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-blue-700/50 text-blue-400 bg-blue-900/20">
                                        {goal}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Activities */}
                              {challenge.activities && challenge.activities.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-zinc-500 mb-1">Activities:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {challenge.activities.map((activity: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-purple-700/50 text-purple-400 bg-purple-900/20">
                                        {activity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Tags */}
                              {challenge.tags && challenge.tags.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-1">
                                    {challenge.tags.map((tag: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700/50 text-zinc-400 bg-zinc-800/50">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3 text-xs flex-wrap mb-3">
                                <span className="flex items-center gap-1 text-zinc-500">
                                  <Timer className="h-3 w-3" />
                                  {challenge.timeEstimate}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-400 font-medium">
                                  <Award className="h-3 w-3" />
                                  {challengesXP[challenge.uc_id] !== undefined 
                                    ? `${challengesXP[challenge.uc_id]} XP`
                                    : `+${challenge.xp} XP`
                                  }
                                </span>
                                {challenge.progress_pct > 0 && (
                                  <span className="flex items-center gap-1 text-blue-400">
                                    <BarChart2 className="h-3 w-3" />
                                    {challenge.progress_pct}% complete
                                  </span>
                                )}
                              </div>
                              
                              {/* Complete Button - only show when started */}
                              {isStarted && !isCompleted && (
                                <EnhancedButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleChallengeComplete(challenge.id, challenge.xp, challenge.uc_id)
                                  }}
                                  variant="gradient"
                                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete
                                </EnhancedButton>
                              )}
                              
                              {/* Start Button - only show when not started */}
                              {!isStarted && !isCompleted && challenge.uc_id && (
                                <EnhancedButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartChallenge(challenge.uc_id)
                                  }}
                                  variant="gradient"
                                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Start Challenge
                                </EnhancedButton>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-zinc-400 mb-2">No daily challenges available</p>
                      <p className="text-xs text-zinc-500">Check back later for new challenges!</p>
                    </div>
                  )}
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
                  {isLoadingMonthlyChallenges ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : apiMonthlyChallenges.length > 0 ? (
                    apiMonthlyChallenges.slice(0, 1).map((challenge, index) => {
                      const isCompleted = completedChallenges.includes(challenge.id) || challenge.status === "completed"
                      const isStarted = challenge.status === "started"
                      
                      return (
                        <motion.div
                          key={challenge.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all",
                            isCompleted
                              ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                              : isStarted
                              ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                              : "bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border-zinc-700/50"
                          )}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <motion.div
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                className={cn(
                                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0",
                                  isCompleted
                                    ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                    : isStarted
                                    ? "bg-gradient-to-br from-blue-500 to-purple-500"
                                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-7 w-7 text-white" />
                                ) : (
                                  <challenge.icon className="h-7 w-7 text-white" />
                                )}
                              </motion.div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className={cn(
                                      "text-sm font-semibold",
                                      isCompleted ? "text-green-400 line-through" : "text-white"
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
                                    {isStarted && (
                                      <Badge className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-400 border-blue-700/50">
                                        <PlayCircle className="h-3 w-3 mr-1" />
                                        Started
                                      </Badge>
                                    )}
                                    {isCompleted && (
                                      <Badge className="text-xs px-2 py-0.5 bg-green-900/40 text-green-400 border-green-700/50">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Completed
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge className={cn(
                                    "text-xs",
                                    isCompleted
                                      ? "bg-green-900/40 text-green-400 border-green-700/50"
                                      : isStarted
                                      ? "bg-blue-900/40 text-blue-400 border-blue-700/50"
                                      : "bg-purple-900/40 text-purple-400 border-purple-700/50"
                                  )}>
                                    {challenge.progress_pct || 0}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-zinc-400 mb-3">{challenge.description}</p>
                                
                                {/* Goals */}
                                {challenge.goals && challenge.goals.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-[10px] text-zinc-500 mb-1">Goals:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {challenge.goals.map((goal: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-blue-700/50 text-blue-400 bg-blue-900/20">
                                          {goal}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Activities */}
                                {challenge.activities && challenge.activities.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-[10px] text-zinc-500 mb-1">Activities:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {challenge.activities.map((activity: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-purple-700/50 text-purple-400 bg-purple-900/20">
                                          {activity}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Tags */}
                                {challenge.tags && challenge.tags.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {challenge.tags.map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700/50 text-zinc-400 bg-zinc-800/50">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap mb-3">
                                  {challenge.due_at && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      Due {new Date(challenge.due_at).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-zinc-500">
                                    <Timer className="h-3 w-3" />
                                    {challenge.timeEstimate}
                                  </span>
                                  <span className="flex items-center gap-1 text-yellow-400 font-medium">
                                    <Trophy className="h-3 w-3" />
                                    {challengesXP[challenge.uc_id] !== undefined 
                                      ? `${challengesXP[challenge.uc_id]} XP`
                                      : `+${challenge.xp} XP`
                                    }
                                  </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="space-y-2 mb-3">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-400">Progress</span>
                                    <span className="text-purple-400 font-medium">{challenge.progress_pct || 0}%</span>
                                  </div>
                                  <Progress
                                    value={challenge.progress_pct || 0}
                                    className="h-2.5"
                                    indicatorClassName="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                  />
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  {/* In Progress Button - always show when not completed */}
                                  {!isCompleted && challenge.uc_id && (
                                    <EnhancedButton
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (!isStarted) {
                                          handleStartChallenge(challenge.uc_id)
                                        }
                                      }}
                                      variant="gradient"
                                      className={cn(
                                        "flex-1",
                                        isStarted
                                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white cursor-not-allowed opacity-75"
                                          : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                                      )}
                                      disabled={isStarted}
                                    >
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      {isStarted ? "In Progress" : "Start Challenge"}
                                    </EnhancedButton>
                                  )}
                                  
                                  {/* Complete Button - only show when started and not completed */}
                                  {isStarted && !isCompleted && (
                                    <EnhancedButton
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleChallengeComplete(challenge.id, challenge.xp, challenge.uc_id)
                                      }}
                                      variant="gradient"
                                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Complete
                                    </EnhancedButton>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-zinc-400 mb-2">No monthly challenges available</p>
                      <p className="text-xs text-zinc-500">Check back later for new challenges!</p>
                    </div>
                  )}
                  </EnhancedCardContent>
                </EnhancedCard>

              {/* Achievements Section */}
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
