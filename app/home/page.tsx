"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

// Mock data for achievement posts (auto-generated from user activities)
const posts = [
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

// Mock data for network suggestions
const networkSuggestions = [
  {
    id: 1,
    name: "David Kim",
    title: "Frontend Developer at Netflix",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 12,
    level: 10,
    xp: 3200,
  },
  {
    id: 2,
    name: "Jessica Lee",
    title: "Product Manager at Spotify",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 8,
    level: 11,
    xp: 3800,
  },
  {
    id: 3,
    name: "Ryan Martinez",
    title: "Data Engineer at Airbnb",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    mutualConnections: 5,
    level: 9,
    xp: 2600,
  },
]

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
  const router = useRouter()
  const [likedPosts, setLikedPosts] = useState<number[]>(posts.filter((p) => p.liked).map((p) => p.id))
  const [savedPosts, setSavedPosts] = useState<number[]>(posts.filter((p) => p.saved).map((p) => p.id))
  const [postText, setPostText] = useState("")
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [activePostType, setActivePostType] = useState<string | null>(null)
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null)
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<number | null>(null)
  const [postMessage, setPostMessage] = useState("")

  // Check if it's the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore")
    if (!hasVisitedBefore) {
      setShowOnboarding(true)
      localStorage.setItem("hasVisitedBefore", "true")
    }
  }, [])

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
    console.log("Creating post:", { type: activePostType, content: postContent })
    
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

  // Mix posts with suggestion cards for natural feed integration
  const createMixedFeed = () => {
    const mixedFeed = []
    let postIndex = 0
    let suggestionIndex = 0
    
    // Insert suggestion cards at strategic positions
    const suggestionPositions = [1, 3, 5] // After 1st, 3rd, and 5th posts
    
    for (let i = 0; i < posts.length + suggestionCards.length; i++) {
      if (suggestionPositions.includes(i) && suggestionIndex < suggestionCards.length) {
        mixedFeed.push({
          type: 'suggestion',
          data: suggestionCards[suggestionIndex],
          id: `suggestion-${suggestionIndex}`,
        })
        suggestionIndex++
      } else if (postIndex < posts.length && posts[postIndex]) {
        const post = posts[postIndex]!
        mixedFeed.push({
          type: 'post',
          data: post,
          id: `post-${post.id}`,
        })
        postIndex++
      }
    }
    
    return mixedFeed
  }

  const mixedFeed = createMixedFeed()

  // Calculate progress percentage
  const progressPercentage = (userStats.xp / userStats.nextLevelXp) * 100
  const taskCompletionPercentage = (completedTasks.length / upcomingTasks.length) * 100

  return (
    <DashboardLayout>
      {/* Logo */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="EliteScore Logo" 
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />
          </div>
        </div>
      </div>

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

      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 overflow-x-hidden scroll-smooth">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Spacer */}
          <div className="lg:col-span-2"></div>

          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">

            {/* Motivational Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Keep pushing. Your future self will thank you.</h2>
              <p className="text-sm text-zinc-300">Every post is someone getting better. Your turn.</p>
            </div>

            {/* Create Post - Minimized LinkedIn Style */}
            {!activePostType ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setActivePostType('resume_score')}
                    className="flex-1 text-left px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded-full text-zinc-400 text-sm transition-colors"
                  >
                    Share your progress...
                  </button>
                </div>
                <div className="flex items-center justify-around mt-3 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setActivePostType('resume_score')}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <BarChart2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs sm:text-sm">Resume Score</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('challenge')}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Award className="h-5 w-5 text-fuchsia-400" />
                    <span className="text-xs sm:text-sm">Challenge</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('streak')}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="text-xs sm:text-sm">Streak</span>
                  </button>
                  <button
                    onClick={() => setActivePostType('leaderboard')}
                    className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trophy className="h-5 w-5 text-orange-400" />
                    <span className="text-xs sm:text-sm hidden sm:inline">Leaderboard</span>
                    <span className="text-xs sm:hidden">Board</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Post Creation Form */}
            {activePostType && (
              <AnimatedSection delay={0.1}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl mb-4 transition-all duration-300 ease-in-out">
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {activePostType === 'resume_score' && <BarChart2 className="h-5 w-5 text-emerald-400" />}
                        {activePostType === 'challenge' && <Award className="h-5 w-5 text-fuchsia-400" />}
                        {activePostType === 'streak' && <Zap className="h-5 w-5 text-yellow-400" />}
                        {activePostType === 'leaderboard' && <Trophy className="h-5 w-5 text-orange-400" />}
                        <h3 className="text-base font-semibold text-white">
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
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {activePostType === 'resume_score' && (
                        <div>
                          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-zinc-300">Your Resume Score</span>
                              <span className="text-xs text-zinc-500">{userData.resumeScore.lastUpdated}</span>
                            </div>
                            <div className="flex items-center justify-center gap-6 mb-4">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-zinc-400">{userData.resumeScore.previous}</div>
                                <div className="text-xs text-zinc-500 mt-1">Previous</div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                              <div className="text-center">
                                <div className="text-4xl font-bold text-emerald-400">{userData.resumeScore.current}</div>
                                <div className="text-xs text-emerald-400 mt-1">Current</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">+{userData.resumeScore.current - userData.resumeScore.previous}</div>
                                <div className="text-xs text-zinc-500 mt-1">Points</div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-zinc-700/50">
                              <div className="text-xs font-medium text-zinc-400 mb-2">Recent improvements:</div>
                              <div className="space-y-1.5">
                                {userData.resumeScore.improvements.map((improvement, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
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
                          <p className="text-sm text-zinc-400 mb-3">Select a completed challenge to share:</p>
                          <div className="space-y-2">
                            {userData.completedChallenges.map((challenge) => (
                              <button
                                key={challenge.id}
                                onClick={() => setSelectedChallenge(challenge.id)}
                                className={cn(
                                  "w-full p-3.5 rounded-lg border text-left transition-all duration-200",
                                  selectedChallenge === challenge.id
                                    ? "bg-fuchsia-900/10 border-fuchsia-700/50 ring-1 ring-fuchsia-700/50"
                                    : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm">{challenge.name}</div>
                                    <div className="text-xs text-zinc-500 mt-1">Completed {challenge.completedDate}</div>
                                  </div>
                                  <Badge className="bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-900/50 text-xs ml-3">
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
                          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-zinc-300">Current Streak</span>
                              <Badge className="bg-yellow-950/50 text-yellow-400 border-yellow-900/50 text-xs">
                                Active
                              </Badge>
                            </div>
                            <div className="text-center mb-4 py-3">
                              <div className="text-6xl font-bold text-yellow-400">{userData.currentStreak.days}</div>
                              <div className="text-sm text-zinc-400 mt-2">Days</div>
                            </div>
                            <div className="space-y-2.5 pt-3 border-t border-zinc-700/50">
                              <div className="text-sm">
                                <span className="text-zinc-500">Type:</span>
                                <span className="text-white ml-2 font-medium">{userData.currentStreak.type}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-zinc-500">Started:</span>
                                <span className="text-white ml-2">{userData.currentStreak.startDate}</span>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-zinc-400 mb-2">Daily activities:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {userData.currentStreak.activities.map((activity, idx) => (
                                    <Badge key={idx} className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
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
                          <p className="text-sm text-zinc-400 mb-3">Select a leaderboard ranking to share:</p>
                          <div className="space-y-2">
                            {userData.leaderboardRankings.map((ranking, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedLeaderboard(idx)}
                                className={cn(
                                  "w-full p-3.5 rounded-lg border text-left transition-all duration-200",
                                  selectedLeaderboard === idx
                                    ? "bg-orange-900/10 border-orange-700/50 ring-1 ring-orange-700/50"
                                    : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm mb-1">{ranking.category}</div>
                                    <div className="text-xs text-zinc-500">
                                      #{ranking.previousRank} → #{ranking.currentRank} <span className="text-zinc-600">•</span> {ranking.totalParticipants.toLocaleString()} participants
                                    </div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="text-base font-bold text-emerald-400">
                                      +{ranking.previousRank - ranking.currentRank}
                                    </div>
                                    <div className="text-xs text-zinc-500">spots</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Add a personal message (optional)</label>
                        <textarea
                          placeholder="Share your thoughts, tips, or motivation..."
                          value={postMessage}
                          onChange={(e) => setPostMessage(e.target.value)}
                          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none h-20 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-zinc-800 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActivePostType(null)
                        setSelectedChallenge(null)
                        setSelectedLeaderboard(null)
                        setPostMessage("")
                      }}
                      className="flex-1 bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
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
              <TabsList className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-4 transition-all duration-300 ease-in-out">
                <TabsTrigger
                  value="feed"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm px-2 sm:px-3"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm px-2 sm:px-3"
                >
                  Network
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm px-2 sm:px-3"
                >
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                {/* Mixed Feed - Posts and Suggestions */}
                {mixedFeed.map((item, index) => (
                  <AnimatedSection key={item.id} delay={0.1 + index * 0.05}>
                    {item.type === 'post' && item.data && 'user' in item.data ? (
                      // Achievement Post
                    <EnhancedCard
                      variant="default"
                      hover="lift"
                      className="bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300 ease-in-out"
                    >
                      <EnhancedCardHeader className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 interactive">
                                <AvatarImage src={item.data.user.image} />
                                <AvatarFallback className="bg-zinc-800">{item.data.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{item.data.user.name}</span>
                                  {item.data.user.verified && (
                                    <svg className="h-4 w-4 text-blue-400 fill-current" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                  </svg>
                                )}
                                  <Badge className="bg-blue-950 text-blue-300 border-blue-800 text-[10px]">
                                    Level {item.data.user.level}
                                  </Badge>
                              </div>
                                <div className="text-xs text-zinc-400">{item.data.user.title}</div>
                                <div className="text-xs text-zinc-500">{item.data.timestamp}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 rounded-full hover:bg-zinc-800/50 hover:text-white"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </div>
                      </EnhancedCardHeader>
                      <EnhancedCardContent className="px-3 sm:px-4 pb-2">
                          <p className="text-sm mb-3 text-white leading-relaxed">{item.data.content.text}</p>

                          {/* Achievement Badge with XP */}
                          {item.data.content.type && (
                          <div
                            className={cn(
                              "p-3 rounded-lg mb-3 transition-all duration-300 hover:shadow-md border",
                                item.data.content.type === "resume_score"
                                  ? "bg-emerald-900/20 border-emerald-800/40 shadow-[0_0_8px_0_rgba(16,185,129,0.2)]"
                                  : item.data.content.type === "challenge"
                                    ? "bg-fuchsia-900/20 border-fuchsia-800/40 shadow-[0_0_8px_0_rgba(217,70,239,0.2)]"
                                  : item.data.content.type === "streak"
                                    ? "bg-yellow-900/20 border-yellow-800/40 shadow-[0_0_8px_0_rgba(234,179,8,0.2)]"
                                  : item.data.content.type === "leaderboard"
                                    ? "bg-orange-900/20 border-orange-800/40 shadow-[0_0_8px_0_rgba(249,115,22,0.2)]"
                                  : item.data.content.type === "resume_milestone"
                                    ? "bg-indigo-900/20 border-indigo-800/40 shadow-[0_0_8px_0_rgba(99,102,241,0.2)]"
                                  : "bg-green-900/20 border-green-800/40 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]",
                              )}
                            >
                              <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                  {item.data.content.type === "resume_score" && (
                                    <BarChart2 className="h-5 w-5 mr-2 text-emerald-400" />
                              )}
                                  {item.data.content.type === "challenge" && (
                                <Award className="h-5 w-5 mr-2 text-fuchsia-400" />
                              )}
                                  {item.data.content.type === "streak" && (
                                    <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                                  )}
                                  {item.data.content.type === "leaderboard" && (
                                    <Trophy className="h-5 w-5 mr-2 text-orange-400" />
                                  )}
                                  {item.data.content.type === "resume_milestone" && (
                                    <BarChart2 className="h-5 w-5 mr-2 text-indigo-400" />
                              )}
                              <div>
                                <p className="font-bold text-sm text-white">
                                      {item.data.content.achievement}
                                    </p>
                                    {item.data.content.streakDays && (
                                      <p className="text-xs text-zinc-400">{item.data.content.streakDays} days streak</p>
                                    )}
                                    {/* Additional info for specific types */}
                                    {item.data.content.type === "resume_score" && (
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-emerald-300 font-medium">
                                          Score: {item.data.content.scoreChange}
                                        </span>
                                        <span className="text-xs text-blue-300">
                                          {item.data.content.leaderboardChange}
                                        </span>
                              </div>
                                    )}
                                    {item.data.content.type === "leaderboard" && (
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-orange-300 font-medium">
                                          Rank: {item.data.content.rank}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                          {item.data.content.category}
                                        </span>
                                      </div>
                                    )}
                                    {item.data.content.type === "resume_milestone" && (
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-indigo-300 font-medium">
                                          Score: {item.data.content.score}
                                        </span>
                                        <span className="text-xs text-purple-300">
                                          {item.data.content.percentile}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Badge className="bg-green-900/50 text-green-300 border-green-800 text-[10px]">
                                  +{item.data.content.xpGained} XP
                                </Badge>
                            </div>
                          </div>
                        )}

                      </EnhancedCardContent>
                      <EnhancedCardFooter className="p-3 sm:p-4 pt-0">
                        <div className="flex items-center">
                          <EnhancedButton
                            variant="ghost"
                            size="sm"
                            rounded="full"
                            className={cn(
                              "transition-all duration-300",
                                likedPosts.includes(Number(item.data.id)) ? "text-blue-400 bg-blue-900/20" : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-800/50",
                            )}
                              onClick={() => item.data && toggleLike(Number(item.data.id))}
                          >
                            <ThumbsUp
                                className={cn("h-4 w-4 mr-1", likedPosts.includes(Number(item.data.id)) && "fill-current")}
                            />
                              <span className="text-xs">{item.data.likes}</span>
                          </EnhancedButton>
                        </div>
                      </EnhancedCardFooter>
                    </EnhancedCard>
                    ) : item.type === 'suggestion' && item.data && 'title' in item.data ? (
                      // Suggestion Card
                      <EnhancedCard
                        variant="gradient"
                        hover="lift"
                        className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out"
                      >
                        <EnhancedCardHeader className="pb-3">
                          <EnhancedCardTitle className="text-lg flex items-center">
                            {'type' in item.data && item.data.type === "network_suggestion" && (
                              <Users className="h-5 w-5 mr-2 text-blue-400" />
                            )}
                            {'type' in item.data && item.data.type === "progress_update" && (
                              <BarChart2 className="h-5 w-5 mr-2 text-green-400" />
                            )}
                            {'type' in item.data && item.data.type === "challenge_suggestion" && (
                              <Trophy className="h-5 w-5 mr-2 text-fuchsia-400" />
                            )}
                            <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                              {item.data.title}
                            </span>
                          </EnhancedCardTitle>
                          <p className="text-sm text-zinc-400">{item.data.subtitle}</p>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="p-4 pt-0">
                          {'type' in item.data && item.data.type === "network_suggestion" && 'suggestions' in item.data && item.data.suggestions && (
                            <div className="space-y-3">
                              {item.data.suggestions.map((person: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/60 border border-blue-700/30 rounded-lg">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                      <AvatarImage src={person.image} />
                                      <AvatarFallback className="bg-zinc-700">{person.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{person.name}</h4>
                                        <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                          Level {person.level}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-zinc-400">{person.title}</p>
                                      <p className="text-xs text-zinc-500">{person.mutualConnections} mutual connections</p>
                                    </div>
                                  </div>
                                  <EnhancedButton
                                    size="sm"
                                    rounded="full"
                                    variant="gradient"
                                    animation="shimmer"
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)]"
                                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                                  >
                                    Connect
                                  </EnhancedButton>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {'type' in item.data && item.data.type === "progress_update" && 'stats' in item.data && item.data.stats && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-800/60 border border-green-700/30 rounded-lg p-3">
                                  <div className="text-xs text-zinc-400 mb-1">XP Gained</div>
                                  <div className="text-lg font-bold text-green-400">+{item.data.stats.xpGained}</div>
                                </div>
                                <div className="bg-zinc-800/60 border border-blue-700/30 rounded-lg p-3">
                                  <div className="text-xs text-zinc-400 mb-1">Tasks Done</div>
                                  <div className="text-lg font-bold text-blue-400">{item.data.stats.tasksCompleted}</div>
                                </div>
                              </div>
                              <div className="bg-zinc-800/60 border border-yellow-700/30 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-white">Level Progress</span>
                                  <span className="text-xs text-zinc-400">{item.data.stats.levelProgress}%</span>
                                </div>
                                <AnimatedProgress 
                                  value={item.data.stats.levelProgress} 
                                  max={100} 
                                  className="[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-orange-500"
                                />
                                <p className="text-xs text-zinc-500 mt-1">Next: Level {item.data.stats.nextLevel}</p>
                              </div>
                            </div>
                          )}
                          
                          {'type' in item.data && item.data.type === "challenge_suggestion" && 'challenge' in item.data && item.data.challenge && (
                            <div className="space-y-3">
                              <div className="bg-zinc-800/60 border border-fuchsia-700/30 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-white">{item.data.challenge.title}</h3>
                                  <Badge className="bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-800 text-[10px]">
                                    +{item.data.challenge.xpReward} XP
                                  </Badge>
                                </div>
                                <p className="text-sm text-zinc-400 mb-3">{item.data.challenge.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-zinc-500">
                                    {item.data.challenge.participants.toLocaleString()} participants
                                  </div>
                                  <div className="text-xs text-red-400 font-medium">
                                    {item.data.challenge.deadline}
                                  </div>
                                </div>
                              </div>
                              <EnhancedButton
                                size="sm"
                                rounded="full"
                                variant="gradient"
                                animation="shimmer"
                                className="w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-blue-500 shadow-[0_0_8px_0_rgba(217,70,239,0.4)]"
                              >
                                Join Challenge
                              </EnhancedButton>
                            </div>
                          )}
                        </EnhancedCardContent>
                      </EnhancedCard>
                    ) : null}
                  </AnimatedSection>
                ))}
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <h3 className="text-lg font-extrabold mb-2 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">People You May Know</h3>
                {networkSuggestions.map((person, index) => (
                  <AnimatedSection key={person.id} delay={0.1 + index * 0.08}>
                    <EnhancedCard variant="default" hover="lift" className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out">
                      <EnhancedCardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-3 interactive">
                            <AvatarImage src={person.image} />
                            <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white">{person.name}</h4>
                              <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                                Level {person.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400">{person.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">{person.mutualConnections} mutual connections</p>
                          </div>
                          <EnhancedButton
                            size="sm"
                            rounded="full"
                            variant="gradient"
                            animation="shimmer"
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)]"
                            leftIcon={<Plus className="h-3.5 w-3.5" />}
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
                    className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                  >
                    View More Suggestions
                  </EnhancedButton>
                </div>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <AnimatedSection delay={0.1} staggerChildren staggerDelay={0.05}>
                  <h3 className="text-lg font-extrabold mb-2 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-400" />
                    <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Your Recent Achievements</span>
                  </h3>

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-blue-950 p-2 rounded-md mr-3">
                          <Award className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">Completed Advanced React Course</h3>
                            <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
                              +500 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">Earned certificate of completion</p>
                          <div className="text-xs text-zinc-500 mt-1">2 weeks ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-purple-950 p-2 rounded-md mr-3">
                          <Trophy className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">Promoted to Senior Developer</h3>
                            <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                              +750 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">Career milestone achievement</p>
                          <div className="text-xs text-zinc-500 mt-1">1 month ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900 border border-zinc-800 transition-all duration-300 ease-in-out">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-green-950 p-2 rounded-md mr-3">
                          <FileText className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">Published Technical Article</h3>
                            <Badge className="bg-green-900/40 text-green-300 border-green-800/40 text-[10px]">
                              +300 XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">10,000+ views on Medium</p>
                          <div className="text-xs text-zinc-500 mt-1">2 months ago</div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>

                  <div className="text-center mt-4">
                    <EnhancedButton
                      variant="default"
                      rounded="full"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push("/profile")}
                    >
                      View All Achievements
                    </EnhancedButton>
                  </div>
                </AnimatedSection>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Spacer */}
          <div className="lg:col-span-2"></div>
        </div>
      </div>


    </DashboardLayout>
  )
}

