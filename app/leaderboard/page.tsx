"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Award, ChevronDown, Filter, Search, Trophy, Users, X } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Removed import { Separator } from "@/components/ui/separator" due to missing module
import { cn } from "@/lib/utils"

// Mock data for global leaderboard
const globalLeaderboard = [
  {
    id: 1,
    name: "Sarah Williams",
    username: "mindful_sarah",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    points: 12450,
    rank: 1,
    university: "Stanford University",
    major: "Computer Science",
  },
  {
    id: 2,
    name: "Alex Johnson",
    username: "alex_improvement",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    points: 10890,
    rank: 2,
    university: "MIT",
    major: "Electrical Engineering",
  },
  {
    id: 3,
    name: "Michael Chen",
    username: "productivity_mike",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    points: 9675,
    rank: 3,
    university: "Harvard University",
    major: "Business Administration",
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    username: "finance_emily",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    points: 8320,
    rank: 4,
    university: "UC Berkeley",
    major: "Economics",
  },
  {
    id: 5,
    name: "David Kim",
    username: "fitness_david",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    points: 7890,
    rank: 5,
    university: "UCLA",
    major: "Psychology",
  },
  {
    id: 6,
    name: "Jessica Lee",
    username: "creative_jess",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    points: 7650,
    rank: 6,
    university: "NYU",
    major: "Fine Arts",
  },
  {
    id: 7,
    name: "Ryan Martinez",
    username: "tech_ryan",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    points: 7320,
    rank: 7,
    university: "Stanford University",
    major: "Computer Science",
  },
  {
    id: 8,
    name: "Sophia Wang",
    username: "sophia_science",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=faces",
    points: 7180,
    rank: 8,
    university: "Caltech",
    major: "Physics",
  },
  {
    id: 9,
    name: "James Wilson",
    username: "james_engineer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    points: 6950,
    rank: 9,
    university: "Georgia Tech",
    major: "Mechanical Engineering",
  },
  {
    id: 10,
    name: "Olivia Brown",
    username: "olivia_med",
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=faces",
    points: 6820,
    rank: 10,
    university: "Johns Hopkins",
    major: "Pre-Med",
  },
]

// Mock data for university leaderboards
const universityLeaderboards = [
  {
    id: 1,
    name: "Stanford University",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&h=150&fit=crop",
    members: 12453,
    userRank: 42,
    totalUsers: 345,
  },
  {
    id: 2,
    name: "MIT",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&h=150&fit=crop",
    members: 9845,
    userRank: 78,
    totalUsers: 412,
  },
  {
    id: 3,
    name: "Harvard University",
    image: "https://images.unsplash.com/photo-1583889659384-ac7a5b3c3beb?w=150&h=150&fit=crop",
    members: 11267,
    userRank: 103,
    totalUsers: 523,
  },
]

// Mock data for company leaderboards
const companyLeaderboards = [
  {
    id: 1,
    name: "Google",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=150&h=150&fit=crop",
    members: 8762,
    userRank: 56,
    totalUsers: 278,
  },
  {
    id: 2,
    name: "Apple",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop",
    members: 7321,
    userRank: 89,
    totalUsers: 345,
  },
  {
    id: 3,
    name: "Microsoft",
    image: "https://images.unsplash.com/photo-1583889659384-ac7a5b3c3beb?w=150&h=150&fit=crop",
    members: 6291,
    userRank: 112,
    totalUsers: 298,
  },
]

// Mock data for friend leaderboards
const friendLeaderboard = [
  {
    id: 1,
    name: "Sarah Williams",
    username: "mindful_sarah",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    points: 12450,
    rank: 1,
    university: "Stanford University",
    major: "Computer Science",
  },
  {
    id: 2,
    name: "Michael Chen",
    username: "productivity_mike",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    points: 9675,
    rank: 2,
    university: "Harvard University",
    major: "Business Administration",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    username: "finance_emily",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    points: 8320,
    rank: 3,
    university: "UC Berkeley",
    major: "Economics",
  },
  {
    id: 4,
    name: "You",
    username: "your_username",
    image: "/placeholder.svg?height=150&width=150",
    points: 7890,
    rank: 4,
    university: "Stanford University",
    major: "Computer Science",
  },
  {
    id: 5,
    name: "Jessica Lee",
    username: "creative_jess",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces",
    points: 7650,
    rank: 5,
    university: "NYU",
    major: "Fine Arts",
  },
]

