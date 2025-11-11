"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp,
  Award,
  FileText,
  ArrowRight,
  ChevronRight,
  Star,
  Target,
  Upload,
  CheckCircle,
  Zap,
  Trophy,
  BarChart2,
  BarChart3,
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Brain,
  Rocket,
  Globe,
  DollarSign,
  Heart,
  BookOpen,
  Briefcase,
  TrendingDown,
  X,
  Users,
  PlayCircle,
  Timer,
  BookmarkCheck,
  Flame,
  Crown,
  Medal,
  ChevronDown,
  Share2,
  MessageCircle,
  Code,
  Palette,
  Mic,
} from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardDescription,
  EnhancedCardFooter,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from "@/components/ui/enhanced-card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LevelIndicator } from "@/components/level-indicator"
import { AnimatedProgress } from "@/components/ui/animated-progress"
import AnimatedCounter from "@/components/ui/animated-counter"
import { AnimatedSection } from "@/components/ui/animated-section"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Enhanced goal categories with icons and gradients
const goalCategories = [
  {
    id: "career",
    name: "Career Growth",
    icon: Briefcase,
    gradient: "from-blue-500 via-purple-500 to-fuchsia-500",
    description: "Advance your career and reach new heights",
    skills: ["Leadership", "Communication", "Technical Skills", "Networking"],
    targetRoles: ["Software Engineer", "Product Manager", "Data Scientist", "Designer"]
  },
  {
    id: "learning",
    name: "Skill Development",
    icon: BookOpen,
    gradient: "from-purple-500 via-pink-500 to-red-500",
    description: "Master new skills and technologies",
    skills: ["Programming", "Design", "Analytics", "Languages"],
    targetRoles: ["Full Stack Developer", "AI Engineer", "UX Designer", "Data Analyst"]
  },

  {
    id: "financial",
    name: "Financial Freedom",
    icon: DollarSign,
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    description: "Achieve financial independence and security",
    skills: ["Investing", "Budgeting", "Side Income", "Savings"],
    targetRoles: ["Financial Advisor", "Investment Banker", "Entrepreneur", "CFO"]
  },
  {
    id: "personal",
    name: "Personal Growth",
    icon: Sparkles,
    gradient: "from-pink-500 via-purple-500 to-indigo-500",
    description: "Become the best version of yourself",
    skills: ["Mindfulness", "Creativity", "Relationships", "Habits"],
    targetRoles: ["Life Coach", "Therapist", "Author", "Speaker"]
  },
  {
    id: "business",
    name: "Entrepreneurship",
    icon: Rocket,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    description: "Build and scale your business empire",
    skills: ["Strategy", "Marketing", "Operations", "Innovation"],
    targetRoles: ["CEO", "Founder", "Business Analyst", "Consultant"]
  }
]

// Initial resume analysis data
const initialResumeAnalysis = {
  overallScore: 78,
  sections: [
    { name: "Experience", score: 85, feedback: "Strong technical background with progressive responsibilities" },
    { name: "Skills", score: 72, feedback: "Consider adding more in-demand technologies" },
    { name: "Education", score: 80, feedback: "Good educational foundation" },
    { name: "Projects", score: 65, feedback: "Add more detailed project descriptions and outcomes" }
  ],
  suggestions: [
    "Add quantifiable achievements to your experience section",
    "Include more relevant keywords for your target role",
    "Add a professional summary section",
    "Highlight leadership and collaboration skills"
  ],
  recommendedChallenges: [
    "Complete a technical project with measurable outcomes",
    "Obtain a relevant certification",
    "Build a portfolio website",
    "Contribute to open source projects"
  ]
}

// Activity preferences for users to select from
const activityPreferences = [
  {
    id: "coding",
    name: "Programming & Development",
    icon: Code,
    category: "learning",
    description: "Learn coding languages and build projects"
  },
  {
    id: "design",
    name: "UI/UX Design",
    icon: Palette,
    category: "learning",
    description: "Create beautiful user interfaces and experiences"
  },
  {
    id: "data",
    name: "Data Science & Analytics",
    icon: BarChart3,
    category: "learning",
    description: "Analyze data and build predictive models"
  },
  {
    id: "leadership",
    name: "Leadership & Management",
    icon: Users,
    category: "career",
    description: "Develop leadership skills and team management"
  },
  {
    id: "networking",
    name: "Networking & Communication",
    icon: MessageCircle,
    category: "career",
    description: "Build professional relationships and communication"
  },
  {
    id: "fitness",
    name: "Health & Fitness",
    icon: Heart,
    category: "personal",
    description: "Improve physical and mental well-being"
  },
  {
    id: "mindfulness",
    name: "Mindfulness & Meditation",
    icon: Brain,
    category: "personal",
    description: "Develop mental clarity and emotional balance"
  },
  {
    id: "investing",
    name: "Investing & Finance",
    icon: TrendingUp,
    category: "financial",
    description: "Learn about investments and financial planning"
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship",
    icon: Rocket,
    category: "business",
    description: "Start and grow your own business"
  },
  {
    id: "marketing",
    name: "Digital Marketing",
    icon: Share2,
    category: "business",
    description: "Learn modern marketing strategies and tools"
  },
  {
    id: "languages",
    name: "Language Learning",
    icon: Globe,
    category: "learning",
    description: "Master new languages for global opportunities"
  },
  {
    id: "public-speaking",
    name: "Public Speaking",
    icon: Mic,
    category: "career",
    description: "Develop confidence in public presentations"
  }
]

// Mock daily challenges based on goal
const dailyChallenges = {
  career: [
    {
      id: 1,
      title: "Update LinkedIn Profile",
      description: "Add your latest project and optimize for keywords",
      xp: 50,
      difficulty: "Easy",
      timeEstimate: "15 mins",
      completed: false,
      type: "daily"
    },
    {
      id: 2,
      title: "Read Industry Article",
      description: "Read and summarize one tech industry article",
      xp: 30,
      difficulty: "Easy",
      timeEstimate: "10 mins",
      completed: true,
      type: "daily"
    },
    {
      id: 3,
      title: "Network with a Peer",
      description: "Send a meaningful message to someone in your field",
      xp: 75,
      difficulty: "Medium",
      timeEstimate: "20 mins",
      completed: false,
      type: "daily"
    }
  ],
  learning: [
    {
      id: 4,
      title: "Code for 30 Minutes",
      description: "Practice coding on LeetCode or similar platform",
      xp: 100,
      difficulty: "Medium",
      timeEstimate: "30 mins",
      completed: false,
      type: "daily"
    },
    {
      id: 5,
      title: "Watch Tutorial Video",
      description: "Learn something new from YouTube or course platform",
      xp: 40,
      difficulty: "Easy",
      timeEstimate: "15 mins",
      completed: true,
      type: "daily"
    }
  ]
}

