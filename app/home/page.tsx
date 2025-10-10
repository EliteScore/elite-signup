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
  CheckCircle,
  BarChart2,
  Zap,
  Users,
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
import { XPNotification } from "@/components/xp-notification"
import AnimatedCounter from "@/components/ui/animated-counter"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import { AnimatedSection } from "@/components/ui/animated-section"

// Mock data for achievement posts (auto-generated from user activities)
const posts = [
  {
    id: 1,
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
      text: "🎉 Level Up! Just reached Level 8 after completing the Advanced System Design course! Gained 500 XP and unlocked the 'System Architect' badge. Ready to tackle distributed systems challenges! #LevelUp #SystemDesign",
      type: "level_up",
      achievement: "Reached Level 8 - System Architect",
      xpGained: 500,
      badgeUnlocked: "System Architect",
    },
    timestamp: "2 hours ago",
    likes: 243,
    comments: 18,
    liked: false,
    saved: false,
  },
  {
    id: 2,
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
      text: "🏆 Achievement Unlocked! 'Innovation Leader' badge earned after our team's project was selected for the company-wide showcase! This milestone pushed me to Level 12. The grind never stops! #Achievement #Leadership",
      type: "achievement",
      achievement: "Innovation Leader Badge Earned",
      xpGained: 750,
      badgeUnlocked: "Innovation Leader",
    },
    timestamp: "5 hours ago",
    likes: 512,
    comments: 42,
    liked: true,
    saved: true,
  },
  {
    id: 3,
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
      text: "📊 Resume Score Update! Just boosted my EliteScore from 78 to 84 after adding my AWS certification and recent project! Climbed 12 spots on the Data Science leaderboard. Every skill counts! #ResumeBoost #DataScience",
      type: "resume_score",
      achievement: "Resume Score Improved",
      xpGained: 150,
      badgeUnlocked: "Score Booster",
      scoreChange: "+6",
      leaderboardChange: "+12 spots",
    },
    timestamp: "Yesterday",
    likes: 189,
    comments: 27,
    liked: false,
    saved: false,
  },
  {
    id: 4,
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
      text: "🎨 Challenge Complete! Finished my 30-day UI design challenge and earned the 'Design Master' badge! Gained 400 XP and moved up 3 spots on the design leaderboard. Consistency pays off! #DesignChallenge #UIUX",
      image: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop",
      type: "challenge",
      achievement: "Design Master Badge Earned",
      xpGained: 400,
      badgeUnlocked: "Design Master",
    },
    timestamp: "2 days ago",
    likes: 345,
    comments: 31,
    liked: false,
    saved: false,
  },
  {
    id: 5,
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
      text: "⚡ Streak Achievement! Maintained a 15-day learning streak and unlocked the 'Consistency Champion' badge! Earned 200 XP and climbed to #3 on the weekly leaderboard. Small daily actions lead to big wins! #Streak #Consistency",
      type: "streak",
      achievement: "Consistency Champion Badge",
      xpGained: 200,
      badgeUnlocked: "Consistency Champion",
    },
    timestamp: "3 days ago",
    likes: 156,
    comments: 12,
    liked: false,
    saved: false,
  },
  {
    id: 6,
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
      text: "🏅 Leaderboard Update! Just broke into the TOP 100 on the Engineering Leaderboard! Currently ranked #87 - my goal is to reach top 50 by end of month. The competition is fierce but I'm grinding! #Leaderboard #Top100",
      type: "leaderboard",
      achievement: "Top 100 Engineering Leaderboard",
      xpGained: 300,
      badgeUnlocked: "Top 100 Elite",
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
    id: 7,
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
      text: "🔥 Weekly Highlight! This week I completed 5 skill assessments, maintained my 20-day streak, and earned 3 new badges! My EliteScore jumped from 82 to 86. Feeling unstoppable! #WeeklyHighlight #Growth",
      type: "weekly_highlight",
      achievement: "Incredible Week Progress",
      xpGained: 250,
      badgeUnlocked: "Weekly Warrior",
      weeklyStats: {
        assessments: 5,
        streak: 20,
        badges: 3,
        scoreIncrease: "+4"
      },
    },
    timestamp: "6 hours ago",
    likes: 312,
    comments: 28,
    liked: true,
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
      text: "💎 Rare Badge Unlocked! Just earned the 'Machine Learning Pioneer' badge after completing advanced ML coursework and publishing research. Only 47 people have this badge! Feeling honored to be part of this elite group! #RareBadge #MachineLearning",
      type: "rare_badge",
      achievement: "Machine Learning Pioneer Badge",
      xpGained: 600,
      badgeUnlocked: "ML Pioneer",
      rarity: "Only 47 people have this badge",
    },
    timestamp: "1 day ago",
    likes: 567,
    comments: 52,
    liked: false,
    saved: true,
  },
  {
    id: 9,
    user: {
      name: "Community Team",
      title: "EliteScore Community",
      username: "elitescore_community",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=faces",
      verified: true,
      level: 99,
      xp: 50000,
    },
    content: {
      text: "🌟 Community Spotlight! This week's most inspiring story comes from @alex_improvement who went from Level 3 to Level 8 in just 2 weeks! His dedication to learning system design paid off. Who's your inspiration this week? #CommunitySpotlight #Inspiration",
      type: "community_spotlight",
      achievement: "Community Spotlight",
      xpGained: 100,
      badgeUnlocked: "Community Member",
      featuredUser: "@alex_improvement",
      highlight: "Level 3 to Level 8 in 2 weeks",
    },
    timestamp: "2 hours ago",
    likes: 234,
    comments: 41,
    liked: false,
    saved: false,
  },
  {
    id: 10,
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
      text: "📈 Resume Score Breakthrough! Just hit 90+ on my EliteScore after adding my open-source contributions and technical blog! This puts me in the top 5% of developers. Ready to crush those interviews! #ResumeBoost #OpenSource",
      type: "resume_milestone",
      achievement: "90+ EliteScore Milestone",
      xpGained: 400,
      badgeUnlocked: "Elite Performer",
      score: "90+",
      percentile: "Top 5%",
    },
    timestamp: "8 hours ago",
    likes: 445,
    comments: 38,
    liked: true,
    saved: true,
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