export default function LeaderboardPage() {
  const isAuthorized = useRequireAuth() // Protect this route
  
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }
  
  const [activeTab, setActiveTab] = useState("global")
  const [timeFilter, setTimeFilter] = useState("This Week")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGlobalLeaderboard = globalLeaderboard.filter(
    (user) =>
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredFriendLeaderboard = friendLeaderboard.filter(
    (user) =>
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader
        title="Leaderboard"
        rightElement={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-white">
                {timeFilter}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-700 text-white">
              <DropdownMenuItem onClick={() => setTimeFilter("Today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("This Week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("This Month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("All Time")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search users..."
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

        {/* Tabs */}
        <Tabs defaultValue="global" className="w-full" onValueChange={setActiveTab}>
          <div className="sticky top-[69px] z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800">
            <TabsList className="w-full flex justify-between bg-transparent h-12 p-0">
              <TabsTrigger
                value="global"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "global" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Global
              </TabsTrigger>
              <TabsTrigger
                value="friends"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "friends" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Users className="h-4 w-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger
                value="university"
                className={cn(
                  "flex-1 rounded-none h-full data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  activeTab === "university" ? "text-purple-500 border-b-2 border-purple-500" : "text-zinc-400",
                )}
              >
                <Award className="h-4 w-4 mr-2" />
                University
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Global Leaderboard Tab */}
          <TabsContent value="global" className="mt-0">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Global Leaderboard
                </h2>
                <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  {filteredGlobalLeaderboard.map((user, index) => (
                    <div key={user.id}>
                      <div
                        className={cn(
                          "flex items-center p-4",
                          index === 0
                            ? "bg-yellow-500/10"
                            : index === 1
                              ? "bg-zinc-300/10"
                              : index === 2
                                ? "bg-amber-700/10"
                                : "",
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-sm",
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                  ? "bg-zinc-300 text-black"
                                  : index === 2
                                    ? "bg-amber-700 text-white"
                                    : "bg-zinc-800 text-white",
                            )}
                          >
                            {user.rank}
                          </div>
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-zinc-400 flex items-center">
                              @{user.username}
                              <span className="mx-1">•</span>
                              {user.university}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{user.points.toLocaleString()}</div>
                          <div className="text-xs text-zinc-400">XP</div>
                        </div>
                      </div>
                      {index < filteredGlobalLeaderboard.length - 1 && (
                        <div className="h-px bg-zinc-800" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <div className="text-sm text-zinc-400 mb-2">Your Rank: #42 of 10,000+</div>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  View Your Progress
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Friends Leaderboard Tab */}
          <TabsContent value="friends" className="mt-0">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-500" />
                  Friends Leaderboard
                </h2>
                <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  {filteredFriendLeaderboard.map((user, index) => (
                    <div key={user.id}>
                      <div
                        className={cn(
                          "flex items-center p-4",
                          user.name === "You"
                            ? "bg-purple-500/10"
                            : index === 0
                              ? "bg-yellow-500/10"
                              : index === 1
                                ? "bg-zinc-300/10"
                                : index === 2
                                  ? "bg-amber-700/10"
                                  : "",
                        )}
                      >
                        <div className="flex items-center flex-1">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-sm",
                              user.name === "You"
                                ? "bg-purple-500 text-white"
                                : index === 0
                                  ? "bg-yellow-500 text-black"
                                  : index === 1
                                    ? "bg-zinc-300 text-black"
                                    : index === 2
                                      ? "bg-amber-700 text-white"
                                      : "bg-zinc-800 text-white",
                            )}
                          >
                            {user.rank}
                          </div>
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={user.image} />
                            <AvatarFallback className="bg-zinc-800">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-zinc-400 flex items-center">
                              @{user.username}
                              <span className="mx-1">•</span>
                              {user.university}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{user.points.toLocaleString()}</div>
                          <div className="text-xs text-zinc-400">XP</div>
                        </div>
                      </div>
                      {index < filteredFriendLeaderboard.length - 1 && (
                        <div className="h-px bg-zinc-800 mx-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center mt-6">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  Invite More Friends
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* University Leaderboard Tab */}
          <TabsContent value="university" className="mt-0">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-500" />
                  University Leaderboards
                </h2>
                <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full bg-zinc-900 border-zinc-800">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>

              <div className="space-y-4">
                {universityLeaderboards.map((university) => (
                  <Card key={university.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 rounded-lg mr-3">
                            <AvatarImage src={university.image} />
                            <AvatarFallback className="bg-zinc-800">{university.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{university.name}</div>
                            <div className="text-xs text-zinc-400">{university.members.toLocaleString()} members</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs bg-zinc-800 border-zinc-700">
                          View
                        </Button>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Your rank: #{university.userRank} of {university.totalUsers}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Company Leaderboards</h3>
                <div className="space-y-4">
                  {companyLeaderboards.map((company) => (
                    <Card key={company.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Avatar className="h-12 w-12 rounded-lg mr-3">
                              <AvatarImage src={company.image} />
                              <AvatarFallback className="bg-zinc-800">{company.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-xs text-zinc-400">{company.members.toLocaleString()} members</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs bg-zinc-800 border-zinc-700">
                            View
                          </Button>
                        </div>
                        <div className="text-xs text-zinc-400">
                          Your rank: #{company.userRank} of {company.totalUsers}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <MainNav />
    </div>
  )
}

