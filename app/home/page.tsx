"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Award,
  FileText,
  Plus,
  Image,
  Link2,
  Send,
  MessageSquare,
  Trophy,
  Calendar,
  Clock,
  BarChart2,
  Zap,
  Users,
  X,
  Check,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardFooter,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import AnimatedCounter from "@/components/ui/animated-counter"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { AnimatedSection } from "@/components/ui/animated-section"
import { getStoredAccessToken } from "@/lib/auth-storage"

// Client-side cache utility for feed data
const FEED_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
const FEED_CACHE_KEYS = {
  challenges: 'feed_cache_challenges',
  streaks: 'feed_cache_streaks',
  cv: 'feed_cache_cv',
  enriched: 'feed_cache_enriched', // Cache for enriched data (with profiles)
}

interface CachedFeedData<T = any> {
  data: T
  timestamp: number
  day?: string
}

function getCachedFeed<T = any[]>(key: string, day?: string): T | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsed: CachedFeedData<T> = JSON.parse(cached)
    const now = Date.now()
    const age = now - parsed.timestamp

    // Check if cache is still valid and matches the requested day
    if (age < FEED_CACHE_TTL && (!day || parsed.day === day)) {
      return parsed.data
    } else {
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    return null
  }
}

function setCachedFeed<T = any>(key: string, data: T, day?: string): void {
  try {
    const cacheData: CachedFeedData<T> = {
      data,
      timestamp: Date.now(),
      day,
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    // If storage is full, try to clear old cache entries
    try {
      Object.values(FEED_CACHE_KEYS).forEach(k => {
        if (k !== key) localStorage.removeItem(k)
      })
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), day }))
    } catch (e) {
      // Silent fail
    }
  }
}

function clearFeedCache(): void {
  try {
    Object.values(FEED_CACHE_KEYS).forEach(key => localStorage.removeItem(key))
  } catch (error) {
    // Silent fail
  }
}

// Removed mock posts - using real API feed data only
const posts: any[] = [
  {
    id: 1,
    user: {
      name: "Michael Chen",
      title: "Data Scientist at Amazon",
      username: "productivity_mike",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
      verified: false,
      level: 6,
      xp: 1800,
    },
    content: {
      text: "Resume score jumped from 78 to 84! Added AWS cert and my latest ML project. Moved up 12 spots on the leaderboard. Every skill I add gets me closer to that dream job! 📈",
      type: "resume_score",
      achievement: "Resume Score Improved",
      xpGained: 150,
      scoreChange: "+6",
      leaderboardChange: "+12 spots",
    },
    timestamp: "Day 47 of the journey",
    likes: 189,
    comments: 27,
    liked: false,
    saved: false,
  },
  {
    id: 2,
    user: {
      name: "Emily Rodriguez",
      title: "UX Designer at Adobe",
      username: "design_emily",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 9,
      xp: 2800,
    },
    content: {
      text: "Challenge Complete! Finished my 30-day UI design challenge! Gained 400 XP and moved up 3 spots on the design leaderboard. Consistency pays off! 💪",
      type: "challenge",
      achievement: "30-Day Challenge Completed",
      xpGained: 400,
    },
    timestamp: "2 days ago",
    likes: 345,
    comments: 31,
    liked: false,
    saved: false,
  },
  {
    id: 3,
    user: {
      name: "David Kim",
      title: "Frontend Developer at Netflix",
      username: "frontend_david",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 7,
      xp: 2100,
    },
    content: {
      text: "David has 15 days of streak! Maintained consistent learning every single day. Earned 200 XP and climbed to #3 on the weekly leaderboard. Small daily actions lead to big wins! ⚡",
      type: "streak",
      achievement: "15-Day Learning Streak",
      xpGained: 200,
      streakDays: 15,
    },
    timestamp: "3 days ago",
    likes: 156,
    comments: 12,
    liked: false,
    saved: false,
  },
  {
    id: 4,
    user: {
      name: "Jessica Park",
      title: "Software Engineer at Meta",
      username: "jessica_codes",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 11,
      xp: 3800,
    },
    content: {
      text: "Leaderboard Update! Just broke into the TOP 100 on the Engineering Leaderboard! Currently ranked #87 - my goal is to reach top 50 by end of month. The competition is fierce but I'm grinding! 🏅",
      type: "leaderboard",
      achievement: "Top 100 Engineering Leaderboard",
      xpGained: 300,
      rank: "#87",
      category: "Engineering",
    },
    timestamp: "4 hours ago",
    likes: 428,
    comments: 35,
    liked: false,
    saved: false,
  },
  {
    id: 5,
    user: {
      name: "Ryan Martinez",
      title: "Full Stack Developer at Shopify",
      username: "ryan_dev",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 8,
      xp: 2600,
    },
    content: {
      text: "Resume Score Breakthrough! Just hit 90+ on my EliteScore after adding my open-source contributions and technical blog! This puts me in the top 5% of developers. Ready to crush those interviews! 📈",
      type: "resume_milestone",
      achievement: "90+ EliteScore Milestone",
      xpGained: 400,
      score: "90+",
      percentile: "Top 5%",
    },
    timestamp: "8 hours ago",
    likes: 445,
    comments: 38,
    liked: true,
    saved: true,
  },
  {
    id: 6,
    user: {
      name: "Sarah Williams",
      title: "Product Manager at Microsoft",
      username: "mindful_sarah",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 12,
      xp: 4200,
    },
    content: {
      text: "Challenge Complete! Finished the 60-day Product Management challenge! Gained 600 XP and moved up 8 spots on the PM leaderboard. Daily consistency is key! 🎯",
      type: "challenge",
      achievement: "60-Day Challenge Completed",
      xpGained: 600,
    },
    timestamp: "1 day ago",
    likes: 312,
    comments: 28,
    liked: true,
    saved: false,
  },
  {
    id: 7,
    user: {
      name: "Alex Johnson",
      title: "Software Engineer at Google",
      username: "alex_improvement",
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 8,
      xp: 2450,
    },
    content: {
      text: "Alex has 25 days of streak! 25 days straight of coding challenges completed! Climbed to #15 on the weekly leaderboard. Consistency beats motivation every time! 🔥",
      type: "streak",
      achievement: "25-Day Coding Streak",
      xpGained: 350,
      streakDays: 25,
    },
    timestamp: "Posted at 11:23 PM",
    likes: 243,
    comments: 18,
    liked: false,
    saved: false,
  },
  {
    id: 8,
    user: {
      name: "Lisa Wang",
      title: "Data Scientist at Tesla",
      username: "data_lisa",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 13,
      xp: 4800,
    },
    content: {
      text: "Resume Score Boost! Jumped from 85 to 92 after adding my research publications and ML certifications! Now in the top 2% of data scientists. Every credential counts! 📊",
      type: "resume_score",
      achievement: "Resume Score Improved",
      xpGained: 300,
      scoreChange: "+7",
      leaderboardChange: "+15 spots",
    },
    timestamp: "6 hours ago",
    likes: 567,
    comments: 52,
    liked: false,
    saved: true,
  },
  {
    id: 9,
    user: {
      name: "Marcus Thompson",
      title: "Product Manager at Stripe",
      username: "marcus_pm",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 10,
      xp: 3200,
    },
    content: {
      text: "Leaderboard Climb! Just broke into the TOP 50 on the Product Management Leaderboard! Currently ranked #42 - my goal is top 25 by end of quarter. The grind never stops! 🚀",
      type: "leaderboard",
      achievement: "Top 50 Product Management Leaderboard",
      xpGained: 250,
      rank: "#42",
      category: "Product Management",
    },
    timestamp: "2 hours ago",
    likes: 312,
    comments: 28,
    liked: true,
    saved: false,
  },
  {
    id: 10,
    user: {
      name: "Priya Patel",
      title: "Full Stack Developer at Airbnb",
      username: "priya_codes",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 9,
      xp: 2900,
    },
    content: {
      text: "Priya has 8 days of streak! Been coding every single day for over a week now. The momentum is building and I can feel myself getting stronger! 💪",
      type: "streak",
      achievement: "8-Day Coding Streak",
      xpGained: 180,
      streakDays: 8,
    },
    timestamp: "5 hours ago",
    likes: 234,
    comments: 41,
    liked: false,
    saved: false,
  },
  {
    id: 11,
    user: {
      name: "James Wilson",
      title: "Backend Developer at Uber",
      username: "james_backend",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 7,
      xp: 2200,
    },
    content: {
      text: "Challenge Complete! Finished the 21-day System Design challenge! Learned so much about distributed systems. Gained 350 XP and feeling more confident for interviews! 🏗️",
      type: "challenge",
      achievement: "21-Day Challenge Completed",
      xpGained: 350,
    },
    timestamp: "1 hour ago",
    likes: 198,
    comments: 15,
    liked: false,
    saved: false,
  },
  {
    id: 12,
    user: {
      name: "Maria Garcia",
      title: "DevOps Engineer at Slack",
      username: "maria_devops",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 10,
      xp: 3100,
    },
    content: {
      text: "Maria has 12 days of streak! Learning Kubernetes and Docker every single day. The consistency is paying off - my infrastructure skills are getting solid! 🐳",
      type: "streak",
      achievement: "12-Day Learning Streak",
      xpGained: 220,
      streakDays: 12,
    },
    timestamp: "3 hours ago",
    likes: 167,
    comments: 23,
    liked: true,
    saved: false,
  },
]

