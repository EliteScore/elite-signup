"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Users, Trophy, Hash } from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"

const DEFAULT_API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "")

type Resume = {
  currentRole?: string | null
  company?: string | null
  profilePicture?: string | null
  profilePictureUrl?: string | null
  avatarUrl?: string | null
  [key: string]: unknown
}

type ProfileInfo = {
  userId: number
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  resume: Resume | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE" | null
  createdAt: string | null
  updatedAt: string | null
}

type ApiResponse<T> = {
  success: boolean
  message: string | null
  data: T | null
}

type SearchResult = {
  userId: number
  name: string
  title: string | null
  image: string | null
  bio: string | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE" | null
}

const pickFirstValidPicture = (...candidates: Array<string | null | undefined>) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }
  return null
}

const resolvePictureFromApiProfile = (profile: any): string | null => {
  if (!profile || typeof profile !== "object") return null

  // Top-level picture fields (like profile page uses)
  const directPicture = pickFirstValidPicture(
    profile.profilePictureUrl,
    profile.profilePicture,
    profile.avatarUrl,
  )

  if (directPicture) return directPicture

  // Nested resume picture fields
  if (profile.resume) {
    return pickFirstValidPicture(
      profile.resume.profilePictureUrl,
      profile.resume.profilePicture,
      profile.resume.avatarUrl,
    )
  }

  return null
}

const mapProfileInfoToResult = (profile: ProfileInfo): SearchResult => {
  const firstName = profile.firstName?.trim() ?? ""
  const lastName = profile.lastName?.trim() ?? ""
  const fullName = `${firstName} ${lastName}`.trim() || `User ${profile.userId}`

  // Check if resume contains structured CV data (wrapped in { profile: {...} })
  const resumeFromProfile = profile.resume as any
  const structuredResumeProfile = resumeFromProfile?.profile || resumeFromProfile
  
  // Extract title from structured CV data (LinkedIn-style)
  let title: string | null = null
  
  if (structuredResumeProfile && typeof structuredResumeProfile === 'object' && !Array.isArray(structuredResumeProfile)) {
    // Try to get current/most recent job from structured CV
    const experience = structuredResumeProfile.experience || []
    if (Array.isArray(experience) && experience.length > 0) {
      // Find current job first, then most recent
      const currentJob = experience.find((exp: any) => 
        exp.is_current === true || exp.end_date === null || exp.end_date === undefined
      )
      
      const jobToUse = currentJob || experience.sort((a: any, b: any) => {
        const dateA = a.start_date || ""
        const dateB = b.start_date || ""
        return dateB.localeCompare(dateA)
      })[0]
      
      if (jobToUse) {
        title = jobToUse.title || null
        if (jobToUse.company) {
          title = title ? `${title} at ${jobToUse.company}` : jobToUse.company
        }
      }
    }
    
    // If no job, try headline from basics
    if (!title && structuredResumeProfile.basics?.headline) {
      title = structuredResumeProfile.basics.headline
    }
  }
  
  // Fallback to legacy resume fields
  if (!title && profile.resume?.currentRole) {
    title = `${profile.resume.currentRole}${profile.resume.company ? ` at ${profile.resume.company}` : ""}`
  }

  // Try multiple sources for profile picture
  const image =
    profile.resume?.profilePictureUrl ||
    profile.resume?.profilePicture ||
    profile.resume?.avatarUrl ||
    null

  return {
    userId: profile.userId,
    name: fullName,
    title,
    image,
    bio: profile.bio,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    visibility: profile.visibility,
  }
}

const getSearchUrl = (input: string) => {
  const trimmed = input.trim()
  const encoded = encodeURIComponent(trimmed)
  const url = `${API_BASE_URL}/v1/users/search/${encoded}`
  return url
}

