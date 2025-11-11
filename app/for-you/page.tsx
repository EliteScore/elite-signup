"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  MessageCircle,
  Trophy,
  Users,
  Award,
  Bell,
  Pin,
  Calendar,
  Clock,
  ChevronRight,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Zap,
  CheckCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Settings,
  ChevronDown,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data for communities
const communities = [
  {
    id: 1,
    name: "Software Engineers Elite",
    description: "A community for passionate software developers pushing the boundaries of technology",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop",
    members: 12547,
    joined: true,
    rank: 1,
    trending: true,
    category: "Technology",
    announcements: [
  {
    id: 1,
        title: "Q1 2024 Coding Challenge Results",
        content: "Congratulations to all participants! Top 10 winners will receive exclusive mentorship sessions.",
        timestamp: "2 hours ago",
        priority: "high",
        pinned: true,
        type: "achievement"
  },
  {
    id: 2,
        title: "New AI/ML Study Group Starting",
        content: "Join our weekly study sessions focusing on advanced machine learning concepts. Starting next Monday.",
        timestamp: "1 day ago",
        priority: "medium",
        pinned: false,
        type: "event"
  },
  {
    id: 3,
        title: "Community Guidelines Updated",
        content: "Please review the updated community guidelines to ensure a positive environment for all members.",
        timestamp: "3 days ago",
        priority: "low",
        pinned: false,
        type: "info"
      }
    ],
    leaderboard: [
      { id: 1, name: "Alex Rodriguez", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", points: 2847, badges: 12, rank: 1, streak: 45, contributions: 156 },
      { id: 2, name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces", points: 2634, badges: 10, rank: 2, streak: 32, contributions: 142 },
      { id: 3, name: "Marcus Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", points: 2421, badges: 9, rank: 3, streak: 28, contributions: 134 },
      { id: 4, name: "Elena Vasquez", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces", points: 2198, badges: 8, rank: 4, streak: 24, contributions: 118 },
      { id: 5, name: "David Kim", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces", points: 1987, badges: 7, rank: 5, streak: 21, contributions: 102 },
    ],
    membersList: [
      { id: 1, name: "Alex Rodriguez", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", title: "Senior Software Engineer", company: "Google", joined: "2 years ago", isOnline: true, achievements: ["Top Contributor", "Mentor"] },
      { id: 2, name: "Sarah Chen", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces", title: "Full Stack Developer", company: "Microsoft", joined: "1 year ago", isOnline: true, achievements: ["Innovation Award"] },
      { id: 3, name: "Marcus Johnson", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", title: "Tech Lead", company: "Amazon", joined: "3 years ago", isOnline: false, achievements: ["Leadership", "Top Performer"] },
    ],
    stats: {
      totalMembers: 12547,
      activeToday: 1847,
      weeklyGrowth: 8.5,
      monthlyActivity: 94.2
    }
  },
  {
    id: 2,
    name: "Product Managers United",
    description: "Strategic thinking and product excellence for the next generation of product leaders",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=150&fit=crop",
    members: 8934,
    joined: true,
    rank: 2,
    trending: false,
    category: "Product",
    announcements: [
      {
        id: 1,
        title: "Product Strategy Workshop",
        content: "Join us for an intensive workshop on modern product strategy frameworks. Limited seats available.",
        timestamp: "4 hours ago",
        priority: "high",
        pinned: true,
        type: "event"
      }
    ],
    leaderboard: [
      { id: 1, name: "Jessica Taylor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces", points: 1987, badges: 8, rank: 1, streak: 35, contributions: 89 },
      { id: 2, name: "Michael Brown", image: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=faces", points: 1743, badges: 6, rank: 2, streak: 28, contributions: 76 },
    ],
    membersList: [
      { id: 1, name: "Jessica Taylor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces", title: "Senior Product Manager", company: "Uber", joined: "1 year ago", isOnline: true, achievements: ["Strategy Expert"] },
    ],
    stats: {
      totalMembers: 8934,
      activeToday: 1234,
      weeklyGrowth: 6.2,
      monthlyActivity: 87.5
    }
  }
]

export default function ForYouPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const router = useRouter()

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(1)
  const [activeTab, setActiveTab] = useState('announcements')
  const [searchQuery, setSearchQuery] = useState('')
  
  const community = communities.find((c) => c.id === selectedCommunity) || communities[0] || null

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen bg-black text-white relative overflow-x-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/40 via-purple-700/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/40 via-pink-600/30 to-transparent rounded-full blur-3xl" />
        </div>
        
        {/* Main Content - Full Width */}
        <div className="relative z-10 w-full">
          {/* Community Selector Bar */}
          <div className="bg-zinc-900/80 border-b border-blue-700/40 backdrop-blur-lg sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={selectedCommunity?.toString()} onValueChange={(value) => setSelectedCommunity(Number(value))}>
                    <SelectTrigger className="w-[280px] bg-zinc-800/80 border-blue-700/40 text-white">
                      <SelectValue placeholder="Select a community" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-blue-700/40">
                      {communities.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="text-white hover:bg-zinc-800">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={c.image} />
                              <AvatarFallback className="bg-zinc-800 text-xs">{c.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{c.name}</span>
                            {c.trending && <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px] ml-2">Hot</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <EnhancedButton
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Join New Community
                  </EnhancedButton>
                </div>
                <div className="flex gap-2">
                  <EnhancedButton
                    variant="outline"
                    size="sm"
                    rounded="full"
                    className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 hover:shadow-[0_0_8px_0_rgba(80,0,255,0.3)]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </EnhancedButton>
                  <EnhancedButton
                    variant="gradient"
                    size="sm"
                    rounded="full"
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Friends
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            <AnimatedSection delay={0.1}>
              {/* HERO SECTION - compact, visually rich, no empty space */}
              <section className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-blue-700/40 ring-4 ring-blue-500/30 shadow-[0_0_32px_0_rgba(80,0,255,0.4)]">
                      <AvatarImage src={community?.image} />
                      <AvatarFallback className="bg-zinc-800 text-3xl">{community?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {community?.trending && (
                      <Badge className="absolute -top-2 -right-2 bg-purple-900/50 text-purple-300 border-purple-800">Trending</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {community?.membersList.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-10 w-10 border-2 border-blue-700/40">
                        <AvatarImage src={member.image} />
                        <AvatarFallback className="bg-zinc-800">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {community && community.members > 3 && (
                      <div className="h-10 w-10 rounded-full bg-zinc-800 border-2 border-blue-700/40 flex items-center justify-center text-xs text-zinc-400">
                        +{community.members - 3}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                  <h1 className="text-5xl md:text-6xl font-extrabold tracking-widest leading-tight bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(80,0,255,0.5)] uppercase animate-gradient-x text-center md:text-left">
                    {community?.name}
                  </h1>
                  <p className="text-zinc-400 text-lg max-w-xl text-center md:text-left">{community?.description}</p>
                  <div className="flex flex-wrap gap-6 mt-2">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x">
                        <AnimatedCounter from={0} to={community?.members || 0} duration={2} delay={0.5} />
                      </span>
                      <span className="text-xs text-zinc-400">Members</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x">
                        <AnimatedCounter from={0} to={community?.stats.activeToday || 0} duration={2} delay={0.6} />
                      </span>
                      <span className="text-xs text-zinc-400">Active Today</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x">
                        <AnimatedCounter from={0} to={community?.stats.weeklyGrowth || 0} duration={2} delay={0.7} />%
                      </span>
                      <span className="text-xs text-zinc-400">Weekly Growth</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x">
                        <AnimatedCounter from={0} to={community?.stats.monthlyActivity || 0} duration={2} delay={0.8} />%
                      </span>
                      <span className="text-xs text-zinc-400">Activity</span>
                    </div>
                  </div>
                  <div className="w-full max-w-xl mt-4">
                    <AnimatedProgress value={community?.stats.monthlyActivity || 0} max={100} className="h-3 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-purple-500 [&>div]:to-fuchsia-500 [&>div]:shadow-[0_0_8px_0_rgba(80,0,255,0.5)]" delay={0.9} />
                  </div>
                </div>
              </section>

              <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-900/80 border border-blue-700/40 rounded-lg p-1 mb-6 shadow-[0_0_16px_0_rgba(80,0,255,0.2)]">
                  <TabsTrigger value="announcements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-600/30 data-[state=active]:text-white data-[state=active]:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] rounded-md transition-all duration-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TabsContent value="announcements" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                          Important Announcements
                        </h3>
                        <div className="flex gap-2">
                          <EnhancedButton variant="ghost" size="sm" rounded="full" className="text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                            <Filter className="h-4 w-4" />
                          </EnhancedButton>
                        </div>
            </div>

                      {community?.announcements.map((announcement, index) => (
                        <AnimatedSection key={announcement.id} delay={0.1 + index * 0.1}>
                          <EnhancedCard 
                            variant="default" 
                            hover="lift" 
                      className={cn(
                              "bg-zinc-900/80 border shadow-[0_0_16px_0_rgba(80,0,255,0.2)] hover:shadow-[0_0_24px_0_rgba(80,0,255,0.4)]",
                              announcement.priority === "high" ? "border-red-700/40" : 
                              announcement.priority === "medium" ? "border-yellow-700/40" : 
                              "border-blue-700/40"
                            )}
                          >
                            <EnhancedCardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-full flex-shrink-0 shadow-[0_0_8px_0_rgba(80,0,255,0.3)]",
                                  announcement.type === "achievement" ? "bg-yellow-900/40" :
                                  announcement.type === "event" ? "bg-purple-900/40" :
                                  "bg-blue-900/40"
                                )}>
                                  {announcement.pinned && <Pin className="h-4 w-4 text-yellow-400" />}
                                  {!announcement.pinned && announcement.type === "achievement" && <Award className="h-4 w-4 text-yellow-400" />}
                                  {!announcement.pinned && announcement.type === "event" && <Calendar className="h-4 w-4 text-purple-400" />}
                                  {!announcement.pinned && announcement.type === "info" && <Bell className="h-4 w-4 text-blue-400" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                      {announcement.title}
                                      {announcement.pinned && <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-800 text-[10px]">Pinned</Badge>}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                          className={cn(
                                          "text-[10px]",
                                          announcement.priority === "high" ? "bg-red-900/50 text-red-300 border-red-800" :
                                          announcement.priority === "medium" ? "bg-yellow-900/50 text-yellow-300 border-yellow-800" :
                                          "bg-blue-900/50 text-blue-300 border-blue-800"
                                        )}
                                      >
                                        {announcement.priority}
                                      </Badge>
                                      <EnhancedButton variant="ghost" size="sm" rounded="full" className="h-6 w-6 p-0 text-zinc-400 hover:text-white">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </EnhancedButton>
                                    </div>
                                  </div>
                                  <p className="text-zinc-300 mb-2">{announcement.content}</p>
                                  <div className="flex items-center justify-between text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {announcement.timestamp}
                                    </span>
                                    <EnhancedButton variant="ghost" size="sm" rounded="full" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs h-6">
                                      Read More
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </EnhancedButton>
                                  </div>
                                </div>
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                      ))}
                    </TabsContent>

                    <TabsContent value="leaderboard" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          Community Leaderboard
                        </h3>
                        <EnhancedButton variant="outline" size="sm" rounded="full" className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700">
                          View All
                        </EnhancedButton>
                      </div>

                      {community?.leaderboard.map((user, index) => (
                        <AnimatedSection key={user.id} delay={0.1 + index * 0.1}>
                          <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.2)] hover:shadow-[0_0_24px_0_rgba(80,0,255,0.4)]">
                            <EnhancedCardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative',
                                  index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-black shadow-[0_0_16px_0_rgba(234,179,8,0.4)]' :
                                  index === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-black shadow-[0_0_16px_0_rgba(161,161,170,0.4)]' :
                                  index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-[0_0_16px_0_rgba(180,83,9,0.4)]' :
                                  'bg-zinc-800 text-white border border-zinc-700'
                                )}>
                                  {index < 3 ? (
                                    index === 0 ? <Crown className="h-6 w-6" /> :
                                    index === 1 ? <Medal className="h-6 w-6" /> :
                                    <Star className="h-6 w-6" />
                                  ) : (
                                    index + 1
                                  )}
                        </div>
                                <Avatar className="h-12 w-12 border-2 border-blue-500/30">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-white">{user.name}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-blue-900/40 text-blue-300 border-blue-800 text-xs flex items-center gap-1">
                                        <Zap className="h-3 w-3" />
                                        {user.points} XP
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      {user.badges} badges
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      {user.streak} day streak
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      {user.contributions} contributions
                                    </span>
                                  </div>
                                </div>
                                <EnhancedButton 
                                  variant="outline" 
                                  size="sm" 
                                  rounded="full" 
                                  className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700 flex items-center gap-1"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  Connect
                                </EnhancedButton>
                              </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                      ))}
                    </TabsContent>

                    <TabsContent value="members" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                          Community Members
                        </h3>
                        <div className="flex gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                              placeholder="Search members..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 bg-zinc-800/80 border-blue-700/40 text-white focus:border-blue-500 focus:shadow-[0_0_8px_0_rgba(80,0,255,0.3)] w-64"
                            />
                          </div>
                          <EnhancedButton variant="outline" size="sm" rounded="full" className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                          </EnhancedButton>
                        </div>
                      </div>

                      {community?.membersList.map((member, index) => (
                        <AnimatedSection key={member.id} delay={0.1 + index * 0.1}>
                          <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.2)] hover:shadow-[0_0_24px_0_rgba(80,0,255,0.4)]">
                            <EnhancedCardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-14 w-14 border-2 border-blue-500/30">
                                    <AvatarImage src={member.image} />
                                    <AvatarFallback className="bg-zinc-800">{member.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {member.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-black rounded-full">
                                      <span className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></span>
                    </div>
                    )}
                  </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-bold text-white">{member.name}</h4>
                                      <p className="text-sm text-zinc-400">{member.title} at {member.company}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-zinc-500 mb-1">Joined {member.joined}</div>
                                      <div className="flex items-center gap-1">
                                        <div className={cn(
                                          "h-2 w-2 rounded-full",
                                          member.isOnline ? "bg-green-500" : "bg-zinc-500"
                                        )} />
                                        <span className="text-xs text-zinc-400">
                                          {member.isOnline ? "Online" : "Offline"}
                                        </span>
                                      </div>
            </div>
    </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    {member.achievements.map((achievement, i) => (
                                      <Badge key={i} className="bg-green-900/40 text-green-300 border-green-800 text-xs flex items-center gap-1">
                                        <Award className="h-3 w-3" />
                                        {achievement}
                </Badge>
                                    ))}
            </div>
          </div>
                                <div className="flex gap-2">
                                  <EnhancedButton 
                                    variant="outline" 
                                    size="sm" 
                                    rounded="full" 
                                    className="bg-zinc-800/80 border-blue-700/40 text-white hover:bg-zinc-700"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Message
                                  </EnhancedButton>
                                  <EnhancedButton 
                                    variant="gradient" 
            size="sm"
                                    rounded="full" 
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_0_rgba(80,0,255,0.4)]"
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Connect
                                  </EnhancedButton>
        </div>
            </div>
                            </EnhancedCardContent>
                          </EnhancedCard>
                        </AnimatedSection>
                      ))}
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