// Mock data for upcoming tasks
const upcomingTasks = [
  {
    id: 1,
    title: "Complete System Design Assignment",
    dueDate: "Today",
    dueTime: "5:00 PM",
    priority: "High",
    completed: false,
    category: "Learning",
  },
  {
    id: 2,
    title: "Review Team Presentations",
    dueDate: "Tomorrow",
    dueTime: "2:00 PM",
    priority: "Medium",
    completed: false,
    category: "Work",
  },
  {
    id: 3,
    title: "Prepare for Technical Interview",
    dueDate: "Jun 15, 2023",
    dueTime: "10:00 AM",
    priority: "High",
    completed: false,
    category: "Career",
  },
  {
    id: 4,
    title: "Weekly Fitness Goal",
    dueDate: "Jun 18, 2023",
    dueTime: "All day",
    priority: "Medium",
    completed: false,
    category: "Health",
  },
]

// Type for network suggestions
type NetworkSuggestion = {
  userId: number
  name: string
  title: string
  image: string | null
  mutualConnections?: number
  level?: number
  resumeScore?: number | null
}

// Mock data for user stats
const userStats = {
  level: 5,
  xp: 2450,
  nextLevelXp: 3000,
  streak: 7,
  tasksCompleted: 23,
  tasksTotal: 30,
  connectionsGrowth: 15,
  skillsImproved: 4,
}

// Mock user data (in real app, this would come from user profile/API)
const userData = {
  resumeScore: {
    current: 87,
    previous: 82,
    improvements: ["Added AWS certification", "Completed 3 ML projects", "Updated skills section"],
    lastUpdated: "2 days ago"
  },
  completedChallenges: [
    { id: 1, name: "30-Day UI Design Challenge", completedDate: "Oct 10, 2025", xpEarned: 400 },
    { id: 2, name: "21-Day System Design Challenge", completedDate: "Sep 28, 2025", xpEarned: 350 },
    { id: 3, name: "60-Day Product Management Challenge", completedDate: "Sep 15, 2025", xpEarned: 600 },
    { id: 4, name: "45-Day Full Stack Development Challenge", completedDate: "Aug 30, 2025", xpEarned: 500 }
  ],
  currentStreak: {
    days: 15,
    type: "Daily Coding Practice",
    startDate: "Sep 28, 2025",
    activities: ["LeetCode problems", "System design reading", "Open source contributions"]
  },
  leaderboardRankings: [
    { category: "Engineering", currentRank: 87, previousRank: 95, totalParticipants: 5420 },
    { category: "Frontend Development", currentRank: 42, previousRank: 58, totalParticipants: 3200 },
    { category: "Data Science", currentRank: 156, previousRank: 178, totalParticipants: 4800 }
  ]
}

