"use client"

import { useState, useEffect } from "react"
import { Search, X, Users, Trophy, Hash } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Mock data for search
const people = [
  {
    id: 1,
    name: "Alex Johnson",
    title: "Software Engineer at Google",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=faces",
    level: 8,
    mutualConnections: 12,
  },
  {
    id: 2,
    name: "Sarah Williams",
    title: "Product Manager at Microsoft",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    level: 12,
    mutualConnections: 8,
  },
  {
    id: 3,
    name: "Michael Chen",
    title: "Data Scientist at Amazon",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    level: 6,
    mutualConnections: 5,
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    title: "UX Designer at Adobe",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    level: 9,
    mutualConnections: 15,
  },
  {
    id: 5,
    name: "David Kim",
    title: "Frontend Developer at Netflix",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    level: 7,
    mutualConnections: 10,
  },
]

const communities = [
  {
    id: 1,
    name: "Frontend Developers",
    description: "React, Vue, and modern web development",
    members: 12450,
    category: "Technology",
  },
  {
    id: 2,
    name: "Data Science Hub",
    description: "ML, AI, and data analytics community",
    members: 8930,
    category: "Data Science",
  },
  {
    id: 3,
    name: "Product Managers Network",
    description: "Product strategy and growth",
    members: 6780,
    category: "Product",
  },
  {
    id: 4,
    name: "UI/UX Designers",
    description: "Design systems and user experience",
    members: 9540,
    category: "Design",
  },
  {
    id: 5,
    name: "System Design Masters",
    description: "Scalable architecture and system design",
    members: 5620,
    category: "Engineering",
  },
]

const leaderboards = [
  {
    id: 1,
    name: "Engineering Excellence",
    category: "Engineering",
    participants: 5420,
    yourRank: 87,
  },
  {
    id: 2,
    name: "Frontend Development",
    category: "Frontend",
    participants: 3200,
    yourRank: 42,
  },
  {
    id: 3,
    name: "Data Science",
    category: "Data Science",
    participants: 4800,
    yourRank: 156,
  },
  {
    id: 4,
    name: "Product Management",
    category: "Product",
    participants: 2900,
    yourRank: 64,
  },
  {
    id: 5,
    name: "UI/UX Design",
    category: "Design",
    participants: 3600,
    yourRank: 103,
  },
]

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "people" | "communities" | "leaderboards">("all")
  const [isSearching, setIsSearching] = useState(false)

  // Simulate search delay
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 300)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  // Filter results
  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLeaderboards = leaderboards.filter(
    (leaderboard) =>
      leaderboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leaderboard.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasResults = filteredPeople.length > 0 || filteredCommunities.length > 0 || filteredLeaderboards.length > 0

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-20">
        {/* Search Header */}
        <div className="sticky top-0 z-40 bg-black border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    type="text"
                placeholder="Search people, communities, leaderboards..."
                    value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 h-11 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg transition-all"
                autoFocus
              />
                    {searchQuery && (
                          <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                >
                  <X className="h-4 w-4" />
                          </button>
                  )}
              </div>

            {/* Filter Tabs */}
            {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-8 px-3 text-xs",
                    activeTab === "all"
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  All
                </Button>
                <Button
                        variant="outline"
                        size="sm"
                  onClick={() => setActiveTab("people")}
                        className={cn(
                    "rounded-full transition-all whitespace-nowrap h-8 px-3 text-xs",
                    activeTab === "people"
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <Users className="h-3.5 w-3.5 mr-1" />
                  People
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communities")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-8 px-3 text-xs",
                    activeTab === "communities"
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <Hash className="h-3.5 w-3.5 mr-1" />
                  Communities
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("leaderboards")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-8 px-3 text-xs",
                    activeTab === "leaderboards"
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 mr-1" />
                  Leaderboards
                </Button>
                  </motion.div>
                )}
            </div>
          </div>

        {/* Results */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          {!searchQuery ? (
            // Empty state
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Search EliteScore</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Find people to connect with, communities to join, and leaderboards to compete in
              </p>
                  </div>
          ) : !hasResults ? (
            // No results
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
              <p className="text-zinc-400 text-sm">Try searching for something else</p>
                </div>
          ) : (
            <div className="space-y-4">
              {/* People Results */}
              {(activeTab === "all" || activeTab === "people") && filteredPeople.length > 0 && (
                <div>
                  {activeTab === "all" && (
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-1">PEOPLE</h2>
                  )}
                  <div className="space-y-2">
                    {filteredPeople.map((person) => (
                        <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-zinc-800">
                            <AvatarImage src={person.image} />
                            <AvatarFallback className="bg-zinc-800">{person.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-white text-sm truncate">{person.name}</h3>
                              <Badge className="bg-blue-950/50 text-blue-400 border-blue-900/50 text-[10px] px-1.5 py-0">
                                {person.level}
                            </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 truncate mb-1">{person.title}</p>
                            {person.mutualConnections > 0 && (
                              <p className="text-[10px] text-zinc-500">
                                {person.mutualConnections} mutual connections
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs rounded-lg"
                          >
                            Connect
                          </Button>
                            </div>
                        </motion.div>
                      ))}
                </div>
                          </div>
              )}

              {/* Communities Results */}
              {(activeTab === "all" || activeTab === "communities") && filteredCommunities.length > 0 && (
                        <div>
                  {activeTab === "all" && (
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-1 mt-6">COMMUNITIES</h2>
                  )}
                  <div className="space-y-2">
                    {filteredCommunities.map((community) => (
                      <motion.div
                        key={community.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-800/30 flex items-center justify-center flex-shrink-0">
                            <Hash className="h-5 w-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate mb-0.5">{community.name}</h3>
                            <p className="text-xs text-zinc-400 line-clamp-1 mb-1.5">{community.description}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-zinc-500">
                                {community.members.toLocaleString()} members
                              </span>
                              <Badge className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 text-[10px] px-1.5 py-0">
                                {community.category}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-8 px-3 text-xs rounded-lg flex-shrink-0"
                          >
                            Join
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                                  </div>
                                </div>
                              )}

              {/* Leaderboards Results */}
              {(activeTab === "all" || activeTab === "leaderboards") && filteredLeaderboards.length > 0 && (
                                  <div>
                  {activeTab === "all" && (
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-1 mt-6">LEADERBOARDS</h2>
                  )}
                  <div className="space-y-2">
                    {filteredLeaderboards.map((leaderboard) => (
                      <motion.div
                        key={leaderboard.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-800/30 flex items-center justify-center flex-shrink-0">
                            <Trophy className="h-5 w-5 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate mb-0.5">{leaderboard.name}</h3>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-zinc-400">
                                Your rank: <span className="text-white font-semibold">#{leaderboard.yourRank}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              {leaderboard.participants.toLocaleString()} participants
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 h-8 px-3 text-xs rounded-lg flex-shrink-0"
                          >
                            View
                          </Button>
                        </div>
                      </motion.div>
                    ))}
          </div>
        </div>
              )}
                </div>
          )}
                </div>
              </div>
    </DashboardLayout>
  )
}
