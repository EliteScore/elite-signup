"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Users, Trophy, Hash, Bell, Clock, Globe, Lock, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getStoredAccessToken } from "@/lib/auth-storage"

// Import types and utilities from separate files
import { 
  API_BASE_URL, 
  RESUME_SCORES_API_BASE_URL, 
  COMMUNITIES_API_BASE_URL,
  type ProfileInfo, 
  type SearchResult, 
  type CommunitySearchResult,
  type ApiResponse
} from "./types"
import {
  mapProfileInfoToResult,
  getSearchUrl,
  getCommunitySearchUrl,
  normalizeCommunityResult,
  enrichResultsWithProfiles,
  enrichResultsWithResumeScores,
  pickFirstValidPicture,
} from "./utils"

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "people" | "communities">("all")
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
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set())
  const [communityDetails, setCommunityDetails] = useState<any>(null)
  const [isLoadingCommunityDetails, setIsLoadingCommunityDetails] = useState(false)
  const [communityAnnouncements, setCommunityAnnouncements] = useState<any[]>([])
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)
  const [communityMembers, setCommunityMembers] = useState<any[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [communityViewTab, setCommunityViewTab] = useState<"overview" | "announcements" | "members">("overview")
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [searchTags, setSearchTags] = useState<string[]>([])
  const [tagSearchMode, setTagSearchMode] = useState<"any" | "all">("any")
  const [communityProfilePictures, setCommunityProfilePictures] = useState<Map<number, string>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

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
        // Ignore error
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
        // Ignore error
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

  // Check if user has a pending request for a community
  const checkPendingRequest = async (communityId: number) => {
    try {
      const token = getStoredAccessToken()
      if (!token) return false

      // Check if user is a member first
      const ownResponse = await fetch('/api/communities/own', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (ownResponse.ok) {
        const ownData = await ownResponse.json()
        const rawIds = ownData?.community_ids ?? ownData?.data?.community_ids ?? []
        const normalizedIds = Array.isArray(rawIds)
          ? Array.from(new Set(rawIds.map((id: number | string) => Number(id)).filter((id) => !Number.isNaN(id))))
          : []
        
        const isMemberOfCommunity = normalizedIds.includes(communityId)
        
        if (!isMemberOfCommunity) {
          // Not a member - try to check if there's a pending request by attempting to fetch members
          // (which requires membership and will return 403 if not a member and no pending request)
          // Actually, we can't reliably detect pending requests this way
          // So we'll rely on the state and backend responses
          return false
        }
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Fetch full community details
  const fetchCommunityDetails = async (communityId: number) => {
    setIsLoadingCommunityDetails(true)
    try {
      const token = getStoredAccessToken()
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCommunityDetails(data?.data || data)
        
        // Also fetch announcements and members if public or if member
        const isMemberOfCommunity = isMember.get(communityId)
        const community = data?.data || data
        const isPublic = community?.visibility?.toLowerCase() === 'public'
        
        if (isPublic || isMemberOfCommunity) {
          fetchCommunityAnnouncements(communityId)
          fetchCommunityMembers(communityId)
        }
      }
    } catch (error) {
      // Ignore error
    } finally {
      setIsLoadingCommunityDetails(false)
    }
  }

  // Fetch community announcements
  const fetchCommunityAnnouncements = async (communityId: number) => {
    setIsLoadingAnnouncements(true)
    try {
      const token = getStoredAccessToken()
      if (!token) return

      const response = await fetch(`/api/communities/${communityId}/announcements`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const announcements = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        setCommunityAnnouncements(announcements.slice(0, 5)) // Show only first 5
      }
    } catch (error) {
      // Ignore error
    } finally {
      setIsLoadingAnnouncements(false)
    }
  }

  // Fetch community members
  const fetchCommunityMembers = async (communityId: number) => {
    setIsLoadingMembers(true)
    try {
      const token = getStoredAccessToken()
      if (!token) return

      // First get member IDs
      const idsResponse = await fetch(`/api/communities/${communityId}/members/ids?limit=10&offset=0`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (idsResponse.ok) {
        const idsData = await idsResponse.json()
        const userIds = idsData?.user_ids ?? idsData?.data?.user_ids ?? []
        
        // Fetch profiles for first few members
        const memberPromises = userIds.slice(0, 5).map(async (userId: number) => {
          try {
            const profileResponse = await fetch(`${API_BASE_URL}v1/users/profile/get_profile/${userId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              const profile = profileData?.data || profileData
              return {
                id: userId,
                name: profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : profile?.username || 'Member',
                image: profile?.profilePictureUrl || profile?.profilePicture || profile?.avatarUrl || null,
              }
            }
          } catch (error) {
            // Ignore error
          }
          return null
        })

        const members = (await Promise.all(memberPromises)).filter((m): m is any => m !== null)
        setCommunityMembers(members)
      }
    } catch (error) {
      // Ignore error
    } finally {
      setIsLoadingMembers(false)
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
          return null
        }
      })

      const profiles = await Promise.all(profilePromises)
      const validProfiles = profiles.filter((p): p is ProfileInfo => p !== null)
      setModalProfiles(validProfiles)
    } catch (error) {
      setModalProfiles([])
    } finally {
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle opening followers modal
  const handleOpenFollowersModal = async (userId: number) => {
    setModalTargetUserId(userId)
    setShowFollowersModal(true)
    setModalProfiles([]) // Clear previous profiles
    setIsLoadingModalProfiles(true)
    
    try {
      const followerIds = await fetchUserFollowersIds(userId)
      await fetchProfilesForUserIds(followerIds)
    } catch (error) {
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle opening following modal
  const handleOpenFollowingModal = async (userId: number) => {
    setModalTargetUserId(userId)
    setShowFollowingModal(true)
    setModalProfiles([]) // Clear previous profiles
    setIsLoadingModalProfiles(true)
    
    try {
      const followingIds = await fetchUserFollowingIds(userId)
      await fetchProfilesForUserIds(followingIds)
    } catch (error) {
      setIsLoadingModalProfiles(false)
    }
  }

  // Handle follow/unfollow in modal
  const handleToggleFollowInModal = async (userId: number, isCurrentlyFollowing: boolean) => {
    if (isUpdatingFollow) return

    const token = getStoredAccessToken()
    if (!token) {
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
        }
      } catch (error) {
        // Ignore error
      } finally {
      setIsUpdatingFollow(false)
    }
  }

  const fetchCommunitySearchResults = useCallback(async (query: string, headers: Record<string, string>, tags?: string[], tagMode?: "any" | "all") => {
    // Search communities by query text, with optional tag filters
    // Use the query text for community search, or "_" if empty (for tag-only search)
    const searchQuery = query.trim() || "_"
    
    const url = getCommunitySearchUrl(searchQuery, {
      tags: tags && tags.length > 0 ? tags : undefined,
      tagMode: tags && tags.length > 0 ? (tagMode || "any") : undefined,
    })

    console.log("[Search] ===== Fetching Communities ======")
    console.log("[Search] Query:", searchQuery)
    console.log("[Search] Tags:", tags)
    console.log("[Search] Tag Mode:", tagMode)
    console.log("[Search] URL:", url)
    console.log("[Search] Headers:", { ...headers, Authorization: headers.Authorization ? "Bearer ***" : "none" })

    try {
      const startTime = Date.now()
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: 'no-store',
      })
      const fetchDuration = Date.now() - startTime

      console.log("[Search] Community response received in", fetchDuration, "ms")
      console.log("[Search] Response status:", response.status, response.statusText)
      console.log("[Search] Response ok:", response.ok)
      console.log("[Search] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorDetails: any = null
        let errorText: string | null = null
        
        try {
          const contentType = response.headers.get('content-type')
          console.error("[Search] ERROR: Community search failed with status", response.status)
          console.error("[Search] Error response content-type:", contentType)
          
          if (contentType?.includes('application/json')) {
            errorDetails = await response.json()
            console.error("[Search] Error response (JSON):", JSON.stringify(errorDetails, null, 2))
          } else {
            errorText = await response.text()
            console.error("[Search] Error response (text):", errorText)
          }
        } catch (readError) {
          console.error("[Search] ERROR: Failed to read error response:", readError)
          errorText = response.statusText
        }

        // Check for DB error specifically
        const errorMessage = errorDetails?.error || errorDetails?.message || errorDetails?.details || errorText || response.statusText
        if (errorMessage && (errorMessage.includes('DB error') || errorMessage.includes('statement has been closed') || errorMessage.includes('statement'))) {
          console.error("[Search] ===== DATABASE ERROR DETECTED =====")
          console.error("[Search] Error message:", errorMessage)
          console.error("[Search] Full error details:", errorDetails)
          console.error("[Search] This is likely a backend database connection issue")
          
          // Set error state so user can see it
          setSearchError(`Database error: ${errorMessage}. Please try again in a moment.`)
        }
        
        setCommunityResults([])
        setCommunityProfilePictures(new Map())
        return
      }

      let payload: any = null
      try {
        const contentType = response.headers.get('content-type')
        console.log("[Search] Parsing response, content-type:", contentType)
        
        payload = await response.json()
        console.log("[Search] Response parsed successfully")
        console.log("[Search] Payload structure:", {
          hasSuccess: 'success' in payload,
          success: payload?.success,
          hasData: 'data' in payload,
          dataIsArray: Array.isArray(payload?.data),
          dataLength: Array.isArray(payload?.data) ? payload.data.length : 'N/A',
          isArray: Array.isArray(payload),
          arrayLength: Array.isArray(payload) ? payload.length : 'N/A',
        })
      } catch (parseError) {
        console.error("[Search] ERROR: Failed to parse JSON response")
        console.error("[Search] Parse error:", parseError)
        console.error("[Search] Response might be empty or invalid JSON")
        setCommunityResults([])
        setCommunityProfilePictures(new Map())
        return
      }

      if (!payload) {
        console.warn("[Search] WARNING: Empty payload received")
        setCommunityResults([])
        setCommunityProfilePictures(new Map())
        return
      }

      // Check for API success flag if present
      if (payload.success === false) {
        const errorMsg = payload.error || payload.message || payload.details || 'Unknown error'
        console.error("[Search] ERROR: API returned success: false")
        console.error("[Search] Error message:", errorMsg)
        
        // Check for DB error
        if (errorMsg.includes('DB error') || errorMsg.includes('statement has been closed') || errorMsg.includes('statement')) {
          console.error("[Search] ===== DATABASE ERROR DETECTED IN PAYLOAD =====")
          console.error("[Search] Error message:", errorMsg)
          console.error("[Search] Full payload:", JSON.stringify(payload, null, 2))
          setSearchError(`Database error: ${errorMsg}. Please try again in a moment.`)
        }
        
        setCommunityResults([])
        setCommunityProfilePictures(new Map())
        return
      }

      const listSource = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : []
      
      console.log("[Search] Raw community results count:", listSource.length)

      const normalizedResults = listSource
        .map((item: any) => normalizeCommunityResult(item))
        .filter((entry: any): entry is CommunitySearchResult => entry !== null)

      console.log("[Search] Normalized community results:", normalizedResults.length)
      
      // Clear previous profile pictures
      setCommunityProfilePictures(new Map())
      
      setCommunityResults(normalizedResults)

      // Fetch community profile pictures
      if (normalizedResults.length > 0) {
        const token = getStoredAccessToken()
        const pictureMap = new Map<number, string>()
        
        // Create URLs for all communities
        normalizedResults.forEach((community: CommunitySearchResult) => {
          if (community.id) {
            const url = `/api/communities/${community.id}/pfp/raw`
            const fullUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url
            pictureMap.set(community.id, fullUrl)
          }
        })
        
        setCommunityProfilePictures(pictureMap)
      }
      
      console.log("[Search] ===== Community Search Complete =====")
    } catch (error) {
      console.error("[Search] ===== EXCEPTION IN COMMUNITY SEARCH =====")
      console.error("[Search] Error type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("[Search] Error message:", error instanceof Error ? error.message : String(error))
      console.error("[Search] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
      
      // Check if it's a network/connection error
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('network')) {
          console.error("[Search] Network error detected - possible connection issue")
          setSearchError("Network error: Cannot connect to search service. Please check your connection and try again.")
        } else if (error.message.includes('aborted') || error.name === 'AbortError') {
          console.warn("[Search] Request was aborted (likely timeout or cancellation)")
        } else {
          console.error("[Search] Unexpected error:", error.message)
          setSearchError(`Search error: ${error.message}`)
        }
      }
      
      setCommunityResults([])
      setCommunityProfilePictures(new Map())
    }
  }, [])

  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError(null)
      // If no query but tags are present, search communities by tags only
      if (searchTags.length > 0) {
        setIsSearching(true)
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          }
          const token = getStoredAccessToken()
          if (token) {
            headers.Authorization = `Bearer ${token}`
          }
          await fetchCommunitySearchResults("", { ...headers }, searchTags, tagSearchMode)
        } catch (error) {
          setCommunityResults([])
          setCommunityProfilePictures(new Map())
        } finally {
          setIsSearching(false)
        }
      } else {
        setCommunityResults([])
        setIsSearching(false)
      }
      return
    }

    setIsSearching(true)
    setSearchError(null)

    console.log("[Search] ===== PERFORMING SEARCH ======")
    console.log("[Search] Query:", trimmedQuery)
    console.log("[Search] Tags:", searchTags)
    console.log("[Search] Tag Mode:", tagSearchMode)

    try {
      const url = getSearchUrl(trimmedQuery)
      console.log("[Search] ===== PEOPLE SEARCH API CALL =====")
      console.log("[Search] Method: GET")
      console.log("[Search] URL:", url)
      console.log("[Search] Full endpoint: GET", url)
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
      const token = getStoredAccessToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
        console.log("[Search] Authorization: Bearer token present")
      } else {
        console.log("[Search] Authorization: No token")
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Add timeout and better error handling for production
      const controller = new AbortController()
      abortControllerRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout (reduced from 30s)

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
            throw new Error("Cannot connect to search API. This may be a CORS or network issue.")
          }
        }
        throw fetchError
      }

      // Handle 204 No Content explicitly
      if (response.status === 204) {
        setSearchResults([])
        setSearchError(null)
        // Always search communities when there's a query (run in parallel)
        fetchCommunitySearchResults(trimmedQuery, { ...headers }, searchTags.length > 0 ? searchTags : undefined, tagSearchMode).catch(() => {
          // Silently handle community search errors
        })
        setIsSearching(false)
        return
      }

      // Check if response is OK before parsing
      if (!response.ok) {
        let errorMessage = `Search failed with status ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText && errorText.trim()) {
            try {
              const errorPayload = JSON.parse(errorText)
              errorMessage = errorPayload?.message || errorPayload?.error || errorMessage
            } catch (parseError) {
              // If it's not JSON, use the text as error message
              errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText
            }
          }
        } catch (readError) {
          console.log('readerr'+readError)    
        }
        throw new Error(errorMessage)
      }

      // Parse successful response
      let payload: ApiResponse<ProfileInfo[]> | null = null
      let responseText: string | null = null
      
      // Check content type
      const contentType = response.headers.get("content-type")
      
      try {
        responseText = await response.text()
      } catch (readError) {
        throw new Error("Failed to read server response")
      }
      
      if (!responseText || responseText.trim() === "") {
        setSearchResults([])
        // Always search communities when there's a query (run in parallel)
        fetchCommunitySearchResults(trimmedQuery, { ...headers }, searchTags.length > 0 ? searchTags : undefined, tagSearchMode).catch(() => {
          // Silently handle community search errors
        })
        setIsSearching(false)
        return
      }

      // Only try to parse as JSON if content-type indicates JSON or if it looks like JSON
      const isJsonContent = contentType?.includes("application/json") || 
                           contentType?.includes("text/json") ||
                           (responseText.trim().startsWith("{") || responseText.trim().startsWith("["))

      if (!isJsonContent) {
        // If it's not JSON but we got a 200, treat as empty results
        setSearchResults([])
        // Always search communities when there's a query (run in parallel)
        fetchCommunitySearchResults(trimmedQuery, { ...headers }, searchTags.length > 0 ? searchTags : undefined, tagSearchMode).catch(() => {
          // Silently handle community search errors
        })
        setIsSearching(false)
        return
      }

      try {
        payload = JSON.parse(responseText) as ApiResponse<ProfileInfo[]>
      } catch (parseError) {
        throw new Error(`Invalid response format: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
      }

      if (payload?.success && payload.data) {
        if (payload.data.length === 0) {
          setSearchResults([])
          // Always search communities when there's a query (run in parallel)
          fetchCommunitySearchResults(trimmedQuery, { ...headers }, searchTags.length > 0 ? searchTags : undefined, tagSearchMode).catch(() => {
            // Silently handle community search errors
          })
          return
        }
        
        const mappedResults = payload.data.map(mapProfileInfoToResult)
        
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

        // Show basic results immediately for faster UI response
        setSearchResults(dedupedResults)
        
        // Run people enrichment and community search in parallel for maximum speed
        const peopleEnrichmentPromise = (async () => {
          // Limit enrichment to top 20 results for faster performance
          const resultsToEnrich = dedupedResults.slice(0, 20)
          
          // Fetch profile pictures and resume scores in parallel for speed
          const [enrichedResults, resultsWithScores] = await Promise.all([
            enrichResultsWithProfiles(resultsToEnrich),
            enrichResultsWithResumeScores(resultsToEnrich),
          ])
          
          // Merge profile pictures into results with scores
          const enrichedTopResults = resultsWithScores.map(result => {
            const enriched = enrichedResults.find(r => r.userId === result.userId)
            return {
              ...result,
              image: enriched?.image ?? result.image,
            }
          })
          
          // Merge enriched top results with remaining unenriched results
          const finalResults = [
            ...enrichedTopResults,
            ...dedupedResults.slice(20)
          ]
          
          setSearchResults(finalResults)
        })()
        
        console.log("[Search] ===== COMMUNITY SEARCH API CALL =====")
        console.log("[Search] Will call: GET /api/communities/search/[query]")
        console.log("[Search] Query:", trimmedQuery)
        console.log("[Search] Tags:", searchTags.length > 0 ? searchTags : "none")
        
        const communitySearchPromise = fetchCommunitySearchResults(
          trimmedQuery, 
          { ...headers }, 
          searchTags.length > 0 ? searchTags : undefined, 
          tagSearchMode
        )
        
        // Wait for both to complete in parallel
        await Promise.all([peopleEnrichmentPromise, communitySearchPromise])
        
        console.log("[Search] ===== SEARCH COMPLETE ======")
      } else {
        setSearchResults([])
        console.log("[Search] ===== COMMUNITY SEARCH API CALL (no people results) =====")
        console.log("[Search] Will call: GET /api/communities/search/[query]")
        console.log("[Search] Query:", trimmedQuery)
        // Always search communities when there's a query (run in parallel with error handling)
        fetchCommunitySearchResults(trimmedQuery, { ...headers }, searchTags.length > 0 ? searchTags : undefined, tagSearchMode).catch(() => {
          // Silently handle community search errors
        })
      }
    } catch (error) {
      console.log(error     )
      console.error("[Search] ===== SEARCH EXCEPTION ======")
      console.error("[Search] Error type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("[Search] Error message:", error instanceof Error ? error.message : String(error))
      console.error("[Search] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
      
      let errorMessage = "We couldn't complete your search. Please try again."
      
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('DB error') || error.message.includes('statement has been closed') || error.message.includes('statement')) {
          console.error("[Search] Database error detected in main search")
          errorMessage = "Database error: The search service encountered a database issue. Please try again in a moment."
        } else if (error.message.includes('timeout') || error.name === 'AbortError') {
          console.error("[Search] Timeout error detected")
          errorMessage = "Search request timed out. Please try again with a shorter query."
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error("[Search] Network error detected")
          errorMessage = "Network error: Cannot connect to search service. Please check your connection."
        } else {
          errorMessage = error.message
        }
      }
      
      setSearchError(errorMessage)
      setSearchResults([])
      setCommunityResults([])
      setCommunityProfilePictures(new Map())
    } finally {
      setIsSearching(false)
    }
  }, [searchTags, tagSearchMode, fetchCommunitySearchResults])

  // Handle adding a tag to search
  const handleAddSearchTag = () => {
    const trimmed = tagSearchQuery.trim().toLowerCase()
    if (trimmed && !searchTags.includes(trimmed)) {
      setSearchTags([...searchTags, trimmed])
      setTagSearchQuery("")
    }
  }

  // Handle removing a tag from search
  const handleRemoveSearchTag = (tagToRemove: string) => {
    setSearchTags(searchTags.filter(tag => tag !== tagToRemove))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 150) // Reduced from 300ms to 150ms for faster response

    return () => {
      clearTimeout(timer)
    }
  }, [searchQuery, performSearch, searchTags, tagSearchMode])

  const filteredPeople = searchResults.filter(
    (person) => ownUserId === null || person.userId !== ownUserId,
  )
  const filteredCommunities = communityResults

  const showPeople = activeTab === "all" || activeTab === "people"
  const showCommunities = activeTab === "all" || activeTab === "communities"

  const hasVisibleResults =
    (showPeople && filteredPeople.length > 0) ||
    (showCommunities && filteredCommunities.length > 0)

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-20">
        {/* Search Header */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-zinc-800/50">
          <div className="max-w-2xl mx-auto px-4 py-4 sm:py-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search people, communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 h-12 bg-zinc-900/80 border-zinc-800 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Tag Search Section */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <Hash className="h-4 w-4 text-blue-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Add tags to filter communities..."
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSearchTag()
                      }
                    }}
                    className="flex-1 h-9 bg-zinc-900/50 border-zinc-800/50 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSearchTag}
                    disabled={!tagSearchQuery.trim()}
                    className="h-9 px-4 text-sm bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
                  >
                    Add
                  </Button>
                </div>
                {searchTags.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Active Tags</span>
                      {searchTags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-full font-medium"
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                          <button
                            onClick={() => handleRemoveSearchTag(tag)}
                            className="ml-1.5 hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTags([])}
                        className="h-7 px-3 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Match:</span>
                      <div className="flex items-center gap-1.5 bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTagSearchMode("any")}
                          className={cn(
                            "h-7 px-3 text-xs rounded-md transition-all",
                            tagSearchMode === "any"
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                          )}
                        >
                          Any
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTagSearchMode("all")}
                          className={cn(
                            "h-7 px-3 text-xs rounded-md transition-all",
                            tagSearchMode === "all"
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                          )}
                        >
                          All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </motion.div>

            {/* Filter Tabs */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 mt-4 overflow-x-auto pb-2 hide-scrollbar"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-9 px-4 text-sm font-medium",
                    activeTab === "all"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/20"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800/50 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("people")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-9 px-4 text-sm font-medium",
                    activeTab === "people"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/20"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800/50 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  People
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communities")}
                  className={cn(
                    "rounded-full transition-all whitespace-nowrap h-9 px-4 text-sm font-medium",
                    activeTab === "communities"
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/20"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800/50 hover:bg-zinc-800/50 hover:text-white"
                  )}
                >
                  <Hash className="h-4 w-4 mr-1.5" />
                  Communities
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {!searchQuery && searchTags.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 sm:py-24"
            >
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center border border-blue-500/20">
                  <Search className="h-10 w-10 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Search EliteScore
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto px-4">
                Find people to connect with and communities to join
              </p>
            </motion.div>
          ) : isSearching ? (
            <div className="text-center py-20 sm:py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent mx-auto mb-4" />
              <p className="text-zinc-400 text-sm sm:text-base font-medium">Searching...</p>
            </div>
          ) : searchError ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 sm:py-24"
            >
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Search Error</h3>
              <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto px-4">{searchError}</p>
            </motion.div>
          ) : !hasVisibleResults ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 sm:py-24"
            >
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                  <Search className="h-10 w-10 text-zinc-500" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto px-4">
                Try searching for something else or adjust your filters
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {showPeople && filteredPeople.length > 0 && (
                <div>
                  {showPeople && (
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">People</h2>
                  )}
                  <div className="space-y-3">
                    {filteredPeople.map((person) => (
                      <motion.div
                        key={`user-${person.userId}`}
                        onClick={() => navigateToProfile(person.userId)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800/50 hover:border-zinc-700/50 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3.5">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-zinc-800/50 flex-shrink-0">
                            <AvatarImage 
                              src={person.image ?? undefined} 
                              alt={person.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base">
                              {person.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="font-semibold text-white text-sm sm:text-base truncate">{person.name}</h3>
                              {person.visibility && (
                                <Badge className="bg-zinc-800/60 text-zinc-300 border-zinc-700/50 text-[10px] px-2 py-0.5 rounded-full">
                                  {person.visibility}
                                </Badge>
                              )}
                            </div>
                            {person.title && (
                              <p className="text-xs sm:text-sm text-zinc-400 truncate mb-1.5 font-medium">{person.title}</p>
                            )}
                            {person.bio && (
                              <p className="text-xs text-zinc-500 line-clamp-2 mb-2 leading-relaxed">{person.bio}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500 mt-2">
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
                          <EnhancedButton
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProfile(person.userId)
                            }}
                            className="bg-zinc-800/50 border border-zinc-700/50 text-white hover:bg-zinc-700/50 h-9 px-4 text-xs sm:text-sm rounded-lg flex-shrink-0 font-medium"
                          >
                            View
                          </EnhancedButton>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {showCommunities && filteredCommunities.length > 0 && (
                <div>
                  {showCommunities && (
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">Communities</h2>
                  )}
                  <div className="space-y-3">
                    {filteredCommunities.map((community) => (
                      <motion.div
                        key={`community-${community.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800/50 hover:border-zinc-700/50 active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => {
                          // Navigate to community profile when clicking anywhere on the card
                          router.push(`/for-you?communityId=${community.id}`)
                        }}
                      >
                        <div className="flex items-start gap-3.5">
                          {(() => {
                            const pfpUrl = communityProfilePictures.get(community.id) || community.image
                            return pfpUrl ? (
                              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-zinc-800/50 flex-shrink-0">
                                <AvatarImage 
                                  src={pfpUrl} 
                                  alt={community.name} 
                                  className="object-cover"
                                  onError={(e) => {
                                    // If profile picture fails to load, hide the image and show fallback
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold text-base">
                                  {community.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                <Hash className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
                              </div>
                            )
                          })()}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="font-semibold text-white text-sm sm:text-base truncate">{community.name}</h3>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {community.visibility && (
                                      <Badge className="bg-zinc-800/60 text-zinc-300 border-zinc-700/50 text-[10px] px-2 py-0.5 rounded-full">
                                        {community.visibility.toUpperCase()}
                                      </Badge>
                                    )}
                                    {community.is_pro !== undefined && (
                                      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                        {community.is_pro ? "Pro" : "Standard"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {community.slug && (
                                  <p className="text-xs text-blue-400 font-mono mb-1.5">/{community.slug}</p>
                                )}
                              </div>
                              {community.members !== undefined && (
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs font-medium text-zinc-400">{community.members.toLocaleString()}</p>
                                  <p className="text-[10px] text-zinc-500">members</p>
                                </div>
                              )}
                            </div>
                            {community.description && (
                              <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{community.description}</p>
                            )}
                            <EnhancedButton
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/for-you?communityId=${community.id}`)
                              }}
                              className="bg-zinc-800/50 border border-zinc-700/50 text-white hover:bg-zinc-700/50 h-9 px-4 text-xs sm:text-sm rounded-lg font-medium"
                            >
                              View Community
                            </EnhancedButton>
                          </div>
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
        <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 max-w-md max-h-[80vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800/50 pb-4 text-lg font-semibold">Followers</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 px-1">
            {isLoadingModalProfiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : modalProfiles.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">No followers yet</div>
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
                      className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                      onClick={() => {
                        setShowFollowersModal(false)
                        navigateToProfile(profile.userId)
                      }}
                    >
                      <Avatar className="h-12 w-12 border-2 border-zinc-800/50 flex-shrink-0">
                        <AvatarImage src={profilePic || undefined} alt={fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{fullName}</h3>
                        {profile.bio && (
                          <p className="text-xs text-zinc-400 truncate mt-1 leading-relaxed">{profile.bio}</p>
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
        <DialogContent className="bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 max-w-md max-h-[80vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800/50 pb-4 text-lg font-semibold">Following</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 px-1">
            {isLoadingModalProfiles ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : modalProfiles.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">Not following anyone yet</div>
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
                      className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                      onClick={() => {
                        setShowFollowingModal(false)
                        navigateToProfile(profile.userId)
                      }}
                    >
                      <Avatar className="h-12 w-12 border-2 border-zinc-800/50 flex-shrink-0">
                        <AvatarImage src={profilePic || undefined} alt={fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{fullName}</h3>
                        {profile.bio && (
                          <p className="text-xs text-zinc-400 truncate mt-1 leading-relaxed">{profile.bio}</p>
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

      {/* Join Community Modal - Full Community View */}
      <Dialog open={showJoinModal} onOpenChange={(open) => {
        setShowJoinModal(open)
        if (!open) {
          setCommunityDetails(null)
          setCommunityAnnouncements([])
          setCommunityMembers([])
          setCommunityViewTab("overview")
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-center border-b border-zinc-800 pb-3">
              {selectedCommunity && isMember.get(selectedCommunity.id) 
                ? "View Community" 
                : selectedCommunity?.visibility?.toLowerCase() === "private"
                  ? "Request to Join"
                  : "View Community"}
            </DialogTitle>
          </DialogHeader>
          {selectedCommunity && (
            <div className="flex-1 overflow-y-auto mt-4 space-y-4">
              {/* Community Header */}
              <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg">
                <Avatar className="h-20 w-20 border-2 border-zinc-700 flex-shrink-0">
                  <AvatarImage 
                    src={(() => {
                      const pfpUrl = selectedCommunity.id ? communityProfilePictures.get(selectedCommunity.id) : null
                      return pfpUrl || selectedCommunity.image || undefined
                    })()} 
                    alt={selectedCommunity.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold text-xl">
                      {selectedCommunity.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-white text-lg">{selectedCommunity.name}</h3>
                    {selectedCommunity.visibility && (
                      <Badge className={cn(
                        "text-[10px] px-2 py-0.5",
                        selectedCommunity.visibility.toLowerCase() === "public"
                          ? "bg-blue-900/40 text-blue-300 border-blue-800"
                          : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                      )}>
                        {selectedCommunity.visibility.toLowerCase() === "public" ? (
                          <Globe className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <Lock className="h-3 w-3 mr-1 inline" />
                        )}
                        {selectedCommunity.visibility.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {selectedCommunity.slug && (
                    <p className="text-sm text-blue-400 mb-2">/{selectedCommunity.slug}</p>
                  )}
                  {selectedCommunity.description && (
                    <p className="text-sm text-zinc-300 mb-3">{selectedCommunity.description}</p>
                  )}
                  <div className="flex items-center gap-4 flex-wrap">
                    {selectedCommunity.members !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">{selectedCommunity.members.toLocaleString()} members</span>
                      </div>
                    )}
                    {communityDetails?.stats?.activeToday !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-400">{communityDetails.stats.activeToday} active today</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs for Community View */}
              <Tabs value={communityViewTab} onValueChange={(v) => setCommunityViewTab(v as any)} className="w-full">
                <TabsList className="bg-zinc-800 border border-zinc-700 rounded-lg p-1 w-full grid grid-cols-3">
                  <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Bell className="h-3 w-3 mr-1 inline" />
                    Announcements
                  </TabsTrigger>
                  <TabsTrigger value="members" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Users className="h-3 w-3 mr-1 inline" />
                    Members
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3 mt-4">
                  {isLoadingCommunityDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {communityDetails && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-zinc-800/50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">Total Members</p>
                              <p className="text-lg font-bold text-white">{communityDetails.membersCount || communityDetails.members || 0}</p>
                            </div>
                            <div className="p-3 bg-zinc-800/50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">Active Today</p>
                              <p className="text-lg font-bold text-white">{communityDetails.stats?.activeToday || 0}</p>
                            </div>
                          </div>
                          {communityDetails.description && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-2">About</p>
                              <p className="text-sm text-zinc-300">{communityDetails.description}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="announcements" className="space-y-3 mt-4">
                  {isLoadingAnnouncements ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : communityAnnouncements.length > 0 ? (
                    <div className="space-y-2">
                      {communityAnnouncements.map((announcement: any) => (
                        <div key={announcement.id} className="p-3 bg-zinc-800/50 rounded-lg">
                          <div className="flex items-start gap-2 mb-1">
                            <Bell className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <h4 className="font-semibold text-white text-sm flex-1">{announcement.title}</h4>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 ml-6">{announcement.description || announcement.content}</p>
                          {announcement.created_at && (
                            <div className="flex items-center gap-1 mt-2 ml-6">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              <span className="text-xs text-zinc-500">{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      {selectedCommunity.visibility?.toLowerCase() === "private" && !isMember.get(selectedCommunity.id)
                        ? "Join the community to see announcements"
                        : "No announcements yet"}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="members" className="space-y-3 mt-4">
                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : communityMembers.length > 0 ? (
                    <div className="space-y-2">
                      {communityMembers.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                          <Avatar className="h-10 w-10 border border-zinc-700">
                            <AvatarImage src={member.image || undefined} alt={member.name} />
                            <AvatarFallback className="bg-zinc-800 text-white text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{member.name}</p>
                          </div>
                        </div>
                      ))}
                      {selectedCommunity.members && selectedCommunity.members > communityMembers.length && (
                        <p className="text-xs text-zinc-500 text-center">
                          +{selectedCommunity.members - communityMembers.length} more members
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      {selectedCommunity.visibility?.toLowerCase() === "private" && !isMember.get(selectedCommunity.id)
                        ? "Join the community to see members"
                        : "No members to display"}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Join/View Actions */}
              <div className="border-t border-zinc-800 pt-4 mt-4">
              {isMember.get(selectedCommunity.id) ? (
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
                ) : pendingRequests.has(selectedCommunity.id) ? (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center mb-4">
                      <Lock className="h-12 w-12 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-300 mb-2">Request Pending</h3>
                    <p className="text-sm text-zinc-300 mb-4">
                      Your request to join <span className="font-semibold">{selectedCommunity.name}</span> is pending approval.
                    </p>
                    <p className="text-xs text-zinc-400 mb-4">
                      You can only send one request. Please wait for the community admin to review your request.
                    </p>
                    <EnhancedButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowJoinModal(false)
                        router.push(`/for-you?communityId=${selectedCommunity.id}&pending=true`)
                      }}
                      className="w-full border-amber-700 text-amber-300 hover:bg-amber-900/20"
                  >
                    View Community
                  </EnhancedButton>
                </div>
              ) : (
                <>
                  {selectedCommunity.visibility?.toLowerCase() === "private" && (
                      <div className="space-y-2 mb-4">
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
                      <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 text-xs text-red-300 mb-4">
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
                          
                          // Prevent duplicate requests
                          if (pendingRequests.has(selectedCommunity.id)) {
                            setJoinError("You have already sent a request to join this community. Please wait for approval.")
                            return
                          }
                        
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
                                  
                                  // Check if error indicates request already exists
                                  if (errorMessage.toLowerCase().includes("already") || 
                                      errorMessage.toLowerCase().includes("pending") ||
                                      errorMessage.toLowerCase().includes("request")) {
                                    // Mark as pending if backend says request already exists
                                    setPendingRequests(prev => new Set(prev).add(selectedCommunity.id))
                                    setJoinError("You have already sent a request to join this community.")
                                    setIsJoining(false)
                                    return
                                  }
                              } catch {
                                errorMessage = errorText
                              }
                            }

                            setJoinError(errorMessage)
                            setIsJoining(false)
                            return
                          }

                            // Check response status
                            const responseData = response.status === 204 ? null : await response.json().catch(() => null)
                            const isPendingRequest = response.status === 202

                            if (isPendingRequest) {
                              // Pending request - mark as pending and navigate
                              setPendingRequests(prev => new Set(prev).add(selectedCommunity.id))
                              setShowJoinModal(false)
                              setJoinError(null)
                              setJoinMessage("")
                              
                              // Navigate to community page (will show pending banner)
                              router.push(`/for-you?communityId=${selectedCommunity.id}&pending=true`)
                            } else if (response.status === 200 || response.status === 204) {
                              // Successfully joined - update membership status
                          setIsMember(prev => new Map(prev).set(selectedCommunity.id, true))
                          setShowJoinModal(false)
                          setJoinError(null)
                          setJoinMessage("")
                          
                          // Navigate to community page
                          router.push(`/for-you?communityId=${selectedCommunity.id}`)
                            } else {
                              // Unexpected status
                              setJoinError("Unexpected response from server")
                              setIsJoining(false)
                            }
                        } catch (error) {
                          setJoinError(error instanceof Error ? error.message : "An unexpected error occurred")
                          setIsJoining(false)
                        }
                      }}
                      className="flex-1"
                        disabled={isJoining || pendingRequests.has(selectedCommunity.id) || (selectedCommunity.visibility?.toLowerCase() === "private" && !joinMessage.trim())}
                      isLoading={isJoining}
                    >
                        {pendingRequests.has(selectedCommunity.id) 
                          ? "Request Already Sent" 
                          : selectedCommunity.visibility?.toLowerCase() === "private" 
                          ? "Send Request" 
                          : "Join Community"}
                    </EnhancedButton>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