// Mock monthly challenges
const monthlyChallenges = [
  {
    id: 1,
    title: "Build a Complete Project",
    description: "Create a full-stack application with modern technologies",
    xp: 1000,
    difficulty: "Hard",
    timeEstimate: "20+ hours",
    completed: false,
    type: "monthly",
    deadline: "2024-02-28",
    progress: 35
  },
  {
    id: 2,
    title: "Get a Professional Certification",
    description: "Complete AWS, Google Cloud, or similar certification",
    xp: 1500,
    difficulty: "Hard",
    timeEstimate: "40+ hours",
    completed: false,
    type: "monthly",
    deadline: "2024-03-15",
    progress: 15
  },
  {
    id: 3,
    title: "Attend 3 Networking Events",
    description: "Join virtual or in-person professional events",
    xp: 500,
    difficulty: "Medium",
    timeEstimate: "6+ hours",
    completed: false,
    type: "monthly",
    deadline: "2024-02-20",
    progress: 66
  }
]

// Mock leaderboards data
const availableLeaderboards = [
  {
    id: "global",
    name: "Global Leaderboard",
    description: "Compete with users worldwide",
    memberCount: 10000,
    isJoined: true,
    type: "public",
    category: "all"
  },
  {
    id: "university",
    name: "University Students",
    description: "Students from top universities",
    memberCount: 2500,
    isJoined: true,
    type: "public",
    category: "education"
  },
  {
    id: "tech-careers",
    name: "Tech Career Focused",
    description: "For aspiring tech professionals",
    memberCount: 1800,
    isJoined: false,
    type: "public",
    category: "career"
  },
  {
    id: "coding-bootcamp",
    name: "Coding Bootcamp Alumni",
    description: "Bootcamp graduates and students",
    memberCount: 450,
    isJoined: false,
    type: "public",
    category: "learning"
  }
]

// Mock leaderboard data for different boards
const leaderboardData = {
  global: [
    { name: "Alex Chen", score: 2847, xp: 12500, level: 8, streak: 15, goal: "Software Engineer at FAANG", university: "MIT" },
    { name: "Sarah Kim", score: 2756, xp: 11200, level: 7, streak: 12, goal: "Product Manager at Tech Startup", university: "Stanford" },
    { name: "You", score: 2650, xp: 10800, level: 7, streak: 8, goal: "Full Stack Developer", university: "UC Berkeley" },
    { name: "Miguel Santos", score: 2598, xp: 10200, level: 6, streak: 22, goal: "Data Scientist", university: "CMU" },
    { name: "Emma Johnson", score: 2445, xp: 9800, level: 6, streak: 5, goal: "UX Designer", university: "RISD" }
  ],
  university: [
    { name: "You", score: 2650, xp: 10800, level: 7, streak: 8, goal: "Full Stack Developer", university: "UC Berkeley" },
    { name: "James Wilson", score: 2580, xp: 10400, level: 7, streak: 6, goal: "ML Engineer", university: "UC Berkeley" },
    { name: "Lisa Chen", score: 2420, xp: 9600, level: 6, streak: 12, goal: "Software Engineer", university: "UC Berkeley" },
    { name: "David Park", score: 2380, xp: 9200, level: 6, streak: 4, goal: "Product Manager", university: "UC Berkeley" },
    { name: "Sofia Martinez", score: 2250, xp: 8800, level: 5, streak: 9, goal: "Data Analyst", university: "UC Berkeley" }
  ],
  "tech-careers": [
    { name: "Alex Chen", score: 2847, xp: 12500, level: 8, streak: 15, goal: "Software Engineer at FAANG", university: "MIT" },
    { name: "Sarah Kim", score: 2756, xp: 11200, level: 7, streak: 12, goal: "Product Manager at Tech Startup", university: "Stanford" },
    { name: "Miguel Santos", score: 2598, xp: 10200, level: 6, streak: 22, goal: "Data Scientist", university: "CMU" },
    { name: "Ryan Kumar", score: 2580, xp: 10350, level: 7, streak: 11, goal: "DevOps Engineer", university: "Georgia Tech" },
    { name: "Jennifer Liu", score: 2540, xp: 10100, level: 6, streak: 8, goal: "Frontend Developer", university: "UCLA" }
  ]
}

