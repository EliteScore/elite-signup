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
  RefreshCw,
  Loader2,
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
import { goalCategories, activityPreferences, achievements, monthlyChallenges } from "./constants"
import { mapApiChallengeToComponent } from "./utils"
import { OnboardingFlow } from "./components/OnboardingFlow"
import { VerificationModal } from "./components/VerificationModal"


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

  // Onboarding state
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<'goals' | 'skills'>('goals')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  // Resume scores state
  const [resumeScores, setResumeScores] = useState<{
    user_id: number
    overall_score: number
    projects_score: number
    experience_score: number
    education_score: number
    skills_score: number
  } | null>(null)
  const [isLoadingResumeScores, setIsLoadingResumeScores] = useState(false)

  // Dashboard state
  const [activeTab, setActiveTab] = useState("overview")
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([])
  const [totalXP, setTotalXP] = useState(12840)
  const [streak, setStreak] = useState(8)
  const [streakBoost, setStreakBoost] = useState<{ streak_day: number; boost_percent: number } | null>(null)
  const [isLoadingStreakBoost, setIsLoadingStreakBoost] = useState(false)
  const [levelData, setLevelData] = useState<{ level: number; xp_to_next?: number; [key: string]: any } | null>(null)
  const [isLoadingLevel, setIsLoadingLevel] = useState(false)
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
  const [challengeStats, setChallengeStats] = useState<Array<{
    status: "verified" | "skipped" | "expired"
    count: number
    percentage: number
  }>>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)

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
  
  // Processing verification state
  const [isProcessingVerification, setIsProcessingVerification] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("Submitting verification...")
  const [processingChallenge, setProcessingChallenge] = useState<{ id: number; title: string; uc_id?: number } | null>(null)


  // Fetch challenges XP from API (per-challenge XP only)
  const fetchChallengesXP = async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    setIsLoadingXP(true)
    try {
      const response = await fetch("/api/challenges/get_challenges_xp", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setIsLoadingXP(false)
        return
      }

      const data = await response.json()
      
      // Handle per-challenge XP only
      if (data) {
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
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingXP(false)
    }
  }

  // Fetch challenges stats from API
  const fetchChallengesStats = async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    setIsLoadingStats(true)
    try {
      const response = await fetch("/api/challenges/stats", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setIsLoadingStats(false)
        return
      }

      const data = await response.json()
      
      if (data && Array.isArray(data)) {
        setChallengeStats(data)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch streak boost from API
  const fetchStreakBoost = async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    setIsLoadingStreakBoost(true)
    try {
      const response = await fetch("/api/xp/get_streak_boost", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setIsLoadingStreakBoost(false)
        return
      }

      const data = await response.json()
      
      if (data && data.streak_day !== undefined && data.boost_percent !== undefined) {
        setStreakBoost({ streak_day: data.streak_day, boost_percent: data.boost_percent })
        setStreak(data.streak_day) // Update streak from API
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingStreakBoost(false)
    }
  }

  // Fetch current level from API
  const fetchCurrentLevel = async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    setIsLoadingLevel(true)
    try {
      const response = await fetch("/api/xp/current-level", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setIsLoadingLevel(false)
        return
      }

      const data = await response.json()
      
      if (data && data.level_data) {
        const levelInfo = data.level_data
        // Store full level data (includes level, xp_to_next, etc.)
        setLevelData(levelInfo)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingLevel(false)
    }
  }

  // Fetch total XP from API
  const fetchTotalXP = async () => {
    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    setIsLoadingXP(true)
    try {
      const response = await fetch("/api/xp/get_xp", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setIsLoadingXP(false)
        return
      }

      const data = await response.json()
      
      if (data && data.total_xp !== undefined) {
        setUserTotalXP(data.total_xp)
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoadingXP(false)
    }
  }

  // Check for onboarding completion on mount
  useEffect(() => {
    if (!isAuthorized) return

    const onboardingComplete = localStorage.getItem("goals.onboarding.complete")
    const storedGoals = localStorage.getItem("goals.selectedGoals")
    const storedSkills = localStorage.getItem("goals.selectedSkills")
    const storedXP = localStorage.getItem("goals.totalXP")
    const storedCompleted = localStorage.getItem("goals.completedChallenges")

    if (onboardingComplete === "true") {
      setHasCompletedOnboarding(true)
      if (storedGoals) setSelectedGoals(JSON.parse(storedGoals))
      if (storedSkills) setSelectedSkills(JSON.parse(storedSkills))
      if (storedXP) setTotalXP(Number(storedXP))
      if (storedCompleted) setCompletedChallenges(JSON.parse(storedCompleted))
      
      // Fetch preferences from API
      const fetchPreferences = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          return
        }

        setIsLoadingPreferences(true)
        try {
          const response = await fetch("/api/preferences/get_preferences", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            setIsLoadingPreferences(false)
            return
          }

          const data = await response.json()
          
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
          // Silent error handling
        } finally {
          setIsLoadingPreferences(false)
        }
      }

      // Fetch daily challenges from API
      const fetchDailyChallenges = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          return
        }

        setIsLoadingDailyChallenges(true)
        try {
          const response = await fetch("/api/challenges/get_daily", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            setIsLoadingDailyChallenges(false)
            return
          }

          const data = await response.json()
          
          if (data && Array.isArray(data)) {
            const mappedChallenges = data.map(mapApiChallengeToComponent)
            setApiDailyChallenges(mappedChallenges)
          }
        } catch (error) {
          // Silent error handling
        } finally {
          setIsLoadingDailyChallenges(false)
        }
      }

      // Fetch monthly challenges from API
      const fetchMonthlyChallenges = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          return
        }

        setIsLoadingMonthlyChallenges(true)
        try {
          const response = await fetch("/api/challenges/get_monthly", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            setIsLoadingMonthlyChallenges(false)
            return
          }

          const data = await response.json()
          
          if (data && Array.isArray(data)) {
            const mappedChallenges = data.map(mapApiChallengeToComponent)
            setApiMonthlyChallenges(mappedChallenges)
          }
        } catch (error) {
          // Silent error handling
        } finally {
          setIsLoadingMonthlyChallenges(false)
        }
      }

      // Fetch resume scores from API
      const fetchResumeScores = async () => {
        const token = getStoredAccessToken()
        if (!token) {
          return
        }

        setIsLoadingResumeScores(true)
        try {
          const response = await fetch("/api/users/resume-scores", {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setResumeScores(data)
          } else if (response.status === 404) {
            // No resume scores - user needs to upload
            setResumeScores(null)
          }
        } catch (error) {
          // Silent error handling
        } finally {
          setIsLoadingResumeScores(false)
        }
      }

      // Initialize and fetch data
      const initializeData = async () => {
        await fetchPreferences()
        // Fetch challenges - backend handles refreshing automatically via cron jobs
        fetchDailyChallenges()
        fetchMonthlyChallenges()
        fetchChallengesXP() // Fetch per-challenge XP only
        fetchTotalXP() // Fetch total XP
        fetchChallengesStats()
        fetchStreakBoost() // Fetch streak boost
        fetchCurrentLevel() // Fetch current level
        fetchResumeScores() // Fetch resume scores
      }

      initializeData()
    }
  }, [isAuthorized])

  // Ensure stats are refreshed when component mounts or when overview tab becomes active
  useEffect(() => {
    if (!isAuthorized) return
    
    const token = getStoredAccessToken()
    if (!token) return

    // Refresh stats when overview tab is active (including on initial mount)
    if (activeTab === "overview") {
      fetchChallengesStats()
    }
  }, [isAuthorized, activeTab])

  // Also refresh stats on page visibility change (when user comes back to the tab)
  useEffect(() => {
    if (!isAuthorized) return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTab === "overview") {
        const token = getStoredAccessToken()
        if (token) {
          fetchChallengesStats()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthorized, activeTab])

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
        throw new Error("Invalid goals or activities selected. Please reselect and try again.")
      }

      const token = getStoredAccessToken()
      if (!token) {
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
      
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      let response: Response
      try {
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
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error("Request timed out. Please check your connection and try again.")
          }
          throw new Error(`Network error: ${fetchError.message}`)
        }
        throw fetchError
      }

      if (!response.ok) {
        let errorText = ""
        let errorJson: any = null
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            errorJson = await response.json()
            errorText = JSON.stringify(errorJson, null, 2)
          } else {
            errorText = await response.text()
          }
        } catch {
          errorText = `Status ${response.status}: ${response.statusText}`
        }
        
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
        } else {
          result = await response.text()
        }
      } catch {
        result = null
      }

      // Save to localStorage
      localStorage.setItem("goals.onboarding.complete", "true")
      localStorage.setItem("goals.selectedGoals", JSON.stringify(selectedGoals))
      localStorage.setItem("goals.selectedSkills", JSON.stringify(selectedSkills))
      setHasCompletedOnboarding(true)
      setIsSavingPreferences(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      
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
      return
    }

    try {
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
        alert(errorData.error || "Failed to start challenge. Please try again.")
        return
      }

      await response.json()
      
      // Find the challenge to get its details
      const challenge = apiDailyChallenges.find(c => c.uc_id === ucId) || 
                       apiMonthlyChallenges.find(c => c.uc_id === ucId)
      
      if (!challenge) {
        return
      }
      
      // Update the challenge status in the local state to "started"
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
      
      // Automatically open verification modal after starting
      setPendingChallenge({ id: challenge.id, xp: challenge.xp, uc_id: ucId })
      setShowVerificationModal(true)
      setVerificationType("photo")
      setVerificationPhoto(null)
      setVerificationLink("")
      setVerificationText("")
    } catch (error) {
      alert("Failed to start challenge. Please try again.")
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
    if (verificationType === "text") {
      const trimmedText = verificationText.trim()
      if (!trimmedText) {
        alert("Please provide text description to verify completion")
        return
      }
      if (trimmedText.length < 50) {
        alert(`Text must be at least 50 characters long. You have ${trimmedText.length} characters. Please provide more details.`)
        return
      }
    }

    setIsSubmittingVerification(true)
    const token = getStoredAccessToken()
    
    if (!token) {
      alert("Authentication required. Please log in again.")
      setIsSubmittingVerification(false)
      return
    }

    // Close verification modal and show processing overlay
    setShowVerificationModal(false)
    setIsProcessingVerification(true)
    setProcessingMessage("Submitting verification...")
    
    // Find challenge title for display
    const challenge = apiDailyChallenges.find(c => c.uc_id === pendingChallenge.uc_id) || 
                     apiMonthlyChallenges.find(c => c.uc_id === pendingChallenge.uc_id)
    setProcessingChallenge({
      id: pendingChallenge.id,
      title: challenge?.title || "Challenge",
      uc_id: pendingChallenge.uc_id
    })

    // Update challenge status to "verifying" immediately
    setApiDailyChallenges(prev => 
      prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "verifying" } : c)
    )
    setApiMonthlyChallenges(prev => 
      prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "verifying" } : c)
    )

    try {
      // Update message after a short delay
      setTimeout(() => {
        setProcessingMessage("AI is analyzing your submission...")
      }, 1000)

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

      // Update message while waiting for response
      setTimeout(() => {
        setProcessingMessage("Verifying challenge completion...")
      }, 2000)

      if (!response.ok) {
        let errorData: any = null
        try {
          const responseText = await response.text()
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: responseText || "Failed to verify challenge" }
          }
        } catch {
          errorData = { error: "Failed to verify challenge" }
        }
        
        // Hide processing overlay
        setIsProcessingVerification(false)
        setProcessingChallenge(null)
        
        // Extract error message properly
        let errorMessage = "Failed to verify challenge. Please try again."
        if (response.status === 400) {
          // Handle different error response formats
          if (typeof errorData?.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData?.error?.error) {
            errorMessage = errorData.error.error
          } else if (errorData?.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData?.message) {
            errorMessage = errorData.message
          } else if (errorData?.error && typeof errorData.error === 'object') {
            errorMessage = JSON.stringify(errorData.error)
          } else {
            errorMessage = "Invalid verification data. Please check your input and try again."
            if (verificationType === "text") {
              errorMessage = "Text must be at least 50 characters long. Please provide more details about how you completed the challenge."
            } else if (verificationType === "link") {
              errorMessage = "Invalid or unreachable URL. Please check your link and try again."
            } else if (verificationType === "photo") {
              errorMessage = "Invalid photo. Please ensure the file is a valid image (JPG, PNG) under 5MB."
            }
          }
        } else if (response.status === 404) {
          errorMessage = "Challenge not found. Please refresh and try again."
        }
        
        // Revert status from "verifying" back to "started"
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        
        alert(errorMessage)
        setIsSubmittingVerification(false)
        return
      }

      const data = await response.json()

      // Hide processing overlay
      setIsProcessingVerification(false)
      setProcessingChallenge(null)

      // Check verification status from API response
      // IMPORTANT: Check verdict FIRST - if reject, show rejected immediately
      const verdict = data.verdict || "approve"
      const isRejected = verdict === "reject"
      const isVerified = data.verified === true || verdict === "approve"
      const isQueued = data.queued === true && !isRejected // Only queue if not rejected

      // If rejected, show rejected status and allow retry
      if (isRejected) {
        setVerificationStatus({
          show: true,
          status: "rejected",
          message: "Verification Rejected",
          details: {
            verified: false,
            verdict: "reject",
            ai_confidence: data.ai_confidence,
            low_conf_reason: data.low_conf_reason || data.reason || "Verification was rejected"
          }
        })
        
        // Revert status from "verifying" back to "started" so user can try again
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        
        // Reset form so user can submit again
        setPendingChallenge(null)
        setVerificationPhoto(null)
        setVerificationLink("")
        setVerificationText("")
        setIsSubmittingVerification(false)
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setVerificationStatus(null)
        }, 10000)
        return
      }

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
        
        // Update challenge status to queued (keep verifying state visible)
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "queued" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "queued" } : c)
        )
        
        // Reset form
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
        // Verification was rejected - show detailed status (fallback case)
        setVerificationStatus({
          show: true,
          status: "rejected",
          message: "Verification Rejected",
          details: {
            verified: false,
            verdict: data.verdict || "reject",
            ai_confidence: data.ai_confidence,
            low_conf_reason: data.low_conf_reason || data.reason
          }
        })
        
        // Revert status from "verifying" back to "started"
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        
        // Reset form so user can try again
        setPendingChallenge(null)
        setVerificationPhoto(null)
        setVerificationLink("")
        setVerificationText("")
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
      
      // Refresh stats, XP, streak, and level after challenge completion
      fetchChallengesStats()
      fetchChallengesXP() // Per-challenge XP
      fetchTotalXP() // Total XP
      fetchStreakBoost()
      fetchCurrentLevel()
      
      // Show celebration
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      }

      // Reset form
      setPendingChallenge(null)
      setVerificationPhoto(null)
      setVerificationLink("")
      setVerificationText("")
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setVerificationStatus(null)
      }, 5000)
    } catch (error) {
      // Hide processing overlay
      setIsProcessingVerification(false)
      setProcessingChallenge(null)
      
      // Revert status from "verifying" back to "started"
      if (pendingChallenge?.uc_id) {
        setApiDailyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
        setApiMonthlyChallenges(prev => 
          prev.map(c => c.uc_id === pendingChallenge.uc_id ? { ...c, status: "started" } : c)
        )
      }
      
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
        <OnboardingFlow
          onboardingStep={onboardingStep}
          selectedGoals={selectedGoals}
          selectedSkills={selectedSkills}
          isSavingPreferences={isSavingPreferences}
          onGoalToggle={handleGoalToggle}
          onSkillToggle={handleSkillToggle}
          onStepChange={setOnboardingStep}
          onComplete={completeOnboarding}
        />
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
      <VerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        verificationType={verificationType}
        verificationPhoto={verificationPhoto}
        verificationLink={verificationLink}
        verificationText={verificationText}
        isSubmittingVerification={isSubmittingVerification}
        onTypeChange={setVerificationType}
        onPhotoChange={setVerificationPhoto}
        onLinkChange={setVerificationLink}
        onTextChange={setVerificationText}
        onSubmit={handleVerificationSubmit}
        onCancel={() => {
          setShowVerificationModal(false)
          setPendingChallenge(null)
        }}
      />

      {/* Full-Screen Processing Overlay */}
      <AnimatePresence>
        {isProcessingVerification && processingChallenge && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
                              <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="flex flex-col items-center space-y-6">
                {/* Animated Spinner */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-blue-500 border-l-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                                  </div>
                    </div>

                {/* Processing Message */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Verifying Challenge
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {processingMessage}
                  </p>
                  {processingChallenge && (
                    <p className="text-xs text-zinc-500 mt-2">
                      {processingChallenge.title}
                    </p>
                  )}
                </div>

                {/* Progress Indicator */}
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Processing...</span>
                    <span>Please wait</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                    />
                                </div>
                                </div>
                    </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <span className="text-xs font-bold text-white">
                      {isLoadingLevel ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        levelData?.level ?? '-'
                      )}
                    </span>
                          </div>
                        </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Your Journey
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 px-2 py-0 text-xs">
                      Level {isLoadingLevel ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin inline ml-1" />
                      ) : (
                        levelData?.level ?? '-'
                      )}
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
                        {streakBoost?.streak_day ?? streak}
                          </span>
                            </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Day Streak</div>
                    {isLoadingStreakBoost ? (
                      <div className="text-[9px] text-zinc-500 mt-1 flex items-center justify-center gap-1">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        <span>Loading boost...</span>
                      </div>
                    ) : streakBoost?.boost_percent !== undefined ? (
                      <div className="text-[9px] text-orange-400 mt-1 font-semibold">
                        +{streakBoost.boost_percent.toFixed(1)}% XP Boost
                      </div>
                    ) : null}
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
                        <span className="text-white font-bold">
                          Level {isLoadingLevel ? (
                            <Loader2 className="h-3 w-3 animate-spin inline ml-1" />
                          ) : (
                            levelData?.level ?? '-'
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400">Total XP</span>
                        <span className="text-blue-400 font-bold">
                          {isLoadingXP ? (
                            <Loader2 className="h-3 w-3 animate-spin inline" />
                          ) : (
                            (userTotalXP !== null ? userTotalXP : totalXP).toLocaleString() + " XP"
                          )}
                        </span>
                      </div>
                      {levelData?.xp_to_next !== undefined && levelData.xp_to_next !== null ? (
                      <div className="bg-zinc-800/50 rounded-lg p-2 border border-zinc-700/50">
                          <div className="text-[10px] text-zinc-500 mb-1">XP to Next Level</div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                            {levelData.xp_to_next} XP until Level {levelData.level !== undefined ? levelData.level + 1 : '-'}
                        </div>
                      </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Challenge Statistics - Compact UI */}
                  <div className="w-full">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                      <BarChart2 className="h-4 w-4 mr-2 text-green-400" />
                      Challenge Statistics
                      {isLoadingStats && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full ml-2"
                        />
                      )}
                      </h3>
                    
                    {isLoadingStats ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-green-400" />
                      </div>
                    ) : challengeStats.length > 0 ? (
                      <div className="space-y-2.5">
                          {challengeStats.map((stat, index) => {
                            const getColor = () => {
                              if (stat.status === "verified") return {
                              iconColor: "text-green-400",
                              textColor: "text-green-300",
                              bg: "bg-green-500/10",
                              border: "border-green-500/30",
                              gradient: "bg-gradient-to-r from-green-500 via-emerald-500 to-green-400"
                              }
                              if (stat.status === "skipped") return {
                              iconColor: "text-yellow-400",
                              textColor: "text-yellow-300",
                              bg: "bg-yellow-500/10",
                              border: "border-yellow-500/30",
                              gradient: "bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-400"
                              }
                              if (stat.status === "expired") return {
                              iconColor: "text-red-400",
                              textColor: "text-red-300",
                              bg: "bg-red-500/10",
                              border: "border-red-500/30",
                              gradient: "bg-gradient-to-r from-red-500 via-pink-500 to-red-400"
                              }
                              return {
                              iconColor: "text-zinc-400",
                              textColor: "text-zinc-300",
                              bg: "bg-zinc-500/10",
                              border: "border-zinc-500/30",
                              gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400"
                              }
                            }
                            const colors = getColor()
                            const getLabel = () => {
                              if (stat.status === "verified") return "Verified"
                              if (stat.status === "skipped") return "Skipped"
                              if (stat.status === "expired") return "Expired"
                              return stat.status
                            }
                            const getIcon = () => {
                              if (stat.status === "verified") return CheckCircle
                              if (stat.status === "skipped") return X
                              if (stat.status === "expired") return Clock
                              return BarChart2
                            }
                            const Icon = getIcon()
                            return (
                              <motion.div
                                key={stat.status}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className={`p-3 rounded-lg ${colors.bg} border ${colors.border} backdrop-blur-sm`}
                              >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${colors.iconColor}`} />
                                  <span className="text-xs font-semibold text-white">{getLabel()}</span>
                                  </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{stat.count}</span>
                                  <span className="text-[10px] text-zinc-400">{stat.percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                                  <Progress
                                    value={stat.percentage}
                                className="h-1.5"
                                indicatorClassName={colors.gradient}
                                  />
                              </motion.div>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
                        <BarChart2 className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                        <div className="text-xs text-zinc-500 font-medium">No statistics available</div>
                        <div className="text-[10px] text-zinc-600 mt-1">Complete challenges to see your statistics</div>
                      </div>
                    )}
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
                      const isVerifying = challenge.status === "verifying" || challenge.status === "queued"
                      
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
                              : isVerifying
                              ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
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
                                  : isVerifying
                                  ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                              : "bg-gradient-to-br from-blue-500 to-purple-500"
                          )}
                        >
                              {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                              ) : isVerifying ? (
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                          ) : (
                            <challenge.icon className="h-6 w-6 text-white" />
                          )}
                        </motion.div>
                          <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className={cn(
                                  "text-sm font-semibold flex-1",
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
                                {isStarted && !isVerifying && (
                                  <Badge className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-400 border-blue-700/50">
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Started
                                  </Badge>
                                )}
                                {isVerifying && (
                                  <Badge className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 border-yellow-700/50">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    {challenge.status === "queued" ? "Queued" : "Verifying..."}
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
                              
                              {/* Verify Button - only show when started and not verifying */}
                              {isStarted && !isCompleted && !isVerifying && (
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
                      const isVerifying = challenge.status === "verifying" || challenge.status === "queued"
                      
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
                              : isVerifying
                              ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
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
                                    : isVerifying
                                    ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                                    : isStarted
                                    ? "bg-gradient-to-br from-blue-500 to-purple-500"
                                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-7 w-7 text-white" />
                                ) : isVerifying ? (
                                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                                ) : (
                            <challenge.icon className="h-7 w-7 text-white" />
                                )}
                          </motion.div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap flex-1">
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
                                    {isStarted && !isVerifying && (
                                      <Badge className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-400 border-blue-700/50">
                                        <PlayCircle className="h-3 w-3 mr-1" />
                                        Started
                                      </Badge>
                                    )}
                                    {isVerifying && (
                                      <Badge className="text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-400 border-yellow-700/50">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        {challenge.status === "queued" ? "Queued" : "Verifying..."}
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
                                  {/* Start Button - only show when not started */}
                                  {!isStarted && !isCompleted && challenge.uc_id && (
                                    <EnhancedButton
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStartChallenge(challenge.uc_id)
                                      }}
                                      variant="gradient"
                                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                                    >
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Start Challenge
                    </EnhancedButton>
                                  )}
                                  
                                  {/* Verify Button - only show when started and not completed/verifying */}
                                  {isStarted && !isCompleted && !isVerifying && (
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

            {/* Resume Tab */}
            <TabsContent value="resume" className="space-y-4">
              {isLoadingResumeScores ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              ) : resumeScores ? (
                // User has resume scores - show button to view report
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
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full blur-xl opacity-50" />
                        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.8)]">
                          <Trophy className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                      Resume Score: {resumeScores.overall_score}
                    </h2>
                    <p className="text-sm text-zinc-400 mb-6 px-4">
                      View your detailed resume analysis and insights
                    </p>
                  </div>

                  <EnhancedCard variant="gradient" className="bg-zinc-900/80 border-blue-700/40 shadow-xl rounded-2xl">
                    <EnhancedCardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <BarChart2 className="h-6 w-6 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">View Full Report</h3>
                        </div>
                        <p className="text-sm text-zinc-400 mb-6">
                          Get detailed breakdowns, insights, and personalized recommendations
                        </p>
                        <div className="flex flex-col gap-3">
                          <EnhancedButton
                            variant="gradient"
                            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                            onClick={() => router.push('/resume/report')}
                          >
                            View Full Report
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </EnhancedButton>
                          <EnhancedButton
                            variant="outline"
                            className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                            onClick={() => router.push('/resume')}
                          >
                            Reupload Resume
                            <Upload className="ml-2 h-4 w-4" />
                          </EnhancedButton>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </motion.div>
              ) : (
                // No resume scores - show button to upload
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
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Upload className="h-6 w-6 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">Upload Your Resume</h3>
                        </div>
                        <p className="text-sm text-zinc-400 mb-6">
                          Get your resume scored and receive detailed feedback
                        </p>
                        <EnhancedButton
                          variant="gradient"
                          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                          onClick={() => router.push('/resume')}
                        >
                          Upload Resume
                          <Upload className="ml-2 h-4 w-4" />
                        </EnhancedButton>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
