"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Flame,
  Lock,
  Mic,
  Play,
  Plus,
  Search,
  Star,
  Users,
  X,
} from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { XPNotification } from "@/components/xp-notification"

// Mock data for daily challenges
const dailyChallenges = [
  {
    id: 1,
    title: "Complete a Coding Exercise",
    description: "Solve a programming problem on a platform like LeetCode or HackerRank",
    xp: 100,
    timeEstimate: "30 mins",
    completed: false,
    icon: <FileText className="h-5 w-5 text-blue-400" />,
    iconBg: "bg-blue-900/30",
  },
  {
    id: 2,
    title: "Read an Article",
    description: "Read an article related to your field of interest",
    xp: 50,
    timeEstimate: "15 mins",
    completed: true,
    icon: <BookOpen className="h-5 w-5 text-green-400" />,
    iconBg: "bg-green-900/30",
  },
  {
    id: 3,
    title: "Practice Public Speaking",
    description: "Record yourself giving a 2-minute presentation on any topic",
    xp: 75,
    timeEstimate: "20 mins",
    completed: false,
    icon: <Mic className="h-5 w-5 text-purple-400" />,
    iconBg: "bg-purple-900/30",
  },
]

// Mock data for skill challenges
const skillChallenges = [
  {
    id: 1,
    title: "Python Mastery",
    description: "Complete a series of Python programming challenges",
    totalTasks: 10,
    completedTasks: 4,
    xp: 500,
    difficulty: "Intermediate",
    category: "Programming",
    icon: <FileText className="h-5 w-5 text-blue-400" />,
    iconBg: "bg-blue-900/30",
  },
  {
    id: 2,
    title: "Public Speaking",
    description: "Improve your presentation and public speaking skills",
    totalTasks: 8,
    completedTasks: 2,
    xp: 400,
    difficulty: "Beginner",
    category: "Communication",
    icon: <Mic className="h-5 w-5 text-purple-400" />,
    iconBg: "bg-purple-900/30",
  },
  {
    id: 3,
    title: "Data Analysis",
    description: "Learn to analyze and visualize data using Python libraries",
    totalTasks: 12,
    completedTasks: 0,
    xp: 600,
    difficulty: "Advanced",
    category: "Data Science",
    icon: <FileText className="h-5 w-5 text-green-400" />,
    iconBg: "bg-green-900/30",
  },
  {
    id: 4,
    title: "Leadership Skills",
    description: "Develop essential leadership and team management skills",
    totalTasks: 6,
    completedTasks: 1,
    xp: 350,
    difficulty: "Intermediate",
    category: "Soft Skills",
    icon: <Users className="h-5 w-5 text-yellow-400" />,
    iconBg: "bg-yellow-900/30",
  },
]

// Mock data for group challenges
const groupChallenges = [
  {
    id: 1,
    title: "Hackathon: Build a Web App",
    description: "Work with a team to build a web application in 48 hours",
    participants: 24,
    startDate: "Jun 15, 2023",
    endDate: "Jun 17, 2023",
    xp: 1000,
    category: "Programming",
    icon: <FileText className="h-5 w-5 text-blue-400" />,
    iconBg: "bg-blue-900/30",
  },
  {
    id: 2,
    title: "Case Study Competition",
    description: "Analyze a business case and present your solutions",
    participants: 18,
    startDate: "Jul 5, 2023",
    endDate: "Jul 12, 2023",
    xp: 800,
    category: "Business",
    icon: <FileText className="h-5 w-5 text-green-400" />,
    iconBg: "bg-green-900/30",
  },
  {
    id: 3,
    title: "Research Paper Collaboration",
    description: "Collaborate on a research paper with peers",
    participants: 12,
    startDate: "Aug 1, 2023",
    endDate: "Sep 15, 2023",
    xp: 1200,
    category: "Research",
    icon: <FileText className="h-5 w-5 text-purple-400" />,
    iconBg: "bg-purple-900/30",
  },
]

