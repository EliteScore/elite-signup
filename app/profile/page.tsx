"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  User,
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

const API_BASE_URL = "https://elitescore-auth-fafc42d40d58.herokuapp.com/"

type ProfileData = {
  userId: number
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  resume: any | null
  followersCount: number | null
  followingCount: number | null
  visibility: "PUBLIC" | "PRIVATE"
  createdAt: string | null
  updatedAt: string | null
}

export default function ProfilePage() {
  const isAuthorized = useRequireAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  // Fetch username from /v1/auth/me
  useEffect(() => {
    if (!isAuthorized) {
      console.log("[Profile] Not authorized, skipping username fetch")
      return
    }

    async function fetchUsername() {
      try {
        console.log("[Profile] ===== Starting username fetch =====")
        
        const token =
          localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

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
          const fallbackUsername = 
            localStorage.getItem("auth.username") || 
            sessionStorage.getItem("auth.username")
          
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
  }, [isAuthorized])

  // Fetch profile data on mount
  useEffect(() => {
    if (!isAuthorized) return

    async function fetchProfile() {
      try {
        const token =
          localStorage.getItem("auth.accessToken") || sessionStorage.getItem("auth.accessToken")

        if (!token) {
          setProfileError("no_auth")
          setIsLoadingProfile(false)
          return
        }

        console.log("[Profile] Fetching profile data...")

        const response = await fetch(`${API_BASE_URL}v1/users/profile/get_own_profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("[Profile] Response status:", response.status)

        if (response.status === 401 || response.status === 404) {
          console.log("[Profile] No profile found (401/404)")
          setProfileError("no_profile")
          setIsLoadingProfile(false)
          return
        }

        if (!response.ok) {
          console.error("[Profile] Failed to fetch profile:", response.status)
          setProfileError("fetch_error")
          setIsLoadingProfile(false)
          return
        }

        const result = await response.json()
        console.log("[Profile] API response:", result)

        // Some endpoints respond with { success, data }, others return the profile directly.
        const possibleProfile = result && typeof result === "object"
          ? (result.data && typeof result.data === "object" ? result.data : result)
          : null

        console.log("[Profile] Extracted profile:", possibleProfile)

        if (possibleProfile && possibleProfile.userId) {
          console.log("[Profile] Profile loaded successfully")
          setProfileData(possibleProfile)
          setProfileError(null)
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
  }, [isAuthorized])

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
  const displayUsername = username || 
    localStorage.getItem("auth.username") || 
    sessionStorage.getItem("auth.username") || 
    localStorage.getItem("auth.email")?.split("@")[0] ||
    "user"
  const bio = profileData.bio || "No bio added yet"
  const followers = profileData.followersCount || 0
  const following = profileData.followingCount || 0

  // Get user-specific profile picture
  const userId = profileData.userId
  const profilePictureKey = userId ? `profile.picture.${userId}` : "profile.picture.default"
  const profilePicture = typeof window !== "undefined" ? localStorage.getItem(profilePictureKey) : null

  // Extract resume data
  const resume = profileData.resume || {}
  const resumeSkills = Array.isArray(resume.skills) ? resume.skills : []
  const resumeCompany = resume.company || null
  const resumeRole = resume.currentRole || null
  const resumeSummary = resume.summary || null

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

  return (
    <AppShell
      title="Profile"
      showBackButton={true}
      backUrl="/home"
      rightElement={
        <EnhancedButton
          variant="ghost"
          size="icon"
          rounded="full"
          className="hover:bg-zinc-800 h-8 w-8"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-4 w-4" />
        </EnhancedButton>
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
              <span className="text-zinc-400 text-sm sm:text-base font-medium">@{displayUsername}</span>
              
              {/* Quick Stats: Resume Score + Level */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
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

        {/* Resume Tab */}
        <TabsContent value="resume" className="mt-0 px-3 py-4 space-y-4 max-w-2xl mx-auto">
          {/* Professional Info */}
          {(resumeRole || resumeCompany || resumeSummary) && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-sm font-semibold mb-3 flex items-center" variants={itemVariants}>
                <Briefcase className="h-4 w-4 mr-2 text-purple-400" />
                <span className="bg-gradient-to-r from-[#a259ff] to-[#d946ef] bg-clip-text text-transparent font-extrabold">
                  Professional Info
                </span>
              </motion.h2>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-purple-700/40 shadow-[0_0_16px_0_rgba(147,51,234,0.3)] rounded-xl">
                <EnhancedCardContent className="p-3">
                  {resumeRole && (
                    <div className="mb-2">
                      <h3 className="font-bold text-white text-xs">{resumeRole}</h3>
                      {resumeCompany && <p className="text-[10px] text-zinc-300 mt-0.5">{resumeCompany}</p>}
                    </div>
                  )}
                  {resumeSummary && <p className="text-[10px] text-zinc-300 mt-2">{resumeSummary}</p>}
                </EnhancedCardContent>
              </EnhancedCard>
            </motion.div>
          )}

          {/* Skills */}
          {resumeSkills.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              <motion.h2 className="text-sm font-semibold mb-3 flex items-center" variants={itemVariants}>
                <Star className="h-4 w-4 mr-2 text-blue-400" />
                <span className="bg-gradient-to-r from-[#2bbcff] to-[#a259ff] bg-clip-text text-transparent font-extrabold">
                  Skills
                </span>
              </motion.h2>
              <EnhancedCard variant="default" hover="lift" className="bg-zinc-900/80 border border-blue-700/40 shadow-[0_0_16px_0_rgba(80,0,255,0.3)] rounded-xl">
                <EnhancedCardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {resumeSkills.map((skill: string, index: number) => (
                      <Badge
                        key={index}
                        className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </EnhancedCardContent>
              </EnhancedCard>
            </motion.div>
          )}

          {/* Empty state if no resume data */}
          {!resumeRole && !resumeCompany && !resumeSummary && resumeSkills.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-400 mb-2">No Resume Data</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Add your professional information in settings
              </p>
              <EnhancedButton
                variant="gradient"
                rounded="full"
                animation="shimmer"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500 shadow-[0_0_16px_0_rgba(80,0,255,0.4)] text-xs px-5 py-2"
                onClick={() => router.push("/settings")}
              >
                Add Resume Info
              </EnhancedButton>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  )
}

