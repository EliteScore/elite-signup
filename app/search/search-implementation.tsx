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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
const RESUME_SCORES_API_BASE_URL = "https://elite-challenges-xp-c57c556a0fd2.herokuapp.com/"
const COMMUNITIES_API_BASE_URL = "https://elitescore-social-4046880acb02.herokuapp.com/"

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
  profilePictureUrl?: string | null
  profilePicture?: string | null
  avatarUrl?: string | null
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
  resumeScore: number | null
}

type CommunitySearchResult = {
  id: number
  name: string
  slug?: string
  visibility?: string
  description?: string
  is_pro?: boolean
  members?: number
  image?: string | null
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
    resumeScore: null, // Will be enriched later
  }
}



const getSearchUrl = (input: string) => {
  const trimmed = input.trim()
  const encoded = encodeURIComponent(trimmed)
  const url = `${API_BASE_URL}v1/users/search/${encoded}`
  console.log("[Search] Constructed URL:", url)
  return url
}

const COMMUNITY_SEARCH_DEFAULT_LIMIT = 20

const sanitizeVisibilityFilter = (value?: string): string | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "public" || normalized === "private") {
    return normalized
  }
  return undefined
}

const clampCommunityLimit = (value?: number) => {
  if (value == null) return COMMUNITY_SEARCH_DEFAULT_LIMIT
  if (Number.isNaN(value)) return COMMUNITY_SEARCH_DEFAULT_LIMIT
  return Math.min(50, Math.max(1, value))
}

const getCommunitySearchUrl = (
  input: string,
  options?: {
    limit?: number
    name?: string
    slug?: string
    visibility?: string
    is_pro?: boolean
  },
) => {
  const trimmed = input.trim() || "_"
  const encoded = encodeURIComponent(trimmed)
  const searchParams = new URLSearchParams()
  const limit = clampCommunityLimit(options?.limit)
  searchParams.set("limit", limit.toString())

  if (options?.name) {
    searchParams.set("name", options.name.trim())
  }

  if (options?.slug) {
    searchParams.set("slug", options.slug.trim())
  }

  const visibility = sanitizeVisibilityFilter(options?.visibility)
  if (visibility) {
    searchParams.set("visibility", visibility)
  }

  if (options?.is_pro !== undefined) {
    searchParams.set("is_pro", options.is_pro ? "true" : "false")
  }

  const queryString = searchParams.toString()
  const url = `${COMMUNITIES_API_BASE_URL}v1/communities/search/${encoded}${queryString ? `?${queryString}` : ""}`
  console.log("[Search] Community search URL constructed:", url)
  return url
}

const parseBooleanFlag = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true" || normalized === "1") return true
    if (normalized === "false" || normalized === "0") return false
  }
  return undefined
}

const normalizeCommunityResult = (raw: any): CommunitySearchResult | null => {
  if (!raw || typeof raw !== "object") return null
  const rawId = raw.id ?? raw.communityId ?? raw.community_id
  const id = Number(rawId)
  if (!Number.isFinite(id)) return null

  const rawName = typeof raw.name === "string" && raw.name.trim()
    ? raw.name.trim()
    : raw.slug ?? raw.community_slug ?? `Community ${id}`

  const slugCandidate = raw.slug ?? raw.community_slug ?? raw.slugified
  const slug = typeof slugCandidate === "string" ? slugCandidate : undefined
  const visibility = typeof raw.visibility === "string" ? raw.visibility.toUpperCase() : undefined
  const description = typeof raw.description === "string"
    ? raw.description
    : typeof raw.summary === "string"
      ? raw.summary
      : undefined

  const membersValue =
    Number(raw.members ?? raw.members_count ?? raw.member_count ?? raw.membersCount)
  const members = Number.isFinite(membersValue) ? membersValue : undefined

  const isPro = parseBooleanFlag(raw.is_pro ?? raw.isPro ?? raw.pro)

  return {
    id,
    name: rawName,
    slug,
    visibility,
    description,
    members,
    is_pro: isPro,
  }
}