export default function GoalsPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentLevel, setCurrentLevel] = useState(7)
  const [currentXP, setCurrentXP] = useState(10800)
  const [currentScore, setCurrentScore] = useState(2650)
  const nextLevelXP = 12000
  const progress = (currentXP / nextLevelXP) * 100
  
  // State management for new onboarding flow
  const [onboardingStep, setOnboardingStep] = useState<'goal' | 'activities' | 'resume' | 'score' | 'complete'>('goal')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [showResumeUpload, setShowResumeUpload] = useState(false)
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const [userScore, setUserScore] = useState<number | null>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState(initialResumeAnalysis)
  const [isNewUser, setIsNewUser] = useState(true)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [selectedChallengeForVerification, setSelectedChallengeForVerification] = useState<any>(null)
  const [verificationMethod, setVerificationMethod] = useState<'upload' | 'link' | 'text'>('upload')
  const [verificationData, setVerificationData] = useState('')
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('global')
  const [showCreateLeaderboard, setShowCreateLeaderboard] = useState(false)
  const [newLeaderboardName, setNewLeaderboardName] = useState('')
  const [newLeaderboardDescription, setNewLeaderboardDescription] = useState('')
  const [joinedLeaderboards, setJoinedLeaderboards] = useState(['global', 'university'])

  const [createdGoals, setCreatedGoals] = useState<any[]>([])
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([2, 5])
  const [activeTab, setActiveTab] = useState("overview")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setResumeUploaded(true)
      // Simulate file upload and analysis
      setTimeout(() => {
        setShowAnalysis(true)
        // Generate a random score between 60-100
        const score = Math.floor(Math.random() * 40) + 60
        setUserScore(score)
        
        // Generate dynamic resume analysis data
        const dynamicResumeAnalysis = {
          overallScore: score,
          sections: [
            { 
              name: "Experience", 
              score: Math.floor(Math.random() * 30) + 70, 
              feedback: "Strong technical background with progressive responsibilities" 
            },
            { 
              name: "Skills", 
              score: Math.floor(Math.random() * 30) + 65, 
              feedback: "Consider adding more in-demand technologies" 
            },
            { 
              name: "Education", 
              score: Math.floor(Math.random() * 30) + 75, 
              feedback: "Solid academic foundation" 
            },
            { 
              name: "Projects", 
              score: Math.floor(Math.random() * 30) + 60, 
              feedback: "Good project portfolio, could use more variety" 
            }
          ],
          suggestions: [
            "Add more quantifiable achievements to your experience section",
            "Include specific technologies and tools you've used",
            "Highlight leadership and teamwork experiences",
            "Consider adding certifications relevant to your field"
          ],
          recommendedChallenges: [
            "Complete 3 technical projects this month",
            "Learn 2 new programming languages",
            "Attend 5 networking events",
            "Earn a professional certification"
          ]
        }
        
        // Update the resume analysis state
        setResumeAnalysis(dynamicResumeAnalysis)
        setOnboardingStep('score')
      }, 2000)
    }
  }

  const handleGoalSelection = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setOnboardingStep('activities')
  }

  const handleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }

  const handleActivitiesComplete = () => {
    setOnboardingStep('resume')
  }

  const handleResumeComplete = () => {
    setOnboardingStep('score')
  }

  const handleOnboardingComplete = () => {
    setIsNewUser(false)
    setOnboardingStep('complete')
  }

  const handleChallengeComplete = (challenge: any) => {
    setSelectedChallengeForVerification(challenge)
    setShowVerificationDialog(true)
  }

  const submitVerification = () => {
    if (selectedChallengeForVerification && verificationData) {
      // Complete the challenge
      completeChallenge(selectedChallengeForVerification.id, selectedChallengeForVerification.xp)
      
      // Reset verification state
      setShowVerificationDialog(false)
      setSelectedChallengeForVerification(null)
      setVerificationData('')
      setVerificationMethod('upload')
    }
  }

  const joinLeaderboard = (leaderboardId: string) => {
    if (!joinedLeaderboards.includes(leaderboardId)) {
      setJoinedLeaderboards([...joinedLeaderboards, leaderboardId])
    }
  }

  const leaveLeaderboard = (leaderboardId: string) => {
    setJoinedLeaderboards(joinedLeaderboards.filter(id => id !== leaderboardId))
  }

  const createLeaderboard = () => {
    if (newLeaderboardName && newLeaderboardDescription) {
      // Create new leaderboard logic would go here
      setShowCreateLeaderboard(false)
      setNewLeaderboardName('')
      setNewLeaderboardDescription('')
    }
  }

  const getCurrentLeaderboardData = () => {
    return leaderboardData[selectedLeaderboard as keyof typeof leaderboardData] || leaderboardData.global
  }



  const completeChallenge = (challengeId: number, xpReward: number) => {
    if (!completedChallenges.includes(challengeId)) {
      setCompletedChallenges([...completedChallenges, challengeId])
      setCurrentXP(prev => prev + xpReward)
      setCurrentScore(prev => prev + Math.floor(xpReward / 2))
      // Check for level up
      if (currentXP + xpReward >= nextLevelXP) {
        setCurrentLevel(prev => prev + 1)
      }
    }
  }

  const getCurrentChallenges = () => {
    if (!selectedCategory && createdGoals.length === 0) return []
    const category = selectedCategory || createdGoals[0]?.category || 'career'
    const baseChallenges = dailyChallenges[category as keyof typeof dailyChallenges] || dailyChallenges.career
    
    // Filter and customize challenges based on selected activities and user score
    const personalizedChallenges = baseChallenges.map(challenge => {
      // Adjust challenge based on selected activities
      if (selectedActivities.includes('coding') && challenge.title.includes('Code')) {
        return { ...challenge, xp: challenge.xp + 20, description: challenge.description + ' (Personalized for your coding focus)' }
      }
      if (selectedActivities.includes('networking') && challenge.title.includes('Network')) {
        return { ...challenge, xp: challenge.xp + 15, description: challenge.description + ' (Recommended based on your networking interests)' }
      }
      if (selectedActivities.includes('fitness') && challenge.title.includes('fitness')) {
        return { ...challenge, xp: challenge.xp + 10, description: challenge.description + ' (Great choice for your fitness goals!)' }
      }
      return challenge
    })

    // Add activity-specific challenges
    const activityChallenges = []
    if (selectedActivities.includes('coding') && !baseChallenges.some(c => c.title.includes('Code'))) {
      activityChallenges.push({
        id: 1000 + Math.random(),
        title: "Complete a Coding Project",
        description: "Build a small project using your preferred programming language",
        xp: 150,
        difficulty: "Medium",
        timeEstimate: "2 hours",
        completed: false,
        type: "daily"
      })
    }
    
    if (selectedActivities.includes('fitness') && !baseChallenges.some(c => c.title.toLowerCase().includes('fitness'))) {
      activityChallenges.push({
        id: 1001 + Math.random(),
        title: "30-Minute Workout",
        description: "Complete a focused fitness session to boost your energy",
        xp: 80,
        difficulty: "Easy",
        timeEstimate: "30 mins",
        completed: false,
        type: "daily"
      })
    }

    if (selectedActivities.includes('public-speaking') && !baseChallenges.some(c => c.title.toLowerCase().includes('speaking'))) {
      activityChallenges.push({
        id: 1002 + Math.random(),
        title: "Practice Public Speaking",
        description: "Record yourself giving a 5-minute presentation on any topic",
        xp: 120,
        difficulty: "Medium",
        timeEstimate: "45 mins",
        completed: false,
        type: "daily"
      })
    }

    return [...personalizedChallenges, ...activityChallenges]
  }

  return (
    <AppShell title="Goals & Challenges">
      {/* Enhanced User Progress Section */}
      <div className="px-4 py-8 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 max-w-7xl mx-auto gap-6">
          <div className="flex items-center">
            <div className="relative">
              <Avatar className="h-16 w-16 mr-4 border-2 border-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] interactive">
                <AvatarImage src="/placeholder.svg?height=150&width=150" />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">U</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-1.5 shadow-lg">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                Your Journey
              </h2>
              <div className="flex items-center mt-2 gap-4">
                <div className="flex items-center">
                  <LevelIndicator
                    level={currentLevel}
                    currentXP={currentXP}
                    nextLevelXP={nextLevelXP}
                    size="sm"
                    showProgress={false}
                  />
                  <span className="text-sm text-zinc-400 ml-3">Goal Crusher</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full p-1">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    <AnimatedCounter from={0} to={currentScore} duration={1.5} />
                  </span>
                  <span className="text-sm text-zinc-400">Score</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-800/60 border border-blue-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                <AnimatedCounter from={0} to={currentXP} duration={1.5} />
              </div>
              <div className="text-xs text-zinc-400">Total XP</div>
            </div>
            <div className="bg-zinc-800/60 border border-green-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                <AnimatedCounter from={0} to={completedChallenges.length} duration={1} />
              </div>
              <div className="text-xs text-zinc-400">Completed</div>
            </div>
            <div className="bg-zinc-800/60 border border-purple-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                8
              </div>
              <div className="text-xs text-zinc-400">Day Streak</div>
            </div>
            <div className="bg-zinc-800/60 border border-orange-700/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                #3
              </div>
              <div className="text-xs text-zinc-400">Rank</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300 font-medium">
              Level {currentLevel} Progress
            </span>
            <span className="text-zinc-400">
              <AnimatedCounter from={0} to={currentXP} duration={1.5} />/{nextLevelXP} XP
            </span>
          </div>
          <AnimatedProgress
            value={currentXP}
            max={nextLevelXP}
            className="h-3 bg-zinc-800/50 overflow-hidden relative rounded-full border border-blue-800/30"
            indicatorClassName="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_rgba(80,0,255,0.6)]"
            delay={0.5}
          />
        </div>
      </div>

      {/* New User Onboarding Flow */}
      {isNewUser && (
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <AnimatedSection delay={0.1}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-4">
                Welcome to EliteScore!
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Let's set up your personalized journey to success. We'll help you choose your goals, 
                select activities you enjoy, and analyze your current progress.
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8 px-4">
              <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
                {['goal', 'activities', 'resume', 'score', 'complete'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
                      onboardingStep === step 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-500"
                        : index < ['goal', 'activities', 'resume', 'score', 'complete'].indexOf(onboardingStep)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-zinc-700 text-zinc-400 border-zinc-600"
                    )}>
                      {index + 1}
                    </div>
                    {index < 4 && (
                      <div className={cn(
                        "w-8 sm:w-16 h-1 mx-1 sm:mx-2",
                        index < ['goal', 'activities', 'resume', 'score', 'complete'].indexOf(onboardingStep)
                          ? "bg-green-500"
                          : "bg-zinc-700"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Goal Selection */}
            {onboardingStep === 'goal' && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-2xl flex items-center">
                      <Target className="h-6 w-6 mr-3 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Choose Your Primary Goal
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Select the area you want to focus on most. You can always add more goals later.
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {goalCategories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <EnhancedCard
                            variant="default"
                            hover="lift"
                            className={`cursor-pointer transition-all duration-300 ${
                              selectedCategory === category.id
                                ? "border-blue-500/60 shadow-[0_0_32px_rgba(59,130,246,0.4)] scale-105"
                                : "border-zinc-700/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(80,0,255,0.2)]"
                            }`}
                            onClick={() => handleGoalSelection(category.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Select ${category.name} as your primary goal`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleGoalSelection(category.id)
                              }
                            }}
                          >
                            <EnhancedCardContent className="p-6">
                              <div className="space-y-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                                  <category.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                                  <p className="text-sm text-zinc-400 mb-4">{category.description}</p>
                                  <div className="space-y-2">
                                    <div className="text-xs text-zinc-500 font-medium">Key Skills:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {category.skills.slice(0, 2).map((skill) => (
                                        <Badge
                                          key={skill}
                                          className="bg-zinc-800/60 text-zinc-300 border-zinc-600/40 text-xs"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </motion.div>
                      ))}
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Step 2: Activity Selection */}
            {onboardingStep === 'activities' && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-2xl flex items-center">
                      <Sparkles className="h-6 w-6 mr-3 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Select Activities You Enjoy
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Choose activities that interest you. We'll create personalized challenges based on your preferences.
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {activityPreferences.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <EnhancedCard
                            variant={selectedActivities.includes(activity.id) ? "gradient" : "default"}
                            hover="lift"
                            className={`cursor-pointer transition-all duration-300 ${
                              selectedActivities.includes(activity.id)
                                ? "border-blue-500/60 shadow-[0_0_32px_rgba(59,130,246,0.4)] scale-105"
                                : "border-zinc-700/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(80,0,255,0.2)]"
                            }`}
                            onClick={() => handleActivitySelection(activity.id)}
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={selectedActivities.includes(activity.id)}
                            aria-label={`${selectedActivities.includes(activity.id) ? 'Deselect' : 'Select'} ${activity.name} activity`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleActivitySelection(activity.id)
                              }
                            }}
                          >
                            <EnhancedCardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${goalCategories.find(c => c.id === activity.category)?.gradient || 'from-blue-500 to-purple-500'} flex items-center justify-center`}>
                                  <activity.icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white text-sm">{activity.name}</h4>
                                  <p className="text-xs text-zinc-400">{activity.description}</p>
                                </div>
                                {selectedActivities.includes(activity.id) && (
                                  <CheckCircle className="h-5 w-5 text-blue-400" />
                                )}
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 text-center">
                      <EnhancedButton
                        variant="gradient"
                        size="lg"
                        rounded="full"
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                        onClick={handleActivitiesComplete}
                        disabled={selectedActivities.length === 0}
                      >
                        Continue with {selectedActivities.length} Activities
                      </EnhancedButton>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Step 3: Resume Upload */}
            {onboardingStep === 'resume' && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-2xl flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Upload Your Resume
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Get your personalized score and insights. We'll analyze your current progress and suggest improvements.
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="text-center space-y-6">
                      <div className="bg-zinc-800/60 border-2 border-dashed border-blue-500/40 rounded-xl p-8">
                        <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Upload Your Resume</h3>
                        <p className="text-zinc-400 mb-4">
                          Drag and drop your resume here, or click to browse
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <EnhancedButton
                            variant="outline"
                            size="lg"
                            rounded="full"
                            className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:border-blue-500/50 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-5 w-5 mr-2" />
                            Choose File
                          </EnhancedButton>
                          <EnhancedButton
                            variant="gradient"
                            size="lg"
                            rounded="full"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_0_8px_0_rgba(34,197,94,0.4)]"
                            onClick={() => {
                              // Simulate demo resume upload
                              setResumeUploaded(true)
                              setTimeout(() => {
                                setShowAnalysis(true)
                                const demoScore = Math.floor(Math.random() * 40) + 60 // Random demo score 60-100
                                setUserScore(demoScore)
                                
                                // Generate demo resume analysis data
                                const demoResumeAnalysis = {
                                  overallScore: demoScore,
                                  sections: [
                                    { 
                                      name: "Experience", 
                                      score: Math.floor(Math.random() * 30) + 70, 
                                      feedback: "Strong technical background with progressive responsibilities" 
                                    },
                                    { 
                                      name: "Skills", 
                                      score: Math.floor(Math.random() * 30) + 65, 
                                      feedback: "Consider adding more in-demand technologies" 
                                    },
                                    { 
                                      name: "Education", 
                                      score: Math.floor(Math.random() * 30) + 75, 
                                      feedback: "Solid academic foundation" 
                                    },
                                    { 
                                      name: "Projects", 
                                      score: Math.floor(Math.random() * 30) + 60, 
                                      feedback: "Good project portfolio, could use more variety" 
                                    }
                                  ],
                                  suggestions: [
                                    "Add more quantifiable achievements to your experience section",
                                    "Include specific technologies and tools you've used",
                                    "Highlight leadership and teamwork experiences",
                                    "Consider adding certifications relevant to your field"
                                  ],
                                  recommendedChallenges: [
                                    "Complete 3 technical projects this month",
                                    "Learn 2 new programming languages",
                                    "Attend 5 networking events",
                                    "Earn a professional certification"
                                  ]
                                }
                                
                                setResumeAnalysis(demoResumeAnalysis)
                                setOnboardingStep('score')
                              }, 2000)
                            }}
                          >
                            <Star className="h-5 w-5 mr-2" />
                            Use Demo Resume
                          </EnhancedButton>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3 text-center">
                          Don't have a resume yet? Try our demo to see how the scoring works!
                        </p>
                      </div>
                      
                      {resumeUploaded && !showAnalysis && (
                        <div className="text-center py-8">
                          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          <p className="text-zinc-400">Analyzing your resume...</p>
                        </div>
                      )}
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}

            {/* Step 4: Score & Insights */}
            {onboardingStep === 'score' && userScore && (
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_32px_0_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-2xl flex items-center">
                      <Trophy className="h-6 w-6 mr-3 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Your EliteScore: {userScore}
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Here's your current progress and personalized insights
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Score Breakdown */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Score Breakdown</h3>
                        {resumeAnalysis.sections.map((section, index) => (
                          <div key={section.name} className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-white">{section.name}</span>
                              <span className="text-sm font-bold text-blue-400">{section.score}/100</span>
                            </div>
                            <AnimatedProgress
                              value={section.score}
                              max={100}
                              className="h-2 bg-zinc-700 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500"
                              delay={0.5 + index * 0.1}
                            />
                            <p className="text-xs text-zinc-400 mt-2">{section.feedback}</p>
                          </div>
                        ))}
                      </div>

                      {/* Key Insights */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Key Insights</h3>
                        <div className="space-y-3">
                          {resumeAnalysis.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-sm text-zinc-300">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-md font-bold text-white mb-3">Recommended Challenges</h4>
                          <div className="space-y-2">
                            {resumeAnalysis.recommendedChallenges.map((challenge, index) => (
                              <div key={index} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3">
                                <p className="text-sm text-zinc-300">{challenge}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <EnhancedButton
                        variant="gradient"
                        size="lg"
                        rounded="full"
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                        onClick={handleOnboardingComplete}
                      >
                        Start My Journey
                      </EnhancedButton>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            )}
          </AnimatedSection>
        </div>
      )}

      {/* Navigation Tabs - Only show for existing users */}
      {!isNewUser && (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900/80 border border-blue-700/40 rounded-xl p-1 mb-8 shadow-[0_0_20px_rgba(80,0,255,0.2)] grid grid-cols-4 w-full">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(80,0,255,0.4)] rounded-lg transition-all duration-300"
            >
              <Target className="h-4 w-4 mr-2" />
              Set Goals
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(80,0,255,0.4)] rounded-lg transition-all duration-300"
            >
              <Zap className="h-4 w-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(80,0,255,0.4)] rounded-lg transition-all duration-300"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(80,0,255,0.4)] rounded-lg transition-all duration-300"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Goal Setting */}
          <TabsContent value="overview" className="space-y-8">
            {/* Resume Analysis Section */}
            <AnimatedSection delay={0.2}>
              <EnhancedCard variant="gradient" hover="lift" animation="fadeIn" className="overflow-hidden border border-blue-700/40 shadow-[0_0_32px_rgba(80,0,255,0.2)]">
                <EnhancedCardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <EnhancedCardTitle className="text-2xl flex items-center">
                        <FileText className="h-6 w-6 mr-3 text-blue-400" />
                        <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                          Resume Analysis & Goal Setting
                        </span>
                      </EnhancedCardTitle>
                      <EnhancedCardDescription className="text-zinc-400 mt-2">
                        Upload your resume to get AI-powered insights and personalized goal recommendations
                      </EnhancedCardDescription>
                    </div>
                    {resumeUploaded && (
                      <Badge className="bg-green-900/30 text-green-400 border-green-700/40 px-3 py-1">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Analyzed
                      </Badge>
                    )}
                  </div>
                </EnhancedCardHeader>
                
                <EnhancedCardContent className="space-y-6">
                  {!resumeUploaded ? (
                    <div 
                      className="border-2 border-dashed border-blue-700/40 rounded-xl p-8 text-center hover:border-blue-500/60 hover:bg-zinc-800/30 transition-all duration-300 cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="bg-blue-900/30 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Upload Your Resume</h3>
                      <p className="text-zinc-400 mb-4">
                        Get instant analysis and personalized improvement suggestions
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
                        <span>PDF, DOC, or DOCX</span>
                        <span>•</span>
                        <span>Max 5MB</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  ) : showAnalysis ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      {/* Resume Score */}
                      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/40 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">Resume Score</h3>
                          <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            <AnimatedCounter from={0} to={userScore || resumeAnalysis.overallScore} duration={2} />%
                          </div>
                        </div>
                        <AnimatedProgress
                          value={userScore || resumeAnalysis.overallScore}
                          max={100}
                          className="h-3 bg-zinc-800/50"
                          indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
                          delay={1}
                        />
                      </div>

                      {/* AI Recommendations for Challenges */}
                      <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                          <Brain className="h-5 w-5 mr-2 text-purple-400" />
                          Recommended Challenges Based on Your Resume
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resumeAnalysis.recommendedChallenges.map((challenge, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 2 + index * 0.1 }}
                              className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/30 hover:border-purple-500/50 transition-all duration-300"
                            >
                              <div className="bg-purple-900/30 p-2 rounded-full">
                                <Target className="h-4 w-4 text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-zinc-300">{challenge}</p>
                                <Badge className="mt-2 bg-purple-900/30 text-purple-400 border-purple-700/40 text-xs">
                                  +200 XP
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-zinc-400">Analyzing your resume...</p>
                    </div>
                  )}
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Goal Categories Grid */}
            <AnimatedSection delay={0.4}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent flex items-center">
                  <Target className="h-6 w-6 mr-3 text-blue-400" />
                  Choose Your Focus Area
                </h2>
                {selectedCategory && (
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    rounded="full"
                    className="text-zinc-400 hover:text-white border-zinc-600 hover:border-blue-500/50"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Clear Selection
                  </EnhancedButton>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goalCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  >
                    <EnhancedCard
                      variant={selectedCategory === category.id ? "gradient" : "default"}
                      hover="lift"
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedCategory === category.id
                          ? "border-blue-500/60 shadow-[0_0_32px_rgba(59,130,246,0.4)] scale-105"
                          : "border-zinc-700/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(80,0,255,0.2)]"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <EnhancedCardContent className="p-6">
                        <div className="space-y-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                            <category.icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                            <p className="text-sm text-zinc-400 mb-4">{category.description}</p>
                            <div className="space-y-2">
                              <div className="text-xs text-zinc-500 font-medium">Target Roles:</div>
                              <div className="flex flex-wrap gap-1">
                                {category.targetRoles.slice(0, 2).map((role) => (
                                  <Badge
                                    key={role}
                                    className="bg-zinc-800/60 text-zinc-300 border-zinc-600/40 text-xs"
                                  >
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>

            {/* Goal Information */}
              {selectedCategory && (
              <AnimatedSection delay={0.4}>
                    <EnhancedCard variant="gradient" hover="glow" className="border border-blue-700/40 shadow-[0_0_24px_rgba(80,0,255,0.3)]">
                      <EnhancedCardHeader>
                        <EnhancedCardTitle className="text-xl flex items-center">
                      {(() => {
                        const category = goalCategories.find(c => c.id === selectedCategory);
                        const IconComponent = category?.icon;
                        return IconComponent ? (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center mr-3`}>
                            <IconComponent className="h-4 w-4 text-white" />
                            </div>
                        ) : null;
                      })()}
                          <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Your {goalCategories.find(c => c.id === selectedCategory)?.name} Journey
                          </span>
                        </EnhancedCardTitle>
                        <EnhancedCardDescription className="text-zinc-400">
                      You've chosen to focus on {goalCategories.find(c => c.id === selectedCategory)?.name.toLowerCase()}. Here's your personalized path to success.
                        </EnhancedCardDescription>
                      </EnhancedCardHeader>
                  <EnhancedCardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                        <h4 className="font-semibold text-white">Recommended Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {goalCategories.find(c => c.id === selectedCategory)?.skills.map((skill) => (
                            <Badge
                              key={skill}
                              className="bg-blue-900/30 text-blue-400 border-blue-700/40"
                            >
                              {skill}
                            </Badge>
                          ))}
                            </div>
                            </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-white">Target Roles</h4>
                        <div className="flex flex-wrap gap-2">
                          {goalCategories.find(c => c.id === selectedCategory)?.targetRoles.map((role) => (
                            <Badge
                              key={role}
                              className="bg-purple-900/30 text-purple-400 border-purple-700/40"
                            >
                              {role}
                            </Badge>
                          ))}
                          </div>
                          </div>
                        </div>
                      </EnhancedCardContent>
                      <EnhancedCardFooter>
                        <EnhancedButton
                          variant="gradient"
                          rounded="full"
                          animation="shimmer"
                          className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_20px_rgba(80,0,255,0.4)]"
                          rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => setActiveTab("challenges")}
                        >
                      Start Daily Challenges
                        </EnhancedButton>
                      </EnhancedCardFooter>
                    </EnhancedCard>
                  </AnimatedSection>
              )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Challenges */}
              <AnimatedSection delay={0.2}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_24px_rgba(80,0,255,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-xl flex items-center">
                      <Zap className="h-5 w-5 mr-3 text-blue-400" />
                      <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                        Daily Challenges
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Complete these to earn XP and improve your score
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="space-y-4">
                    {getCurrentChallenges().map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          completedChallenges.includes(challenge.id)
                            ? "bg-green-900/20 border-green-700/40"
                            : "bg-zinc-800/50 border-zinc-700/50 hover:border-blue-500/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-medium ${
                                completedChallenges.includes(challenge.id) ? "text-green-400 line-through" : "text-white"
                              }`}>
                                {challenge.title}
                              </h4>
                              <Badge className={`text-xs ${
                                challenge.difficulty === "Easy" ? "bg-green-900/30 text-green-400" :
                                challenge.difficulty === "Medium" ? "bg-yellow-900/30 text-yellow-400" :
                                "bg-red-900/30 text-red-400"
                              }`}>
                                {challenge.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400 mb-2">{challenge.description}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {challenge.timeEstimate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                +{challenge.xp} XP
                              </span>
                            </div>
                          </div>
                          <EnhancedButton
                            variant={completedChallenges.includes(challenge.id) ? "outline" : "gradient"}
                            size="sm"
                            rounded="full"
                            className={
                              completedChallenges.includes(challenge.id)
                                ? "bg-green-900/20 border-green-700/40 text-green-400"
                                : "bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_8px_rgba(80,0,255,0.4)]"
                            }
                            onClick={() => handleChallengeComplete(challenge)}
                            disabled={completedChallenges.includes(challenge.id)}
                          >
                            {completedChallenges.includes(challenge.id) ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <PlayCircle className="h-4 w-4" />
                            )}
                          </EnhancedButton>
                        </div>
                      </motion.div>
                    ))}
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>

              {/* Monthly Challenges */}
              <AnimatedSection delay={0.4}>
                <EnhancedCard variant="gradient" hover="lift" className="border border-purple-700/40 shadow-[0_0_24px_rgba(147,51,234,0.3)]">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-xl flex items-center">
                      <Trophy className="h-5 w-5 mr-3 text-purple-400" />
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-extrabold">
                        Monthly Projects
                      </span>
                    </EnhancedCardTitle>
                    <EnhancedCardDescription className="text-zinc-400">
                      Long-term challenges for significant skill growth
                    </EnhancedCardDescription>
                  </EnhancedCardHeader>
                  <EnhancedCardContent className="space-y-4">
                    {monthlyChallenges.map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg border bg-zinc-800/50 border-zinc-700/50 hover:border-purple-500/50 transition-all duration-300"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white mb-1">{challenge.title}</h4>
                              <p className="text-sm text-zinc-400 mb-2">{challenge.description}</p>
                              <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due {new Date(challenge.deadline).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  +{challenge.xp} XP
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-purple-900/30 text-purple-400 border-purple-700/40">
                              {challenge.progress}%
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-400">Progress</span>
                              <span className="text-purple-400">{challenge.progress}%</span>
                            </div>
                            <Progress
                              value={challenge.progress}
                              className="h-2"
                              indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            </div>
          </TabsContent>

          {/* Progress Tab - Personalized Analytics */}
          <TabsContent value="progress" className="space-y-8">
            <AnimatedSection delay={0.1}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent mb-2">
                  Your Personal Analytics
                </h2>
                <p className="text-zinc-400">Discover what works best for you and optimize your growth</p>
              </div>
            </AnimatedSection>

            {/* Performance Overview */}
              <AnimatedSection delay={0.2}>
              <EnhancedCard variant="gradient" hover="lift" className="border border-blue-700/40 shadow-[0_0_32px_rgba(80,0,255,0.3)]">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl flex items-center">
                    <BarChart3 className="h-5 w-5 mr-3 text-blue-400" />
                    <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                      Performance Overview
                    </span>
                  </EnhancedCardTitle>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-zinc-800/60 border border-green-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Best Performance Time</span>
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-green-400">6-8 PM</div>
                      <p className="text-xs text-zinc-500">85% completion rate</p>
                    </div>
                    
                    <div className="bg-zinc-800/60 border border-blue-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Preferred Activity Type</span>
                        <Code className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-400">Coding</div>
                      <p className="text-xs text-zinc-500">78% of completed challenges</p>
                    </div>
                    
                    <div className="bg-zinc-800/60 border border-purple-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Peak Streak</span>
                        <Flame className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-purple-400">15 Days</div>
                      <p className="text-xs text-zinc-500">Last month</p>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Activity Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AnimatedSection delay={0.3}>
                <EnhancedCard variant="default" hover="lift" className="border border-zinc-700/40">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <Award className="h-5 w-5 mr-3 text-yellow-400" />
                      What Works Best For You
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Code className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Programming Challenges</div>
                            <div className="text-xs text-zinc-400">Completed consistently</div>
                          </div>
                        </div>
                        <div className="text-green-400 font-bold">95%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Evening Sessions</div>
                            <div className="text-xs text-zinc-400">Peak focus time</div>
                          </div>
                        </div>
                        <div className="text-blue-400 font-bold">85%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Group Activities</div>
                            <div className="text-xs text-zinc-400">Social motivation</div>
                          </div>
                        </div>
                        <div className="text-purple-400 font-bold">78%</div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <EnhancedCard variant="default" hover="lift" className="border border-zinc-700/40">
                  <EnhancedCardHeader>
                    <EnhancedCardTitle className="text-lg flex items-center">
                      <TrendingDown className="h-5 w-5 mr-3 text-red-400" />
                      Areas for Improvement
                    </EnhancedCardTitle>
                  </EnhancedCardHeader>
                  <EnhancedCardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Reading Challenges</div>
                            <div className="text-xs text-zinc-400">Try shorter sessions</div>
                          </div>
                        </div>
                        <div className="text-red-400 font-bold">45%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-orange-900/20 border border-orange-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Morning Sessions</div>
                            <div className="text-xs text-zinc-400">Low engagement</div>
                          </div>
                        </div>
                        <div className="text-orange-400 font-bold">35%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Heart className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Fitness Activities</div>
                            <div className="text-xs text-zinc-400">Irregular completion</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 font-bold">52%</div>
                      </div>
                    </div>
                  </EnhancedCardContent>
                </EnhancedCard>
              </AnimatedSection>
            </div>

            {/* Recommendations */}
            <AnimatedSection delay={0.5}>
              <EnhancedCard variant="gradient" hover="lift" className="border border-green-700/40 shadow-[0_0_24px_rgba(34,197,94,0.2)]">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl flex items-center">
                    <Sparkles className="h-5 w-5 mr-3 text-green-400" />
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-extrabold">
                      Personalized Recommendations
                    </span>
                  </EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                    Based on your performance patterns, here's how to optimize your growth
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                        Double Down On
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Schedule more coding challenges in evenings
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Join group coding sessions for motivation
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Set up 6-8 PM dedicated learning time
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-400" />
                        Try This Week
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Break reading into 15-minute chunks
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Try afternoon fitness instead of morning
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Use audio content for commute learning
                        </div>
                      </div>
                    </div>
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>

            {/* Active Goals */}
            {createdGoals.length > 0 && (
              <AnimatedSection delay={0.6}>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent flex items-center">
                    <Target className="h-5 w-5 mr-3 text-blue-400" />
                    Active Goals Progress
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {createdGoals.map((goal, index) => (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <EnhancedCard variant="default" hover="lift" className="border border-zinc-700/40 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(80,0,255,0.2)]">
                          <EnhancedCardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${goalCategories.find(c => c.id === goal.category)?.gradient} flex items-center justify-center shadow-lg`}>
                                    {(() => {
                                      const category = goalCategories.find(c => c.id === goal.category);
                                      const IconComponent = category?.icon;
                                      return IconComponent ? <IconComponent className="h-6 w-6 text-white" /> : null;
                                    })()}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                                    <p className="text-sm text-blue-400">{goal.targetRole}</p>
                                    <p className="text-xs text-zinc-400">Created {goal.created}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    {currentScore}
                                  </div>
                                  <div className="text-xs text-zinc-400">Current Score</div>
                                </div>
                              </div>
                              
                              {goal.description && (
                                <p className="text-sm text-zinc-400">{goal.description}</p>
                              )}
                              
                              {goal.deadline && (
                                <div className="flex items-center text-sm text-zinc-500">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Target: {new Date(goal.deadline).toLocaleDateString()}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-3 gap-4 pt-4">
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  className="text-zinc-400 hover:text-white border-zinc-600 hover:border-blue-500/50"
                                  leftIcon={<BarChart2 className="h-3 w-3" />}
                                  onClick={() => setActiveTab("challenges")}
                                >
                                  Track
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  className="text-zinc-400 hover:text-white border-zinc-600 hover:border-purple-500/50"
                                  leftIcon={<Zap className="h-3 w-3" />}
                                  onClick={() => setActiveTab("challenges")}
                                >
                                  Challenges
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  rounded="full"
                                  className="text-zinc-400 hover:text-white border-zinc-600 hover:border-green-500/50"
                                  leftIcon={<Share2 className="h-3 w-3" />}
                                >
                                  Share
                                </EnhancedButton>
                              </div>
                            </div>
                          </EnhancedCardContent>
                        </EnhancedCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-8">
            {/* Leaderboard Selection */}
            <AnimatedSection delay={0.1}>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label className="text-sm text-zinc-300 mb-2 block">Select Leaderboard</Label>
                  <select
                    value={selectedLeaderboard}
                    onChange={(e) => setSelectedLeaderboard(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 focus:border-blue-500 focus:outline-none"
                  >
                    {availableLeaderboards
                      .filter(board => joinedLeaderboards.includes(board.id))
                      .map(board => (
                        <option key={board.id} value={board.id}>
                          {board.name} ({board.memberCount} members)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateLeaderboard(true)}
                    className="border-blue-700/40 text-blue-400 hover:border-blue-500/50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </EnhancedButton>
                </div>
              </div>
            </AnimatedSection>

            {/* Current Leaderboard */}
            <AnimatedSection delay={0.2}>
              <EnhancedCard variant="gradient" hover="lift" className="border border-yellow-700/40 shadow-[0_0_24px_rgba(234,179,8,0.3)]">
                <EnhancedCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <EnhancedCardTitle className="text-2xl flex items-center">
                    <Crown className="h-6 w-6 mr-3 text-yellow-400" />
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-extrabold">
                          {availableLeaderboards.find(b => b.id === selectedLeaderboard)?.name || 'Leaderboard'}
                    </span>
                  </EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                        {availableLeaderboards.find(b => b.id === selectedLeaderboard)?.description}
                  </EnhancedCardDescription>
                    </div>
                    <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-700/40">
                      {availableLeaderboards.find(b => b.id === selectedLeaderboard)?.memberCount} members
                    </Badge>
                  </div>
                </EnhancedCardHeader>
                <EnhancedCardContent className="space-y-4">
                  {getCurrentLeaderboardData().map((peer, index) => (
                    <motion.div
                      key={peer.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 rounded-lg transition-all duration-300 ${
                        peer.name === "You" 
                          ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-2 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                          : "bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" :
                            index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-600 text-white" :
                            index === 2 ? "bg-gradient-to-r from-orange-600 to-yellow-600 text-white" :
                            "bg-zinc-700 text-zinc-300"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className={`font-bold ${peer.name === "You" ? "text-blue-400" : "text-white"}`}>
                              {peer.name}
                            </h4>
                            <p className="text-sm text-zinc-400">{peer.goal}</p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {peer.streak} day streak
                              </span>
                              <span>Level {peer.level}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            {peer.score}
                          </div>
                          <div className="text-xs text-zinc-400">{peer.xp} XP</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </EnhancedCardContent>
                <EnhancedCardFooter>
                  <EnhancedButton
                    variant="gradient"
                    rounded="full"
                    animation="shimmer"
                    className="w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                    leftIcon={<Users className="h-4 w-4" />}
                  >
                    Join Study Group
                  </EnhancedButton>
                </EnhancedCardFooter>
              </EnhancedCard>
            </AnimatedSection>

            {/* Available Leaderboards */}
            <AnimatedSection delay={0.4}>
              <EnhancedCard variant="default" hover="lift" className="border border-zinc-700/40">
                <EnhancedCardHeader>
                  <EnhancedCardTitle className="text-xl flex items-center">
                    <Trophy className="h-5 w-5 mr-3 text-purple-400" />
                    Browse & Join Leaderboards
                  </EnhancedCardTitle>
                  <EnhancedCardDescription className="text-zinc-400">
                    Discover new communities to compete with
                  </EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableLeaderboards
                      .filter(board => !joinedLeaderboards.includes(board.id))
                      .map((board, index) => (
                        <motion.div
                          key={board.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 hover:border-zinc-600/50 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-white">{board.name}</h4>
                                <p className="text-sm text-zinc-400 mt-1">{board.description}</p>
                              </div>
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  board.category === 'career' ? "bg-blue-900/30 text-blue-400 border-blue-700/40" :
                                  board.category === 'education' ? "bg-green-900/30 text-green-400 border-green-700/40" :
                                  board.category === 'learning' ? "bg-purple-900/30 text-purple-400 border-purple-700/40" :
                                  "bg-zinc-800/60 text-zinc-400 border-zinc-600/40"
                                )}
                              >
                                {board.category}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {board.memberCount} members
                              </span>
                              <EnhancedButton
                                variant="outline"
                                size="sm"
                                onClick={() => joinLeaderboard(board.id)}
                                className="text-blue-400 border-blue-700/40 hover:border-blue-500/50 text-xs"
                              >
                                Join
                              </EnhancedButton>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                  
                  {availableLeaderboards.filter(board => !joinedLeaderboards.includes(board.id)).length === 0 && (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">You've joined all available leaderboards!</p>
                      <p className="text-sm text-zinc-500 mt-1">Create your own to start a new competition</p>
                    </div>
                  )}
                </EnhancedCardContent>
              </EnhancedCard>
            </AnimatedSection>
          </TabsContent>
        </Tabs>
      </div>
      )}

      {/* Challenge Verification Dialog */}
      {showVerificationDialog && selectedChallengeForVerification && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="verification-dialog-title" className="text-lg font-bold text-white">Verify Challenge Completion</h3>
              <button
                onClick={() => setShowVerificationDialog(false)}
                className="text-zinc-400 hover:text-white"
                aria-label="Close verification dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-white mb-2">{selectedChallengeForVerification.title}</h4>
              <p className="text-sm text-zinc-400">{selectedChallengeForVerification.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-zinc-300 mb-2 block">Verification Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setVerificationMethod('upload')}
                    className={cn(
                      "p-2 rounded-lg border text-xs font-medium transition-all",
                      verificationMethod === 'upload'
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    📁 Upload
                  </button>
                  <button
                    onClick={() => setVerificationMethod('link')}
                    className={cn(
                      "p-2 rounded-lg border text-xs font-medium transition-all",
                      verificationMethod === 'link'
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    🔗 Link
                  </button>
                  <button
                    onClick={() => setVerificationMethod('text')}
                    className={cn(
                      "p-2 rounded-lg border text-xs font-medium transition-all",
                      verificationMethod === 'text'
                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    📝 Text
                  </button>
                </div>
              </div>

              <div>
                {verificationMethod === 'upload' && (
                  <div>
                    <Label className="text-sm text-zinc-300 mb-2 block">Upload Proof</Label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-sm"
                      onChange={(e) => setVerificationData(e.target.files?.[0]?.name || '')}
                    />
                  </div>
                )}
                
                {verificationMethod === 'link' && (
                  <div>
                    <Label className="text-sm text-zinc-300 mb-2 block">Share Link</Label>
                    <Input
                      placeholder="https://example.com/proof"
                      value={verificationData}
                      onChange={(e) => setVerificationData(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-zinc-300"
                    />
                  </div>
                )}
                
                {verificationMethod === 'text' && (
                  <div>
                    <Label className="text-sm text-zinc-300 mb-2 block">Describe Your Progress</Label>
                    <Textarea
                      placeholder="Explain how you completed this challenge..."
                      value={verificationData}
                      onChange={(e) => setVerificationData(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-zinc-300 min-h-[80px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setShowVerificationDialog(false)}
                className="flex-1"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                size="sm"
                onClick={submitVerification}
                disabled={!verificationData}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Submit & Earn +{selectedChallengeForVerification.xp} XP
              </EnhancedButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Leaderboard Dialog */}
      {showCreateLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create New Leaderboard</h3>
              <button
                onClick={() => setShowCreateLeaderboard(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-zinc-300 mb-2 block">Leaderboard Name</Label>
                <Input
                  placeholder="e.g., CS Students at Stanford"
                  value={newLeaderboardName}
                  onChange={(e) => setNewLeaderboardName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-300"
                />
              </div>
              
              <div>
                <Label className="text-sm text-zinc-300 mb-2 block">Description</Label>
                <Textarea
                  placeholder="Describe who can join and what this leaderboard is for..."
                  value={newLeaderboardDescription}
                  onChange={(e) => setNewLeaderboardDescription(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-300 min-h-[80px]"
                />
              </div>

              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Leaderboard Features</span>
                </div>
                <div className="space-y-1 text-xs text-zinc-400">
                  <div>• Real-time score tracking</div>
                  <div>• Weekly and monthly rankings</div>
                  <div>• Custom challenges for members</div>
                  <div>• Group discussions and study sessions</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setShowCreateLeaderboard(false)}
                className="flex-1"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="gradient"
                size="sm"
                onClick={createLeaderboard}
                disabled={!newLeaderboardName || !newLeaderboardDescription}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Create Leaderboard
              </EnhancedButton>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  )
}