export default function HomePage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [savedPosts, setSavedPosts] = useState<number[]>([])
  const [postText, setPostText] = useState("")
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [activePostType, setActivePostType] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null)
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<number | null>(null)
  const [postMessage, setPostMessage] = useState("")
  const [showFloatingLogo, setShowFloatingLogo] = useState(true)
  const [networkSuggestions, setNetworkSuggestions] = useState<NetworkSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  // Feed data states
  const [challengesFeed, setChallengesFeed] = useState<any[]>([])
  const [streaksFeed, setStreaksFeed] = useState<any[]>([])
  const [cvFeed, setCvFeed] = useState<any[]>([])
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)

  // Check if it's the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")
    if (!hasVisitedBefore) {
      setShowOnboarding(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingLogo(window.scrollY < 80)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Fetch network suggestions
  useEffect(() => {
    if (!isAuthorized) {
      return
    }

    async function fetchSuggestions() {
      setIsLoadingSuggestions(true)
      try {
        const token = getStoredAccessToken()
        if (!token) {
          setIsLoadingSuggestions(false)
          return
        }
        // Fetch suggested user IDs
        const suggestionsResponse = await fetch("/api/users/social/get_suggestions?count=10", {
          method: "GET",
          headers: {
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!suggestionsResponse.ok) {
          setIsLoadingSuggestions(false)
          return
        }

        const suggestionsData = await suggestionsResponse.json()
        const userIds: number[] = suggestionsData?.data || []

        if (userIds.length === 0) {
          setNetworkSuggestions([])
          setIsLoadingSuggestions(false)
          return
        }

        // Fetch profile data for each user ID in parallel
        const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
        const RESUME_SCORES_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

        const profilePromises = userIds.map(async (userId: number) => {
          try {
            
            // 1. Fetch profile
            let profile = null
            try {
              const profileResponse = await fetch(`${API_BASE_URL}v1/users/profile/get_profile/${userId}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })

              if (profileResponse.ok) {
                const profileResult = await profileResponse.json()
                profile = profileResult?.data || profileResult
              }
            } catch (e) {
              // Silent fail
            }

            if (!profile) {
              return null
            }

            // 2. Fetch profile picture
            let profilePicture: string | null = null
            try {
              const pictureResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })

              if (pictureResponse.ok) {
                const pictureData = await pictureResponse.json()
                if (pictureData && !pictureData.default && pictureData.dataUrl) {
                  profilePicture = pictureData.dataUrl
                }
              }
            } catch (error) {
              // Ignore picture fetch errors
            }

            // 3. Fetch resume score for level/score display
            let resumeScore: number | null = null
            try {
              const scoreResponse = await fetch(`${RESUME_SCORES_API_BASE_URL}v1/users/resume-scores/${userId}`, {
                method: "GET",
                headers: {
                  "Accept": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              })

              if (scoreResponse.ok) {
                const scoreResult = await scoreResponse.json()
                const scoreData = scoreResult?.data || scoreResult
                resumeScore = scoreData?.overall_score || null
              }
            } catch (error) {
              // Ignore resume score fetch errors
            }

            // 4. Fetch level (optional, if supported by future API, currently using resume score or fallback)
            let level: number | undefined = undefined
            // Note: current-level API only returns current user's level, so we skip fetching level for other users
            // We can show resume score instead as an indicator

            // Build name from firstName and lastName
            const firstName = profile?.firstName || ""
            const lastName = profile?.lastName || ""
            const name = [firstName, lastName].filter(Boolean).join(" ") || "User"

            // Get title from resume or bio
            let title = ""
            if (profile?.resume?.basics?.headline) {
              title = profile.resume.basics.headline
            } else if (profile?.bio) {
              title = profile.bio
            } else if (profile?.resume?.experience?.[0]) {
              const exp = profile.resume.experience[0]
              title = `${exp.title || ""}${exp.company ? ` at ${exp.company}` : ""}`.trim()
            }

            // Use profile picture from API if available
            if (!profilePicture) {
              const pickFirstValidPicture = (...candidates: Array<string | null | undefined>) => {
                for (const candidate of candidates) {
                  if (typeof candidate === "string" && candidate.trim().length > 0) {
                    return candidate
                  }
                }
                return null
              }

              profilePicture = pickFirstValidPicture(
                profile?.profilePictureUrl,
                profile?.profilePicture,
                profile?.avatarUrl,
                profile?.resume?.profilePictureUrl,
                profile?.resume?.profilePicture,
                profile?.resume?.avatarUrl,
              )
            }

            return {
              userId,
              name,
              title,
              image: profilePicture,
              level,
              resumeScore,
            } as NetworkSuggestion
          } catch (error) {
            console.warn(`[Home] Error processing suggestion for user ${userId}:`, error)
            return null
          }
        })

        const suggestions = (await Promise.all(profilePromises)).filter((s): s is NetworkSuggestion => s !== null)
        setNetworkSuggestions(suggestions)
      } catch (error) {
        // Silent fail
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    fetchSuggestions()
  }, [isAuthorized])

  // Fetch feed data (challenges, streaks, CV)
  useEffect(() => {
    if (!isAuthorized) return

    async function fetchFeedData(forceRefresh = false) {
      const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
      const today = new Date().toISOString().split('T')[0] // yyyy-MM-dd format

      // Check cache first (unless force refresh)
      let useCachedEnriched = false
      if (!forceRefresh) {
        const cachedEnriched = getCachedFeed<{ challenges: any[], streaks: any[], cv: any[] }>(FEED_CACHE_KEYS.enriched, today)

        // If we have enriched cache, use it directly (fastest path)
        if (cachedEnriched && Array.isArray(cachedEnriched.challenges) && Array.isArray(cachedEnriched.streaks) && Array.isArray(cachedEnriched.cv)) {
          setChallengesFeed(cachedEnriched.challenges)
          setStreaksFeed(cachedEnriched.streaks)
          setCvFeed(cachedEnriched.cv)
          setIsLoadingFeed(false)
          useCachedEnriched = true
        }
      } else {
        clearFeedCache()
      }

      // If we used enriched cache, we're done
      if (useCachedEnriched) {
        return
      }

      setIsLoadingFeed(true)
      try {
        const token = getStoredAccessToken()
        if (!token) {
          setIsLoadingFeed(false)
          return
        }
        
        console.log("[Home] 🚀 Starting feed fetch - challenges, streaks, cv")
        console.log("[Home] Today's date:", today)
        console.log("[Home] Token present:", !!token)
        
        const challengesUrl = `/api/users/social/get_challenges_feed?day=${today}&limit=20`
        console.log("[Home] Challenges feed URL:", challengesUrl)
        
        const [challengesResponse, streaksResponse, cvResponse] = await Promise.all([
          fetch(challengesUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
            // Add cache control for browser caching
            cache: 'default',
          }),
          fetch(`/api/users/social/get_streaks_feed?day=${today}&limit=20`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: 'default',
          }),
          fetch(`/api/users/social/get_cv_feed?limit=20`, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: 'default',
          }),
        ])

        // Variables to store enriched data for caching
        let validChallenges: any[] = []
        let validStreaks: any[] = []
        let validCvs: any[] = []

        console.log("[Home] 📥 Feed responses received")
        console.log("[Home] Challenges response status:", challengesResponse.status, challengesResponse.statusText)
        console.log("[Home] Challenges response ok:", challengesResponse.ok)
        console.log("[Home] Streaks response status:", streaksResponse.status, streaksResponse.statusText)
        console.log("[Home] CV response status:", cvResponse.status, cvResponse.statusText)
        
        // Process challenges feed
        if (challengesResponse.ok) {
          try {
            console.log("[Home] ✅ Processing challenges feed response...")
            const challengesData = await challengesResponse.json()
            console.log("[Home] Challenges feed raw response:", JSON.stringify(challengesData, null, 2))
            const challenges = challengesData?.data || []
            console.log("[Home] Challenges array length:", challenges.length)
            
            // Enrich challenges with user profile data
            const enrichedChallenges = await Promise.all(
              challenges.map(async (challenge: any, idx: number) => {
                try {
                  return {
                    ...challenge,
                    type: 'challenge_feed',
                  }
                } catch (error) {
                  return null
                }
              })
            )
            validChallenges = enrichedChallenges.filter((c: any) => c !== null)
            setChallengesFeed(validChallenges)
            // Cache raw challenges data
            setCachedFeed(FEED_CACHE_KEYS.challenges, challenges, today)
          } catch (error) {
            console.error("[Home] ❌ Error processing challenges feed:", error)
          }
        } else {
          console.error("[Home] ❌ Challenges feed response not ok:", challengesResponse.status, challengesResponse.statusText)
          try {
            const errorText = await challengesResponse.text()
            console.error("[Home] ❌ Challenges feed error body:", errorText)
          } catch (e) {
            console.error("[Home] ❌ Could not read error body")
          }
          setChallengesFeed([])
        }

        // Process streaks feed
        if (streaksResponse.ok) {
          try {
            const streaksData = await streaksResponse.json()
            console.log("[Home] ✅ Streaks feed raw response:", JSON.stringify(streaksData, null, 2))
            console.log("[Home] ✅ Streaks feed response structure:", {
              hasSuccess: 'success' in streaksData,
              hasMessage: 'message' in streaksData,
              hasData: 'data' in streaksData,
              dataType: Array.isArray(streaksData?.data) ? 'array' : typeof streaksData?.data,
              dataLength: Array.isArray(streaksData?.data) ? streaksData.data.length : 'N/A',
            })
            const streaks = streaksData?.data || []
            console.log("[Home] ✅ Streaks feed items count:", streaks.length)
            if (streaks.length > 0) {
              console.log("[Home] ✅ Sample streak:", JSON.stringify(streaks[0], null, 2))
            } else {
              console.log("[Home] ⚠️ No streaks found in feed")
              console.log("[Home] ⚠️ This could mean:")
              console.log("[Home]   - You're not following anyone with active streaks today")
              console.log("[Home]   - Or the API returned an empty array")
            }
            
            // Enrich streaks with user profile data
            const enrichedStreaks = await Promise.all(
              streaks.map(async (streak: any, idx: number) => {
                try {
                  console.log(`[Home] Processing streak ${idx + 1}/${streaks.length} for user_id:`, streak.user_id)
                  if (!streak.user_id) {
                    console.warn(`[Home] ⚠️ Streak ${idx + 1} missing user_id, skipping`)
                    return null
                  }
                  
                  // Fetch user profile
                  console.log(`[Home] Fetching profile for user ${streak.user_id}...`)
                  const profileResponse = await fetch(`${API_BASE_URL}v1/users/profile/get_profile/${streak.user_id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  })

                  if (!profileResponse.ok) {
                    console.warn(`[Home] ⚠️ Failed to fetch profile for user ${streak.user_id}:`, profileResponse.status)
                    return null
                  }

                  const profileResult = await profileResponse.json()
                  const profile = profileResult?.data || profileResult
                  console.log(`[Home] ✅ Profile fetched for user ${streak.user_id}`)

                  // Fetch profile picture
                  let profilePicture: string | null = null
                  try {
                    const pictureResponse = await fetch(`/api/user/profile/pfp/${streak.user_id}/raw`, {
                      method: "GET",
                      headers: {
                        "Accept": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    })

                    if (pictureResponse.ok) {
                      const pictureData = await pictureResponse.json()
                      if (pictureData && !pictureData.default && pictureData.dataUrl) {
                        profilePicture = pictureData.dataUrl
                        console.log(`[Home] ✅ Profile picture fetched for user ${streak.user_id}`)
                      }
                    }
                  } catch (error) {
                    console.warn(`[Home] ⚠️ Error fetching picture for user ${streak.user_id}:`, error)
                  }

                  const firstName = profile?.firstName || ""
                  const lastName = profile?.lastName || ""
                  const name = [firstName, lastName].filter(Boolean).join(" ") || "User"

                  console.log(`[Home] ✅ Enriched streak for user ${streak.user_id} (${name})`)
                  return {
                    ...streak,
                    type: 'streak_feed',
                    user: {
                      id: streak.user_id,
                      name,
                      image: profilePicture,
                    },
                  }
                } catch (error) {
                  console.error(`[Home] ❌ Error enriching streak ${idx + 1}:`, error)
                  return null
                }
              })
            )
            validStreaks = enrichedStreaks.filter((s: any) => s !== null)
            console.log("[Home] ✅ Valid enriched streaks:", validStreaks.length)
            setStreaksFeed(validStreaks)
            // Cache raw streaks data
            setCachedFeed(FEED_CACHE_KEYS.streaks, streaks, today)
            console.log("[Home] ✅ Streaks feed state updated")
          } catch (error) {
            console.error("[Home] ❌ Error parsing streaks feed response:", error)
          }
        } else {
          const errorText = await streaksResponse.text().catch(() => "Unknown error")
          console.error("[Home] ❌ Failed to fetch streaks feed:", streaksResponse.status, errorText)
          setStreaksFeed([])
        }

        // Process CV feed
        if (cvResponse.ok) {
          try {
            const cvData = await cvResponse.json()
            const cvs = cvData?.data || []
            
            // Enrich CV scores with user profile data
            const enrichedCvs = await Promise.all(
              cvs.map(async (cv: any, idx: number) => {
                try {
                  if (!cv.user_id) {
                    return null
                  }
                  
                  // Fetch user profile
                  const profileResponse = await fetch(`${API_BASE_URL}v1/users/profile/get_profile/${cv.user_id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  })

                  if (!profileResponse.ok) {
                    return null
                  }

                  const profileResult = await profileResponse.json()
                  const profile = profileResult?.data || profileResult

                  // Fetch profile picture
                  let profilePicture: string | null = null
                  try {
                    const pictureResponse = await fetch(`/api/user/profile/pfp/${cv.user_id}/raw`, {
                      method: "GET",
                      headers: {
                        "Accept": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    })

                    if (pictureResponse.ok) {
                      const pictureData = await pictureResponse.json()
                      if (pictureData && !pictureData.default && pictureData.dataUrl) {
                        profilePicture = pictureData.dataUrl
                      }
                    }
                  } catch (error) {
                    // Silent fail
                  }

                  const firstName = profile?.firstName || ""
                  const lastName = profile?.lastName || ""
                  const name = [firstName, lastName].filter(Boolean).join(" ") || "User"

                  // Get title from resume or bio
                  let title = ""
                  if (profile?.resume?.basics?.headline) {
                    title = profile.resume.basics.headline
                  } else if (profile?.bio) {
                    title = profile.bio
                  } else if (profile?.resume?.experience?.[0]) {
                    const exp = profile.resume.experience[0]
                    title = `${exp.title || ""}${exp.company ? ` at ${exp.company}` : ""}`.trim()
                  }

                  return {
                    ...cv,
                    type: 'cv_feed',
                    user: {
                      id: cv.user_id,
                      name,
                      title,
                      image: profilePicture,
                    },
                  }
                } catch (error) {
                  return null
                }
              })
            )
            validCvs = enrichedCvs.filter((c: any) => c !== null)
            setCvFeed(validCvs)
            // Cache raw CV data
            setCachedFeed(FEED_CACHE_KEYS.cv, cvs)
          } catch (error) {
            // Silent fail
          }
        } else {
          setCvFeed([])
        }

        // Cache enriched data for faster subsequent loads (only if we have data)
        if (validChallenges.length > 0 || validStreaks.length > 0 || validCvs.length > 0) {
          const enrichedData = {
            challenges: validChallenges,
            streaks: validStreaks,
            cv: validCvs,
          }
          setCachedFeed(FEED_CACHE_KEYS.enriched, enrichedData, today)
        }
      } catch (error) {
        // Silent fail
      } finally {
        setIsLoadingFeed(false)
      }
    }

    // Check if we should force refresh (e.g., user explicitly requested)
    const urlParams = new URLSearchParams(window.location.search)
    const forceRefresh = urlParams.get('refresh') === 'true'
    
    fetchFeedData(forceRefresh)

    // Listen for manual refresh requests
    const handleRefresh = () => {
      fetchFeedData(true)
    }
    window.addEventListener('refresh-feed', handleRefresh)
    
    return () => {
      window.removeEventListener('refresh-feed', handleRefresh)
    }
  }, [isAuthorized])

  const toggleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter((id) => id !== postId))
    } else {
      setLikedPosts([...likedPosts, postId])
    }
  }

  const toggleSave = (postId: number) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(savedPosts.filter((id) => id !== postId))
    } else {
      setSavedPosts([...savedPosts, postId])
    }
  }

  const handleCreatePost = () => {
    if (!activePostType) return

    let postContent = ""
    
    switch (activePostType) {
      case 'resume_score':
        postContent = `Resume score jumped from ${userData.resumeScore.previous} to ${userData.resumeScore.current}! ${userData.resumeScore.improvements.join(", ")}. ${postMessage ? postMessage : "Every update gets me closer to my dream job!"} 📈`
        break
      case 'challenge':
        if (!selectedChallenge) return
        const challenge = userData.completedChallenges.find(c => c.id === selectedChallenge)
        if (!challenge) return
        postContent = `Challenge Complete! Finished the ${challenge.name}! Gained ${challenge.xpEarned} XP. ${postMessage ? postMessage : "Consistency pays off!"} 💪`
        break
      case 'streak':
        postContent = `${userData.currentStreak.type} - ${userData.currentStreak.days} days of streak! ${userData.currentStreak.activities.join(", ")}. ${postMessage ? postMessage : "Small daily actions lead to big wins!"} ⚡`
        break
      case 'leaderboard':
        if (!selectedLeaderboard) return
        const ranking = userData.leaderboardRankings[selectedLeaderboard]
        if (!ranking) return
        postContent = `Leaderboard Update! Climbed from #${ranking.previousRank} to #${ranking.currentRank} on the ${ranking.category} Leaderboard! ${postMessage ? postMessage : "The grind never stops!"} 🏅`
        break
    }
    
    // In a real app, this would create a new post and add it to the feed
    
    // Reset form
    setActivePostType(null)
    setSelectedChallenge(null)
    setSelectedLeaderboard(null)
    setPostMessage("")
  }

  const toggleTaskCompletion = (taskId: number) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId))
    } else {
      setCompletedTasks([...completedTasks, taskId])
    }
  }

  const nextOnboardingStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1)
    } else {
      setShowOnboarding(false)
    }
  }

  const skipOnboarding = () => {
    setShowOnboarding(false)
  }

  // Mock data for suggestions and progress cards that appear in feed
  const suggestionCards = [
    {
      id: "suggestion-1",
      type: "network_suggestion",
      title: "Connect with High Achievers",
      subtitle: "People you may know",
      suggestions: networkSuggestions.slice(0, 2),
    },
    {
      id: "progress-1",
      type: "progress_update",
      title: "Your Progress This Week",
      subtitle: "Keep up the momentum!",
      stats: {
        xpGained: 450,
        tasksCompleted: 8,
        streakDays: 12,
        levelProgress: 75,
        nextLevel: 6,
      },
    },
    {
      id: "challenge-1",
      type: "challenge_suggestion",
      title: "Weekly Challenge",
      subtitle: "Earn bonus XP",
      challenge: {
        title: "Complete 3 Skill Assessments",
        description: "Take assessments in your chosen field to earn 200 XP",
        xpReward: 200,
        deadline: "3 days left",
        participants: 1247,
      },
    },
  ]

  // Mix API feed data with suggestion cards for natural feed integration
  const createMixedFeed = () => {
    const mixedFeed: any[] = []
    
    // Combine all feed items (only real API data, no mock posts)
    const allFeedItems: any[] = []
    
    // Add challenges feed items
    challengesFeed.forEach((challenge, idx) => {
      allFeedItems.push({
        type: 'challenge_feed',
        data: challenge,
        id: `challenge-feed-${challenge.id || idx}`,
        timestamp: new Date().toISOString(),
      })
    })
    
    // Add streaks feed items
    streaksFeed.forEach((streak, idx) => {
      allFeedItems.push({
        type: 'streak_feed',
        data: streak,
        id: `streak-feed-${streak.user_id || idx}`,
        timestamp: new Date().toISOString(),
      })
    })
    
    // Add CV feed items
    cvFeed.forEach((cv, idx) => {
      allFeedItems.push({
        type: 'cv_feed',
        data: cv,
        id: `cv-feed-${cv.user_id || idx}`,
        timestamp: new Date().toISOString(),
      })
    })
    
    // Sort by timestamp (newest first)
    allFeedItems.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
    
    // Insert suggestion cards at strategic positions
    const suggestionPositions = [2, 5, 8] // After 2nd, 5th, and 8th items
    let suggestionIndex = 0
    
    for (let i = 0; i < allFeedItems.length + suggestionCards.length; i++) {
      if (suggestionPositions.includes(i) && suggestionIndex < suggestionCards.length) {
        mixedFeed.push({
          type: 'suggestion',
          data: suggestionCards[suggestionIndex],
          id: `suggestion-${suggestionIndex}`,
        })
        suggestionIndex++
      }
      
      if (i < allFeedItems.length) {
        mixedFeed.push(allFeedItems[i])
      }
    }
    
    return mixedFeed
  }

  const mixedFeed = createMixedFeed()

  // Feed summary tracking (no logs)
  useEffect(() => {
    // Feed data updated
  }, [challengesFeed, streaksFeed, cvFeed, mixedFeed.length])

  // Don't render until auth check is complete
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Calculate progress percentage
  const progressPercentage = (userStats.xp / userStats.nextLevelXp) * 100
  const taskCompletionPercentage = (completedTasks.length / upcomingTasks.length) * 100

  return (
    <DashboardLayout>
      {/* Floating Logo – only visible near top for better mobile UX */}
      <AnimatePresence>
        {showFloatingLogo && (
          <motion.div
            key="floating-logo"
            className="fixed left-2 sm:left-4 z-20 pointer-events-none"
            style={{
              top: "max(env(safe-area-inset-top, 0.5rem), 0.5rem)",
            }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-full border border-white/10 bg-black/70 backdrop-blur-md p-1.5 shadow-lg shadow-blue-500/20">
              <img
                src="/logo.png"
                alt="EliteScore Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tutorial */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900/90 border border-blue-700/40 rounded-xl max-w-md w-full p-4 sm:p-6 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="relative h-12 w-12 mx-auto mb-4 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]">
                  <div className="absolute inset-0.5 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-lg drop-shadow-[0_0_8px_rgba(80,0,255,0.5)]">
                    S
                  </div>
                </div>
                <h2 className="text-xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Welcome to EliteScore!</h2>
                <p className="text-white mt-2">Your journey to excellence starts here</p>
              </div>

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-lg bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Track Your Progress</h3>
                  <p className="text-sm text-zinc-400">
                    Set goals, track your progress, and earn XP as you improve your skills and complete tasks.
                  </p>
                  <div className="bg-zinc-800/80 border border-blue-700/30 rounded-lg p-4 flex items-center gap-3 shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                    <Trophy className="h-8 w-8 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium">Level up your skills</div>
                      <div className="text-xs text-zinc-500">Earn XP and badges as you progress</div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-lg bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Connect with Others</h3>
                  <p className="text-sm text-zinc-400">
                    Join communities, follow other users, and share your achievements with your network.
                  </p>
                  <div className="bg-zinc-800/80 border border-blue-700/30 rounded-lg p-4 flex items-center gap-3 shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                    <Users className="h-8 w-8 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium">Build your network</div>
                      <div className="text-xs text-zinc-500">Learn from others on similar journeys</div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-lg bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Get Personalized Guidance</h3>
                  <p className="text-sm text-zinc-400">
                    Receive tailored recommendations and insights based on your goals and progress.
                  </p>
                  <div className="bg-zinc-800/80 border border-blue-700/30 rounded-lg p-4 flex items-center gap-3 shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                    <Zap className="h-8 w-8 text-fuchsia-400" />
                    <div>
                      <div className="text-sm font-medium">Accelerate your growth</div>
                      <div className="text-xs text-zinc-500">Get AI-powered recommendations</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent hover:border-blue-700/40" onClick={skipOnboarding}>
                  Skip
                </Button>
                <EnhancedButton variant="gradient" rounded="full" animation="shimmer" className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]" onClick={nextOnboardingStep}>
                  {onboardingStep < 3 ? "Next" : "Get Started"}
                </EnhancedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen">
        {/* Full width on phones, centred & capped on tablets/desktops */}
        <div className="w-full sm:max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Main Feed */}
          <div className="space-y-6 sm:space-y-6">

            {/* Motivational Header */}
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-base sm:text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-2">Keep pushing. Your future self will thank you.</h2>
              <p className="text-xs sm:text-base text-zinc-400 px-2">Every post is someone getting better. Your turn.</p>
            </div>

            {/* Create Post - Minimized LinkedIn Style */}
            {!activePostType ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-2.5 mb-1">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-zinc-800 text-xs">U</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setActivePostType('resume_score')}
                    className="flex-1 text-left px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-full text-zinc-400 text-xs sm:text-base transition-colors"
                  >
                    Share your progress...
                  </button>
                </div>
                <div className="flex items-center justify-around mt-3 pt-3 border-t border-zinc-800 gap-1">
                  <button
                    onClick={() => setActivePostType('resume_score')}
                    className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] sm:text-sm">Resume</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('challenge')}
                    className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Award className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span className="text-[11px] sm:text-sm">Challenge</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('streak')}
                    className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="text-[11px] sm:text-sm">Streak</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('leaderboard')}
                    className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trophy className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-[11px] sm:text-sm hidden sm:inline">Leaderboard</span>
                    <span className="text-[11px] sm:hidden">Board</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Post Creation Form */}
            {activePostType && (
              <AnimatedSection delay={0.1}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl transition-all duration-300 ease-in-out">
                  <div className="p-3 sm:p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activePostType === 'resume_score' && <BarChart2 className="h-4 w-4 text-emerald-400" />}
                        {activePostType === 'challenge' && <Award className="h-4 w-4 text-fuchsia-400" />}
                        {activePostType === 'streak' && <Zap className="h-4 w-4 text-yellow-400" />}
                        {activePostType === 'leaderboard' && <Trophy className="h-4 w-4 text-orange-400" />}
                        <h3 className="text-sm sm:text-lg font-semibold text-white">
                          Share {activePostType === 'resume_score' ? 'Resume Score' : activePostType === 'challenge' ? 'Challenge' : activePostType === 'streak' ? 'Streak' : 'Leaderboard'}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setActivePostType(null)
                          setSelectedChallenge(null)
                          setSelectedLeaderboard(null)
                          setPostMessage("")
                        }}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="space-y-4 sm:space-y-5">
                      {activePostType === 'resume_score' && (
                        <div>
                          <div className="bg-zinc-800/30 rounded-lg p-3 sm:p-4 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <span className="text-xs sm:text-base font-medium text-zinc-300">Your Resume Score</span>
                              <span className="text-[10px] sm:text-sm text-zinc-500">{userData.resumeScore.lastUpdated}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-5">
                              <div className="text-center">
                                <div className="text-xl sm:text-3xl font-bold text-zinc-400">{userData.resumeScore.previous}</div>
                                <div className="text-[10px] sm:text-sm text-zinc-500 mt-0.5">Previous</div>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-zinc-600 flex-shrink-0" />
                              <div className="text-center">
                                <div className="text-2xl sm:text-4xl font-bold text-emerald-400">{userData.resumeScore.current}</div>
                                <div className="text-[10px] sm:text-sm text-emerald-400 mt-0.5">Current</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl sm:text-3xl font-bold text-green-400">+{userData.resumeScore.current - userData.resumeScore.previous}</div>
                                <div className="text-[10px] sm:text-sm text-zinc-500 mt-0.5">Points</div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-zinc-700/50">
                              <div className="text-[10px] sm:text-sm font-medium text-zinc-400 mb-2">Recent improvements:</div>
                              <div className="space-y-1.5">
                                {userData.resumeScore.improvements.map((improvement, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-xs sm:text-base text-zinc-300">
                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400 flex-shrink-0" />
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activePostType === 'challenge' && (
                        <div className="space-y-3">
                          <p className="text-xs sm:text-base text-zinc-400">Select a completed challenge to share:</p>
                          <div className="space-y-2">
                            {userData.completedChallenges.map((challenge) => (
                              <button
                                key={challenge.id}
                                onClick={() => setSelectedChallenge(challenge.id)}
                                className={cn(
                                  "w-full p-3 rounded-lg border text-left transition-all duration-200",
                                  selectedChallenge === challenge.id
                                    ? "bg-fuchsia-900/10 border-fuchsia-700/50 ring-1 ring-fuchsia-700/50"
                                    : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-xs sm:text-base">{challenge.name}</div>
                                    <div className="text-[10px] sm:text-sm text-zinc-500 mt-0.5">Completed {challenge.completedDate}</div>
                                  </div>
                                  <Badge className="bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-900/50 text-[10px] ml-2">
                                    +{challenge.xpEarned} XP
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activePostType === 'streak' && (
                        <div>
                          <div className="bg-zinc-800/30 rounded-lg p-3 sm:p-4 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs sm:text-sm font-medium text-zinc-300">Current Streak</span>
                              <Badge className="bg-yellow-950/50 text-yellow-400 border-yellow-900/50 text-[10px]">
                                Active
                              </Badge>
                            </div>
                            <div className="text-center mb-4 sm:mb-4 py-2">
                              <div className="text-3xl sm:text-5xl font-bold text-yellow-400">{userData.currentStreak.days}</div>
                              <div className="text-[10px] sm:text-sm text-zinc-400 mt-0.5">Days</div>
                            </div>
                            <div className="space-y-2 pt-3 border-t border-zinc-700/50">
                              <div className="text-xs sm:text-sm">
                                <span className="text-zinc-500">Type:</span>
                                <span className="text-white ml-2 font-medium">{userData.currentStreak.type}</span>
                              </div>
                              <div className="text-xs sm:text-sm">
                                <span className="text-zinc-500">Started:</span>
                                <span className="text-white ml-2">{userData.currentStreak.startDate}</span>
                              </div>
                              <div>
                                <div className="text-[10px] sm:text-xs font-medium text-zinc-400 mb-1.5">Daily activities:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {userData.currentStreak.activities.map((activity, idx) => (
                                    <Badge key={idx} className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                      {activity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activePostType === 'leaderboard' && (
                        <div className="space-y-3">
                          <p className="text-xs sm:text-sm text-zinc-400">Select a leaderboard ranking to share:</p>
                          <div className="space-y-2">
                            {userData.leaderboardRankings.map((ranking, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedLeaderboard(idx)}
                                className={cn(
                                  "w-full p-3 sm:p-3 rounded-lg border text-left transition-all duration-200",
                                  selectedLeaderboard === idx
                                    ? "bg-orange-900/10 border-orange-700/50 ring-1 ring-orange-700/50"
                                    : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-xs sm:text-sm mb-1">{ranking.category}</div>
                                    <div className="text-[10px] sm:text-xs text-zinc-500">
                                      #{ranking.previousRank} → #{ranking.currentRank} <span className="text-zinc-600">•</span> {ranking.totalParticipants.toLocaleString()} participants
                                    </div>
                                  </div>
                                  <div className="text-right ml-2">
                                    <div className="text-sm sm:text-base font-bold text-emerald-400">
                                      +{ranking.previousRank - ranking.currentRank}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-zinc-500">spots</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label htmlFor="post-message" className="text-xs sm:text-sm text-zinc-400 mb-1.5 block">Add a personal message (optional)</label>
                        <textarea
                          id="post-message"
                          placeholder="Share your thoughts, tips, or motivation..."
                          value={postMessage}
                          onChange={(e) => setPostMessage(e.target.value)}
                          className="w-full p-3 sm:p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none h-20 sm:h-20 text-xs sm:text-base focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-zinc-800 flex gap-2.5">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActivePostType(null)
                        setSelectedChallenge(null)
                        setSelectedLeaderboard(null)
                        setPostMessage("")
                      }}
                      className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-10 sm:h-12 rounded-lg text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 sm:h-12 rounded-lg text-sm sm:text-base"
                      disabled={
                        (activePostType === 'challenge' && !selectedChallenge) ||
                        (activePostType === 'leaderboard' && selectedLeaderboard === null)
                      }
                    >
                      Share Progress
                    </Button>
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Feed Tabs */}
            <Tabs defaultValue="feed" className="w-full">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <TabsList className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 transition-all duration-300 ease-in-out">
                <TabsTrigger
                  value="feed"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2"
                >
                  Network
                </TabsTrigger>
              </TabsList>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearFeedCache()
                    window.dispatchEvent(new Event('refresh-feed'))
                  }}
                  disabled={isLoadingFeed}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0"
                  title="Refresh feed"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingFeed ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <TabsContent value="feed" className="space-y-5">
                {/* Mixed Feed - Posts, API Feeds, and Suggestions */}
                {isLoadingFeed && mixedFeed.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    <span className="ml-2 text-sm text-zinc-400">Loading feed...</span>
                  </div>
                ) : mixedFeed.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-400">No feed items available. Follow more users to see their activity!</p>
                    <p className="text-xs text-zinc-500 mt-2">Check the Network tab to find people to follow.</p>
                  </div>
                ) : (
                  mixedFeed.map((item, index) => {
                      return (
                    <AnimatedSection key={item.id} delay={0.1 + index * 0.05}>
                      {/* Challenge Feed Item */}
                      {item.type === 'challenge_feed' && item.data ? (
                            <EnhancedCard
                              variant="default"
                              hover="lift"
                              className="bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out rounded-xl"
                            >
                              <EnhancedCardHeader className="p-3.5 sm:p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-fuchsia-400" />
                                    <div>
                                      <div className="font-bold text-white text-sm">Challenge Completed</div>
                                      <div className="text-xs text-zinc-400 mt-0.5">Verified challenge from someone you follow</div>
                                    </div>
                                  </div>
                                </div>
                              </EnhancedCardHeader>
                              <EnhancedCardContent className="px-3.5 sm:px-6 pb-3.5">
                                <div className="bg-fuchsia-900/20 border border-fuchsia-800/40 rounded-lg p-3">
                                  <h3 className="font-bold text-white text-sm mb-1">{item.data.title || "Challenge"}</h3>
                                  {item.data.description && (
                                    <p className="text-xs text-zinc-300 mb-2">{item.data.description}</p>
                                  )}
                                  {item.data.difficulty && (
                                    <Badge className={cn(
                                      "text-[10px] mt-2",
                                      item.data.difficulty === "easy" ? "bg-green-900/50 text-green-300 border-green-800" :
                                      item.data.difficulty === "medium" ? "bg-yellow-900/50 text-yellow-300 border-yellow-800" :
                                      "bg-red-900/50 text-red-300 border-red-800"
                                    )}>
                                      {item.data.difficulty.charAt(0).toUpperCase() + item.data.difficulty.slice(1)}
                                    </Badge>
                                  )}
                                </div>
                              </EnhancedCardContent>
                            </EnhancedCard>
                      ) : /* Streak Feed Item */
                      item.type === 'streak_feed' && item.data && item.data.user ? (
                        <EnhancedCard
                          variant="default"
                          hover="lift"
                          className="bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out rounded-xl"
                        >
                          <EnhancedCardHeader className="p-3.5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <Avatar 
                                  className="h-9 w-9 interactive cursor-pointer"
                                  onClick={() => router.push(`/profile?userId=${item.data.user.id}`)}
                                >
                                  <AvatarImage src={item.data.user.image || undefined} />
                                  <AvatarFallback className="bg-zinc-800">{item.data.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="font-bold text-white text-sm cursor-pointer hover:text-blue-400"
                                      onClick={() => router.push(`/profile?userId=${item.data.user.id}`)}
                                    >
                                      {item.data.user.name}
                                    </span>
                                  </div>
                                  <div className="text-xs text-zinc-400 mt-0.5">Active streak</div>
                                </div>
                              </div>
                            </div>
                          </EnhancedCardHeader>
                          <EnhancedCardContent className="px-3.5 sm:px-6 pb-3.5">
                            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                <span className="font-bold text-white text-lg">{item.data.current_streak}</span>
                                <span className="text-xs text-zinc-400">days streak</span>
                              </div>
                              <p className="text-xs text-zinc-300">Keep up the amazing work! 🔥</p>
                            </div>
                          </EnhancedCardContent>
                        </EnhancedCard>
                      ) : /* CV Feed Item */
                      item.type === 'cv_feed' && item.data && item.data.user ? (
                        <EnhancedCard
                          variant="default"
                          hover="lift"
                          className="bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out rounded-xl"
                        >
                          <EnhancedCardHeader className="p-3.5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <Avatar 
                                  className="h-9 w-9 interactive cursor-pointer"
                                  onClick={() => router.push(`/profile?userId=${item.data.user.id}`)}
                                >
                                  <AvatarImage src={item.data.user.image || undefined} />
                                  <AvatarFallback className="bg-zinc-800">{item.data.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="font-bold text-white text-sm cursor-pointer hover:text-blue-400"
                                      onClick={() => router.push(`/profile?userId=${item.data.user.id}`)}
                                    >
                                      {item.data.user.name}
                                    </span>
                                  </div>
                                  {item.data.user.title && (
                                    <div className="text-xs text-zinc-400 mt-0.5">{item.data.user.title}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </EnhancedCardHeader>
                          <EnhancedCardContent className="px-3.5 sm:px-6 pb-3.5">
                            <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart2 className="h-5 w-5 text-emerald-400" />
                                <span className="font-bold text-white text-lg">{item.data.overall_score?.toFixed(1) || 'N/A'}</span>
                                <span className="text-xs text-zinc-400">Resume Score</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {item.data.projects_score !== undefined && (
                                  <div className="text-xs">
                                    <span className="text-zinc-400">Projects: </span>
                                    <span className="text-emerald-300 font-medium">{item.data.projects_score.toFixed(1)}</span>
                                  </div>
                                )}
                                {item.data.experience_score !== undefined && (
                                  <div className="text-xs">
                                    <span className="text-zinc-400">Experience: </span>
                                    <span className="text-emerald-300 font-medium">{item.data.experience_score.toFixed(1)}</span>
                                  </div>
                                )}
                                {item.data.education_score !== undefined && (
                                  <div className="text-xs">
                                    <span className="text-zinc-400">Education: </span>
                                    <span className="text-emerald-300 font-medium">{item.data.education_score.toFixed(1)}</span>
                                  </div>
                                )}
                                {item.data.skills_score !== undefined && (
                                  <div className="text-xs">
                                    <span className="text-zinc-400">Skills: </span>
                                    <span className="text-emerald-300 font-medium">{item.data.skills_score.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </EnhancedCardContent>
                        </EnhancedCard>
                      ) : item.type === 'suggestion' && item.data && 'title' in item.data ? (
                      // Suggestion Card
                      <EnhancedCard
                        variant="gradient"
                        hover="lift"
                        className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out rounded-xl"
                      >
                        <EnhancedCardHeader className="p-3.5 pb-2">
                          <EnhancedCardTitle className="text-sm flex items-center">
                            {'type' in item.data && item.data.type === "network_suggestion" && (
                              <Users className="h-4 w-4 mr-2 text-blue-400" />
                            )}
                            {'type' in item.data && item.data.type === "progress_update" && (
                              <BarChart2 className="h-4 w-4 mr-2 text-green-400" />
                            )}
                            {'type' in item.data && item.data.type === "challenge_suggestion" && (
                              <Trophy className="h-4 w-4 mr-2 text-fuchsia-400" />
                            )}
                            <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                              {item.data.title}
                            </span>
                          </EnhancedCardTitle>
                          <p className="text-xs text-zinc-400 mt-0.5">{item.data.subtitle}</p>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="px-3.5 pb-3.5 pt-0">
                          {'type' in item.data && item.data.type === "network_suggestion" && 'suggestions' in item.data && item.data.suggestions && (
                            <div className="space-y-2">
                              {item.data.suggestions.map((person: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-800/60 border border-blue-700/30 rounded-lg">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={person.image} />
                                      <AvatarFallback className="bg-zinc-700">{person.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-white text-xs">{person.name}</h4>
                                        <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[9px]">
                                          Level {person.level}
                                        </Badge>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 mt-0.5">{person.title}</p>
                                      <p className="text-[9px] text-zinc-500 mt-0.5">{person.mutualConnections} mutual connections</p>
                                    </div>
                                  </div>
                                  <EnhancedButton
                                    size="sm"
                                    rounded="full"
                                    variant="gradient"
                                    animation="shimmer"
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)] text-xs px-3 py-1"
                                    leftIcon={<Plus className="h-3 w-3" />}
                                  >
                                    Connect
                                  </EnhancedButton>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {'type' in item.data && item.data.type === "progress_update" && 'stats' in item.data && item.data.stats && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-2.5">
                                  <div className="text-[10px] text-zinc-400 mb-0.5">XP Gained</div>
                                  <div className="text-base font-bold text-green-400">+{item.data.stats.xpGained}</div>
                                </div>
                                <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-2.5">
                                  <div className="text-[10px] text-zinc-400 mb-0.5">Tasks Done</div>
                                  <div className="text-base font-bold text-blue-400">{item.data.stats.tasksCompleted}</div>
                                </div>
                              </div>
                              <div className="bg-zinc-800/60 border border-yellow-700/30 rounded-lg p-2.5">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs font-medium text-white">Level Progress</span>
                                  <span className="text-[10px] text-zinc-400">{item.data.stats.levelProgress}%</span>
                                </div>
                                <AnimatedProgress 
                                  value={item.data.stats.levelProgress} 
                                  max={100} 
                                  className="[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-orange-500"
                                />
                                <p className="text-[10px] text-zinc-500 mt-1">Next: Level {item.data.stats.nextLevel}</p>
                              </div>
                            </div>
                          )}
                          
                          {'type' in item.data && item.data.type === "challenge_suggestion" && 'challenge' in item.data && item.data.challenge && (
                            <div className="space-y-2.5">
                              <div className="bg-zinc-800/60 border border-fuchsia-700/30 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-1.5">
                                  <h3 className="font-bold text-white text-xs">{item.data.challenge.title}</h3>
                                  <Badge className="bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-800 text-[9px]">
                                    +{item.data.challenge.xpReward} XP
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-zinc-400 mb-2">{item.data.challenge.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-[9px] text-zinc-500">
                                    {item.data.challenge.participants.toLocaleString()} participants
                                  </div>
                                  <div className="text-[9px] text-red-400 font-medium">
                                    {item.data.challenge.deadline}
                                  </div>
                                </div>
                              </div>
                              <EnhancedButton
                                size="sm"
                                rounded="full"
                                variant="gradient"
                                animation="shimmer"
                                className="w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 shadow-[0_0_8px_0_rgba(217,70,239,0.4)] text-xs py-2"
                              >
                                Join Challenge
                              </EnhancedButton>
                            </div>
                          )}
                        </EnhancedCardContent>
                      </EnhancedCard>
                    ) : null}
                  </AnimatedSection>
                      )
                    })
                )}
              </TabsContent>

              <TabsContent value="network" className="space-y-3">
                <h3 className="text-sm font-extrabold mb-3 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">People You May Know</h3>
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    <span className="ml-2 text-sm text-zinc-400">Loading suggestions...</span>
                  </div>
                ) : networkSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-400">No suggestions available at the moment.</p>
                  </div>
                ) : (
                  <>
                    {networkSuggestions.map((person, index) => (
                      <AnimatedSection key={person.userId} delay={0.1 + index * 0.08}>
                        <EnhancedCard variant="default" hover="lift" className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out rounded-xl">
                          <EnhancedCardContent className="p-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar 
                                className="h-9 w-9 interactive cursor-pointer"
                                onClick={() => router.push(`/profile?userId=${person.userId}`)}
                              >
                                <AvatarImage src={person.image || undefined} />
                                <AvatarFallback className="bg-zinc-800">{person.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 
                                    className="font-bold text-white text-xs cursor-pointer hover:text-blue-400"
                                    onClick={() => router.push(`/profile?userId=${person.userId}`)}
                                  >
                                    {person.name}
                                  </h4>
                                  {person.level !== undefined && (
                                    <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                      Level {person.level}
                                    </Badge>
                                  )}
                                  {person.resumeScore !== null && person.resumeScore !== undefined && (
                                    <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800 text-[10px]">
                                      {person.resumeScore} Score
                                    </Badge>
                                  )}
                                </div>
                                {person.title && (
                                  <p className="text-[10px] text-zinc-400 mt-0.5">{person.title}</p>
                                )}
                              </div>
                              <EnhancedButton
                                size="sm"
                                rounded="full"
                                variant="gradient"
                                animation="shimmer"
                                className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)] text-xs px-3 py-1"
                                leftIcon={<Plus className="h-3 w-3" />}
                                onClick={() => router.push(`/profile?userId=${person.userId}`)}
                              >
                                Connect
                              </EnhancedButton>
                            </div>
                          </EnhancedCardContent>
                        </EnhancedCard>
                      </AnimatedSection>
                    ))}
                    <div className="text-center mt-4">
                      <EnhancedButton
                        variant="outline"
                        rounded="full"
                        className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] text-xs px-5 py-2"
                        onClick={() => {
                          // Refresh suggestions
                          const event = new Event('refresh-suggestions')
                          window.dispatchEvent(event)
                        }}
                      >
                        View More Suggestions
                      </EnhancedButton>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