// Fetch profile picture for a user using the new endpoint
async function fetchUserProfilePicture(userId: number): Promise<string | null> {
  const token = getStoredAccessToken()
  if (!token) {
    return null
  }

  try {
    // Check cache first
    const cacheKey = `profile.picture.${userId}`
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          const cacheAge = Date.now() - (cachedData.timestamp || 0)
          const oneHour = 60 * 60 * 1000
          
          if (cacheAge < oneHour && cachedData.dataUrl) {
            console.log(`[Search] Using cached profile picture for user ${userId}`)
            return cachedData.dataUrl
          } else {
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch raw image directly (skip metadata check for speed)
    console.log(`[Search] Fetching profile picture for user ${userId}`)
    const imageResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (imageResponse.ok) {
      const imageData = await imageResponse.json()
      // Check if response indicates default picture
      if (imageData.default) {
        // Default picture, no custom image
        return null
      } else if (imageData.dataUrl) {
        // Cache the image
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              dataUrl: imageData.dataUrl,
              timestamp: Date.now(),
            }))
          } catch (e) {
            // Ignore cache write errors
          }
        }
        return imageData.dataUrl
      }
    }
    
    return null
  } catch (error) {
    console.warn(`[Search] Error fetching profile picture for user ${userId}:`, error)
    return null
  }
}