// Enrich base search results with extra profile data (especially pictures) from get_profile
async function enrichResultsWithProfiles(results: SearchResult[]): Promise<SearchResult[]> {
  const token = getStoredAccessToken()
  if (!token) {
    return results
  }

  return Promise.all(
    results.map(async (user) => {
      try {
        const url = `${API_BASE_URL}/v1/users/profile/get_profile/${user.userId}`

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!resp.ok) {
          console.warn("[Search] Enrichment fetch not ok:", resp.status)
          return user
        }

        const result = await resp.json()
        const profile = result?.data || result
        if (!profile) return user

        const picture = resolvePictureFromApiProfile(profile)

        let finalImage = picture ?? user.image

        // As an extra fallback, try cached profile picture like profile page does
        if (!finalImage && typeof window !== "undefined") {
          const key = `profile.picture.${user.userId}`
          try {
            const cached = window.localStorage.getItem(key)
            if (cached && cached.trim().length > 0) {
              finalImage = cached
            }
          } catch (error) {
            // ignore cache read errors in production
          }
        }

        return {
          ...user,
          image: finalImage,
        }
      } catch (error) {
        // swallow enrichment errors; base search results will still render
        return user
      }
    }),
  )
}

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "people" | "communities" | "leaderboards">("all")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [ownUserId, setOwnUserId] = useState<number | null>(null)

  useEffect(() => {
    if (ownUserId !== null) return

    async function fetchOwnId() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/v1/users/profile/get_own_profile`, {
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
            setOwnUserId(profile.userId)
          }
        }
      } catch (error) {
        console.warn("[Search] Failed to fetch own user ID:", error)
      }
    }

    fetchOwnId()
  }, [ownUserId])

  const navigateToProfile = (userId: number) => {
    if (ownUserId !== null && userId === ownUserId) {
      router.push("/profile")
    } else {
      router.push(`/profile?userId=${userId}`)
    }
  }

  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)

    try {
      const url = getSearchUrl(trimmedQuery)
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
      const token = getStoredAccessToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      })

      if (response.status === 204) {
        setSearchResults([])
        return
      }

      let payload: ApiResponse<ProfileInfo[]> | null = null
      let responseText: string | null = null
      
      try {
        responseText = await response.text()
        
        if (responseText) {
          payload = JSON.parse(responseText) as ApiResponse<ProfileInfo[]>
        }
      } catch (error) {
        throw new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`)
      }

      if (!response.ok) {
        const message = payload?.message || `Search failed with status ${response.status}`
        throw new Error(message)
      }

      if (payload?.success && payload.data) {
        const mappedResults = payload.data.map(mapProfileInfoToResult)
        
        // Deduplicate by userId (keep the most complete profile - prefer ones with images)
        const userMap = new Map<number, SearchResult>()
        
        for (const result of mappedResults) {
          const existing = userMap.get(result.userId)
          
          if (!existing) {
            // First occurrence, add it
            userMap.set(result.userId, result)
          } else {
            // Duplicate found - keep the one with more data
            const existingScore = 
              (existing.image ? 2 : 0) + 
              (existing.bio ? 1 : 0) + 
              (existing.title ? 1 : 0)
            
            const newScore = 
              (result.image ? 2 : 0) + 
              (result.bio ? 1 : 0) + 
              (result.title ? 1 : 0)
            
              if (newScore > existingScore) {
              userMap.set(result.userId, result)
            }
          }
        }
        
        const dedupedResults = Array.from(userMap.values())

        const uniqueResults = await enrichResultsWithProfiles(dedupedResults)
        
        setSearchResults(uniqueResults)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      setSearchError("We couldn't complete your search. Please try again.")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [searchQuery, performSearch])

  const filteredPeople = searchResults.filter(
    (person) => ownUserId === null || person.userId !== ownUserId,
  )
  const filteredCommunities: any[] = []
  const filteredLeaderboards: any[] = []

  const showPeople = activeTab === "all" || activeTab === "people"
  const showCommunities = activeTab === "all" || activeTab === "communities"
  const showLeaderboards = activeTab === "all" || activeTab === "leaderboards"

  const hasVisibleResults =
    (showPeople && filteredPeople.length > 0) ||
    (showCommunities && filteredCommunities.length > 0) ||
    (showLeaderboards && filteredLeaderboards.length > 0)

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
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Search EliteScore</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Find people to connect with, communities to join, and leaderboards to compete in
              </p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Searching...</p>
            </div>
          ) : searchError ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Search error</h3>
              <p className="text-zinc-400 text-sm">{searchError}</p>
            </div>
          ) : !hasVisibleResults ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
              <p className="text-zinc-400 text-sm">Try searching for something else</p>
            </div>
          ) : (
            <div className="space-y-4">
              {showPeople && filteredPeople.length > 0 && (
                <div>
                  {showPeople && (
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-1">PEOPLE</h2>
                  )}
                  <div className="space-y-2">
                    {filteredPeople.map((person) => (
                      <motion.div
                        key={`user-${person.userId}`}
                        onClick={() => navigateToProfile(person.userId)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-zinc-800">
                            <AvatarImage 
                              src={person.image ?? undefined} 
                              alt={person.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {person.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-white text-sm truncate">{person.name}</h3>
                              {person.visibility && (
                                <Badge className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 text-[10px] px-1.5 py-0">
                                  {person.visibility}
                                </Badge>
                              )}
                            </div>
                            {person.title && (
                              <p className="text-xs text-zinc-400 truncate mb-1">{person.title}</p>
                            )}
                            {person.bio && (
                              <p className="text-[10px] text-zinc-500 line-clamp-2">{person.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500 mt-1">
                              {typeof person.followersCount === "number" && (
                                <span>{person.followersCount.toLocaleString()} followers</span>
                              )}
                              {typeof person.followingCount === "number" && (
                                <span>{person.followingCount.toLocaleString()} following</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                            navigateToProfile(person.userId)
                            }}
                            className="bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 h-8 px-3 text-xs rounded-lg flex-shrink-0"
                          >
                            View profile
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
