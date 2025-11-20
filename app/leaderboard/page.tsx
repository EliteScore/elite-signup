"use client"

import { useState, useEffect } from "react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { Trophy, Crown, Medal, Star, TrendingUp, Award, Zap, Search, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { AnimatedSection } from "@/components/ui/animated-section"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"
import { useRouter } from "next/navigation"

const AUTH_API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
const RESUME_SCORES_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"

type LeaderboardEntry = {
  userId: number
  name: string
  image: string | null
  level: number | null
  xp: number | null
  resumeScore: number | null
  rank: number
}

type RawLeaderboardRow = {
  rank: number
  userId: number
  username: string
  xp: number
}

type LeaderboardApiResponse = {
  success: boolean
  message: string
  data: RawLeaderboardRow[]
}

export default function LeaderboardPage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global")
  const [searchQuery, setSearchQuery] = useState("")
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Fetch current user ID
  useEffect(() => {
    if (!isAuthorized || currentUserId !== null) return

    async function fetchOwnUserId() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        const response = await fetch(`${AUTH_API_BASE_URL}v1/users/profile/get_own_profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          const profile = result?.data || result
          if (profile?.userId) {
            setCurrentUserId(profile.userId)
          }
        }
      } catch (error) {
        // Ignore error
      }
    }

    fetchOwnUserId()
  }, [isAuthorized, currentUserId])

  // Fetch leaderboard data (global + friends)
  useEffect(() => {
    if (!isAuthorized) return

    async function fetchLeaderboards() {
      console.log('[Leaderboard] ===== Fetching leaderboards =====')
      setIsLoading(true)
      setError(null)

      try {
        const token = getStoredAccessToken()
        if (!token) {
          console.error('[Leaderboard] No authentication token found')
          setError("Authentication required")
          setIsLoading(false)
          return
        }

        console.log('[Leaderboard] Token found, proceeding with API calls')

        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // needed for friends; ok for global too
        }

        // Helper to map backend row → UI entry
        const mapRowToEntry = (row: RawLeaderboardRow): LeaderboardEntry => ({
          userId: row.userId,
          name: row.username || `User ${row.userId}`,
          image: null, // we can add PFP later if needed
          level: null, // not provided by this endpoint
          xp: row.xp ?? null,
          resumeScore: null, // not used here
          rank: row.rank,
        })

        // 1) Global leaderboard
        const globalUrl = `/api/leaderboard/global?limit=100`
        console.log('[Leaderboard] Fetching global leaderboard from:', globalUrl)
        
        const globalRes = await fetch(globalUrl, { method: "GET", headers })

        console.log('[Leaderboard] Global leaderboard response status:', globalRes.status, globalRes.statusText)
        console.log('[Leaderboard] Global leaderboard response ok:', globalRes.ok)

        if (!globalRes.ok) {
          let errorText = ''
          try {
            errorText = await globalRes.text()
            console.error('[Leaderboard] Global leaderboard error response:', errorText)
            try {
              const errorJson = JSON.parse(errorText)
              console.error('[Leaderboard] Global leaderboard error JSON:', errorJson)
            } catch {
              // Not JSON, that's fine
            }
          } catch (e) {
            console.error('[Leaderboard] Failed to read error response:', e)
          }
          throw new Error(`Failed to fetch global leaderboard: ${globalRes.status} ${globalRes.statusText}`)
        }

        const globalJson: LeaderboardApiResponse = await globalRes.json()
        console.log('[Leaderboard] Global leaderboard response data:', globalJson)
        
        const globalRows = Array.isArray(globalJson.data) ? globalJson.data : []
        console.log('[Leaderboard] Global leaderboard rows count:', globalRows.length)
        const globalEntries = globalRows.map(mapRowToEntry)
        console.log('[Leaderboard] Global leaderboard entries mapped:', globalEntries.length)

        // 2) Friends leaderboard
        const friendsUrl = `/api/leaderboard/friends?limit=50`
        console.log('[Leaderboard] Fetching friends leaderboard from:', friendsUrl)
        
        const friendsRes = await fetch(friendsUrl, { method: "GET", headers })

        console.log('[Leaderboard] Friends leaderboard response status:', friendsRes.status, friendsRes.statusText)
        console.log('[Leaderboard] Friends leaderboard response ok:', friendsRes.ok)

        let friendsEntries: LeaderboardEntry[] = []
        if (friendsRes.ok) {
          const friendsJson: LeaderboardApiResponse = await friendsRes.json()
          console.log('[Leaderboard] Friends leaderboard response data:', friendsJson)
          
          const friendsRows = Array.isArray(friendsJson.data) ? friendsJson.data : []
          console.log('[Leaderboard] Friends leaderboard rows count:', friendsRows.length)
          friendsEntries = friendsRows.map(mapRowToEntry)
          console.log('[Leaderboard] Friends leaderboard entries mapped:', friendsEntries.length)
        } else if (friendsRes.status !== 404) {
          // if it's 404 or empty, we just show nothing; other errors we surface
          let errorText = ''
          try {
            errorText = await friendsRes.text()
            console.error('[Leaderboard] Friends leaderboard error response:', errorText)
          } catch (e) {
            console.error('[Leaderboard] Failed to read friends error response:', e)
          }
          throw new Error(`Failed to fetch friends leaderboard: ${friendsRes.status} ${friendsRes.statusText}`)
        } else {
          console.log('[Leaderboard] Friends leaderboard returned 404, treating as empty')
        }

        console.log('[Leaderboard] Setting leaderboard state - Global:', globalEntries.length, 'Friends:', friendsEntries.length)
        setGlobalLeaderboard(globalEntries)
        setFriendsLeaderboard(friendsEntries)
        console.log('[Leaderboard] ===== Leaderboards fetched successfully =====')
      } catch (error) {
        console.error('[Leaderboard] Error fetching leaderboards:', error)
        setError(error instanceof Error ? error.message : "Failed to load leaderboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboards()
  }, [isAuthorized])

  const filteredGlobalLeaderboard = globalLeaderboard.filter(
    (entry) =>
      searchQuery === "" ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFriendsLeaderboard = friendsLeaderboard.filter(
    (entry) =>
      searchQuery === "" ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number, isTopThree: boolean) => {
    const medalColors = [
      { bg: 'from-yellow-500 to-yellow-600', border: 'border-yellow-500/50', text: 'text-yellow-300' },
      { bg: 'from-zinc-400 to-zinc-500', border: 'border-zinc-400/50', text: 'text-zinc-300' },
      { bg: 'from-amber-600 to-amber-700', border: 'border-amber-600/50', text: 'text-amber-300' },
    ]
    const medalColor = isTopThree ? medalColors[entry.rank - 1] : null
    const isCurrentUser = entry.userId === currentUserId

    return (
      <AnimatedSection key={entry.userId} delay={0.05 * index}>
        <EnhancedCard
          variant="default"
          hover="lift"
          className={cn(
            "bg-zinc-900 border rounded-xl cursor-pointer",
            isTopThree
              ? `border-2 ${medalColor?.border} bg-gradient-to-br ${medalColor?.bg}/10`
              : isCurrentUser
                ? "border-2 border-blue-500/50 bg-blue-500/5"
                : "border-zinc-800"
          )}
          onClick={() => router.push(`/profile?userId=${entry.userId}`)}
        >
          <EnhancedCardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className={cn(
                "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2",
                isTopThree
                  ? `bg-gradient-to-br ${medalColor?.bg} ${medalColor?.border} ${medalColor?.text}`
                  : isCurrentUser
                    ? "bg-blue-500 border-blue-400 text-white"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
              )}>
                {isTopThree ? (
                  entry.rank === 1 ? <Crown className="h-5 w-5 sm:h-6 sm:w-6" /> :
                  entry.rank === 2 ? <Medal className="h-5 w-5 sm:h-6 sm:w-6" /> :
                  <Star className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  entry.rank
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-blue-500/30 flex-shrink-0">
                <AvatarImage src={entry.image || undefined} alt={entry.name} />
                <AvatarFallback className="bg-zinc-800 text-sm sm:text-base">
                  {entry.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn(
                    "font-bold text-xs sm:text-sm truncate",
                    isTopThree ? medalColor?.text : isCurrentUser ? "text-blue-400" : "text-white"
                  )}>
                    {entry.name}
                    {isCurrentUser && (
                      <Badge className="ml-2 bg-blue-900/40 text-blue-300 border-blue-800 text-[9px] px-1.5 py-0">
                        You
                      </Badge>
                    )}
                  </h4>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  {entry.xp !== null && (
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500">XP</p>
                        <p className="text-xs sm:text-sm font-semibold text-white">
                          {entry.xp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </AnimatedSection>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black border-b border-zinc-800">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent flex items-center gap-2">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                Leaderboards
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs sm:text-sm"
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
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-xs sm:text-sm text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Loading leaderboard...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "global" | "friends")} className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-4 w-full grid grid-cols-2">
                <TabsTrigger
                  value="global"
                  className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Global</span>
                </TabsTrigger>
                <TabsTrigger
                  value="friends"
                  className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Friends</span>
                </TabsTrigger>
              </TabsList>

              {/* Global leaderboard */}
              <TabsContent value="global" className="space-y-3 mt-0">
                {filteredGlobalLeaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {filteredGlobalLeaderboard.map((entry, index) => {
                      const isTopThree = entry.rank <= 3
                      return renderLeaderboardEntry(entry, index, isTopThree)
                    })}
                  </div>
                ) : (
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <EnhancedCardContent className="p-8 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                      <h4 className="text-lg font-bold text-white mb-2">No Global Data</h4>
                      <p className="text-sm text-zinc-400">
                        Global leaderboard will appear once users start earning XP.
                      </p>
                    </EnhancedCardContent>
                  </EnhancedCard>
                )}
              </TabsContent>

              {/* Friends leaderboard */}
              <TabsContent value="friends" className="space-y-3 mt-0">
                {filteredFriendsLeaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {filteredFriendsLeaderboard.map((entry, index) => {
                      const isTopThree = entry.rank <= 3
                      return renderLeaderboardEntry(entry, index, isTopThree)
                    })}
                  </div>
                ) : (
                  <EnhancedCard variant="default" className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <EnhancedCardContent className="p-8 text-center">
                      <Award className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
                      <h4 className="text-lg font-bold text-white mb-2">No Friends Data</h4>
                      <p className="text-sm text-zinc-400">
                        Once you and your friends start earning XP, your rankings will appear here.
                      </p>
                    </EnhancedCardContent>
                  </EnhancedCard>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