// Fetch profile pictures in parallel for all users (much faster)
async function fetchAllProfilePictures(userIds: number[]): Promise<Map<number, string | null>> {
  const token = getStoredAccessToken()
  if (!token || userIds.length === 0) {
    return new Map()
  }

  console.log(`[Search] Fetching profile pictures in parallel for ${userIds.length} users`)

  // Check cache for all users first
  const cacheResults = new Map<number, string | null>()
  const usersToFetch: number[] = []

  if (typeof window !== "undefined") {
    userIds.forEach(userId => {
      const cacheKey = `profile.picture.${userId}`
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const cachedData = JSON.parse(cached)
          const cacheAge = Date.now() - (cachedData.timestamp || 0)
          const oneHour = 60 * 60 * 1000
          
          if (cacheAge < oneHour && cachedData.dataUrl) {
            cacheResults.set(userId, cachedData.dataUrl)
            return
          } else {
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (e) {
        // Invalid cache, continue
      }
      usersToFetch.push(userId)
    })
  } else {
    usersToFetch.push(...userIds)
  }

  if (usersToFetch.length === 0) {
    console.log(`[Search] All profile pictures found in cache`)
    return cacheResults
  }

  // Fetch all missing pictures in parallel
  const fetchPromises = usersToFetch.map(async (userId) => {
    try {
      const imageResponse = await fetch(`/api/user/profile/pfp/${userId}/raw`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (imageResponse.ok) {
        const imageData = await imageResponse.json()
        if (imageData.dataUrl) {
          // Cache the image
          if (typeof window !== "undefined") {
            try {
              const cacheKey = `profile.picture.${userId}`
              localStorage.setItem(cacheKey, JSON.stringify({
                dataUrl: imageData.dataUrl,
                timestamp: Date.now(),
              }))
            } catch (e) {
              // Ignore cache write errors
            }
          }
          return { userId, image: imageData.dataUrl }
        }
      }
      return { userId, image: null }
    } catch (error) {
      console.warn(`[Search] Error fetching profile picture for user ${userId}:`, error)
      return { userId, image: null }
    }
  })

  const fetchedResults = await Promise.all(fetchPromises)
  fetchedResults.forEach(({ userId, image }) => {
    cacheResults.set(userId, image)
  })

  console.log(`[Search] Fetched ${fetchedResults.filter(r => r.image).length} profile pictures`)
  return cacheResults
}

// Enrich base search results with extra profile data (especially pictures) from get_profile
async function enrichResultsWithProfiles(results: SearchResult[]): Promise<SearchResult[]> {
  const token = getStoredAccessToken()
  if (!token) {
    console.log("[Search] No token available, skipping enrichment")
    return results
  }

  if (results.length === 0) {
    return results
  }

  console.log("[Search] Enriching", results.length, "results with profile data")

  // Fetch all profile pictures in parallel first (fastest approach)
  const userIds = results.map(r => r.userId)
  const pictureMap = await fetchAllProfilePictures(userIds)

  // Now enrich with profile data in parallel (but skip if we already have a picture)
  return Promise.all(
    results.map(async (user) => {
      // If we already have a picture from the parallel fetch, use it
      const cachedPicture = pictureMap.get(user.userId)
      if (cachedPicture) {
        return {
          ...user,
          image: cachedPicture,
        }
      }

      // Otherwise, try to get picture from profile data (but don't wait for it if slow)
      try {
        const url = `${API_BASE_URL}v1/users/profile/get_profile/${user.userId}`

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (resp.ok) {
          const result = await resp.json()
          const profile = result?.data || result
          if (profile) {
            const picture = resolvePictureFromApiProfile(profile)
            if (picture) {
              return {
                ...user,
                image: picture,
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors, use existing image
      }

      return {
        ...user,
        image: user.image,
      }
    }),
  )
}

// Fetch resume scores for multiple users
async function enrichResultsWithResumeScores(results: SearchResult[]): Promise<SearchResult[]> {
  const token = getStoredAccessToken()
  if (!token) {
    console.log("[Search] No token available, skipping resume scores enrichment")
    return results
  }

  if (results.length === 0) {
    return results
  }

  console.log("[Search] Enriching", results.length, "results with resume scores")

  return Promise.all(
    results.map(async (user) => {
      try {
        const url = `${RESUME_SCORES_API_BASE_URL}v1/users/resume-scores/${user.userId}`

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!resp.ok) {
          // 404 means no resume score, which is fine
          if (resp.status === 404) {
            console.log(`[Search] No resume score found for user ${user.userId}`)
            return { ...user, resumeScore: null }
          }
          console.warn(`[Search] Resume score fetch failed for user ${user.userId}:`, resp.status, resp.statusText)
          return { ...user, resumeScore: null }
        }

        let result
        try {
          result = await resp.json()
        } catch (parseError) {
          console.warn(`[Search] Failed to parse resume score response for user ${user.userId}:`, parseError)
          return { ...user, resumeScore: null }
        }

        // Handle wrapped response
        const data = result?.data || result
        const score = data?.overall_score || null

        return {
          ...user,
          resumeScore: typeof score === 'number' ? score : null,
        }
      } catch (error) {
        // swallow errors; continue without resume score
        console.warn(`[Search] Resume score enrichment error for user ${user.userId}:`, error)
        return { ...user, resumeScore: null }
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
  const [communityResults, setCommunityResults] = useState<CommunitySearchResult[]>([])
  const [ownUserId, setOwnUserId] = useState<number | null>(null)
  const [ownFollowingIds, setOwnFollowingIds] = useState<number[] | null>(null)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [modalProfiles, setModalProfiles] = useState<ProfileInfo[]>([])
  const [isLoadingModalProfiles, setIsLoadingModalProfiles] = useState(false)
  const [modalTargetUserId, setModalTargetUserId] = useState<number | null>(null)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunitySearchResult | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [isMember, setIsMember] = useState<Map<number, boolean>>(new Map())

  useEffect(() => {
    if (ownUserId !== null) return

    async function fetchOwnId() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}v1/users/profile/get_own_profile`, {
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

  // Fetch own following list (to show follow/unfollow state in modals)
  useEffect(() => {
    if (!ownUserId) return

    async function fetchOwnFollowing() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}v1/users/get_own_following`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          const followingData: number[] = result?.data || []
          setOwnFollowingIds(Array.isArray(followingData) ? followingData : [])
        }
      } catch (error) {
        console.warn("[Search] Failed to fetch own following:", error)
      }
    }

    fetchOwnFollowing()
  }, [ownUserId])

  const navigateToProfile = (userId: number) => {
    if (ownUserId !== null && userId === ownUserId) {
      router.push("/profile")
    } else {
      router.push(`/profile?userId=${userId}`)
    }
  }

  // Fetch followers/following IDs for a specific user (public endpoints)
  const fetchUserFollowersIds = async (userId: number): Promise<number[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}v1/users/getFollowers/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        const followersData: number[] = result?.data || []
        return Array.isArray(followersData) ? followersData : []
      }
      return []
    } catch (error) {
      console.warn(`[Search] Failed to fetch followers for user ${userId}:`, error)
      return []
    }
  }

  const fetchUserFollowingIds = async (userId: number): Promise<number[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}v1/users/getFollowing/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        const followingData: number[] = result?.data || []
        return Array.isArray(followingData) ? followingData : []
      }
      return []
    } catch (error) {
      console.warn(`[Search] Failed to fetch following for user ${userId}:`, error)
      return []
    }
  }

  // Fetch profiles for user IDs
  const fetchProfilesForUserIds = async (userIds: number[]) => {
    if (userIds.length === 0) {
      setModalProfiles([])
      return
    }

    setIsLoadingModalProfiles(true)
    try {
      const token = getStoredAccessToken()

      // Fetch all profiles in parallel
      const profilePromises = userIds.map(async (userId) => {
        try {
          const url = token
            ? `${API_BASE_URL}v1/users/profile/get_profile/${userId}`
            : `${API_BASE_URL}v1/users/profile/get_profile/${userId}`

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          }
          if (token) {
            headers.Authorization = `Bearer ${token}`
          }

          const response = await fetch(url, {
            method: "GET",
            headers,
          })

          if (response.ok) {
            const result = await response.json()
            const profile = result?.data || result
            return profile as ProfileInfo
          }
          return null
        } catch (error) {
          console.warn(`[Search] Failed to fetch profile for user ${userId}:`, error)
          return null
        }
      })

      const profiles = await Promise.all(profilePromises)
      const validProfiles = profiles.filter((p): p is ProfileInfo => p !== null)
      setModalProfiles(validProfiles)
    } catch (error) {
      console.error("[Search] Error fetching modal profiles:", error)
      setModalProfiles([])
    } finally {
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle opening followers modal
  const handleOpenFollowersModal = async (userId: number) => {
    console.log("[Search] Opening followers modal for user:", userId)
    setModalTargetUserId(userId)
    setShowFollowersModal(true)
    setModalProfiles([]) // Clear previous profiles
    setIsLoadingModalProfiles(true)
    
    try {
      const followerIds = await fetchUserFollowersIds(userId)
      console.log("[Search] Fetched follower IDs:", followerIds.length)
      await fetchProfilesForUserIds(followerIds)
    } catch (error) {
      console.error("[Search] Error opening followers modal:", error)
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle opening following modal
  const handleOpenFollowingModal = async (userId: number) => {
    console.log("[Search] Opening following modal for user:", userId)
    setModalTargetUserId(userId)
    setShowFollowingModal(true)
    setModalProfiles([]) // Clear previous profiles
    setIsLoadingModalProfiles(true)
    
    try {
      const followingIds = await fetchUserFollowingIds(userId)
      console.log("[Search] Fetched following IDs:", followingIds.length)
      await fetchProfilesForUserIds(followingIds)
    } catch (error) {
      console.error("[Search] Error opening following modal:", error)
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle follow/unfollow in modal
  const handleToggleFollowInModal = async (userId: number, isCurrentlyFollowing: boolean) => {
    if (isUpdatingFollow) return

    const token = getStoredAccessToken()
    if (!token) {
      console.warn("[Search] No token available for follow/unfollow in modal")
      return
    }

    setIsUpdatingFollow(true)

    const endpoint = isCurrentlyFollowing
      ? `${API_BASE_URL}v1/users/unfollow`
      : `${API_BASE_URL}v1/users/follow`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Update local following list
        setOwnFollowingIds((prev) => {
          const current = Array.isArray(prev) ? prev : []
          if (isCurrentlyFollowing) {
            return current.filter((id) => id !== userId)
          } else {
            if (!current.includes(userId)) {
              return [...current, userId]
            }
            return current
          }
        })

        // If unfollowing, remove from modal profiles if in "Following" modal
        if (isCurrentlyFollowing && showFollowingModal) {
          setModalProfiles((prev) => prev.filter((p) => p.userId !== userId))
        }
      } else {
        console.warn("[Search] Follow/unfollow failed in modal:", response.status)
      }
    } catch (error) {
      console.warn("[Search] Error during follow/unfollow in modal:", error)
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  const fetchCommunitySearchResults = useCallback(async (query: string, headers: Record<string, string>) => {
    const url = getCommunitySearchUrl(query)

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      })

      console.log("[Search] Community response status:", response.status, response.statusText)

      if (!response.ok) {
        console.warn("[Search] Community search failed with status:", response.status)
        setCommunityResults([])
        return
      }

      let payload: any = null
      try {
        payload = await response.json()
      } catch (parseError) {
        console.warn("[Search] Failed to parse community search response:", parseError)
      }

      if (!payload) {
        console.warn("[Search] Empty community payload")
        setCommunityResults([])
        return
      }

      // Check for API success flag if present
      if (payload.success === false) {
        console.warn("[Search] Community search API returned success: false", payload.message)
        setCommunityResults([])
        return
      }

      const listSource = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : []
      
      console.log("[Search] Raw community results count:", listSource.length)

      const normalizedResults = listSource
        .map((item: any) => normalizeCommunityResult(item))
        .filter((entry: any): entry is CommunitySearchResult => entry !== null)

      console.log("[Search] Normalized community results:", normalizedResults.length)
      setCommunityResults(normalizedResults)
    } catch (error) {
      console.warn("[Search] Community search error:", error)
      setCommunityResults([])
    }
  }, [])

  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setCommunityResults([])
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

      console.log("[Search] Making request to:", url)
      console.log("[Search] Query:", trimmedQuery)
      console.log("[Search] Encoded:", encodeURIComponent(trimmedQuery))
      console.log("[Search] Has token:", !!token)
      console.log("[Search] Token preview:", token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : "none")
      console.log("[Search] Headers:", { ...headers, Authorization: token ? "Bearer ***" : "none" })

      // Add timeout and better error handling for production
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      let response: Response
      try {
        response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            throw new Error("Search request timed out. Please try again.")
          }
          if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
            console.error("[Search] Network/CORS error detected:", fetchError)
            throw new Error("Cannot connect to search API. This may be a CORS or network issue.")
          }
        }
        console.error("[Search] Fetch error:", fetchError)
        throw fetchError
      }

      console.log("[Search] Response status:", response.status, response.statusText)
      console.log("[Search] Response ok:", response.ok)

      // Handle 204 No Content explicitly
      if (response.status === 204) {
        console.log("[Search] No content (204) - no results found")
        setSearchResults([])
        setCommunityResults([])
        setSearchError(null)
        await fetchCommunitySearchResults(trimmedQuery, { ...headers })
        setIsSearching(false)
        return
      }

      // Check if response is OK before parsing
      if (!response.ok) {
        let errorMessage = `Search failed with status ${response.status}`
        try {
          const errorText = await response.text()
          console.warn("[Search] Error response text:", errorText)
          if (errorText && errorText.trim()) {
            try {
              const errorPayload = JSON.parse(errorText)
              errorMessage = errorPayload?.message || errorPayload?.error || errorMessage
              console.warn("[Search] Parsed error payload:", errorPayload)
            } catch (parseError) {
              // If it's not JSON, use the text as error message
              errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText
            }
          }
        } catch (readError) {
          console.warn("[Search] Could not read error response:", readError)
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      let payload: ApiResponse<ProfileInfo[]> | null = null
      let responseText: string | null = null
      
      // Check content type
      const contentType = response.headers.get("content-type")
      console.log("[Search] Response content-type:", contentType)
      
      try {
        responseText = await response.text()
        console.log("[Search] Response text length:", responseText?.length || 0)
        console.log("[Search] Response text:", responseText)
      } catch (readError) {
        console.error("[Search] Failed to read response text:", readError)
        throw new Error("Failed to read server response")
      }
      
      if (!responseText || responseText.trim() === "") {
        console.warn("[Search] Empty response body")
        setSearchResults([])
        setCommunityResults([])
        setIsSearching(false)
        return
      }

      // Only try to parse as JSON if content-type indicates JSON or if it looks like JSON
      const isJsonContent = contentType?.includes("application/json") || 
                           contentType?.includes("text/json") ||
                           (responseText.trim().startsWith("{") || responseText.trim().startsWith("["))

      if (!isJsonContent) {
        console.warn("[Search] Response is not JSON, content-type:", contentType)
        // If it's not JSON but we got a 200, treat as empty results
        setSearchResults([])
        setCommunityResults([])
        setIsSearching(false)
        return
      }

      try {
        payload = JSON.parse(responseText) as ApiResponse<ProfileInfo[]>
        console.log("[Search] Parsed payload:", {
          success: payload?.success,
          message: payload?.message,
          hasData: !!payload?.data,
          dataType: Array.isArray(payload?.data) ? 'array' : typeof payload?.data,
          dataLength: Array.isArray(payload?.data) ? payload.data.length : 0,
        })
        if (payload?.data && Array.isArray(payload.data) && payload.data.length === 0) {
          console.warn("[Search] Backend returned empty array - no users found matching query:", trimmedQuery)
        }
      } catch (parseError) {
        console.error("[Search] Failed to parse JSON:", parseError)
        console.error("[Search] Response text (first 200 chars):", responseText.substring(0, 200))
        throw new Error(`Invalid response format: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
      }

      if (payload?.success && payload.data) {
        if (payload.data.length === 0) {
          console.log("[Search] API returned success but empty data array")
          setSearchResults([])
          return
        }
        
        const mappedResults = payload.data.map(mapProfileInfoToResult)
        console.log("[Search] Mapped results:", mappedResults.length)
        console.log("[Search] Sample result:", mappedResults[0])
        
        // Deduplicate by userId (keep the most complete profile - prefer ones with images)
        const userMap = new Map<number, SearchResult>()
        
        for (const result of mappedResults) {
          const existing = userMap.get(result.userId)
          
          if (!existing) {
            userMap.set(result.userId, result)
          } else {
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
        console.log("[Search] Deduplicated results:", dedupedResults.length)

        // Fetch profile pictures and resume scores in parallel for speed
        const [enrichedResults, resultsWithScores] = await Promise.all([
          enrichResultsWithProfiles(dedupedResults),
          enrichResultsWithResumeScores(dedupedResults),
        ])
        
        // Merge profile pictures into results with scores
        const finalResults = resultsWithScores.map(result => {
          const enriched = enrichedResults.find(r => r.userId === result.userId)
          return {
            ...result,
            image: enriched?.image ?? result.image,
          }
        })
        
        console.log("[Search] Final results with pictures and scores:", finalResults.length)
        setSearchResults(finalResults)
        await fetchCommunitySearchResults(trimmedQuery, { ...headers })
      } else {
        console.log("[Search] No results in payload:", {
          success: payload?.success,
          hasData: !!payload?.data,
          message: payload?.message,
        })
        setSearchResults([])
      }
    } catch (error) {
      console.error("[Search] Search error:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "We couldn't complete your search. Please try again."
      setSearchError(errorMessage)
      setSearchResults([])
      setCommunityResults([])
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
  const filteredCommunities = communityResults
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
                                <button
                                  type="button"
                                  className={cn(
                                    "text-left bg-transparent border-none p-0 m-0 text-[10px] text-zinc-500",
                                    person.followersCount > 0 
                                      ? "cursor-pointer hover:text-zinc-400 transition-colors underline decoration-dotted underline-offset-2" 
                                      : "cursor-default"
                                  )}
                                  style={{ 
                                    font: 'inherit',
                                    outline: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    console.log("[Search] Clicked followers for user:", person.userId, "count:", person.followersCount)
                                    if (person.followersCount && person.followersCount > 0) {
                                      handleOpenFollowersModal(person.userId)
                                    }
                                  }}
                                  disabled={!person.followersCount || person.followersCount === 0}
                                >
                                  {person.followersCount.toLocaleString()} followers
                                </button>
                              )}
                              {typeof person.followingCount === "number" && (
                                <button
                                  type="button"
                                  className={cn(
                                    "text-left bg-transparent border-none p-0 m-0 text-[10px] text-zinc-500",
                                    person.followingCount > 0 
                                      ? "cursor-pointer hover:text-zinc-400 transition-colors underline decoration-dotted underline-offset-2" 
                                      : "cursor-default"
                                  )}
                                  style={{ 
                                    font: 'inherit',
                                    outline: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    console.log("[Search] Clicked following for user:", person.userId, "count:", person.followingCount)
                                    if (person.followingCount && person.followingCount > 0) {
                                      handleOpenFollowingModal(person.userId)
                                    }
                                  }}
                                  disabled={!person.followingCount || person.followingCount === 0}
                                >
                                  {person.followingCount.toLocaleString()} following
                                </button>
                              )}
                              {typeof person.resumeScore === "number" && (
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <Trophy className="h-3 w-3" />
                                  Resume: {person.resumeScore}
                                </span>
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
              {showCommunities && filteredCommunities.length > 0 && (
                <div>
                  {showCommunities && (
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3 px-1">COMMUNITIES</h2>
                  )}
                  <div className="space-y-3">
                    {filteredCommunities.map((community) => (
                      <motion.div
                        key={`community-${community.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:bg-zinc-850 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {community.image && (
                            <Avatar className="h-12 w-12 border border-zinc-800 flex-shrink-0">
                              <AvatarImage src={community.image} alt={community.name} />
                              <AvatarFallback className="bg-zinc-800 text-white font-semibold">
                                {community.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-white text-sm truncate">{community.name}</h3>
                              <div className="flex items-center gap-1 flex-wrap">
                                {community.visibility && (
                                  <Badge className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 text-[10px] px-1.5 py-0">
                                    {community.visibility.toUpperCase()}
                                  </Badge>
                                )}
                                {community.is_pro !== undefined && (
                                  <Badge className="bg-purple-900/40 text-purple-300 border-purple-800 text-[10px] px-1.5 py-0">
                                    {community.is_pro ? "Pro" : "Standard"}
                                  </Badge>
              )}
            </div>
                            </div>
                            {community.slug && (
                              <p className="text-[11px] text-blue-400">/{community.slug}</p>
                            )}
                            {community.description && (
                              <p className="text-[10px] sm:text-[11px] text-zinc-500 line-clamp-2">{community.description}</p>
                            )}
                          </div>
                          <div className="text-right text-[10px] text-zinc-400">
                            {community.members !== undefined && (
                              <p>{community.members.toLocaleString()} members</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <div className="text-[10px] text-zinc-500">
                            {community.description ? "Community details" : "No description available"}
                          </div>
                          <EnhancedButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCommunity(community)
                              setShowJoinModal(true)
                              setJoinError(null)
                              setJoinMessage("")
                            }}
                            className="bg-transparent border border-zinc-700 text-white hover:bg-zinc-800 h-9 px-3 text-xs rounded-full"
                          >
                            {isMember.get(community.id) ? "View community" : "Join community"}
                          </EnhancedButton>
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

      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800 pb-3">Followers</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {isLoadingModalProfiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : modalProfiles.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">No followers yet</div>
            ) : (
              <div className="space-y-2">
                {modalProfiles.map((profile) => {
                  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || `User ${profile.userId}`
                  const profilePic = pickFirstValidPicture(
                    profile.profilePictureUrl,
                    profile.profilePicture,
                    profile.avatarUrl
                  )
                  const isFollowing = ownFollowingIds?.includes(profile.userId) || false
                  const isOwnProfile = profile.userId === ownUserId

                  return (
                    <div
                      key={profile.userId}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => {
                        setShowFollowersModal(false)
                        navigateToProfile(profile.userId)
                      }}
                    >
                      <Avatar className="h-11 w-11 border border-zinc-800">
                        <AvatarImage src={profilePic || undefined} alt={fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{fullName}</h3>
                        {profile.bio && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{profile.bio}</p>
                        )}
                      </div>
                      {!isOwnProfile && (
                        <EnhancedButton
                          size="sm"
                          rounded="full"
                          variant={isFollowing ? "outline" : "gradient"}
                          animation={isFollowing ? undefined : "shimmer"}
                          className={cn(
                            "px-4 py-1.5 text-xs font-bold flex-shrink-0",
                            isFollowing
                              ? "border-zinc-600 text-zinc-200 bg-transparent"
                              : "bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          )}
                          disabled={isUpdatingFollow}
                          isLoading={isUpdatingFollow}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFollowInModal(profile.userId, isFollowing)
                          }}
                        >
                          {isFollowing ? "Unfollow" : "Follow"}
                        </EnhancedButton>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800 pb-3">Following</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {isLoadingModalProfiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : modalProfiles.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">Not following anyone yet</div>
            ) : (
              <div className="space-y-2">
                {modalProfiles.map((profile) => {
                  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || `User ${profile.userId}`
                  const profilePic = pickFirstValidPicture(
                    profile.profilePictureUrl,
                    profile.profilePicture,
                    profile.avatarUrl
                  )
                  const isFollowing = ownFollowingIds?.includes(profile.userId) || false
                  const isOwnProfile = profile.userId === ownUserId

                  return (
                    <div
                      key={profile.userId}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => {
                        setShowFollowingModal(false)
                        navigateToProfile(profile.userId)
                      }}
                    >
                      <Avatar className="h-11 w-11 border border-zinc-800">
                        <AvatarImage src={profilePic || undefined} alt={fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{fullName}</h3>
                        {profile.bio && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{profile.bio}</p>
                        )}
                      </div>
                      {!isOwnProfile && (
                        <EnhancedButton
                          size="sm"
                          rounded="full"
                          variant={isFollowing ? "outline" : "gradient"}
                          animation={isFollowing ? undefined : "shimmer"}
                          className={cn(
                            "px-4 py-1.5 text-xs font-bold flex-shrink-0",
                            isFollowing
                              ? "border-zinc-600 text-zinc-200 bg-transparent"
                              : "bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                          )}
                          disabled={isUpdatingFollow}
                          isLoading={isUpdatingFollow}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFollowInModal(profile.userId, isFollowing)
                          }}
                        >
                          {isFollowing ? "Unfollow" : "Follow"}
                        </EnhancedButton>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Community Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800 pb-3">
              {selectedCommunity && isMember.get(selectedCommunity.id) 
                ? "View Community" 
                : selectedCommunity?.visibility?.toLowerCase() === "private"
                  ? "Request to Join"
                  : "Join Community"}
            </DialogTitle>
          </DialogHeader>
          {selectedCommunity && (
            <div className="mt-4 space-y-4">
              {/* Community Info */}
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                {selectedCommunity.image && (
                  <Avatar className="h-16 w-16 border border-zinc-700">
                    <AvatarImage src={selectedCommunity.image} alt={selectedCommunity.name} />
                    <AvatarFallback className="bg-zinc-800 text-white font-semibold">
                      {selectedCommunity.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-base truncate">{selectedCommunity.name}</h3>
                  {selectedCommunity.slug && (
                    <p className="text-xs text-blue-400">/{selectedCommunity.slug}</p>
                  )}
                  {selectedCommunity.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{selectedCommunity.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {selectedCommunity.visibility && (
                      <Badge className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 text-[10px] px-1.5 py-0">
                        {selectedCommunity.visibility.toUpperCase()}
                      </Badge>
                    )}
                    {selectedCommunity.members !== undefined && (
                      <span className="text-xs text-zinc-500">{selectedCommunity.members.toLocaleString()} members</span>
                    )}
                  </div>
                </div>
              </div>

              {isMember.get(selectedCommunity.id) ? (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-300 mb-4">You are already a member of this community!</p>
                  <EnhancedButton
                    size="sm"
                    variant="gradient"
                    onClick={() => {
                      setShowJoinModal(false)
                      router.push(`/for-you?communityId=${selectedCommunity.id}`)
                    }}
                    className="w-full"
                  >
                    View Community
                  </EnhancedButton>
                </div>
              ) : (
                <>
                  {selectedCommunity.visibility?.toLowerCase() === "private" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Message (required for private communities)
                      </label>
                      <textarea
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        placeholder="Tell the community why you'd like to join..."
                        className="w-full h-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  )}

                  {joinError && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-xs text-red-300">
                      {joinError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <EnhancedButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowJoinModal(false)
                        setJoinError(null)
                        setJoinMessage("")
                      }}
                      className="flex-1"
                      disabled={isJoining}
                    >
                      Cancel
                    </EnhancedButton>
                    <EnhancedButton
                      size="sm"
                      variant="gradient"
                      onClick={async () => {
                        if (!selectedCommunity) return
                        
                        if (selectedCommunity.visibility?.toLowerCase() === "private" && !joinMessage.trim()) {
                          setJoinError("Message is required for private communities")
                          return
                        }

                        setIsJoining(true)
                        setJoinError(null)

                        try {
                          const token = getStoredAccessToken()
                          if (!token) {
                            setJoinError("Authentication required")
                            setIsJoining(false)
                            return
                          }

                          // Always send a body: empty object {} for public communities, or { message: "..." } for private
                          const requestBody = selectedCommunity.visibility?.toLowerCase() === "private"
                            ? { message: joinMessage.trim() }
                            : {}

                          console.log("[Search] Joining community with body:", requestBody)

                          const response = await fetch(`/api/communities/${selectedCommunity.id}/join`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(requestBody),
                          })

                          if (!response.ok) {
                            let errorMessage = "Failed to join community"
                            const errorText = await response.text()
                            
                            if (errorText) {
                              try {
                                const errorData = JSON.parse(errorText)
                                errorMessage = errorData.message || errorData.error || errorData.details || errorMessage
                              } catch {
                                errorMessage = errorText
                              }
                            }

                            setJoinError(errorMessage)
                            setIsJoining(false)
                            return
                          }

                          // Success - update membership status
                          setIsMember(prev => new Map(prev).set(selectedCommunity.id, true))
                          setShowJoinModal(false)
                          setJoinError(null)
                          setJoinMessage("")
                          
                          // Navigate to community page
                          router.push(`/for-you?communityId=${selectedCommunity.id}`)
                        } catch (error) {
                          console.error("[Search] Error joining community:", error)
                          setJoinError(error instanceof Error ? error.message : "An unexpected error occurred")
                        } finally {
                          setIsJoining(false)
                        }
                      }}
                      className="flex-1"
                      disabled={isJoining || (selectedCommunity.visibility?.toLowerCase() === "private" && !joinMessage.trim())}
                      isLoading={isJoining}
                    >
                      {selectedCommunity.visibility?.toLowerCase() === "private" ? "Send Request" : "Join"}
                    </EnhancedButton>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