export default function ChallengesPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  const [activeTab, setActiveTab] = useState("daily")
  const [searchQuery, setSearchQuery] = useState("")
  const [dailyStreak, setDailyStreak] = useState(5)
  const [showXpNotification, setShowXpNotification] = useState(false)
  const router = useRouter()
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Filter challenges based on search query
  const filteredSkillChallenges = skillChallenges.filter(
    (challenge) =>
      searchQuery === "" ||
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredGroupChallenges = groupChallenges.filter(
    (challenge) =>
      searchQuery === "" ||
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Toggle daily challenge completion
  const toggleDailyChallenge = (id: number) => {
    const challenge = dailyChallenges.find((c) => c.id === id)
    if (challenge && !challenge.completed) {
      challenge.completed = true
      setShowXpNotification(true)

      // In a real app, you would update the state here
      // For demo purposes, we'll just show the notification
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader title="Challenges" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Search Bar */}
        {activeTab !== "daily" && (
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search challenges..."
                className="pl-10 pr-10 py-2 bg-zinc-900 border-zinc-800 rounded-full text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-zinc-400 hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="daily" className="w-full" onValueChange={setActiveTab}>
          <div
            className={cn(
              "sticky z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800",
              activeTab !== "daily" ? "top-[69px]" : "top-0",
            )}
          >
            <TabsList className="w-full flex justify-between bg-transparent h-12 p-0">
              <TabsTrigger
                value="daily"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "daily" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Flame className="h-4 w-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger
                value="skills"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "skills" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Star className="h-4 w-4 mr-2" />
                Skills
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "group" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Group
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Daily Challenges Tab */}
          <TabsContent value="daily" className="mt-0 px-4 py-4 space-y-6">
            {/* Streak Card */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-800/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Daily Streak</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Keep completing daily challenges to maintain your streak!
                    </p>
                  </div>
                  <div className="flex items-center bg-purple-900/50 px-3 py-2 rounded-full">
                    <Flame className="h-5 w-5 text-orange-400 mr-2" />
                    <span className="font-bold text-xl">{dailyStreak}</span>
                    <span className="text-xs text-zinc-400 ml-1">days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Today's Progress</h2>
                <div className="text-sm text-zinc-400">
                  {dailyChallenges.filter((c) => c.completed).length}/{dailyChallenges.length} completed
                </div>
              </div>
              <Progress
                value={(dailyChallenges.filter((c) => c.completed).length / dailyChallenges.length) * 100}
                className="h-2 bg-zinc-800"
                indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
              />
            </div>

            {/* Daily Challenges */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Today's Challenges</h2>
              <div className="space-y-3">
                {dailyChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className={cn(
                      "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors",
                      challenge.completed && "bg-purple-900/10 border-purple-800/30",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className={cn("p-2 rounded-full mr-3", challenge.iconBg)}>{challenge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{challenge.title}</h3>
                            <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                              +{challenge.xp} XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{challenge.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center text-xs text-zinc-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {challenge.timeEstimate}
                            </div>
                            <Button
                              variant={challenge.completed ? "outline" : "default"}
                              size="sm"
                              className={cn(
                                "rounded-full h-8 px-3",
                                challenge.completed
                                  ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
                              )}
                              onClick={() => toggleDailyChallenge(challenge.id)}
                            >
                              {challenge.completed ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Completed
                                </div>
                              ) : (
                                "Complete"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Upcoming Challenges */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Tomorrow's Challenges</h2>
                <Button
                  variant="link"
                  className="text-purple-500 text-sm p-0"
                  onClick={() => {
                    // In a real app, this would preview tomorrow's challenges
                    console.log("Preview tomorrow's challenges")
                  }}
                >
                  Preview
                </Button>
              </div>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-zinc-800 p-2 rounded-full mr-3">
                        <Lock className="h-5 w-5 text-zinc-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-500">Tomorrow's Challenges</h3>
                        <p className="text-sm text-zinc-600">Complete today's challenges to unlock</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-zinc-800 border-zinc-700 text-zinc-400"
                      disabled={true}
                    >
                      Locked
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skills Challenges Tab */}
          <TabsContent value="skills" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Skill Challenges</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800"
                onClick={() => {
                  // In a real app, this would open a filter dialog
                  console.log("Open filter dialog")
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>

            {filteredSkillChallenges.length > 0 ? (
              <div className="space-y-4">
                {filteredSkillChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className={cn("p-2 rounded-full mr-3", challenge.iconBg)}>{challenge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{challenge.title}</h3>
                            <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                              +{challenge.xp} XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{challenge.description}</p>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">
                                Progress: {challenge.completedTasks}/{challenge.totalTasks} tasks
                              </span>
                              <span className="text-zinc-400">
                                {Math.round((challenge.completedTasks / challenge.totalTasks) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(challenge.completedTasks / challenge.totalTasks) * 100}
                              className="h-1.5 bg-zinc-800"
                              indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
                            />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                {challenge.difficulty}
                              </Badge>
                              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                                {challenge.category}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              onClick={() => {
                                // In a real app, this would navigate to the challenge
                                console.log(`Continue challenge: ${challenge.title}`)
                              }}
                            >
                              <Play className="h-3.5 w-3.5 mr-1" />
                              Continue
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <Search className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="text-zinc-300 text-lg mb-2">No challenges found</div>
                <div className="text-sm text-zinc-500">Try different keywords or browse all challenges</div>
              </div>
            )}

            <div className="text-center mt-6">
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => {
                  // In a real app, this would navigate to discover more challenges
                  console.log("Discover more skill challenges")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Discover More Skill Challenges
              </Button>
            </div>
          </TabsContent>

          {/* Group Challenges Tab */}
          <TabsContent value="group" className="mt-0 px-4 py-4 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Group Challenges</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800"
                onClick={() => {
                  // In a real app, this would open a filter dialog
                  console.log("Open filter dialog")
                }}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </div>

            {filteredGroupChallenges.length > 0 ? (
              <div className="space-y-4">
                {filteredGroupChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className={cn("p-2 rounded-full mr-3", challenge.iconBg)}>{challenge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{challenge.title}</h3>
                            <Badge className="bg-purple-900/50 text-purple-300 border-purple-800 text-[10px]">
                              +{challenge.xp} XP
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{challenge.description}</p>

                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center text-xs text-zinc-500">
                              <Users className="h-3 w-3 mr-1" />
                              {challenge.participants} participants
                            </div>
                            <div className="flex items-center text-xs text-zinc-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {challenge.startDate} - {challenge.endDate}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                              {challenge.category}
                            </Badge>
                            <Button
                              size="sm"
                              className="rounded-full h-8 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                              onClick={() => {
                                // In a real app, this would join the challenge
                                console.log(`Join challenge: ${challenge.title}`)
                              }}
                            >
                              Join Challenge
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800 p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                  <Search className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="text-zinc-300 text-lg mb-2">No group challenges found</div>
                <div className="text-sm text-zinc-500">Try different keywords or browse all challenges</div>
              </div>
            )}

            <div className="text-center mt-6">
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => {
                  // In a real app, this would create a group challenge
                  console.log("Create a group challenge")
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create a Group Challenge
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <MainNav />

      {/* XP Notification */}
      {showXpNotification && (
        <XPNotification xp={50} message="Challenge completed!" onComplete={() => setShowXpNotification(false)} />
      )}
    </div>
  )
}

