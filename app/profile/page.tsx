"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import {
  Briefcase,
  FileText,
  GraduationCap,
  MapPin,
  Settings,
  Share2,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Award,
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Building2,
  Code,
  Languages,
  X,
} from "lucide-react"
import { motion } from "framer-motion"

import { AppShell } from "@/components/layout/app-shell"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { EnhancedCard, EnhancedCardContent } from "@/components/ui/enhanced-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { LevelIndicator } from "@/components/level-indicator"
import { getStoredAccessToken, getStoredAuthValue } from "@/lib/auth-storage"

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"
const BLOCKED_BIO_MESSAGE = "You have blocked this user"

type ResumeData = {
  skills?: string[]
  company?: string | null
  currentRole?: string | null
  summary?: string | null
  profilePicture?: string | null
  profilePictureUrl?: string | null
  avatarUrl?: string | null
  [key: string]: unknown
}

type ProfileData = {
  userId: number
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  resume: ResumeData | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE"
  createdAt: string | null
  updatedAt: string | null
  profilePictureUrl?: string | null
  profilePicture?: string | null
  avatarUrl?: string | null
}

export default function ProfilePage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewingUserId = searchParams?.get("userId")
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [ownFollowersIds, setOwnFollowersIds] = useState<number[] | null>(null)
  const [ownFollowingIds, setOwnFollowingIds] = useState<number[] | null>(null)
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false)
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false)
  const [isBlockedViewedUser, setIsBlockedViewedUser] = useState(false)
  const [profileRefreshKey, setProfileRefreshKey] = useState(0)
  const [cvData, setCvData] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [cvRefreshTrigger, setCvRefreshTrigger] = useState(0)

  const numericViewingUserId = viewingUserId ? Number(viewingUserId) : null
  const isViewingOwnProfile =
    !viewingUserId || (currentUserId !== null && numericViewingUserId === currentUserId)

  const getProfilePictureKey = (id?: number | null) =>
    id ? `profile.picture.${id}` : "profile.picture.default"

  const cacheProfilePicture = (picture: string, userId?: number | null) => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(getProfilePictureKey(userId), picture)
    } catch (error) {
      console.warn("[Profile] Failed to cache profile picture:", error)
    }
  }

  const loadCachedProfilePicture = (userId?: number | null) => {
    if (typeof window === "undefined") return null
    try {
      return window.localStorage.getItem(getProfilePictureKey(userId))
    } catch (error) {
      console.warn("[Profile] Failed to load cached profile picture:", error)
      return null
    }
  }

  const pickFirstValidPicture = (...candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate
      }
    }
    return null
  }

  const resolvePictureFromProfile = (profile: ProfileData): string | null => {
    const directPicture = pickFirstValidPicture(
      profile.profilePictureUrl,
      profile.profilePicture,
      profile.avatarUrl,
    )

    if (directPicture) {
      return directPicture
    }

    if (profile.resume) {
      return pickFirstValidPicture(
        profile.resume.profilePictureUrl,
        profile.resume.profilePicture,
        profile.resume.avatarUrl,
      )
    }

    return null
  }

  const updateProfilePictureFromProfile = (profile: ProfileData) => {
    const pictureFromApi = resolvePictureFromProfile(profile)

    if (pictureFromApi) {
      // Always cache the picture from API to ensure persistence after build
      cacheProfilePicture(pictureFromApi, profile.userId)
      setProfilePicture(pictureFromApi)
      console.log("[Profile] Set profile picture from API:", pictureFromApi.substring(0, 50) + "...")
      return
    }

    // Fallback to cached picture if API doesn't return one
    const cached = loadCachedProfilePicture(profile.userId)
    if (cached) {
      console.log("[Profile] Using cached profile picture")
      setProfilePicture(cached)
    } else {
      console.log("[Profile] No profile picture available from API or cache")
      setProfilePicture(null)
    }
  }

  // Fetch username from /v1/auth/me (only for own profile)
  useEffect(() => {
    // Fetch username only when viewing own profile
    if (!isAuthorized || !isViewingOwnProfile) {
      console.log("[Profile] Skipping username fetch (either not authorized or viewing another user)")
      return
    }

    async function fetchUsername() {
      try {
        console.log("[Profile] ===== Starting username fetch =====")
        
        const token = getStoredAccessToken()

        console.log("[Profile] Token found:", token ? "Yes (length: " + token.length + ")" : "No")

        if (!token) {
          console.warn("[Profile] No token available for username fetch")
          return
        }

        const apiUrl = `${API_BASE_URL}v1/auth/me`
        console.log("[Profile] Fetching username from:", apiUrl)
        console.log("[Profile] Request headers:", {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.substring(0, 20)}...`,
        })

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("[Profile] Username API response status:", response.status)
        console.log("[Profile] Username API response ok:", response.ok)
        console.log("[Profile] Username API response headers:", Object.fromEntries(response.headers.entries()))

        const contentType = response.headers.get("content-type")
        console.log("[Profile] Response content-type:", contentType)

        if (response.ok) {
          let result
          try {
            if (contentType?.includes("application/json")) {
              result = await response.json()
            } else {
              const text = await response.text()
              console.log("[Profile] Non-JSON response text:", text)
              try {
                result = JSON.parse(text)
              } catch {
                result = { raw: text }
              }
            }
          } catch (parseError) {
            console.error("[Profile] Error parsing response:", parseError)
            const text = await response.text()
            console.log("[Profile] Raw response text:", text)
            return
          }

          console.log("[Profile] Username API response body:", result)
          console.log("[Profile] Response structure:", {
            hasSuccess: "success" in result,
            hasData: "data" in result,
            isDirectObject: typeof result === "object" && !Array.isArray(result),
          })

          // Extract username from response
          const userData = result?.data || result
          console.log("[Profile] Extracted userData:", userData)
          console.log("[Profile] userData.username:", userData?.username)
          console.log("[Profile] userData keys:", userData ? Object.keys(userData) : "null")

          if (userData?.username) {
            setUsername(userData.username)
            console.log("[Profile] ✓ Username successfully loaded:", userData.username)
          } else {
            console.warn("[Profile] ✗ Username not found in response. Available fields:", userData ? Object.keys(userData) : "none")
          }
        } else {
          let errorBody
          try {
            const text = await response.text()
            console.log("[Profile] Error response text:", text)
            try {
              errorBody = JSON.parse(text)
              console.log("[Profile] Error response JSON:", errorBody)
            } catch {
              errorBody = { raw: text }
            }
          } catch (e) {
            console.error("[Profile] Error reading error response:", e)
          }
          
          console.warn("[Profile] ✗ Failed to fetch username. Status:", response.status, "Body:", errorBody)
          
          // Fallback: Try to get username from localStorage/sessionStorage
          const storedUsername = getStoredAuthValue("auth.username")
          const storedEmail = getStoredAuthValue("auth.email")
          const fallbackUsername = storedUsername || (storedEmail ? storedEmail.split("@")[0] : null)
          
          if (fallbackUsername) {
            console.log("[Profile] Using fallback username from storage:", fallbackUsername)
            setUsername(fallbackUsername)
          } else {
            console.warn("[Profile] No fallback username available")
          }
        }
      } catch (error) {
        console.error("[Profile] ✗ Exception while fetching username:", error)
        console.error("[Profile] Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      } finally {
        console.log("[Profile] ===== Username fetch completed =====")
      }
    }

    fetchUsername()
  }, [isAuthorized, isViewingOwnProfile])

  useEffect(() => {
    if (!isAuthorized || currentUserId !== null) return

    async function fetchOwnUserId() {
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
            setCurrentUserId(profile.userId)
          }
        }
      } catch (error) {
        console.warn("[Profile] Failed to fetch own user ID:", error)
      }
    }

    fetchOwnUserId()
  }, [isAuthorized, currentUserId])

  // Try to load cached picture immediately on mount (before API call)
  useEffect(() => {
    if (!isAuthorized || typeof window === "undefined") return
    
    // Try to get userId from profileData if already loaded, or try common keys
    if (profileData?.userId) {
      const cached = loadCachedProfilePicture(profileData.userId)
      if (cached && !profilePicture) {
        console.log("[Profile] Loaded cached picture on mount")
        setProfilePicture(cached)
      }
    }
  }, [isAuthorized, profileData?.userId])

  // Fetch OWN followers / following lists (IDs) for the authenticated user.
  useEffect(() => {
    if (!isAuthorized) return

    async function fetchOwnFollowStats() {
      try {
        const token = getStoredAccessToken()
        if (!token) {
          console.warn("[Profile] No token, cannot fetch own followers/following")
          return
        }

        const [followersRes, followingRes] = await Promise.all([
          fetch(`${API_BASE_URL}v1/users/get_own_followers`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}v1/users/get_own_following`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (followersRes.ok) {
          const followersResult = await followersRes.json()
          const followersData: number[] = followersResult?.data || []
          const normalizedFollowers = Array.isArray(followersData) ? followersData : []
          console.log("[Profile] Own followers fetched:", normalizedFollowers.length)
          setOwnFollowersIds(normalizedFollowers)
        }

        if (followingRes.ok) {
          const followingResult = await followingRes.json()
          const followingData: number[] = followingResult?.data || []
          const normalizedFollowing = Array.isArray(followingData) ? followingData : []
          console.log("[Profile] Own following fetched:", normalizedFollowing.length)
          setOwnFollowingIds(normalizedFollowing)
        }
      } catch (error) {
        console.warn("[Profile] Failed to fetch own followers/following stats:", error)
      }
    }

    fetchOwnFollowStats()
  }, [isAuthorized])

  // We no longer call public getFollowers/getFollowing endpoints because they currently 500.
  // For viewed users, we rely on ProfileInfo counts plus local follow/unfollow adjustments.

  // Listen for CV update events from other pages
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleCvUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("[Profile] Received cvUpdated event from:", customEvent.detail?.source)
      setCvRefreshTrigger(prev => prev + 1)
      setProfileRefreshKey(prev => prev + 1)
    }

    window.addEventListener("cvUpdated", handleCvUpdate)
    console.log("[Profile] Listening for cvUpdated events")

    return () => {
      window.removeEventListener("cvUpdated", handleCvUpdate)
      console.log("[Profile] Stopped listening for cvUpdated events")
    }
  }, [])

  // Fetch CV data (only for own profile)
  useEffect(() => {
    if (!isAuthorized || !isViewingOwnProfile) return

    async function fetchCv() {
      try {
        const token = getStoredAccessToken()
        if (!token) return

        console.log("[Profile] Fetching CV data (trigger:", cvRefreshTrigger, ")")
        const response = await fetch(`${API_BASE_URL}v1/users/cv`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          const cv = result?.data || result
          console.log("[Profile] CV data fetched successfully:", {
            hasProfile: !!cv?.profile,
            experienceCount: Array.isArray(cv?.profile?.experience) ? cv.profile.experience.length : 0,
            educationCount: Array.isArray(cv?.profile?.education) ? cv.profile.education.length : 0,
            skillsCount: Array.isArray(cv?.profile?.skills) ? cv.profile.skills.length : 0,
          })
          setCvData(cv)
        } else {
          console.log("[Profile] No CV data found (status:", response.status, ")")
          setCvData(null)
        }
      } catch (error) {
        console.warn("[Profile] Error fetching CV:", error)
        setCvData(null)
      }
    }

    fetchCv()
  }, [isAuthorized, isViewingOwnProfile, profileRefreshKey, cvRefreshTrigger])

  // Fetch profile data on mount
  useEffect(() => {
    if (!isAuthorized) return

    async function fetchProfile() {
      setIsLoadingProfile(true)
      setProfileError(null)

      try {
        const token = getStoredAccessToken()

        if (!token) {
          console.warn("[Profile] No token, cannot fetch profile")
          setIsLoadingProfile(false)
          return
        }

        console.log("[Profile] Fetching profile data (refreshKey:", profileRefreshKey, ")...")

        // Determine which endpoint to use
        const endpoint = viewingUserId
          ? `${API_BASE_URL}v1/users/profile/get_profile/${viewingUserId}`
          : `${API_BASE_URL}v1/users/profile/get_own_profile`

        console.log("[Profile] Endpoint:", endpoint)
        console.log("[Profile] Viewing userId:", viewingUserId || "own profile")

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("[Profile] Response status:", response.status)

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            console.log("[Profile] No profile found (401/404)")
            setProfileError("no_profile")
          } else {
            console.error("[Profile] Failed to fetch profile:", response.status)
            setProfileError("fetch_error")
          }
          setIsLoadingProfile(false)
          return
        }

        const result = await response.json()
        console.log("[Profile] API response received")

        // Extract profile from response
        const possibleProfile = result?.data || result

        console.log("[Profile] Extracted profile:", {
          userId: possibleProfile?.userId,
          hasResume: !!possibleProfile?.resume,
          resumeType: typeof possibleProfile?.resume,
        })

        if (possibleProfile && possibleProfile.userId) {
          setProfileData(possibleProfile as ProfileData)
          updateProfilePictureFromProfile(possibleProfile)
          if (!viewingUserId) {
            setCurrentUserId(possibleProfile.userId)
          }
        } else {
          console.log("[Profile] No valid profile data, marking as no_profile")
          setProfileError("no_profile")
        }
      } catch (error) {
        console.error("[Profile] Error fetching profile:", error)
        setProfileError("fetch_error")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [isAuthorized, viewingUserId, profileRefreshKey])

  useEffect(() => {
    if (isViewingOwnProfile || !viewingUserId || !profileData) {
      console.log("[Profile] Block state reset (no viewingUserId or profileData)", {
        viewingUserId,
        hasProfileData: !!profileData,
      })
      setIsBlockedViewedUser(false)
      return
    }

    const normalizedBio = profileData.bio?.trim()
    const blockedFromProfile = normalizedBio === BLOCKED_BIO_MESSAGE
    console.log("[Profile] Derived block state from profile", {
      viewingUserId,
      bio: profileData.bio,
      normalizedBio,
      BLOCKED_BIO_MESSAGE,
      blockedFromProfile,
    })
    setIsBlockedViewedUser(Boolean(blockedFromProfile))
  }, [viewingUserId, profileData, isViewingOwnProfile])

  if (!isAuthorized || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bbcff] border-t-transparent" />
      </div>
    )
  }

  // Show blank state if no profile exists
  if (profileError === "no_profile") {
    return (
      <AppShell title="Profile" showBackButton={true} backUrl="/home">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <motion.div
            className="text-center space-y-6 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_32px_0_rgba(80,0,255,0.5)]">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">
                Setup Your Profile
              </h2>
              <p className="mt-2 text-zinc-400 text-sm">
                Complete your profile to unlock all features and start your journey
              </p>
            </div>
            <EnhancedButton
              variant="gradient"
              rounded="full"
              animation="shimmer"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] px-8 py-3"
              onClick={() => router.push("/profile/setup")}
            >
              Setup Profile
            </EnhancedButton>
          </motion.div>
        </div>
      </AppShell>
    )
  }

  if (profileError === "fetch_error") {
    return (
      <AppShell title="Profile" showBackButton={true} backUrl="/home">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-red-400">Failed to load profile. Please try again.</p>
            <EnhancedButton onClick={() => window.location.reload()}>Retry</EnhancedButton>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!profileData) {
    return null
  }

  // Extract user data from profile
  const fullName = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() || "User"

  // For your own profile, prefer the real username from auth/me or stored auth data
  const storedUsername = getStoredAuthValue("auth.username")
  const storedEmail = getStoredAuthValue("auth.email")
  const fallbackUsernameFromEmail = storedEmail ? storedEmail.split("@")[0] : null

  // For other users (when viewing another profile), backend does not yet return a username field.
  // As a UX fallback, derive a handle from their name or userId so the UI still shows an @handle.
  const derivedOtherUsername =
    numericViewingUserId && fullName
      ? fullName.toLowerCase().replace(/\s+/g, "")
      : numericViewingUserId
        ? `user${profileData.userId}`
        : null

  const displayUsername = isViewingOwnProfile
    ? username || storedUsername || fallbackUsernameFromEmail || "user"
    : derivedOtherUsername
  const bio = profileData.bio || "No bio added yet"

  // Determine if the acting user is following the viewed profile (when viewing another user)
  const isFollowingViewedUser =
    !!numericViewingUserId && Array.isArray(ownFollowingIds)
      ? ownFollowingIds.includes(numericViewingUserId)
      : false

  // IMPORTANT: followersCount/followingCount from get_own_profile may be stale/cached.
  // The dedicated endpoints (get_own_followers/get_own_following) query the actual follow
  // relationships table and return real-time data. Always prefer those for own profile.
  //
  // For other users' profiles, we use ProfileInfo counts and adjust by local follow state.
  const baseFollowersCount = profileData.followersCount || 0
  const followers = isViewingOwnProfile
    ? ownFollowersIds !== null
      ? ownFollowersIds.length
      : baseFollowersCount
    : baseFollowersCount + (isFollowingViewedUser ? 1 : 0)

  const baseFollowingCount = profileData.followingCount || 0
  const following = isViewingOwnProfile
    ? ownFollowingIds !== null
      ? ownFollowingIds.length
      : baseFollowingCount
    : baseFollowingCount

  // Extract resume data - prefer CV data from GET /v1/users/cv if available (for own profile)
  // For viewing others, check if profileData.resume contains structured CV data
  const cvProfile = cvData?.profile || null
  
  // Check if profileData.resume contains structured CV data (wrapped in { profile: {...} })
  // This works for both own profile and viewing others
  const resumeFromProfile = profileData.resume as any
  let structuredResumeProfile: any = null
  
  // Try to extract structured CV data from profileData.resume
  if (resumeFromProfile) {
    // Check if it's wrapped in { profile: {...} }
    if (resumeFromProfile.profile && typeof resumeFromProfile.profile === 'object' && !Array.isArray(resumeFromProfile.profile)) {
      structuredResumeProfile = resumeFromProfile.profile
    }
    // Check if it's already the profile object directly
    else if (typeof resumeFromProfile === 'object' && !Array.isArray(resumeFromProfile) && 
             (resumeFromProfile.basics || resumeFromProfile.experience || resumeFromProfile.education || 
              resumeFromProfile.skills || resumeFromProfile.projects)) {
      structuredResumeProfile = resumeFromProfile
    }
  }
  
  // Determine which CV data source to use
  // Priority: 1) cvData (own profile), 2) structured resume from profileData.resume, 3) legacy resume
  const effectiveCvProfile = cvProfile || structuredResumeProfile
  const legacyResume: ResumeData = profileData.resume ?? {}
  
  // Debug logging for both own profile and viewing others
  if (effectiveCvProfile) {
    console.log(`[Profile] Using CV data for ${viewingUserId ? `user ${viewingUserId}` : 'own profile'}`, {
      source: cvProfile ? 'cvData.profile' : 'profileData.resume',
      hasBasics: !!effectiveCvProfile.basics,
      experienceCount: Array.isArray(effectiveCvProfile.experience) ? effectiveCvProfile.experience.length : 0,
      educationCount: Array.isArray(effectiveCvProfile.education) ? effectiveCvProfile.education.length : 0,
      skillsCount: Array.isArray(effectiveCvProfile.skills) ? effectiveCvProfile.skills.length : 0,
    })
  }
  
  // Check if CV has been properly parsed and has meaningful data
  const hasCvData = effectiveCvProfile && (
    (effectiveCvProfile.basics && Object.keys(effectiveCvProfile.basics).length > 0) ||
    (Array.isArray(effectiveCvProfile.experience) && effectiveCvProfile.experience.length > 0) ||
    (Array.isArray(effectiveCvProfile.education) && effectiveCvProfile.education.length > 0) ||
    (Array.isArray(effectiveCvProfile.skills) && effectiveCvProfile.skills.length > 0) ||
    (Array.isArray(effectiveCvProfile.projects) && effectiveCvProfile.projects.length > 0) ||
    (Array.isArray(effectiveCvProfile.certifications) && effectiveCvProfile.certifications.length > 0)
  )
  
  // Also check legacy resume field for backward compatibility (old format without profile wrapper)
  const hasLegacyResume = !hasCvData && legacyResume && (
    legacyResume.company ||
    legacyResume.currentRole ||
    legacyResume.summary ||
    (Array.isArray(legacyResume.skills) && legacyResume.skills.length > 0)
  )
  
  // Use CV data if available, otherwise use legacy resume structure
  const resumeBasics = effectiveCvProfile?.basics || {}
  const resumeExperience = effectiveCvProfile?.experience || []
  const resumeEducation = effectiveCvProfile?.education || []
  const resumeProjects = effectiveCvProfile?.projects || []
  const resumeSkills = effectiveCvProfile?.skills || (Array.isArray(legacyResume.skills) ? legacyResume.skills : [])
  const resumeCertifications = effectiveCvProfile?.certifications || []
  const resumeLanguages = effectiveCvProfile?.languages || []
  const resumePublications = effectiveCvProfile?.publications || []
  const resumeHonorsAwards = effectiveCvProfile?.honors_awards || []
  const resumeVolunteer = effectiveCvProfile?.volunteer || []
  
  // Legacy fields for backward compatibility
  const resumeCompany = legacyResume.company || null
  const resumeRole = legacyResume.currentRole || null
  const resumeSummary = resumeBasics.summary || legacyResume.summary || null
  
  // Check if profile is set up (has CV data or legacy resume data)
  // Works for both own profile and viewing others
  const isProfileSetup = hasCvData || hasLegacyResume

  // LinkedIn-style: Find current job, or most recent job if no current job exists
  const currentJob = resumeExperience.find((exp: any) => 
    exp.is_current === true || exp.end_date === null || exp.end_date === undefined
  ) || null

  // If no current job, get the most recent job (sorted by start_date descending)
  const mostRecentJob = currentJob || (resumeExperience.length > 0
    ? [...resumeExperience].sort((a: any, b: any) => {
        // Sort by start_date descending (most recent first)
        const dateA = a.start_date || ""
        const dateB = b.start_date || ""
        return dateB.localeCompare(dateA)
      })[0]
    : null)

  // LinkedIn-style: Find current education, or most recent education if no current education exists
  const currentEducation = resumeEducation.find((edu: any) => 
    edu.end_date === null || edu.end_date === undefined
  ) || null

  // If no current education, get the most recent education (sorted by start_date descending)
  const mostRecentEducation = currentEducation || (resumeEducation.length > 0
    ? [...resumeEducation].sort((a: any, b: any) => {
        // Sort by start_date descending (most recent first)
        const dateA = a.start_date || ""
        const dateB = b.start_date || ""
        return dateB.localeCompare(dateA)
      })[0]
    : null)

  // Get headline from basics (LinkedIn shows this prominently)
  const headline = resumeBasics.headline || resumeBasics.summary || null

  const level = 4 // TODO: Get from user stats
  const resumeScore = 87 // TODO: Calculate from resume
  const resumeDelta = 5 // TODO: Calculate delta

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24,
      },
    },
  }

  const handleToggleFollow = async () => {
    if (!isAuthorized || !numericViewingUserId || isUpdatingFollow || isViewingOwnProfile) return
    if (isBlockedViewedUser) {
      console.warn("[Profile] Cannot follow while user is blocked", {
        viewingUserId,
        numericViewingUserId,
        isBlockedViewedUser,
      })
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      console.warn("[Profile] No token available for follow/unfollow")
      return
    }

    setIsUpdatingFollow(true)

    const isCurrentlyFollowing = isFollowingViewedUser
    const endpoint = isCurrentlyFollowing
      ? `${API_BASE_URL}v1/users/unfollow`
      : `${API_BASE_URL}v1/users/follow`

    console.log("[Profile] Follow/unfollow starting", {
      viewingUserId,
      numericViewingUserId,
      isCurrentlyFollowing,
      endpoint,
    })

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: numericViewingUserId }),
      })

      if (!response.ok) {
        let errorBody: unknown = null
        try {
          errorBody = await response.json()
        } catch {
          try {
            errorBody = await response.text()
          } catch {
            errorBody = "Unable to read error body"
          }
        }

        console.warn("[Profile] Follow/unfollow failed", {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorBody,
        })

        // Gracefully handle known 400 messages to keep UI in sync
        if (
          response.status === 400 &&
          typeof errorBody === "object" &&
          errorBody !== null &&
          "message" in errorBody
        ) {
          const msg = (errorBody as any).message as string
          if (/already\s+following/i.test(msg)) {
            setOwnFollowingIds((prev) => {
              const current = Array.isArray(prev) ? prev : []
              return current.includes(numericViewingUserId) ? current : [...current, numericViewingUserId]
            })
            return
          }
          if (/not\s+following/i.test(msg)) {
            setOwnFollowingIds((prev) => {
              const current = Array.isArray(prev) ? prev : []
              return current.filter((id) => id !== numericViewingUserId)
            })
            return
          }
        }
        return
      }

      let successBody: unknown = null
      try {
        successBody = await response.json()
      } catch {
        successBody = "Non-JSON success body"
      }
      console.log("[Profile] Follow/unfollow succeeded", {
        endpoint,
        successBody,
      })

      // Update local following list so UI reflects the change immediately
      setOwnFollowingIds((prev) => {
        const current = Array.isArray(prev) ? prev : []
        if (isCurrentlyFollowing) {
          return current.filter((id) => id !== numericViewingUserId)
        }
        if (!current.includes(numericViewingUserId)) {
          return [...current, numericViewingUserId]
        }
        return current
      })
    } catch (error) {
      console.warn("[Profile] Error during follow/unfollow:", error)
    } finally {
      setIsUpdatingFollow(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!isAuthorized || !numericViewingUserId || isUpdatingBlock || isViewingOwnProfile) return

    const token = getStoredAccessToken()
    if (!token) {
      console.warn("[Profile] No token available for block/unblock")
      return
    }

    const isCurrentlyBlocked = isBlockedViewedUser
    const endpoint = isCurrentlyBlocked
      ? `${API_BASE_URL}v1/users/unblock`
      : `${API_BASE_URL}v1/users/block`

    console.log("[Profile] Block/unblock starting", {
      viewingUserId,
      numericViewingUserId,
      isCurrentlyBlocked,
      endpoint,
    })

    setIsUpdatingBlock(true)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: numericViewingUserId }),
      })

      if (!response.ok) {
        let errorBody: unknown = null
        try {
          errorBody = await response.json()
        } catch {
          try {
            errorBody = await response.text()
          } catch {
            errorBody = "Unable to read error body"
          }
        }
        console.warn("[Profile] Block/unblock failed", {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          errorBody,
        })
        return
      }

      let successBody: unknown = null
      try {
        successBody = await response.json()
      } catch {
        successBody = "Non-JSON success body"
      }
      console.log("[Profile] Block/unblock succeeded", {
        endpoint,
        successBody,
      })

      setIsBlockedViewedUser(!isCurrentlyBlocked)

      if (!isCurrentlyBlocked) {
        setOwnFollowingIds((prev) => {
          if (!Array.isArray(prev)) {
            return prev
          }
          return prev.filter((id) => id !== numericViewingUserId)
        })
      }

      setProfileRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.warn("[Profile] Error during block/unblock:", error)
    } finally {
      setIsUpdatingBlock(false)
    }
  }

  return (
    <AppShell
      title="Profile"
      showBackButton={true}
      backUrl="/home"
      rightElement={
        isViewingOwnProfile ? (
          <EnhancedButton
            variant="ghost"
            size="icon"
            rounded="full"
            className="hover:bg-zinc-800 h-8 w-8"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
          </EnhancedButton>
        ) : (
          <EnhancedButton
            variant="ghost"
            size="sm"
            rounded="full"
            className="hover:bg-zinc-800"
            onClick={() => router.back()}
          >
            ← Back
          </EnhancedButton>
        )
      }
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-700/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-gradient-radial from-purple-700/20 via-pink-600/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-radial from-fuchsia-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
      {/* Profile Header */}
      <div className="relative max-w-2xl mx-auto pt-5 pb-4 px-3">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Avatar */}
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-black ring-2 ring-blue-500 rounded-full object-cover shadow-[0_0_24px_0_rgba(80,0,255,0.5)]">
            <AvatarImage src={profilePicture || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
              {fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Profile Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent">{fullName}</span>
              </div>
              {displayUsername && (
                <span className="text-zinc-400 text-sm sm:text-base font-medium">@{displayUsername}</span>
              )}

              {/* LinkedIn-style: Headline (if available) */}
              {headline && (
                <p className="text-sm text-zinc-300 mt-1 max-w-md text-center">{headline}</p>
              )}

              {/* LinkedIn-style: Current/Most Recent Job and/or Education - Structured Layout (Mobile Responsive) */}
              {(mostRecentJob || mostRecentEducation) && (
                <div className="mt-3 space-y-2.5 w-full max-w-lg mx-auto px-2">
                  {mostRecentJob && (
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm flex-wrap">
                      {/* Icon Container - Centered before text */}
                      <div className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-sm">
                        <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" />
                      </div>
                      {/* Text Content - Centered with icon, responsive wrapping */}
                      <div className="flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap min-w-0">
                        <span className="font-medium text-white text-xs sm:text-sm">{mostRecentJob.title || "Professional"}</span>
                        {mostRecentJob.company && (
                          <>
                            <span className="text-zinc-500 font-normal text-[10px] sm:text-xs">at</span>
                            <span className="font-semibold text-white text-xs sm:text-sm break-words">{mostRecentJob.company}</span>
                          </>
                        )}
                      </div>
                      {/* Current Badge */}
                      {currentJob && (
                        <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                  )}
                  {mostRecentEducation && (
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm flex-wrap">
                      {/* Icon Container - Centered before text */}
                      <div className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shadow-sm">
                        <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
                      </div>
                      {/* Text Content - Centered with icon, responsive wrapping */}
                      <div className="flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap min-w-0">
                        <span className="font-medium text-white text-xs sm:text-sm">{mostRecentEducation.degree || "Student"}</span>
                        {mostRecentEducation.school && (
                          <>
                            <span className="text-zinc-500 font-normal text-[10px] sm:text-xs">at</span>
                            <span className="font-semibold text-white text-xs sm:text-sm break-words">{mostRecentEducation.school}</span>
                          </>
                        )}
                      </div>
                      {/* Current Badge */}
                      {currentEducation && (
                        <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                          Current
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Quick Stats: Resume Score + Level */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-2">
                  <span className="font-semibold">Resume Score</span>
                  <span className="font-bold text-white">{resumeScore}</span>
                  <span className="text-emerald-400 font-medium">+{resumeDelta}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-xs text-zinc-200">
                  Level <span className="font-bold text-white">{level}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                {/* Own profile: show Edit Profile */}
                {isViewingOwnProfile && (
                  <>
                    <EnhancedButton
                      size="sm"
                      rounded="full"
                      variant="gradient"
                      animation="shimmer"
                      className="px-5 py-1.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]"
                      onClick={() => router.push("/settings")}
                    >
                      Edit Profile
                    </EnhancedButton>
                    {/* Only show "Finish Your Setup" if CV hasn't been parsed/set up */}
                    {!isProfileSetup && (
                      <EnhancedButton
                        size="sm"
                        rounded="full"
                        variant="outline"
                        className="px-5 py-1.5 text-xs sm:text-sm font-bold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400"
                        onClick={() => router.push("/profile/cv-upload")}
                      >
                        <FileText className="h-3 w-3 mr-1.5" />
                        Finish Your Setup
                      </EnhancedButton>
                    )}
                  </>
                )}

                {/* Viewing someone else: show Follow / Unfollow & Block */}
                {!isViewingOwnProfile && numericViewingUserId && (
                  <>
                    <EnhancedButton
                      size="sm"
                      rounded="full"
                      variant={isFollowingViewedUser ? "outline" : "gradient"}
                      animation={isFollowingViewedUser ? undefined : "shimmer"}
                      className={cn(
                        "px-5 py-1.5 text-xs sm:text-sm font-bold",
                        isFollowingViewedUser
                          ? "border-zinc-600 text-zinc-200 bg-transparent"
                          : "bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)]",
                      )}
                      disabled={isUpdatingFollow || isBlockedViewedUser}
                      isLoading={isUpdatingFollow}
                      onClick={handleToggleFollow}
                    >
                      {isFollowingViewedUser ? "Unfollow" : "Follow"}
                    </EnhancedButton>

                    <EnhancedButton
                      size="sm"
                      rounded="full"
                      variant={isBlockedViewedUser ? "outline" : "gradient"}
                      animation={isBlockedViewedUser ? undefined : "shimmer"}
                      className={cn(
                        "px-5 py-1.5 text-xs sm:text-sm font-bold",
                        isBlockedViewedUser
                          ? "border-red-600 text-red-300 hover:bg-red-600/10"
                          : "bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white shadow-[0_0_16px_0_rgba(255,0,0,0.45)]",
                      )}
                      disabled={isUpdatingBlock}
                      isLoading={isUpdatingBlock}
                      onClick={handleToggleBlock}
                    >
                      {isBlockedViewedUser ? "Unblock" : "Block"}
                    </EnhancedButton>
                  </>
                )}
              </div>
            </div>
            {/* Stats Row */}
            <div className="flex gap-6 sm:gap-8 mt-5 justify-center">
              <div className="text-center">
                <span className="font-extrabold text-base sm:text-lg text-white">0</span>
                <div className="text-xs text-zinc-400 font-medium">Posts</div>
              </div>
              <div className="text-center">
                <span className="font-extrabold text-base sm:text-lg text-white">{followers}</span>
                <div className="text-xs text-zinc-400 font-medium">Followers</div>
              </div>
              <div className="text-center">
                <span className="font-extrabold text-base sm:text-lg text-white">{following}</span>
                <div className="text-xs text-zinc-400 font-medium">Following</div>
              </div>
            </div>
            {/* Bio */}
            <div className="mt-5 text-xs sm:text-sm text-zinc-300 max-w-md mx-auto">{bio}</div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-700/50 to-transparent my-3 sm:my-4" />
      {/* Tabs (styled like Instagram) */}
      <Tabs defaultValue="overview" className="w-full max-w-2xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-center bg-transparent h-10 sm:h-12 p-0 border-b border-blue-700/30">
          <TabsTrigger
            value="overview"
            className={cn(
              "flex-1 rounded-none h-full text-sm sm:text-lg font-bold data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-400 transition-all duration-300 px-0 hover:text-blue-400",
              activeTab === "overview" ? "text-white border-b-2 border-blue-400 shadow-[0_4px_8px_0_rgba(59,130,246,0.3)]" : "text-zinc-400 border-b-2 border-transparent",
            )}
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="resume"
            className={cn(
              "flex-1 rounded-none h-full text-sm sm:text-lg font-bold data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-fuchsia-400 transition-all duration-300 px-0 hover:text-fuchsia-400",
              activeTab === "resume" ? "text-white border-b-2 border-fuchsia-400 shadow-[0_4px_8px_0_rgba(217,70,239,0.3)]" : "text-zinc-400 border-b-2 border-transparent",
            )}
          >
            Resume
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0 px-3 py-6 max-w-2xl mx-auto">
          {/* Posts Grid */}
          <div className="grid grid-cols-3 gap-1 md:gap-4 max-w-2xl mx-auto">
            {[1,2,3,4,5,6,7,8,9].map((i) => (
              <div key={i} className="aspect-square bg-zinc-800/80 border border-blue-700/30 rounded-sm flex items-center justify-center">
                <span className="text-zinc-500 text-3xl font-extrabold">+</span>
              </div>
            ))}
          </div>
          
          {/* Recent Achievements */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <motion.h2 className="text-sm font-semibold flex items-center" variants={itemVariants}>
                <Award className="h-4 w-4 mr-2 text-blue-400" />
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">Recent Achievements</span>
              </motion.h2>
            </div>
            <div className="text-center py-8 bg-zinc-900/40 rounded-xl border border-zinc-800">
              <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No achievements yet. Start your journey!</p>
            </div>
          </motion.div>
        </TabsContent>

        {/* Resume Tab - LinkedIn Style */}
        <TabsContent value="resume" className="mt-0 px-3 py-4 space-y-6 max-w-2xl mx-auto">
          {/* Locked State - Show if profile not set up */}
          {!isProfileSetup && (
            <motion.div 
              variants={containerVariants} 
              initial="hidden" 
              animate="visible"
              className="flex flex-col items-center justify-center py-16 px-4"
            >
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-zinc-600" />
                </div>
                <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                  <X className="h-5 w-5 text-zinc-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Profile Setup Required</h3>
              <p className="text-sm text-zinc-400 mb-6 text-center max-w-md">
                {isViewingOwnProfile
                  ? "Upload and parse your CV to unlock your resume section and showcase your professional experience."
                  : "This user hasn't set up their profile yet."}
              </p>
              {isViewingOwnProfile && (
                <EnhancedButton
                  variant="gradient"
                  rounded="full"
                  animation="shimmer"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] text-sm px-6 py-2.5 font-bold"
                  onClick={() => router.push("/profile/cv-upload")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Setup Profile
                </EnhancedButton>
              )}
            </motion.div>
          )}

          {/* Resume Content - Only show if profile is set up */}
          {isProfileSetup && (
            <>
              {/* About/Summary Section (LinkedIn-style) */}
              {resumeBasics.summary && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-3 text-white" variants={itemVariants}>
                About
              </motion.h2>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                <EnhancedCardContent className="p-4">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{resumeBasics.summary}</p>
                </EnhancedCardContent>
              </EnhancedCard>
            </motion.div>
          )}

          {/* Experience Section - LinkedIn Style */}
          {resumeExperience.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Experience
              </motion.h2>
              <div className="space-y-4">
                {resumeExperience.map((exp: any, index: number) => {
                  const isCurrent = exp.is_current === true || exp.end_date === null || exp.end_date === undefined
                  return (
                    <EnhancedCard key={index} variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                      <EnhancedCardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                              <Briefcase className="h-5 w-5 text-purple-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                {exp.title && (
                                  <h3 className="font-bold text-white text-sm leading-tight">{exp.title}</h3>
                                )}
                                {exp.company && (
                                  <p className="text-xs text-zinc-300 mt-0.5 font-medium">{exp.company}</p>
                                )}
                                {exp.employment_type && (
                                  <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">{exp.employment_type}</p>
                                )}
                              </div>
                              {isCurrent && (
                                <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800 text-[10px] px-2 py-0.5">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-2">
                              {(exp.start_date || exp.end_date || isCurrent) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {exp.start_date || "N/A"} - {isCurrent ? "Present" : exp.end_date || "N/A"}
                                  </span>
                                </div>
                              )}
                              {exp.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{exp.location}</span>
                                </div>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-xs text-zinc-300 mt-3 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            )}
                            {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-zinc-400 mt-3 space-y-1.5 ml-2">
                                {exp.achievements.map((ach: string, i: number) => (
                                  <li key={i} className="leading-relaxed">{ach}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Education Section - LinkedIn Style */}
          {resumeEducation.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Education
              </motion.h2>
              <div className="space-y-4">
                {resumeEducation.map((edu: any, index: number) => {
                  const isCurrent = edu.end_date === null || edu.end_date === undefined
                  return (
                    <EnhancedCard key={index} variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                      <EnhancedCardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                              <GraduationCap className="h-5 w-5 text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1">
                                {edu.school && (
                                  <h3 className="font-bold text-white text-sm leading-tight">{edu.school}</h3>
                                )}
                                {edu.degree && (
                                  <p className="text-xs text-zinc-300 mt-0.5 font-medium">{edu.degree}</p>
                                )}
                                {edu.field_of_study && (
                                  <p className="text-[11px] text-zinc-400 mt-0.5">{edu.field_of_study}</p>
                                )}
                              </div>
                              {isCurrent && (
                                <Badge className="bg-emerald-900/50 text-emerald-300 border-emerald-800 text-[10px] px-2 py-0.5">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-2">
                              {(edu.start_date || edu.end_date || isCurrent) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {edu.start_date || "N/A"} - {isCurrent ? "Present" : edu.end_date || "N/A"}
                                  </span>
                                </div>
                              )}
                              {edu.grade && (
                                <span className="text-zinc-300 font-medium">Grade: {edu.grade}</span>
                              )}
                            </div>
                            {edu.description && (
                              <p className="text-xs text-zinc-300 mt-3 leading-relaxed whitespace-pre-wrap">{edu.description}</p>
                            )}
                            {edu.activities && (
                              <p className="text-xs text-zinc-400 mt-2 italic">{edu.activities}</p>
                            )}
                          </div>
                        </div>
                      </EnhancedCardContent>
                    </EnhancedCard>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Skills Section - LinkedIn Style */}
          {resumeSkills.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Skills
              </motion.h2>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                <EnhancedCardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {resumeSkills.map((skill: string, index: number) => (
                      <Badge
                        key={index}
                        className="bg-blue-900/50 text-blue-300 border-blue-800 text-xs px-3 py-1.5 hover:bg-blue-900/70 transition-colors cursor-default"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </motion.div>
          )}

          {/* Projects Section - LinkedIn Style */}
          {resumeProjects.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Projects
              </motion.h2>
              <div className="space-y-4">
                {resumeProjects.map((proj: any, index: number) => (
                  <EnhancedCard key={index} variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                    <EnhancedCardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {proj.name && (
                            <h3 className="font-bold text-white text-sm leading-tight">{proj.name}</h3>
                          )}
                        </div>
                        {proj.url && (
                          <a 
                            href={proj.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                          >
                            <span>View</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-zinc-300 mt-2 leading-relaxed whitespace-pre-wrap">{proj.description}</p>
                      )}
                      {proj.tech && Array.isArray(proj.tech) && proj.tech.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {proj.tech.map((tech: string, i: number) => (
                            <Badge key={i} className="bg-green-900/50 text-green-300 border-green-800 text-[10px] px-2 py-0.5">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </EnhancedCardContent>
                  </EnhancedCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certifications Section - LinkedIn Style */}
          {resumeCertifications.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Licenses & Certifications
              </motion.h2>
              <div className="space-y-3">
                {resumeCertifications.map((cert: any, index: number) => (
                  <EnhancedCard key={index} variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                    <EnhancedCardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                            <Award className="h-5 w-5 text-yellow-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {cert.name && (
                            <h3 className="font-bold text-white text-sm leading-tight">{cert.name}</h3>
                          )}
                          {cert.issuer && (
                            <p className="text-xs text-zinc-300 mt-0.5">{cert.issuer}</p>
                          )}
                          {cert.date && (
                            <p className="text-[11px] text-zinc-400 mt-1">Issued {cert.date}</p>
                          )}
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                ))}
              </div>
            </motion.div>
          )}

          {/* Languages Section - LinkedIn Style */}
          {resumeLanguages.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-base font-bold mb-4 text-white" variants={itemVariants}>
                Languages
              </motion.h2>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-zinc-800 shadow-lg rounded-xl">
                <EnhancedCardContent className="p-4">
                  <div className="space-y-3">
                    {resumeLanguages.map((lang: any, index: number) => {
                      const langName = lang.language || lang.name || lang
                      const fluency = lang.fluency || lang.proficiency
                      return (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                          <span className="text-sm font-medium text-white">{langName}</span>
                          {fluency && (
                            <span className="text-xs text-zinc-400 capitalize">{fluency}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </motion.div>
          )}

            </>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  )
}

