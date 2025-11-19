import {
  Briefcase,
  BookOpen,
  DollarSign,
  Sparkles,
  Rocket,
  Code,
  Palette,
  BarChart2,
  Users,
  MessageCircle,
  Heart,
  Brain,
  TrendingUp,
  Globe,
  Mic,
  Award,
  Flame,
} from "lucide-react"

// Goal categories
export const goalCategories = [
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
export const activityPreferences = [
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
export const dailyChallenges = [
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
export const monthlyChallenges = [
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
export const achievements = [
  { id: 1, name: "Code Master", icon: Code, earned: true, rarity: "epic" },
  { id: 2, name: "Streak Legend", icon: Flame, earned: true, rarity: "legendary" },
  { id: 3, name: "Social Butterfly", icon: Users, earned: true, rarity: "rare" },
  { id: 4, name: "Project Guru", icon: Rocket, earned: false, rarity: "epic" },
  { id: 5, name: "Elite Learner", icon: BookOpen, earned: false, rarity: "legendary" },
]

// Leaderboard preview
export const leaderboardPreview = [
  { rank: 1, name: "Sarah Chen", xp: 15420, avatar: null, badge: "👑" },
  { rank: 2, name: "Michael Park", xp: 14230, avatar: null, badge: "🥈" },
  { rank: 3, name: "You", xp: 12840, avatar: null, badge: "🥉" },
  { rank: 4, name: "Emily Rodriguez", xp: 11560, avatar: null, badge: "" },
  { rank: 5, name: "David Kim", xp: 10890, avatar: null, badge: "" },
]