export default function HomePage() {
  const router = useRouter()
  const [likedPosts, setLikedPosts] = useState<number[]>(posts.filter((p) => p.liked).map((p) => p.id))
  const [savedPosts, setSavedPosts] = useState<number[]>(posts.filter((p) => p.saved).map((p) => p.id))
  const [showXpNotification, setShowXpNotification] = useState(false)
  const [postText, setPostText] = useState("")
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)

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
      setShowXpNotification(true)
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
    if (postText.trim()) {
      // In a real app, this would create a new post
      console.log("Creating post:", postText)
      setPostText("")
      setShowXpNotification(true)
    }
  }

  const toggleTaskCompletion = (taskId: number) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId))
    } else {
      setCompletedTasks([...completedTasks, taskId])
      setShowXpNotification(true)
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
      } else if (postIndex < posts.length) {
              const currentPost = posts[postIndex]
        if (currentPost) {
          mixedFeed.push({
            type: 'post',
            data: currentPost,
            id: `post-${currentPost.id}`,
          })
          postIndex++
        }
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

      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 relative z-10 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - User Profile & Stats */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">

          </div>

          {/* Middle Column - Feed */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Feed Tabs */}
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="bg-zinc-900/80 border border-blue-700/40 rounded-lg p-1 mb-4 shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                <TabsTrigger
                  value="feed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="network"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Network
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Achievements
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                {/* Mixed Feed - Posts and Suggestions */}
                {mixedFeed.map((item, index) => (
                  <AnimatedSection key={item.id} delay={0.2 + index * 0.1}>
                    {item.type === 'post' ? (
                      // Achievement Post
                      <EnhancedCard
                        variant="default"
                        hover="lift"
                        className="bg-zinc-900/80 border border-blue-700/40 overflow-hidden shadow-[0_0_24px_0_rgba(80,0,255,0.2)] hover:shadow-[0_0_32px_0_rgba(80,0,255,0.4)]"
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
                                  <Badge className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]">
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
                                item.data.content.type === "level_up"
                                  ? "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/40 shadow-[0_0_8px_0_rgba(59,130,246,0.2)]"
                                  : item.data.content.type === "achievement"
                                    ? "bg-blue-900/20 border-blue-800/40 shadow-[0_0_8px_0_rgba(59,130,246,0.2)]"
                                  : item.data.content.type === "resume_score"
                                    ? "bg-emerald-900/20 border-emerald-800/40 shadow-[0_0_8px_0_rgba(16,185,129,0.2)]"
                                  : item.data.content.type === "challenge"
                                    ? "bg-fuchsia-900/20 border-fuchsia-800/40 shadow-[0_0_8px_0_rgba(217,70,239,0.2)]"
                                  : item.data.content.type === "streak"
                                    ? "bg-yellow-900/20 border-yellow-800/40 shadow-[0_0_8px_0_rgba(234,179,8,0.2)]"
                                  : item.data.content.type === "leaderboard"
                                    ? "bg-orange-900/20 border-orange-800/40 shadow-[0_0_8px_0_rgba(249,115,22,0.2)]"
                                  : item.data.content.type === "weekly_highlight"
                                    ? "bg-violet-900/20 border-violet-800/40 shadow-[0_0_8px_0_rgba(139,92,246,0.2)]"
                                  : item.data.content.type === "rare_badge"
                                    ? "bg-pink-900/20 border-pink-800/40 shadow-[0_0_8px_0_rgba(236,72,153,0.2)]"
                                  : item.data.content.type === "community_spotlight"
                                    ? "bg-cyan-900/20 border-cyan-800/40 shadow-[0_0_8px_0_rgba(6,182,212,0.2)]"
                                  : item.data.content.type === "resume_milestone"
                                    ? "bg-indigo-900/20 border-indigo-800/40 shadow-[0_0_8px_0_rgba(99,102,241,0.2)]"
                                  : "bg-green-900/20 border-green-800/40 shadow-[0_0_8px_0_rgba(34,197,94,0.2)]",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {item.data.content.type === "level_up" && (
                                    <Trophy className="h-5 w-5 mr-2 text-blue-400" />
                                  )}
                                  {item.data.content.type === "achievement" && (
                                    <Award className="h-5 w-5 mr-2 text-blue-400" />
                                  )}
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
                                  {item.data.content.type === "weekly_highlight" && (
                                    <Calendar className="h-5 w-5 mr-2 text-violet-400" />
                                  )}
                                  {item.data.content.type === "rare_badge" && (
                                    <Award className="h-5 w-5 mr-2 text-pink-400" />
                                  )}
                                  {item.data.content.type === "community_spotlight" && (
                                    <Users className="h-5 w-5 mr-2 text-cyan-400" />
                                  )}
                                  {item.data.content.type === "resume_milestone" && (
                                    <BarChart2 className="h-5 w-5 mr-2 text-indigo-400" />
                                  )}
                                  <div>
                                    <p className="font-bold text-sm text-white">
                                      {item.data.content.achievement}
                                    </p>
                                    <p className="text-xs text-zinc-400">{item.data.content.badgeUnlocked}</p>
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
                                    {item.data.content.type === "weekly_highlight" && (
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-xs text-violet-300">
                                          {item.data.content.weeklyStats.assessments} assessments
                                        </span>
                                        <span className="text-xs text-yellow-300">
                                          {item.data.content.weeklyStats.streak} day streak
                                        </span>
                                        <span className="text-xs text-emerald-300">
                                          {item.data.content.weeklyStats.scoreIncrease} score
                                        </span>
                                      </div>
                                    )}
                                    {item.data.content.type === "rare_badge" && (
                                      <p className="text-xs text-pink-300 mt-1">
                                        {item.data.content.rarity}
                                      </p>
                                    )}
                                    {item.data.content.type === "community_spotlight" && (
                                      <div className="mt-1">
                                        <p className="text-xs text-cyan-300">
                                          Featured: {item.data.content.featuredUser}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                          {item.data.content.highlight}
                                        </p>
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

                          {item.data.content.image && (
                            <div className="rounded-lg overflow-hidden mb-3 transition-all duration-300 hover:shadow-lg border border-zinc-700/50">
                              <img
                                src={item.data.content.image || "/placeholder.svg"}
                                alt="Post content"
                                className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </div>
                          )}
                        </EnhancedCardContent>
                        <EnhancedCardFooter className="p-3 sm:p-4 pt-0">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-4">
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                rounded="full"
                                className={cn(
                                  "transition-all duration-300",
                                  likedPosts.includes(item.data.id) ? "text-blue-400 bg-blue-900/20" : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-800/50",
                                )}
                                onClick={() => toggleLike(item.data.id)}
                              >
                                <ThumbsUp
                                  className={cn("h-4 w-4 mr-1", likedPosts.includes(item.data.id) && "fill-current")}
                                />
                                <span className="text-xs">{item.data.likes}</span>
                              </EnhancedButton>
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                rounded="full"
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300"
                                onClick={() => {
                                  console.log(`View comments for post ${item.data.id}`)
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                <span className="text-xs">{item.data.comments}</span>
                              </EnhancedButton>
                              <EnhancedButton
                                variant="ghost"
                                size="sm"
                                rounded="full"
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300"
                                onClick={() => {
                                  console.log(`Share post ${item.data.id}`)
                                }}
                              >
                                <Share2 className="h-4 w-4 mr-1" />
                                <span className="text-xs">Share</span>
                              </EnhancedButton>
                            </div>
                            <EnhancedButton
                              variant="ghost"
                              size="sm"
                              rounded="full"
                              className={cn(
                                "transition-all duration-300",
                                savedPosts.includes(item.data.id) ? "text-blue-400 bg-blue-900/20" : "text-zinc-400 hover:text-blue-400 hover:bg-zinc-800/50",
                              )}
                              onClick={() => toggleSave(item.data.id)}
                            >
                              <Bookmark className={cn("h-4 w-4", savedPosts.includes(item.data.id) && "fill-current")} />
                            </EnhancedButton>
                          </div>
                        </EnhancedCardFooter>
                      </EnhancedCard>
                    ) : (
                      // Suggestion Card
                      <EnhancedCard
                        variant="gradient"
                        hover="lift"
                        className="bg-gradient-to-br from-zinc-900/90 to-blue-900/20 border border-blue-700/40 shadow-[0_0_24px_0_rgba(80,0,255,0.3)]"
                      >
                        <EnhancedCardHeader className="pb-3">
                          <EnhancedCardTitle className="text-lg flex items-center">
                            {item.data.type === "network_suggestion" && (
                              <Users className="h-5 w-5 mr-2 text-blue-400" />
                            )}
                            {item.data.type === "progress_update" && (
                              <BarChart2 className="h-5 w-5 mr-2 text-green-400" />
                            )}
                            {item.data.type === "challenge_suggestion" && (
                              <Trophy className="h-5 w-5 mr-2 text-fuchsia-400" />
                            )}
                            <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                              {item.data.title}
                            </span>
                          </EnhancedCardTitle>
                          <p className="text-sm text-zinc-400">{item.data.subtitle}</p>
                        </EnhancedCardHeader>
                        <EnhancedCardContent className="p-4 pt-0">
                          {item.data.type === "network_suggestion" && (
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
                          
                          {item.data.type === "progress_update" && (
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
                          
                          {item.data.type === "challenge_suggestion" && (
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
                    )}
                  </AnimatedSection>
                ))}
              </TabsContent>

              <TabsContent value="network" className="space-y-4">
                <h3 className="text-lg font-extrabold mb-2 bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">People You May Know</h3>
                {networkSuggestions.map((person, index) => (
                  <AnimatedSection key={person.id} delay={0.2 + index * 0.1}>
                    <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.2)] hover:shadow-[0_0_24px_0_rgba(80,0,255,0.4)]">
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
                <AnimatedSection delay={0.2} staggerChildren staggerDelay={0.1}>
                  <h3 className="text-lg font-extrabold mb-2 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-400" />
                    <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">Your Recent Achievements</span>
                  </h3>

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900/80 border border-blue-800/40 shadow-[0_0_16px_0_rgba(59,130,246,0.3)]">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-blue-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(59,130,246,0.3)]">
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

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900/80 border border-purple-800/40 shadow-[0_0_16px_0_rgba(147,51,234,0.3)]">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-purple-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(147,51,234,0.3)]">
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

                  <EnhancedCard variant="gradient" hover="lift" className="bg-zinc-900/80 border border-green-800/40 shadow-[0_0_16px_0_rgba(34,197,94,0.3)]">
                    <EnhancedCardContent className="p-3">
                      <div className="flex items-start">
                        <div className="bg-green-900/40 p-2 rounded-full mr-3 shadow-[0_0_8px_0_rgba(34,197,94,0.3)]">
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
                      variant="gradient"
                      rounded="full"
                      animation="shimmer"
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                      onClick={() => router.push("/profile")}
                    >
                      View All Achievements
                    </EnhancedButton>
                  </div>
                </AnimatedSection>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>


      {/* XP Notification */}
      {showXpNotification && (
        <XPNotification xp={10} message="Action completed!" onComplete={() => setShowXpNotification(false)} />
      )}
    </DashboardLayout>
  )
}

